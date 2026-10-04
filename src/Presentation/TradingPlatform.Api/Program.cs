using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;
using TradingPlatform.Api.Hosting;
using TradingPlatform.Application;
using TradingPlatform.Application.Interfaces;
using TradingPlatform.Broker.Abstractions;
using TradingPlatform.Broker.Abstractions.Models;
using TradingPlatform.Broker.Oanda;
using TradingPlatform.Broker.Public;
using TradingPlatform.Domain.Entities;
using TradingPlatform.Domain.Enums;
using TradingPlatform.Domain.Models;
using TradingPlatform.Persistence;
using TradingPlatform.RulesEngine;

var builder = WebApplication.CreateBuilder(args);

// Configure Core Services
builder.Services.AddOpenApi();
builder.Services.AddApplicationServices();
builder.Services.AddPersistenceServices(builder.Configuration);
builder.Services.AddRulesEngineServices();
builder.Services.AddOandaBroker(builder.Configuration);
builder.Services.AddPublicMarketDataServices();
builder.Services.AddHostedService<SpaHostedService>();

// Configure HTTP JSON options to seamlessly handle string-based and numeric enums
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
    options.SerializerOptions.Converters.Add(new TimeframeJsonConverter());
});

var app = builder.Build();

// Auto-initialize database schema on startup (supports SQLite & InMemory for desktop & web)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TradingDbContext>();
    db.Database.EnsureCreated();
}

app.UseDefaultFiles();
app.UseStaticFiles();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// ----------------------------------------------------
// 1. Strategies Endpoints
// ----------------------------------------------------
var strategiesGroup = app.MapGroup("/api/strategies").WithTags("Strategies");

strategiesGroup.MapGet("/", async (IStrategyRepository repo, CancellationToken ct) =>
{
    var list = await repo.GetAllAsync(ct);
    return Results.Ok(list);
});

strategiesGroup.MapGet("/{id:guid}", async (IStrategyRepository repo, Guid id, CancellationToken ct) =>
{
    var strategy = await repo.GetByIdAsync(id, ct);
    return strategy != null ? Results.Ok(strategy) : Results.NotFound();
});

strategiesGroup.MapPost("/", async ([FromBody] CreateStrategyDto dto, IStrategyRepository repo, IIndicatorCalculationService indicatorCalc, CancellationToken ct) =>
{
    var strategy = new StrategyDefinition(
        dto.Name,
        dto.Description ?? string.Empty,
        dto.Timeframe,
        dto.RawJsonRules,
        dto.AutoTradingEnabled,
        dto.AiValidationEnabled);

    var (emas, smas) = JsonStrategyCompiler.ExtractConfiguredPeriods(dto.RawJsonRules);
    indicatorCalc.RegisterIndicatorPeriods(emas, smas);

    await repo.AddAsync(strategy, ct);
    return Results.Created($"/api/strategies/{strategy.Id}", strategy);
});

strategiesGroup.MapPut("/{id:guid}", async (Guid id, [FromBody] UpdateStrategyDto dto, IStrategyRepository repo, IIndicatorCalculationService indicatorCalc, CancellationToken ct) =>
{
    var strategy = await repo.GetByIdAsync(id, ct);
    if (strategy == null) return Results.NotFound();

    strategy.Name = dto.Name;
    strategy.Description = dto.Description ?? strategy.Description;
    strategy.Timeframe = dto.Timeframe;
    strategy.UpdateRules(dto.RawJsonRules);
    strategy.SetAutoTrading(dto.AutoTradingEnabled);
    strategy.AiValidationEnabled = dto.AiValidationEnabled;
    if (dto.IsActive) strategy.Activate(); else strategy.Deactivate();

    var (emas, smas) = JsonStrategyCompiler.ExtractConfiguredPeriods(dto.RawJsonRules);
    indicatorCalc.RegisterIndicatorPeriods(emas, smas);

    await repo.UpdateAsync(strategy, ct);
    return Results.Ok(strategy);
});

strategiesGroup.MapDelete("/{id:guid}", async (Guid id, IStrategyRepository repo, CancellationToken ct) =>
{
    var strategy = await repo.GetByIdAsync(id, ct);
    if (strategy == null) return Results.NotFound();

    await repo.DeleteAsync(id, ct);
    return Results.NoContent();
});

// ----------------------------------------------------
// 2. Signal Audit Logs & Near-Miss Endpoints
// ----------------------------------------------------
var auditsGroup = app.MapGroup("/api/audit-logs").WithTags("Audit Logs & Near-Misses");

auditsGroup.MapGet("/", async ([FromQuery] int? count, ISignalAuditRepository repo, CancellationToken ct) =>
{
    int limit = count.HasValue && count.Value > 0 ? count.Value : 50;
    var logs = await repo.GetRecentAsync(limit, ct);
    return Results.Ok(logs);
});

auditsGroup.MapGet("/{fingerprint}", async (string fingerprint, ISignalAuditRepository repo, CancellationToken ct) =>
{
    var log = await repo.GetByFingerprintAsync(fingerprint, ct);
    return log != null ? Results.Ok(log) : Results.NotFound();
});

// ----------------------------------------------------
// 3. Positions & Trade Execution Endpoints
// ----------------------------------------------------
var positionsGroup = app.MapGroup("/api/positions").WithTags("Positions");

positionsGroup.MapGet("/", async (ITradeRepository repo, CancellationToken ct) =>
{
    var positions = await repo.GetOpenPositionsAsync(ct);
    return Results.Ok(positions);
});

positionsGroup.MapPost("/{ticket:long}/close", async (long ticket, [FromQuery] string? reason, IOrderExecutionService broker, ITradeRepository tradeRepo, CancellationToken ct) =>
{
    var result = await broker.CloseOrderAsync(ticket, reason ?? "ManualApiClose", ct);
    if (!result.Success) return Results.BadRequest(result);

    var pos = await tradeRepo.GetPositionByTicketAsync(ticket, ct);
    if (pos != null)
    {
        pos.Close();
        await tradeRepo.UpdatePositionAsync(pos, ct);
    }

    var order = await tradeRepo.GetOrderByTicketAsync(ticket, ct);
    if (order != null)
    {
        order.Close(result.ExecutedPrice, ExitReason.ManualClose);
        await tradeRepo.UpdateOrderAsync(order, ct);
    }

    return Results.Ok(result);
});

positionsGroup.MapPost("/order", async ([FromBody] PlaceManualOrderDto dto, IOrderExecutionService broker, ITradeRepository tradeRepo, CancellationToken ct) =>
{
    var orderRequest = new OrderRequest(
        dto.Symbol,
        dto.OrderType,
        dto.Lots > 0 ? dto.Lots : 0.1m,
        dto.Price,
        dto.StopLoss,
        dto.TakeProfit,
        "ManualTradingView",
        Guid.NewGuid().ToString("N"));

    var result = await broker.OpenOrderAsync(orderRequest, ct);
    if (!result.Success) return Results.BadRequest(result);

    var position = new Position(
        result.BrokerTicketId,
        dto.Symbol,
        dto.OrderType,
        result.Lots,
        result.ExecutedPrice,
        dto.StopLoss,
        dto.TakeProfit);

    await tradeRepo.AddPositionAsync(position, ct);
    return Results.Ok(result);
});

