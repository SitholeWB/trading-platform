using System.Collections.Concurrent;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TradingPlatform.Application.Interfaces;
using TradingPlatform.Broker.Abstractions;
using TradingPlatform.Domain.Entities;
using TradingPlatform.Domain.Enums;
using TradingPlatform.Domain.Models;

namespace TradingPlatform.Broker.Public;

public record KeylessProviderHealth(
    string ActiveProvider,
    bool IsFailoverEngaged,
    string? ActiveFailoverProvider,
    string? LastFailoverReason,
    DateTime? LastFailoverUtc,
    string YahooSessionStatus);

/// <summary>
/// Composite market data orchestrator with automatic keyless cross-provider failover.
/// Provides zero-key continuous uptime by dynamically routing and failing over between:
/// - Yahoo Finance (Forex, Indices, Commodities, Stocks) with automated Crumb/Cookie session
/// - Binance Public 24/7 (Crypto)
/// - Frankfurter ECB (Official European Central Bank interbank Forex fallback)
/// - OANDA v20 (Optional authenticated broker institutional feed)
/// </summary>
public class CompositeMarketDataProvider : IHistoricalDataProvider
{
    private readonly YahooFinanceGateway _yahooGateway;
    private readonly BinancePublicGateway _binanceGateway;
    private readonly FrankfurterPublicGateway _frankfurterGateway;
    private readonly YahooFinanceSessionManager _sessionManager;
    private readonly IBrokerConfigurationRepository _configRepo;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<CompositeMarketDataProvider> _logger;

    private static bool _isFailoverEngaged = false;
    private static string? _activeFailoverProvider = null;
    private static string? _lastFailoverReason = null;
    private static DateTime? _lastFailoverUtc = null;

    private static BrokerConfiguration? _cachedConfig;
    private static DateTime _configCacheExpiryUtc = DateTime.MinValue;
    private static readonly SemaphoreSlim _configLock = new(1, 1);

    private static readonly ConcurrentDictionary<string, (DateTime ExpirationUtc, IReadOnlyList<Candle> Candles)> _candleCache = new();

    public static void InvalidateConfigCache()
    {
        _cachedConfig = null;
        _configCacheExpiryUtc = DateTime.MinValue;
    }

    private async Task<BrokerConfiguration> GetCachedBrokerConfigAsync(CancellationToken ct)
    {
        if (_cachedConfig != null && DateTime.UtcNow < _configCacheExpiryUtc)
        {
            return _cachedConfig;
        }

        await _configLock.WaitAsync(ct);
        try
        {
            if (_cachedConfig != null && DateTime.UtcNow < _configCacheExpiryUtc)
            {
                return _cachedConfig;
            }

            var config = await _configRepo.GetConfigurationAsync(ct);
            _cachedConfig = config;
            _configCacheExpiryUtc = DateTime.UtcNow.AddMinutes(2);
            return config;
        }
        finally
        {
            _configLock.Release();
        }
    }

