using Microsoft.Extensions.DependencyInjection;
using TradingPlatform.Broker.Abstractions;

namespace TradingPlatform.Broker.ZeroMQ;

public static class DependencyInjection
{
    public static IServiceCollection AddZeroMqBroker(this IServiceCollection services, ZeroMqOptions? options = null)
    {
        services.AddSingleton(options ?? new ZeroMqOptions());
        services.AddSingleton<ZeroMqGateway>();

        services.AddSingleton<IMarketDataStreamer>(sp => sp.GetRequiredService<ZeroMqGateway>());
        services.AddSingleton<IOrderExecutionService>(sp => sp.GetRequiredService<ZeroMqGateway>());
        services.AddSingleton<IHistoricalDataProvider>(sp => sp.GetRequiredService<ZeroMqGateway>());

        return services;
    }
}
