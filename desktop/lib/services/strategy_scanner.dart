import 'dart:math' as math;
import '../models/trading_models.dart';
import 'indicator_engine.dart';
import 'market_data_service.dart';
import 'symbol_catalog.dart';

class StrategyTestTrade {
  final DateTime entryTime;
  final DateTime exitTime;
  final String direction; // 'Buy' or 'Sell'
  final double entryPrice;
  final double exitPrice;
  final double pnlPercent;
  final String exitReason;
  final List<String> matchedRules;

  const StrategyTestTrade({
    required this.entryTime,
    required this.exitTime,
    required this.direction,
    required this.entryPrice,
    required this.exitPrice,
    required this.pnlPercent,
    required this.exitReason,
    required this.matchedRules,
  });
}

class StrategyBacktestResult {
  final int barsTested;
  final int totalSignals;
  final int totalTrades;
  final int wins;
  final double winRate;
  final double netReturnPct;
  final double profitFactor;
  final double maxDrawdownPct;
  final List<StrategyTestTrade> trades;
  final List<double> equityCurve;
  final List<String> latestRuleBreakdown;
  final double latestScore;
  final String latestDirection;

  const StrategyBacktestResult({
    required this.barsTested,
    required this.totalSignals,
    required this.totalTrades,
    required this.wins,
    required this.winRate,
    required this.netReturnPct,
    required this.profitFactor,
    required this.maxDrawdownPct,
    required this.trades,
    this.equityCurve = const [10000.0],
    required this.latestRuleBreakdown,
    required this.latestScore,
    required this.latestDirection,
  });
}

class StrategyScanHit {
  final StrategyDefinition strategy;
  final SymbolSpec spec;
  final Timeframe timeframe;
  final double price;
  final double matchScore;
  final String signal; // 'Buy', 'Sell', 'Neutral'
  final List<String> ruleBreakdown;
  final bool triggered;

  const StrategyScanHit({
    required this.strategy,
    required this.spec,
    required this.timeframe,
    required this.price,
    required this.matchScore,
    required this.signal,
    required this.ruleBreakdown,
    this.triggered = false,
  });
}

class SymbolBacktestSummary {
  final String symbol;
  final StrategyBacktestResult result;

  const SymbolBacktestSummary({
    required this.symbol,
    required this.result,
  });
}

class MultiSymbolBacktestResult {
  final List<SymbolBacktestSummary> perSymbol;
  final int totalTrades;
  final int totalWins;
  final double avgWinRate;
  final double avgNetReturnPct;
  final double avgProfitFactor;
  final double maxDrawdownPct;

  const MultiSymbolBacktestResult({
    required this.perSymbol,
    required this.totalTrades,
    required this.totalWins,
    required this.avgWinRate,
    required this.avgNetReturnPct,
    required this.avgProfitFactor,
    required this.maxDrawdownPct,
  });
}

class _RuleBarEval {
  final bool matched;
  final String direction; // 'Buy', 'Sell', 'Neutral'
  final String label;

  const _RuleBarEval(this.matched, this.direction, this.label);
}

class _GroupEvalResult {
  final bool matched;
  final double score; // 0..100
  final String direction; // 'Buy', 'Sell', 'Neutral'
  final List<String> labels;
  final List<String> matchedLabels;

  const _GroupEvalResult({
    required this.matched,
    required this.score,
    required this.direction,
    required this.labels,
    required this.matchedLabels,
  });
}

class _IndicatorBundle {
  final List<Candle> candles;
  final String symbol;
  final Map<int, double> atrMap = {};
  final Map<int, Map<int, double>> emaCache = {};
  final Map<int, Map<int, double>> smaCache = {};
  final Map<int, Map<int, double>> rsiCache = {};
  final Map<int, Map<int, double>> adxCache = {};
  final Map<String, Map<int, BollingerPoint>> bbCache = {};
  final Map<String, Map<int, SupertrendPoint>> stCache = {};
  Map<int, MacdPoint>? macdCache;
  Map<int, double>? vwapCache;
  Map<int, IchimokuPoint>? ichimokuCache;

  _IndicatorBundle(this.candles, this.symbol) {
    final atrPts = IndicatorEngine.calculateATR(candles, 14, symbol);
    for (final p in atrPts) {
      atrMap[p.timeSeconds] = p.value;
    }
  }

  Map<int, double> ema(int period) {
    return emaCache.putIfAbsent(period, () {
      final pts = IndicatorEngine.calculateEMA(candles, period, symbol);
      return {for (final p in pts) p.timeSeconds: p.value};
    });
  }

  Map<int, double> sma(int period) {
    return smaCache.putIfAbsent(period, () {
      final pts = IndicatorEngine.calculateSMA(candles, period, symbol);
      return {for (final p in pts) p.timeSeconds: p.value};
    });
  }

  Map<int, double> rsi(int period) {
    return rsiCache.putIfAbsent(period, () {
      final pts = IndicatorEngine.calculateRSI(candles, period);
      return {for (final p in pts) p.timeSeconds: p.value};
    });
  }

