using TradingPlatform.Application;
using TradingPlatform.Broker.Oanda;
using TradingPlatform.Persistence;
using TradingPlatform.RulesEngine;
using TradingPlatform.Worker.Workers;

// Prevent Linux inotify instance exhaustion (default limit 128) when running in containers, WSL, or IDE debuggers
if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable("DOTNET_USE_POLLING_FILE_WATCHER")))
{
    Environment.SetEnvironmentVariable("DOTNET_USE_POLLING_FILE_WATCHER", "true");
}

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
