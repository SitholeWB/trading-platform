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
 * Returns the duration in seconds for standard intraday/daily timeframes
 */
export function getTimeframePeriodSeconds(timeframe?: string): number {
  switch ((timeframe || 'M5').toUpperCase()) {
    case 'M1':
      return 60;
    case 'M5':
      return 300;
    case 'M15':
      return 900;
    case 'M30':
      return 1800;
    case 'H1':
      return 3600;
    case 'H4':
      return 14400;
    case 'D1':
      return 86400;
    case 'W1':
      return 604800;
    case 'MN1':
      return 2592000;
    default:
      return 300;
  }
}

/**
 * Quantizes any UTC seconds timestamp down to the exact opening boundary of the given timeframe bar.
 * Ensures 1-minute live poll updates fold into the active forming bar rather than appending 1m bars on H4/H1/etc.
 */
export function alignTimeSecondsToTimeframe(timeSec: number, timeframe?: string): number {
  if (!Number.isFinite(timeSec) || timeSec <= 0) return timeSec;
  const tf = (timeframe || '').toUpperCase();
  if (!tf) return timeSec;

  if (tf === 'MN1') {
    const d = new Date(timeSec * 1000);
    return Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0) / 1000);
  }
  if (tf === 'W1') {
    const d = new Date(timeSec * 1000);
    const day = d.getUTCDay(); // 0 = Sun, 1 = Mon, ...
    const diffToMonday = (day + 6) % 7;
    return Math.floor(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diffToMonday, 0, 0, 0) / 1000
    );
  }

  const periodSec = getTimeframePeriodSeconds(tf);
  return Math.floor(timeSec / periodSec) * periodSec;
}

/**
 * Sorts, aligns to timeframe bar boundaries, and deduplicates candles chronologically.
 * If multiple candles fall into the same timeframe bucket (e.g., intra-bar 1m refresh on a 4h chart),
 * they are folded into a single bar at the bucket opening timestamp.
 */
export function sanitizeCandles(candles: Candle[], timeframeOverride?: string): Candle[] {
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

    const rawSec = getCandleTimeSeconds(c.timestamp);
    const effectiveTf = timeframeOverride || c.timeframe;
    const alignedSec = alignTimeSecondsToTimeframe(rawSec, effectiveTf);
    const alignedIso = new Date(alignedSec * 1000).toISOString();

    const existing = map.get(alignedSec);
    if (!existing) {
      map.set(alignedSec, {
        ...c,
        timeframe: (effectiveTf as any) || c.timeframe,
        timestamp: alignedIso,
        open,
        high: safeHigh,
        low: safeLow,
        close,
        volume: Number(c.volume) || 100,
      });
    } else {
      const mergedOpen = existing.open;
      const mergedClose = close;
      const mergedHigh = Math.max(existing.high, safeHigh, mergedOpen, mergedClose);
      const mergedLow = Math.min(existing.low, safeLow, mergedOpen, mergedClose);
      map.set(alignedSec, {
        ...c,
        timeframe: (effectiveTf as any) || c.timeframe,
        timestamp: alignedIso,
        open: mergedOpen,
        high: mergedHigh,
        low: mergedLow,
        close: mergedClose,
        volume: Math.max(existing.volume, Number(c.volume) || 100),
      });
    }
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map((e) => e[1]);
}

/**
 * Counts the actual meaningful decimal places present in a numeric price from the data feed
 * (ignoring IEEE-754 floating point tail noise).
 */
export function countObservedDecimals(value?: number): number {
  if (value === undefined || value === null || !Number.isFinite(value) || value === 0) return 0;
  const cleanStr = Number(Math.abs(value).toPrecision(12)).toString();
  if (cleanStr.includes('e-')) {
    const [mantissa, expStr] = cleanStr.split('e-');
    const exp = parseInt(expStr, 10) || 0;
    const fracLen = (mantissa.split('.')[1] || '').length;
    return Math.min(10, exp + fracLen);
  }
  const dotIdx = cleanStr.indexOf('.');
  return dotIdx === -1 ? 0 : Math.min(10, cleanStr.length - dotIdx - 1);
}