  Map<int, double> adx(int period) {
    return adxCache.putIfAbsent(period, () {
      final map = <int, double>{};
      if (candles.length < period + 2) return map;
      double smoothedTr = 0, smoothedPlusDm = 0, smoothedMinusDm = 0;
      final dxList = <double>[];
      for (int i = 1; i < candles.length; i++) {
        final cur = candles[i];
        final prev = candles[i - 1];
        final tr = math.max(
          cur.high - cur.low,
          math.max(
            (cur.high - prev.close).abs(),
            (cur.low - prev.close).abs(),
          ),
        );
        final upMove = cur.high - prev.high;
        final downMove = prev.low - cur.low;
        final plusDm = (upMove > downMove && upMove > 0) ? upMove : 0.0;
        final minusDm = (downMove > upMove && downMove > 0) ? downMove : 0.0;

        if (i <= period) {
          smoothedTr += tr;
          smoothedPlusDm += plusDm;
          smoothedMinusDm += minusDm;
          if (i == period && smoothedTr > 0) {
            final pDi = 100.0 * smoothedPlusDm / smoothedTr;
            final mDi = 100.0 * smoothedMinusDm / smoothedTr;
            final sum = pDi + mDi;
            dxList.add(sum > 0 ? 100.0 * (pDi - mDi).abs() / sum : 0.0);
          }
        } else {
          smoothedTr = smoothedTr - (smoothedTr / period) + tr;
          smoothedPlusDm =
              smoothedPlusDm - (smoothedPlusDm / period) + plusDm;
          smoothedMinusDm =
              smoothedMinusDm - (smoothedMinusDm / period) + minusDm;
          final pDi = smoothedTr > 0 ? 100.0 * smoothedPlusDm / smoothedTr : 0.0;
          final mDi =
              smoothedTr > 0 ? 100.0 * smoothedMinusDm / smoothedTr : 0.0;
          final sum = pDi + mDi;
          final dx = sum > 0 ? 100.0 * (pDi - mDi).abs() / sum : 0.0;
          dxList.add(dx);
          if (dxList.length >= period) {
            final recent = dxList.sublist(dxList.length - period);
            final adxVal =
                recent.reduce((a, b) => a + b) / recent.length;
            map[cur.timeSeconds] = adxVal;
          }
        }
      }
      return map;
    });
  }

  Map<int, BollingerPoint> bollinger(int period, double stdDev) {
    final key = '${period}_${stdDev.toStringAsFixed(1)}';
    return bbCache.putIfAbsent(key, () {
      final pts = IndicatorEngine.calculateBollingerBands(
        candles,
        period,
        stdDev > 0 ? stdDev : 2.0,
        symbol,
      );
      return {for (final p in pts) p.timeSeconds: p};
    });
  }

  Map<int, MacdPoint> macd() {
    return macdCache ??= {
      for (final p in IndicatorEngine.calculateMACD(candles, 12, 26, 9))
        p.timeSeconds: p,
    };
  }

  Map<int, double> vwap() {
    return vwapCache ??= {
      for (final p in IndicatorEngine.calculateVWAP(candles, symbol))
        p.timeSeconds: p.value,
    };
  }

  Map<int, SupertrendPoint> supertrend(int period, double mult) {
    final m = mult > 0 ? mult : 3.0;
    final key = '${period}_${m.toStringAsFixed(1)}';
    return stCache.putIfAbsent(key, () {
      final pts = IndicatorEngine.calculateSupertrend(candles, period, m, symbol);
      return {for (final p in pts) p.timeSeconds: p};
    });
  }

  Map<int, IchimokuPoint> ichimoku() {
    return ichimokuCache ??= {
      for (final p in IndicatorEngine.calculateIchimoku(candles, symbol))
        p.timeSeconds: p,
    };
  }
}

