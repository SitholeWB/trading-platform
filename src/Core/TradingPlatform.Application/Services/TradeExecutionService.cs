using Microsoft.Extensions.Logging;
using TradingPlatform.AI.Abstractions;
using TradingPlatform.AI.Abstractions.Models;
using TradingPlatform.Application.Interfaces;
using TradingPlatform.Broker.Abstractions;
using TradingPlatform.Broker.Abstractions.Models;
using TradingPlatform.Domain.Entities;
using TradingPlatform.Domain.Enums;
using TradingPlatform.Domain.Models;

namespace TradingPlatform.Application.Services;

public class TradeExecutionService : ITradeExecutionService
{
    private readonly ISignalAuditRepository _auditRepository;
    private readonly ITradeRepository _tradeRepository;
    private readonly IOrderExecutionService _orderExecutionService;
    private readonly IAIReasoningService _aiReasoningService;
    private readonly IRiskPolicyService _riskPolicyService;
    private readonly ILogger<TradeExecutionService> _logger;

    public TradeExecutionService(
        ISignalAuditRepository auditRepository,
        ITradeRepository tradeRepository,
        IOrderExecutionService orderExecutionService,
        IAIReasoningService aiReasoningService,
        IRiskPolicyService riskPolicyService,
        ILogger<TradeExecutionService> logger)
    {
        _auditRepository = auditRepository;
        _tradeRepository = tradeRepository;
        _orderExecutionService = orderExecutionService;
        _aiReasoningService = aiReasoningService;
        _riskPolicyService = riskPolicyService;
        _logger = logger;
    }

    public async Task<ExecutionResult> ExecuteSignalAsync(SignalResult signal, CancellationToken ct = default)
    {
        var fingerprint = $"{signal.Symbol}_{signal.Timeframe}_{signal.CandleTimestamp:yyyyMMddHHmm}_{signal.StrategyId}";

        // Step 1: Idempotency & De-duplication Check
        if (await _auditRepository.ExistsAsync(fingerprint, ct))
        {
            _logger.LogWarning("[IDEMPOTENCY GUARD] Duplicate signal ignored. Fingerprint: {Fingerprint}", fingerprint);
            return ExecutionResult.Failed($"Duplicate signal detected for fingerprint: {fingerprint}");
        }

        // Step 2: Risk Policy Pipeline Check via Direct Service Call
        const decimal defaultLotSize = 0.10m; // Default micro/mini lot
        var riskResult = await _riskPolicyService.ValidatePolicyAsync(signal.Symbol, signal.RecommendedOrderType, defaultLotSize, ct: ct);
        if (!riskResult.IsPassed)
        {
            _logger.LogWarning("[RISK REJECTION] Trade signal rejected by risk engine: {Reason}", riskResult.RejectionReason);

            var riskAuditLog = new SignalAuditLog(
                fingerprint,
                signal.StrategyId,
                signal.Symbol,
                signal.Timeframe,
                signal.CandleTimestamp,
                SignalState.RejectedByRisk,
                $"{{\"rejectionReason\": \"{riskResult.RejectionReason}\", \"originalDetails\": {signal.EvaluationDetailsJson}}}");

            await _auditRepository.AddAsync(riskAuditLog, ct);
            return ExecutionResult.Failed($"Risk rejection: {riskResult.RejectionReason}");
        }

        // Step 3: Optional AI Reasoning Hook
        if (signal.AiValidationEnabled)
        {
            _logger.LogInformation("[AI VALIDATION] Strategy '{Strategy}' has AI validation enabled. Querying AI Reasoning Service...", signal.StrategyName);

            var dummyNews = new List<NewsHeadline>
            {
                new("Market session summary", "Reuters", DateTime.UtcNow.AddMinutes(-10), 0.1m, "Low", new[] { signal.Symbol })
            };

            var aiContext = new SignalEvaluationContext(
                signal.StrategyId,
                signal.StrategyName,
                signal.Symbol,
                signal.Timeframe,
                signal.CandleTimestamp,
                signal.RecommendedOrderType,
                signal.EntryPrice,
                signal.StopLoss,
                signal.TakeProfit,
                new MarketSnapshot { Symbol = signal.Symbol, Timeframe = signal.Timeframe, Close = signal.EntryPrice });

            var aiDecision = await _aiReasoningService.ValidateSignalContextAsync(aiContext, dummyNews, ct);

            if (!aiDecision.IsApproved)
            {
                _logger.LogWarning("[AI REJECTION] AI Reasoning rejected signal. Reasoning: {Reasoning}", aiDecision.ReasoningExplanation);

                var aiAuditLog = new SignalAuditLog(
                    fingerprint,
                    signal.StrategyId,
                    signal.Symbol,
                    signal.Timeframe,
                    signal.CandleTimestamp,
                    SignalState.RejectedByRisk,
                    $"{{\"aiRejected\": true, \"reasoning\": \"{aiDecision.ReasoningExplanation}\", \"flags\": [\"{string.Join("\",\"", aiDecision.RiskFlags)}\"]}}");

                await _auditRepository.AddAsync(aiAuditLog, ct);
                return ExecutionResult.Failed($"AI reasoning rejection: {aiDecision.ReasoningExplanation}");
            }

