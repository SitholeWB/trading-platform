using Microsoft.Extensions.DependencyInjection;
using TradingPlatform.Application.Interfaces;
using TradingPlatform.RulesEngine.Indicators;
using TradingPlatform.RulesEngine.Scanner;

namespace TradingPlatform.RulesEngine;

public static class DependencyInjection
{
    public static IServiceCollection AddRulesEngineServices(this IServiceCollection services)
    {
        services.AddSingleton<IIndicatorCalculationService, IndicatorCalculationService>();
        services.AddScoped<IRulesEngineService, RulesEngineService>();
        services.AddScoped<IMarketScannerService, MarketScannerService>();
        return services;
    }
}