class StrategyScanner {
  static _RuleBarEval _evalRuleAt(
    StrategyRule rule,
    _IndicatorBundle bundle,
    int idx,
  ) {
    final c = bundle.candles[idx];
    final prev = idx > 0 ? bundle.candles[idx - 1] : c;
    final t = c.timeSeconds;
    final prevT = prev.timeSeconds;
    final p = rule.period.clamp(2, 200);

    switch (rule.indicator) {
      case 'EMA_CROSS':
        final fastMap = bundle.ema(p);
        final slowMap = bundle.ema((p * 2).clamp(p + 5, 200));
        final fNow = fastMap[t] ?? c.close;
        final sNow = slowMap[t] ?? c.close;
        final fPrev = fastMap[prevT] ?? prev.close;
        final sPrev = slowMap[prevT] ?? prev.close;
        final isBull = rule.condition == 'CrossAbove'
            ? (fPrev <= sPrev && fNow > sNow)
            : rule.condition == 'GreaterThan'
                ? fNow > sNow
                : rule.condition == 'CrossBelow'
                    ? (fPrev >= sPrev && fNow < sNow)
                    : fNow < sNow;
        final dir =
            (rule.condition == 'CrossBelow' || rule.condition == 'LessThan')
                ? 'Sell'
                : 'Buy';
        return _RuleBarEval(
          isBull,
          dir,
          'EMA($p/${p * 2}) ${isBull ? '✓' : '·'}',
        );

      case 'RSI_OS':
        final rMap = bundle.rsi(p);
        final rNow = rMap[t] ?? 50.0;
        final rPrev = rMap[prevT] ?? rNow;
        final thr = rule.threshold > 0 ? rule.threshold : 30.0;
        final ok = rule.condition == 'CrossAbove'
            ? (rPrev <= thr && rNow > thr)
            : rule.condition == 'GreaterThan'
                ? rNow > thr
                : rNow < thr;
        return _RuleBarEval(
          ok,
          'Buy',
          'RSI($p)=${rNow.toStringAsFixed(1)} < ${thr.toStringAsFixed(0)} ${ok ? '✓' : '·'}',
        );

      case 'RSI_OB':
        final rMap = bundle.rsi(p);
        final rNow = rMap[t] ?? 50.0;
        final rPrev = rMap[prevT] ?? rNow;
        final thr = rule.threshold > 0 ? rule.threshold : 70.0;
        final ok = rule.condition == 'CrossBelow'
            ? (rPrev >= thr && rNow < thr)
            : rule.condition == 'LessThan'
                ? rNow < thr
                : rNow > thr;
        return _RuleBarEval(
          ok,
          'Sell',
          'RSI($p)=${rNow.toStringAsFixed(1)} > ${thr.toStringAsFixed(0)} ${ok ? '✓' : '·'}',
        );

      case 'MACD_CROSS':
        final mMap = bundle.macd();
        final mNow = mMap[t];
        final mPrev = mMap[prevT];
        if (mNow == null) {
          return const _RuleBarEval(false, 'Neutral', 'MACD warming up');
        }
        final pMacd = mPrev?.macd ?? mNow.macd;
        final pSig = mPrev?.signal ?? mNow.signal;
        final ok = rule.condition == 'CrossBelow'
            ? (pMacd >= pSig && mNow.macd < mNow.signal)
            : rule.condition == 'LessThan'
                ? mNow.macd < mNow.signal
                : rule.condition == 'GreaterThan'
                    ? mNow.macd > mNow.signal
                    : (pMacd <= pSig && mNow.macd > mNow.signal);
        final dir =
            (rule.condition == 'CrossBelow' || rule.condition == 'LessThan')
                ? 'Sell'
                : 'Buy';
        return _RuleBarEval(
          ok,
          dir,
          'MACD(${mNow.macd.toStringAsFixed(5)}) ${ok ? '✓' : '·'}',
        );

      case 'SMA_CROSS':
        final fastMap = bundle.sma(p);
        final slowMap = bundle.sma((p * 2).clamp(p + 5, 200));
        final fNow = fastMap[t] ?? c.close;
        final sNow = slowMap[t] ?? c.close;
        final fPrev = fastMap[prevT] ?? prev.close;
        final sPrev = slowMap[prevT] ?? prev.close;
        final ok = rule.condition == 'CrossAbove'
            ? (fPrev <= sPrev && fNow > sNow)
            : rule.condition == 'GreaterThan'
                ? fNow > sNow
                : rule.condition == 'CrossBelow'
                    ? (fPrev >= sPrev && fNow < sNow)
                    : fNow < sNow;
        final dir =
            (rule.condition == 'CrossBelow' || rule.condition == 'LessThan')
                ? 'Sell'
                : 'Buy';
        return _RuleBarEval(
          ok,
          dir,
          'SMA($p/${p * 2}) ${ok ? '✓' : '·'}',
        );

      case 'SUPERTREND':
        final stMap = bundle.supertrend(p, rule.threshold > 0 ? rule.threshold : 3.0);
        final stNow = stMap[t];
        final stPrev = stMap[prevT];
        if (stNow == null) {
          return const _RuleBarEval(false, 'Neutral', 'Supertrend warming up');
        }
        final isSellCond =
            rule.condition == 'CrossBelow' || rule.condition == 'LessThan';
        final ok = rule.condition == 'CrossAbove'
            ? ((stPrev?.direction ?? stNow.direction) == -1 && stNow.direction == 1)
            : rule.condition == 'CrossBelow'
                ? ((stPrev?.direction ?? stNow.direction) == 1 && stNow.direction == -1)
                : isSellCond
                    ? stNow.direction == -1
                    : stNow.direction == 1;
        return _RuleBarEval(
          ok,
          isSellCond ? 'Sell' : 'Buy',
          'Supertrend(${stNow.direction == 1 ? 'Bull' : 'Bear'}) ${ok ? '✓' : '·'}',
        );

      case 'VWAP_CROSS':
        final vMap = bundle.vwap();
        final vNow = vMap[t] ?? c.close;
        final vPrev = vMap[prevT] ?? prev.close;
        final isSellCond =
            rule.condition == 'CrossBelow' || rule.condition == 'LessThan';
        final ok = rule.condition == 'CrossAbove'
            ? (prev.close <= vPrev && c.close > vNow)
            : rule.condition == 'CrossBelow'
                ? (prev.close >= vPrev && c.close < vNow)
                : isSellCond
                    ? c.close < vNow
                    : c.close > vNow;
        return _RuleBarEval(
          ok,
          isSellCond ? 'Sell' : 'Buy',
          'VWAP(${vNow.toStringAsFixed(2)}) ${ok ? '✓' : '·'}',
        );

      case 'ICHIMOKU_BULL':
        final iMap = bundle.ichimoku();
        final iNow = iMap[t];
        if (iNow == null || iNow.spanA == null || iNow.spanB == null) {
          return const _RuleBarEval(false, 'Neutral', 'Ichimoku warming up');
        }
        final cloudTop = math.max(iNow.spanA!, iNow.spanB!);
        final cloudBot = math.min(iNow.spanA!, iNow.spanB!);
        final isSellCond =
            rule.condition == 'CrossBelow' || rule.condition == 'LessThan';
        final ok = isSellCond
            ? (c.close < cloudBot && (iNow.tenkan ?? c.close) <= (iNow.kijun ?? c.close))
            : (c.close > cloudTop && (iNow.tenkan ?? c.close) >= (iNow.kijun ?? c.close));
        return _RuleBarEval(
          ok,
          isSellCond ? 'Sell' : 'Buy',
          'Ichimoku(${isSellCond ? 'Bear' : 'Bull'}) ${ok ? '✓' : '·'}',
        );

      case 'EMA_TREND':
        final eMap = bundle.ema(p);
        final eNow = eMap[t] ?? c.close;
        final ePrev = eMap[prevT] ?? prev.close;
        final isSellCond =
            rule.condition == 'CrossBelow' || rule.condition == 'LessThan';
        final ok = rule.condition == 'CrossAbove'
            ? (prev.close <= ePrev && c.close > eNow)
            : rule.condition == 'CrossBelow'
                ? (prev.close >= ePrev && c.close < eNow)
                : isSellCond
                    ? c.close < eNow
                    : c.close > eNow;
        return _RuleBarEval(
          ok,
          isSellCond ? 'Sell' : 'Buy',
          'Price ${isSellCond ? '<' : '>'} EMA($p) ${ok ? '✓' : '·'}',
        );

      case 'ADX_TREND':
        final aMap = bundle.adx(p);
        final aNow = aMap[t] ?? 0.0;
        final thr = rule.threshold > 0 ? rule.threshold : 20.0;
        final ok = rule.condition == 'LessThan' ? aNow < thr : aNow >= thr;
        return _RuleBarEval(
          ok,
          'Neutral',
          'ADX($p)=${aNow.toStringAsFixed(1)} ${rule.condition == 'LessThan' ? '<' : '≥'} ${thr.toStringAsFixed(0)} ${ok ? '✓' : '·'}',
        );

      case 'SESSION_UTC':
        final startHr = rule.threshold.toInt().clamp(0, 23);
        final endHr = rule.period.clamp(0, 23);
        final hr = c.timestamp.toUtc().hour;
        final ok = startHr <= endHr
            ? (hr >= startHr && hr <= endHr)
            : (hr >= startHr || hr <= endHr);
        return _RuleBarEval(
          ok,
          'Neutral',
          'UTC ${startHr.toString().padLeft(2, '0')}-${endHr.toString().padLeft(2, '0')}h ${ok ? '✓' : '·'}',
        );

      case 'DONCHIAN_BREAK':
        final lookback = p.clamp(2, 200);
        final fromIdx = math.max(0, idx - lookback);
        if (idx <= fromIdx) {
          return const _RuleBarEval(false, 'Neutral', 'Donchian warming up');
        }
        double hi = bundle.candles[fromIdx].high;
        double lo = bundle.candles[fromIdx].low;
        for (int k = fromIdx + 1; k < idx; k++) {
          if (bundle.candles[k].high > hi) hi = bundle.candles[k].high;
          if (bundle.candles[k].low < lo) lo = bundle.candles[k].low;
        }
        final isSellCond =
            rule.condition == 'CrossBelow' || rule.condition == 'LessThan';
        final ok = isSellCond ? c.close < lo : c.close > hi;
        return _RuleBarEval(
          ok,
          isSellCond ? 'Sell' : 'Buy',
          'Donchian($lookback) ${isSellCond ? 'Low' : 'High'} ${ok ? '✓' : '·'}',
        );

      case 'ENGULFING':
        final prevBody = (prev.close - prev.open).abs();
        final curBody = (c.close - c.open).abs();
        final isSellCond =
            rule.condition == 'CrossBelow' || rule.condition == 'LessThan';
        final bullEngulf = prev.close < prev.open &&
            c.close > c.open &&
            c.open <= prev.close &&
            c.close >= prev.open &&
            curBody > prevBody;
        final bearEngulf = prev.close > prev.open &&
            c.close < c.open &&
            c.open >= prev.close &&
            c.close <= prev.open &&
            curBody > prevBody;
        final ok = isSellCond ? bearEngulf : bullEngulf;
        return _RuleBarEval(
          ok,
          isSellCond ? 'Sell' : 'Buy',
          '${isSellCond ? 'Bear' : 'Bull'} Engulf ${ok ? '✓' : '·'}',
        );

      case 'PIN_BAR':
        final body = (c.close - c.open).abs();
        final safeBody = body > 0 ? body : (c.high - c.low) * 0.1;
        final upperWick = c.high - math.max(c.open, c.close);
        final lowerWick = math.min(c.open, c.close) - c.low;
        final ratio = rule.threshold > 0 ? rule.threshold : 2.0;
        final isSellCond =
            rule.condition == 'CrossBelow' || rule.condition == 'LessThan';
        final ok = isSellCond
            ? (upperWick >= safeBody * ratio && lowerWick <= upperWick * 0.4)
            : (lowerWick >= safeBody * ratio && upperWick <= lowerWick * 0.4);
        return _RuleBarEval(
          ok,
          isSellCond ? 'Sell' : 'Buy',
          '${isSellCond ? 'Bear' : 'Bull'} PinBar ${ok ? '✓' : '·'}',
        );

      case 'VOLUME_SPIKE':
        final lookback = p.clamp(2, 100);
        final fromIdx = math.max(0, idx - lookback);
        double sumVol = 0;
        int cnt = 0;
        for (int k = fromIdx; k < idx; k++) {
          sumVol += bundle.candles[k].volume;
          cnt++;
        }
        final avgVol = cnt > 0 ? sumVol / cnt : c.volume;
        final mult = rule.threshold > 0 ? rule.threshold : 1.5;
        final ok = avgVol > 0 && c.volume >= avgVol * mult;
        return _RuleBarEval(
          ok,
          'Neutral',
          'Vol≥${mult.toStringAsFixed(1)}x ${ok ? '✓' : '·'}',
        );

      case 'ATR_VOLATILITY':
        final atr = bundle.atrMap[t] ?? 0.0;
        final atrPct = c.close > 0 ? (atr / c.close) * 100.0 : 0.0;
        final thr = rule.threshold > 0 ? rule.threshold : 0.10;
        final ok = rule.condition == 'LessThan' ? atrPct <= thr : atrPct >= thr;
        return _RuleBarEval(
          ok,
          'Neutral',
          'ATR%=${atrPct.toStringAsFixed(2)}% ${ok ? '✓' : '·'}',
        );

      case 'BB_BREAK':
      default:
        final std = rule.threshold > 0 ? rule.threshold : 2.0;
        final bMap = bundle.bollinger(p, std);
        final bNow = bMap[t];
        if (bNow == null) {
          return const _RuleBarEval(false, 'Neutral', 'BB warming up');
        }
        final isSell =
            rule.condition == 'CrossBelow' || rule.condition == 'LessThan';
        final ok = isSell ? c.close < bNow.lower : c.close > bNow.upper;
        return _RuleBarEval(
          ok,
          isSell ? 'Sell' : 'Buy',
          'BB($p,${std.toStringAsFixed(1)}) ${ok ? '✓' : '·'}',
        );
    }
  }

