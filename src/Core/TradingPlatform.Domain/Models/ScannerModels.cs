namespace TradingPlatform.Domain;

public record ScannerMatchResult(
    string Symbol,
    string StrategyName,
    Guid StrategyId,
    string Timeframe,
    string State, // "FullyMet" or "NearMiss"
    decimal MatchPercentage,
    OrderType RecommendedSide,
    decimal EntryPrice,
    decimal? StopLoss,
    decimal? TakeProfit,
    DateTime CandleTimestamp,
    IReadOnlyList<string> PassedConditions,
    IReadOnlyList<string> FailedConditions,
    string? DetailsJson
);

public record LiveScanRequest(
    string? SymbolGroupId,
    IReadOnlyList<string>? Symbols,
    Guid? StrategyId,
    string Timeframe = "M5"
);

public record LiveScanReport(
    string SymbolGroupId,
    string SymbolGroupName,
    string Timeframe,
    DateTime ScannedAtUtc,
    int TotalSymbolsScanned,
    IReadOnlyList<ScannerMatchResult> VerifiedMatches,
    IReadOnlyList<ScannerMatchResult> NearMisses,
    long DurationMs
);

public record HistoricalScanRequest(
    Guid StrategyId,
    string? SymbolGroupId,
    IReadOnlyList<string>? Symbols,
    string Timeframe = "M5",
    int BarCount = 300
);

public record HistoricalTradeSimulation(
    string Symbol,
    OrderType Side,
    decimal EntryPrice,
    decimal StopLoss,
    decimal TakeProfit,
    DateTime EntryTime,
    DateTime? ExitTime,
    decimal? ExitPrice,
    string Outcome, // "Win", "Loss", "Open"
    decimal ProfitLossPips,
    decimal ProfitLossAmount
);

public record HistoricalScanReport(
    Guid StrategyId,
    string StrategyName,
    string SymbolGroupName,
    string Timeframe,
    int BarsAnalyzed,
    DateTime PeriodStartUtc,
    DateTime PeriodEndUtc,
    int TotalSignalsFound,
    int VerifiedMatchesCount,
    int NearMissesCount,
    int SimulatedTradesCount,
    int WinningTradesCount,
    int LosingTradesCount,
    decimal WinRatePercent,
    decimal TotalProfitLossPips,
    decimal ProfitFactor,
    decimal MaxDrawdownPips,
    IReadOnlyList<HistoricalTradeSimulation> SimulatedTrades,
    IReadOnlyList<ScannerMatchResult> HistoricalMatches,
    long DurationMs
);
