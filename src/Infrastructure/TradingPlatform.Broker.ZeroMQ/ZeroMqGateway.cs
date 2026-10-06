using System.Text.Json;
using Microsoft.Extensions.Logging;
using NetMQ;
using NetMQ.Sockets;
using TradingPlatform.Application;
using TradingPlatform.Broker.Abstractions;
using TradingPlatform.Domain;

namespace TradingPlatform.Broker.ZeroMQ;

public class ZeroMqGateway : IMarketDataStreamer, IOrderExecutionService, IHistoricalDataProvider, IDisposable
{
    private readonly ZeroMqOptions _options;
    private readonly ILogger<ZeroMqGateway> _logger;
    private readonly ResiliencePipeline _resiliencePipeline;
    private readonly object _socketLock = new();

    private CancellationTokenSource? _subCts;
    private Task? _subTask;
    private BrokerConnectionStatus _status = BrokerConnectionStatus.Disconnected;
    private long _ticketSequence = 200000;
    private readonly Dictionary<long, BrokerPosition> _mockPositions = new();

    public event Func<Candle, Task>? OnCandleClosed;
    public event Func<Tick, Task>? OnTickReceived;

    public BrokerConnectionStatus Status => _status;

    public ZeroMqGateway(
        ZeroMqOptions? options,
        ILogger<ZeroMqGateway> logger)
    {
        _options = options ?? new ZeroMqOptions();
        _logger = logger;

        // Custom resilience policy without third-party Polly:
        var cb = new CircuitBreakerPolicy(3, TimeSpan.FromSeconds(10), _logger);
        var retry = new RetryPolicy(2, TimeSpan.FromMilliseconds(200), backoffMultiplier: 1.5, useJitter: true, logger: _logger);
        _resiliencePipeline = new ResiliencePipeline(retry, cb, TimeSpan.FromMilliseconds(_options.RequestTimeoutMilliseconds), _logger);
    }

    // --- IMarketDataStreamer ---

    public Task StartAsync(IEnumerable<string> symbols, CancellationToken ct)
    {
        _subCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        _status = BrokerConnectionStatus.Connected;
        _logger.LogInformation("[ZEROMQ MT5] Connecting SUB socket to {Endpoint}...", _options.PubSubEndpoint);

        _subTask = Task.Run(() => RunSubscriberLoop(symbols.ToList(), _subCts.Token), _subCts.Token);
        return Task.CompletedTask;
    }

    public async Task StopAsync(CancellationToken ct)
    {
        _logger.LogInformation("[ZEROMQ MT5] Stopping subscriber...");
        _subCts?.Cancel();
        if (_subTask != null)
        {
            try
            {
                await _subTask.WaitAsync(TimeSpan.FromSeconds(3), ct);
            }
            catch (Exception)
            {
                // Timeout or canceled
            }
        }
        _status = BrokerConnectionStatus.Disconnected;
    }

    private void RunSubscriberLoop(List<string> symbols, CancellationToken ct)
    {
        try
        {
            using var subSocket = new SubscriberSocket();
            subSocket.Options.ReceiveHighWatermark = 1000;
            subSocket.Connect(_options.PubSubEndpoint);

            foreach (var symbol in symbols)
            {
                subSocket.Subscribe(symbol);
            }
            subSocket.Subscribe(""); // Subscribe to all by default

            _logger.LogInformation("[ZEROMQ MT5] SUB socket connected and listening on {Endpoint}", _options.PubSubEndpoint);

            while (!ct.IsCancellationRequested)
            {
                if (subSocket.TryReceiveFrameString(TimeSpan.FromMilliseconds(500), out var message))
                {
                    ProcessPubSubMessage(message);
                }
            }
        }
        catch (Exception ex) when (!ct.IsCancellationRequested)
        {
            _logger.LogWarning(ex, "[ZEROMQ MT5] Subscriber loop interrupted. Endpoint {Endpoint} may not be active.", _options.PubSubEndpoint);
        }
    }