/**
 * Dynamically determines the decimal precision for any symbol and price level.
 * Never hard-caps at 4 or 5 decimals: if a symbol or feed has 6, 8, or 10 decimals,
 * or trades at sub-cent / micro-cap levels, full precision is preserved.
 */
export function getSymbolDigits(symbol: string, samplePrice?: number): number {
  const s = (symbol || '').toUpperCase();
  const observed = countObservedDecimals(samplePrice);

  // 1. Sub-dollar / micro-price dynamic scaling (supports 6, 8, 10+ decimals automatically)
  if (samplePrice !== undefined && Number.isFinite(samplePrice) && samplePrice > 0 && samplePrice < 1) {
    const leadingZeros = Math.max(0, Math.ceil(-Math.log10(samplePrice)));
    // Keep at least 4–5 significant digits after leading zeros (e.g. 0.00001842 -> 8-9 decimals)
    const magnitudeDigits = Math.min(10, Math.max(5, leadingZeros + 4));
    return Math.max(observed, magnitudeDigits);
  }

  // 2. Baseline minimum precision by asset class / price magnitude
  let minBaseline = 5;
  if (s.includes('JPY')) {
    minBaseline = 3;
  } else if (
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
    s.startsWith('^') ||
    s.includes('XAU') ||
    s.includes('GOLD') ||
    s.includes('OIL') ||
    s.includes('BRENT') ||
    s.includes('WTI')
  ) {
    minBaseline = 2;
  } else if (s.includes('XAG') || s.includes('SILVER') || s.includes('NATGAS') || s.includes('GAS') || s.includes('COPPER')) {
    minBaseline = 3;
  } else if (samplePrice !== undefined && samplePrice >= 100) {
    minBaseline = 2;
  } else if (samplePrice !== undefined && samplePrice >= 10 && !s.includes('ZAR') && !s.includes('MXN')) {
    minBaseline = 2;
  }

  return Math.min(10, Math.max(observed, minBaseline));
}

function roundToDynamicPrecision(value: number, symbol?: string, referencePrice?: number): number {
  if (!Number.isFinite(value)) return 0;
  const digits = Math.max(getSymbolDigits(symbol || '', referencePrice ?? value), 5);
  return Number(value.toFixed(Math.min(10, digits)));
}

/**
 * Simple Moving Average (SMA)
 */