  static StrategyRule _mirrorRule(StrategyRule rule) {
    String flippedCond = switch (rule.condition) {
      'CrossAbove' => 'CrossBelow',
      'CrossBelow' => 'CrossAbove',
      'GreaterThan' => 'LessThan',
      'LessThan' => 'GreaterThan',
      _ => rule.condition,
    };
    String flippedInd = rule.indicator;
    double flippedThr = rule.threshold;
    if (rule.indicator == 'RSI_OS') {
      flippedInd = 'RSI_OB';
      flippedThr = rule.threshold > 0 ? (100.0 - rule.threshold) : 70.0;
    } else if (rule.indicator == 'RSI_OB') {
      flippedInd = 'RSI_OS';
      flippedThr = rule.threshold > 0 ? (100.0 - rule.threshold) : 30.0;
    } else if (rule.indicator == 'ADX_TREND' ||
        rule.indicator == 'SESSION_UTC' ||
        rule.indicator == 'VOLUME_SPIKE' ||
        rule.indicator == 'ATR_VOLATILITY') {
      // Neutral regime/session/volume filters are NOT inverted when mirroring
      return rule;
    }
    return StrategyRule(
      indicator: flippedInd,
      condition: flippedCond,
      threshold: flippedThr,
      period: rule.period,
    );
  }

