using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;
using TradingPlatform.Application.Interfaces;
using TradingPlatform.Domain.Enums;

namespace TradingPlatform.RulesEngine.Notifications;

public class StrategyNotificationService : IStrategyNotificationService
{
    private readonly ConcurrentDictionary<Guid, StrategyAlertNotification> _alerts = new();
    private readonly ILogger<StrategyNotificationService> _logger;
    private BackgroundScannerStatus _scannerStatus;

    public StrategyNotificationService(ILogger<StrategyNotificationService> logger)
    {
        _logger = logger;
        _scannerStatus = new BackgroundScannerStatus(
            IsRunning: false,
            ActiveStrategiesCount: 0,
            MonitoredSymbolsCount: 0,
            ActiveAlertsCount: 0,
            LastScanUtc: null,
            NextScanDueUtc: null,
            CadenceSummary: "Idle");
    }

    public StrategyAlertNotification AddAlert(
        Guid strategyId,
        string strategyName,
        string symbol,
        Timeframe timeframe,
        decimal lastPrice,
        SignalState state,
        double matchScore,
        string summaryMessage)
    {
        var normalizedSymbol = symbol.Trim().ToUpperInvariant();

        // Check for existing unacknowledged alert for same strategy + symbol + timeframe
        var existing = _alerts.Values.FirstOrDefault(a =>
            a.StrategyId == strategyId &&
            a.Symbol.Equals(normalizedSymbol, StringComparison.OrdinalIgnoreCase) &&
            a.Timeframe == timeframe &&
            !a.IsAcknowledged);

        if (existing != null)
        {
            var updated = existing with
            {
                LastPrice = lastPrice,
                LastRemindedAtUtc = DateTime.UtcNow,
                ReminderCount = existing.ReminderCount + 1,
                SummaryMessage = summaryMessage
            };
            _alerts[existing.Id] = updated;
            _logger.LogInformation(
                "[STRATEGY NOTIFICATION] Re-triggered alert for Strategy '{Name}' on {Symbol} ({Timeframe}) - Reminder #{Count}",
                strategyName, normalizedSymbol, timeframe, updated.ReminderCount);
            return updated;
        }

        var newAlert = new StrategyAlertNotification(
            Id: Guid.NewGuid(),
            StrategyId: strategyId,
            StrategyName: strategyName,
            Symbol: normalizedSymbol,
            Timeframe: timeframe,
            LastPrice: lastPrice,
            State: state,
            MatchScore: matchScore,
            SummaryMessage: summaryMessage,
            CreatedAtUtc: DateTime.UtcNow,
            LastRemindedAtUtc: DateTime.UtcNow,
            ReminderCount: 1,
            IsAcknowledged: false);

        _alerts[newAlert.Id] = newAlert;
        _logger.LogInformation(
            "[STRATEGY NOTIFICATION] New Match Alert generated: Strategy '{Name}' on {Symbol} ({Timeframe}) at {Price}",
            strategyName, normalizedSymbol, timeframe, lastPrice);

        return newAlert;
    }

    public IReadOnlyList<StrategyAlertNotification> GetActiveAlerts()
    {
        return _alerts.Values
            .OrderByDescending(a => a.CreatedAtUtc)
            .ToList();
    }

    public bool AcknowledgeAlert(Guid id)
    {
        if (_alerts.TryGetValue(id, out var alert))
        {
            _alerts[id] = alert with { IsAcknowledged = true };
            _logger.LogInformation("[STRATEGY NOTIFICATION] Alert {Id} for {Symbol} acknowledged by user.", id, alert.Symbol);
            return true;
        }
        return false;
    }

    public bool DismissAlert(Guid id)
    {
        var removed = _alerts.TryRemove(id, out var alert);
        if (removed && alert != null)
        {
            _logger.LogInformation("[STRATEGY NOTIFICATION] Alert {Id} for {Symbol} dismissed.", id, alert.Symbol);
        }
        return removed;
    }

    public void ClearAllAlerts()
    {
        _alerts.Clear();
        _logger.LogInformation("[STRATEGY NOTIFICATION] All alerts cleared.");
    }

    public void RecordReminderSent(Guid id)
    {
        if (_alerts.TryGetValue(id, out var alert))
        {
            _alerts[id] = alert with
            {
                LastRemindedAtUtc = DateTime.UtcNow,
                ReminderCount = alert.ReminderCount + 1
            };
        }
    }

    public BackgroundScannerStatus GetScannerStatus()
    {
        return _scannerStatus with { ActiveAlertsCount = _alerts.Values.Count(a => !a.IsAcknowledged) };
    }

    public void UpdateScannerStatus(BackgroundScannerStatus status)
    {
        _scannerStatus = status with { ActiveAlertsCount = _alerts.Values.Count(a => !a.IsAcknowledged) };
    }

    private BackgroundScannerSettings _settings = new(
        IsEnabled: true,
        NotifyOnMatches: true,
        NotifyOnNearMisses: true,
        ReminderIntervalMinutes: 2);

    public BackgroundScannerSettings GetSettings() => _settings;

    public void UpdateSettings(BackgroundScannerSettings settings)
    {
        _settings = settings;
        _logger.LogInformation("[STRATEGY NOTIFICATION] Background scanner settings updated: IsEnabled={Enabled}", settings.IsEnabled);
    }
}
