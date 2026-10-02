using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TradingPlatform.Application.Commands.IngestCandle;
using TradingPlatform.Application.Common.CQRS;
using TradingPlatform.Application.Interfaces;
using TradingPlatform.Broker.Abstractions;
using TradingPlatform.Domain.Entities;
using TradingPlatform.Domain.Enums;
using TradingPlatform.Domain.Models;

namespace TradingPlatform.Worker.Workers;

public class CandleIngestionWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IMarketDataStreamer _streamer;
    private readonly IHistoricalDataProvider _historicalDataProvider;
    private readonly ILogger<CandleIngestionWorker> _logger;

    public CandleIngestionWorker(
        IServiceProvider serviceProvider,
        IMarketDataStreamer streamer,
        IHistoricalDataProvider historicalDataProvider,
        ILogger<CandleIngestionWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _streamer = streamer;
        _historicalDataProvider = historicalDataProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("[WORKER: INGESTION] Starting Candle Ingestion Service...");

        using (var scope = _serviceProvider.CreateScope())
        {
            await SeedInitialDataAsync(scope.ServiceProvider, stoppingToken);
        }

        // Hook streaming events
        _streamer.OnCandleClosed += async candle =>
        {
            using var scope = _serviceProvider.CreateScope();
            var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
            try
            {
                await mediator.Send(new IngestCandleCommand(candle), stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[WORKER: INGESTION] Error processing incoming candle for {Symbol}", candle.Symbol);
            }
        };

        var symbols = new[] { "EURUSD", "GBPUSD", "USDJPY" };
        await _streamer.StartAsync(symbols, stoppingToken);

        // Simulation runner: generates a new candle every 5 seconds to demonstrate the live loop
        var random = new Random();
        decimal currentClose = 1.0850m;
        var currentTime = DateTime.UtcNow;

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(5000, stoppingToken);

                // Produce simulated closed candle to demonstrate continuous scanning & pipeline evaluation
                decimal open = currentClose;
                decimal delta = (decimal)((random.NextDouble() - 0.48) * 0.0015);
                decimal close = open + delta;
                decimal high = Math.Max(open, close) + (decimal)(random.NextDouble() * 0.0006);
                decimal low = Math.Min(open, close) - (decimal)(random.NextDouble() * 0.0006);
                decimal volume = random.Next(200, 2500);
                currentTime = currentTime.AddMinutes(5);

                var completedCandle = new Candle(
                    "EURUSD",
                    Timeframe.M5,
                    currentTime,
                    open,
                    high,
                    low,
                    close,
                    volume,
                    isComplete: true);

                using (var scope = _serviceProvider.CreateScope())
                {
                    var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
                    _logger.LogInformation("[WORKER: SIMULATOR] Injecting synthetic M5 candle for EURUSD: O={O} H={H} L={L} C={C}",
                        open, high, low, close);

                    await mediator.Send(new IngestCandleCommand(completedCandle), stoppingToken);
                }
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[WORKER: SIMULATOR] Loop exception occurred.");
            }
        }

        await _streamer.StopAsync(stoppingToken);
    }

    private async Task SeedInitialDataAsync(IServiceProvider sp, CancellationToken ct)
    {
        var strategyRepo = sp.GetRequiredService<IStrategyRepository>();
        var candleBuffer = sp.GetRequiredService<ICandleBufferService>();

        // 1. Seed demonstration strategy if none exists
        var existing = await strategyRepo.GetAllAsync(ct);
        if (existing.Count == 0)
        {
            _logger.LogInformation("[WORKER: SEED] Seeding default production strategies...");

            // Strategy 1: Trend Following Bullish with Ichimoku Cloud & RSI Bounce
            string strategy1Rules = """
            {
              "combinator": "and",
              "rules": [
                { "field": "Close", "operator": ">", "value": "Ema50", "valueSource": "field" },
                { "field": "Close", "operator": ">", "value": "IchimokuSpanA", "valueSource": "field" },
                { "field": "Rsi14", "operator": ">", "value": 45 },
                { "field": "Close", "operator": ">", "value": "Open", "valueSource": "field" }
              ],
              "indicators": {
                "emas": [20, 50, 200],
                "smas": [20, 50, 200],
                "rsi": { "period": 14, "overbought": 70, "oversold": 30 },
                "macd": { "fast": 12, "slow": 26, "signal": 9 },
                "bollinger": { "period": 20, "stdDev": 2.0 },
                "stoch": { "kPeriod": 14, "dPeriod": 3, "smooth": 3 },
                "atr": { "period": 14, "slMultiplier": 1.5, "tpMultiplier": 3.0 },
                "adx": { "period": 14, "threshold": 25 },
                "ichimoku": { "tenkan": 9, "kijun": 26, "senkou": 52 }
              }
            }
            """;

            var strategy1 = new StrategyDefinition(
                "IchimokuTrendBuy",
                "Buys when price is above EMA50 and Ichimoku SpanA with RSI momentum confirmation",
                Timeframe.M5,
                strategy1Rules,
                autoTradingEnabled: true,
                aiValidationEnabled: true);

            await strategyRepo.AddAsync(strategy1, ct);

            // Strategy 2: Bearish Breakdown
            string strategy2Rules = """
            {
              "combinator": "and",
              "rules": [
                { "field": "Close", "operator": "<", "value": "Ema50", "valueSource": "field" },
                { "field": "Rsi14", "operator": "<", "value": 40 },
                { "field": "Close", "operator": "<", "value": "Open", "valueSource": "field" }
              ],
              "indicators": {
                "emas": [20, 50, 200],
                "smas": [20, 50, 200],
                "rsi": { "period": 14, "overbought": 70, "oversold": 30 },
                "macd": { "fast": 12, "slow": 26, "signal": 9 },
                "bollinger": { "period": 20, "stdDev": 2.0 },
                "stoch": { "kPeriod": 14, "dPeriod": 3, "smooth": 3 },
                "atr": { "period": 14, "slMultiplier": 1.5, "tpMultiplier": 3.0 },
                "adx": { "period": 14, "threshold": 25 },
                "ichimoku": { "tenkan": 9, "kijun": 26, "senkou": 52 }
              }
            }
            """;

            var strategy2 = new StrategyDefinition(
                "BearishBreakdownSell",
                "Sells when price closes below EMA50 with RSI bearish momentum",
                Timeframe.M5,
                strategy2Rules,
                autoTradingEnabled: true,
                aiValidationEnabled: false);

            await strategyRepo.AddAsync(strategy2, ct);
        }

        // Register configured indicator periods with indicator service
        var indicatorService = sp.GetService<IIndicatorCalculationService>();
        if (indicatorService != null)
        {
            var allStrategies = await strategyRepo.GetAllAsync(ct);
            foreach (var s in allStrategies)
            {
                var (emas, smas) = TradingPlatform.RulesEngine.JsonStrategyCompiler.ExtractConfiguredPeriods(s.RawJsonRules);
                indicatorService.RegisterIndicatorPeriods(emas, smas);
            }
        }

        // 2. Seed minimum 120 historical candles into sliding window
        _logger.LogInformation("[WORKER: SEED] Preloading 130 historical candles for EURUSD M5 into sliding window...");
        var historical = await _historicalDataProvider.GetHistoricalCandlesAsync("EURUSD", "M5", 130, ct);
        foreach (var c in historical)
        {
            candleBuffer.AppendCandle(c);
        }
        _logger.LogInformation("[WORKER: SEED] Sliding window preloaded with {Count} candles.", historical.Count);
    }
}
