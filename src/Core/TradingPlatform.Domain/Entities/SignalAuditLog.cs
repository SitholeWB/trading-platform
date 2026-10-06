namespace TradingPlatform.Domain;

public class SignalAuditLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    /// <summary>
    /// Unique index fingerprint: $"{Symbol}_{Timeframe}_{CandleTimestamp:yyyyMMddHHmm}_{StrategyId}"
    /// Physically prevents duplicate executions via unique database constraint.
    /// </summary>
    public string SignalFingerprint { get; set; } = string.Empty;

    public Guid StrategyId { get; set; }
    public string Symbol { get; set; } = string.Empty;
    public Timeframe Timeframe { get; set; }
    public DateTime CandleTimestampUtc { get; set; }
    public SignalState State { get; set; }
    
    /// <summary>
    /// Detailed JSON payload containing rule pass/fail breakdown, indicator values, near-miss scores, and risk evaluation notes.
    /// </summary>
    public string EvaluationDetailsJson { get; set; } = string.Empty;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public SignalAuditLog() { }

    public SignalAuditLog(
        string signalFingerprint,
        Guid strategyId,
        string symbol,
        Timeframe timeframe,
        DateTime candleTimestampUtc,
        SignalState state,
        string evaluationDetailsJson)
    {
        if (string.IsNullOrWhiteSpace(signalFingerprint))
            throw new ArgumentException("Signal fingerprint cannot be empty.", nameof(signalFingerprint));

        Id = Guid.NewGuid();
        SignalFingerprint = signalFingerprint;
        StrategyId = strategyId;
        Symbol = symbol.ToUpperInvariant();
        Timeframe = timeframe;
        CandleTimestampUtc = candleTimestampUtc;
        State = state;
        EvaluationDetailsJson = evaluationDetailsJson ?? "{}";
        CreatedAtUtc = DateTime.UtcNow;
    }
}
