using Microsoft.Extensions.Logging;
using TradingPlatform.Application.Interfaces;
using TradingPlatform.Domain.Events;
using TradingPlatform.Domain.Models;

namespace TradingPlatform.Application.Services;

public class CandleIngestionService : ICandleIngestionService
{
    private readonly ICandleBufferService _candleBuffer;
    private readonly IIndicatorCalculationService _indicatorCalculator;
    private readonly IStrategyEvaluationService _strategyEvaluationService;
    private readonly IDynamicExitService _dynamicExitService;
    private readonly ILogger<CandleIngestionService> _logger;

    public CandleIngestionService(
        ICandleBufferService candleBuffer,
        IIndicatorCalculationService indicatorCalculator,
        IStrategyEvaluationService strategyEvaluationService,
        IDynamicExitService dynamicExitService,
        ILogger<CandleIngestionService> logger)
    {
        _candleBuffer = candleBuffer;
        _indicatorCalculator = indicatorCalculator;
        _strategyEvaluationService = strategyEvaluationService;
        _dynamicExitService = dynamicExitService;
        _logger = logger;
    }

    public async Task<MarketSnapshot?> IngestCandleAsync(Candle candle, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(candle);

        // Invariant 1: Never trade on incomplete candles. Strict gatekeeping:
        // If Candle.IsComplete == false, candle is buffered for tick monitoring only and never triggers rule evaluation.
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

        // Trigger strategy evaluation and dynamic exit checks directly without MediatR
        await _strategyEvaluationService.EvaluateAsync(snapshot, ct);
        await _dynamicExitService.EvaluateExitsAsync(snapshot, ct);

        return snapshot;
    }
}
