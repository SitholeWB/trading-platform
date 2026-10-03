using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TradingPlatform.Application.Interfaces;
using TradingPlatform.Broker.Abstractions;
using TradingPlatform.Broker.Public;
using TradingPlatform.Domain.Entities;
using TradingPlatform.Domain.Enums;
using TradingPlatform.Domain.Models;
using TradingPlatform.RulesEngine.Indicators;
using TradingPlatform.RulesEngine.Scanner;
using Xunit;

namespace TradingPlatform.UnitTests.Scanner;

public class MarketScannerServiceTests
{
    private readonly Mock<IHistoricalDataProvider> _dataProviderMock = new();
    private readonly Mock<ISymbolGroupRepository> _symbolGroupRepoMock = new();
    private readonly Mock<IStrategyRepository> _strategyRepoMock = new();
    private readonly IIndicatorCalculationService _indicatorService = new IndicatorCalculationService();
    private readonly Mock<IRulesEngineService> _rulesEngineMock = new();

    private List<Candle> GenerateMockCandles(string symbol, int count, decimal basePrice = 1.1000m)
    {
        var list = new List<Candle>();
        var time = DateTime.UtcNow.AddMinutes(-5 * count);
        var price = basePrice;

        for (int i = 0; i < count; i++)
        {
            var open = price;
            var close = open + 0.0005m;
            var high = close + 0.0004m;
            var low = open - 0.0003m;
            price = close;

            list.Add(new Candle(
                symbol,
                Timeframe.M5,
                time.AddMinutes(5 * i),
                open,
                high,
                low,
                close,
                1000,
                true));
        }

        return list;
    }

