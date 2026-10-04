using TradingPlatform.Broker.Abstractions.Models;
using TradingPlatform.Domain.Entities;
using TradingPlatform.Domain.Enums;
using TradingPlatform.Domain.Models;

namespace TradingPlatform.Application.Interfaces;

public record RiskEvaluationResult(bool IsPassed, string? RejectionReason = null);

public interface IRiskPolicyService
{
    Task<RiskEvaluationResult> ValidatePolicyAsync(
        string symbol,
        OrderType orderType,
        decimal lots,
        decimal? currentSpreadPips = null,
        CancellationToken ct = default);
}

public interface ITradeExecutionService
{
    Task<ExecutionResult> ExecuteSignalAsync(SignalResult signal, CancellationToken ct = default);
}

public interface IStrategyEvaluationService
{
    Task<IReadOnlyList<SignalResult>> EvaluateAsync(MarketSnapshot snapshot, CancellationToken ct = default);
}

public interface IDynamicExitService
{
    Task<int> EvaluateExitsAsync(MarketSnapshot snapshot, CancellationToken ct = default);
}

public interface ICandleIngestionService
{
    Task<MarketSnapshot?> IngestCandleAsync(Candle candle, CancellationToken ct = default);
}