positionsGroup.MapPost("/{ticket:long}/modify", async (long ticket, [FromBody] ModifyPositionDto dto, IOrderExecutionService broker, ITradeRepository tradeRepo, CancellationToken ct) =>
{
    var result = await broker.ModifyOrderAsync(ticket, dto.StopLoss, dto.TakeProfit, ct);
    if (!result.Success) return Results.BadRequest(result);

    var pos = await tradeRepo.GetPositionByTicketAsync(ticket, ct);
    if (pos != null)
    {
        pos.UpdateProtection(dto.StopLoss, dto.TakeProfit);
        await tradeRepo.UpdatePositionAsync(pos, ct);
    }

    var order = await tradeRepo.GetOrderByTicketAsync(ticket, ct);
    if (order != null)
    {
        order.UpdateProtection(dto.StopLoss, dto.TakeProfit);
        await tradeRepo.UpdateOrderAsync(order, ct);
    }

    return Results.Ok(new { success = true, ticket, stopLoss = dto.StopLoss, takeProfit = dto.TakeProfit });
});

// ----------------------------------------------------
// 4. Risk Profile & Kill Switch Endpoints
// ----------------------------------------------------
var riskGroup = app.MapGroup("/api/risk").WithTags("Risk Management");

riskGroup.MapGet("/", async (IRiskProfileRepository repo, CancellationToken ct) =>
{
    var profile = await repo.GetOrCreateProfileAsync(ct);
    return Results.Ok(profile);
});

riskGroup.MapPost("/kill-switch", async ([FromBody] KillSwitchToggleDto dto, IRiskProfileRepository repo, IOrderExecutionService broker, ITradeRepository tradeRepo, CancellationToken ct) =>
{
    var profile = await repo.GetOrCreateProfileAsync(ct);
    if (dto.Engage)
    {
        profile.EngageKillSwitch(dto.Reason ?? "Manual intervention via API");
        await repo.UpdateProfileAsync(profile, ct);

        // Liquidate open positions
        var openPositions = (await broker.GetOpenPositionsAsync(ct)).ToList();
        foreach (var p in openPositions)
        {
            await broker.CloseOrderAsync(p.TicketId, "Manual_KillSwitch_Engaged", ct);
            var dbPos = await tradeRepo.GetPositionByTicketAsync(p.TicketId, ct);
            if (dbPos != null)
            {
                dbPos.Close();
                await tradeRepo.UpdatePositionAsync(dbPos, ct);
            }
        }
    }
    else
    {
        profile.ResetKillSwitch();
        await repo.UpdateProfileAsync(profile, ct);
    }

    return Results.Ok(profile);
});

// ----------------------------------------------------
// 5. Account & Heartbeat Endpoints
// ----------------------------------------------------
app.MapGet("/api/account", async (IOrderExecutionService broker, CancellationToken ct) =>
{
    var summary = await broker.GetAccountSummaryAsync(ct);
    return Results.Ok(summary);
}).WithTags("Account");

// ----------------------------------------------------
// 6. Candle Simulation / Ingestion Testing Endpoint
// ----------------------------------------------------
app.MapPost("/api/simulation/candle", async ([FromBody] IngestCandleDto dto, ICandleIngestionService ingestionService, CancellationToken ct) =>
{
    var candle = new Candle(
        dto.Symbol,
        dto.Timeframe,
        dto.Timestamp ?? DateTime.UtcNow,
        dto.Open,
        dto.High,
        dto.Low,
        dto.Close,
        dto.Volume,
        dto.IsComplete);

    var snapshot = await ingestionService.IngestCandleAsync(candle, ct);
    return Results.Ok(new
    {
        CandleIngested = candle,
        GeneratedSnapshot = snapshot,
        EvaluationTriggered = candle.IsComplete
    });
}).WithTags("Simulation");

// ----------------------------------------------------
// 7. Market Data & Multi-Timeframe Feeds
// ----------------------------------------------------
var marketDataGroup = app.MapGroup("/api/market-data").WithTags("Market Data");

marketDataGroup.MapGet("/candles", async (
    [FromQuery] string? symbol,
    [FromQuery] string? timeframe,
    [FromQuery] int? count,
    [FromQuery] long? before,
    IHistoricalDataProvider dataProvider,
    CancellationToken ct) =>
{
    string sym = string.IsNullOrWhiteSpace(symbol) ? "EURUSD" : symbol.Trim().ToUpperInvariant();
    string tf = string.IsNullOrWhiteSpace(timeframe) ? "M5" : timeframe.Trim().ToUpperInvariant();
    int limit = count.HasValue && count.Value > 0 ? count.Value : 120;

    if (before.HasValue && before.Value > 0)
    {
        var beforeUtc = DateTimeOffset.FromUnixTimeSeconds(before.Value).UtcDateTime;
        var olderCandles = await dataProvider.GetHistoricalCandlesBeforeAsync(sym, tf, limit, beforeUtc, ct);
        return Results.Ok(olderCandles);
    }

    var candles = await dataProvider.GetHistoricalCandlesAsync(sym, tf, limit, ct);
    return Results.Ok(candles);
});

marketDataGroup.MapGet("/providers", async (
    IBrokerConfigurationRepository repo,
    YahooFinanceSessionManager sessionManager,
    CancellationToken ct) =>
{
    var config = await repo.GetConfigurationAsync(ct);
    var providers = new[]
    {
        new
        {
            Id = "KeylessPublic",
            Name = "Keyless Public (Yahoo Finance FX + Binance Crypto)",
            Description = "100% Free, zero-setup, multi-timeframe candles (~1m delay). Authenticated Crumb Session & Auto-Failover active.",
            RequiresKey = false,
            IsConfigured = true,
            SupportedTimeframes = new[] { "M1", "M5", "M15", "M30", "H1", "D1", "W1", "MN1" }
        },
        new
        {
            Id = "Oanda",
            Name = "OANDA v20 REST & Streaming",
            Description = "Direct broker institutional feed & order execution for Practice and Live accounts.",
            RequiresKey = true,
            IsConfigured = !string.IsNullOrWhiteSpace(config.OandaApiToken) && !string.IsNullOrWhiteSpace(config.OandaAccountId),
            SupportedTimeframes = new[] { "M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1", "MN1" }
        },
        new
        {
            Id = "ZeroMQ",
            Name = "MetaTrader 5 ZeroMQ Bridge",
            Description = "Connects to a running desktop MetaTrader 5 terminal with zero latency over local NetMQ.",
            RequiresKey = false,
            IsConfigured = true,
            SupportedTimeframes = new[] { "M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1", "MN1" }
        },
        new
        {
            Id = "Synthetic",
            Name = "Offline Simulation Sandbox",
            Description = "Standalone synthetic market generator with zero external network dependencies.",
            RequiresKey = false,
            IsConfigured = true,
            SupportedTimeframes = new[] { "M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1", "MN1" }
        }
    };

    return Results.Ok(new
    {
        ActiveProvider = config.ActiveProvider,
        YahooSession = sessionManager.StatusSummary,
        Providers = providers
    });
});

