using TradingPlatform.Domain;

namespace TradingPlatform.Broker.Abstractions;

public record Tick(
    string Symbol,
    decimal Bid,
    decimal Ask,
    DateTime Timestamp,
    decimal Volume = 0)
{
    public decimal Spread => Ask - Bid;
    public decimal MidPrice => (Bid + Ask) / 2m;
}

public record OrderRequest(
    string Symbol,
    OrderType OrderType,
    decimal Lots,
    decimal? Price = null,
    decimal? StopLoss = null,
    decimal? TakeProfit = null,
    string? Comment = null,
    string? SignalFingerprint = null);

public record ExecutionResult(
    bool Success,
    long BrokerTicketId,
    decimal ExecutedPrice,
    decimal Lots,
    decimal Slippage = 0m,
    string? ErrorMessage = null,
    DateTime? ExecutedAtUtc = null)
{
    public static ExecutionResult Succeeded(long ticketId, decimal executedPrice, decimal lots, decimal slippage = 0m) =>
        new(true, ticketId, executedPrice, lots, slippage, null, DateTime.UtcNow);

    public static ExecutionResult Failed(string error) =>
        new(false, 0, 0m, 0m, 0m, error, DateTime.UtcNow);
}

public record BrokerPosition(
    long TicketId,
    string Symbol,
    OrderType OrderType,
    decimal Lots,
    decimal OpenPrice,
    decimal CurrentPrice,
    decimal? StopLoss,
    decimal? TakeProfit,
    decimal UnrealizedPnl,
    DateTime OpenTimeUtc);

public record AccountSummary(
    string AccountId,
    string Currency,
    decimal Balance,
    decimal Equity,
    decimal Margin,
    decimal FreeMargin,
    decimal MarginLevel,
    decimal DailyStartingEquity,
    DateTime UpdatedAtUtc)
{
    public decimal CurrentDrawdownPercent => DailyStartingEquity > 0
        ? Math.Max(0m, ((DailyStartingEquity - Equity) / DailyStartingEquity) * 100m)
        : 0m;
}

public enum BrokerConnectionStatus
{
    Disconnected,
    Connecting,
    Connected,
    Reconnecting,
    Failed
}
