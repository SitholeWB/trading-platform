using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TradingPlatform.Broker.Abstractions;

namespace TradingPlatform.Broker.Oanda;

public static class DependencyInjection
{
    public static IServiceCollection AddOandaBroker(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<OandaOptions>(configuration.GetSection(OandaOptions.SectionName));
        services.AddHttpClient<OandaGateway>();
        services.AddSingleton<OandaGateway>();

        services.AddSingleton<IMarketDataStreamer>(sp => sp.GetRequiredService<OandaGateway>());
        services.AddSingleton<IOrderExecutionService>(sp => sp.GetRequiredService<OandaGateway>());
        services.AddSingleton<IHistoricalDataProvider>(sp => sp.GetRequiredService<OandaGateway>());

        return services;
    }
}
