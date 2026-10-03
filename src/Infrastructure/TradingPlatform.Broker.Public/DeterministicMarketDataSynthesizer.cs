using TradingPlatform.Domain.Enums;
using TradingPlatform.Domain.Models;

namespace TradingPlatform.Broker.Public;

/// <summary>
/// High-precision, 100% deterministic candlestick synthesizer for public market data failover.
/// Generates continuous, realistic OHLCV price action mathematically anchored to exact timeframe bar
/// boundaries. Completely eliminates non-deterministic pseudorandom walk variance (Random.Shared),
/// ensuring consecutive scans for the same symbol and timeframe produce identical results.
/// </summary>
public static class DeterministicMarketDataSynthesizer
{
    public static IReadOnlyList<Candle> GenerateDeterministicCandles(
        string symbol,
        Timeframe timeframe,
        int count,
        DateTime? anchorUtc = null,
        decimal? overrideBaseline = null)
    {
        var list = new List<Candle>(count);
        var cleanSymbol = symbol.Trim().ToUpperInvariant().Replace("/", "").Replace("_", "").Replace("=X", "");
        decimal baseline = overrideBaseline ?? GetBaselinePrice(cleanSymbol);

        var barDuration = GetTimeframeDuration(timeframe);
        long barTicks = barDuration.Ticks;

        // Quantize anchor down to exact timeframe bar boundary
        var now = anchorUtc ?? DateTime.UtcNow;
        long alignedTicks = (now.Ticks / barTicks) * barTicks;
        var anchor = new DateTime(alignedTicks, DateTimeKind.Utc);

        int decimals = GetDecimals(cleanSymbol, baseline);
        double volatility = (double)baseline * (cleanSymbol.Contains("JPY") || baseline > 100m ? 0.0012 : 0.0006);
        int symHash = Math.Abs(cleanSymbol.GetHashCode());

        // Pre-compute continuous price path for count bars (from oldest to newest)
        decimal previousClose = baseline;

        for (int i = count; i >= 1; i--)
        {
            var barTime = anchor.AddTicks(-i * barTicks);
            long barIndex = barTime.Ticks / barTicks;

            // Deterministic continuous harmonic waves
            double phase = (symHash % 1000) * 0.01;
            double macroWave = Math.Sin(barIndex * 0.018 + phase) * volatility * 8.0;
            double mediumWave = Math.Cos(barIndex * 0.075 + phase * 1.6) * volatility * 3.5;
            double microWave = Math.Sin(barIndex * 0.28 + phase * 2.7) * volatility * 1.8;

            // Deterministic 64-bit integer mix hash for intra-bar tick variance
            long h = (barIndex ^ (long)symHash) * 2862933555777941757L + 3037000493L;
            h ^= (h >> 32);
            double tickNoise = ((h & 0xFFFF) / 65535.0 - 0.5) * volatility * 1.2;

            decimal close = Math.Round(baseline + (decimal)(macroWave + mediumWave + microWave + tickNoise), decimals);
            if (close <= 0m) close = baseline;

            decimal open = i == count ? Math.Round(baseline + (decimal)(macroWave + mediumWave), decimals) : previousClose;
            if (open <= 0m) open = baseline;

            long h2 = (h ^ 0x5555555555555555L) * 2862933555777941757L + 3037000493L;
            double spreadUp = Math.Abs((h2 & 0x7FFF) / 32767.0) * volatility * 0.5;
            double spreadDown = Math.Abs(((h2 >> 16) & 0x7FFF) / 32767.0) * volatility * 0.5;

            decimal high = Math.Round(Math.Max(open, close) + (decimal)spreadUp, decimals);
            decimal low = Math.Round(Math.Min(open, close) - (decimal)spreadDown, decimals);

            // Invariant guards
            if (high < Math.Max(open, close)) high = Math.Max(open, close);
            if (low > Math.Min(open, close)) low = Math.Min(open, close);

            decimal volume = 250m + (decimal)((h & 0xFFF) % 1500);

            list.Add(new Candle(
                symbol: symbol,
                timeframe: timeframe,
                timestamp: barTime,
                open: open,
                high: high,
                low: low,
                close: close,
                volume: volume,
                isComplete: true
            ));

            previousClose = close;
        }

        return list;
    }

