using Microsoft.Extensions.Logging;
using TradingPlatform.Application.Interfaces;
using TradingPlatform.Domain.Entities;
using TradingPlatform.Domain.Enums;
using TradingPlatform.Domain.Models;

namespace TradingPlatform.Application.Services;

public class StrategyEvaluationService : IStrategyEvaluationService
{
    private readonly IStrategyRepository _strategyRepository;
    private readonly IRulesEngineService _rulesEngineService;
    private readonly ISignalAuditRepository _auditRepository;
    private readonly ITradeExecutionService _tradeExecutionService;
    private readonly ILogger<StrategyEvaluationService> _logger;

    public StrategyEvaluationService(
        IStrategyRepository strategyRepository,
        IRulesEngineService rulesEngineService,
        ISignalAuditRepository auditRepository,
        ITradeExecutionService tradeExecutionService,
        ILogger<StrategyEvaluationService> logger)
    {
        _strategyRepository = strategyRepository;
        _rulesEngineService = rulesEngineService;
        _auditRepository = auditRepository;
        _tradeExecutionService = tradeExecutionService;
        _logger = logger;
    }

    public async Task<IReadOnlyList<SignalResult>> EvaluateAsync(MarketSnapshot snapshot, CancellationToken ct = default)
    {
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

                // Dispatch trade execution directly without MediatR
                await _tradeExecutionService.ExecuteSignalAsync(signal, ct);
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
