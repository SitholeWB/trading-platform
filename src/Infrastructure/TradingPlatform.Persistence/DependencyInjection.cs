using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TradingPlatform.Application.Interfaces;
using TradingPlatform.Persistence.Repositories;

namespace TradingPlatform.Persistence;

public static class DependencyInjection
{
    public static IServiceCollection AddPersistenceServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var provider = configuration["Database:Provider"] ?? "InMemory"; // Default to InMemory for dev/testing, supports SqlServer
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        services.AddDbContext<TradingDbContext>(options =>
        {
            if (provider.Equals("SqlServer", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(connectionString))
            {
                options.UseSqlServer(connectionString, sql =>
                {
                    sql.MigrationsAssembly(typeof(TradingDbContext).Assembly.FullName);
                    sql.EnableRetryOnFailure(maxRetryCount: 3, maxRetryDelay: TimeSpan.FromSeconds(5), errorNumbersToAdd: null);
                });
            }
            else if (provider.Equals("Sqlite", StringComparison.OrdinalIgnoreCase))
            {
                var sqliteConnection = !string.IsNullOrWhiteSpace(connectionString)
                    ? connectionString
                    : "Data Source=trading_platform.db";
                options.UseSqlite(sqliteConnection);
            }
            else
            {
                // In-Memory database for local development, fast startup, and unit/integration testing
                options.UseInMemoryDatabase(databaseName: "TradingPlatformDb");
            }
        });

        // Register repositories
        services.AddScoped<ISignalAuditRepository, SignalAuditRepository>();
        services.AddScoped<IStrategyRepository, StrategyRepository>();
        services.AddScoped<ITradeRepository, TradeRepository>();
        services.AddScoped<IRiskProfileRepository, RiskProfileRepository>();
        services.AddScoped<IBrokerConfigurationRepository, BrokerConfigurationRepository>();

        return services;
    }
}
