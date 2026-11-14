import 'dart:math' as math;
import '../models/trading_models.dart';

class TimeValuePoint {
  final int timeSeconds;
  final double value;
  const TimeValuePoint(this.timeSeconds, this.value);
}

class BollingerPoint {
  final int timeSeconds;
  final double upper;
  final double middle;
  final double lower;
  const BollingerPoint(this.timeSeconds, this.upper, this.middle, this.lower);
}

class MacdPoint {
  final int timeSeconds;
  final double macd;
  final double signal;
  final double histogram;
  const MacdPoint(this.timeSeconds, this.macd, this.signal, this.histogram);
}

class SupertrendPoint {
  final int timeSeconds;
  final double value;
  final int direction; // 1 = up, -1 = down
  const SupertrendPoint(this.timeSeconds, this.value, this.direction);
}

class IchimokuPoint {
  final int timeSeconds;
  final double? tenkan;
  final double? kijun;
  final double? spanA;
  final double? spanB;
  const IchimokuPoint(
    this.timeSeconds,
    this.tenkan,
    this.kijun,
    this.spanA,
    this.spanB,
  );
}

class IndicatorEngine {
  /// Counts the meaningful decimal places observed in a price value (up to 10),
  /// stripping IEEE-754 floating point tail noise.
  static int countObservedDecimals(double? value) {
    if (value == null || !value.isFinite || value == 0) return 0;
    final clean = double.tryParse(value.abs().toStringAsPrecision(12));
    if (clean == null) return 0;
    final str = clean.toString();
    if (str.contains('e-')) {
      final parts = str.split('e-');
      final exp = int.tryParse(parts[1]) ?? 0;
      final mantissa = parts[0].replaceAll('.', '').replaceFirst(RegExp(r'0+$'), '');
      return math.min(10, exp + math.max(0, mantissa.length - 1));
    }
    final dotIdx = str.indexOf('.');
    if (dotIdx < 0) return 0;
    final frac = str.substring(dotIdx + 1).replaceFirst(RegExp(r'0+$'), '');
    return math.min(10, frac.length);
  }

  /// Dynamically computes the decimal precision for any symbol & sample prices
  /// without hard-capping at 4 or 5 decimals.
  static int getSymbolDigits(
    String symbol, {
    double? samplePrice,
    List<double>? extraPrices,
  }) {
    final s = symbol.toUpperCase();
    int observed = countObservedDecimals(samplePrice);
    if (extraPrices != null) {
      for (final p in extraPrices) {
        final d = countObservedDecimals(p);
        if (d > observed) observed = d;
      }
    }

    final refPrice = (samplePrice != null && samplePrice > 0)
        ? samplePrice
        : (extraPrices != null && extraPrices.isNotEmpty
            ? extraPrices.firstWhere((p) => p > 0, orElse: () => 0)
            : 0.0);

    int baseline = 2;
    if (s.contains('JPY')) {
      baseline = 3;
    } else if (refPrice > 0 && refPrice < 1.0) {
      final leadingZeros = (-math.log(refPrice) / math.ln10).ceil();
      baseline = (leadingZeros + 4).clamp(5, 10);
    } else if (refPrice >= 1000) {
      baseline = 2;
    } else if (refPrice >= 50) {
      baseline = 2;
    } else if (s.length == 6 || s.contains('/')) {
      baseline = 5;
    } else if (refPrice > 0 && refPrice < 50) {
      baseline = 4;
    }

    return math.max(observed, baseline).clamp(2, 10);
  }

  static String formatPrice(
    double price,
    String symbol, {
    List<double>? extraPrices,
  }) {
    final digits = getSymbolDigits(
      symbol,
      samplePrice: price,
      extraPrices: extraPrices,
    );
    if (price.abs() >= 1000 && digits <= 2) {
      return _formatWithCommas(price, digits);
    }
    return price.toStringAsFixed(digits);
  }

  static String _formatWithCommas(double value, int decimals) {
    final fixed = value.toStringAsFixed(decimals);
    final parts = fixed.split('.');
    final intPart = parts[0];
    final buf = StringBuffer();
    int count = 0;
    for (int i = intPart.length - 1; i >= 0; i--) {
      if (intPart[i] == '-') {
        buf.write('-');
        continue;
      }
      if (count > 0 && count % 3 == 0) {
        buf.write(',');
      }
      buf.write(intPart[i]);
      count++;
    }
    final formattedInt = buf.toString().split('').reversed.join();
    return parts.length > 1 ? '$formattedInt.${parts[1]}' : formattedInt;
  }