  static _GroupEvalResult _evalGroupAt(
    StrategyRuleGroup group,
    _IndicatorBundle bundle,
    int idx, {
    bool mirrored = false,
  }) {
    final items = <_GroupEvalResult>[];

    for (final rawRule in group.rules) {
      final r = mirrored ? _mirrorRule(rawRule) : rawRule;
      final ev = _evalRuleAt(r, bundle, idx);
      items.add(_GroupEvalResult(
        matched: ev.matched,
        score: ev.matched ? 100.0 : 0.0,
        direction: ev.direction,
        labels: [ev.label],
        matchedLabels: ev.matched ? [ev.label] : const [],
      ));
    }

    for (final child in group.groups) {
      if (child.isEmpty) continue;
      items.add(_evalGroupAt(child, bundle, idx, mirrored: mirrored));
    }

    if (items.isEmpty) {
      return const _GroupEvalResult(
        matched: false,
        score: 0,
        direction: 'Neutral',
        labels: [],
        matchedLabels: [],
      );
    }

    final isOr = group.combinator.toUpperCase() == 'OR';
    final matchedItems = items.where((e) => e.matched).toList();
    final bool matched =
        isOr ? matchedItems.isNotEmpty : matchedItems.length == items.length;
    final double score = isOr
        ? items.map((e) => e.score).reduce(math.max)
        : items.fold<double>(0.0, (s, e) => s + e.score) / items.length;

    final buyVotes = matchedItems.where((e) => e.direction == 'Buy').length;
    final sellVotes = matchedItems.where((e) => e.direction == 'Sell').length;
    final String dir = buyVotes > sellVotes
        ? 'Buy'
        : sellVotes > buyVotes
            ? 'Sell'
            : items
                .firstWhere(
                  (e) => e.direction != 'Neutral',
                  orElse: () => items.first,
                )
                .direction;

    return _GroupEvalResult(
      matched: matched,
      score: score,
      direction: matched ? dir : 'Neutral',
      labels: [for (final it in items) ...it.labels],
      matchedLabels: [for (final it in matchedItems) ...it.matchedLabels],
    );
  }

  static List<Candle> _aggregateHigherTimeframe(
    List<Candle> baseCandles,
    Timeframe htfTf,
  ) {
    if (baseCandles.isEmpty) return const [];
    final bucketSec = htfTf.seconds;
    final out = <Candle>[];
    int? curBucket;
    DateTime ts = baseCandles.first.timestamp;
    double o = 0, h = 0, l = 0, c = 0, v = 0;

    for (final bar in baseCandles) {
      final b = (bar.timeSeconds ~/ bucketSec) * bucketSec;
      if (curBucket == null || b != curBucket) {
        if (curBucket != null) {
          out.add(Candle(
            timestamp: ts,
            open: o,
            high: h,
            low: l,
            close: c,
            volume: v,
            isComplete: true,
          ));
        }
        curBucket = b;
        ts = DateTime.fromMillisecondsSinceEpoch(b * 1000, isUtc: true);
        o = bar.open;
        h = bar.high;
        l = bar.low;
        c = bar.close;
        v = bar.volume;
      } else {
        if (bar.high > h) h = bar.high;
        if (bar.low < l) l = bar.low;
        c = bar.close;
        v += bar.volume;
      }
    }
    if (curBucket != null) {
      out.add(Candle(
        timestamp: ts,
        open: o,
        high: h,
        low: l,
        close: c,
        volume: v,
        isComplete: baseCandles.last.isComplete,
      ));
    }
    return out;
  }

