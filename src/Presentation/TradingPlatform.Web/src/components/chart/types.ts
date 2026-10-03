import { Timeframe } from '../../types/trading';

export type ChartType = 'candlestick' | 'heikin_ashi' | 'bar' | 'line' | 'area' | 'baseline';

export type DrawingTool =
  | 'cursor'
  | 'trendline'
  | 'horizontal_line'
  | 'horizontal_ray'
  | 'fibonacci'
  | 'long_position'
  | 'short_position'
  | 'rectangle'
  | 'ruler';

export interface Point {
  time: number;  // timestamp in seconds (anchored to candlestick bar)
  price: number; // price value on series scale
  x?: number;    // screen pixel x (computed dynamically)
  y?: number;    // screen pixel y (computed dynamically)
}

export interface DrawingItem {
  id: string;
  tool: DrawingTool;
  points: Point[];
  color?: string;
  lineWidth?: number;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  isComplete: boolean;
  extraData?: {
    entryPrice?: number;
    stopLossPrice?: number;
    takeProfitPrice?: number;
    riskRewardRatio?: number;
    text?: string;
  };
}

export interface ActiveIndicators {
  ema9: boolean;
  ema20: boolean;
  ema50: boolean;
  ema100: boolean;
  ema200: boolean;
  sma20: boolean;
  sma50: boolean;
  sma200: boolean;
  bollinger: boolean;
  vwap: boolean;
  supertrend: boolean;
  ichimoku: boolean;
  // Sub-pane oscillators
  volume: boolean;
  rsi: boolean;
  macd: boolean;
  stoch: boolean;
  atr: boolean;
}

export interface IndicatorSettings {
  emaPeriods: number[];
  bollingerPeriod: number;
  bollingerStdDev: number;
  rsiPeriod: number;
  rsiOverbought: number;
  rsiOversold: number;
  macdFast: number;
  macdSlow: number;
  macdSignal: number;
  stochK: number;
  stochD: number;
  atrPeriod: number;
  supertrendPeriod: number;
  supertrendMultiplier: number;
}
