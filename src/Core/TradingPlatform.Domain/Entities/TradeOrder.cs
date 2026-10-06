namespace TradingPlatform.Domain;

public class TradeOrder
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public long BrokerTicketId { get; set; }
    public string Symbol { get; set; } = string.Empty;
    public OrderType OrderType { get; set; }
    public decimal Lots { get; set; }
    public decimal RequestedPrice { get; set; }
    public decimal ExecutedPrice { get; set; }
    public decimal Slippage { get; set; }
    public decimal? StopLossPrice { get; set; }
    public decimal? TakeProfitPrice { get; set; }
    public ExitReason ExitReason { get; set; } = ExitReason.None;
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public string? SignalFingerprint { get; set; }
    public DateTime OpenedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? ClosedAtUtc { get; set; }

    public TradeOrder() { }

    public TradeOrder(
        long brokerTicketId,
        string symbol,
        OrderType orderType,
        decimal lots,
        decimal requestedPrice,
        decimal executedPrice,
        decimal? stopLossPrice = null,
        decimal? takeProfitPrice = null,
        string? signalFingerprint = null)
    {
        Id = Guid.NewGuid();
        BrokerTicketId = brokerTicketId;
        Symbol = symbol.ToUpperInvariant();
        OrderType = orderType;
        Lots = lots;
        RequestedPrice = requestedPrice;
        ExecutedPrice = executedPrice;
        Slippage = Math.Abs(executedPrice - requestedPrice);
        StopLossPrice = stopLossPrice;
        TakeProfitPrice = takeProfitPrice;
        Status = OrderStatus.Open;
        SignalFingerprint = signalFingerprint;
        OpenedAtUtc = DateTime.UtcNow;
    }

    public void Close(decimal closePrice, ExitReason reason)
    {
        Status = OrderStatus.Closed;
        ExitReason = reason;
        ClosedAtUtc = DateTime.UtcNow;
    }

    public void UpdateProtection(decimal? stopLoss, decimal? takeProfit)
    {
        StopLossPrice = stopLoss;
        TakeProfitPrice = takeProfit;
    }
}
