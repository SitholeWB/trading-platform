using TradingPlatform.Domain.Enums;
using TradingPlatform.Domain.Models;
using TradingPlatform.RulesEngine.Indicators;
using Xunit;

namespace TradingPlatform.UnitTests.Indicators;

public class IndicatorCalculationTests
{
    private readonly IndicatorCalculationService _service = new();

    [Fact]
    public void CalculateSnapshot_Ratios_CalculatedCorrectly()
    {
        // Bullish candle with open=1.0500, high=1.0550, low=1.0450, close=1.0540
        var (uw, lw, br) = MarketSnapshot.CalculateRatios(1.0500m, 1.0550m, 1.0450m, 1.0540m);

        // Total range = 0.0100
        // Body = 0.0040 -> BodyRatio = 0.4000
        // Upper wick = 1.0550 - 1.0540 = 0.0010 -> UpperWickRatio = 0.1000
        // Lower wick = 1.0500 - 1.0450 = 0.0050 -> LowerWickRatio = 0.5000
        Assert.Equal(0.1000m, uw);
        Assert.Equal(0.5000m, lw);
        Assert.Equal(0.4000m, br);
    }

    [Fact]
    public void CalculateSnapshot_WithFullWindow_ExtractsAllIndicators()
    {
        var candles = new List<Candle>();
        var baseTime = DateTime.UtcNow.AddMinutes(-5 * 210);
        decimal price = 1.1000m;

        for (int i = 0; i < 210; i++)
        {
            decimal open = price;
            decimal close = open + (i % 2 == 0 ? 0.0008m : -0.0004m);
            decimal high = Math.Max(open, close) + 0.0003m;
            decimal low = Math.Min(open, close) - 0.0003m;

            candles.Add(new Candle("EURUSD", Timeframe.M5, baseTime.AddMinutes(5 * i), open, high, low, close, 1000m, true));
            price = close;
        }

        var snapshot = _service.CalculateSnapshot(candles);

        Assert.Equal("EURUSD", snapshot.Symbol);
        Assert.Equal(Timeframe.M5, snapshot.Timeframe);
        Assert.NotNull(snapshot.Ema20);
        Assert.NotNull(snapshot.Ema50);
        Assert.NotNull(snapshot.Ema200);
        Assert.NotNull(snapshot.Rsi14);
        Assert.NotNull(snapshot.Atr14);
        Assert.NotNull(snapshot.IchimokuSpanA);
        Assert.NotNull(snapshot.IchimokuSpanB);
        Assert.True(snapshot.Rsi14 > 0 && snapshot.Rsi14 < 100);
    }
}
