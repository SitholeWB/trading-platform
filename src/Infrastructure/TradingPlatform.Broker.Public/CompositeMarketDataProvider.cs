using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TradingPlatform.Application.Interfaces;
using TradingPlatform.Broker.Abstractions;
using TradingPlatform.Domain.Models;

namespace TradingPlatform.Broker.Public;

public class CompositeMarketDataProvider : IHistoricalDataProvider
{
    private readonly YahooFinanceGateway _yahooGateway;
    private readonly BinancePublicGateway _binanceGateway;
    private readonly IBrokerConfigurationRepository _configRepo;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<CompositeMarketDataProvider> _logger;

    public CompositeMarketDataProvider(
        YahooFinanceGateway yahooGateway,
        BinancePublicGateway binanceGateway,
        IBrokerConfigurationRepository configRepo,
        IServiceProvider serviceProvider,
        ILogger<CompositeMarketDataProvider> logger)
    {
        _yahooGateway = yahooGateway;
        _binanceGateway = binanceGateway;
        _configRepo = configRepo;
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task<IReadOnlyList<Candle>> GetHistoricalCandlesAsync(
        string symbol,
        string timeframe,
        int count,
        CancellationToken ct)
    {
        var config = await _configRepo.GetConfigurationAsync(ct);

        // 1. If symbol is cryptocurrency, automatically route to 24/7 keyless Binance
        if (IsCryptoSymbol(symbol))
        {
            _logger.LogInformation("[COMPOSITE PROVIDER] Routing crypto symbol {Symbol} to Binance Public Gateway...", symbol);
            return await _binanceGateway.GetHistoricalCandlesAsync(symbol, timeframe, count, ct);
        }

        // 2. If provider is explicitly Oanda and user configured an API token
        if (string.Equals(config.ActiveProvider, "Oanda", StringComparison.OrdinalIgnoreCase) &&
            !string.IsNullOrWhiteSpace(config.OandaApiToken))
        {
            try
            {
                var oandaGateway = _serviceProvider.GetService<IHistoricalDataProvider>();
                if (oandaGateway != null && oandaGateway != this)
                {
                    _logger.LogInformation("[COMPOSITE PROVIDER] Routing {Symbol} to OANDA v20 Gateway...", symbol);
                    return await oandaGateway.GetHistoricalCandlesAsync(symbol, timeframe, count, ct);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[COMPOSITE PROVIDER] Oanda failed, falling back to Keyless Public.");
            }
        }

        // 3. Default: Keyless Public Yahoo Finance Gateway
        _logger.LogInformation("[COMPOSITE PROVIDER] Routing {Symbol} to Keyless Yahoo Finance Gateway...", symbol);
        return await _yahooGateway.GetHistoricalCandlesAsync(symbol, timeframe, count, ct);
    }

    public async Task<IReadOnlyList<Candle>> GetHistoricalCandlesBeforeAsync(
        string symbol,
        string timeframe,
        int count,
        DateTime beforeUtc,
        CancellationToken ct)
    {
        if (IsCryptoSymbol(symbol))
        {
            return await _binanceGateway.GetHistoricalCandlesBeforeAsync(symbol, timeframe, count, beforeUtc, ct);
        }

        return await _yahooGateway.GetHistoricalCandlesBeforeAsync(symbol, timeframe, count, beforeUtc, ct);
    }

    private static bool IsCryptoSymbol(string symbol)
    {
        var s = symbol.ToUpperInvariant();
        return s.EndsWith("USDT") || s.EndsWith("BUSD") ||
               s.StartsWith("BTC") || s.StartsWith("ETH") ||
               s.StartsWith("SOL") || s.StartsWith("XRP") ||
               s.Contains("CRYPTO");
    }
}
