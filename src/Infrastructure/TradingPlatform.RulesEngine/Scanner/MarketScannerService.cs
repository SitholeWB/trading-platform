using System.Diagnostics;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using TradingPlatform.Application.Interfaces;
using TradingPlatform.Broker.Abstractions;
using TradingPlatform.Domain.Entities;
using TradingPlatform.Domain.Enums;
using TradingPlatform.Domain.Models;

namespace TradingPlatform.RulesEngine.Scanner;

public class MarketScannerService : IMarketScannerService
{
    private readonly IHistoricalDataProvider _historicalDataProvider;
    private readonly IIndicatorCalculationService _indicatorService;
    private readonly IRulesEngineService _rulesEngine;
    private readonly ISymbolGroupRepository _symbolGroupRepo;
    private readonly IStrategyRepository _strategyRepo;
    private readonly ILogger<MarketScannerService> _logger;

    public MarketScannerService(
        IHistoricalDataProvider historicalDataProvider,
        IIndicatorCalculationService indicatorService,
        IRulesEngineService rulesEngine,
        ISymbolGroupRepository symbolGroupRepo,
        IStrategyRepository strategyRepo,
        ILogger<MarketScannerService> logger)
    {
        _historicalDataProvider = historicalDataProvider;
        _indicatorService = indicatorService;
        _rulesEngine = rulesEngine;
        _symbolGroupRepo = symbolGroupRepo;
        _strategyRepo = strategyRepo;
        _logger = logger;
    }