    [Fact]
    public async Task LiveScan_Finds_VerifiedMatch_And_NearMiss()
    {
        var group = new SymbolGroup("grp-1", "Test Forex", "Forex test bucket", "forex", new[] { "EURUSD", "GBPUSD" });
        _symbolGroupRepoMock.Setup(r => r.GetByIdAsync("grp-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(group);

        var strategy = new StrategyDefinition("EmaTrend", "EMA Trend", Timeframe.M5, "{}");
        _strategyRepoMock.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { strategy });

        _dataProviderMock.Setup(d => d.GetHistoricalCandlesAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((string sym, string tf, int cnt, CancellationToken ct) => GenerateMockCandles(sym, cnt));

        _rulesEngineMock.Setup(r => r.EvaluateAsync(It.Is<MarketSnapshot>(s => s.Symbol == "EURUSD"), It.IsAny<IEnumerable<StrategyDefinition>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[]
            {
                new SignalResult(
                    strategy.Id,
                    strategy.Name,
                    "EURUSD",
                    Timeframe.M5,
                    DateTime.UtcNow,
                    SignalState.FullyMet,
                    OrderType.Buy,
                    1.1050m,
                    1.1020m,
                    1.1100m,
                    true,
                    false,
                    Array.Empty<RuleFailureDetail>(),
                    "{\"TotalRules\":2,\"PassedRules\":2}"
                )
            });

        _rulesEngineMock.Setup(r => r.EvaluateAsync(It.Is<MarketSnapshot>(s => s.Symbol == "GBPUSD"), It.IsAny<IEnumerable<StrategyDefinition>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[]
            {
                new SignalResult(
                    strategy.Id,
                    strategy.Name,
                    "GBPUSD",
                    Timeframe.M5,
                    DateTime.UtcNow,
                    SignalState.NearMiss,
                    OrderType.Buy,
                    1.2550m,
                    1.2500m,
                    1.2650m,
                    true,
                    false,
                    new[] { new RuleFailureDetail("RSI_Check", "Rsi14 > 60", "RSI is 55", 0.67m) },
                    "{\"TotalRules\":3,\"PassedRules\":2}"
                )
            });

        var scanner = new MarketScannerService(
            _dataProviderMock.Object,
            _indicatorService,
            _rulesEngineMock.Object,
            _symbolGroupRepoMock.Object,
            _strategyRepoMock.Object,
            NullLogger<MarketScannerService>.Instance
        );

        var report = await scanner.RunLiveScanAsync(new LiveScanRequest("grp-1", null, null, "M5"));

        Assert.Equal("grp-1", report.SymbolGroupId);
        Assert.Equal(2, report.TotalSymbolsScanned);
        Assert.Single(report.VerifiedMatches);
        Assert.Equal("EURUSD", report.VerifiedMatches[0].Symbol);
        Assert.Equal(100m, report.VerifiedMatches[0].MatchPercentage);
        Assert.Single(report.NearMisses);
        Assert.Equal("GBPUSD", report.NearMisses[0].Symbol);
        Assert.Equal(67m, report.NearMisses[0].MatchPercentage);
    }

    [Fact]
    public async Task HistoricalScan_SimulatesTrades_CalculatesWinRateAndPnL()
    {
        var group = new SymbolGroup("grp-1", "Test Forex", "Forex test", "forex", new[] { "EURUSD" });
        _symbolGroupRepoMock.Setup(r => r.GetByIdAsync("grp-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(group);

        var strategy = new StrategyDefinition("BreakoutStrategy", "Breakout", Timeframe.M5, "{}");
        _strategyRepoMock.Setup(r => r.GetByIdAsync(strategy.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(strategy);

        _rulesEngineMock.SetReturnsDefault<Task<IReadOnlyList<SignalResult>>>(
            Task.FromResult<IReadOnlyList<SignalResult>>(Array.Empty<SignalResult>()));

        var mockCandles = GenerateMockCandles("EURUSD", 100, 1.1000m);
        // Force the last candles to rise so TP is hit
        for (int i = 45; i < mockCandles.Count; i++)
        {
            var old = mockCandles[i];
            mockCandles[i] = new Candle(
                old.Symbol,
                old.Timeframe,
                old.Timestamp,
                old.Open,
                old.High + 0.0200m, // High enough to trigger TakeProfit
                old.Low,
                old.Close + 0.0150m,
                old.Volume,
                true);
        }

        _dataProviderMock.Setup(d => d.GetHistoricalCandlesAsync("EURUSD", "M5", It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(mockCandles);

        // Emit a signal at bar 35
        _rulesEngineMock.Setup(r => r.EvaluateAsync(It.Is<MarketSnapshot>(s => s.Timestamp == mockCandles[35].Timestamp), It.IsAny<IEnumerable<StrategyDefinition>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[]
            {
                new SignalResult(
                    strategy.Id,
                    strategy.Name,
                    "EURUSD",
                    Timeframe.M5,
                    mockCandles[35].Timestamp,
                    SignalState.FullyMet,
                    OrderType.Buy,
                    mockCandles[35].Close,
                    mockCandles[35].Close - 0.0030m,
                    mockCandles[35].Close + 0.0060m, // TP reachable by future bars
                    true,
                    false,
                    Array.Empty<RuleFailureDetail>(),
                    "{}"
                )
            });

        var scanner = new MarketScannerService(
            _dataProviderMock.Object,
            _indicatorService,
            _rulesEngineMock.Object,
            _symbolGroupRepoMock.Object,
            _strategyRepoMock.Object,
            NullLogger<MarketScannerService>.Instance
        );

        var report = await scanner.RunHistoricalScanAsync(new HistoricalScanRequest(strategy.Id, "grp-1", null, "M5", 100));

        Assert.NotNull(report);
        Assert.Equal(strategy.Id, report.StrategyId);
        Assert.True(report.TotalSignalsFound >= 1);
        Assert.True(report.SimulatedTradesCount >= 1);
        var trade = report.SimulatedTrades[0];
        Assert.Equal("Win", trade.Outcome);
        Assert.True(trade.ProfitLossPips > 0);
        Assert.Equal(100m, report.WinRatePercent);
    }

    [Fact]
    public async Task LiveScan_RepeatedExecutions_ReturnStableAndDeterministicResults()
    {
        var group = new SymbolGroup("grp-stable", "Multi Symbol Group", "Forex", "forex",
            new[] { "AUDUSD", "EURUSD", "GBPUSD", "USDCAD" });
        _symbolGroupRepoMock.Setup(r => r.GetByIdAsync("grp-stable", It.IsAny<CancellationToken>()))
            .ReturnsAsync(group);

        var strategy = new StrategyDefinition("DeterministicStrategy", "Strategy A", Timeframe.M5, "{}");
        _strategyRepoMock.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { strategy });

        // Deterministic candle data provider
        _dataProviderMock.Setup(d => d.GetHistoricalCandlesAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((string sym, string tf, int cnt, CancellationToken ct) =>
                DeterministicMarketDataSynthesizer.GenerateDeterministicCandles(sym, Timeframe.M5, cnt));

        _rulesEngineMock.Setup(r => r.EvaluateAsync(It.IsAny<MarketSnapshot>(), It.IsAny<IEnumerable<StrategyDefinition>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((MarketSnapshot snap, IEnumerable<StrategyDefinition> strats, CancellationToken ct) =>
            {
                // Consistent mock evaluation: EURUSD and AUDUSD are matches, GBPUSD is near miss, USDCAD is none
                if (snap.Symbol == "EURUSD" || snap.Symbol == "AUDUSD")
                {
                    return new[]
                    {
                        new SignalResult(
                            strategy.Id,
                            strategy.Name,
                            snap.Symbol,
                            Timeframe.M5,
                            snap.Timestamp,
                            SignalState.FullyMet,
                            OrderType.Buy,
                            snap.Close,
                            snap.Close - 0.0020m,
                            snap.Close + 0.0040m,
                            true,
                            false,
                            Array.Empty<RuleFailureDetail>(),
                            "{\"TotalRules\":2,\"PassedRules\":2}"
                        )
                    };
                }
                if (snap.Symbol == "GBPUSD")
                {
                    return new[]
                    {
                        new SignalResult(
                            strategy.Id,
                            strategy.Name,
                            snap.Symbol,
                            Timeframe.M5,
                            snap.Timestamp,
                            SignalState.NearMiss,
                            OrderType.Buy,
                            snap.Close,
                            snap.Close - 0.0020m,
                            snap.Close + 0.0040m,
                            true,
                            false,
                            new[] { new RuleFailureDetail("Rule1", "expr", "failed", 0.75m) },
                            "{\"TotalRules\":4,\"PassedRules\":3}"
                        )
                    };
                }
                return Array.Empty<SignalResult>();
            });

        var scanner = new MarketScannerService(
            _dataProviderMock.Object,
            _indicatorService,
            _rulesEngineMock.Object,
            _symbolGroupRepoMock.Object,
            _strategyRepoMock.Object,
            NullLogger<MarketScannerService>.Instance
        );

        // Run live scan 3 consecutive times
        var report1 = await scanner.RunLiveScanAsync(new LiveScanRequest("grp-stable", null, null, "M5"));
        var report2 = await scanner.RunLiveScanAsync(new LiveScanRequest("grp-stable", null, null, "M5"));
        var report3 = await scanner.RunLiveScanAsync(new LiveScanRequest("grp-stable", null, null, "M5"));

        // Assert 100% stability across all 3 executions
        Assert.Equal(4, report1.TotalSymbolsScanned);
        Assert.Equal(report1.TotalSymbolsScanned, report2.TotalSymbolsScanned);
        Assert.Equal(report1.TotalSymbolsScanned, report3.TotalSymbolsScanned);

        Assert.Equal(2, report1.VerifiedMatches.Count);
        Assert.Equal(report1.VerifiedMatches.Count, report2.VerifiedMatches.Count);
        Assert.Equal(report1.VerifiedMatches.Count, report3.VerifiedMatches.Count);

        // Deterministic sorting invariant: AUDUSD, then EURUSD
        Assert.Equal("AUDUSD", report1.VerifiedMatches[0].Symbol);
        Assert.Equal("EURUSD", report1.VerifiedMatches[1].Symbol);

        Assert.Equal(report1.VerifiedMatches[0].Symbol, report2.VerifiedMatches[0].Symbol);
        Assert.Equal(report1.VerifiedMatches[1].Symbol, report2.VerifiedMatches[1].Symbol);
        Assert.Equal(report1.VerifiedMatches[0].Symbol, report3.VerifiedMatches[0].Symbol);
        Assert.Equal(report1.VerifiedMatches[1].Symbol, report3.VerifiedMatches[1].Symbol);

        Assert.Single(report1.NearMisses);
        Assert.Equal("GBPUSD", report1.NearMisses[0].Symbol);
        Assert.Equal(report1.NearMisses[0].Symbol, report2.NearMisses[0].Symbol);
        Assert.Equal(report1.NearMisses[0].Symbol, report3.NearMisses[0].Symbol);
    }

    [Fact]
    public void DeterministicMarketDataSynthesizer_GeneratesIdenticalCandlesOnConsecutiveCalls()
    {
        var fixedTime = new DateTime(2026, 10, 3, 20, 0, 0, DateTimeKind.Utc);
        var series1 = DeterministicMarketDataSynthesizer.GenerateDeterministicCandles("EURUSD", Timeframe.M5, 60, fixedTime);
        var series2 = DeterministicMarketDataSynthesizer.GenerateDeterministicCandles("EURUSD", Timeframe.M5, 60, fixedTime);

        Assert.Equal(60, series1.Count);
        Assert.Equal(series1.Count, series2.Count);

        for (int i = 0; i < series1.Count; i++)
        {
            var c1 = series1[i];
            var c2 = series2[i];

            Assert.Equal(c1.Timestamp, c2.Timestamp);
            Assert.Equal(c1.Open, c2.Open);
            Assert.Equal(c1.High, c2.High);
            Assert.Equal(c1.Low, c2.Low);
            Assert.Equal(c1.Close, c2.Close);
            Assert.Equal(c1.Volume, c2.Volume);
            Assert.True(c1.High >= Math.Max(c1.Open, c1.Close));
            Assert.True(c1.Low <= Math.Min(c1.Open, c1.Close));
            Assert.True(c1.IsComplete);
        }
    }
}
