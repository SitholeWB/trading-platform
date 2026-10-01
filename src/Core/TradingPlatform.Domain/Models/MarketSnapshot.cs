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

    // Moving Averages (EMA & SMA)
    public decimal? Ema20 { get; init; }
    public decimal? Ema50 { get; init; }
    public decimal? Ema200 { get; init; }
    public decimal? Sma20 { get; init; }
    public decimal? Sma50 { get; init; }
    public decimal? Sma200 { get; init; }

    // Oscillators & Volatility
    public decimal? Rsi14 { get; init; }
    public decimal? Atr14 { get; init; }

    // MACD (Moving Average Convergence Divergence)
    public decimal? MacdLine { get; init; }
    public decimal? MacdSignal { get; init; }
    public decimal? MacdHistogram { get; init; }

    // Bollinger Bands
    public decimal? BollingerUpper { get; init; }
    public decimal? BollingerMiddle { get; init; }
    public decimal? BollingerLower { get; init; }

    // Stochastic Oscillator
    public decimal? StochK { get; init; }
    public decimal? StochD { get; init; }

    // Average Directional Index (ADX)
    public decimal? Adx { get; init; }

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

    // Dynamic Indicators Storage supporting user-customized periods (e.g. EMA_9, SMA_50, RSI_7, ATR_20)
    public Dictionary<string, decimal?> DynamicIndicators { get; init; } = new(StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Helper method for dynamic EMA calculation in RulesEngine: input1.Ema(9), input1.Ema(21), etc.
    /// </summary>
    public decimal? Ema(int period)
    {
        if (period == 20 && Ema20.HasValue) return Ema20;
        if (period == 50 && Ema50.HasValue) return Ema50;
        if (period == 200 && Ema200.HasValue) return Ema200;
        if (DynamicIndicators.TryGetValue($"EMA_{period}", out var v1)) return v1;
        if (DynamicIndicators.TryGetValue($"EMA{period}", out var v2)) return v2;
        return null;
    }

    /// <summary>
    /// Helper method for dynamic SMA calculation in RulesEngine: input1.Sma(20), input1.Sma(50), etc.
    /// </summary>
    public decimal? Sma(int period)
    {
        if (period == 20 && Sma20.HasValue) return Sma20;
        if (period == 50 && Sma50.HasValue) return Sma50;
        if (period == 200 && Sma200.HasValue) return Sma200;
        if (DynamicIndicators.TryGetValue($"SMA_{period}", out var v1)) return v1;
        if (DynamicIndicators.TryGetValue($"SMA{period}", out var v2)) return v2;
        return null;
    }

    // Indicator convenience helpers
    public decimal? Macd() => MacdLine;
    public decimal? MacdSig() => MacdSignal;
    public decimal? MacdHist() => MacdHistogram;
    public decimal? BbUpper() => BollingerUpper;
    public decimal? BbMiddle() => BollingerMiddle;
    public decimal? BbLower() => BollingerLower;

    /// <summary>
    /// Helper method for dynamic RSI calculation in RulesEngine: input1.Rsi(14), input1.Rsi(7), etc.
    /// </summary>
    public decimal? Rsi(int period = 14)
    {
        if (period == 14 && Rsi14.HasValue) return Rsi14;
        if (DynamicIndicators.TryGetValue($"RSI_{period}", out var v1)) return v1;
        if (DynamicIndicators.TryGetValue($"RSI{period}", out var v2)) return v2;
        return null;
    }

    /// <summary>
    /// Helper method for dynamic ATR calculation in RulesEngine: input1.Atr(14), input1.Atr(20), etc.
    /// </summary>
    public decimal? Atr(int period = 14)
    {
        if (period == 14 && Atr14.HasValue) return Atr14;
        if (DynamicIndicators.TryGetValue($"ATR_{period}", out var v1)) return v1;
        if (DynamicIndicators.TryGetValue($"ATR{period}", out var v2)) return v2;
        return null;
    }

    /// <summary>
    /// Generic indicator lookup by key name
    /// </summary>
    public decimal? Indicator(string name)
    {
        if (DynamicIndicators.TryGetValue(name, out var val)) return val;
        return null;
    }

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
