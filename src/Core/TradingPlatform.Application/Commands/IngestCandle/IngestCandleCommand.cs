using Microsoft.Extensions.Logging;
using TradingPlatform.Application.Commands.DynamicExits;
using TradingPlatform.Application.Commands.EvaluateStrategies;
using TradingPlatform.Application.Common.CQRS;
using TradingPlatform.Application.Common.Validation;
using TradingPlatform.Application.Interfaces;
using TradingPlatform.Domain.Events;
using TradingPlatform.Domain.Models;

namespace TradingPlatform.Application.Commands.IngestCandle;

public record IngestCandleCommand(Candle Candle) : ICommand<MarketSnapshot?>;

public class IngestCandleCommandValidator : AbstractValidator<IngestCandleCommand>
{
    public IngestCandleCommandValidator()
    {
        RuleFor(x => x.Candle).NotNull("Candle payload cannot be null.");
        RuleFor(x => x.Candle.Symbol).NotEmpty("Symbol is required.");
        RuleFor(x => x.Candle.High).GreaterThan(0m, "High price must be positive.");
    }
}

public class IngestCandleCommandHandler : ICommandHandler<IngestCandleCommand, MarketSnapshot?>
{
    private readonly ICandleBufferService _candleBuffer;
    private readonly IIndicatorCalculationService _indicatorCalculator;
    private readonly ICommandDispatcher _commandDispatcher;
    private readonly ILogger<IngestCandleCommandHandler> _logger;

    public IngestCandleCommandHandler(
        ICandleBufferService candleBuffer,
        IIndicatorCalculationService indicatorCalculator,
        ICommandDispatcher commandDispatcher,
        ILogger<IngestCandleCommandHandler> logger)
    {
        _candleBuffer = candleBuffer;
        _indicatorCalculator = indicatorCalculator;
        _commandDispatcher = commandDispatcher;
        _logger = logger;
    }

    public async Task<MarketSnapshot?> HandleAsync(IngestCandleCommand command, CancellationToken ct = default)
    {
        var candle = command.Candle;

        // Invariant: Never trade on incomplete candles. Strict gatekeeping:
        // If Candle.IsComplete == false, candle is stored for tick monitoring only and never triggers rule evaluation.
        if (!candle.IsComplete)
        {
            _logger.LogDebug("[INGESTION] Received incomplete candle for {Symbol} {Timeframe} at {Timestamp:O}. Buffered for tick monitoring only.",
                candle.Symbol, candle.Timeframe, candle.Timestamp);
            return null;
        }

        // Append to in-memory sliding window
        _candleBuffer.AppendCandle(candle);
        var window = _candleBuffer.GetWindow(candle.Symbol, candle.Timeframe);

        _logger.LogInformation("[INGESTION] Completed candle ingested for {Symbol} {Timeframe} at {Timestamp:O}. Window size: {Count}",
            candle.Symbol, candle.Timeframe, candle.Timestamp, window.Count);

        // Calculate technical indicators (EMA, RSI, Ichimoku, ATR, Wick ratios)
        var snapshot = _indicatorCalculator.CalculateSnapshot(window);

        // Trigger strategy evaluation and dynamic exit checks via CQRS Command Dispatcher
        await _commandDispatcher.DispatchAsync(new EvaluateStrategiesCommand(snapshot), ct);
        await _commandDispatcher.DispatchAsync(new EvaluateDynamicExitsCommand(snapshot), ct);

        return snapshot;
    }
}
