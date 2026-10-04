using System.Collections.Concurrent;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TradingPlatform.Application.Interfaces;
using TradingPlatform.Domain.Entities;
using TradingPlatform.Domain.Enums;
using TradingPlatform.Domain.Models;

namespace TradingPlatform.RulesEngine.Scanner;

public class BackgroundStrategyScannerService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IStrategyNotificationService _notificationService;
    private readonly ILogger<BackgroundStrategyScannerService> _logger;

    private readonly ConcurrentDictionary<Guid, DateTime> _lastScanTimes = new();
    private DateTime _lastReminderSweepUtc = DateTime.UtcNow;

    public BackgroundStrategyScannerService(
        IServiceScopeFactory scopeFactory,
        IStrategyNotificationService notificationService,
        ILogger<BackgroundStrategyScannerService> logger)
    {
        _scopeFactory = scopeFactory;
        _notificationService = notificationService;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("[BACKGROUND SCANNER] Autonomous strategy scanner started with smart timeframe cadence.");

        // Initial brief warm-up delay to allow DB migrations and provider boot
        await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await PerformScheduledScanCycleAsync(stoppingToken);
                PerformReminderSweep();
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[BACKGROUND SCANNER] Unexpected error during scheduled scan cycle.");
            }

            // Sleep 15 seconds before next cadence check (extremely lightweight, zero API calls if not due)
            await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);
        }

        _logger.LogInformation("[BACKGROUND SCANNER] Autonomous strategy scanner stopped.");
    }

    private async Task PerformScheduledScanCycleAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var strategyRepo = scope.ServiceProvider.GetRequiredService<IStrategyRepository>();
        var symbolGroupRepo = scope.ServiceProvider.GetRequiredService<ISymbolGroupRepository>();
        var marketScanner = scope.ServiceProvider.GetRequiredService<IMarketScannerService>();

        var settings = _notificationService.GetSettings();
        if (!settings.IsEnabled)
        {
            _notificationService.UpdateScannerStatus(new BackgroundScannerStatus(
                IsRunning: false,
                ActiveStrategiesCount: 0,
                MonitoredSymbolsCount: 0,
                ActiveAlertsCount: _notificationService.GetActiveAlerts().Count(a => !a.IsAcknowledged),
                LastScanUtc: DateTime.UtcNow,
                NextScanDueUtc: null,
                CadenceSummary: "Background scanning paused by user"));
            return;
        }

        var allStrategies = await strategyRepo.GetAllAsync(ct);
        var activeStrategies = allStrategies.Where(s => s.IsActive).ToList();

        if (activeStrategies.Count == 0)
        {
            _notificationService.UpdateScannerStatus(new BackgroundScannerStatus(
                IsRunning: true,
                ActiveStrategiesCount: 0,
                MonitoredSymbolsCount: 0,
                ActiveAlertsCount: _notificationService.GetActiveAlerts().Count(a => !a.IsAcknowledged),
                LastScanUtc: DateTime.UtcNow,
                NextScanDueUtc: null,
                CadenceSummary: "No active strategies enabled"));
            return;
        }

        // Determine default symbol bucket to scan against
        var allGroups = await symbolGroupRepo.GetAllAsync(ct);
        var defaultGroup = allGroups.FirstOrDefault();
        var targetSymbols = defaultGroup?.Symbols ?? new List<string> { "EURUSD", "GBPUSD", "USDJPY", "BTCUSD", "US500" };

        DateTime? nextOverallScanDue = null;
        DateTime now = DateTime.UtcNow;

        foreach (var strategy in activeStrategies)
        {
            var barDuration = GetTimeframeDuration(strategy.Timeframe);
            bool hasPrev = _lastScanTimes.TryGetValue(strategy.Id, out var lastScanTime);

            // Smart Cadence: only scan when the candle duration has elapsed!
            // E.g., for H4, do not scan until 4 hours have passed since last scan.
            if (hasPrev)
            {
                var timeSinceLast = now - lastScanTime;
                if (timeSinceLast < barDuration)
                {
                    var dueTime = lastScanTime + barDuration;
                    if (!nextOverallScanDue.HasValue || dueTime < nextOverallScanDue.Value)
                    {
                        nextOverallScanDue = dueTime;
                    }
                    continue; // Skip! Not due yet.
                }
            }

            // Strategy is due for a scan
            _lastScanTimes[strategy.Id] = now;
            _logger.LogInformation(
                "[BACKGROUND SCANNER] Strategy '{Name}' ({Timeframe}) is due for bar scan across {Count} symbols.",
                strategy.Name, strategy.Timeframe, targetSymbols.Count);

            try
            {
                var scanRequest = new LiveScanRequest(
                    SymbolGroupId: defaultGroup?.Id,
                    Symbols: targetSymbols,
                    StrategyId: strategy.Id,
                    Timeframe: strategy.Timeframe.ToString());

                var report = await marketScanner.RunLiveScanAsync(scanRequest, ct);

                // Process Verified Matches (100% FullyMet)
                foreach (var match in report.VerifiedMatches)
                {
                    _notificationService.AddAlert(
                        strategyId: strategy.Id,
                        strategyName: strategy.Name,
                        symbol: match.Symbol,
                        timeframe: strategy.Timeframe,
                        lastPrice: match.EntryPrice,
                        state: SignalState.FullyMet,
                        matchScore: (double)match.MatchPercentage,
                        summaryMessage: $"Strategy '{strategy.Name}' met on {match.Symbol} ({strategy.Timeframe}) @ {match.EntryPrice.ToString("F5")}");
                }

                // Process High-Probability Near Misses (>= 85%)
                foreach (var nearMiss in report.NearMisses.Where(nm => nm.MatchPercentage >= 85.0m))
                {
                    _notificationService.AddAlert(
                        strategyId: strategy.Id,
                        strategyName: strategy.Name,
                        symbol: nearMiss.Symbol,
                        timeframe: strategy.Timeframe,
                        lastPrice: nearMiss.EntryPrice,
                        state: SignalState.NearMiss,
                        matchScore: (double)nearMiss.MatchPercentage,
                        summaryMessage: $"Near-miss ({nearMiss.MatchPercentage:F1}%) on {nearMiss.Symbol} ({strategy.Timeframe}) for '{strategy.Name}'");
                }
            }
            catch (Exception ex) when (!ct.IsCancellationRequested)
            {
                _logger.LogWarning(ex, "[BACKGROUND SCANNER] Failed scanning strategy '{Name}'. Will retry on next cycle.", strategy.Name);
            }
        }

        _notificationService.UpdateScannerStatus(new BackgroundScannerStatus(
            IsRunning: true,
            ActiveStrategiesCount: activeStrategies.Count,
            MonitoredSymbolsCount: targetSymbols.Count,
            ActiveAlertsCount: _notificationService.GetActiveAlerts().Count(a => !a.IsAcknowledged),
            LastScanUtc: now,
            NextScanDueUtc: nextOverallScanDue ?? now.AddMinutes(5),
            CadenceSummary: $"{activeStrategies.Count} active strategies monitored with smart bar cadence"));
    }

    private void PerformReminderSweep()
    {
        // Re-notify / increment reminders every 2 minutes for unacknowledged alerts
        if (DateTime.UtcNow - _lastReminderSweepUtc < TimeSpan.FromMinutes(2))
        {
            return;
        }

        _lastReminderSweepUtc = DateTime.UtcNow;
        var unacknowledged = _notificationService.GetActiveAlerts().Where(a => !a.IsAcknowledged).ToList();

        foreach (var alert in unacknowledged)
        {
            if (DateTime.UtcNow - alert.LastRemindedAtUtc >= TimeSpan.FromMinutes(2))
            {
                _notificationService.RecordReminderSent(alert.Id);
                _logger.LogInformation(
                    "[BACKGROUND SCANNER] Unacknowledged Opportunity Reminder #{Count}: Strategy '{Name}' on {Symbol} ({Timeframe})",
                    alert.ReminderCount + 1, alert.StrategyName, alert.Symbol, alert.Timeframe);
            }
        }
    }

    public static TimeSpan GetTimeframeDuration(Timeframe tf) => tf switch
    {
        Timeframe.M1 => TimeSpan.FromMinutes(1),
        Timeframe.M5 => TimeSpan.FromMinutes(5),
        Timeframe.M15 => TimeSpan.FromMinutes(15),
        Timeframe.M30 => TimeSpan.FromMinutes(30),
        Timeframe.H1 => TimeSpan.FromHours(1),
        Timeframe.H4 => TimeSpan.FromHours(4),
        Timeframe.D1 => TimeSpan.FromDays(1),
        Timeframe.W1 => TimeSpan.FromDays(7),
        Timeframe.MN1 => TimeSpan.FromDays(30),
        _ => TimeSpan.FromHours(1)
    };
}