  static double roundDynamic(double value, String symbol, double? refPrice) {
    final digits = getSymbolDigits(symbol, samplePrice: refPrice ?? value);
    final factor = math.pow(10, digits);
    return (value * factor).roundToDouble() / factor;
  }

  static DateTime alignToTimeframeBoundaryUtc(DateTime dt, Timeframe tf) {
    final u = dt.toUtc();
    if (tf == Timeframe.w1) {
      final daysSinceMonday = (u.weekday - DateTime.monday) % 7;
      final monday = u.subtract(Duration(days: daysSinceMonday));
      return DateTime.utc(monday.year, monday.month, monday.day);
    }
    if (tf == Timeframe.d1) {
      return DateTime.utc(u.year, u.month, u.day);
    }
    final sec = u.millisecondsSinceEpoch ~/ 1000;
    final aligned = (sec ~/ tf.seconds) * tf.seconds;
    return DateTime.fromMillisecondsSinceEpoch(aligned * 1000, isUtc: true);
  }

  static List<Candle> aggregateAndAlignCandles(
    List<Candle> raw,
    Timeframe tf,
  ) {
    if (raw.isEmpty) return [];
    final sorted = [...raw]..sort((a, b) => a.timestamp.compareTo(b.timestamp));
    final Map<int, Candle> buckets = {};
    final nowAligned = alignToTimeframeBoundaryUtc(DateTime.now().toUtc(), tf);

    for (final c in sorted) {
      final bucketDt = alignToTimeframeBoundaryUtc(c.timestamp, tf);
      final key = bucketDt.millisecondsSinceEpoch;
      final existing = buckets[key];
      final isComplete = bucketDt.isBefore(nowAligned);
      if (existing == null) {
        buckets[key] = Candle(
          timestamp: bucketDt,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume,
          isComplete: isComplete,
        );
      } else {
        buckets[key] = Candle(
          timestamp: bucketDt,
          open: existing.open,
          high: math.max(existing.high, c.high),
          low: math.min(existing.low, c.low),
          close: c.close,
          volume: existing.volume + c.volume,
          isComplete: isComplete,
        );
      }
    }

    final result = buckets.values.toList()
      ..sort((a, b) => a.timestamp.compareTo(b.timestamp));
    return result;
  }

  static List<Candle> calculateHeikinAshi(List<Candle> candles, String symbol) {
    if (candles.isEmpty) return [];
    final result = <Candle>[];
    double? prevOpen;
    double? prevClose;
    for (final c in candles) {
      final haClose = (c.open + c.high + c.low + c.close) / 4.0;
      final haOpen = prevOpen == null
          ? (c.open + c.close) / 2.0
          : (prevOpen + prevClose!) / 2.0;
      final haHigh = math.max(c.high, math.max(haOpen, haClose));
      final haLow = math.min(c.low, math.min(haOpen, haClose));
      prevOpen = haOpen;
      prevClose = haClose;
      result.add(Candle(
        timestamp: c.timestamp,
        open: roundDynamic(haOpen, symbol, c.close),
        high: roundDynamic(haHigh, symbol, c.close),
        low: roundDynamic(haLow, symbol, c.close),
        close: roundDynamic(haClose, symbol, c.close),
        volume: c.volume,
        isComplete: c.isComplete,
      ));
    }
    return result;
  }

  static List<TimeValuePoint> calculateSMA(
    List<Candle> candles,
    int period,
    String symbol,
  ) {
    if (candles.length < period) return [];
    final result = <TimeValuePoint>[];
    double sum = 0;
    for (int i = 0; i < candles.length; i++) {
      sum += candles[i].close;
      if (i >= period) {
        sum -= candles[i - period].close;
      }
      if (i >= period - 1) {
        final avg = sum / period;
        result.add(TimeValuePoint(
          candles[i].timeSeconds,
          roundDynamic(avg, symbol, candles[i].close),
        ));
      }
    }
    return result;
  }