marketDataGroup.MapGet("/health", async (
    IBrokerConfigurationRepository repo,
    YahooFinanceSessionManager sessionManager,
    CancellationToken ct) =>
{
    var config = await repo.GetConfigurationAsync(ct);
    var health = CompositeMarketDataProvider.GetHealthStatus(config.ActiveProvider ?? "KeylessPublic", sessionManager.StatusSummary);
    return Results.Ok(health);
});

marketDataGroup.MapGet("/symbols", async (
    [FromQuery] string? provider,
    [FromQuery] string? category,
    [FromQuery] string? search,
    IBrokerConfigurationRepository repo,
    CancellationToken ct) =>
{
    var config = await repo.GetConfigurationAsync(ct);
    string activeProv = config.ActiveProvider ?? "KeylessPublic";

    var allSymbols = new[]
    {
        // ---------------- Indices ----------------
        new {
            Symbol = "US500",
            Name = "S&P 500 Index",
            Aliases = new[] { "SPX", "S&P 500", "SP500", "^GSPC" },
            Category = "indices",
            Exchange = "CBOE / NYSE",
            Price = "5,782.40",
            Change = "+0.52%",
            IsPositive = true,
            SpreadPips = "0.5",
            TradingHours = "US Market (09:30 - 16:00 ET)",
            SupportedProviders = new[] { "KeylessPublic", "Oanda", "ZeroMQ", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "^GSPC (Yahoo Finance)",
                ["Oanda"] = "SPX500_USD",
                ["ZeroMQ"] = "US500",
                ["Synthetic"] = "US500"
            },
            Description = "Standard & Poor's 500 benchmark index of 500 top US corporations."
        },
        new {
            Symbol = "NAS100",
            Name = "Nasdaq 100 Index",
            Aliases = new[] { "NDX", "NASDAQ", "US100", "^IXIC", "QQQ" },
            Category = "indices",
            Exchange = "NASDAQ",
            Price = "20,140.50",
            Change = "+0.88%",
            IsPositive = true,
            SpreadPips = "1.0",
            TradingHours = "US Market (09:30 - 16:00 ET)",
            SupportedProviders = new[] { "KeylessPublic", "Oanda", "ZeroMQ", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "^IXIC (Yahoo Finance)",
                ["Oanda"] = "NAS100_USD",
                ["ZeroMQ"] = "NAS100",
                ["Synthetic"] = "NAS100"
            },
            Description = "Top 100 non-financial tech, biotechnology, and growth innovators."
        },
        new {
            Symbol = "US30",
            Name = "Dow Jones Industrial Average",
            Aliases = new[] { "DJI", "DOW", "WALL STREET 30", "^DJI" },
            Category = "indices",
            Exchange = "NYSE",
            Price = "42,352.00",
            Change = "+0.35%",
            IsPositive = true,
            SpreadPips = "1.5",
            TradingHours = "US Market (09:30 - 16:00 ET)",
            SupportedProviders = new[] { "KeylessPublic", "Oanda", "ZeroMQ", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "^DJI (Yahoo Finance)",
                ["Oanda"] = "US30_USD",
                ["ZeroMQ"] = "US30",
                ["Synthetic"] = "US30"
            },
            Description = "Price-weighted benchmark of 30 blue-chip American industry giants."
        },
        new {
            Symbol = "GER40",
            Name = "DAX 40 Index",
            Aliases = new[] { "DAX", "DE40", "GERMANY 40", "^GDAXI" },
            Category = "indices",
            Exchange = "XETRA",
            Price = "19,450.20",
            Change = "+0.28%",
            IsPositive = true,
            SpreadPips = "1.2",
            TradingHours = "European Market (09:00 - 17:30 CET)",
            SupportedProviders = new[] { "KeylessPublic", "Oanda", "ZeroMQ", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "^GDAXI (Yahoo Finance)",
                ["Oanda"] = "DE30_EUR",
                ["ZeroMQ"] = "GER40",
                ["Synthetic"] = "GER40"
            },
            Description = "The 40 major German blue chip companies trading on the Frankfurt Stock Exchange."
        },
        new {
            Symbol = "UK100",
            Name = "FTSE 100 Index",
            Aliases = new[] { "FTSE", "UK100_GBP", "^FTSE" },
            Category = "indices",
            Exchange = "LSE",
            Price = "8,324.50",
            Change = "-0.15%",
            IsPositive = false,
            SpreadPips = "1.0",
            TradingHours = "London Market (08:00 - 16:30 GMT)",
            SupportedProviders = new[] { "KeylessPublic", "Oanda", "ZeroMQ", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "^FTSE (Yahoo Finance)",
                ["Oanda"] = "UK100_GBP",
                ["ZeroMQ"] = "UK100",
                ["Synthetic"] = "UK100"
            },
            Description = "100 highest market capitalization companies listed on the London Stock Exchange."
        },
        new {
            Symbol = "JP225",
            Name = "Nikkei 225 Index",
            Aliases = new[] { "NIKKEI", "JP225_USD", "^N225" },
            Category = "indices",
            Exchange = "JPX",
            Price = "38,650.00",
            Change = "+1.12%",
            IsPositive = true,
            SpreadPips = "3.0",
            TradingHours = "Tokyo Market (09:00 - 15:00 JST)",
            SupportedProviders = new[] { "KeylessPublic", "Oanda", "ZeroMQ", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "^N225 (Yahoo Finance)",
                ["Oanda"] = "JP225_USD",
                ["ZeroMQ"] = "JP225",
                ["Synthetic"] = "JP225"
            },
            Description = "Price-weighted index for the Tokyo Stock Exchange."
        },
        new {
            Symbol = "US2000",
            Name = "Russell 2000 Index",
            Aliases = new[] { "RUT", "RUSSELL", "^RUT" },
            Category = "indices",
            Exchange = "CBOE",
            Price = "2,215.40",
            Change = "+0.42%",
            IsPositive = true,
            SpreadPips = "0.8",
            TradingHours = "US Market (09:30 - 16:00 ET)",
            SupportedProviders = new[] { "KeylessPublic", "Oanda", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "^RUT (Yahoo Finance)",
                ["Oanda"] = "US2000_USD",
                ["Synthetic"] = "US2000"
            },
            Description = "Small-cap benchmark tracking approximately 2,000 small US companies."
        },

        // ---------------- Commodities ----------------
        new {
            Symbol = "XAUUSD",
            Name = "Gold / US Dollar",
            Aliases = new[] { "GOLD", "XAU_USD", "GC=F" },
            Category = "commodities",
            Exchange = "COMEX / Spot",
            Price = "2,654.80",
            Change = "+0.74%",
            IsPositive = true,
            SpreadPips = "2.0",
            TradingHours = "24/5 (Mon-Fri)",
            SupportedProviders = new[] { "KeylessPublic", "Oanda", "ZeroMQ", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "GC=F (Yahoo Finance)",
                ["Oanda"] = "XAU_USD",
                ["ZeroMQ"] = "GOLD",
                ["Synthetic"] = "XAUUSD"
            },
            Description = "Physical Gold spot commodity priced in US Dollars per troy ounce."
        },
        new {
            Symbol = "XAGUSD",
            Name = "Silver / US Dollar",
            Aliases = new[] { "SILVER", "XAG_USD", "SI=F" },
            Category = "commodities",
            Exchange = "COMEX / Spot",
            Price = "31.85",
            Change = "+1.15%",
            IsPositive = true,
            SpreadPips = "1.8",
            TradingHours = "24/5 (Mon-Fri)",
            SupportedProviders = new[] { "KeylessPublic", "Oanda", "ZeroMQ", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "SI=F (Yahoo Finance)",
                ["Oanda"] = "XAG_USD",
                ["ZeroMQ"] = "SILVER",
                ["Synthetic"] = "XAGUSD"
            },
            Description = "Physical Silver spot commodity priced in US Dollars per troy ounce."
        },
        new {
            Symbol = "USOIL",
            Name = "WTI Crude Oil",
            Aliases = new[] { "WTI", "CRUDE", "OIL", "CL=F", "WTICO_USD" },
            Category = "commodities",
            Exchange = "NYMEX",
            Price = "71.50",
            Change = "-1.40%",
            IsPositive = false,
            SpreadPips = "2.5",
            TradingHours = "24/5 (Mon-Fri)",
            SupportedProviders = new[] { "KeylessPublic", "Oanda", "ZeroMQ", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "CL=F (Yahoo Finance)",
                ["Oanda"] = "WTICO_USD",
                ["ZeroMQ"] = "USOIL",
                ["Synthetic"] = "USOIL"
            },
            Description = "West Texas Intermediate light sweet crude oil futures."
        },
        new {
            Symbol = "UKOIL",
            Name = "Brent Crude Oil",
            Aliases = new[] { "BRENT", "BCO_USD", "BZ=F" },
            Category = "commodities",
            Exchange = "ICE",
            Price = "75.20",
            Change = "-1.10%",
            IsPositive = false,
            SpreadPips = "2.5",
            TradingHours = "24/5 (Mon-Fri)",
            SupportedProviders = new[] { "KeylessPublic", "Oanda", "ZeroMQ", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "BZ=F (Yahoo Finance)",
                ["Oanda"] = "BCO_USD",
                ["ZeroMQ"] = "UKOIL",
                ["Synthetic"] = "UKOIL"
            },
            Description = "North Sea Brent blend crude oil global pricing standard."
        },
        new {
            Symbol = "NATGAS",
            Name = "Natural Gas",
            Aliases = new[] { "NG", "NATGAS_USD", "NG=F" },
            Category = "commodities",
            Exchange = "NYMEX",
            Price = "2.85",
            Change = "+2.10%",
            IsPositive = true,
            SpreadPips = "3.0",
            TradingHours = "24/5 (Mon-Fri)",
            SupportedProviders = new[] { "KeylessPublic", "Oanda", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "NG=F (Yahoo Finance)",
                ["Oanda"] = "NATGAS_USD",
                ["Synthetic"] = "NATGAS"
            },
            Description = "Henry Hub Louisiana natural gas futures."
        },
        new {
            Symbol = "COPPER",
            Name = "High Grade Copper",
            Aliases = new[] { "HG", "COPPER_USD", "HG=F" },
            Category = "commodities",
            Exchange = "COMEX",
            Price = "4.32",
            Change = "+0.65%",
            IsPositive = true,
            SpreadPips = "2.0",
            TradingHours = "24/5 (Mon-Fri)",
            SupportedProviders = new[] { "KeylessPublic", "Oanda", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "HG=F (Yahoo Finance)",
                ["Oanda"] = "COPPER_USD",
                ["Synthetic"] = "COPPER"
            },
            Description = "Industrial copper futures benchmark contract."
        },

        // ---------------- Forex ----------------
        new {
            Symbol = "EURUSD",
            Name = "Euro / US Dollar",
            Aliases = new[] { "EUR_USD", "EUR/USD" },
            Category = "forex",
            Exchange = "FX Interbank",
            Price = "1.08520",
            Change = "+0.18%",
            IsPositive = true,
            SpreadPips = "0.6",
            TradingHours = "24/5 (Sun 17:00 - Fri 17:00 ET)",
            SupportedProviders = new[] { "KeylessPublic", "Oanda", "ZeroMQ", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "EURUSD=X (Yahoo)",
                ["Oanda"] = "EUR_USD",
                ["ZeroMQ"] = "EURUSD",
                ["Synthetic"] = "EURUSD"
            },
            Description = "World's most actively traded currency pair with highest market liquidity."
        },
        new {
            Symbol = "GBPUSD",
            Name = "British Pound / US Dollar",
            Aliases = new[] { "GBP_USD", "GBP/USD", "CABLE" },
            Category = "forex",
            Exchange = "FX Interbank",
            Price = "1.26420",
            Change = "-0.12%",
            IsPositive = false,
            SpreadPips = "0.8",
            TradingHours = "24/5 (Sun 17:00 - Fri 17:00 ET)",
            SupportedProviders = new[] { "KeylessPublic", "Oanda", "ZeroMQ", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "GBPUSD=X (Yahoo)",
                ["Oanda"] = "GBP_USD",
                ["ZeroMQ"] = "GBPUSD",
                ["Synthetic"] = "GBPUSD"
            },
            Description = "The Cable: historical liquidity benchmark between London and New York."
        },
        new {
            Symbol = "USDJPY",
            Name = "US Dollar / Japanese Yen",
            Aliases = new[] { "USD_JPY", "USD/JPY" },
            Category = "forex",
            Exchange = "FX Interbank",
            Price = "154.210",
            Change = "+0.45%",
            IsPositive = true,
            SpreadPips = "0.7",
            TradingHours = "24/5 (Sun 17:00 - Fri 17:00 ET)",
            SupportedProviders = new[] { "KeylessPublic", "Oanda", "ZeroMQ", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "USDJPY=X (Yahoo)",
                ["Oanda"] = "USD_JPY",
                ["ZeroMQ"] = "USDJPY",
                ["Synthetic"] = "USDJPY"
            },
            Description = "Primary Asian session liquidity hub and safe haven currency pair."
        },
        new {
            Symbol = "AUDUSD",
            Name = "Australian Dollar / US Dollar",
            Aliases = new[] { "AUD_USD", "AUD/USD", "AUSSIE" },
            Category = "forex",
            Exchange = "FX Interbank",
            Price = "0.65340",
            Change = "+0.04%",
            IsPositive = true,
            SpreadPips = "0.9",
            TradingHours = "24/5 (Sun 17:00 - Fri 17:00 ET)",
            SupportedProviders = new[] { "KeylessPublic", "Oanda", "ZeroMQ", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "AUDUSD=X (Yahoo)",
                ["Oanda"] = "AUD_USD",
                ["ZeroMQ"] = "AUDUSD",
                ["Synthetic"] = "AUDUSD"
            },
            Description = "Key commodity currency influenced heavily by mining and Asia-Pacific trade."
        },
        new {
            Symbol = "USDCAD",
            Name = "US Dollar / Canadian Dollar",
            Aliases = new[] { "USD_CAD", "USD/CAD", "LOONIE" },
            Category = "forex",
            Exchange = "FX Interbank",
            Price = "1.38120",
            Change = "-0.22%",
            IsPositive = false,
            SpreadPips = "1.1",
            TradingHours = "24/5 (Sun 17:00 - Fri 17:00 ET)",
            SupportedProviders = new[] { "KeylessPublic", "Oanda", "ZeroMQ", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "USDCAD=X (Yahoo)",
                ["Oanda"] = "USD_CAD",
                ["ZeroMQ"] = "USDCAD",
                ["Synthetic"] = "USDCAD"
            },
            Description = "Cross-border North American trade proxy strongly correlated with oil prices."
        },
        new {
            Symbol = "USDCHF",
            Name = "US Dollar / Swiss Franc",
            Aliases = new[] { "USD_CHF", "USD/CHF", "SWISSIE" },
            Category = "forex",
            Exchange = "FX Interbank",
            Price = "0.90230",
            Change = "+0.10%",
            IsPositive = true,
            SpreadPips = "1.0",
            TradingHours = "24/5 (Sun 17:00 - Fri 17:00 ET)",
            SupportedProviders = new[] { "KeylessPublic", "Oanda", "ZeroMQ", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "USDCHF=X (Yahoo)",
                ["Oanda"] = "USD_CHF",
                ["ZeroMQ"] = "USDCHF",
                ["Synthetic"] = "USDCHF"
            },
            Description = "Classic safe haven and banking reserve currency pair."
        },
        new {
            Symbol = "NZDUSD",
            Name = "New Zealand Dollar / US Dollar",
            Aliases = new[] { "NZD_USD", "NZD/USD", "KIWI" },
            Category = "forex",
            Exchange = "FX Interbank",
            Price = "0.59840",
            Change = "-0.08%",
            IsPositive = false,
            SpreadPips = "1.2",
            TradingHours = "24/5 (Sun 17:00 - Fri 17:00 ET)",
            SupportedProviders = new[] { "KeylessPublic", "Oanda", "ZeroMQ", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "NZDUSD=X (Yahoo)",
                ["Oanda"] = "NZD_USD",
                ["ZeroMQ"] = "NZDUSD",
                ["Synthetic"] = "NZDUSD"
            },
            Description = "The Kiwi: dairy export driven Pacific currency pair."
        },
        new {
            Symbol = "EURGBP",
            Name = "Euro / British Pound",
            Aliases = new[] { "EUR_GBP", "EUR/GBP" },
            Category = "forex",
            Exchange = "FX Interbank",
            Price = "0.85840",
            Change = "+0.25%",
            IsPositive = true,
            SpreadPips = "0.9",
            TradingHours = "24/5 (Sun 17:00 - Fri 17:00 ET)",
            SupportedProviders = new[] { "KeylessPublic", "Oanda", "ZeroMQ", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "EURGBP=X (Yahoo)",
                ["Oanda"] = "EUR_GBP",
                ["ZeroMQ"] = "EURGBP",
                ["Synthetic"] = "EURGBP"
            },
            Description = "Major European cross pair capturing policy divergence between ECB and BOE."
        },
        new {
            Symbol = "EURJPY",
            Name = "Euro / Japanese Yen",
            Aliases = new[] { "EUR_JPY", "EUR/JPY" },
            Category = "forex",
            Exchange = "FX Interbank",
            Price = "167.350",
            Change = "+0.62%",
            IsPositive = true,
            SpreadPips = "1.2",
            TradingHours = "24/5 (Sun 17:00 - Fri 17:00 ET)",
            SupportedProviders = new[] { "KeylessPublic", "Oanda", "ZeroMQ", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "EURJPY=X (Yahoo)",
                ["Oanda"] = "EUR_JPY",
                ["ZeroMQ"] = "EURJPY",
                ["Synthetic"] = "EURJPY"
            },
            Description = "High-beta carry trade pair with rapid volatility swings."
        },
        new {
            Symbol = "GBPJPY",
            Name = "British Pound / Japanese Yen",
            Aliases = new[] { "GBP_JPY", "GBP/JPY", "THE BEAST", "GEPPY" },
            Category = "forex",
            Exchange = "FX Interbank",
            Price = "194.920",
            Change = "+0.33%",
            IsPositive = true,
            SpreadPips = "1.4",
            TradingHours = "24/5 (Sun 17:00 - Fri 17:00 ET)",
            SupportedProviders = new[] { "KeylessPublic", "Oanda", "ZeroMQ", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "GBPJPY=X (Yahoo)",
                ["Oanda"] = "GBP_JPY",
                ["ZeroMQ"] = "GBPJPY",
                ["Synthetic"] = "GBPJPY"
            },
            Description = "Known as The Dragon / The Beast for massive intraday momentum swings."
        },

        // ---------------- Crypto (24/7 Keyless Binance Public) ----------------
        new {
            Symbol = "BTCUSDT",
            Name = "Bitcoin / Tether USD",
            Aliases = new[] { "BTC", "BITCOIN", "BTC-USD", "BTCUSD" },
            Category = "crypto",
            Exchange = "Binance / 24/7",
            Price = "68,450.00",
            Change = "+1.85%",
            IsPositive = true,
            SpreadPips = "0.1",
            TradingHours = "24/7 Continuous",
            SupportedProviders = new[] { "KeylessPublic", "ZeroMQ", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "BTCUSDT (Binance 24/7)",
                ["ZeroMQ"] = "BTCUSD",
                ["Synthetic"] = "BTCUSDT"
            },
            Description = "The premier decentralized digital asset and store-of-value crypto."
        },
        new {
            Symbol = "ETHUSDT",
            Name = "Ethereum / Tether USD",
            Aliases = new[] { "ETH", "ETHEREUM", "ETH-USD", "ETHUSD" },
            Category = "crypto",
            Exchange = "Binance / 24/7",
            Price = "3,520.50",
            Change = "+0.95%",
            IsPositive = true,
            SpreadPips = "0.2",
            TradingHours = "24/7 Continuous",
            SupportedProviders = new[] { "KeylessPublic", "ZeroMQ", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "ETHUSDT (Binance 24/7)",
                ["ZeroMQ"] = "ETHUSD",
                ["Synthetic"] = "ETHUSDT"
            },
            Description = "Leading smart-contract blockchain powering decentralized finance."
        },
        new {
            Symbol = "SOLUSDT",
            Name = "Solana / Tether USD",
            Aliases = new[] { "SOL", "SOLANA", "SOL-USD" },
            Category = "crypto",
            Exchange = "Binance / 24/7",
            Price = "178.40",
            Change = "+4.20%",
            IsPositive = true,
            SpreadPips = "0.2",
            TradingHours = "24/7 Continuous",
            SupportedProviders = new[] { "KeylessPublic", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "SOLUSDT (Binance 24/7)",
                ["Synthetic"] = "SOLUSDT"
            },
            Description = "High-throughput Layer 1 blockchain optimized for sub-second settlement."
        },
        new {
            Symbol = "BNBUSDT",
            Name = "BNB / Tether USD",
            Aliases = new[] { "BNB", "BINANCE COIN" },
            Category = "crypto",
            Exchange = "Binance / 24/7",
            Price = "585.10",
            Change = "-0.30%",
            IsPositive = false,
            SpreadPips = "0.3",
            TradingHours = "24/7 Continuous",
            SupportedProviders = new[] { "KeylessPublic", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "BNBUSDT (Binance 24/7)",
                ["Synthetic"] = "BNBUSDT"
            },
            Description = "Native gas token of the BNB Chain ecosystem."
        },
        new {
            Symbol = "XRPUSDT",
            Name = "XRP / Tether USD",
            Aliases = new[] { "XRP", "RIPPLE" },
            Category = "crypto",
            Exchange = "Binance / 24/7",
            Price = "0.5840",
            Change = "+0.80%",
            IsPositive = true,
            SpreadPips = "0.01",
            TradingHours = "24/7 Continuous",
            SupportedProviders = new[] { "KeylessPublic", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "XRPUSDT (Binance 24/7)",
                ["Synthetic"] = "XRPUSDT"
            },
            Description = "Enterprise digital asset designed for global cross-border remittances."
        },
        new {
            Symbol = "ADAUSDT",
            Name = "Cardano / Tether USD",
            Aliases = new[] { "ADA", "CARDANO" },
            Category = "crypto",
            Exchange = "Binance / 24/7",
            Price = "0.3540",
            Change = "+1.10%",
            IsPositive = true,
            SpreadPips = "0.01",
            TradingHours = "24/7 Continuous",
            SupportedProviders = new[] { "KeylessPublic", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "ADAUSDT (Binance 24/7)",
                ["Synthetic"] = "ADAUSDT"
            },
            Description = "Proof-of-stake blockchain network based on peer-reviewed research."
        },
        new {
            Symbol = "DOGEUSDT",
            Name = "Dogecoin / Tether USD",
            Aliases = new[] { "DOGE", "DOGECOIN" },
            Category = "crypto",
            Exchange = "Binance / 24/7",
            Price = "0.1140",
            Change = "+2.45%",
            IsPositive = true,
            SpreadPips = "0.01",
            TradingHours = "24/7 Continuous",
            SupportedProviders = new[] { "KeylessPublic", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "DOGEUSDT (Binance 24/7)",
                ["Synthetic"] = "DOGEUSDT"
            },
            Description = "Decentralized peer-to-peer digital currency popularized globally."
        },
        new {
            Symbol = "AVAXUSDT",
            Name = "Avalanche / Tether USD",
            Aliases = new[] { "AVAX", "AVALANCHE" },
            Category = "crypto",
            Exchange = "Binance / 24/7",
            Price = "28.60",
            Change = "+1.75%",
            IsPositive = true,
            SpreadPips = "0.05",
            TradingHours = "24/7 Continuous",
            SupportedProviders = new[] { "KeylessPublic", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "AVAXUSDT (Binance 24/7)",
                ["Synthetic"] = "AVAXUSDT"
            },
            Description = "High-speed smart contract platform built for scalable enterprise dApps."
        },
        new {
            Symbol = "LINKUSDT",
            Name = "Chainlink / Tether USD",
            Aliases = new[] { "LINK", "CHAINLINK" },
            Category = "crypto",
            Exchange = "Binance / 24/7",
            Price = "11.80",
            Change = "+0.60%",
            IsPositive = true,
            SpreadPips = "0.02",
            TradingHours = "24/7 Continuous",
            SupportedProviders = new[] { "KeylessPublic", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "LINKUSDT (Binance 24/7)",
                ["Synthetic"] = "LINKUSDT"
            },
            Description = "Decentralized oracle network connecting smart contracts to off-chain data."
        },

        // ---------------- Prominent Stocks (Keyless Yahoo Finance) ----------------
        new {
            Symbol = "AAPL",
            Name = "Apple Inc.",
            Aliases = new[] { "APPLE", "NASDAQ:AAPL" },
            Category = "stocks",
            Exchange = "NASDAQ",
            Price = "232.50",
            Change = "+0.65%",
            IsPositive = true,
            SpreadPips = "0.05",
            TradingHours = "US Market (09:30 - 16:00 ET)",
            SupportedProviders = new[] { "KeylessPublic", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "AAPL (Yahoo Finance)",
                ["Synthetic"] = "AAPL"
            },
            Description = "Consumer electronics, personal computing, and digital services giant."
        },
        new {
            Symbol = "MSFT",
            Name = "Microsoft Corporation",
            Aliases = new[] { "MICROSOFT", "NASDAQ:MSFT" },
            Category = "stocks",
            Exchange = "NASDAQ",
            Price = "428.15",
            Change = "+0.42%",
            IsPositive = true,
            SpreadPips = "0.08",
            TradingHours = "US Market (09:30 - 16:00 ET)",
            SupportedProviders = new[] { "KeylessPublic", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "MSFT (Yahoo Finance)",
                ["Synthetic"] = "MSFT"
            },
            Description = "Global enterprise software, Azure cloud computing, and AI pioneer."
        },
        new {
            Symbol = "NVDA",
            Name = "NVIDIA Corporation",
            Aliases = new[] { "NVIDIA", "NASDAQ:NVDA" },
            Category = "stocks",
            Exchange = "NASDAQ",
            Price = "126.40",
            Change = "+2.15%",
            IsPositive = true,
            SpreadPips = "0.04",
            TradingHours = "US Market (09:30 - 16:00 ET)",
            SupportedProviders = new[] { "KeylessPublic", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "NVDA (Yahoo Finance)",
                ["Synthetic"] = "NVDA"
            },
            Description = "Leading accelerator and GPU hardware architecture powering generative AI."
        },
        new {
            Symbol = "TSLA",
            Name = "Tesla, Inc.",
            Aliases = new[] { "TESLA", "NASDAQ:TSLA" },
            Category = "stocks",
            Exchange = "NASDAQ",
            Price = "254.20",
            Change = "-1.20%",
            IsPositive = false,
            SpreadPips = "0.10",
            TradingHours = "US Market (09:30 - 16:00 ET)",
            SupportedProviders = new[] { "KeylessPublic", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "TSLA (Yahoo Finance)",
                ["Synthetic"] = "TSLA"
            },
            Description = "Electric vehicles, stationary battery energy storage, and robotics."
        },
        new {
            Symbol = "AMZN",
            Name = "Amazon.com, Inc.",
            Aliases = new[] { "AMAZON", "NASDAQ:AMZN" },
            Category = "stocks",
            Exchange = "NASDAQ",
            Price = "185.60",
            Change = "+0.85%",
            IsPositive = true,
            SpreadPips = "0.06",
            TradingHours = "US Market (09:30 - 16:00 ET)",
            SupportedProviders = new[] { "KeylessPublic", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "AMZN (Yahoo Finance)",
                ["Synthetic"] = "AMZN"
            },
            Description = "Global e-commerce marketplace and AWS cloud computing infrastructure."
        },
        new {
            Symbol = "GOOGL",
            Name = "Alphabet Inc. (Google)",
            Aliases = new[] { "GOOGLE", "ALPHABET", "NASDAQ:GOOGL" },
            Category = "stocks",
            Exchange = "NASDAQ",
            Price = "165.80",
            Change = "+0.32%",
            IsPositive = true,
            SpreadPips = "0.05",
            TradingHours = "US Market (09:30 - 16:00 ET)",
            SupportedProviders = new[] { "KeylessPublic", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "GOOGL (Yahoo Finance)",
                ["Synthetic"] = "GOOGL"
            },
            Description = "Online search, Android ecosystem, YouTube, and Gemini AI technologies."
        },
        new {
            Symbol = "META",
            Name = "Meta Platforms, Inc.",
            Aliases = new[] { "FACEBOOK", "NASDAQ:META" },
            Category = "stocks",
            Exchange = "NASDAQ",
            Price = "585.30",
            Change = "+1.45%",
            IsPositive = true,
            SpreadPips = "0.12",
            TradingHours = "US Market (09:30 - 16:00 ET)",
            SupportedProviders = new[] { "KeylessPublic", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "META (Yahoo Finance)",
                ["Synthetic"] = "META"
            },
            Description = "Social networking platforms including Instagram, WhatsApp, and Llama AI."
        },
        new {
            Symbol = "AMD",
            Name = "Advanced Micro Devices",
            Aliases = new[] { "NASDAQ:AMD" },
            Category = "stocks",
            Exchange = "NASDAQ",
            Price = "158.40",
            Change = "+1.80%",
            IsPositive = true,
            SpreadPips = "0.08",
            TradingHours = "US Market (09:30 - 16:00 ET)",
            SupportedProviders = new[] { "KeylessPublic", "Synthetic" },
            ProviderSymbols = new Dictionary<string, string> {
                ["KeylessPublic"] = "AMD (Yahoo Finance)",
                ["Synthetic"] = "AMD"
            },
            Description = "Semiconductor microprocessors, Radeon GPUs, and EPYC server CPUs."
        }
    };

    var filtered = allSymbols.AsEnumerable();

    // 1. Filter by requested provider (defaulting to activeProvider if specified or matching)
    if (!string.IsNullOrWhiteSpace(provider) && !string.Equals(provider, "all", StringComparison.OrdinalIgnoreCase))
    {
        filtered = filtered.Where(s => s.SupportedProviders.Contains(provider, StringComparer.OrdinalIgnoreCase));
    }

    // 2. Filter by category
    if (!string.IsNullOrWhiteSpace(category) && !string.Equals(category, "all", StringComparison.OrdinalIgnoreCase))
    {
        filtered = filtered.Where(s => string.Equals(s.Category, category, StringComparison.OrdinalIgnoreCase));
    }

    // 3. Search query
    if (!string.IsNullOrWhiteSpace(search))
    {
        string q = search.Trim();
        filtered = filtered.Where(s =>
            s.Symbol.Contains(q, StringComparison.OrdinalIgnoreCase) ||
            s.Name.Contains(q, StringComparison.OrdinalIgnoreCase) ||
            s.Aliases.Any(a => a.Contains(q, StringComparison.OrdinalIgnoreCase)) ||
            s.Category.Contains(q, StringComparison.OrdinalIgnoreCase));
    }

    var list = filtered.ToList();

    return Results.Ok(new
    {
        ActiveProvider = activeProv,
        Total = list.Count,
        Symbols = list
    });
});

