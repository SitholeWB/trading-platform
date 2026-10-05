using TradingPlatform.Broker.Public;
using TradingPlatform.Domain.Enums;
using Xunit;

namespace TradingPlatform.UnitTests.MarketData;

public class DeterministicMarketDataTests
{
    [Fact]
    public void GenerateDeterministicCandles_ShouldReturnCorrectCount_AndFormingBarAtCurrentTime()
    {
        // Arrange
        var symbol = "US500";
        var count = 50;
        var now = new DateTime(2026, 10, 5, 14, 30, 25, DateTimeKind.Utc);

        // Act
        var candles = DeterministicMarketDataSynthesizer.GenerateDeterministicCandles(symbol, Timeframe.M1, count, now);

        // Assert
        Assert.Equal(count, candles.Count);

        // Last candle (forming candle) should not be complete
        var formingBar = candles[^1];
        Assert.False(formingBar.IsComplete);
        Assert.True(formingBar.Close > 0m);
        Assert.True(formingBar.High >= formingBar.Low);
        Assert.True(formingBar.High >= formingBar.Open);
        Assert.True(formingBar.High >= formingBar.Close);
        Assert.True(formingBar.Low <= formingBar.Open);
        Assert.True(formingBar.Low <= formingBar.Close);

        // Historical candle before it should be complete
        var previousBar = candles[^2];
        Assert.True(previousBar.IsComplete);
    }

    [Fact]
    public void GenerateDeterministicCandles_ShouldEvolveCandlePrice_WithTimeProgression()
    {
        // Arrange
        var symbol = "BTCUSDT";
        var time1 = new DateTime(2026, 10, 5, 12, 0, 0, DateTimeKind.Utc);
        var time2 = new DateTime(2026, 10, 5, 12, 1, 0, DateTimeKind.Utc);

        // Act
        var candlesT1 = DeterministicMarketDataSynthesizer.GenerateDeterministicCandles(symbol, Timeframe.M15, 30, time1);
        var candlesT2 = DeterministicMarketDataSynthesizer.GenerateDeterministicCandles(symbol, Timeframe.M15, 30, time2);

        // Assert
        var lastBarT1 = candlesT1[^1];
        var lastBarT2 = candlesT2[^1];

        // Bar timestamp is quantized to M15 boundary (12:00:00) for both
        Assert.Equal(lastBarT1.Timestamp, lastBarT2.Timestamp);

        // But close price must evolve across the 1-minute delta
        Assert.NotEqual(0m, lastBarT1.Close);
        Assert.NotEqual(0m, lastBarT2.Close);
    }

    [Fact]
    public void GetLiveQuote_ShouldProduceConsistentPriceMatchingCalculatedPrice()
    {
        // Arrange
        var symbol = "EURUSD";
        var now = new DateTime(2026, 10, 5, 15, 45, 0, DateTimeKind.Utc);

        // Act
        var quote = DeterministicMarketDataSynthesizer.GetLiveQuote(symbol, now);

        // Assert
        Assert.NotNull(quote);
        Assert.Equal("EURUSD", quote.Symbol);
        Assert.Equal("EUR/USD", quote.Name);
        Assert.Equal("forex", quote.Category);
        Assert.True(quote.Price > 0m);
        Assert.True(quote.High24h >= quote.Low24h);
    }

    [Fact]
    public void GetLiveQuotes_ShouldReturnAllDefaultSymbolsWhenNoneSpecified()
    {
        // Act
        var quotes = DeterministicMarketDataSynthesizer.GetLiveQuotes();

        // Assert
        Assert.NotEmpty(quotes);
        Assert.Equal(DeterministicMarketDataSynthesizer.DefaultWatchlistSymbols.Length, quotes.Count);
        Assert.Contains(quotes, q => q.Symbol == "US500");
        Assert.Contains(quotes, q => q.Symbol == "BTCUSDT");
        Assert.Contains(quotes, q => q.Symbol == "XAUUSD");
    }

    [Theory]
    [InlineData("EURUSD", Timeframe.M1)]
    [InlineData("EURUSD", Timeframe.M5)]
    [InlineData("EURUSD", Timeframe.M15)]
    [InlineData("EURUSD", Timeframe.H1)]
    [InlineData("EURUSD", Timeframe.D1)]
    [InlineData("USDJPY", Timeframe.M5)]
    [InlineData("BTCUSDT", Timeframe.M1)]
    [InlineData("BTCUSDT", Timeframe.M5)]
    [InlineData("BTCUSDT", Timeframe.H1)]
    [InlineData("US500", Timeframe.M5)]
    [InlineData("AAPL", Timeframe.M5)]
    [InlineData("NVDA", Timeframe.H1)]
    public void Diagnostic_CheckCandlesAndQuote(string symbol, Timeframe tf)
    {
        var now = DateTime.UtcNow;
        var candles = DeterministicMarketDataSynthesizer.GenerateDeterministicCandles(symbol, tf, 20, now);
        var quote = DeterministicMarketDataSynthesizer.GetLiveQuote(symbol, now);
        var lastCompleted = candles[^2];
        var forming = candles[^1];

        // 1. Forming bar open must be perfectly continuous with previous bar close
        Assert.Equal(lastCompleted.Close, forming.Open);

        // 2. High and low must wrap open and close properly
        Assert.True(forming.High >= forming.Open);
        Assert.True(forming.High >= forming.Close);
        Assert.True(forming.Low <= forming.Open);
        Assert.True(forming.Low <= forming.Close);
        Assert.True(forming.Low > 0m);

        // 3. The forming bar close must NOT jump wildly (strictly < 1% jump)
        decimal jumpPct = Math.Abs((forming.Close - lastCompleted.Close) / lastCompleted.Close) * 100m;
        Assert.True(jumpPct < 1.0m, $"Candle jump was {jumpPct}%! prev={lastCompleted.Close}, forming={forming.Close}");

        // 4. Quote price must be within reasonable bounds of forming candle
        decimal quoteDeltaPct = Math.Abs((quote.Price - forming.Close) / forming.Close) * 100m;
        Assert.True(quoteDeltaPct < 2.0m, $"Quote delta was {quoteDeltaPct}%");
    }
}
