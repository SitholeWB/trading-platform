import 'dart:convert';
import 'dart:math' as math;
import 'package:http/http.dart' as http;
import '../models/trading_models.dart';
import 'indicator_engine.dart';
import 'storage_service.dart';
import 'symbol_catalog.dart';

class MarketDataResult {
  final List<Candle> candles;
  final String sourceName;
  const MarketDataResult(this.candles, this.sourceName);
}

class MarketDataService {
  final StorageService storage;
  final Map<String, MarketDataResult> _cache = {};

  MarketDataService(this.storage);

  Future<MarketDataResult> fetchCandles(
    String symbol,
    Timeframe tf, {
    int count = 240,
    bool forceRefresh = false,
  }) async {
    final key = '${symbol.toUpperCase()}_${tf.code}';
    if (!forceRefresh && _cache.containsKey(key)) {
      return _cache[key]!;
    }

    final spec = SymbolCatalog.find(symbol);
    List<Candle> candles = [];
    String source = 'Synthetic';

    if (storage.activeProvider == 'Oanda' &&
        storage.oandaApiKey.isNotEmpty &&
        storage.oandaAccountId.isNotEmpty) {
      candles = await _fetchOanda(spec, tf, count);
      if (candles.isNotEmpty) source = 'OANDA';
    } else if (storage.activeProvider == 'TwelveData' &&
        storage.twelveDataApiKey.isNotEmpty) {
      candles = await _fetchTwelveData(spec, tf, count);
      if (candles.isNotEmpty) source = 'TwelveData';
    }

    if (candles.isEmpty && storage.activeProvider != 'Demo') {
      candles = await _fetchYahooFinance(spec, tf);
      if (candles.isNotEmpty) source = 'YahooFinance';
    }

    if (candles.isEmpty) {
      candles = synthesizeCandles(spec.symbol, tf, count: count);
      source = storage.activeProvider == 'Demo'
          ? 'DemoSimulator'
          : 'DeterministicFallback';
    }

    final aligned = IndicatorEngine.aggregateAndAlignCandles(candles, tf);
    final result = MarketDataResult(aligned, source);
    _cache[key] = result;
    return result;
  }

  Future<List<Candle>> _fetchYahooFinance(
    SymbolSpec spec,
    Timeframe tf,
  ) async {
    try {
      final (interval, range) = switch (tf) {
        Timeframe.m1 => ('1m', '1d'),
        Timeframe.m5 => ('5m', '5d'),
        Timeframe.m15 => ('15m', '5d'),
        Timeframe.m30 => ('30m', '1mo'),
        Timeframe.h1 => ('60m', '1mo'),
        Timeframe.h4 => ('60m', '3mo'),
        Timeframe.d1 => ('1d', '1y'),
        Timeframe.w1 => ('1wk', '5y'),
      };

      final uri = Uri.parse(
        'https://query1.finance.yahoo.com/v8/finance/chart/${Uri.encodeComponent(spec.yahooTicker)}?interval=$interval&range=$range',
      );
      final resp = await http.get(uri, headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) TradingPlatform/2.0',
      }).timeout(const Duration(seconds: 7));

      if (resp.statusCode != 200) return [];
      final json = jsonDecode(resp.body) as Map<String, dynamic>;
      final chart = json['chart'] as Map<String, dynamic>?;
      final results = chart?['result'] as List<dynamic>?;
      if (results == null || results.isEmpty) return [];

      final item = results.first as Map<String, dynamic>;
      final timestamps = (item['timestamp'] as List<dynamic>? ?? [])
          .map((e) => (e as num).toInt())
          .toList();
      final indicators = item['indicators'] as Map<String, dynamic>?;
      final quotes = (indicators?['quote'] as List<dynamic>?)?.firstOrNull
          as Map<String, dynamic>?;
      if (quotes == null || timestamps.isEmpty) return [];

      final opens = quotes['open'] as List<dynamic>? ?? [];
      final highs = quotes['high'] as List<dynamic>? ?? [];
      final lows = quotes['low'] as List<dynamic>? ?? [];
      final closes = quotes['close'] as List<dynamic>? ?? [];
      final volumes = quotes['volume'] as List<dynamic>? ?? [];

