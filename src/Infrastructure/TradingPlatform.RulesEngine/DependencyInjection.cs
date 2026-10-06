using Microsoft.Extensions.DependencyInjection;
using TradingPlatform.Application;

namespace TradingPlatform.RulesEngine;

public static class DependencyInjection
{
    public static IServiceCollection AddRulesEngineServices(this IServiceCollection services)
    {
        services.AddSingleton<IIndicatorCalculationService, IndicatorCalculationService>();
        services.AddSingleton<IStrategyNotificationService, StrategyNotificationService>();
        services.AddScoped<IRulesEngineService, RulesEngineService>();
        services.AddScoped<IMarketScannerService, MarketScannerService>();
        services.AddHostedService<BackgroundStrategyScannerService>();
        return services;
    }
}