  static List<TimeValuePoint> calculateEMA(
    List<Candle> candles,
    int period,
    String symbol,
  ) {
    if (candles.length < period) return [];
    final result = <TimeValuePoint>[];
    final k = 2.0 / (period + 1);
    double sum = 0;
    for (int i = 0; i < period; i++) {
      sum += candles[i].close;
    }
    double ema = sum / period;
    result.add(TimeValuePoint(
      candles[period - 1].timeSeconds,
      roundDynamic(ema, symbol, candles[period - 1].close),
    ));

    for (int i = period; i < candles.length; i++) {
      ema = candles[i].close * k + ema * (1 - k);
      result.add(TimeValuePoint(
        candles[i].timeSeconds,
        roundDynamic(ema, symbol, candles[i].close),
      ));
    }
    return result;
  }

  static List<BollingerPoint> calculateBollingerBands(
    List<Candle> candles,
    int period,
    double stdDevMult,
    String symbol,
  ) {
    if (candles.length < period) return [];
    final result = <BollingerPoint>[];
    for (int i = period - 1; i < candles.length; i++) {
      double sum = 0;
      for (int j = i - period + 1; j <= i; j++) {
        sum += candles[j].close;
      }
      final mean = sum / period;
      double sq = 0;
      for (int j = i - period + 1; j <= i; j++) {
        final diff = candles[j].close - mean;
        sq += diff * diff;
      }
      final std = math.sqrt(sq / period);
      final ref = candles[i].close;
      result.add(BollingerPoint(
        candles[i].timeSeconds,
        roundDynamic(mean + stdDevMult * std, symbol, ref),
        roundDynamic(mean, symbol, ref),
        roundDynamic(mean - stdDevMult * std, symbol, ref),
      ));
    }
    return result;
  }

