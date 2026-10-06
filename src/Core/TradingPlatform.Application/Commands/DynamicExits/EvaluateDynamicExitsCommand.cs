using Microsoft.Extensions.Logging;
using TradingPlatform.Broker.Abstractions;
using TradingPlatform.Domain;

namespace TradingPlatform.Application;

public record EvaluateDynamicExitsCommand(MarketSnapshot Snapshot) : ICommand<int>;

public class EvaluateDynamicExitsCommandHandler : ICommandHandler<EvaluateDynamicExitsCommand, int>
{
    private readonly ITradeRepository _tradeRepository;
    private readonly IOrderExecutionService _orderExecutionService;
    private readonly ILogger<EvaluateDynamicExitsCommandHandler> _logger;

    public EvaluateDynamicExitsCommandHandler(
        ITradeRepository tradeRepository,
        IOrderExecutionService orderExecutionService,
        ILogger<EvaluateDynamicExitsCommandHandler> logger)
    {
        _tradeRepository = tradeRepository;
        _orderExecutionService = orderExecutionService;
        _logger = logger;
    }

    public async Task<int> HandleAsync(EvaluateDynamicExitsCommand command, CancellationToken ct = default)
    {
        var snapshot = command.Snapshot;
        var openPositions = (await _tradeRepository.GetOpenPositionsAsync(ct))
            .Where(p => p.Symbol.Equals(snapshot.Symbol, StringComparison.OrdinalIgnoreCase))
            .ToList();

        if (openPositions.Count == 0) return 0;

        int closedCount = 0;
        foreach (var position in openPositions)
        {
            // Update current mark price
            position.UpdatePrice(snapshot.Close);
            await _tradeRepository.UpdatePositionAsync(position, ct);

            // Dynamic Pattern Failure & Opposing Signal Evaluation
            // Rule 1: Long trade dynamic exit if Close drops below Ichimoku Cloud (SpanA and SpanB) or below EMA200
            bool shouldExitLong = false;
            string exitReasonDesc = string.Empty;

            if (position.OrderType == OrderType.Buy)
            {
                if (snapshot.IchimokuSpanA.HasValue && snapshot.IchimokuSpanB.HasValue)
                {
                    var cloudBottom = Math.Min(snapshot.IchimokuSpanA.Value, snapshot.IchimokuSpanB.Value);
                    if (snapshot.Close < cloudBottom)
                    {
                        shouldExitLong = true;
                        exitReasonDesc = $"Price ({snapshot.Close}) broke below Ichimoku Cloud bottom ({cloudBottom})";
                    }
                }
                else if (snapshot.Ema200.HasValue && snapshot.Close < snapshot.Ema200.Value)
                {
                    shouldExitLong = true;
                    exitReasonDesc = $"Price ({snapshot.Close}) closed below EMA200 ({snapshot.Ema200.Value})";
                }
            }

            // Rule 2: Short trade dynamic exit if Close rallies above Ichimoku Cloud top or above EMA200
            bool shouldExitShort = false;
            if (position.OrderType == OrderType.Sell)
            {
                if (snapshot.IchimokuSpanA.HasValue && snapshot.IchimokuSpanB.HasValue)
                {
                    var cloudTop = Math.Max(snapshot.IchimokuSpanA.Value, snapshot.IchimokuSpanB.Value);
                    if (snapshot.Close > cloudTop)
                    {
                        shouldExitShort = true;
                        exitReasonDesc = $"Price ({snapshot.Close}) rallied above Ichimoku Cloud top ({cloudTop})";
                    }
                }
                else if (snapshot.Ema200.HasValue && snapshot.Close > snapshot.Ema200.Value)
                {
                    shouldExitShort = true;
                    exitReasonDesc = $"Price ({snapshot.Close}) closed above EMA200 ({snapshot.Ema200.Value})";
                }
            }

            if (shouldExitLong || shouldExitShort)
            {
                _logger.LogInformation("[DYNAMIC EXIT] Triggering dynamic exit for Ticket {Ticket} ({Symbol} {Side}): {Reason}",
                    position.BrokerTicketId, position.Symbol, position.OrderType, exitReasonDesc);

                var closeResult = await _orderExecutionService.CloseOrderAsync(
                    position.BrokerTicketId,
                    $"DynamicExit_{exitReasonDesc}",
                    ct);

                if (closeResult.Success)
                {
                    position.Close();
                    await _tradeRepository.UpdatePositionAsync(position, ct);

                    var order = await _tradeRepository.GetOrderByTicketAsync(position.BrokerTicketId, ct);
                    if (order != null)
                    {
                        order.Close(snapshot.Close, ExitReason.OpposingPattern);
                        await _tradeRepository.UpdateOrderAsync(order, ct);
                    }

                    closedCount++;
                }
            }
        }

        return closedCount;
    }
}
