import { Candle } from '../types/trading';

export interface IndicatorPoint {
  time: number; // UTC timestamp in seconds
  value: number;
}

export interface AlignedPoint {
  time: number; // UTC timestamp in seconds
  value?: number;
}

export interface BollingerBandPoints {
  upper: IndicatorPoint[];
  middle: IndicatorPoint[];
  lower: IndicatorPoint[];
}

export interface MacdPoints {
  macd: AlignedPoint[];
  signal: AlignedPoint[];
  histogram: { time: number; value?: number; color?: string }[];
}

export interface StochasticPoints {
  k: IndicatorPoint[];
  d: IndicatorPoint[];
}

export interface IchimokuPoints {
  tenkan: IndicatorPoint[];
  kijun: IndicatorPoint[];
  spanA: IndicatorPoint[];
  spanB: IndicatorPoint[];
}

export interface SupertrendPoint {
  time: number;
  value: number;
  direction: 'bull' | 'bear';
}

/**
 * Converts candle timestamp to UTC seconds timestamp for lightweight-charts
 */
export function getCandleTimeSeconds(timestamp: string | number): number {
  if (typeof timestamp === 'number') {
    return timestamp > 1e11 ? Math.floor(timestamp / 1000) : timestamp;
  }
  return Math.floor(new Date(timestamp).getTime() / 1000);
}

/**
 * Sorts and deduplicates candles chronologically.
 * If multiple candles share the same second timestamp (e.g., historical vs. updated live forming bar),
 * the most recently updated candle is preserved.
 */
