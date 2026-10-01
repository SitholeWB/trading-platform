namespace TradingPlatform.Domain.Enums;

public enum Timeframe
{
    M1,
    M5,
    M15,
    M30,
    H1,
    H4,
    D1,
    W1,
    MN1
}

public enum OrderType
{
    Buy,
    Sell
}

public enum OrderStatus
{
    Pending,
    Open,
    Closed,
    Cancelled,
    Rejected
}

public enum SignalState
{
    NearMiss,
    FullyMet,
    RejectedByRisk,
    Dispatched
}

public enum ExitReason
{
    None,
    OpposingPattern,
    ManualClose,
    HardSL,
    HardTP,
    KillSwitch,
    TrailingStop
}
