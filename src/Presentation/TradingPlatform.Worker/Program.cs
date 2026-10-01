using TradingPlatform.Application;
using TradingPlatform.Broker.Oanda;
using TradingPlatform.Persistence;
using TradingPlatform.RulesEngine;
using TradingPlatform.Worker.Workers;

var builder = Host.CreateApplicationBuilder(args);

// Core Application & Custom CQRS
builder.Services.AddApplicationServices();

// Persistence & Repositories
builder.Services.AddPersistenceServices(builder.Configuration);

// Rules Engine & Indicators
builder.Services.AddRulesEngineServices();

// Broker Adapter: Register Oanda (or ZeroMQ)
builder.Services.AddOandaBroker(builder.Configuration);

// Background Services
builder.Services.AddHostedService<CandleIngestionWorker>();
builder.Services.AddHostedService<HeartbeatAndKillSwitchWorker>();

var host = builder.Build();
host.Run();
