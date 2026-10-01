using Microsoft.Extensions.DependencyInjection;
using TradingPlatform.AI.Abstractions;
using TradingPlatform.Application.Commands.DynamicExits;
using TradingPlatform.Application.Commands.EvaluateStrategies;
using TradingPlatform.Application.Commands.ExecuteTrade;
using TradingPlatform.Application.Commands.IngestCandle;
using TradingPlatform.Application.Commands.Risk;
using TradingPlatform.Application.Common.Behaviors;
using TradingPlatform.Application.Common.CQRS;
using TradingPlatform.Application.Common.Validation;
using TradingPlatform.Application.Interfaces;
using TradingPlatform.Application.Queries;
using TradingPlatform.Application.Services;
using TradingPlatform.Broker.Abstractions.Models;
using TradingPlatform.Domain.Entities;
using TradingPlatform.Domain.Models;

namespace TradingPlatform.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // 1. Mediator & Dispatcher
        services.AddScoped<IMediator, CustomMediator>();
        services.AddScoped<ISender>(sp => sp.GetRequiredService<IMediator>());
        services.AddScoped<IPublisher>(sp => sp.GetRequiredService<IMediator>());

        // 2. Core Application Singletons
        services.AddSingleton<ICandleBufferService, CandleBufferService>();

        // 3. Register Pipeline Behaviors (Open Generics)
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(PerformanceMetricsBehavior<,>));
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

        // 4. Register Command & Query Handlers
        services.AddScoped<IRequestHandler<IngestCandleCommand, MarketSnapshot?>, IngestCandleCommandHandler>();
        services.AddScoped<IRequestHandler<EvaluateStrategiesCommand, IReadOnlyList<SignalResult>>, EvaluateStrategiesCommandHandler>();
        services.AddScoped<IRequestHandler<ExecuteTradeSignalCommand, ExecutionResult>, ExecuteTradeSignalCommandHandler>();
        services.AddScoped<IRequestHandler<ValidateRiskPolicyCommand, RiskEvaluationResult>, ValidateRiskPolicyCommandHandler>();
        services.AddScoped<IRequestHandler<EvaluateDynamicExitsCommand, int>, EvaluateDynamicExitsCommandHandler>();

        services.AddScoped<IRequestHandler<GetStrategiesQuery, IReadOnlyList<StrategyDefinition>>, GetStrategiesQueryHandler>();
        services.AddScoped<IRequestHandler<GetStrategyByIdQuery, StrategyDefinition?>, GetStrategyByIdQueryHandler>();
        services.AddScoped<IRequestHandler<GetRecentSignalAuditLogsQuery, IReadOnlyList<SignalAuditLog>>, GetRecentSignalAuditLogsQueryHandler>();
        services.AddScoped<IRequestHandler<GetOpenPositionsQuery, IReadOnlyList<Position>>, GetOpenPositionsQueryHandler>();
        services.AddScoped<IRequestHandler<GetRiskProfileQuery, RiskProfile>, GetRiskProfileQueryHandler>();
        services.AddScoped<IRequestHandler<GetAccountSummaryQuery, AccountSummary>, GetAccountSummaryQueryHandler>();

        // 5. Register Custom Validators
        services.AddScoped<IValidator<IngestCandleCommand>, IngestCandleCommandValidator>();
        services.AddScoped<IValidator<EvaluateStrategiesCommand>, EvaluateStrategiesCommandValidator>();
        services.AddScoped<IValidator<ExecuteTradeSignalCommand>, ExecuteTradeSignalCommandValidator>();

        // 6. Register Default AI Fallbacks if not overridden
        services.AddScoped<IAIReasoningService, DefaultAIReasoningService>();
        services.AddScoped<IAIPatternVerifier, DefaultAIPatternVerifier>();
        services.AddScoped<ITimeSeriesEmbeddingService, DefaultTimeSeriesEmbeddingService>();

        return services;
    }
}
