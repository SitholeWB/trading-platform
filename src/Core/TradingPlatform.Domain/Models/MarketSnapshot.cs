using TradingPlatform.Domain.Enums;

namespace TradingPlatform.Domain.Models;

/// <summary>
/// Flattens all extracted indicator values and candle features for a single completed candle.
/// This context model is passed directly to the Microsoft.RulesEngine for strategy evaluation.
/// </summary>
public record MarketSnapshot
{
    public string Symbol { get; init; } = string.Empty;
    public Timeframe Timeframe { get; init; }
    public DateTime Timestamp { get; init; } // UTC
    public decimal Open { get; init; }
    public decimal High { get; init; }
    public decimal Low { get; init; }
    public decimal Close { get; init; }
    public decimal Volume { get; init; }

    // Moving Averages
    public decimal? Ema20 { get; init; }
    public decimal? Ema50 { get; init; }
    public decimal? Ema200 { get; init; }

    // Oscillators & Volatility
    public decimal? Rsi14 { get; init; }
    public decimal? Atr14 { get; init; }

    // Ichimoku Cloud Components
    public decimal? IchimokuTenkan { get; init; }
    public decimal? IchimokuKijun { get; init; }
    public decimal? IchimokuSpanA { get; init; }
    public decimal? IchimokuSpanB { get; init; }
    public decimal? IchimokuChikou { get; init; }

    // Price Action / Candle Geometry Ratios (0.0 to 1.0)
    public decimal UpperWickRatio { get; init; }
    public decimal LowerWickRatio { get; init; }
    public decimal BodyRatio { get; init; }

    // Helper calculations
    public static (decimal upperWick, decimal lowerWick, decimal body) CalculateRatios(decimal open, decimal high, decimal low, decimal close)
    {
        decimal totalRange = high - low;
        if (totalRange <= 0)
        {
            return (0m, 0m, 1m);
        }

        decimal bodyTop = Math.Max(open, close);
        decimal bodyBottom = Math.Min(open, close);

        decimal upperWick = (high - bodyTop) / totalRange;
        decimal lowerWick = (bodyBottom - low) / totalRange;
        decimal body = (bodyTop - bodyBottom) / totalRange;

        return (
            Math.Round(upperWick, 4),
            Math.Round(lowerWick, 4),
            Math.Round(body, 4)
        );
    }
}