  static List<TimeValuePoint> calculateRSI(List<Candle> candles, int period) {
    if (candles.length <= period) return [];
    final result = <TimeValuePoint>[];
    double gainSum = 0;
    double lossSum = 0;
    for (int i = 1; i <= period; i++) {
      final diff = candles[i].close - candles[i - 1].close;
      if (diff >= 0) {
        gainSum += diff;
      } else {
        lossSum -= diff;
      }
    }
    double avgGain = gainSum / period;
    double avgLoss = lossSum / period;

    double rsi = avgLoss == 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));
    result.add(TimeValuePoint(candles[period].timeSeconds, rsi));

    for (int i = period + 1; i < candles.length; i++) {
      final diff = candles[i].close - candles[i - 1].close;
      final gain = diff > 0 ? diff : 0.0;
      final loss = diff < 0 ? -diff : 0.0;
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      rsi = avgLoss == 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));
      result.add(TimeValuePoint(candles[i].timeSeconds, rsi));
    }
    return result;
  }

  static List<MacdPoint> calculateMACD(
    List<Candle> candles,
    int fastPeriod,
    int slowPeriod,
    int signalPeriod,
  ) {
    if (candles.length < slowPeriod + signalPeriod) return [];
    final fastEma = _rawEma(candles.map((c) => c.close).toList(), fastPeriod);
    final slowEma = _rawEma(candles.map((c) => c.close).toList(), slowPeriod);

    final macdSeries = <double>[];
    final macdTimes = <int>[];
    for (int i = 0; i < candles.length; i++) {
      final f = fastEma[i];
      final s = slowEma[i];
      if (f != null && s != null) {
        macdSeries.add(f - s);
        macdTimes.add(candles[i].timeSeconds);
      }
    }
    if (macdSeries.length < signalPeriod) return [];
    final signalEma = _rawEma(macdSeries, signalPeriod);
    final result = <MacdPoint>[];
    for (int i = 0; i < macdSeries.length; i++) {
      final sig = signalEma[i];
      if (sig != null) {
        result.add(MacdPoint(
          macdTimes[i],
          macdSeries[i],
          sig,
          macdSeries[i] - sig,
        ));
      }
    }
    return result;
  }

  static List<double?> _rawEma(List<double> values, int period) {
    final result = List<double?>.filled(values.length, null);
    if (values.length < period) return result;
    double sum = 0;
    for (int i = 0; i < period; i++) {
      sum += values[i];
    }
    double ema = sum / period;
    result[period - 1] = ema;
    final k = 2.0 / (period + 1);
    for (int i = period; i < values.length; i++) {
      ema = values[i] * k + ema * (1 - k);
      result[i] = ema;
    }
    return result;
  }

  static List<TimeValuePoint> calculateATR(
    List<Candle> candles,
    int period,
    String symbol,
  ) {
    if (candles.length <= period) return [];
    final tr = <double>[];
    for (int i = 1; i < candles.length; i++) {
      final h = candles[i].high;
      final l = candles[i].low;
      final pc = candles[i - 1].close;
      tr.add(math.max(h - l, math.max((h - pc).abs(), (l - pc).abs())));
    }
    double atr = tr.take(period).reduce((a, b) => a + b) / period;
    final result = <TimeValuePoint>[
      TimeValuePoint(
        candles[period].timeSeconds,
        roundDynamic(atr, symbol, candles[period].close),
      ),
    ];
    for (int i = period; i < tr.length; i++) {
      atr = (atr * (period - 1) + tr[i]) / period;
      result.add(TimeValuePoint(
        candles[i + 1].timeSeconds,
        roundDynamic(atr, symbol, candles[i + 1].close),
      ));
    }
    return result;
  }

  static List<TimeValuePoint> calculateVWAP(
    List<Candle> candles,
    String symbol,
  ) {
    final result = <TimeValuePoint>[];
    double cumPV = 0;
    double cumVol = 0;
    for (final c in candles) {
      final vol = c.volume > 0 ? c.volume : 1.0;
      final tp = (c.high + c.low + c.close) / 3.0;
      cumPV += tp * vol;
      cumVol += vol;
      result.add(TimeValuePoint(
        c.timeSeconds,
        roundDynamic(cumPV / cumVol, symbol, c.close),
      ));
    }
    return result;
  }

  static List<SupertrendPoint> calculateSupertrend(
    List<Candle> candles,
    int period,
    double multiplier,
    String symbol,
  ) {
    final atrPoints = calculateATR(candles, period, symbol);
    if (atrPoints.isEmpty) return [];
    final atrByTime = {for (final a in atrPoints) a.timeSeconds: a.value};
    final result = <SupertrendPoint>[];
    double? prevUpper;
    double? prevLower;
    int dir = 1;

    for (int i = 0; i < candles.length; i++) {
      final c = candles[i];
      final atr = atrByTime[c.timeSeconds];
      if (atr == null) continue;
      final hl2 = (c.high + c.low) / 2.0;
      double upper = hl2 + multiplier * atr;
      double lower = hl2 - multiplier * atr;

      if (prevUpper != null && prevLower != null) {
        final prevClose = candles[i - 1].close;
        if (upper > prevUpper && prevClose <= prevUpper) upper = prevUpper;
        if (lower < prevLower && prevClose >= prevLower) lower = prevLower;
      }

      if (c.close > (prevUpper ?? upper)) {
        dir = 1;
      } else if (c.close < (prevLower ?? lower)) {
        dir = -1;
      }
      prevUpper = upper;
      prevLower = lower;

      final val = dir == 1 ? lower : upper;
      result.add(SupertrendPoint(
        c.timeSeconds,
        roundDynamic(val, symbol, c.close),
        dir,
      ));
    }
    return result;
  }

  static List<IchimokuPoint> calculateIchimoku(
    List<Candle> candles,
    String symbol,
  ) {
    final result = <IchimokuPoint>[];
    double? midRange(int endIdx, int length) {
      if (endIdx < length - 1) return null;
      double hi = -double.infinity;
      double lo = double.infinity;
      for (int i = endIdx - length + 1; i <= endIdx; i++) {
        if (candles[i].high > hi) hi = candles[i].high;
        if (candles[i].low < lo) lo = candles[i].low;
      }
      return (hi + lo) / 2.0;
    }

    for (int i = 0; i < candles.length; i++) {
      final ref = candles[i].close;
      final t = midRange(i, 9);
      final k = midRange(i, 26);
      final b = midRange(i, 52);
      final spanA = (t != null && k != null) ? (t + k) / 2.0 : null;
      result.add(IchimokuPoint(
        candles[i].timeSeconds,
        t != null ? roundDynamic(t, symbol, ref) : null,
        k != null ? roundDynamic(k, symbol, ref) : null,
        spanA != null ? roundDynamic(spanA, symbol, ref) : null,
        b != null ? roundDynamic(b, symbol, ref) : null,
      ));
    }
    return result;
  }
}