  static Map<int, String> _buildHtfBiasMap(
    StrategyDefinition strat,
    List<Candle> baseCandles,
  ) {
    final htfTf = strat.htfTimeframe;
    if (htfTf == null || htfTf.seconds <= strat.timeframe.seconds) {
      return const {};
    }
    final htfCandles = _aggregateHigherTimeframe(baseCandles, htfTf);
    if (htfCandles.length < 10) return const {};
    final htfBundle = _IndicatorBundle(htfCandles, strat.symbol);
    final rule = StrategyRule(
      indicator: strat.htfIndicator,
      condition: 'GreaterThan',
      period: strat.htfPeriod,
      threshold: 3.0,
    );
    final bullTimes = <int, String>{};
    for (int j = 0; j < htfCandles.length; j++) {
      final evBull = _evalRuleAt(rule, htfBundle, j);
      final evBear = _evalRuleAt(_mirrorRule(rule), htfBundle, j);
      final bias = evBull.matched
          ? 'Buy'
          : evBear.matched
              ? 'Sell'
              : 'Neutral';
      bullTimes[htfCandles[j].timeSeconds] = bias;
    }

    final sortedKeys = bullTimes.keys.toList()..sort();
    final out = <int, String>{};
    int hPtr = 0;
    for (final c in baseCandles) {
      while (hPtr + 1 < sortedKeys.length &&
          sortedKeys[hPtr + 1] <= c.timeSeconds) {
        hPtr++;
      }
      if (sortedKeys.isNotEmpty && sortedKeys[hPtr] <= c.timeSeconds) {
        out[c.timeSeconds] = bullTimes[sortedKeys[hPtr]] ?? 'Neutral';
      }
    }
    return out;
  }

