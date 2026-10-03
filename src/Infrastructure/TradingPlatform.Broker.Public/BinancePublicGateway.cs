using System.Globalization;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using TradingPlatform.Broker.Abstractions;
using TradingPlatform.Domain.Enums;
using TradingPlatform.Domain.Models;

namespace TradingPlatform.Broker.Public;

public class BinancePublicGateway : IHistoricalDataProvider
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<BinancePublicGateway> _logger;

    public BinancePublicGateway(HttpClient httpClient, ILogger<BinancePublicGateway> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<IReadOnlyList<Candle>> GetHistoricalCandlesAsync(
        string symbol,
        string timeframe,
        int count,
        CancellationToken ct)
    {
        var parsedTimeframe = Enum.TryParse<Timeframe>(timeframe, true, out var tf) ? tf : Timeframe.M5;

        string binanceSymbol = NormalizeBinanceSymbol(symbol);
        string interval = MapTimeframeToBinanceInterval(parsedTimeframe);
        int limit = Math.Clamp(count, 10, 1000);

        string url = $"https://api.binance.com/api/v3/klines?symbol={binanceSymbol}&interval={interval}&limit={limit}";
        var candles = await FetchBinanceCandlesAsync(url, symbol, parsedTimeframe, ct);
        if (candles.Count == 0)
        {
            return FallbackCryptoCandles(symbol, parsedTimeframe, count);
        }
        return candles;
    }

    public async Task<IReadOnlyList<Candle>> GetHistoricalCandlesBeforeAsync(
        string symbol,
        string timeframe,
        int count,
        DateTime beforeUtc,
        CancellationToken ct)
    {
        var parsedTimeframe = Enum.TryParse<Timeframe>(timeframe, true, out var tf) ? tf : Timeframe.M5;
        string binanceSymbol = NormalizeBinanceSymbol(symbol);
        string interval = MapTimeframeToBinanceInterval(parsedTimeframe);
        int limit = Math.Clamp(count, 10, 1000);
        // Binance endTime is inclusive: subtract 1ms so the already-loaded oldest bar is not returned again
        long endTimeMs = ((DateTimeOffset)beforeUtc).ToUnixTimeMilliseconds() - 1;

        string url = $"https://api.binance.com/api/v3/klines?symbol={binanceSymbol}&interval={interval}&limit={limit}&endTime={endTimeMs}";
        // Empty result = Binance has no older klines for this symbol (listing date reached)
        return await FetchBinanceCandlesAsync(url, symbol, parsedTimeframe, ct);
    }

    private async Task<List<Candle>> FetchBinanceCandlesAsync(
        string url,
        string symbol,
        Timeframe parsedTimeframe,
        CancellationToken ct)
    {
        var candles = new List<Candle>();
        try
        {
            _logger.LogInformation("[BINANCE PUBLIC] Requesting {Url}...", url);

            using var response = await _httpClient.GetAsync(url, ct);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("[BINANCE PUBLIC] HTTP {Status} received for {Url}", response.StatusCode, url);
                return candles;
            }

            using var stream = await response.Content.ReadAsStreamAsync(ct);
            using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct);

            var root = doc.RootElement;
            if (root.ValueKind != JsonValueKind.Array)
            {
                return candles;
            }

            foreach (var kline in root.EnumerateArray())
            {
                long openTimeMs = kline[0].GetInt64();
                var time = DateTimeOffset.FromUnixTimeMilliseconds(openTimeMs).UtcDateTime;

                decimal o = decimal.Parse(kline[1].GetString()!, CultureInfo.InvariantCulture);
                decimal h = decimal.Parse(kline[2].GetString()!, CultureInfo.InvariantCulture);
                decimal l = decimal.Parse(kline[3].GetString()!, CultureInfo.InvariantCulture);
                decimal c = decimal.Parse(kline[4].GetString()!, CultureInfo.InvariantCulture);
                decimal vol = decimal.Parse(kline[5].GetString()!, CultureInfo.InvariantCulture);

                candles.Add(new Candle(
                    symbol,
                    parsedTimeframe,
                    time,
                    o,
                    h,
                    l,
                    c,
                    vol,
                    isComplete: true));
            }

            _logger.LogInformation("[BINANCE PUBLIC] Retrieved {Count} candles for {Symbol}", candles.Count, symbol);
            return candles;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[BINANCE PUBLIC] Exception fetching crypto candles for {Symbol}", symbol);
            return candles;
        }
    }

    private static string NormalizeBinanceSymbol(string symbol)
    {
        var clean = symbol.Trim().ToUpperInvariant()
            .Replace("/", "")
            .Replace("-", "")
            .Replace("_", "");

        if (clean == "BTC" || clean == "BTCUSD") return "BTCUSDT";
        if (clean == "ETH" || clean == "ETHUSD") return "ETHUSDT";
        if (clean == "SOL" || clean == "SOLUSD") return "SOLUSDT";

        if (!clean.EndsWith("USDT") && !clean.EndsWith("BUSD") && !clean.EndsWith("BTC"))
        {
            return $"{clean}USDT";
        }

        return clean;
    }

    private static string MapTimeframeToBinanceInterval(Timeframe tf) => tf switch
    {
        Timeframe.M1 => "1m",
        Timeframe.M5 => "5m",
        Timeframe.M15 => "15m",
        Timeframe.M30 => "30m",
        Timeframe.H1 => "1h",
        Timeframe.H4 => "4h",
        Timeframe.D1 => "1d",
        Timeframe.W1 => "1w",
        Timeframe.MN1 => "1M",
        _ => "5m"
    };

    private static IReadOnlyList<Candle> FallbackCryptoCandles(string symbol, Timeframe tf, int count) =>
        DeterministicMarketDataSynthesizer.GenerateDeterministicCandles(symbol, tf, count);
}
