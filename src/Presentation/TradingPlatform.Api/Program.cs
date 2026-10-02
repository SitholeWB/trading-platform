using Microsoft.AspNetCore.Mvc;
using TradingPlatform.Api.Hosting;
using TradingPlatform.Application;
using TradingPlatform.Application.Commands.IngestCandle;
using TradingPlatform.Application.Common.CQRS;
using TradingPlatform.Application.Interfaces;
using TradingPlatform.Application.Queries;
using TradingPlatform.Broker.Abstractions;
using TradingPlatform.Broker.Oanda;
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
builder.Services.AddHostedService<SpaHostedService>();

var app = builder.Build();

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

strategiesGroup.MapGet("/", async (IMediator mediator, CancellationToken ct) =>
{
    var list = await mediator.Send(new GetStrategiesQuery(), ct);
    return Results.Ok(list);
});

strategiesGroup.MapGet("/{id:guid}", async (Guid id, IMediator mediator, CancellationToken ct) =>
{
    var strategy = await mediator.Send(new GetStrategyByIdQuery(id), ct);
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

auditsGroup.MapGet("/", async ([FromQuery] int? count, IMediator mediator, CancellationToken ct) =>
{
    int limit = count.HasValue && count.Value > 0 ? count.Value : 50;
    var logs = await mediator.Send(new GetRecentSignalAuditLogsQuery(limit), ct);
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

positionsGroup.MapGet("/", async (IMediator mediator, CancellationToken ct) =>
{
    var positions = await mediator.Send(new GetOpenPositionsQuery(), ct);
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

// ----------------------------------------------------
// 4. Risk Profile & Kill Switch Endpoints
// ----------------------------------------------------
var riskGroup = app.MapGroup("/api/risk").WithTags("Risk Management");

riskGroup.MapGet("/", async (IMediator mediator, CancellationToken ct) =>
{
    var profile = await mediator.Send(new GetRiskProfileQuery(), ct);
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
app.MapGet("/api/account", async (IMediator mediator, CancellationToken ct) =>
{
    var summary = await mediator.Send(new GetAccountSummaryQuery(), ct);
    return Results.Ok(summary);
}).WithTags("Account");

// ----------------------------------------------------
// 6. Candle Simulation / Ingestion Testing Endpoint
// ----------------------------------------------------
app.MapPost("/api/simulation/candle", async ([FromBody] IngestCandleDto dto, IMediator mediator, CancellationToken ct) =>
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

    var snapshot = await mediator.Send(new IngestCandleCommand(candle), ct);
    return Results.Ok(new
    {
        CandleIngested = candle,
        GeneratedSnapshot = snapshot,
        EvaluationTriggered = candle.IsComplete
    });
}).WithTags("Simulation");

app.MapFallbackToFile("index.html");

app.Run();

// DTO records
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

// Expose Program for WebApplicationFactory in integration tests
public partial class Program { }