export function calculateSMA(candles: Candle[], period: number): IndicatorPoint[] {
  const result: IndicatorPoint[] = [];
  if (candles.length < period || period <= 0) return result;
  const sym = candles[0]?.symbol;
  const refPrice = candles[candles.length - 1]?.close;

  let sum = 0;
  for (let i = 0; i < candles.length; i++) {
    sum += candles[i].close;
    if (i >= period) {
      sum -= candles[i - period].close;
    }
    if (i >= period - 1) {
      result.push({
        time: getCandleTimeSeconds(candles[i].timestamp),
        value: roundToDynamicPrecision(sum / period, sym, refPrice),
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
  const sym = candles[0]?.symbol;
  const refPrice = candles[candles.length - 1]?.close;

  const multiplier = 2 / (period + 1);

  // Initialize with SMA
  let initialSum = 0;
  for (let i = 0; i < period; i++) {
    initialSum += candles[i].close;
  }
  let prevEma = initialSum / period;
  result.push({
    time: getCandleTimeSeconds(candles[period - 1].timestamp),
    value: roundToDynamicPrecision(prevEma, sym, refPrice),
  });

  for (let i = period; i < candles.length; i++) {
    const currentPrice = candles[i].close;
    const currentEma = (currentPrice - prevEma) * multiplier + prevEma;
    result.push({
      time: getCandleTimeSeconds(candles[i].timestamp),
      value: roundToDynamicPrecision(currentEma, sym, refPrice),
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
  const sym = candles[0]?.symbol;
  const refPrice = candles[candles.length - 1]?.close;

  for (let i = period - 1; i < candles.length; i++) {
    const window = candles.slice(i - period + 1, i + 1);
    const mean = window.reduce((sum, c) => sum + c.close, 0) / period;
    const variance =
      window.reduce((sum, c) => sum + Math.pow(c.close - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    const time = getCandleTimeSeconds(candles[i].timestamp);
    middle.push({ time, value: roundToDynamicPrecision(mean, sym, refPrice) });
    upper.push({ time, value: roundToDynamicPrecision(mean + stdDev * stdDevMultiplier, sym, refPrice) });
    lower.push({ time, value: roundToDynamicPrecision(mean - stdDev * stdDevMultiplier, sym, refPrice) });
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

  const sym = candles[0]?.symbol;
  const refPrice = candles[candles.length - 1]?.close;
  let atr = trueRanges.slice(0, period).reduce((acc, x) => acc + x.tr, 0) / period;
  result.push({
    time: trueRanges[period - 1].time,
    value: roundToDynamicPrecision(atr, sym, refPrice),
  });

  for (let i = period; i < trueRanges.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i].tr) / period;
    result.push({
      time: trueRanges[i].time,
      value: roundToDynamicPrecision(atr, sym, refPrice),
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
  const sym = candles[0]?.symbol;
  const refPrice = candles[candles.length - 1]?.close;

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
      value: roundToDynamicPrecision(vwap, sym, refPrice),
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
  const sym = candles[0]?.symbol;
  const refPrice = candles[candles.length - 1]?.close;

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
      value: roundToDynamicPrecision(value, sym, refPrice),
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
  const sym = candles[0]?.symbol;
  const refPrice = candles[candles.length - 1]?.close;

  const getMidPrice = (slice: Candle[]) => {
    const h = Math.max(...slice.map((c) => c.high));
    const l = Math.min(...slice.map((c) => c.low));
    return (h + l) / 2;
  };

  for (let i = 0; i < candles.length; i++) {
    const time = getCandleTimeSeconds(candles[i].timestamp);

    if (i >= tenkanPeriod - 1) {
      const val = getMidPrice(candles.slice(i - tenkanPeriod + 1, i + 1));
      tenkan.push({ time, value: roundToDynamicPrecision(val, sym, refPrice) });
    }

    if (i >= kijunPeriod - 1) {
      const val = getMidPrice(candles.slice(i - kijunPeriod + 1, i + 1));
      kijun.push({ time, value: roundToDynamicPrecision(val, sym, refPrice) });
    }

    if (i >= kijunPeriod - 1 && tenkan.length > 0 && kijun.length > 0) {
      const tVal = tenkan[tenkan.length - 1].value;
      const kVal = kijun[kijun.length - 1].value;
      spanA.push({ time, value: roundToDynamicPrecision((tVal + kVal) / 2, sym, refPrice) });
    }

    if (i >= senkouPeriod - 1) {
      const val = getMidPrice(candles.slice(i - senkouPeriod + 1, i + 1));
      spanB.push({ time, value: roundToDynamicPrecision(val, sym, refPrice) });
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
  const sym = candles[0]?.symbol;
  const refPrice = candles[candles.length - 1]?.close;

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
      open: roundToDynamicPrecision(haOpen, sym, refPrice),
      high: roundToDynamicPrecision(haHigh, sym, refPrice),
      low: roundToDynamicPrecision(haLow, sym, refPrice),
      close: roundToDynamicPrecision(haClose, sym, refPrice),
      volume: c.volume,
      isComplete: c.isComplete,
    });

    prevHaOpen = haOpen;
    prevHaClose = haClose;
  }

  return haCandles;
}

export function formatPrice(price: number, symbol: string): string {
  if (typeof price !== 'number' || isNaN(price)) return '0.00';
  const digits = getSymbolDigits(symbol, price);
  return price.toFixed(digits);
}

export function getSymbolPriceFormat(symbol: string, samplePrice?: number, extraPrices?: number[]) {
  let precision = getSymbolDigits(symbol, samplePrice);
  if (extraPrices && extraPrices.length > 0) {
    for (const p of extraPrices) {
      precision = Math.max(precision, getSymbolDigits(symbol, p));
    }
  }
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