    public async Task<LiveScanReport> RunLiveScanAsync(LiveScanRequest request, CancellationToken ct = default)
    {
        var sw = Stopwatch.StartNew();
        _logger.LogInformation("[MARKET SCANNER] Starting Live Scan for Group='{Group}' Symbols={Count} Timeframe={Tf}",
            request.SymbolGroupId, request.Symbols?.Count ?? 0, request.Timeframe);

        var (groupId, groupName, symbols) = await ResolveSymbolsAsync(request.SymbolGroupId, request.Symbols, ct);
        var strategies = await ResolveStrategiesAsync(request.StrategyId, request.Timeframe, ct);

        var verifiedMatches = new List<ScannerMatchResult>();
        var nearMisses = new List<ScannerMatchResult>();
        int scannedCount = 0;

        var parallelOptions = new ParallelOptions
        {
            MaxDegreeOfParallelism = 4,
            CancellationToken = ct
        };

        var syncLock = new object();

        var parsedTf = Enum.TryParse<Timeframe>(request.Timeframe, true, out var tf) ? tf : Timeframe.M5;
        var barDuration = GetTimeframeDuration(parsedTf);
        var now = DateTime.UtcNow;

        await Parallel.ForEachAsync(symbols, parallelOptions, async (symbol, token) =>
        {
            try
            {
                var candles = await _historicalDataProvider.GetHistoricalCandlesAsync(symbol, request.Timeframe, 120, token);
                if (candles == null || candles.Count < 25)
                {
                    _logger.LogWarning("[MARKET SCANNER] Insufficient candle history for {Symbol} ({Count} bars)", symbol, candles?.Count ?? 0);
                    return;
                }

                // Closed-candle invariant: evaluate completed closed bars only.
                // If the provider returned an actively forming bar (where Timestamp + Duration > Now), strip it.
                var closedCandles = candles.Where(c => c.IsComplete).ToList();
                if (closedCandles.Count < 25)
                {
                    closedCandles = candles.Where(c => c.Timestamp + barDuration <= now).ToList();
                }
                if (closedCandles.Count < 25)
                {
                    closedCandles = candles.Take(candles.Count > 1 ? candles.Count - 1 : candles.Count).ToList();
                }

                if (closedCandles.Count < 25)
                {
                    _logger.LogWarning("[MARKET SCANNER] Insufficient closed candles for {Symbol} ({Count} bars)", symbol, closedCandles.Count);
                    return;
                }

                Interlocked.Increment(ref scannedCount);

                var snapshot = _indicatorService.CalculateSnapshot(closedCandles);
                var signals = await _rulesEngine.EvaluateAsync(snapshot, strategies, token);

                foreach (var signal in signals)
                {
                    decimal matchPercentage = signal.State == SignalState.FullyMet
                        ? 100m
                        : Math.Round((signal.RuleDetails.FirstOrDefault()?.NearMissScore ?? 0.70m) * 100m, 1);

                    var passedConditions = ExtractPassedConditions(signal);
                    var failedConditions = signal.RuleDetails
                        .Select(f => $"{f.RuleName}: {f.FailureReason}")
                        .ToList();

                    var match = new ScannerMatchResult(
                        symbol,
                        signal.StrategyName,
                        signal.StrategyId,
                        request.Timeframe,
                        signal.State.ToString(),
                        matchPercentage,
                        signal.RecommendedOrderType,
                        signal.EntryPrice,
                        signal.StopLoss,
                        signal.TakeProfit,
                        snapshot.Timestamp,
                        passedConditions,
                        failedConditions,
                        signal.EvaluationDetailsJson
                    );

                    lock (syncLock)
                    {
                        if (signal.State == SignalState.FullyMet)
                        {
                            verifiedMatches.Add(match);
                        }
                        else if (signal.State == SignalState.NearMiss)
                        {
                            nearMisses.Add(match);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[MARKET SCANNER] Error scanning symbol {Symbol}", symbol);
            }
        });

        sw.Stop();

        _logger.LogInformation("[MARKET SCANNER] Live Scan completed in {Elapsed}ms. Scanned={Scanned}, Verified={Verified}, NearMiss={NearMiss}",
            sw.ElapsedMilliseconds, scannedCount, verifiedMatches.Count, nearMisses.Count);

        return new LiveScanReport(
            groupId,
            groupName,
            request.Timeframe,
            DateTime.UtcNow,
            scannedCount,
            verifiedMatches
                .OrderByDescending(m => m.MatchPercentage)
                .ThenBy(m => m.Symbol)
                .ThenBy(m => m.StrategyName)
                .ToList(),
            nearMisses
                .OrderByDescending(m => m.MatchPercentage)
                .ThenBy(m => m.Symbol)
                .ThenBy(m => m.StrategyName)
                .ToList(),
            sw.ElapsedMilliseconds
        );
    }

    public async Task<HistoricalScanReport> RunHistoricalScanAsync(HistoricalScanRequest request, CancellationToken ct = default)
    {
        var sw = Stopwatch.StartNew();
        _logger.LogInformation("[MARKET SCANNER] Starting Historical Scan StrategyId={StrategyId} Bars={Bars} Timeframe={Tf}",
            request.StrategyId, request.BarCount, request.Timeframe);

        var strategy = await _strategyRepo.GetByIdAsync(request.StrategyId, ct);
        if (strategy == null)
        {
            var all = await _strategyRepo.GetAllAsync(ct);
            strategy = all.FirstOrDefault();
            if (strategy == null)
            {
                throw new InvalidOperationException("No strategies found to execute historical scanner.");
            }
        }

        var (groupId, groupName, symbols) = await ResolveSymbolsAsync(request.SymbolGroupId, request.Symbols, ct);
        int barCount = Math.Clamp(request.BarCount, 50, 500);

        var historicalMatches = new List<ScannerMatchResult>();
        var simulatedTrades = new List<HistoricalTradeSimulation>();
        DateTime periodStart = DateTime.UtcNow;
        DateTime periodEnd = DateTime.MinValue;

        int totalBarsAnalyzed = 0;

        foreach (var symbol in symbols)
        {
            if (ct.IsCancellationRequested) break;

            try
            {
                // Fetch candles with extra warm-up buffer for technical indicators
                var candles = await _historicalDataProvider.GetHistoricalCandlesAsync(symbol, request.Timeframe, barCount + 40, ct);
                if (candles == null || candles.Count < 35)
                {
                    continue;
                }

                if (candles[0].Timestamp < periodStart) periodStart = candles[0].Timestamp;
                if (candles[^1].Timestamp > periodEnd) periodEnd = candles[^1].Timestamp;

                int warmup = 30;
                int symbolBars = candles.Count - warmup;
                totalBarsAnalyzed += symbolBars;

                DateTime lastTradeExitTime = DateTime.MinValue;

                // Slide forward bar-by-bar to simulate historical closed-bar evaluations
                for (int i = warmup; i < candles.Count; i++)
                {
                    var window = candles.Take(i + 1).TakeLast(80).ToList();
                    var snapshot = _indicatorService.CalculateSnapshot(window);
                    var signals = await _rulesEngine.EvaluateAsync(snapshot, new[] { strategy }, ct);
                    if (signals == null) continue;

                    foreach (var signal in signals)
                    {
                        decimal matchPercentage = signal.State == SignalState.FullyMet
                            ? 100m
                            : Math.Round((signal.RuleDetails.FirstOrDefault()?.NearMissScore ?? 0.70m) * 100m, 1);

                        var match = new ScannerMatchResult(
                            symbol,
                            strategy.Name,
                            strategy.Id,
                            request.Timeframe,
                            signal.State.ToString(),
                            matchPercentage,
                            signal.RecommendedOrderType,
                            signal.EntryPrice,
                            signal.StopLoss,
                            signal.TakeProfit,
                            snapshot.Timestamp,
                            signal.State == SignalState.FullyMet ? new[] { "All strategy rule conditions met" } : ExtractPassedConditions(signal),
                            signal.RuleDetails.Select(f => $"{f.RuleName}: {f.FailureReason}").ToList(),
                            signal.EvaluationDetailsJson
                        );

                        historicalMatches.Add(match);

                        // Simulate trade execution only on 100% FullyMet verified matches
                        if (signal.State == SignalState.FullyMet && snapshot.Timestamp >= lastTradeExitTime)
                        {
                            var trade = SimulateTradeResolution(symbol, signal, snapshot.Timestamp, candles, i);
                            simulatedTrades.Add(trade);
                            if (trade.ExitTime.HasValue)
                            {
                                lastTradeExitTime = trade.ExitTime.Value;
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[MARKET SCANNER] Error in historical scan for {Symbol}", symbol);
            }
        }

        // Metrics aggregation
        int totalSignals = historicalMatches.Count;
        int verifiedCount = historicalMatches.Count(m => m.State == "FullyMet");
        int nearMissCount = historicalMatches.Count(m => m.State == "NearMiss");
        int simCount = simulatedTrades.Count;
        int winningCount = simulatedTrades.Count(t => t.Outcome == "Win");
        int losingCount = simulatedTrades.Count(t => t.Outcome == "Loss");

        var closedTrades = simulatedTrades.Where(t => t.Outcome != "Open").ToList();
        decimal winRate = closedTrades.Count > 0
            ? Math.Round((decimal)winningCount / closedTrades.Count * 100m, 1)
            : 0m;

        decimal totalPips = Math.Round(simulatedTrades.Sum(t => t.ProfitLossPips), 1);
        decimal grossProfit = simulatedTrades.Where(t => t.ProfitLossPips > 0).Sum(t => t.ProfitLossPips);
        decimal grossLoss = Math.Abs(simulatedTrades.Where(t => t.ProfitLossPips < 0).Sum(t => t.ProfitLossPips));
        decimal profitFactor = grossLoss > 0
            ? Math.Round(grossProfit / grossLoss, 2)
            : (grossProfit > 0 ? 99.99m : 1.0m);

        decimal maxDrawdownPips = CalculateMaxDrawdown(simulatedTrades);

        sw.Stop();

        _logger.LogInformation("[MARKET SCANNER] Historical Scan complete in {Elapsed}ms. Signals={Signals}, WinRate={WinRate:F1}%, PnL={PnL} pips",
            sw.ElapsedMilliseconds, totalSignals, winRate, totalPips);

        return new HistoricalScanReport(
            strategy.Id,
            strategy.Name,
            groupName,
            request.Timeframe,
            totalBarsAnalyzed,
            periodStart,
            periodEnd,
            totalSignals,
            verifiedCount,
            nearMissCount,
            simCount,
            winningCount,
            losingCount,
            winRate,
            totalPips,
            profitFactor,
            maxDrawdownPips,
            simulatedTrades.OrderBy(t => t.EntryTime).ToList(),
            historicalMatches
                .OrderByDescending(m => m.CandleTimestamp)
                .ThenByDescending(m => m.MatchPercentage)
                .ThenBy(m => m.Symbol)
                .ThenBy(m => m.StrategyName)
                .ToList(),
            sw.ElapsedMilliseconds
        );
    }

    private HistoricalTradeSimulation SimulateTradeResolution(
        string symbol,
        SignalResult signal,
        DateTime entryTime,
        IReadOnlyList<Candle> candles,
        int entryIndex)
    {
        decimal entry = signal.EntryPrice;
        decimal sl = signal.StopLoss ?? (signal.RecommendedOrderType == OrderType.Buy ? entry * 0.995m : entry * 1.005m);
        decimal tp = signal.TakeProfit ?? (signal.RecommendedOrderType == OrderType.Buy ? entry * 1.01m : entry * 0.99m);

        DateTime? exitTime = null;
        decimal? exitPrice = null;
        string outcome = "Open";

        for (int k = entryIndex + 1; k < candles.Count; k++)
        {
            var futureBar = candles[k];
            if (signal.RecommendedOrderType == OrderType.Buy)
            {
                bool hitTp = futureBar.High >= tp;
                bool hitSl = futureBar.Low <= sl;

                if (hitTp && hitSl)
                {
                    // Conservative outcome on double-hit candle
                    outcome = "Loss";
                    exitPrice = sl;
                    exitTime = futureBar.Timestamp;
                    break;
                }
                else if (hitTp)
                {
                    outcome = "Win";
                    exitPrice = tp;
                    exitTime = futureBar.Timestamp;
                    break;
                }
                else if (hitSl)
                {
                    outcome = "Loss";
                    exitPrice = sl;
                    exitTime = futureBar.Timestamp;
                    break;
                }
            }
            else // Sell
            {
                bool hitTp = futureBar.Low <= tp;
                bool hitSl = futureBar.High >= sl;

                if (hitTp && hitSl)
                {
                    outcome = "Loss";
                    exitPrice = sl;
                    exitTime = futureBar.Timestamp;
                    break;
                }
                else if (hitTp)
                {
                    outcome = "Win";
                    exitPrice = tp;
                    exitTime = futureBar.Timestamp;
                    break;
                }
                else if (hitSl)
                {
                    outcome = "Loss";
                    exitPrice = sl;
                    exitTime = futureBar.Timestamp;
                    break;
                }
            }
        }

        if (outcome == "Open")
        {
            exitPrice = candles[^1].Close;
            exitTime = candles[^1].Timestamp;
        }

        decimal pipMult = GetPipMultiplier(symbol);
        decimal rawDiff = (signal.RecommendedOrderType == OrderType.Buy)
            ? (exitPrice!.Value - entry)
            : (entry - exitPrice!.Value);
        decimal pips = Math.Round(rawDiff * pipMult, 1);
        decimal plAmount = Math.Round(pips * 10m, 2); // Assuming $10 per pip standard lot baseline

        return new HistoricalTradeSimulation(
            symbol,
            signal.RecommendedOrderType,
            entry,
            sl,
            tp,
            entryTime,
            exitTime,
            exitPrice,
            outcome,
            pips,
            plAmount
        );
    }

    private static decimal CalculateMaxDrawdown(IReadOnlyList<HistoricalTradeSimulation> trades)
    {
        if (trades.Count == 0) return 0m;

        decimal cumulativePips = 0m;
        decimal peak = 0m;
        decimal maxDrawdown = 0m;

        foreach (var trade in trades.OrderBy(t => t.EntryTime))
        {
            cumulativePips += trade.ProfitLossPips;
            if (cumulativePips > peak)
            {
                peak = cumulativePips;
            }
            decimal drawdown = peak - cumulativePips;
            if (drawdown > maxDrawdown)
            {
                maxDrawdown = drawdown;
            }
        }

        return Math.Round(maxDrawdown, 1);
    }

    private static decimal GetPipMultiplier(string symbol)
    {
        var s = symbol.ToUpperInvariant();
        if (s.Contains("JPY")) return 100m;
        if (s.Contains("XAU") || s.Contains("GOLD")) return 10m;
        if (s.Contains("BTC") || s.Contains("ETH") || s.Contains("SOL") || s.Contains("USDT")) return 1m;
        if (s.Length == 6 || s.Contains('/')) return 10000m; // Forex pairs
        return 1m; // Stocks, indices, commodities
    }

    private static IReadOnlyList<string> ExtractPassedConditions(SignalResult signal)
    {
        if (signal.State == SignalState.FullyMet)
        {
            return new[] { "All strategy rule conditions fully satisfied (100% Match)" };
        }

        try
        {
            if (!string.IsNullOrEmpty(signal.EvaluationDetailsJson))
            {
                using var doc = JsonDocument.Parse(signal.EvaluationDetailsJson);
                var root = doc.RootElement;
                if (root.TryGetProperty("PassedRules", out var passed) && root.TryGetProperty("TotalRules", out var total))
                {
                    return new[] { $"Satisfied {passed.GetInt32()} of {total.GetInt32()} rule conditions" };
                }
            }
        }
        catch
        {
            // fallback
        }

        return new[] { "Satisfied multiple technical entry criteria" };
    }

    private async Task<(string GroupId, string GroupName, IReadOnlyList<string> Symbols)> ResolveSymbolsAsync(
        string? groupId,
        IReadOnlyList<string>? symbols,
        CancellationToken ct)
    {
        if (symbols != null && symbols.Count > 0)
        {
            return (groupId ?? "custom", "Custom Symbols Basket", symbols.Distinct().OrderBy(s => s).ToList());
        }

        if (!string.IsNullOrWhiteSpace(groupId))
        {
            var group = await _symbolGroupRepo.GetByIdAsync(groupId, ct);
            if (group != null && group.Symbols.Count > 0)
            {
                return (group.Id, group.Name, group.Symbols.Distinct().OrderBy(s => s).ToList());
            }
        }

        var allGroups = await _symbolGroupRepo.GetAllAsync(ct);
        var defaultGroup = allGroups.FirstOrDefault();
        if (defaultGroup != null && defaultGroup.Symbols.Count > 0)
        {
            return (defaultGroup.Id, defaultGroup.Name, defaultGroup.Symbols.Distinct().OrderBy(s => s).ToList());
        }

        return ("default-fx", "Forex Majors", new[] { "AUDUSD", "EURUSD", "GBPUSD", "USDCAD", "USDJPY" });
    }

    private async Task<IReadOnlyList<StrategyDefinition>> ResolveStrategiesAsync(
        Guid? strategyId,
        string timeframe,
        CancellationToken ct)
    {
        if (strategyId.HasValue && strategyId.Value != Guid.Empty)
        {
            var s = await _strategyRepo.GetByIdAsync(strategyId.Value, ct);
            if (s != null)
            {
                return new[] { s };
            }
        }

        var all = await _strategyRepo.GetAllAsync(ct);
        var active = all.Where(s => s.IsActive).OrderBy(s => s.Name).ToList();
        return active.Count > 0 ? active : all.OrderBy(s => s.Name).ToList();
    }

    private static TimeSpan GetTimeframeDuration(Timeframe tf) => tf switch
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
        _ => TimeSpan.FromMinutes(5)
    };
}
