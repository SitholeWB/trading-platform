namespace TradingPlatform.Domain;

public record Candle
{
    public string Symbol { get; init; } = string.Empty;
    public Timeframe Timeframe { get; init; }
    public DateTime Timestamp { get; init; } // UTC
    public decimal Open { get; init; }
    public decimal High { get; init; }
    public decimal Low { get; init; }
    public decimal Close { get; init; }
    public decimal Volume { get; init; }
    public bool IsComplete { get; init; }

    public Candle() { }

    public Candle(
        string symbol,
        Timeframe timeframe,
        DateTime timestamp,
        decimal open,
        decimal high,
        decimal low,
        decimal close,
        decimal volume,
        bool isComplete)
    {
        if (string.IsNullOrWhiteSpace(symbol))
            throw new ArgumentException("Symbol cannot be null or empty.", nameof(symbol));

        if (high < low)
            throw new ArgumentException($"High ({high}) cannot be less than Low ({low}).");

        if (high < open || high < close)
            throw new ArgumentException($"High ({high}) must be greater than or equal to Open ({open}) and Close ({close}).");

        if (low > open || low > close)
            throw new ArgumentException($"Low ({low}) must be less than or equal to Open ({open}) and Close ({close}).");

        if (volume < 0)
            throw new ArgumentException("Volume cannot be negative.", nameof(volume));

        Symbol = symbol.ToUpperInvariant();
        Timeframe = timeframe;
        Timestamp = timestamp.Kind == DateTimeKind.Utc ? timestamp : DateTime.SpecifyKind(timestamp, DateTimeKind.Utc);
        Open = open;
        High = high;
        Low = low;
        Close = close;
        Volume = volume;
        IsComplete = isComplete;
    }

    public decimal Range => High - Low;
    public decimal Body => Math.Abs(Close - Open);
    public bool IsBullish => Close > Open;
    public bool IsBearish => Close < Open;
}
