using TradingPlatform.Broker.Abstractions.Models;
using TradingPlatform.Domain.Models;

namespace TradingPlatform.Broker.Abstractions;

public interface IMarketDataStreamer
{
    event Func<Candle, Task> OnCandleClosed;
    event Func<Tick, Task> OnTickReceived;
    Task StartAsync(IEnumerable<string> symbols, CancellationToken ct);
    Task StopAsync(CancellationToken ct);
    BrokerConnectionStatus Status { get; }
}

public interface IOrderExecutionService
{
    Task<ExecutionResult> OpenOrderAsync(OrderRequest request, CancellationToken ct);
    Task<ExecutionResult> CloseOrderAsync(long brokerTicketId, string reason, CancellationToken ct);
    Task<ExecutionResult> ModifyOrderAsync(long brokerTicketId, decimal? stopLoss, decimal? takeProfit, CancellationToken ct);
    Task<IEnumerable<BrokerPosition>> GetOpenPositionsAsync(CancellationToken ct);
    Task<AccountSummary> GetAccountSummaryAsync(CancellationToken ct);
    BrokerConnectionStatus Status { get; }
}

public interface IHistoricalDataProvider
{
    Task<IReadOnlyList<Candle>> GetHistoricalCandlesAsync(string symbol, string timeframe, int count, CancellationToken ct);
}
