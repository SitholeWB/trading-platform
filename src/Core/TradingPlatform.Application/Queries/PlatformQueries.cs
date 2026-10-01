using TradingPlatform.Application.Common.CQRS;
using TradingPlatform.Application.Interfaces;
using TradingPlatform.Broker.Abstractions;
using TradingPlatform.Broker.Abstractions.Models;
using TradingPlatform.Domain.Entities;

namespace TradingPlatform.Application.Queries;

// 1. Get Strategies
public record GetStrategiesQuery : IQuery<IReadOnlyList<StrategyDefinition>>;

public class GetStrategiesQueryHandler : IRequestHandler<GetStrategiesQuery, IReadOnlyList<StrategyDefinition>>
{
    private readonly IStrategyRepository _repo;

    public GetStrategiesQueryHandler(IStrategyRepository repo)
    {
        _repo = repo;
    }

    public Task<IReadOnlyList<StrategyDefinition>> Handle(GetStrategiesQuery request, CancellationToken ct) =>
        _repo.GetAllAsync(ct);
}

// 2. Get Strategy By Id
public record GetStrategyByIdQuery(Guid Id) : IQuery<StrategyDefinition?>;

public class GetStrategyByIdQueryHandler : IRequestHandler<GetStrategyByIdQuery, StrategyDefinition?>
{
    private readonly IStrategyRepository _repo;

    public GetStrategyByIdQueryHandler(IStrategyRepository repo)
    {
        _repo = repo;
    }

    public Task<StrategyDefinition?> Handle(GetStrategyByIdQuery request, CancellationToken ct) =>
        _repo.GetByIdAsync(request.Id, ct);
}

// 3. Get Recent Signal Audit Logs
public record GetRecentSignalAuditLogsQuery(int Count = 50) : IQuery<IReadOnlyList<SignalAuditLog>>;

public class GetRecentSignalAuditLogsQueryHandler : IRequestHandler<GetRecentSignalAuditLogsQuery, IReadOnlyList<SignalAuditLog>>
{
    private readonly ISignalAuditRepository _repo;

    public GetRecentSignalAuditLogsQueryHandler(ISignalAuditRepository repo)
    {
        _repo = repo;
    }

    public Task<IReadOnlyList<SignalAuditLog>> Handle(GetRecentSignalAuditLogsQuery request, CancellationToken ct) =>
        _repo.GetRecentAsync(request.Count, ct);
}

// 4. Get Open Positions
public record GetOpenPositionsQuery : IQuery<IReadOnlyList<Position>>;

public class GetOpenPositionsQueryHandler : IRequestHandler<GetOpenPositionsQuery, IReadOnlyList<Position>>
{
    private readonly ITradeRepository _repo;

    public GetOpenPositionsQueryHandler(ITradeRepository repo)
    {
        _repo = repo;
    }

    public Task<IReadOnlyList<Position>> Handle(GetOpenPositionsQuery request, CancellationToken ct) =>
        _repo.GetOpenPositionsAsync(ct);
}

// 5. Get Risk Profile
public record GetRiskProfileQuery : IQuery<RiskProfile>;

public class GetRiskProfileQueryHandler : IRequestHandler<GetRiskProfileQuery, RiskProfile>
{
    private readonly IRiskProfileRepository _repo;

    public GetRiskProfileQueryHandler(IRiskProfileRepository repo)
    {
        _repo = repo;
    }

    public Task<RiskProfile> Handle(GetRiskProfileQuery request, CancellationToken ct) =>
        _repo.GetOrCreateProfileAsync(ct);
}

// 6. Get Account Summary
public record GetAccountSummaryQuery : IQuery<AccountSummary>;

public class GetAccountSummaryQueryHandler : IRequestHandler<GetAccountSummaryQuery, AccountSummary>
{
    private readonly IOrderExecutionService _orderExecutionService;

    public GetAccountSummaryQueryHandler(IOrderExecutionService orderExecutionService)
    {
        _orderExecutionService = orderExecutionService;
    }

    public Task<AccountSummary> Handle(GetAccountSummaryQuery request, CancellationToken ct) =>
        _orderExecutionService.GetAccountSummaryAsync(ct);
}