export function sanitizeCandles(candles: Candle[]): Candle[] {
  if (!candles || candles.length === 0) return [];
  const map = new Map<number, Candle>();
  for (const c of candles) {
    if (!c || !c.timestamp) continue;
    const open = Number(c.open);
    const high = Number(c.high);
    const low = Number(c.low);
    const close = Number(c.close);

    // Reject non-numeric, null, undefined, or non-positive candles
    if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) continue;
    if (open <= 0 || high <= 0 || low <= 0 || close <= 0) continue;

    // Protect against corrupt candles where close or low has plunged to near 0 relative to open
    if (close < open * 0.25 || low < open * 0.25) continue;

    const safeHigh = Math.max(high, open, close);
    const safeLow = Math.min(low, open, close);

    const safeCandle: Candle = {
      ...c,
      open,
      high: safeHigh,
      low: safeLow,
      close,
      volume: Number(c.volume) || 100,
    };

    const t = getCandleTimeSeconds(c.timestamp);
    map.set(t, safeCandle);
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

/**
 * Simple Moving Average (SMA)
 */
export function calculateSMA(candles: Candle[], period: number): IndicatorPoint[] {
  const result: IndicatorPoint[] = [];
  if (candles.length < period || period <= 0) return result;

  let sum = 0;
  for (let i = 0; i < candles.length; i++) {
    sum += candles[i].close;
    if (i >= period) {
      sum -= candles[i - period].close;
    }
    if (i >= period - 1) {
      result.push({
        time: getCandleTimeSeconds(candles[i].timestamp),
        value: Number((sum / period).toFixed(5)),
      });
    }
  }
  return result;
}

/**
 * Exponential Moving Average (EMA)
 */
export function calculateEMA(candles: Candle[], period: number): IndicatorPoint[] {
  const result: IndicatorPoint[] = [];
  if (candles.length < period || period <= 0) return result;

  const multiplier = 2 / (period + 1);

  // Initialize with SMA
  let initialSum = 0;
  for (let i = 0; i < period; i++) {
    initialSum += candles[i].close;
  }
  let prevEma = initialSum / period;
  result.push({
    time: getCandleTimeSeconds(candles[period - 1].timestamp),
    value: Number(prevEma.toFixed(5)),
  });

  for (let i = period; i < candles.length; i++) {
    const currentPrice = candles[i].close;
    const currentEma = (currentPrice - prevEma) * multiplier + prevEma;
    result.push({
      time: getCandleTimeSeconds(candles[i].timestamp),
      value: Number(currentEma.toFixed(5)),
    });
    prevEma = currentEma;
  }

  return result;
}

/**
 * Bollinger Bands
 */
export function calculateBollingerBands(
  candles: Candle[],
  period: number = 20,
  stdDevMultiplier: number = 2
): BollingerBandPoints {
  const upper: IndicatorPoint[] = [];
  const middle: IndicatorPoint[] = [];
  const lower: IndicatorPoint[] = [];

  if (candles.length < period || period <= 0) {
    return { upper, middle, lower };
  }

  for (let i = period - 1; i < candles.length; i++) {
    const window = candles.slice(i - period + 1, i + 1);
    const mean = window.reduce((sum, c) => sum + c.close, 0) / period;
    const variance =
      window.reduce((sum, c) => sum + Math.pow(c.close - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    const time = getCandleTimeSeconds(candles[i].timestamp);
    middle.push({ time, value: Number(mean.toFixed(5)) });
    upper.push({ time, value: Number((mean + stdDev * stdDevMultiplier).toFixed(5)) });
    lower.push({ time, value: Number((mean - stdDev * stdDevMultiplier).toFixed(5)) });
  }

  return { upper, middle, lower };
}

/**
 * Relative Strength Index (RSI) using Wilder's smoothing.
 * Warmup candles are padded with whitespace objects { time } to ensure exact 1-to-1 bar alignment.
 */
export function calculateRSI(candles: Candle[], period: number = 14): AlignedPoint[] {
  const result: AlignedPoint[] = [];
  if (!candles || candles.length === 0) return result;

  if (candles.length <= period || period <= 0) {
    return candles.map((c) => ({ time: getCandleTimeSeconds(c.timestamp) }));
  }

  // Pre-pad with whitespace data points for warmup candles
  for (let i = 0; i < period; i++) {
    result.push({ time: getCandleTimeSeconds(candles[i].timestamp) });
  }

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = 100 - 100 / (1 + rs);

  result.push({
    time: getCandleTimeSeconds(candles[period].timestamp),
    value: Number(rsi.toFixed(2)),
  });

  for (let i = period + 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    const currentGain = diff > 0 ? diff : 0;
    const currentLoss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = 100 - 100 / (1 + rs);

    result.push({
      time: getCandleTimeSeconds(candles[i].timestamp),
      value: Number(rsi.toFixed(2)),
    });
  }

  return result;
}

/**
 * Moving Average Convergence Divergence (MACD).
 * Warmup candles are padded with whitespace objects { time } to ensure exact 1-to-1 bar alignment.
 */
export function calculateMACD(
  candles: Candle[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MacdPoints {
  if (!candles || candles.length === 0) {
    return { macd: [], signal: [], histogram: [] };
  }

  if (candles.length < slowPeriod + signalPeriod) {
    const blanks = candles.map((c) => ({ time: getCandleTimeSeconds(c.timestamp) }));
    return {
      macd: blanks,
      signal: blanks,
      histogram: blanks,
    };
  }

  const fastEma = calculateEMA(candles, fastPeriod);
  const slowEma = calculateEMA(candles, slowPeriod);

  // Align Fast and Slow EMA by time
  const slowMap = new Map<number, number>();
  slowEma.forEach((p) => {
    if (p.value !== undefined) slowMap.set(p.time, p.value);
  });

  const macdLineRaw: { time: number; value: number }[] = [];
  fastEma.forEach((fastPoint) => {
    if (fastPoint.value !== undefined) {
      const slowVal = slowMap.get(fastPoint.time);
      if (slowVal !== undefined) {
        macdLineRaw.push({
          time: fastPoint.time,
          value: Number((fastPoint.value - slowVal).toFixed(6)),
        });
      }
    }
  });

  if (macdLineRaw.length < signalPeriod) {
    const blanks = candles.map((c) => ({ time: getCandleTimeSeconds(c.timestamp) }));
    return { macd: blanks, signal: blanks, histogram: blanks };
  }

  const macdMap = new Map<number, number>();
  macdLineRaw.forEach((m) => macdMap.set(m.time, m.value));

  // Calculate Signal line (EMA of MACD line)
  const signalMultiplier = 2 / (signalPeriod + 1);
  const signalMap = new Map<number, number>();
  const histMap = new Map<number, { value: number; color: string }>();

  let initialSignalSum = 0;
  for (let i = 0; i < signalPeriod; i++) {
    initialSignalSum += macdLineRaw[i].value;
  }
  let prevSignal = initialSignalSum / signalPeriod;

  const firstTime = macdLineRaw[signalPeriod - 1].time;
  const firstMacd = macdLineRaw[signalPeriod - 1].value;
  const firstHist = firstMacd - prevSignal;

  signalMap.set(firstTime, Number(prevSignal.toFixed(6)));
  histMap.set(firstTime, {
    value: Number(firstHist.toFixed(6)),
    color: firstHist >= 0 ? '#10b981' : '#ef4444',
  });

  let prevHist = firstHist;
  for (let i = signalPeriod; i < macdLineRaw.length; i++) {
    const currMacd = macdLineRaw[i].value;
    const currSignal = (currMacd - prevSignal) * signalMultiplier + prevSignal;
    const currHist = currMacd - currSignal;
    const time = macdLineRaw[i].time;

    let color = '#10b981';
    if (currHist >= 0) {
      color = currHist >= prevHist ? '#10b981' : '#34d399';
    } else {
      color = currHist <= prevHist ? '#ef4444' : '#f87171';
    }

    signalMap.set(time, Number(currSignal.toFixed(6)));
    histMap.set(time, { value: Number(currHist.toFixed(6)), color });

    prevSignal = currSignal;
    prevHist = currHist;
  }

  // Build 1-to-1 arrays matching each candle in cleanCandles
  const alignedMacd: AlignedPoint[] = [];
  const alignedSignal: AlignedPoint[] = [];
  const alignedHist: { time: number; value?: number; color?: string }[] = [];

  for (const c of candles) {
    const t = getCandleTimeSeconds(c.timestamp);
    const mVal = macdMap.get(t);
    const sVal = signalMap.get(t);
    const hData = histMap.get(t);

    if (mVal !== undefined) {
      alignedMacd.push({ time: t, value: mVal });
    } else {
      alignedMacd.push({ time: t });
    }

    if (sVal !== undefined) {
      alignedSignal.push({ time: t, value: sVal });
    } else {
      alignedSignal.push({ time: t });
    }

    if (hData !== undefined) {
      alignedHist.push({ time: t, value: hData.value, color: hData.color });
    } else {
      alignedHist.push({ time: t });
    }
  }

  return {
    macd: alignedMacd,
    signal: alignedSignal,
    histogram: alignedHist,
  };
}

/**
 * Stochastic Oscillator (%K and %D)
 */
export function calculateStochastic(
  candles: Candle[],
  kPeriod: number = 14,
  dPeriod: number = 3,
  smooth: number = 3
): StochasticPoints {
  const kRaw: { time: number; value: number }[] = [];

  if (candles.length < kPeriod + dPeriod) return { k: [], d: [] };

  for (let i = kPeriod - 1; i < candles.length; i++) {
    const slice = candles.slice(i - kPeriod + 1, i + 1);
    const highestHigh = Math.max(...slice.map((c) => c.high));
    const lowestLow = Math.min(...slice.map((c) => c.low));
    const currentClose = candles[i].close;

    const diff = highestHigh - lowestLow;
    const k = diff === 0 ? 50 : ((currentClose - lowestLow) / diff) * 100;
    kRaw.push({ time: getCandleTimeSeconds(candles[i].timestamp), value: k });
  }

  // Smooth %K
  const smoothedK: IndicatorPoint[] = [];
  for (let i = smooth - 1; i < kRaw.length; i++) {
    const slice = kRaw.slice(i - smooth + 1, i + 1);
    const avg = slice.reduce((acc, p) => acc + p.value, 0) / smooth;
    smoothedK.push({ time: kRaw[i].time, value: Number(avg.toFixed(2)) });
  }

  // Calculate %D (SMA of smoothed %K)
  const dLine: IndicatorPoint[] = [];
  for (let i = dPeriod - 1; i < smoothedK.length; i++) {
    const slice = smoothedK.slice(i - dPeriod + 1, i + 1);
    const avg = slice.reduce((acc, p) => acc + p.value, 0) / dPeriod;
    dLine.push({ time: smoothedK[i].time, value: Number(avg.toFixed(2)) });
  }

  const dStartTime = dLine[0]?.time ?? 0;
  const alignedK = smoothedK.filter((p) => p.time >= dStartTime);

  return { k: alignedK, d: dLine };
}

/**
 * Average True Range (ATR)
 */
export function calculateATR(candles: Candle[], period: number = 14): IndicatorPoint[] {
  const result: IndicatorPoint[] = [];
  if (candles.length <= period || period <= 0) return result;

  const trueRanges: { time: number; tr: number }[] = [];
  for (let i = 1; i < candles.length; i++) {
    const curr = candles[i];
    const prev = candles[i - 1];
    const tr = Math.max(
      curr.high - curr.low,
      Math.abs(curr.high - prev.close),
      Math.abs(curr.low - prev.close)
    );
    trueRanges.push({ time: getCandleTimeSeconds(curr.timestamp), tr });
  }

  let atr = trueRanges.slice(0, period).reduce((acc, x) => acc + x.tr, 0) / period;
  result.push({
    time: trueRanges[period - 1].time,
    value: Number(atr.toFixed(5)),
  });

  for (let i = period; i < trueRanges.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i].tr) / period;
    result.push({
      time: trueRanges[i].time,
      value: Number(atr.toFixed(5)),
    });
  }

  return result;
}

/**
 * Volume Weighted Average Price (VWAP)
 */
export function calculateVWAP(candles: Candle[]): IndicatorPoint[] {
  const result: IndicatorPoint[] = [];
  if (candles.length === 0) return result;

  let cumTypicalVolume = 0;
  let cumVolume = 0;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const typicalPrice = (c.high + c.low + c.close) / 3;
    const vol = c.volume > 0 ? c.volume : 1;

    cumTypicalVolume += typicalPrice * vol;
    cumVolume += vol;

    const vwap = cumTypicalVolume / cumVolume;
    result.push({
      time: getCandleTimeSeconds(c.timestamp),
      value: Number(vwap.toFixed(5)),
    });
  }

  return result;
}

/**
 * Supertrend Indicator
 */
export function calculateSupertrend(
  candles: Candle[],
  period: number = 10,
  multiplier: number = 3
): SupertrendPoint[] {
  const result: SupertrendPoint[] = [];
  if (candles.length <= period) return result;

  const atrs = calculateATR(candles, period);
  const atrMap = new Map<number, number>();
  atrs.forEach((a) => atrMap.set(a.time, a.value));

  let prevUpper = 0;
  let prevLower = 0;
  let prevClose = 0;
  let trend: 'bull' | 'bear' = 'bull';

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const t = getCandleTimeSeconds(c.timestamp);
    const atr = atrMap.get(t);
    if (!atr) continue;

    const hl2 = (c.high + c.low) / 2;
    let basicUpper = hl2 + multiplier * atr;
    let basicLower = hl2 - multiplier * atr;

    let finalUpper =
      prevUpper > 0 && basicUpper < prevUpper || prevClose > prevUpper
        ? basicUpper
        : prevUpper;
    let finalLower =
      prevLower > 0 && basicLower > prevLower || prevClose < prevLower
        ? basicLower
        : prevLower;

    if (trend === 'bull' && c.close < finalLower) {
      trend = 'bear';
    } else if (trend === 'bear' && c.close > finalUpper) {
      trend = 'bull';
    }

    const value = trend === 'bull' ? finalLower : finalUpper;
    result.push({
      time: t,
      value: Number(value.toFixed(5)),
      direction: trend,
    });

    prevUpper = finalUpper;
    prevLower = finalLower;
    prevClose = c.close;
  }

  return result;
}

/**
 * Ichimoku Kinko Hyo
 */
export function calculateIchimoku(
  candles: Candle[],
  tenkanPeriod = 9,
  kijunPeriod = 26,
  senkouPeriod = 52
): IchimokuPoints {
  const tenkan: IndicatorPoint[] = [];
  const kijun: IndicatorPoint[] = [];
  const spanA: IndicatorPoint[] = [];
  const spanB: IndicatorPoint[] = [];

  const getMidPrice = (slice: Candle[]) => {
    const h = Math.max(...slice.map((c) => c.high));
    const l = Math.min(...slice.map((c) => c.low));
    return (h + l) / 2;
  };

  for (let i = 0; i < candles.length; i++) {
    const time = getCandleTimeSeconds(candles[i].timestamp);

    if (i >= tenkanPeriod - 1) {
      const val = getMidPrice(candles.slice(i - tenkanPeriod + 1, i + 1));
      tenkan.push({ time, value: Number(val.toFixed(5)) });
    }

    if (i >= kijunPeriod - 1) {
      const val = getMidPrice(candles.slice(i - kijunPeriod + 1, i + 1));
      kijun.push({ time, value: Number(val.toFixed(5)) });
    }

    if (i >= kijunPeriod - 1 && tenkan.length > 0 && kijun.length > 0) {
      const tVal = tenkan[tenkan.length - 1].value;
      const kVal = kijun[kijun.length - 1].value;
      spanA.push({ time, value: Number(((tVal + kVal) / 2).toFixed(5)) });
    }

    if (i >= senkouPeriod - 1) {
      const val = getMidPrice(candles.slice(i - senkouPeriod + 1, i + 1));
      spanB.push({ time, value: Number(val.toFixed(5)) });
    }
  }

  return { tenkan, kijun, spanA, spanB };
}

/**
 * Converts standard candles to smoothed Heikin Ashi candles
 */
export function calculateHeikinAshi(candles: Candle[]): Candle[] {
  if (!candles || candles.length === 0) return [];
  const haCandles: Candle[] = [];

  let prevHaOpen = candles[0].open;
  let prevHaClose = candles[0].close;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const haClose = (c.open + c.high + c.low + c.close) / 4;
    const haOpen = i === 0 ? (c.open + c.close) / 2 : (prevHaOpen + prevHaClose) / 2;
    const haHigh = Math.max(c.high, haOpen, haClose);
    const haLow = Math.min(c.low, haOpen, haClose);

    haCandles.push({
      symbol: c.symbol,
      timeframe: c.timeframe,
      timestamp: c.timestamp,
      open: Number(haOpen.toFixed(5)),
      high: Number(haHigh.toFixed(5)),
      low: Number(haLow.toFixed(5)),
      close: Number(haClose.toFixed(5)),
      volume: c.volume,
      isComplete: c.isComplete,
    });

    prevHaOpen = haOpen;
    prevHaClose = haClose;
  }

  return haCandles;
}

