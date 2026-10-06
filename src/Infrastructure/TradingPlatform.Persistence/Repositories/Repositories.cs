using Microsoft.EntityFrameworkCore;
using TradingPlatform.Application;
using TradingPlatform.Domain;

namespace TradingPlatform.Persistence;

public class SignalAuditRepository : ISignalAuditRepository
{
    private readonly TradingDbContext _context;

    public SignalAuditRepository(TradingDbContext context)
    {
        _context = context;
    }

    public async Task<bool> ExistsAsync(string fingerprint, CancellationToken ct = default)
    {
        return await _context.SignalAuditLogs
            .AnyAsync(x => x.SignalFingerprint == fingerprint, ct);
    }

    public async Task AddAsync(SignalAuditLog auditLog, CancellationToken ct = default)
    {
        _context.SignalAuditLogs.Add(auditLog);
        await _context.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<SignalAuditLog>> GetRecentAsync(int count, CancellationToken ct = default)
    {
        return await _context.SignalAuditLogs
            .OrderByDescending(x => x.CreatedAtUtc)
            .Take(count)
            .ToListAsync(ct);
    }

    public async Task<SignalAuditLog?> GetByFingerprintAsync(string fingerprint, CancellationToken ct = default)
    {
        return await _context.SignalAuditLogs
            .FirstOrDefaultAsync(x => x.SignalFingerprint == fingerprint, ct);
    }
}

public class StrategyRepository : IStrategyRepository
{
    private readonly TradingDbContext _context;

    public StrategyRepository(TradingDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<StrategyDefinition>> GetActiveStrategiesAsync(Timeframe timeframe, CancellationToken ct = default)
    {
        return await _context.Strategies
            .Where(s => s.IsActive && s.Timeframe == timeframe)
            .ToListAsync(ct);
    }

    public async Task<StrategyDefinition?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.Strategies.FindAsync(new object[] { id }, ct);
    }

    public async Task<IReadOnlyList<StrategyDefinition>> GetAllAsync(CancellationToken ct = default)
    {
        return await _context.Strategies
            .OrderByDescending(s => s.UpdatedAtUtc)
            .ToListAsync(ct);
    }

    public async Task AddAsync(StrategyDefinition strategy, CancellationToken ct = default)
    {
        _context.Strategies.Add(strategy);
        await _context.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(StrategyDefinition strategy, CancellationToken ct = default)
    {
        _context.Strategies.Update(strategy);
        await _context.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _context.Strategies.FindAsync(new object[] { id }, ct);
        if (entity != null)
        {
            _context.Strategies.Remove(entity);
            await _context.SaveChangesAsync(ct);
        }
    }
}

public class TradeRepository : ITradeRepository
{
    private readonly TradingDbContext _context;

    public TradeRepository(TradingDbContext context)
    {
        _context = context;
    }

    public async Task AddOrderAsync(TradeOrder order, CancellationToken ct = default)
    {
        _context.TradeOrders.Add(order);
        await _context.SaveChangesAsync(ct);
    }

    public async Task UpdateOrderAsync(TradeOrder order, CancellationToken ct = default)
    {
        _context.TradeOrders.Update(order);
        await _context.SaveChangesAsync(ct);
    }

    public async Task<TradeOrder?> GetOrderByTicketAsync(long ticketId, CancellationToken ct = default)
    {
        return await _context.TradeOrders
            .FirstOrDefaultAsync(o => o.BrokerTicketId == ticketId, ct);
    }

    public async Task AddPositionAsync(Position position, CancellationToken ct = default)
    {
        _context.Positions.Add(position);
        await _context.SaveChangesAsync(ct);
    }

    public async Task UpdatePositionAsync(Position position, CancellationToken ct = default)
    {
        _context.Positions.Update(position);
        await _context.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<Position>> GetOpenPositionsAsync(CancellationToken ct = default)
    {
        return await _context.Positions
            .Where(p => p.Status == OrderStatus.Open)
            .OrderByDescending(p => p.OpenedAtUtc)
            .ToListAsync(ct);
    }

    public async Task<Position?> GetPositionByTicketAsync(long ticketId, CancellationToken ct = default)
    {
        return await _context.Positions
            .FirstOrDefaultAsync(p => p.BrokerTicketId == ticketId, ct);
    }
}

public class RiskProfileRepository : IRiskProfileRepository
{
    private readonly TradingDbContext _context;

    public RiskProfileRepository(TradingDbContext context)
    {
        _context = context;
    }

    public async Task<RiskProfile> GetOrCreateProfileAsync(CancellationToken ct = default)
    {
        var profile = await _context.RiskProfiles.FirstOrDefaultAsync(ct);
        if (profile == null)
        {
            profile = new RiskProfile();
            _context.RiskProfiles.Add(profile);
            await _context.SaveChangesAsync(ct);
        }
        return profile;
    }

    public async Task UpdateProfileAsync(RiskProfile profile, CancellationToken ct = default)
    {
        _context.RiskProfiles.Update(profile);
        await _context.SaveChangesAsync(ct);
    }
}

public class BrokerConfigurationRepository : IBrokerConfigurationRepository
{
    private readonly TradingDbContext _context;

    public BrokerConfigurationRepository(TradingDbContext context)
    {
        _context = context;
    }

    public async Task<BrokerConfiguration> GetConfigurationAsync(CancellationToken ct = default)
    {
        var config = await _context.BrokerConfigurations.FirstOrDefaultAsync(ct);
        if (config == null)
        {
            config = new BrokerConfiguration
            {
                ActiveProvider = "KeylessPublic",
                OandaEnvironment = "Practice"
            };
            _context.BrokerConfigurations.Add(config);
            await _context.SaveChangesAsync(ct);
        }
        return config;
    }

    public async Task UpdateConfigurationAsync(BrokerConfiguration configuration, CancellationToken ct = default)
    {
        configuration.UpdatedAtUtc = DateTime.UtcNow;
        _context.BrokerConfigurations.Update(configuration);
        await _context.SaveChangesAsync(ct);
    }
}