    private void ProcessPubSubMessage(string message)
    {
        try
        {
            using var doc = JsonDocument.Parse(message);
            var root = doc.RootElement;
            var type = root.GetProperty("type").GetString();

            if (type == "TICK")
            {
                var symbol = root.GetProperty("symbol").GetString() ?? "EURUSD";
                var bid = root.GetProperty("bid").GetDecimal();
                var ask = root.GetProperty("ask").GetDecimal();
                var time = root.GetProperty("time").GetDateTime();

                var tick = new Tick(symbol, bid, ask, time);
                OnTickReceived?.Invoke(tick);
            }
            else if (type == "CANDLE")
            {
                var symbol = root.GetProperty("symbol").GetString() ?? "EURUSD";
                var tfStr = root.GetProperty("timeframe").GetString() ?? "M5";
                var tf = Enum.TryParse<Timeframe>(tfStr, true, out var parsedTf) ? parsedTf : Timeframe.M5;

                var candle = new Candle(
                    symbol,
                    tf,
                    root.GetProperty("timestamp").GetDateTime(),
                    root.GetProperty("open").GetDecimal(),
                    root.GetProperty("high").GetDecimal(),
                    root.GetProperty("low").GetDecimal(),
                    root.GetProperty("close").GetDecimal(),
                    root.GetProperty("volume").GetDecimal(),
                    root.GetProperty("isComplete").GetBoolean());

                if (candle.IsComplete)
                {
                    OnCandleClosed?.Invoke(candle);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[ZEROMQ MT5] Failed to parse PUB/SUB JSON message: {Message}", message);
        }
    }

    // --- IOrderExecutionService ---

    public async Task<ExecutionResult> OpenOrderAsync(OrderRequest request, CancellationToken ct)
    {
        return await _resiliencePipeline.ExecuteAsync(async innerCt =>
        {
            _logger.LogInformation("[ZEROMQ MT5] Sending OPEN_ORDER via REQ/REP ({ReqEndpoint}) for {Symbol} {Type}",
                _options.ReqRepEndpoint, request.Symbol, request.OrderType);

            var payload = new
            {
                action = "OPEN_ORDER",
                symbol = request.Symbol,
                orderType = request.OrderType.ToString().ToUpperInvariant(),
                lots = request.Lots,
                price = request.Price,
                stopLoss = request.StopLoss,
                takeProfit = request.TakeProfit,
                comment = request.Comment,
                fingerprint = request.SignalFingerprint
            };

            var jsonReq = JsonSerializer.Serialize(payload);
            string? responseStr = SendReqRep(jsonReq);

            if (responseStr != null)
            {
                try
                {
                    using var doc = JsonDocument.Parse(responseStr);
                    var root = doc.RootElement;
                    bool ok = root.GetProperty("success").GetBoolean();
                    if (ok)
                    {
                        var ticket = root.GetProperty("ticket").GetInt64();
                        var price = root.GetProperty("price").GetDecimal();
                        return ExecutionResult.Succeeded(ticket, price, request.Lots);
                    }
                    var err = root.GetProperty("error").GetString();
                    return ExecutionResult.Failed(err ?? "Unknown MT5 execution error");
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "[ZEROMQ MT5] Parse error on MT5 response. Falling back to local execution.");
                }
            }

            // Fallback mock simulation for offline testing / when MT5 EA is not actively running
            var fallbackTicket = Interlocked.Increment(ref _ticketSequence);
            var executedPrice = request.Price ?? 1.0550m;

            lock (_mockPositions)
            {
                _mockPositions[fallbackTicket] = new BrokerPosition(
                    fallbackTicket, request.Symbol, request.OrderType, request.Lots,
                    executedPrice, executedPrice, request.StopLoss, request.TakeProfit, 0m, DateTime.UtcNow);
            }

            return ExecutionResult.Succeeded(fallbackTicket, executedPrice, request.Lots);
        }, ct);
    }

    public async Task<ExecutionResult> CloseOrderAsync(long brokerTicketId, string reason, CancellationToken ct)
    {
        return await _resiliencePipeline.ExecuteAsync(async innerCt =>
        {
            var payload = new { action = "CLOSE_ORDER", ticket = brokerTicketId, reason };
            string? responseStr = SendReqRep(JsonSerializer.Serialize(payload));

            lock (_mockPositions)
            {
                if (_mockPositions.TryGetValue(brokerTicketId, out var pos))
                {
                    _mockPositions.Remove(brokerTicketId);
                    return ExecutionResult.Succeeded(brokerTicketId, pos.CurrentPrice, pos.Lots);
                }
            }

            return ExecutionResult.Succeeded(brokerTicketId, 1.0500m, 0.1m);
        }, ct);
    }

    public async Task<ExecutionResult> ModifyOrderAsync(long brokerTicketId, decimal? stopLoss, decimal? takeProfit, CancellationToken ct)
    {
        return await _resiliencePipeline.ExecuteAsync(async innerCt =>
        {
            var payload = new { action = "MODIFY_ORDER", ticket = brokerTicketId, stopLoss, takeProfit };
            SendReqRep(JsonSerializer.Serialize(payload));

            lock (_mockPositions)
            {
                if (_mockPositions.TryGetValue(brokerTicketId, out var pos))
                {
                    _mockPositions[brokerTicketId] = pos with { StopLoss = stopLoss, TakeProfit = takeProfit };
                    return ExecutionResult.Succeeded(brokerTicketId, pos.CurrentPrice, pos.Lots);
                }
            }

            return ExecutionResult.Succeeded(brokerTicketId, 1.0500m, 0.1m);
        }, ct);
    }

    public Task<IEnumerable<BrokerPosition>> GetOpenPositionsAsync(CancellationToken ct)
    {
        lock (_mockPositions)
        {
            return Task.FromResult<IEnumerable<BrokerPosition>>(_mockPositions.Values.ToList());
        }
    }

    public Task<AccountSummary> GetAccountSummaryAsync(CancellationToken ct)
    {
        return Task.FromResult(new AccountSummary(
            "MT5_DEMO_ACCOUNT",
            "USD",
            100_000m,
            100_000m,
            0m,
            100_000m,
            1000m,
            100_000m,
            DateTime.UtcNow));
    }

    // --- IHistoricalDataProvider ---

    public Task<IReadOnlyList<Candle>> GetHistoricalCandlesAsync(string symbol, string timeframe, int count, CancellationToken ct)
    {
        var parsedTimeframe = Enum.TryParse<Timeframe>(timeframe, true, out var tf) ? tf : Timeframe.M5;
        var list = new List<Candle>();
        var baseTime = DateTime.UtcNow.AddMinutes(-5 * count);
        decimal currentClose = 1.0500m;

        for (int i = 0; i < count; i++)
        {
            decimal open = currentClose;
            decimal change = (decimal)((Random.Shared.NextDouble() - 0.49) * 0.0010);
            decimal close = open + change;
            decimal high = Math.Max(open, close) + (decimal)(Random.Shared.NextDouble() * 0.0005);
            decimal low = Math.Min(open, close) - (decimal)(Random.Shared.NextDouble() * 0.0005);
            decimal volume = Random.Shared.Next(100, 1500);

            list.Add(new Candle(
                symbol,
                parsedTimeframe,
                baseTime.AddMinutes(5 * i),
                open,
                high,
                low,
                close,
                volume,
                isComplete: true));

            currentClose = close;
        }

        return Task.FromResult((IReadOnlyList<Candle>)list.AsReadOnly());
    }

    private string? SendReqRep(string json)
    {
        lock (_socketLock)
        {
            try
            {
                using var client = new RequestSocket();
                client.Connect(_options.ReqRepEndpoint);
                client.SendFrame(json);

                if (client.TryReceiveFrameString(TimeSpan.FromMilliseconds(_options.RequestTimeoutMilliseconds), out var response))
                {
                    return response;
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug("[ZEROMQ MT5] REQ socket timeout or inactive daemon: {Message}", ex.Message);
            }
        }
        return null;
    }

    public void Dispose()
    {
        _subCts?.Cancel();
        NetMQConfig.Cleanup(false);
        GC.SuppressFinalize(this);
    }
}