  static StrategyBacktestResult backtestStrategy(
    StrategyDefinition strat,
    List<Candle> candles, {
    int lookbackBars = 100,
    bool requireAllRules = true,
  }) {
    final rootGroup = strat.effectiveRuleGroup.copyWith(
      combinator: strat.rootRuleGroup != null
          ? strat.rootRuleGroup!.combinator
          : (requireAllRules ? 'AND' : 'OR'),
    );
    if (candles.length < 30 || rootGroup.isEmpty) {
      return const StrategyBacktestResult(
        barsTested: 0,
        totalSignals: 0,
        totalTrades: 0,
        wins: 0,
        winRate: 0,
        netReturnPct: 0,
        profitFactor: 0,
        maxDrawdownPct: 0,
        trades: [],
        latestRuleBreakdown: ['Insufficient candles or no rules configured'],
        latestScore: 0,
        latestDirection: 'Neutral',
      );
    }

    final bundle = _IndicatorBundle(candles, strat.symbol);
    final htfBias = _buildHtfBiasMap(strat, candles);
    final startIdx = math.max(25, candles.length - lookbackBars);
    final trades = <StrategyTestTrade>[];

    bool inPos = false;
    bool isBuy = true;
    double entryPrice = 0;
    double slPrice = 0;
    double tpPrice = 0;
    double initialRiskDist = 0;
    int entryBarIdx = 0;
    int cooldownUntilIdx = -1;
    DateTime entryTime = candles[startIdx].timestamp;
    List<String> entryMatched = [];

    double equity = 10000.0;
    double peak = equity;
    double maxDdPct = 0.0;
    double grossWin = 0.0;
    double grossLoss = 0.0;
    int wins = 0;
    int signals = 0;
    final equityCurve = <double>[10000.0];

    List<String> latestBreakdown = [];
    double latestScore = 0;
    String latestDir = 'Neutral';

    for (int i = startIdx; i < candles.length; i++) {
      final c = candles[i];
      final primaryEval = _evalGroupAt(rootGroup, bundle, i, mirrored: false);
      _GroupEvalResult activeEval = primaryEval;

      if (strat.directionMode == 'Both' && !primaryEval.matched) {
        final mirroredEval =
            _evalGroupAt(rootGroup, bundle, i, mirrored: true);
        if (mirroredEval.matched || mirroredEval.score > primaryEval.score) {
          activeEval = mirroredEval;
        }
      }

      String dir = activeEval.direction;
      bool triggered = activeEval.matched && dir != 'Neutral';

      if (strat.directionMode == 'LongOnly' && dir == 'Sell') {
        triggered = false;
      } else if (strat.directionMode == 'ShortOnly' && dir == 'Buy') {
        triggered = false;
      }

      final htfDir = htfBias[c.timeSeconds];
      if (triggered && htfDir != null && htfDir != 'Neutral' && htfDir != dir) {
        triggered = false;
      }

      latestBreakdown = [
        ...activeEval.labels,
        if (htfDir != null && strat.htfTimeframe != null)
          'HTF ${strat.htfTimeframe!.code}: $htfDir',
      ];
      latestScore = activeEval.score;
      latestDir = triggered ? dir : 'Neutral';
      if (triggered) signals++;

      if (inPos) {
        final atrNow = bundle.atrMap[c.timeSeconds] ?? (c.close * 0.002);
        final safeAtrNow = atrNow > 0 ? atrNow : (c.close * 0.002);

        // Break-Even stop management
        if (strat.breakEvenR > 0 && initialRiskDist > 0) {
          if (isBuy &&
              c.high >= entryPrice + initialRiskDist * strat.breakEvenR &&
              slPrice < entryPrice) {
            slPrice = entryPrice;
          } else if (!isBuy &&
              c.low <= entryPrice - initialRiskDist * strat.breakEvenR &&
              slPrice > entryPrice) {
            slPrice = entryPrice;
          }
        }

        // ATR Trailing Stop management
        if (strat.trailingAtrMult > 0) {
          final trailDist = safeAtrNow * strat.trailingAtrMult;
          if (isBuy) {
            final candidate = c.close - trailDist;
            if (candidate > slPrice) slPrice = candidate;
          } else {
            final candidate = c.close + trailDist;
            if (candidate < slPrice) slPrice = candidate;
          }
        }

        // Optional custom exit rules
        bool exitRuleHit = false;
        if (strat.exitRules.isNotEmpty) {
          for (final er in strat.exitRules) {
            final ev = isBuy
                ? _evalRuleAt(er, bundle, i)
                : _evalRuleAt(_mirrorRule(er), bundle, i);
            if (ev.matched) {
              exitRuleHit = true;
              break;
            }
          }
        }

        String? exitReason;
        double exitPrice = c.close;
        if (isBuy) {
          if (c.low <= slPrice) {
            exitPrice = slPrice;
            exitReason = slPrice == entryPrice ? 'Break-Even' : 'SL Hit';
          } else if (c.high >= tpPrice) {
            exitPrice = tpPrice;
            exitReason = 'TP Hit';
          } else if (exitRuleHit) {
            exitReason = 'Exit Rule';
          } else if (strat.maxHoldBars > 0 &&
              (i - entryBarIdx) >= strat.maxHoldBars) {
            exitReason = 'Time Stop';
          } else if (triggered && dir == 'Sell') {
            exitReason = 'Opposite Signal';
          }
        } else {
          if (c.high >= slPrice) {
            exitPrice = slPrice;
            exitReason = slPrice == entryPrice ? 'Break-Even' : 'SL Hit';
          } else if (c.low <= tpPrice) {
            exitPrice = tpPrice;
            exitReason = 'TP Hit';
          } else if (exitRuleHit) {
            exitReason = 'Exit Rule';
          } else if (strat.maxHoldBars > 0 &&
              (i - entryBarIdx) >= strat.maxHoldBars) {
            exitReason = 'Time Stop';
          } else if (triggered && dir == 'Buy') {
            exitReason = 'Opposite Signal';
          }
        }

        if (exitReason != null || i == candles.length - 1) {
          exitReason ??= 'Period End';
          final rawPct = isBuy
              ? ((exitPrice - entryPrice) / entryPrice) * 100.0
              : ((entryPrice - exitPrice) / entryPrice) * 100.0;
          final spreadCostPct = (strat.spreadBps / 100.0);
          final netRawPct = rawPct - spreadCostPct;
          final leveragedPct = netRawPct * (strat.riskPercent / 1.0);
          final pnlDollar = equity * (leveragedPct / 100.0);
          equity += pnlDollar;
          if (equity > peak) peak = equity;
          final dd = peak > 0 ? ((peak - equity) / peak) * 100.0 : 0.0;
          if (dd > maxDdPct) maxDdPct = dd;
          if (pnlDollar >= 0) {
            wins++;
            grossWin += pnlDollar;
          } else {
            grossLoss += pnlDollar.abs();
          }
          if (exitReason == 'SL Hit' && strat.cooldownBarsAfterSl > 0) {
            cooldownUntilIdx = i + strat.cooldownBarsAfterSl;
          }
          trades.add(StrategyTestTrade(
            entryTime: entryTime,
            exitTime: c.timestamp,
            direction: isBuy ? 'Buy' : 'Sell',
            entryPrice: entryPrice,
            exitPrice: exitPrice,
            pnlPercent: leveragedPct,
            exitReason: exitReason,
            matchedRules: entryMatched,
          ));
          inPos = false;
        }
      }

      if (!inPos &&
          triggered &&
          i >= cooldownUntilIdx &&
          i < candles.length - 1) {
        final atr = bundle.atrMap[c.timeSeconds] ?? (c.close * 0.002);
        final safeAtr = atr > 0 ? atr : (c.close * 0.002);
        inPos = true;
        isBuy = dir != 'Sell';
        entryPrice = c.close;
        entryBarIdx = i;
        entryTime = c.timestamp;
        entryMatched = activeEval.matchedLabels;
        initialRiskDist = safeAtr * strat.stopLossAtrMult;
        slPrice = isBuy
            ? entryPrice - initialRiskDist
            : entryPrice + initialRiskDist;
        tpPrice = isBuy
            ? entryPrice + safeAtr * strat.takeProfitAtrMult
            : entryPrice - safeAtr * strat.takeProfitAtrMult;
      }

      equityCurve.add(equity);
    }

    final netReturnPct = ((equity - 10000.0) / 10000.0) * 100.0;
    final winRate = trades.isEmpty ? 0.0 : (wins / trades.length) * 100.0;
    final pf = grossLoss > 0
        ? (grossWin / grossLoss)
        : (grossWin > 0 ? 9.99 : 0.0);

    return StrategyBacktestResult(
      barsTested: candles.length - startIdx,
      totalSignals: signals,
      totalTrades: trades.length,
      wins: wins,
      winRate: winRate,
      netReturnPct: netReturnPct,
      profitFactor: pf,
      maxDrawdownPct: maxDdPct,
      trades: trades.reversed.toList(),
      equityCurve: equityCurve,
      latestRuleBreakdown: latestBreakdown,
      latestScore: latestScore,
      latestDirection: latestDir,
    );
  }

