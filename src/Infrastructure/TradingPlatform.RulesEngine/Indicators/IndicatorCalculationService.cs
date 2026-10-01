using Skender.Stock.Indicators;
using TradingPlatform.Application.Interfaces;
using TradingPlatform.Domain.Models;

namespace TradingPlatform.RulesEngine.Indicators;

public class IndicatorCalculationService : IIndicatorCalculationService
{
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

        // 1. Moving Averages
        decimal? ema20 = null;
        decimal? ema50 = null;
        decimal? ema200 = null;

        if (quotes.Count >= 20)
        {
            var ema20Results = quotes.GetEma(20);
            ema20 = (decimal?)ema20Results.LastOrDefault()?.Ema;
        }

        if (quotes.Count >= 50)
        {
            var ema50Results = quotes.GetEma(50);
            ema50 = (decimal?)ema50Results.LastOrDefault()?.Ema;
        }

        if (quotes.Count >= 200)
        {
            var ema200Results = quotes.GetEma(200);
            ema200 = (decimal?)ema200Results.LastOrDefault()?.Ema;
        }

        // 2. Oscillators & Volatility
        decimal? rsi14 = null;
        if (quotes.Count >= 14)
        {
            var rsiResults = quotes.GetRsi(14);
            rsi14 = (decimal?)rsiResults.LastOrDefault()?.Rsi;
        }

        decimal? atr14 = null;
        if (quotes.Count >= 14)
        {
            var atrResults = quotes.GetAtr(14);
            atr14 = (decimal?)atrResults.LastOrDefault()?.Atr;
        }

        // 3. Ichimoku Cloud Components
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

        // 4. Geometry & Wick Ratios
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
            Ema20 = ema20.HasValue ? Math.Round(ema20.Value, 5) : null,
            Ema50 = ema50.HasValue ? Math.Round(ema50.Value, 5) : null,
            Ema200 = ema200.HasValue ? Math.Round(ema200.Value, 5) : null,
            Rsi14 = rsi14.HasValue ? Math.Round(rsi14.Value, 2) : null,
            Atr14 = atr14.HasValue ? Math.Round(atr14.Value, 5) : null,
            IchimokuTenkan = tenkan.HasValue ? Math.Round(tenkan.Value, 5) : null,
            IchimokuKijun = kijun.HasValue ? Math.Round(kijun.Value, 5) : null,
            IchimokuSpanA = spanA.HasValue ? Math.Round(spanA.Value, 5) : null,
            IchimokuSpanB = spanB.HasValue ? Math.Round(spanB.Value, 5) : null,
            IchimokuChikou = chikou.HasValue ? Math.Round(chikou.Value, 5) : null,
            UpperWickRatio = upperWick,
            LowerWickRatio = lowerWick,
            BodyRatio = bodyRatio
        };
    }
}
