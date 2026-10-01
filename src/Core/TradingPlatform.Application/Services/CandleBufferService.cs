using System.Collections.Concurrent;
using TradingPlatform.Application.Interfaces;
using TradingPlatform.Domain.Enums;
using TradingPlatform.Domain.Models;

namespace TradingPlatform.Application.Services;

public class CandleBufferService : ICandleBufferService
{
    private readonly int _maxWindowSize;
    private readonly ConcurrentDictionary<string, List<Candle>> _buffers = new();
    private readonly object _lock = new();

    public CandleBufferService(int maxWindowSize = 300)
    {
        _maxWindowSize = Math.Max(120, maxWindowSize);
    }

    private static string GetKey(string symbol, Timeframe timeframe) =>
        $"{symbol.ToUpperInvariant()}_{timeframe}";

    public void AppendCandle(Candle candle)
    {
        if (candle == null) return;
        var key = GetKey(candle.Symbol, candle.Timeframe);

        lock (_lock)
        {
            if (!_buffers.TryGetValue(key, out var list))
            {
                list = new List<Candle>();
                _buffers[key] = list;
            }

            // If incoming candle has the same timestamp as the latest, update it; otherwise append
            var existingIndex = list.FindIndex(c => c.Timestamp == candle.Timestamp);
            if (existingIndex >= 0)
            {
                list[existingIndex] = candle;
            }
            else
            {
                list.Add(candle);
                // Keep sorted chronologically
                list.Sort((a, b) => a.Timestamp.CompareTo(b.Timestamp));
            }

            // Trim to max sliding window
            if (list.Count > _maxWindowSize)
            {
                list.RemoveRange(0, list.Count - _maxWindowSize);
            }
        }
    }

    public IReadOnlyList<Candle> GetWindow(string symbol, Timeframe timeframe)
    {
        var key = GetKey(symbol, timeframe);
        lock (_lock)
        {
            if (_buffers.TryGetValue(key, out var list))
            {
                return list.ToList().AsReadOnly();
            }
            return Array.Empty<Candle>();
        }
    }
}
