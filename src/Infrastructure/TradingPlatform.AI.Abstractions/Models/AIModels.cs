using TradingPlatform.Domain;

namespace TradingPlatform.AI.Abstractions;

public record NewsHeadline(
    string Title,
    string Source,
    DateTime PublishedUtc,
    decimal SentimentScore, // -1.0 to 1.0
    string Impact,          // High, Medium, Low
    IReadOnlyList<string> RelatedSymbols);

public record AIContextValidationResult(
    bool IsApproved,
    float ConfidenceScore,
    string ReasoningExplanation,
    IReadOnlyList<string> RiskFlags,
    DateTime EvaluatedAtUtc)
{
    public static AIContextValidationResult Approved(float confidence, string reasoning) =>
        new(true, confidence, reasoning, Array.Empty<string>(), DateTime.UtcNow);

    public static AIContextValidationResult Rejected(string reasoning, params string[] riskFlags) =>
        new(false, 0.2f, reasoning, riskFlags, DateTime.UtcNow);
}

public record SignalEvaluationContext(
    Guid StrategyId,
    string StrategyName,
    string Symbol,
    Timeframe Timeframe,
    DateTime CandleTimestampUtc,
    OrderType RecommendedOrderType,
    decimal EntryPrice,
    decimal? StopLoss,
    decimal? TakeProfit,
    MarketSnapshot Snapshot);