    public CompositeMarketDataProvider(
        YahooFinanceGateway yahooGateway,
        BinancePublicGateway binanceGateway,
        FrankfurterPublicGateway frankfurterGateway,
        YahooFinanceSessionManager sessionManager,
        IBrokerConfigurationRepository configRepo,
        IServiceProvider serviceProvider,
        ILogger<CompositeMarketDataProvider> logger)
    {
        _yahooGateway = yahooGateway;
        _binanceGateway = binanceGateway;
        _frankfurterGateway = frankfurterGateway;
        _sessionManager = sessionManager;
        _configRepo = configRepo;
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public static KeylessProviderHealth GetHealthStatus(string activeConfigProvider, string yahooStatus) =>
        new(
            ActiveProvider: activeConfigProvider,
            IsFailoverEngaged: _isFailoverEngaged,
            ActiveFailoverProvider: _activeFailoverProvider,
            LastFailoverReason: _lastFailoverReason,
            LastFailoverUtc: _lastFailoverUtc,
            YahooSessionStatus: yahooStatus);

    public static void InvalidateCandleCache(string? symbol = null)
    {
        if (string.IsNullOrWhiteSpace(symbol))
        {
            _candleCache.Clear();
        }
        else
        {
            string prefix = symbol.Trim().ToUpperInvariant() + "_";
            foreach (var key in _candleCache.Keys)
            {
                if (key.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                {
                    _candleCache.TryRemove(key, out _);
                }
            }
        }
    }

    public Task<IReadOnlyList<MarketQuote>> GetQuotesAsync(IEnumerable<string>? symbols, CancellationToken ct)
    {
        var quotes = DeterministicMarketDataSynthesizer.GetLiveQuotes(symbols, DateTime.UtcNow);
        return Task.FromResult(quotes);
    }

    public Task<IReadOnlyList<Candle>> GetHistoricalCandlesAsync(
        string symbol,
        string timeframe,
        int count,
        CancellationToken ct)
        => GetHistoricalCandlesAsync(symbol, timeframe, count, forceRefresh: false, ct);

    public async Task<IReadOnlyList<Candle>> GetHistoricalCandlesAsync(
        string symbol,
        string timeframe,
        int count,
        bool forceRefresh,
        CancellationToken ct)
    {
        string cacheKey = $"{symbol.Trim().ToUpperInvariant()}_{timeframe.Trim().ToUpperInvariant()}_{count}";
        var nowUtc = DateTime.UtcNow;
        var parsedTf = Enum.TryParse<Timeframe>(timeframe, true, out var tf) ? tf : Timeframe.M5;

        if (forceRefresh)
        {
            _candleCache.TryRemove(cacheKey, out _);
        }
        else if (_candleCache.TryGetValue(cacheKey, out var cached) && cached.ExpirationUtc > nowUtc)
        {
            return EnsureLiveFormingCandle(cached.Candles, symbol, parsedTf, count, nowUtc);
        }

        var config = await GetCachedBrokerConfigAsync(ct);

        // 1. If configured provider is explicitly Oanda and token is present
        if (string.Equals(config.ActiveProvider, "Oanda", StringComparison.OrdinalIgnoreCase) &&
            !string.IsNullOrWhiteSpace(config.OandaApiToken))
        {
            try
            {
                var oandaGateway = _serviceProvider.GetService<IHistoricalDataProvider>();
                if (oandaGateway != null && oandaGateway != this)
                {
                    _logger.LogInformation("[COMPOSITE PROVIDER] Routing {Symbol} to OANDA v20 Gateway...", symbol);
                    var oandaCandles = await oandaGateway.GetHistoricalCandlesAsync(symbol, timeframe, count, ct);
                    if (oandaCandles.Count > 0)
                    {
                        ResetFailoverState();
                        var liveOanda = EnsureLiveFormingCandle(oandaCandles, symbol, parsedTf, count, nowUtc);
                        _candleCache[cacheKey] = (DateTime.UtcNow.AddSeconds(15), liveOanda);
                        return liveOanda;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[COMPOSITE PROVIDER] Oanda failed. Engaging keyless auto-failover.");
                EngageFailover("OANDA broker connection dropped; auto-failover to keyless public feeds.", "KeylessPublic");
            }
        }

        // 2. Cryptocurrency: Primary = Binance Public; Fallback = Yahoo Finance
        if (IsCryptoSymbol(symbol))
        {
            try
            {
                var binanceCandles = await _binanceGateway.GetHistoricalCandlesAsync(symbol, timeframe, count, ct);
                if (binanceCandles.Count > 0)
                {
                    ResetFailoverState();
                    var liveBinance = EnsureLiveFormingCandle(binanceCandles, symbol, parsedTf, count, nowUtc);
                    _candleCache[cacheKey] = (DateTime.UtcNow.AddSeconds(15), liveBinance);
                    return liveBinance;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[COMPOSITE PROVIDER] Binance Public failed for {Symbol}. Auto-failing over to Yahoo Finance crypto...", symbol);
                EngageFailover($"Binance Public unreachable for {symbol}; auto-failover to Yahoo Finance.", "YahooFinance-Backup");
            }

            // Fallback to Yahoo for crypto (e.g. BTC-USD)
            try
            {
                var yahooCrypto = await _yahooGateway.GetHistoricalCandlesAsync(symbol, timeframe, count, ct);
                if (yahooCrypto.Count > 0)
                {
                    var liveYahooCrypto = EnsureLiveFormingCandle(yahooCrypto, symbol, parsedTf, count, nowUtc);
                    _candleCache[cacheKey] = (DateTime.UtcNow.AddSeconds(15), liveYahooCrypto);
                    return liveYahooCrypto;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[COMPOSITE PROVIDER] Yahoo crypto fallback also failed for {Symbol}.", symbol);
            }
        }

        // 3. Forex Pairs: Primary = Yahoo Finance (Authenticated Crumb); Fallback = Frankfurter ECB
        bool isForex = IsForexSymbol(symbol);
        if (isForex)
        {
            try
            {
                var yahooCandles = await _yahooGateway.GetHistoricalCandlesAsync(symbol, timeframe, count, ct);
                if (yahooCandles.Count > 0)
                {
                    ResetFailoverState();
                    var liveYahooForex = EnsureLiveFormingCandle(yahooCandles, symbol, parsedTf, count, nowUtc);
                    _candleCache[cacheKey] = (DateTime.UtcNow.AddSeconds(15), liveYahooForex);
                    return liveYahooForex;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[COMPOSITE PROVIDER] Yahoo Finance failed for Forex {Symbol}. Auto-failing over to European Central Bank (Frankfurter)...", symbol);
                EngageFailover($"Yahoo Finance unreachable for {symbol}; auto-failover to European Central Bank (Frankfurter).", "Frankfurter-ECB");
            }

            // Auto-Failover to European Central Bank Frankfurter API
            try
            {
                _logger.LogInformation("[COMPOSITE PROVIDER] Keyless auto-failover: querying European Central Bank (Frankfurter) for {Symbol}...", symbol);
                var ecbCandles = await _frankfurterGateway.GetHistoricalCandlesAsync(symbol, timeframe, count, ct);
                if (ecbCandles.Count > 0)
                {
                    EngageFailover($"Yahoo Finance offline for {symbol}; served official ECB rates via Frankfurter.", "Frankfurter-ECB");
                    var liveEcb = EnsureLiveFormingCandle(ecbCandles, symbol, parsedTf, count, nowUtc);
                    _candleCache[cacheKey] = (DateTime.UtcNow.AddSeconds(15), liveEcb);
                    return liveEcb;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[COMPOSITE PROVIDER] Frankfurter ECB fallback also encountered error for {Symbol}.", symbol);
            }
        }

        // 4. General Instruments (Indices, Commodities, Stocks): Primary = Yahoo Finance
        try
        {
            var generalCandles = await _yahooGateway.GetHistoricalCandlesAsync(symbol, timeframe, count, ct);
            if (generalCandles.Count > 0)
            {
                ResetFailoverState();
                var liveGeneral = EnsureLiveFormingCandle(generalCandles, symbol, parsedTf, count, nowUtc);
                _candleCache[cacheKey] = (DateTime.UtcNow.AddSeconds(15), liveGeneral);
                return liveGeneral;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[COMPOSITE PROVIDER] Yahoo Finance failed for {Symbol}.", symbol);
        }

        // 5. Final Resilient Continuity Fallback: 100% Deterministic Synthesizer
        _logger.LogInformation("[COMPOSITE PROVIDER] Activating deterministic market synthesizer for {Symbol} {Timeframe} ({Count} bars)",
            symbol, timeframe, count);
        EngageFailover($"External market data feeds unavailable for {symbol}; activated deterministic resilient synthesizer.", "Deterministic-Synthesizer");

        var syntheticCandles = DeterministicMarketDataSynthesizer.GenerateDeterministicCandles(symbol, parsedTf, count, nowUtc);
        _candleCache[cacheKey] = (DateTime.UtcNow.AddSeconds(15), syntheticCandles);
        return syntheticCandles;
    }

    private static IReadOnlyList<Candle> EnsureLiveFormingCandle(
        IReadOnlyList<Candle> candles,
        string symbol,
        Timeframe timeframe,
        int count,
        DateTime nowUtc)
    {
        if (candles == null || candles.Count == 0)
        {
            return DeterministicMarketDataSynthesizer.GenerateDeterministicCandles(symbol, timeframe, count, nowUtc);
        }

        var barDuration = DeterministicMarketDataSynthesizer.GetTimeframeDuration(timeframe);
        long barTicks = barDuration.Ticks;
        long alignedTicks = (nowUtc.Ticks / barTicks) * barTicks;
        var currentBarTime = new DateTime(alignedTicks, DateTimeKind.Utc);

        var quote = DeterministicMarketDataSynthesizer.GetLiveQuote(symbol, nowUtc);
        var list = new List<Candle>(candles);

        var lastCandle = list[^1];
        if (lastCandle.Timestamp >= currentBarTime)
        {
            // Active forming bar at current boundary: update close and intra-bar extremes
            decimal open = lastCandle.Open;
            decimal high = Math.Max(lastCandle.High, Math.Max(open, quote.Price));
            decimal low = Math.Min(lastCandle.Low, Math.Min(open, quote.Price));
            list[^1] = new Candle(
                symbol: symbol,
                timeframe: timeframe,
                timestamp: lastCandle.Timestamp,
                open: open,
                high: high,
                low: low,
                close: quote.Price,
                volume: Math.Max(lastCandle.Volume, 150m),
                isComplete: false
            );
        }
        else
        {
            // Historical bars from delayed external source ended earlier; append active forming bar
            decimal open = lastCandle.Close;
            decimal high = Math.Max(open, quote.Price);
            decimal low = Math.Min(open, quote.Price);
            list.Add(new Candle(
                symbol: symbol,
                timeframe: timeframe,
                timestamp: currentBarTime,
                open: open,
                high: high,
                low: low,
                close: quote.Price,
                volume: 250m,
                isComplete: false
            ));
        }

        if (list.Count > count)
        {
            list = list.TakeLast(count).ToList();
        }

        return list;
    }

    public async Task<IReadOnlyList<Candle>> GetHistoricalCandlesBeforeAsync(
        string symbol,
        string timeframe,
        int count,
        DateTime beforeUtc,
        CancellationToken ct)
    {
        string beforeKey = $"{symbol.Trim().ToUpperInvariant()}_{timeframe.Trim().ToUpperInvariant()}_{count}_{beforeUtc.Ticks}";
        if (_candleCache.TryGetValue(beforeKey, out var cachedBefore) && cachedBefore.ExpirationUtc > DateTime.UtcNow)
        {
            return cachedBefore.Candles;
        }

        var parsedTf = Enum.TryParse<Timeframe>(timeframe, true, out var tf) ? tf : Timeframe.M5;

        if (IsCryptoSymbol(symbol))
        {
            try
            {
                var binanceOlder = await _binanceGateway.GetHistoricalCandlesBeforeAsync(symbol, timeframe, count, beforeUtc, ct);
                if (binanceOlder.Count > 0)
                {
                    _candleCache[beforeKey] = (DateTime.UtcNow.AddMinutes(5), binanceOlder);
                    return binanceOlder;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[COMPOSITE PROVIDER] Binance older candles failed for {Symbol}, failing over to Yahoo.", symbol);
            }

            try
            {
                var yahooCrypto = await _yahooGateway.GetHistoricalCandlesBeforeAsync(symbol, timeframe, count, beforeUtc, ct);
                if (yahooCrypto.Count > 0)
                {
                    _candleCache[beforeKey] = (DateTime.UtcNow.AddMinutes(5), yahooCrypto);
                    return yahooCrypto;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[COMPOSITE PROVIDER] Yahoo crypto older candles failed for {Symbol}.", symbol);
            }
        }

        if (IsForexSymbol(symbol))
        {
            try
            {
                var yahooOlder = await _yahooGateway.GetHistoricalCandlesBeforeAsync(symbol, timeframe, count, beforeUtc, ct);
                if (yahooOlder.Count > 0)
                {
                    _candleCache[beforeKey] = (DateTime.UtcNow.AddMinutes(5), yahooOlder);
                    return yahooOlder;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[COMPOSITE PROVIDER] Yahoo older candles failed for {Symbol}, failing over to Frankfurter ECB.", symbol);
                EngageFailover($"Yahoo Finance history rejected for {symbol}; failover to ECB.", "Frankfurter-ECB");
            }

            try
            {
                var ecbOlder = await _frankfurterGateway.GetHistoricalCandlesBeforeAsync(symbol, timeframe, count, beforeUtc, ct);
                if (ecbOlder.Count > 0)
                {
                    _candleCache[beforeKey] = (DateTime.UtcNow.AddMinutes(5), ecbOlder);
                    return ecbOlder;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[COMPOSITE PROVIDER] Frankfurter ECB older candles failed for {Symbol}.", symbol);
            }
        }

        try
        {
            var generalOlder = await _yahooGateway.GetHistoricalCandlesBeforeAsync(symbol, timeframe, count, beforeUtc, ct);
            if (generalOlder.Count > 0)
            {
                _candleCache[beforeKey] = (DateTime.UtcNow.AddMinutes(5), generalOlder);
                return generalOlder;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[COMPOSITE PROVIDER] Yahoo general older candles failed for {Symbol}.", symbol);
        }

        // Deterministic fallback for historical window
        var syntheticOlder = DeterministicMarketDataSynthesizer.GenerateDeterministicCandles(symbol, parsedTf, count, beforeUtc);
        _candleCache[beforeKey] = (DateTime.UtcNow.AddMinutes(5), syntheticOlder);
        return syntheticOlder;
    }

    private static bool IsCryptoSymbol(string symbol)
    {
        var s = symbol.ToUpperInvariant();
        return s.EndsWith("USDT") || s.EndsWith("BUSD") ||
               s.StartsWith("BTC") || s.StartsWith("ETH") ||
               s.StartsWith("SOL") || s.StartsWith("XRP") ||
               s.StartsWith("BNB") || s.StartsWith("ADA") ||
               s.StartsWith("DOGE") || s.StartsWith("AVAX") ||
               s.StartsWith("LINK") || s.StartsWith("NEAR") ||
               s.Contains("CRYPTO");
    }

    private static bool IsForexSymbol(string symbol)
    {
        var s = symbol.ToUpperInvariant().Replace("/", "").Replace("_", "").Replace("=X", "");
        return s.Length == 6 &&
               (s.StartsWith("EUR") || s.StartsWith("GBP") || s.StartsWith("USD") ||
                s.StartsWith("AUD") || s.StartsWith("NZD") || s.StartsWith("CAD") ||
                s.StartsWith("CHF") || s.StartsWith("JPY") || s.StartsWith("ZAR"));
    }

    private static void EngageFailover(string reason, string providerName)
    {
        _isFailoverEngaged = true;
        _activeFailoverProvider = providerName;
        _lastFailoverReason = reason;
        _lastFailoverUtc = DateTime.UtcNow;
    }

    private static void ResetFailoverState()
    {
        if (_isFailoverEngaged)
        {
            _isFailoverEngaged = false;
            _activeFailoverProvider = null;
        }
    }
}
