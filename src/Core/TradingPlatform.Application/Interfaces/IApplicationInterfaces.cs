using TradingPlatform.Domain.Entities;
using TradingPlatform.Domain.Enums;
using TradingPlatform.Domain.Models;

namespace TradingPlatform.Application.Interfaces;

public record RuleFailureDetail(string RuleName, string Expression, string FailureReason, decimal? NearMissScore = null);

public record SignalResult(
    Guid StrategyId,
    string StrategyName,
    string Symbol,
    Timeframe Timeframe,
    DateTime CandleTimestamp,
    SignalState State,
    OrderType RecommendedOrderType,
    decimal EntryPrice,
    decimal? StopLoss,
    decimal? TakeProfit,
    bool AutoTradingEnabled,
    bool AiValidationEnabled,
    IReadOnlyList<RuleFailureDetail> RuleDetails,
    string EvaluationDetailsJson);

public interface IRulesEngineService
{
    Task<IReadOnlyList<SignalResult>> EvaluateAsync(
        MarketSnapshot snapshot,
        IEnumerable<StrategyDefinition> strategies,
        CancellationToken ct = default);
}

public interface IIndicatorCalculationService
{
    MarketSnapshot CalculateSnapshot(IReadOnlyList<Candle> slidingWindow);
    void RegisterIndicatorPeriods(IEnumerable<int>? emaPeriods, IEnumerable<int>? smaPeriods = null);
}

public interface ICandleBufferService
{
    void AppendCandle(Candle candle);
    IReadOnlyList<Candle> GetWindow(string symbol, Timeframe timeframe);
}

public interface ISignalAuditRepository
{
    Task<bool> ExistsAsync(string fingerprint, CancellationToken ct = default);
    Task AddAsync(SignalAuditLog auditLog, CancellationToken ct = default);
    Task<IReadOnlyList<SignalAuditLog>> GetRecentAsync(int count, CancellationToken ct = default);
    Task<SignalAuditLog?> GetByFingerprintAsync(string fingerprint, CancellationToken ct = default);
}

public interface IStrategyRepository
{
    Task<IReadOnlyList<StrategyDefinition>> GetActiveStrategiesAsync(Timeframe timeframe, CancellationToken ct = default);
    Task<StrategyDefinition?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<StrategyDefinition>> GetAllAsync(CancellationToken ct = default);
    Task AddAsync(StrategyDefinition strategy, CancellationToken ct = default);
    Task UpdateAsync(StrategyDefinition strategy, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}

public interface ITradeRepository
{
    Task AddOrderAsync(TradeOrder order, CancellationToken ct = default);
    Task UpdateOrderAsync(TradeOrder order, CancellationToken ct = default);
    Task<TradeOrder?> GetOrderByTicketAsync(long ticketId, CancellationToken ct = default);
    Task AddPositionAsync(Position position, CancellationToken ct = default);
    Task UpdatePositionAsync(Position position, CancellationToken ct = default);
    Task<IReadOnlyList<Position>> GetOpenPositionsAsync(CancellationToken ct = default);
    Task<Position?> GetPositionByTicketAsync(long ticketId, CancellationToken ct = default);
}

public interface IRiskProfileRepository
{
    Task<RiskProfile> GetOrCreateProfileAsync(CancellationToken ct = default);
    Task UpdateProfileAsync(RiskProfile profile, CancellationToken ct = default);
}

public interface IBrokerConfigurationRepository
{
    Task<BrokerConfiguration> GetConfigurationAsync(CancellationToken ct = default);
    Task UpdateConfigurationAsync(BrokerConfiguration configuration, CancellationToken ct = default);
}

public interface ISymbolGroupRepository
{
    Task<IReadOnlyList<SymbolGroup>> GetAllAsync(CancellationToken ct = default);
    Task<SymbolGroup?> GetByIdAsync(string id, CancellationToken ct = default);
    Task AddAsync(SymbolGroup group, CancellationToken ct = default);
    Task UpdateAsync(SymbolGroup group, CancellationToken ct = default);
    Task DeleteAsync(string id, CancellationToken ct = default);
}

public interface IMarketScannerService
{
    Task<LiveScanReport> RunLiveScanAsync(LiveScanRequest request, CancellationToken ct = default);
    Task<HistoricalScanReport> RunHistoricalScanAsync(HistoricalScanRequest request, CancellationToken ct = default);
    LiveScanReport? GetLatestLiveScanReport();
    HistoricalScanReport? GetLatestHistoricalScanReport();
}