// ----------------------------------------------------
// 8. Broker Settings & Key Configuration
// ----------------------------------------------------
var settingsGroup = app.MapGroup("/api/settings").WithTags("Settings");

settingsGroup.MapGet("/broker-config", async (IBrokerConfigurationRepository repo, CancellationToken ct) =>
{
    var config = await repo.GetConfigurationAsync(ct);
    return Results.Ok(new
    {
        config.ActiveProvider,
        config.OandaAccountId,
        HasOandaToken = !string.IsNullOrWhiteSpace(config.OandaApiToken),
        MaskedOandaToken = MaskSecret(config.OandaApiToken),
        config.OandaEnvironment,
        config.TwelveDataApiKey,
        config.UpdatedAtUtc
    });
});

settingsGroup.MapPost("/broker-config", async (
    [FromBody] UpdateBrokerConfigDto dto,
    IBrokerConfigurationRepository repo,
    CancellationToken ct) =>
{
    var config = await repo.GetConfigurationAsync(ct);

    if (!string.IsNullOrWhiteSpace(dto.ActiveProvider))
        config.ActiveProvider = dto.ActiveProvider;

    if (dto.OandaApiToken != null && dto.OandaApiToken != "******")
        config.OandaApiToken = dto.OandaApiToken;

    if (dto.OandaAccountId != null)
        config.OandaAccountId = dto.OandaAccountId;

    if (!string.IsNullOrWhiteSpace(dto.OandaEnvironment))
        config.OandaEnvironment = dto.OandaEnvironment;

    if (dto.TwelveDataApiKey != null && dto.TwelveDataApiKey != "******")
        config.TwelveDataApiKey = dto.TwelveDataApiKey;

    await repo.UpdateConfigurationAsync(config, ct);
    CompositeMarketDataProvider.InvalidateConfigCache();

    return Results.Ok(new
    {
        Success = true,
        ActiveProvider = config.ActiveProvider,
        Message = "Broker settings updated successfully."
    });
});

