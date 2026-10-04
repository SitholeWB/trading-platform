using Microsoft.Extensions.DependencyInjection;
using TradingPlatform.AI.Abstractions;
using TradingPlatform.Application.Common.CQRS;
using TradingPlatform.Application.Common.Validation;
using TradingPlatform.Application.Interfaces;
using TradingPlatform.Application.Services;

namespace TradingPlatform.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // 1. Core Application Singletons
        services.AddSingleton<ICandleBufferService, CandleBufferService>();

        // 2. CQRS Dispatchers (No MediatR dependency)
        services.AddScoped<CqrsDispatcher>();
        services.AddScoped<ICommandDispatcher>(sp => sp.GetRequiredService<CqrsDispatcher>());
        services.AddScoped<IQueryDispatcher>(sp => sp.GetRequiredService<CqrsDispatcher>());
        services.AddScoped<ICqrsDispatcher>(sp => sp.GetRequiredService<CqrsDispatcher>());

        // 3. Scan & Register CQRS Command Handlers, Query Handlers, and Validators
        var assembly = typeof(DependencyInjection).Assembly;
        foreach (var type in assembly.GetTypes().Where(t => !t.IsAbstract && !t.IsInterface))
        {
            foreach (var iface in type.GetInterfaces())
            {
                if (iface.IsGenericType)
                {
                    var openGeneric = iface.GetGenericTypeDefinition();
                    if (openGeneric == typeof(ICommandHandler<>) ||
                        openGeneric == typeof(ICommandHandler<,>) ||
                        openGeneric == typeof(IQueryHandler<,>) ||
                        openGeneric == typeof(IValidator<>))
                    {
                        services.AddScoped(iface, type);
                    }
                }
            }
        }

        // 4. Register AI Services
        services.AddScoped<IAIEngineService, AIEngineService>();
        services.AddScoped<IAIReasoningService, DefaultAIReasoningService>();
        services.AddScoped<IAIPatternVerifier, DefaultAIPatternVerifier>();
        services.AddScoped<ITimeSeriesEmbeddingService, DefaultTimeSeriesEmbeddingService>();

        return services;
    }
}
