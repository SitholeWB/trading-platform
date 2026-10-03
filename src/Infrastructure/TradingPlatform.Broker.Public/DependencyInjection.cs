using Microsoft.Extensions.DependencyInjection;
using TradingPlatform.Broker.Abstractions;

namespace TradingPlatform.Broker.Public;

public static class DependencyInjection
{
    public static IServiceCollection AddPublicMarketDataServices(this IServiceCollection services)
    {
        services.AddHttpClient<YahooFinanceSessionManager>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(10);
        });
        services.AddSingleton<YahooFinanceSessionManager>();

        services.AddHttpClient<YahooFinanceGateway>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(10);
        });

        services.AddHttpClient<BinancePublicGateway>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(10);
        });

        services.AddHttpClient<FrankfurterPublicGateway>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(10);
        });

        services.AddScoped<CompositeMarketDataProvider>();
        services.AddScoped<IHistoricalDataProvider>(sp => sp.GetRequiredService<CompositeMarketDataProvider>());

        return services;
    }
}