// ----------------------------------------------------
// 7. Chart Drawings & Level Alerts Persistence
// ----------------------------------------------------
var chartStorageDir = Path.Combine(AppContext.BaseDirectory, "Data", "Charts");
Directory.CreateDirectory(chartStorageDir);

var drawingsGroup = app.MapGroup("/api/chart-drawings").WithTags("Chart Drawings");

drawingsGroup.MapGet("/{symbol}", async (string symbol, CancellationToken ct) =>
{
    string sym = symbol.Trim().ToUpperInvariant();
    string filePath = Path.Combine(chartStorageDir, $"drawings_{sym}.json");
    if (!File.Exists(filePath)) return Results.Content("[]", "application/json");

    string json = await File.ReadAllTextAsync(filePath, ct);
    return Results.Content(json, "application/json");
});

drawingsGroup.MapPost("/{symbol}", async (string symbol, HttpRequest request, CancellationToken ct) =>
{
    string sym = symbol.Trim().ToUpperInvariant();
    string filePath = Path.Combine(chartStorageDir, $"drawings_{sym}.json");
    using var reader = new StreamReader(request.Body);
    string json = await reader.ReadToEndAsync(ct);
    await File.WriteAllTextAsync(filePath, json, ct);
    return Results.Ok(new { success = true, symbol = sym });
});