            _logger.LogInformation("[AI APPROVED] Confidence: {Confidence:P1}. Explanation: {Explanation}",
                aiDecision.ConfidenceScore, aiDecision.ReasoningExplanation);
        }

        // Step 4: Auto-Trading check
        if (!signal.AutoTradingEnabled)
        {
            _logger.LogInformation("[MANUAL MODE] Strategy has AutoTrading disabled. Signal logged as FullyMet without broker dispatch.");

            var manualAuditLog = new SignalAuditLog(
                fingerprint,
                signal.StrategyId,
                signal.Symbol,
                signal.Timeframe,
                signal.CandleTimestamp,
                SignalState.FullyMet,
                signal.EvaluationDetailsJson);

            await _auditRepository.AddAsync(manualAuditLog, ct);
            return ExecutionResult.Succeeded(0, signal.EntryPrice, defaultLotSize);
        }

        // Step 5: Dispatch Order through active IOrderExecutionService
        var orderRequest = new OrderRequest(
            signal.Symbol,
            signal.RecommendedOrderType,
            defaultLotSize,
            signal.EntryPrice,
            signal.StopLoss,
            signal.TakeProfit,
            $"AutoTrade_{signal.StrategyName}",
            fingerprint);

        _logger.LogInformation("[BROKER DISPATCH] Dispatching {Side} order for {Symbol} (Lots: {Lots}) to broker...",
            signal.RecommendedOrderType, signal.Symbol, defaultLotSize);

        var executionResult = await _orderExecutionService.OpenOrderAsync(orderRequest, ct);

        if (!executionResult.Success)
        {
            _logger.LogError("[BROKER ERROR] Order execution failed: {Error}", executionResult.ErrorMessage);

            var failedAuditLog = new SignalAuditLog(
                fingerprint,
                signal.StrategyId,
                signal.Symbol,
                signal.Timeframe,
                signal.CandleTimestamp,
                SignalState.RejectedByRisk,
                $"{{\"brokerExecutionError\": \"{executionResult.ErrorMessage}\"}}");

            await _auditRepository.AddAsync(failedAuditLog, ct);
            return executionResult;
        }

        // Step 6: Persist Trade Details & Audit Log
        var tradeOrder = new TradeOrder(
            executionResult.BrokerTicketId,
            signal.Symbol,
            signal.RecommendedOrderType,
            executionResult.Lots,
            signal.EntryPrice,
            executionResult.ExecutedPrice,
            signal.StopLoss,
            signal.TakeProfit,
            fingerprint);

        await _tradeRepository.AddOrderAsync(tradeOrder, ct);

        var position = new Position(
            executionResult.BrokerTicketId,
            signal.Symbol,
            signal.RecommendedOrderType,
            executionResult.Lots,
            executionResult.ExecutedPrice,
            signal.StopLoss,
            signal.TakeProfit);

        await _tradeRepository.AddPositionAsync(position, ct);

        var auditLog = new SignalAuditLog(
            fingerprint,
            signal.StrategyId,
            signal.Symbol,
            signal.Timeframe,
            signal.CandleTimestamp,
            SignalState.Dispatched,
            signal.EvaluationDetailsJson);

        await _auditRepository.AddAsync(auditLog, ct);

        _logger.LogInformation("[DISPATCH COMPLETE] Trade successfully executed and journaled! Ticket: {TicketId}, Price: {Price}",
            executionResult.BrokerTicketId, executionResult.ExecutedPrice);

        return executionResult;
    }
}