  static Future<List<StrategyScanHit>> scanWithStrategies(
    MarketDataService marketData,
    List<String> symbols,
    List<StrategyDefinition> strategies,
    Timeframe tf,
  ) async {
    final hits = <StrategyScanHit>[];
    if (strategies.isEmpty) return hits;

    final candlesBySym = <String, List<Candle>>{};
    await Future.wait(symbols.map((sym) async {
      final res = await marketData.fetchCandles(sym, tf, count: 140);
      candlesBySym[sym] = res.candles;
    }));

    for (final strat in strategies) {
      for (final sym in symbols) {
        final candles = candlesBySym[sym] ?? const [];
        if (candles.length < 30 || strat.entryRules.isEmpty) continue;
        final scopedStrat = strat.copyWith(symbol: sym, timeframe: tf);
        final res = backtestStrategy(
          scopedStrat,
          candles,
          lookbackBars: 20,
          requireAllRules: strat.combinator != 'OR',
        );
        hits.add(StrategyScanHit(
          strategy: strat,
          spec: SymbolCatalog.find(sym),
          timeframe: tf,
          price: candles.last.close,
          matchScore: res.latestScore,
          signal: res.latestDirection,
          ruleBreakdown: res.latestRuleBreakdown,
        ));
      }
    }

    hits.sort((a, b) => b.matchScore.compareTo(a.matchScore));
    return hits;
  }

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

  static Future<MultiSymbolBacktestResult> backtestUniverse(
    StrategyDefinition strat,
    MarketDataService marketData, {
    int lookbackBars = 500,
  }) async {
    final symbols = SymbolCatalog.resolveUniverse(
      strat.scanUniverse,
      fallbackSymbol: strat.symbol,
      customSymbols: strat.scanSymbols,
    );
    final summaries = <SymbolBacktestSummary>[];
    final requireAll = strat.combinator != 'OR';
    await Future.wait(symbols.map((sym) async {
      final res = await marketData.fetchCandles(
        sym,
        strat.timeframe,
        count: lookbackBars + 60,
      );
      final bt = backtestStrategy(
        strat.copyWith(symbol: sym),
        res.candles,
        lookbackBars: lookbackBars,
        requireAllRules: requireAll,
      );
      summaries.add(SymbolBacktestSummary(symbol: sym, result: bt));
    }));
    summaries.sort(
      (a, b) => b.result.netReturnPct.compareTo(a.result.netReturnPct),
    );
    final totalTrades =
        summaries.fold<int>(0, (sum, s) => sum + s.result.totalTrades);
    final totalWins = summaries.fold<int>(0, (sum, s) => sum + s.result.wins);
    final avgWinRate = totalTrades > 0 ? (totalWins / totalTrades) * 100.0 : 0.0;
    final avgReturn = summaries.isEmpty
        ? 0.0
        : summaries.fold<double>(0.0, (s, x) => s + x.result.netReturnPct) /
            summaries.length;
    final validPfs =
        summaries.where((s) => s.result.totalTrades > 0).toList();
    final avgPf = validPfs.isEmpty
        ? 0.0
        : validPfs.fold<double>(0.0, (s, x) => s + x.result.profitFactor) /
            validPfs.length;
    final maxDd = summaries.isEmpty
        ? 0.0
        : summaries
            .map((s) => s.result.maxDrawdownPct)
            .reduce((a, b) => math.max(a, b));
    return MultiSymbolBacktestResult(
      perSymbol: summaries,
      totalTrades: totalTrades,
      totalWins: totalWins,
      avgWinRate: avgWinRate,
      avgNetReturnPct: avgReturn,
      avgProfitFactor: avgPf,
      maxDrawdownPct: maxDd,
    );
  }

  static Future<List<StrategyScanHit>> scanUniverse(
    StrategyDefinition strat,
    MarketDataService marketData,
  ) async {
    final symbols = SymbolCatalog.resolveUniverse(
      strat.scanUniverse,
      fallbackSymbol: strat.symbol,
      customSymbols: strat.scanSymbols,
    );
    final requireAll = strat.combinator != 'OR';
    final hits = <StrategyScanHit>[];
    await Future.wait(symbols.map((sym) async {
      final spec = SymbolCatalog.find(sym);
      final res = await marketData.fetchCandles(sym, strat.timeframe, count: 250);
      final bt = backtestStrategy(
        strat.copyWith(symbol: sym),
        res.candles,
        lookbackBars: 30,
        requireAllRules: requireAll,
      );
      final isTriggered =
          (requireAll ? bt.latestScore >= 100 : bt.latestScore > 0) &&
              bt.latestDirection != 'Neutral';
      hits.add(StrategyScanHit(
        strategy: strat,
        spec: spec,
        timeframe: strat.timeframe,
        price: res.candles.isNotEmpty ? res.candles.last.close : 0.0,
        matchScore: bt.latestScore,
        signal: bt.latestDirection,
        ruleBreakdown: bt.latestRuleBreakdown,
        triggered: isTriggered,
      ));
    }));
    hits.sort((a, b) {
      if (a.triggered != b.triggered) return a.triggered ? -1 : 1;
      return b.matchScore.compareTo(a.matchScore);
    });
    return hits;
  }

  static SignalAuditLog evaluateStrategyOnCandles(
    StrategyDefinition strat,
    List<Candle> candles,
  ) {
    final requireAll = strat.combinator != 'OR';
    final bt = backtestStrategy(
      strat,
      candles,
      lookbackBars: 30,
      requireAllRules: requireAll,
    );
    final matchScore = bt.latestScore;
    final direction = bt.latestDirection;
    final breakdownText = bt.latestRuleBreakdown.join(' · ');

    String outcome = 'NearMiss';
    String reason = breakdownText.isEmpty
        ? 'Score ${matchScore.toStringAsFixed(0)}%'
        : '$breakdownText · Score ${matchScore.toStringAsFixed(0)}%';
    final isTriggered = requireAll ? matchScore >= 100 : matchScore > 0;
    if (!strat.isEnabled) {
      outcome = 'Rejected';
      reason = 'Strategy paused · $reason';
    } else if (isTriggered && direction != 'Neutral') {
      outcome = 'Executed';
      reason = 'Rule threshold triggered ($direction) · $reason';
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
      price: candles.isNotEmpty ? candles.last.close : 0.0,
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
