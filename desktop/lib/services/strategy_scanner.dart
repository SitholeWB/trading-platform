import 'dart:math' as math;
import '../models/trading_models.dart';
import 'indicator_engine.dart';
import 'market_data_service.dart';
import 'symbol_catalog.dart';

class StrategyScanner {
  static ScannerHit analyzeCandles(
    SymbolSpec spec,
    Timeframe tf,
    List<Candle> candles,
  ) {
    if (candles.length < 30) {
      return ScannerHit(
        spec: spec,
        timeframe: tf,
        price: spec.defaultBaseline,
        changePct: 0,
        rsi: 50,
        trend: 'Ranging',
        signal: 'Neutral',
        score: 50,
        atr: 0,
      );
    }

    final last = candles.last;
    final first = candles.first;
    final changePct =
        first.open != 0 ? ((last.close - first.open) / first.open) * 100 : 0.0;

    final rsiList = IndicatorEngine.calculateRSI(candles, 14);
    final rsi = rsiList.isNotEmpty ? rsiList.last.value : 50.0;
    final ema20 = IndicatorEngine.calculateEMA(candles, 20, spec.symbol);
    final ema50 = IndicatorEngine.calculateEMA(candles, 50, spec.symbol);
    final atrList = IndicatorEngine.calculateATR(candles, 14, spec.symbol);
    final atr = atrList.isNotEmpty ? atrList.last.value : 0.0;

    final e20 = ema20.isNotEmpty ? ema20.last.value : last.close;
    final e50 = ema50.isNotEmpty ? ema50.last.value : last.close;

    String trend = 'Ranging';
    double score = 50;
    if (last.close > e20 && e20 > e50) {
      trend = 'Bullish';
      score += 22;
    } else if (last.close < e20 && e20 < e50) {
      trend = 'Bearish';
      score -= 22;
    }

    if (rsi < 30) {
      score += 20;
    } else if (rsi < 42) {
      score += 8;
    } else if (rsi > 70) {
      score -= 20;
    } else if (rsi > 58) {
      score -= 8;
    }

    score = score.clamp(0, 100);
    String signal = 'Neutral';
    if (score >= 76) {
      signal = 'Strong Buy';
    } else if (score >= 60) {
      signal = 'Buy';
    } else if (score <= 24) {
      signal = 'Strong Sell';
    } else if (score <= 40) {
      signal = 'Sell';
    }

    return ScannerHit(
      spec: spec,
      timeframe: tf,
      price: last.close,
      changePct: changePct,
      rsi: rsi,
      trend: trend,
      signal: signal,
      score: score,
      atr: atr,
    );
  }

  static Future<List<ScannerHit>> scanMarket(
    MarketDataService marketData,
    List<String> symbols,
    Timeframe tf,
  ) async {
    final hits = <ScannerHit>[];
    await Future.wait(symbols.map((sym) async {
      final spec = SymbolCatalog.find(sym);
      final res = await marketData.fetchCandles(sym, tf, count: 120);
      hits.add(analyzeCandles(spec, tf, res.candles));
    }));
    hits.sort((a, b) => (b.score - 50).abs().compareTo((a.score - 50).abs()));
    return hits;
  }

  static SignalAuditLog evaluateStrategyOnCandles(
    StrategyDefinition strat,
    List<Candle> candles,
  ) {
    final hit = analyzeCandles(
      SymbolCatalog.find(strat.symbol),
      strat.timeframe,
      candles,
    );
    final matchScore = (50 + (hit.score - 50).abs()).clamp(0.0, 100.0);
    final direction = hit.score >= 55
        ? 'Buy'
        : hit.score <= 45
            ? 'Sell'
            : 'Neutral';

    String outcome = 'NearMiss';
    String reason =
        'RSI ${hit.rsi.toStringAsFixed(1)} · Trend ${hit.trend} · Score ${matchScore.toStringAsFixed(0)}%';
    if (!strat.isEnabled) {
      outcome = 'Rejected';
      reason = 'Strategy paused · $reason';
    } else if (matchScore >= 75) {
      outcome = 'Executed';
      reason = 'All rule thresholds aligned ($direction) · $reason';
    }

    return SignalAuditLog(
      id: '${strat.id}_${DateTime.now().millisecondsSinceEpoch}',
      timestamp: DateTime.now().toUtc(),
      symbol: strat.symbol,
      timeframe: strat.timeframe,
      strategyName: strat.name,
      outcome: outcome,
      direction: direction,
      matchScore: matchScore,
      price: hit.price,
      reason: reason,
    );
  }

  static double calculatePositionPnl(Position pos, double marketPrice) {
    final diff = pos.isBuy
        ? (marketPrice - pos.entryPrice)
        : (pos.entryPrice - marketPrice);
    final sym = pos.symbol.toUpperCase();
    double contractMultiplier = 100000.0;
    if (sym.contains('JPY')) {
      contractMultiplier = 1000.0;
    } else if (sym.contains('BTC') ||
        sym.contains('ETH') ||
        sym.contains('SOL')) {
      contractMultiplier = 1.0;
    } else if (sym.contains('XAU')) {
      contractMultiplier = 100.0;
    } else if (sym.startsWith('US') ||
        sym.startsWith('NAS') ||
        sym.startsWith('GER') ||
        sym.startsWith('UK')) {
      contractMultiplier = 10.0;
    } else if (pos.entryPrice > 20 && sym.length <= 5) {
      contractMultiplier = 100.0;
    }
    return diff * pos.lots * contractMultiplier;
  }

  static int estimatePipFactor(String symbol, double price) {
    return math.pow(
      10,
      IndicatorEngine.getSymbolDigits(symbol, samplePrice: price),
    ).toInt();
  }
}