drawingsGroup.MapDelete("/{symbol}", (string symbol) =>
{
    string sym = symbol.Trim().ToUpperInvariant();
    string filePath = Path.Combine(chartStorageDir, $"drawings_{sym}.json");
    if (File.Exists(filePath)) File.Delete(filePath);
    return Results.NoContent();
});

var alertsGroup = app.MapGroup("/api/chart-alerts").WithTags("Chart Alerts");
string alertsFilePath = Path.Combine(chartStorageDir, "alerts.json");

alertsGroup.MapGet("/", async (CancellationToken ct) =>
{
    if (!File.Exists(alertsFilePath)) return Results.Content("[]", "application/json");
    string json = await File.ReadAllTextAsync(alertsFilePath, ct);
    return Results.Content(json, "application/json");
});

alertsGroup.MapPost("/", async (HttpRequest request, CancellationToken ct) =>
{
    using var reader = new StreamReader(request.Body);
    string json = await reader.ReadToEndAsync(ct);
    await File.WriteAllTextAsync(alertsFilePath, json, ct);
    return Results.Ok(new { success = true });
});

// ----------------------------------------------------
// Symbol Groups (Buckets / Baskets) Endpoints
// ----------------------------------------------------
var symbolGroupsGroup = app.MapGroup("/api/symbol-groups").WithTags("Symbol Groups");

