using Microsoft.Extensions.DependencyInjection;
using TradingPlatform.AI.Abstractions;
using TradingPlatform.Application.Interfaces;
using TradingPlatform.Application.Services;

namespace TradingPlatform.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // 1. Core Application Singletons
        services.AddSingleton<ICandleBufferService, CandleBufferService>();

        // 2. Direct Application Domain Services (No MediatR indirection)
        services.AddScoped<IRiskPolicyService, RiskPolicyService>();
        services.AddScoped<ITradeExecutionService, TradeExecutionService>();
        services.AddScoped<IStrategyEvaluationService, StrategyEvaluationService>();
        services.AddScoped<IDynamicExitService, DynamicExitService>();
        services.AddScoped<ICandleIngestionService, CandleIngestionService>();

        // 3. Register Default AI Fallbacks if not overridden
        services.AddScoped<IAIReasoningService, DefaultAIReasoningService>();
        services.AddScoped<IAIPatternVerifier, DefaultAIPatternVerifier>();
        services.AddScoped<ITimeSeriesEmbeddingService, DefaultTimeSeriesEmbeddingService>();

        return services;
    }
}
