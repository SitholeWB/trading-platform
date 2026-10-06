using Skender.Stock.Indicators;
using TradingPlatform.Application;
using TradingPlatform.Domain;

namespace TradingPlatform.RulesEngine;

public class IndicatorCalculationService : IIndicatorCalculationService
{
    private readonly HashSet<int> _customEmaPeriods = new();
    private readonly HashSet<int> _customSmaPeriods = new();

    public void RegisterIndicatorPeriods(IEnumerable<int>? emaPeriods, IEnumerable<int>? smaPeriods = null)
    {
        if (emaPeriods != null)
        {
            lock (_customEmaPeriods)
            {
                foreach (var p in emaPeriods)
                {
                    if (p > 0) _customEmaPeriods.Add(p);
                }
            }
        }
        if (smaPeriods != null)
        {
            lock (_customSmaPeriods)
            {
                foreach (var p in smaPeriods)
                {
                    if (p > 0) _customSmaPeriods.Add(p);
                }
            }
        }
    }

    public MarketSnapshot CalculateSnapshot(IReadOnlyList<Candle> slidingWindow)
    {
        if (slidingWindow == null || slidingWindow.Count == 0)
        {
            throw new ArgumentException("Sliding window cannot be null or empty.", nameof(slidingWindow));
        }

        var latestCandle = slidingWindow[^1];

        // If window is very small, return snapshot with basic prices
        if (slidingWindow.Count < 5)
        {
            var (uw, lw, br) = MarketSnapshot.CalculateRatios(
                latestCandle.Open, latestCandle.High, latestCandle.Low, latestCandle.Close);

            return new MarketSnapshot
            {
                Symbol = latestCandle.Symbol,
                Timeframe = latestCandle.Timeframe,
                Timestamp = latestCandle.Timestamp,
                Open = latestCandle.Open,
                High = latestCandle.High,
                Low = latestCandle.Low,
                Close = latestCandle.Close,
                Volume = latestCandle.Volume,
                UpperWickRatio = uw,
                LowerWickRatio = lw,
                BodyRatio = br
            };
        }

        // Convert domain candles to Skender Quotes
        var quotes = slidingWindow.Select(c => new Quote
        {
            Date = c.Timestamp,
            Open = c.Open,
            High = c.High,
            Low = c.Low,
            Close = c.Close,
            Volume = c.Volume
        }).ToList();

        // 1. Moving Averages (Baseline + Dynamic Fibonacci & Custom Periods)
        var dynamicIndicators = new Dictionary<string, decimal?>(StringComparer.OrdinalIgnoreCase);
        int[] defaultEmaPeriods = { 3, 5, 8, 9, 10, 12, 13, 14, 15, 20, 21, 25, 26, 30, 34, 50, 55, 89, 100, 144, 200 };
        List<int> allEmaPeriods;
        lock (_customEmaPeriods)
        {
            allEmaPeriods = defaultEmaPeriods.Union(_customEmaPeriods).OrderBy(x => x).ToList();
        }
        decimal? ema20 = null;
        decimal? ema50 = null;
        decimal? ema200 = null;

        foreach (var period in allEmaPeriods)
        {
            if (quotes.Count >= period)
            {
                var emaResults = quotes.GetEma(period);
                var emaVal = (decimal?)emaResults.LastOrDefault()?.Ema;
                if (emaVal.HasValue)
                {
                    var rounded = Math.Round(emaVal.Value, 5);
                    dynamicIndicators[$"EMA_{period}"] = rounded;
                    dynamicIndicators[$"EMA{period}"] = rounded;
                    if (period == 20) ema20 = rounded;
                    if (period == 50) ema50 = rounded;
                    if (period == 200) ema200 = rounded;
                }
            }
        }

        // 2. Simple Moving Averages (SMA)
        int[] defaultSmaPeriods = { 10, 20, 50, 100, 200 };
        List<int> allSmaPeriods;
        lock (_customSmaPeriods)
        {
            allSmaPeriods = defaultSmaPeriods.Union(_customSmaPeriods).OrderBy(x => x).ToList();
        }
        decimal? sma20 = null;
        decimal? sma50 = null;
        decimal? sma200 = null;
        foreach (var period in allSmaPeriods)
        {
            if (quotes.Count >= period)
            {
                var smaResults = quotes.GetSma(period);
                var smaVal = (decimal?)smaResults.LastOrDefault()?.Sma;
                if (smaVal.HasValue)
                {
                    var rounded = Math.Round(smaVal.Value, 5);
                    dynamicIndicators[$"SMA_{period}"] = rounded;
                    dynamicIndicators[$"SMA{period}"] = rounded;
                    if (period == 20) sma20 = rounded;
                    if (period == 50) sma50 = rounded;
                    if (period == 200) sma200 = rounded;
                }
            }
        }

        // 3. Oscillators & Volatility (RSI & ATR)
        int[] rsiPeriods = { 5, 7, 9, 14, 21, 25, 30 };
        decimal? rsi14 = null;
        foreach (var period in rsiPeriods)
        {
            if (quotes.Count >= period)
            {
                var rsiResults = quotes.GetRsi(period);
                var rsiVal = (decimal?)rsiResults.LastOrDefault()?.Rsi;
                if (rsiVal.HasValue)
                {
                    var rounded = Math.Round(rsiVal.Value, 2);
                    dynamicIndicators[$"RSI_{period}"] = rounded;
                    dynamicIndicators[$"RSI{period}"] = rounded;
                    if (period == 14) rsi14 = rounded;
                }
            }
        }

        int[] atrPeriods = { 5, 7, 10, 14, 20, 21 };
        decimal? atr14 = null;
        foreach (var period in atrPeriods)
        {
            if (quotes.Count >= period)
            {
                var atrResults = quotes.GetAtr(period);
                var atrVal = (decimal?)atrResults.LastOrDefault()?.Atr;
                if (atrVal.HasValue)
                {
                    var rounded = Math.Round(atrVal.Value, 5);
                    dynamicIndicators[$"ATR_{period}"] = rounded;
                    dynamicIndicators[$"ATR{period}"] = rounded;
                    if (period == 14) atr14 = rounded;
                }
            }
        }

        // 4. MACD (12, 26, 9)
        decimal? macdLine = null;
        decimal? macdSignal = null;
        decimal? macdHistogram = null;
        if (quotes.Count >= 26)
        {
            var macdResults = quotes.GetMacd(12, 26, 9);
            var latestMacd = macdResults.LastOrDefault();
            if (latestMacd != null)
            {
                if (latestMacd.Macd.HasValue) macdLine = Math.Round((decimal)latestMacd.Macd.Value, 5);
                if (latestMacd.Signal.HasValue) macdSignal = Math.Round((decimal)latestMacd.Signal.Value, 5);
                if (latestMacd.Histogram.HasValue) macdHistogram = Math.Round((decimal)latestMacd.Histogram.Value, 5);
            }
        }

        // 5. Bollinger Bands (20, 2.0)
        decimal? bbUpper = null;
        decimal? bbMiddle = null;
        decimal? bbLower = null;
        if (quotes.Count >= 20)
        {
            var bbResults = quotes.GetBollingerBands(20, 2.0);
            var latestBb = bbResults.LastOrDefault();
            if (latestBb != null)
            {
                if (latestBb.UpperBand.HasValue) bbUpper = Math.Round((decimal)latestBb.UpperBand.Value, 5);
                if (latestBb.Sma.HasValue) bbMiddle = Math.Round((decimal)latestBb.Sma.Value, 5);
                if (latestBb.LowerBand.HasValue) bbLower = Math.Round((decimal)latestBb.LowerBand.Value, 5);
            }
        }

        // 6. Stochastic Oscillator (14, 3, 3)
        decimal? stochK = null;
        decimal? stochD = null;
        if (quotes.Count >= 14)
        {
            var stochResults = quotes.GetStoch(14, 3, 3);
            var latestStoch = stochResults.LastOrDefault();
            if (latestStoch != null)
            {
                if (latestStoch.Oscillator.HasValue) stochK = Math.Round((decimal)latestStoch.Oscillator.Value, 2);
                if (latestStoch.Signal.HasValue) stochD = Math.Round((decimal)latestStoch.Signal.Value, 2);
            }
        }

        // 7. Average Directional Index (ADX 14)
        decimal? adx = null;
        if (quotes.Count >= 14)
        {
            var adxResults = quotes.GetAdx(14);
            var latestAdx = adxResults.LastOrDefault();
            if (latestAdx != null && latestAdx.Adx.HasValue)
            {
                adx = Math.Round((decimal)latestAdx.Adx.Value, 2);
            }
        }

        // 8. Ichimoku Cloud Components
        decimal? tenkan = null;
        decimal? kijun = null;
        decimal? spanA = null;
        decimal? spanB = null;
        decimal? chikou = null;

        if (quotes.Count >= 52)
        {
            var ichimokuResults = quotes.GetIchimoku(9, 26, 52).ToList();
            var latestIchimoku = ichimokuResults.LastOrDefault();
            if (latestIchimoku != null)
            {
                tenkan = (decimal?)latestIchimoku.TenkanSen;
                kijun = (decimal?)latestIchimoku.KijunSen;
                spanA = (decimal?)latestIchimoku.SenkouSpanA;
                spanB = (decimal?)latestIchimoku.SenkouSpanB;
                chikou = (decimal?)latestIchimoku.ChikouSpan;
            }
        }

        // 9. Geometry & Wick Ratios
        var (upperWick, lowerWick, bodyRatio) = MarketSnapshot.CalculateRatios(
            latestCandle.Open, latestCandle.High, latestCandle.Low, latestCandle.Close);

        return new MarketSnapshot
        {
            Symbol = latestCandle.Symbol,
            Timeframe = latestCandle.Timeframe,
            Timestamp = latestCandle.Timestamp,
            Open = latestCandle.Open,
            High = latestCandle.High,
            Low = latestCandle.Low,
            Close = latestCandle.Close,
            Volume = latestCandle.Volume,
            Ema20 = ema20,
            Ema50 = ema50,
            Ema200 = ema200,
            Sma20 = sma20,
            Sma50 = sma50,
            Sma200 = sma200,
            Rsi14 = rsi14,
            Atr14 = atr14,
            MacdLine = macdLine,
            MacdSignal = macdSignal,
            MacdHistogram = macdHistogram,
            BollingerUpper = bbUpper,
            BollingerMiddle = bbMiddle,
            BollingerLower = bbLower,
            StochK = stochK,
            StochD = stochD,
            Adx = adx,
            IchimokuTenkan = tenkan.HasValue ? Math.Round(tenkan.Value, 5) : null,
            IchimokuKijun = kijun.HasValue ? Math.Round(kijun.Value, 5) : null,
            IchimokuSpanA = spanA.HasValue ? Math.Round(spanA.Value, 5) : null,
            IchimokuSpanB = spanB.HasValue ? Math.Round(spanB.Value, 5) : null,
            IchimokuChikou = chikou.HasValue ? Math.Round(chikou.Value, 5) : null,
            UpperWickRatio = upperWick,
            LowerWickRatio = lowerWick,
            BodyRatio = bodyRatio,
            DynamicIndicators = dynamicIndicators
        };
    }
}
