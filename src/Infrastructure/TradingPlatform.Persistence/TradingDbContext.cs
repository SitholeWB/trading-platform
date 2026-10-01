using Microsoft.EntityFrameworkCore;
using TradingPlatform.Domain.Entities;

namespace TradingPlatform.Persistence;

public class TradingDbContext : DbContext
{
    public DbSet<StrategyDefinition> Strategies => Set<StrategyDefinition>();
    public DbSet<SignalAuditLog> SignalAuditLogs => Set<SignalAuditLog>();
    public DbSet<TradeOrder> TradeOrders => Set<TradeOrder>();
    public DbSet<Position> Positions => Set<Position>();
    public DbSet<RiskProfile> RiskProfiles => Set<RiskProfile>();

    public TradingDbContext(DbContextOptions<TradingDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 1. StrategyDefinition configuration
        modelBuilder.Entity<StrategyDefinition>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.Timeframe).HasConversion<string>().HasMaxLength(10);
            entity.Property(e => e.RawJsonRules).IsRequired();
            entity.HasIndex(e => e.Timeframe);
            entity.HasIndex(e => e.IsActive);
        });

        // 2. SignalAuditLog configuration
        // Invariant: Unique index on SignalFingerprint physically prevents duplicate executions
        modelBuilder.Entity<SignalAuditLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.SignalFingerprint).IsRequired().HasMaxLength(150);
            entity.HasIndex(e => e.SignalFingerprint).IsUnique();

            entity.Property(e => e.Symbol).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Timeframe).HasConversion<string>().HasMaxLength(10);
            entity.Property(e => e.State).HasConversion<string>().HasMaxLength(30);
            entity.Property(e => e.EvaluationDetailsJson).IsRequired();

            entity.HasIndex(e => e.StrategyId);
            entity.HasIndex(e => e.Symbol);
            entity.HasIndex(e => e.CreatedAtUtc);
        });

        // 3. TradeOrder configuration
        modelBuilder.Entity<TradeOrder>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Symbol).IsRequired().HasMaxLength(20);
            entity.Property(e => e.OrderType).HasConversion<string>().HasMaxLength(10);
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(20);
            entity.Property(e => e.ExitReason).HasConversion<string>().HasMaxLength(30);

            entity.Property(e => e.Lots).HasPrecision(18, 4);
            entity.Property(e => e.RequestedPrice).HasPrecision(18, 5);
            entity.Property(e => e.ExecutedPrice).HasPrecision(18, 5);
            entity.Property(e => e.Slippage).HasPrecision(18, 5);
            entity.Property(e => e.StopLossPrice).HasPrecision(18, 5);
            entity.Property(e => e.TakeProfitPrice).HasPrecision(18, 5);

            entity.HasIndex(e => e.BrokerTicketId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.OpenedAtUtc);
        });

        // 4. Position configuration
        modelBuilder.Entity<Position>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Symbol).IsRequired().HasMaxLength(20);
            entity.Property(e => e.OrderType).HasConversion<string>().HasMaxLength(10);
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(20);

            entity.Property(e => e.Lots).HasPrecision(18, 4);
            entity.Property(e => e.EntryPrice).HasPrecision(18, 5);
            entity.Property(e => e.CurrentPrice).HasPrecision(18, 5);
            entity.Property(e => e.StopLossPrice).HasPrecision(18, 5);
            entity.Property(e => e.TakeProfitPrice).HasPrecision(18, 5);
            entity.Property(e => e.UnrealizedPnl).HasPrecision(18, 2);

            entity.HasIndex(e => e.BrokerTicketId);
            entity.HasIndex(e => e.Status);
        });

        // 5. RiskProfile configuration
        modelBuilder.Entity<RiskProfile>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.MaxDailyDrawdownPercent).HasPrecision(5, 2);
            entity.Property(e => e.MaxSpreadPipsPerSymbolJson).IsRequired().HasMaxLength(2000);
        });
    }
}