symbolGroupsGroup.MapGet("/", async (ISymbolGroupRepository repo, CancellationToken ct) =>
{
    var groups = await repo.GetAllAsync(ct);
    return Results.Ok(groups);
});

symbolGroupsGroup.MapGet("/{id}", async (string id, ISymbolGroupRepository repo, CancellationToken ct) =>
{
    var group = await repo.GetByIdAsync(id, ct);
    return group != null ? Results.Ok(group) : Results.NotFound();
});

symbolGroupsGroup.MapPost("/", async ([FromBody] SymbolGroup group, ISymbolGroupRepository repo, CancellationToken ct) =>
{
    await repo.AddAsync(group, ct);
    return Results.Ok(group);
});

symbolGroupsGroup.MapPut("/{id}", async (string id, [FromBody] SymbolGroup group, ISymbolGroupRepository repo, CancellationToken ct) =>
{
    group.Id = id;
    group.UpdatedAtUtc = DateTime.UtcNow;
    await repo.UpdateAsync(group, ct);
    return Results.Ok(group);
});

symbolGroupsGroup.MapDelete("/{id}", async (string id, ISymbolGroupRepository repo, CancellationToken ct) =>
{
    await repo.DeleteAsync(id, ct);
    return Results.NoContent();
});

// ----------------------------------------------------
// Market Scanner Robot Endpoints
// ----------------------------------------------------
var scannerGroup = app.MapGroup("/api/scanner").WithTags("Market Scanner");