/**
 * Symbol formatting utilities & price precision
 */
export function getSymbolDigits(symbol: string, samplePrice?: number): number {
  const s = (symbol || '').toUpperCase();

  // If a sample price is provided and is extremely low (crypto penny tokens)
  if (samplePrice !== undefined && samplePrice > 0) {
    if (samplePrice < 0.001) return 6;
    if (samplePrice < 1) return 5;
    if (samplePrice < 10 && !s.includes('OIL') && !s.includes('GAS')) return 4;
  }

  // 1. Forex JPY Crosses (USDJPY, EURJPY, GBPJPY, AUDJPY, CADJPY, NZDJPY, CHFJPY) -> 3 decimals (pipettes)
  if (s.includes('JPY')) {
    return 3;
  }

  // 2. Global Stock Indices (US500, NAS100, US30, GER40, UK100, JP225, US2000, SPX, etc.) -> 2 decimals
  if (
    s.includes('US500') ||
    s.includes('SPX') ||
    s.includes('NAS100') ||
    s.includes('NDX') ||
    s.includes('US30') ||
    s.includes('DJI') ||
    s.includes('GER40') ||
    s.includes('DAX') ||
    s.includes('UK100') ||
    s.includes('JP225') ||
    s.includes('US2000') ||
    s.startsWith('^')
  ) {
    return 2;
  }

  // 3. Commodities & Energy
  if (s.includes('XAU') || s.includes('GOLD')) return 2;
  if (s.includes('XAG') || s.includes('SILVER')) return 3;
  if (s.includes('OIL') || s.includes('BRENT') || s.includes('WTI')) return 2;
  if (s.includes('NATGAS') || s.includes('GAS') || s.includes('COPPER')) return 3;

  // 4. Large-Cap Cryptocurrencies
  if (s.includes('BTC') || s.includes('ETH') || s.includes('SOL') || s.includes('BNB') || s.includes('AVAX')) {
    return 2;
  }
  if (s.includes('DOGE') || s.includes('SHIB') || s.includes('PEPE')) {
    return 5;
  }
  if (s.includes('XRP') || s.includes('ADA') || s.includes('LINK') || s.includes('DOT') || s.includes('MATIC')) {
    return 4;
  }

  // 5. Equities / Stocks (e.g. AAPL, NVDA, TSLA, MSFT, AMZN, GOOGL, META)
  if (
    ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMZN', 'GOOGL', 'META', 'AMD', 'NFLX', 'INTC', 'BABA', 'PLTR'].includes(s) ||
    (samplePrice !== undefined && samplePrice >= 10 && !s.includes('EUR') && !s.includes('GBP') && !s.includes('AUD') && !s.includes('NZD') && !s.includes('CAD') && !s.includes('CHF') && !s.includes('USD'))
  ) {
    return 2;
  }

  // 6. Standard Forex Pairs (EURUSD, GBPUSD, AUDUSD, USDCAD, USDCHF, NZDUSD, EURGBP, etc.)
  // Institutional standard is 5 decimal places (fractional pips / pipettes)
  return 5;
}

export function formatPrice(price: number, symbol: string): string {
  if (typeof price !== 'number' || isNaN(price)) return '0.00';
  const digits = getSymbolDigits(symbol, price);
  return price.toFixed(digits);
}

export function getSymbolPriceFormat(symbol: string, samplePrice?: number) {
  const precision = getSymbolDigits(symbol, samplePrice);
  const minMove = Number(Math.pow(10, -precision).toFixed(precision));
  return {
    type: 'price' as const,
    precision,
    minMove,
  };
}

export function calculatePips(diff: number, symbol: string): number {
  const s = symbol.toUpperCase();
  if (s.includes('JPY')) return Number((diff * 100).toFixed(1));
  if (s.includes('BTC') || s.includes('ETH') || s.includes('US500')) return Number(diff.toFixed(1));
  return Number((diff * 10000).toFixed(1));
}
