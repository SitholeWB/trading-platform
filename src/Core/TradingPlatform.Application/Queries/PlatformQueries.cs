using TradingPlatform.Broker.Abstractions;
using TradingPlatform.Domain;

namespace TradingPlatform.Application;

// 1. Get Strategies
public record GetStrategiesQuery : IQuery<IReadOnlyList<StrategyDefinition>>;

public class GetStrategiesQueryHandler : IQueryHandler<GetStrategiesQuery, IReadOnlyList<StrategyDefinition>>
{
    private readonly IStrategyRepository _repo;

    public GetStrategiesQueryHandler(IStrategyRepository repo)
    {
        _repo = repo;
    }

    public Task<IReadOnlyList<StrategyDefinition>> HandleAsync(GetStrategiesQuery query, CancellationToken ct = default) =>
        _repo.GetAllAsync(ct);
}

// 2. Get Strategy By Id
public record GetStrategyByIdQuery(Guid Id) : IQuery<StrategyDefinition?>;

public class GetStrategyByIdQueryHandler : IQueryHandler<GetStrategyByIdQuery, StrategyDefinition?>
{
    private readonly IStrategyRepository _repo;

    public GetStrategyByIdQueryHandler(IStrategyRepository repo)
    {
        _repo = repo;
    }

    public Task<StrategyDefinition?> HandleAsync(GetStrategyByIdQuery query, CancellationToken ct = default) =>
        _repo.GetByIdAsync(query.Id, ct);
}

// 3. Get Recent Signal Audit Logs
public record GetRecentSignalAuditLogsQuery(int Count = 50) : IQuery<IReadOnlyList<SignalAuditLog>>;

public class GetRecentSignalAuditLogsQueryHandler : IQueryHandler<GetRecentSignalAuditLogsQuery, IReadOnlyList<SignalAuditLog>>
{
    private readonly ISignalAuditRepository _repo;

    public GetRecentSignalAuditLogsQueryHandler(ISignalAuditRepository repo)
    {
        _repo = repo;
    }

    public Task<IReadOnlyList<SignalAuditLog>> HandleAsync(GetRecentSignalAuditLogsQuery query, CancellationToken ct = default) =>
        _repo.GetRecentAsync(query.Count, ct);
}

// 4. Get Open Positions
public record GetOpenPositionsQuery : IQuery<IReadOnlyList<Position>>;

public class GetOpenPositionsQueryHandler : IQueryHandler<GetOpenPositionsQuery, IReadOnlyList<Position>>
{
    private readonly ITradeRepository _repo;

    public GetOpenPositionsQueryHandler(ITradeRepository repo)
    {
        _repo = repo;
    }

    public Task<IReadOnlyList<Position>> HandleAsync(GetOpenPositionsQuery query, CancellationToken ct = default) =>
        _repo.GetOpenPositionsAsync(ct);
}

// 5. Get Risk Profile
public record GetRiskProfileQuery : IQuery<RiskProfile>;

public class GetRiskProfileQueryHandler : IQueryHandler<GetRiskProfileQuery, RiskProfile>
{
    private readonly IRiskProfileRepository _repo;

    public GetRiskProfileQueryHandler(IRiskProfileRepository repo)
    {
        _repo = repo;
    }

    public Task<RiskProfile> HandleAsync(GetRiskProfileQuery query, CancellationToken ct = default) =>
        _repo.GetOrCreateProfileAsync(ct);
}

// 6. Get Account Summary
public record GetAccountSummaryQuery : IQuery<AccountSummary>;

public class GetAccountSummaryQueryHandler : IQueryHandler<GetAccountSummaryQuery, AccountSummary>
{
    private readonly IOrderExecutionService _orderExecutionService;

    public GetAccountSummaryQueryHandler(IOrderExecutionService orderExecutionService)
    {
        _orderExecutionService = orderExecutionService;
    }

    public Task<AccountSummary> HandleAsync(GetAccountSummaryQuery query, CancellationToken ct = default) =>
        _orderExecutionService.GetAccountSummaryAsync(ct);
}