scannerGroup.MapPost("/live", async ([FromBody] LiveScanRequest request, IMarketScannerService scanner, CancellationToken ct) =>
{
    var report = await scanner.RunLiveScanAsync(request, ct);
    return Results.Ok(report);
});

scannerGroup.MapGet("/live/latest", (IMarketScannerService scanner) =>
{
    var report = scanner.GetLatestLiveScanReport();
    return report != null ? Results.Ok(report) : Results.NoContent();
});

scannerGroup.MapPost("/historical", async ([FromBody] HistoricalScanRequest request, IMarketScannerService scanner, CancellationToken ct) =>
{
    var report = await scanner.RunHistoricalScanAsync(request, ct);
    return Results.Ok(report);
});

scannerGroup.MapGet("/historical/latest", (IMarketScannerService scanner) =>
{
    var report = scanner.GetLatestHistoricalScanReport();
    return report != null ? Results.Ok(report) : Results.NoContent();
});

// ----------------------------------------------------
// Strategy Notifications & Background Reminders
// ----------------------------------------------------
var notificationsGroup = app.MapGroup("/api/notifications").WithTags("Notifications");

notificationsGroup.MapGet("/", (IStrategyNotificationService notificationService) =>
{
    var alerts = notificationService.GetActiveAlerts();
    return Results.Ok(alerts);
});

notificationsGroup.MapGet("/status", (IStrategyNotificationService notificationService) =>
{
    var status = notificationService.GetScannerStatus();
    return Results.Ok(status);
});

notificationsGroup.MapPost("/{id:guid}/acknowledge", (Guid id, IStrategyNotificationService notificationService) =>
{
    var success = notificationService.AcknowledgeAlert(id);
    return success ? Results.Ok(new { success = true, id }) : Results.NotFound();
});

notificationsGroup.MapDelete("/{id:guid}", (Guid id, IStrategyNotificationService notificationService) =>
{
    var success = notificationService.DismissAlert(id);
    return success ? Results.Ok(new { success = true, id }) : Results.NotFound();
});

notificationsGroup.MapPost("/clear", (IStrategyNotificationService notificationService) =>
{
    notificationService.ClearAllAlerts();
    return Results.Ok(new { success = true });
});

notificationsGroup.MapGet("/settings", (IStrategyNotificationService notificationService) =>
{
    return Results.Ok(notificationService.GetSettings());
});

notificationsGroup.MapPost("/settings", ([FromBody] BackgroundScannerSettings settings, IStrategyNotificationService notificationService) =>
{
    notificationService.UpdateSettings(settings);
    return Results.Ok(notificationService.GetSettings());
});

notificationsGroup.MapPost("/test", (IStrategyNotificationService notificationService) =>
{
    var testAlert = notificationService.AddAlert(
        strategyId: Guid.NewGuid(),
        strategyName: "Test Desktop Notification",
        symbol: "EURUSD",
        timeframe: Timeframe.H1,
        lastPrice: 1.08520m,
        state: SignalState.FullyMet,
        matchScore: 100.0,
        summaryMessage: "Desktop notification test dispatched successfully! Cross-platform notifications operational.");
    return Results.Ok(testAlert);
});

app.MapFallbackToFile("index.html");

app.Run();

// DTO records
public record ModifyPositionDto(decimal? StopLoss, decimal? TakeProfit);
public record CreateStrategyDto(
    string Name,
    string? Description,
    Timeframe Timeframe,
    string RawJsonRules,
    bool AutoTradingEnabled,
    bool AiValidationEnabled);

public record UpdateStrategyDto(
    string Name,
    string? Description,
    Timeframe Timeframe,
    string RawJsonRules,
    bool IsActive,
    bool AutoTradingEnabled,
    bool AiValidationEnabled);

public record KillSwitchToggleDto(bool Engage, string? Reason);

public record IngestCandleDto(
    string Symbol,
    Timeframe Timeframe,
    DateTime? Timestamp,
    decimal Open,
    decimal High,
    decimal Low,
    decimal Close,
    decimal Volume,
    bool IsComplete);

public record UpdateBrokerConfigDto(
    string? ActiveProvider,
    string? OandaApiToken,
    string? OandaAccountId,
    string? OandaEnvironment,
    string? TwelveDataApiKey);

public record PlaceManualOrderDto(
    string Symbol,
    OrderType OrderType,
    decimal Lots,
    decimal Price,
    decimal? StopLoss,
    decimal? TakeProfit);

public partial class Program
{
    public static string MaskSecret(string? secret)
    {
        if (string.IsNullOrWhiteSpace(secret)) return string.Empty;
        if (secret.Length <= 8) return "********";
        return $"{secret[..4]}...{secret[^4..]}";
    }
}
