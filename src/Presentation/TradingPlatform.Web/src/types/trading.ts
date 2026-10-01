export type Timeframe = 'M1' | 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1' | 'W1' | 'MN1';
export type OrderType = 'Buy' | 'Sell';
export type OrderStatus = 'Pending' | 'Open' | 'Closed' | 'Cancelled' | 'Rejected';
export type SignalState = 'NearMiss' | 'FullyMet' | 'RejectedByRisk' | 'Dispatched';
export type ExitReason = 'None' | 'OpposingPattern' | 'ManualClose' | 'HardSL' | 'HardTP' | 'KillSwitch' | 'TrailingStop';

export interface IndicatorConfig {
  emas: number[];
  smas: number[];
  rsi: {
    period: number;
    overbought: number;
    oversold: number;
  };
  macd: {
    fast: number;
    slow: number;
    signal: number;
  };
  bollinger: {
    period: number;
    stdDev: number;
  };
  stoch: {
    kPeriod: number;
    dPeriod: number;
    smooth: number;
  };
  atr: {
    period: number;
    slMultiplier: number;
    tpMultiplier: number;
  };
  adx: {
    period: number;
    threshold: number;
  };
  ichimoku: {
    tenkan: number;
    kijun: number;
    senkou: number;
  };
}

export interface Candle {
  symbol: string;
  timeframe: Timeframe;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isComplete: boolean;
}

export interface MarketSnapshot {
  symbol: string;
  timeframe: Timeframe;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema20: number | null;
  ema50: number | null;
  ema200: number | null;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  rsi14: number | null;
  atr14: number | null;
  macdLine: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  bollingerUpper: number | null;
  bollingerMiddle: number | null;
  bollingerLower: number | null;
  stochK: number | null;
  stochD: number | null;
  adx: number | null;
  ichimokuTenkan: number | null;
  ichimokuKijun: number | null;
  ichimokuSpanA: number | null;
  ichimokuSpanB: number | null;
  ichimokuChikou: number | null;
  upperWickRatio: number;
  lowerWickRatio: number;
  bodyRatio: number;
}

export interface StrategyDefinition {
  id: string;
  name: string;
  description: string;
  timeframe: Timeframe;
  isActive: boolean;
  autoTradingEnabled: boolean;
  aiValidationEnabled: boolean;
  rawJsonRules: string;
  indicators?: IndicatorConfig;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface SignalAuditLog {
  id: string;
  signalFingerprint: string;
  strategyId: string;
  symbol: string;
  timeframe: Timeframe;
  candleTimestampUtc: string;
  state: SignalState;
  evaluationDetailsJson: string;
  createdAtUtc: string;
}

export interface Position {
  id: string;
  brokerTicketId: number;
  symbol: string;
  orderType: OrderType;
  lots: number;
  entryPrice: number;
  currentPrice: number;
  stopLossPrice: number | null;
  takeProfitPrice: number | null;
  unrealizedPnl: number;
  status: OrderStatus;
  openedAtUtc: string;
  updatedAtUtc: string;
}

export interface RiskProfile {
  id: string;
  maxDailyDrawdownPercent: number;
  maxOpenPositionsTotal: number;
  maxCurrencyExposure: number;
  maxSpreadPipsPerSymbolJson: string;
  isKillSwitchEngaged: boolean;
  updatedAtUtc: string;
}

export interface AccountSummary {
  accountId: string;
  currency: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  dailyStartingEquity: number;
  currentDrawdownPercent: number;
  updatedAtUtc: string;
}

export interface RuleFailureDetail {
  ruleName: string;
  expression: string;
  failureReason: string;
  nearMissScore?: number;
}

export interface ReactQueryBuilderRule {
  field?: string;
  operator?: string;
  value?: any;
  valueSource?: 'value' | 'field';
}

export interface ReactQueryBuilderGroup {
  combinator: 'and' | 'or';
  rules: (ReactQueryBuilderRule | ReactQueryBuilderGroup)[];
}
