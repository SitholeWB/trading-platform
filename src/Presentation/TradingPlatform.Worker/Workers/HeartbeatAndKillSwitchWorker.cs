using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TradingPlatform.Application.Interfaces;
using TradingPlatform.Broker.Abstractions;
using TradingPlatform.Domain.Entities;
using TradingPlatform.Domain.Enums;

namespace TradingPlatform.Worker.Workers;

public class HeartbeatAndKillSwitchWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IOrderExecutionService _orderExecutionService;
    private readonly ILogger<HeartbeatAndKillSwitchWorker> _logger;

    public HeartbeatAndKillSwitchWorker(
        IServiceProvider serviceProvider,
        IOrderExecutionService orderExecutionService,
        ILogger<HeartbeatAndKillSwitchWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _orderExecutionService = orderExecutionService;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("[HEARTBEAT] Heartbeat and Kill-Switch monitor started. Polling interval: 10s.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);

                // 1. Check Broker Connection State
                var status = _orderExecutionService.Status;
                _logger.LogDebug("[HEARTBEAT] Broker connection status: {Status}", status);

                // 2. Fetch Account Equity and Drawdown
                var accountSummary = await _orderExecutionService.GetAccountSummaryAsync(stoppingToken);

                using var scope = _serviceProvider.CreateScope();
                var riskRepo = scope.ServiceProvider.GetRequiredService<IRiskProfileRepository>();
                var auditRepo = scope.ServiceProvider.GetRequiredService<ISignalAuditRepository>();
                var tradeRepo = scope.ServiceProvider.GetRequiredService<ITradeRepository>();

                var riskProfile = await riskRepo.GetOrCreateProfileAsync(stoppingToken);

                _logger.LogInformation("[HEARTBEAT] Equity: ${Equity:N2} | Balance: ${Balance:N2} | Current Drawdown: {DD:F2}% (Limit: {Limit:F2}%) | KillSwitch: {KS}",
                    accountSummary.Equity, accountSummary.Balance, accountSummary.CurrentDrawdownPercent,
                    riskProfile.MaxDailyDrawdownPercent, riskProfile.IsKillSwitchEngaged ? "ENGAGED" : "OFF");

                // 3. Evaluate Drawdown Limit Breach
                if (accountSummary.CurrentDrawdownPercent >= riskProfile.MaxDailyDrawdownPercent && !riskProfile.IsKillSwitchEngaged)
                {
                    _logger.LogCritical("[KILL SWITCH TRIP] EMERGENCY! Daily drawdown breached ({CurrentDD:F2}% >= {MaxDD:F2}%). Liquidating all positions!",
                        accountSummary.CurrentDrawdownPercent, riskProfile.MaxDailyDrawdownPercent);

                    // Engage Kill Switch in DB
                    riskProfile.EngageKillSwitch($"Daily drawdown breached: {accountSummary.CurrentDrawdownPercent:F2}% >= {riskProfile.MaxDailyDrawdownPercent:F2}%");
                    await riskRepo.UpdateProfileAsync(riskProfile, stoppingToken);

                    // Close all open positions immediately via IOrderExecutionService
                    var openPositions = (await _orderExecutionService.GetOpenPositionsAsync(stoppingToken)).ToList();
                    _logger.LogWarning("[KILL SWITCH TRIP] Closing {Count} open positions...", openPositions.Count);

                    foreach (var pos in openPositions)
                    {
                        var closeRes = await _orderExecutionService.CloseOrderAsync(pos.TicketId, "KillSwitch_DailyDrawdownBreached", stoppingToken);
                        if (closeRes.Success)
                        {
                            var dbPos = await tradeRepo.GetPositionByTicketAsync(pos.TicketId, stoppingToken);
                            if (dbPos != null)
                            {
                                dbPos.Close();
                                await tradeRepo.UpdatePositionAsync(dbPos, stoppingToken);
                            }

                            var dbOrder = await tradeRepo.GetOrderByTicketAsync(pos.TicketId, stoppingToken);
                            if (dbOrder != null)
                            {
                                dbOrder.Close(closeRes.ExecutedPrice, ExitReason.KillSwitch);
                                await tradeRepo.UpdateOrderAsync(dbOrder, stoppingToken);
                            }
                        }
                    }

                    // Write critical audit event
                    var criticalAudit = new SignalAuditLog(
                        $"KILL_SWITCH_{DateTime.UtcNow:yyyyMMddHHmmss}",
                        Guid.Empty,
                        "ALL",
                        Timeframe.M5,
                        DateTime.UtcNow,
                        SignalState.RejectedByRisk,
                        $"{{\"killSwitchEngaged\": true, \"currentDrawdownPercent\": {accountSummary.CurrentDrawdownPercent}, \"limit\": {riskProfile.MaxDailyDrawdownPercent}, \"positionsClosed\": {openPositions.Count}}}");

                    await auditRepo.AddAsync(criticalAudit, stoppingToken);
                }
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[HEARTBEAT ERROR] Error occurred during heartbeat execution.");
            }
        }
    }
}
