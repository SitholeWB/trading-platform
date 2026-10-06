namespace TradingPlatform.Domain;

public interface IDomainEvent
{
    Guid EventId { get; }
    DateTime OccurredOnUtc { get; }
}

public record CandleProcessedDomainEvent(
    Candle Candle,
    MarketSnapshot Snapshot,
    Guid EventId,
    DateTime OccurredOnUtc) : IDomainEvent
{
    public CandleProcessedDomainEvent(Candle candle, MarketSnapshot snapshot)
        : this(candle, snapshot, Guid.NewGuid(), DateTime.UtcNow) { }
}

public record SignalGeneratedDomainEvent(
    string SignalFingerprint,
    Guid StrategyId,
    string Symbol,
    Timeframe Timeframe,
    DateTime CandleTimestampUtc,
    SignalState State,
    OrderType RecommendedOrderType,
    Guid EventId,
    DateTime OccurredOnUtc) : IDomainEvent
{
    public SignalGeneratedDomainEvent(
        string fingerprint,
        Guid strategyId,
        string symbol,
        Timeframe timeframe,
        DateTime candleTimestampUtc,
        SignalState state,
        OrderType recommendedOrderType)
        : this(fingerprint, strategyId, symbol, timeframe, candleTimestampUtc, state, recommendedOrderType, Guid.NewGuid(), DateTime.UtcNow) { }
}

public record TradeExecutedDomainEvent(
    Guid TradeOrderId,
    long BrokerTicketId,
    string Symbol,
    OrderType OrderType,
    decimal Lots,
    decimal ExecutedPrice,
    Guid EventId,
    DateTime OccurredOnUtc) : IDomainEvent
{
    public TradeExecutedDomainEvent(
        Guid tradeOrderId,
        long brokerTicketId,
        string symbol,
        OrderType orderType,
        decimal lots,
        decimal executedPrice)
        : this(tradeOrderId, brokerTicketId, symbol, orderType, lots, executedPrice, Guid.NewGuid(), DateTime.UtcNow) { }
}

public record KillSwitchEngagedDomainEvent(
    string Reason,
    decimal CurrentDrawdownPercent,
    Guid EventId,
    DateTime OccurredOnUtc) : IDomainEvent
{
    public KillSwitchEngagedDomainEvent(string reason, decimal currentDrawdownPercent)
        : this(reason, currentDrawdownPercent, Guid.NewGuid(), DateTime.UtcNow) { }
}

public record OrderClosedDomainEvent(
    long BrokerTicketId,
    string Symbol,
    ExitReason Reason,
    decimal ExitPrice,
    Guid EventId,
    DateTime OccurredOnUtc) : IDomainEvent
{
    public OrderClosedDomainEvent(long brokerTicketId, string symbol, ExitReason reason, decimal exitPrice)
        : this(brokerTicketId, symbol, reason, exitPrice, Guid.NewGuid(), DateTime.UtcNow) { }
}
