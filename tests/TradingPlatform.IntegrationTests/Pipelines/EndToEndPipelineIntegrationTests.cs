using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TradingPlatform.Application;
using TradingPlatform.Broker.Oanda;
using TradingPlatform.Domain;
using TradingPlatform.Persistence;
using TradingPlatform.RulesEngine;
using Xunit;

namespace TradingPlatform.IntegrationTests;

public class EndToEndPipelineIntegrationTests
{
    private static IServiceProvider CreateIsolatedServiceProvider()
    {
        var services = new ServiceCollection();
        var uniqueDbName = $"TradingDb_{Guid.NewGuid():N}";

        var inMemorySettings = new Dictionary<string, string?>
        {
            { "Database:Provider", "InMemory" },
            { "Oanda:AccountId", "TEST_ACCOUNT_001" },
            { "Oanda:ApiToken", "TEST_TOKEN" },
            { "Oanda:Environment", "Practice" }
        };

        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();

        services.AddLogging();
        services.AddApplicationServices();
        
        // Register DbContext with isolated in-memory DB per test
        services.AddDbContext<TradingDbContext>(options =>
        {
            options.UseInMemoryDatabase(uniqueDbName);
        });
        services.AddScoped<ISignalAuditRepository, SignalAuditRepository>();
        services.AddScoped<IStrategyRepository, StrategyRepository>();
        services.AddScoped<ITradeRepository, TradeRepository>();
        services.AddScoped<IRiskProfileRepository, RiskProfileRepository>();

        services.AddRulesEngineServices();
        services.AddOandaBroker(configuration);

        return services.BuildServiceProvider();
    }

    [Fact]
    public async Task IngestCandle_TriggersCompleteEndToEndPipeline_SuccessfullyExecutesAndAudits()
    {
        var serviceProvider = CreateIsolatedServiceProvider();
        using var scope = serviceProvider.CreateScope();
        var sp = scope.ServiceProvider;

        var commandDispatcher = sp.GetRequiredService<ICommandDispatcher>();
        var strategyRepo = sp.GetRequiredService<IStrategyRepository>();
        var bufferService = sp.GetRequiredService<ICandleBufferService>();
        var db = sp.GetRequiredService<TradingDbContext>();

        // 1. Seed Strategy Definition: Buy when Close > Open and Close > Ema20
        string rules = """
        {
          "combinator": "and",
          "rules": [
            { "field": "Close", "operator": ">", "value": "Open", "valueSource": "field" },
            { "field": "Close", "operator": ">", "value": "Ema20", "valueSource": "field" }
          ]
        }
        """;

        var strategy = new StrategyDefinition(
            "TestTrendBuy",
            "Buys on bull candle above EMA20",
            Timeframe.M5,
            rules,
            autoTradingEnabled: true,
            aiValidationEnabled: false);

        await strategyRepo.AddAsync(strategy);

        // 2. Pre-seed 30 candles into buffer to ensure EMA20 is calculated
        var baseTime = DateTime.UtcNow.AddMinutes(-5 * 35);
        decimal price = 1.0500m;
        for (int i = 0; i < 30; i++)
        {
            price += 0.0002m;
            var c = new Candle("EURUSD", Timeframe.M5, baseTime.AddMinutes(5 * i), price - 0.0001m, price + 0.0003m, price - 0.0002m, price, 1000m, true);
            bufferService.AppendCandle(c);
        }

        // 3. Ingest a strongly bullish completed candle that satisfies the rule
        var triggerCandle = new Candle(
            "EURUSD",
            Timeframe.M5,
            DateTime.UtcNow,
            price,
            price + 0.0020m,
            price - 0.0005m,
            price + 0.0015m, // Close > Open and Close > EMA20
            2000m,
            isComplete: true);

        var snapshot = await commandDispatcher.DispatchAsync(new IngestCandleCommand(triggerCandle));

        // 4. Assertions
        Assert.NotNull(snapshot);
        Assert.NotNull(snapshot.Ema20);

        // Verify Trade Order persisted in database
        var orders = await db.TradeOrders.ToListAsync();
        Assert.NotEmpty(orders);
        var order = orders.FirstOrDefault(o => o.Symbol == "EURUSD");
        Assert.NotNull(order);
        Assert.Equal(OrderStatus.Open, order.Status);
        Assert.True(order.BrokerTicketId > 0);

        // Verify Position persisted
        var positions = await db.Positions.ToListAsync();
        Assert.NotEmpty(positions);
        Assert.Contains(positions, p => p.BrokerTicketId == order.BrokerTicketId);

        // Verify SignalAuditLog persisted with Dispatched state
        var audits = await db.SignalAuditLogs.ToListAsync();
        Assert.NotEmpty(audits);
        var audit = audits.FirstOrDefault(a => a.StrategyId == strategy.Id);
        Assert.NotNull(audit);
        Assert.Equal(SignalState.Dispatched, audit.State);
        Assert.False(string.IsNullOrWhiteSpace(audit.SignalFingerprint));
    }

    [Fact]
    public async Task Idempotency_DuplicateCandle_PreventsDuplicateOrderPersistence()
    {
        var serviceProvider = CreateIsolatedServiceProvider();
        using var scope = serviceProvider.CreateScope();
        var sp = scope.ServiceProvider;

        var commandDispatcher = sp.GetRequiredService<ICommandDispatcher>();
        var strategyRepo = sp.GetRequiredService<IStrategyRepository>();
        var db = sp.GetRequiredService<TradingDbContext>();

        string rules = """
        {
          "combinator": "and",
          "rules": [
            { "field": "Close", "operator": ">", "value": 0 }
          ]
        }
        """;

        var strategy = new StrategyDefinition("AlwaysBuy", "Test", Timeframe.M5, rules, true, false);
        await strategyRepo.AddAsync(strategy);

        var candleTime = new DateTime(2026, 10, 1, 12, 0, 0, DateTimeKind.Utc);
        var candle = new Candle("GBPUSD", Timeframe.M5, candleTime, 1.2500m, 1.2550m, 1.2490m, 1.2530m, 500m, true);

        // First ingestion -> executes trade
        await commandDispatcher.DispatchAsync(new IngestCandleCommand(candle));
        var initialOrdersCount = await db.TradeOrders.CountAsync(o => o.Symbol == "GBPUSD");
        Assert.Equal(1, initialOrdersCount);

        // Second ingestion with identical timestamp and symbol -> caught by idempotency fingerprint guard
        await commandDispatcher.DispatchAsync(new IngestCandleCommand(candle));
        var secondOrdersCount = await db.TradeOrders.CountAsync(o => o.Symbol == "GBPUSD");

        // Order count must remain 1!
        Assert.Equal(1, secondOrdersCount);
    }
}