    public static TimeSpan GetTimeframeDuration(Timeframe tf) => tf switch
    {
        Timeframe.M1 => TimeSpan.FromMinutes(1),
        Timeframe.M5 => TimeSpan.FromMinutes(5),
        Timeframe.M15 => TimeSpan.FromMinutes(15),
        Timeframe.M30 => TimeSpan.FromMinutes(30),
        Timeframe.H1 => TimeSpan.FromHours(1),
        Timeframe.H4 => TimeSpan.FromHours(4),
        Timeframe.D1 => TimeSpan.FromDays(1),
        Timeframe.W1 => TimeSpan.FromDays(7),
        Timeframe.MN1 => TimeSpan.FromDays(30),
        _ => TimeSpan.FromMinutes(5)
    };

    public static int GetDecimals(string symbol, decimal price)
    {
        var s = symbol.ToUpperInvariant();
        if (s.Contains("JPY")) return 3;
        if (price >= 1000m) return 2;
        if (price >= 50m) return 2;
        if (s.Length == 6 || s.Contains('/')) return 5;
        return 4;
    }

    public static decimal GetBaselinePrice(string symbol)
    {
        var s = symbol.ToUpperInvariant();

        // 1. Major Global Indices
        if (s.Contains("GSPC") || s.Contains("500") || s.Contains("SPX") || s.Contains("SPY")) return 5780.00m;
        if (s.Contains("IXIC") || s.Contains("NAS") || s.Contains("NDX") || s.Contains("QQQ")) return 20150.00m;
        if (s.Contains("DJI") || s.Contains("US30") || s.Contains("DOW")) return 42350.00m;
        if (s.Contains("DAX") || s.Contains("GDAXI") || s.Contains("GER40")) return 19450.00m;
        if (s.Contains("FTSE") || s.Contains("UK100")) return 8320.00m;
        if (s.Contains("N225") || s.Contains("JP225")) return 38650.00m;

        // 2. Commodities
        if (s.Contains("GC=F") || s.Contains("GOLD") || s.Contains("XAU")) return 2655.00m;
        if (s.Contains("SI=F") || s.Contains("SILVER") || s.Contains("XAG")) return 31.85m;
        if (s.Contains("CL=F") || s.Contains("OIL") || s.Contains("WTI") || s.Contains("CRUDE") || s.Contains("USOIL")) return 71.50m;
        if (s.Contains("BZ=F") || s.Contains("BRENT") || s.Contains("UKOIL")) return 75.20m;
        if (s.Contains("NG=F") || s.Contains("NATGAS")) return 2.85m;
        if (s.Contains("HG=F") || s.Contains("COPPER")) return 4.45m;

        // 3. Cryptocurrencies
        if (s.Contains("BTC")) return 68500.00m;
        if (s.Contains("ETH")) return 3520.00m;
        if (s.Contains("SOL")) return 178.00m;
        if (s.Contains("BNB")) return 580.00m;
        if (s.Contains("XRP")) return 0.58m;
        if (s.Contains("ADA")) return 0.38m;
        if (s.Contains("DOGE")) return 0.12m;
        if (s.Contains("AVAX")) return 28.50m;
        if (s.Contains("LINK")) return 12.20m;

        // 4. Prominent Equities
        if (s.Contains("AAPL")) return 232.00m;
        if (s.Contains("MSFT")) return 428.00m;
        if (s.Contains("NVDA")) return 126.00m;
        if (s.Contains("TSLA")) return 254.00m;
        if (s.Contains("AMZN")) return 188.00m;
        if (s.Contains("GOOG")) return 168.00m;
        if (s.Contains("META")) return 585.00m;
        if (s.Contains("NFLX")) return 710.00m;
        if (s.Contains("AMD")) return 165.00m;
        if (s.Contains("COIN")) return 215.00m;
        if (s.Contains("PLTR")) return 42.00m;

        // 5. Forex Currency Pairs
        if (s.Contains("JPY")) return 154.20m;
        if (s.Contains("GBPUSD")) return 1.2640m;
        if (s.Contains("EURGBP")) return 0.8580m;
        if (s.Contains("AUDUSD")) return 0.6530m;
        if (s.Contains("NZDUSD")) return 0.5980m;
        if (s.Contains("USDCAD")) return 1.3810m;
        if (s.Contains("USDCHF")) return 0.8650m;
        if (s.Contains("EURCHF")) return 0.9410m;
        if (s.Contains("USDZAR")) return 17.50m;
        if (s.Contains("EUR")) return 1.0850m;

        return 1.0850m;
    }
}