      final parsed = <Candle>[];
      for (int i = 0; i < timestamps.length; i++) {
        final o = i < opens.length ? opens[i] as num? : null;
        final h = i < highs.length ? highs[i] as num? : null;
        final l = i < lows.length ? lows[i] as num? : null;
        final c = i < closes.length ? closes[i] as num? : null;
        if (o == null || h == null || l == null || c == null) continue;
        final v = (i < volumes.length ? volumes[i] as num? : null) ?? 0;
        parsed.add(Candle(
          timestamp: DateTime.fromMillisecondsSinceEpoch(
            timestamps[i] * 1000,
            isUtc: true,
          ),
          open: o.toDouble(),
          high: h.toDouble(),
          low: l.toDouble(),
          close: c.toDouble(),
          volume: v.toDouble(),
        ));
      }
      return parsed;
    } catch (_) {
      return [];
    }
  }

  Future<List<Candle>> _fetchOanda(
    SymbolSpec spec,
    Timeframe tf,
    int count,
  ) async {
    try {
      final host = storage.oandaIsPractice
          ? 'api-fxpractice.oanda.com'
          : 'api-fxtrade.oanda.com';
      final instrument = spec.symbol.length == 6
          ? '${spec.symbol.substring(0, 3)}_${spec.symbol.substring(3)}'
          : spec.symbol;
      final granularity = tf.code == 'W1' ? 'W' : tf.code;
      final uri = Uri.https(
        host,
        '/v3/instruments/$instrument/candles',
        {'granularity': granularity, 'count': '$count', 'price': 'M'},
      );
      final resp = await http.get(uri, headers: {
        'Authorization': 'Bearer ${storage.oandaApiKey}',
      }).timeout(const Duration(seconds: 7));
      if (resp.statusCode != 200) return [];
      final json = jsonDecode(resp.body) as Map<String, dynamic>;
      final list = json['candles'] as List<dynamic>? ?? [];
      return list.map((raw) {
        final m = raw as Map<String, dynamic>;
        final mid = m['mid'] as Map<String, dynamic>;
        return Candle(
          timestamp: DateTime.parse(m['time'] as String).toUtc(),
          open: double.parse(mid['o'] as String),
          high: double.parse(mid['h'] as String),
          low: double.parse(mid['l'] as String),
          close: double.parse(mid['c'] as String),
          volume: (m['volume'] as num?)?.toDouble() ?? 0,
          isComplete: m['complete'] as bool? ?? true,
        );
      }).toList();
    } catch (_) {
      return [];
    }
  }

  Future<List<Candle>> _fetchTwelveData(
    SymbolSpec spec,
    Timeframe tf,
    int count,
  ) async {
    try {
      final interval = switch (tf) {
        Timeframe.m1 => '1min',
        Timeframe.m5 => '5min',
        Timeframe.m15 => '15min',
        Timeframe.m30 => '30min',
        Timeframe.h1 => '1h',
        Timeframe.h4 => '4h',
        Timeframe.d1 => '1day',
        Timeframe.w1 => '1week',
      };
      final sym = spec.symbol.length == 6
          ? '${spec.symbol.substring(0, 3)}/${spec.symbol.substring(3)}'
          : spec.symbol;
      final uri = Uri.https('api.twelvedata.com', '/time_series', {
        'symbol': sym,
        'interval': interval,
        'outputsize': '$count',
        'apikey': storage.twelveDataApiKey,
      });
      final resp = await http.get(uri).timeout(const Duration(seconds: 7));
      if (resp.statusCode != 200) return [];
      final json = jsonDecode(resp.body) as Map<String, dynamic>;
      final values = json['values'] as List<dynamic>? ?? [];
      return values.reversed.map((raw) {
        final m = raw as Map<String, dynamic>;
        return Candle(
          timestamp: DateTime.parse('${m['datetime']}Z').toUtc(),
          open: double.parse(m['open'] as String),
          high: double.parse(m['high'] as String),
          low: double.parse(m['low'] as String),
          close: double.parse(m['close'] as String),
          volume: double.tryParse(m['volume'] as String? ?? '0') ?? 0,
        );
      }).toList();
    } catch (_) {
      return [];
    }
  }

  /// Deterministic synthetic candle generator aligned strictly to timeframe boundaries.
  static List<Candle> synthesizeCandles(
    String symbol,
    Timeframe tf, {
    int count = 240,
    DateTime? endAtUtc,
  }) {
    final spec = SymbolCatalog.find(symbol);
    final basePrice = spec.defaultBaseline;
    final alignedEnd = IndicatorEngine.alignToTimeframeBoundaryUtc(
      endAtUtc ?? DateTime.now().toUtc(),
      tf,
    );

    final seed = symbol.codeUnits.fold<int>(17, (a, b) => a * 31 + b) +
        tf.seconds;
    final rng = math.Random(seed);
    final volStep = basePrice * 0.0018 * math.sqrt(tf.seconds / 300.0);

    final candles = <Candle>[];
    double price = basePrice * (0.985 + rng.nextDouble() * 0.03);
    final digits = IndicatorEngine.getSymbolDigits(symbol, samplePrice: basePrice);
    final factor = math.pow(10, digits);
    double r(double v) => (v * factor).roundToDouble() / factor;

    for (int i = count - 1; i >= 0; i--) {
      final ts = alignedEnd.subtract(Duration(seconds: i * tf.seconds));
      final wave = math.sin((count - i) * 0.14) * volStep * 0.45;
      final drift = (rng.nextDouble() - 0.492) * volStep + wave;
      final open = price;
      final close = math.max(basePrice * 0.25, open + drift);
      final wickUp = rng.nextDouble() * volStep * 0.7;
      final wickDown = rng.nextDouble() * volStep * 0.7;
      final high = math.max(open, close) + wickUp;
      final low = math.max(basePrice * 0.2, math.min(open, close) - wickDown);
      price = close;
      candles.add(Candle(
        timestamp: ts,
        open: r(open),
        high: r(high),
        low: r(low),
        close: r(close),
        volume: (120 + rng.nextDouble() * 1400).roundToDouble(),
        isComplete: i > 0,
      ));
    }
    return candles;
  }

  Future<Map<String, MarketQuote>> fetchWatchlistQuotes(
    List<String> symbols,
  ) async {
    final Map<String, MarketQuote> result = {};
    await Future.wait(symbols.map((sym) async {
      final res = await fetchCandles(sym, Timeframe.m15, count: 60);
      if (res.candles.length >= 2) {
        final last = res.candles.last;
        final prev = res.candles[res.candles.length - 2];
        final first = res.candles.first;
        final diff = last.close - first.open;
        final pct = first.open != 0 ? (diff / first.open) * 100.0 : 0.0;
        final decimals = IndicatorEngine.getSymbolDigits(
          sym,
          samplePrice: last.close,
          extraPrices: [prev.close, last.high, last.low],
        );
        result[sym] = MarketQuote(
          symbol: sym,
          price: last.close,
          changePct: pct,
          changeAbs: diff,
          decimals: decimals,
          updatedAt: DateTime.now().toUtc(),
        );
      }
    }));
    return result;
  }
}
