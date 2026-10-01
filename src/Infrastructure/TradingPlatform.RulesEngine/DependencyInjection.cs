using Microsoft.Extensions.DependencyInjection;
using TradingPlatform.Application.Interfaces;
using TradingPlatform.RulesEngine.Indicators;

namespace TradingPlatform.RulesEngine;

public static class DependencyInjection
{
    public static IServiceCollection AddRulesEngineServices(this IServiceCollection services)
    {
        services.AddSingleton<IIndicatorCalculationService, IndicatorCalculationService>();
        services.AddScoped<IRulesEngineService, RulesEngineService>();
        return services;
    }
}
