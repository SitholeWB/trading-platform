using TradingPlatform.Domain.Enums;

namespace TradingPlatform.Domain.Entities;

public class Position
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public long BrokerTicketId { get; set; }
    public string Symbol { get; set; } = string.Empty;
    public OrderType OrderType { get; set; }
    public decimal Lots { get; set; }
    public decimal EntryPrice { get; set; }
    public decimal CurrentPrice { get; set; }
    public decimal? StopLossPrice { get; set; }
    public decimal? TakeProfitPrice { get; set; }
    public decimal UnrealizedPnl { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Open;
    public DateTime OpenedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public Position() { }

    public Position(
        long brokerTicketId,
        string symbol,
        OrderType orderType,
        decimal lots,
        decimal entryPrice,
        decimal? stopLossPrice = null,
        decimal? takeProfitPrice = null)
    {
        Id = Guid.NewGuid();
        BrokerTicketId = brokerTicketId;
        Symbol = symbol.ToUpperInvariant();
        OrderType = orderType;
        Lots = lots;
        EntryPrice = entryPrice;
        CurrentPrice = entryPrice;
        StopLossPrice = stopLossPrice;
        TakeProfitPrice = takeProfitPrice;
        UnrealizedPnl = 0m;
        Status = OrderStatus.Open;
        OpenedAtUtc = DateTime.UtcNow;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void UpdatePrice(decimal currentPrice)
    {
        CurrentPrice = currentPrice;
        decimal diff = OrderType == OrderType.Buy ? (currentPrice - EntryPrice) : (EntryPrice - currentPrice);
        // Approx PnL: diff * Lots * 100_000 for standard forex lots
        UnrealizedPnl = diff * Lots * 100_000m;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void Close()
    {
        Status = OrderStatus.Closed;
        UpdatedAtUtc = DateTime.UtcNow;
    }
}
