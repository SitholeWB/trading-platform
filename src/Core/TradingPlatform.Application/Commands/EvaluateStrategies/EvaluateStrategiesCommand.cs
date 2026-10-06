using Microsoft.Extensions.Logging;
using TradingPlatform.Domain;

namespace TradingPlatform.Application;

public record EvaluateStrategiesCommand(MarketSnapshot Snapshot) : ICommand<IReadOnlyList<SignalResult>>;

public class EvaluateStrategiesCommandValidator : AbstractValidator<EvaluateStrategiesCommand>
{
    public EvaluateStrategiesCommandValidator()
    {
        RuleFor(x => x.Snapshot).NotNull("MarketSnapshot cannot be null.");
        RuleFor(x => x.Snapshot.Symbol).NotEmpty("Symbol is required.");
    }
}

public class EvaluateStrategiesCommandHandler : ICommandHandler<EvaluateStrategiesCommand, IReadOnlyList<SignalResult>>
{
    private readonly IStrategyRepository _strategyRepository;
    private readonly IRulesEngineService _rulesEngineService;
    private readonly ISignalAuditRepository _auditRepository;
    private readonly ICommandDispatcher _commandDispatcher;
    private readonly ILogger<EvaluateStrategiesCommandHandler> _logger;

    public EvaluateStrategiesCommandHandler(
        IStrategyRepository strategyRepository,
        IRulesEngineService rulesEngineService,
        ISignalAuditRepository auditRepository,
        ICommandDispatcher commandDispatcher,
        ILogger<EvaluateStrategiesCommandHandler> logger)
    {
        _strategyRepository = strategyRepository;
        _rulesEngineService = rulesEngineService;
        _auditRepository = auditRepository;
        _commandDispatcher = commandDispatcher;
        _logger = logger;
    }

    public async Task<IReadOnlyList<SignalResult>> HandleAsync(EvaluateStrategiesCommand command, CancellationToken ct = default)
    {
        var snapshot = command.Snapshot;

        // Fetch active strategies matching timeframe
        var activeStrategies = await _strategyRepository.GetActiveStrategiesAsync(snapshot.Timeframe, ct);
        _logger.LogInformation("[STRATEGY] Found {Count} active strategies configured for timeframe {Timeframe}.", activeStrategies.Count, snapshot.Timeframe);
        if (activeStrategies.Count == 0)
        {
            return Array.Empty<SignalResult>();
        }

        // Run snapshot through Microsoft.RulesEngine
        var evaluationResults = await _rulesEngineService.EvaluateAsync(snapshot, activeStrategies, ct);

        foreach (var signal in evaluationResults)
        {
            var fingerprint = $"{signal.Symbol}_{signal.Timeframe}_{signal.CandleTimestamp:yyyyMMddHHmm}_{signal.StrategyId}";

            if (signal.State == SignalState.FullyMet)
            {
                _logger.LogInformation("[STRATEGY] Fully Met trade signal generated: Strategy='{Strategy}', Symbol={Symbol}, Side={Side}, Price={Price}",
                    signal.StrategyName, signal.Symbol, signal.RecommendedOrderType, signal.EntryPrice);

                // Dispatch trade execution command
                await _commandDispatcher.DispatchAsync(new ExecuteTradeSignalCommand(signal), ct);
            }
            else if (signal.State == SignalState.NearMiss)
            {
                _logger.LogInformation("[STRATEGY NEAR-MISS] Near-miss pattern detected for Strategy='{Strategy}', Symbol={Symbol}. Details: {Details}",
                    signal.StrategyName, signal.Symbol, signal.EvaluationDetailsJson);

                // Persist near-miss state audit log for pattern tracking and analytics
                var auditLog = new SignalAuditLog(
                    fingerprint,
                    signal.StrategyId,
                    signal.Symbol,
                    signal.Timeframe,
                    signal.CandleTimestamp,
                    SignalState.NearMiss,
                    signal.EvaluationDetailsJson);

                if (!await _auditRepository.ExistsAsync(fingerprint, ct))
                {
                    await _auditRepository.AddAsync(auditLog, ct);
                }
            }
        }

        return evaluationResults;
    }
}
