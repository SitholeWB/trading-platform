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

export interface MarketDataProviderInfo {
  id: string;
  name: string;
  description: string;
  requiresKey: boolean;
  isConfigured: boolean;
  supportedTimeframes: Timeframe[];
}

export interface BrokerConfig {
  activeProvider: string;
  oandaAccountId: string;
  hasOandaToken: boolean;
  maskedOandaToken: string;
  oandaEnvironment: string;
  twelveDataApiKey: string;
  updatedAtUtc: string;
}

export type MarketCategory = 'all' | 'forex' | 'crypto' | 'indices' | 'commodities' | 'stocks';

export interface SymbolCatalogItem {
  symbol: string;
  name: string;
  aliases: string[];
  category: 'forex' | 'crypto' | 'indices' | 'commodities' | 'stocks';
  exchange: string;
  price: string;
  change: string;
  isPositive: boolean;
  spreadPips: string;
  tradingHours: string;
  supportedProviders: string[];
  providerSymbols: Record<string, string>;
  description: string;
}

export interface SymbolsCatalogResponse {
  activeProvider: string;
  total: number;
  symbols: SymbolCatalogItem[];
}

export interface SymbolGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  symbols: string[];
  assignedStrategyId?: string | null;
  createdAtUtc?: string;
  updatedAtUtc?: string;
}

export interface ScannerMatchResult {
  symbol: string;
  strategyName: string;
  strategyId: string;
  timeframe: string;
  state: 'FullyMet' | 'NearMiss';
  matchPercentage: number;
  recommendedSide: OrderType;
  entryPrice: number;
  stopLoss: number | null;
  takeProfit: number | null;
  candleTimestamp: string;
  passedConditions: string[];
  failedConditions: string[];
  detailsJson?: string | null;
}

export interface LiveScanRequest {
  symbolGroupId?: string | null;
  symbols?: string[] | null;
  strategyId?: string | null;
  timeframe?: string;
}

export interface LiveScanReport {
  symbolGroupId: string;
  symbolGroupName: string;
  timeframe: string;
  scannedAtUtc: string;
  totalSymbolsScanned: number;
  verifiedMatches: ScannerMatchResult[];
  nearMisses: ScannerMatchResult[];
  durationMs: number;
}

export interface HistoricalScanRequest {
  strategyId: string;
  symbolGroupId?: string | null;
  symbols?: string[] | null;
  timeframe?: string;
  barCount?: number;
}

export interface HistoricalTradeSimulation {
  symbol: string;
  side: OrderType;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  entryTime: string;
  exitTime?: string | null;
  exitPrice?: number | null;
  outcome: 'Win' | 'Loss' | 'Open';
  profitLossPips: number;
  profitLossAmount: number;
}

export interface HistoricalScanReport {
  strategyId: string;
  strategyName: string;
  symbolGroupName: string;
  timeframe: string;
  barsAnalyzed: number;
  periodStartUtc: string;
  periodEndUtc: string;
  totalSignalsFound: number;
  verifiedMatchesCount: number;
  nearMissesCount: number;
  simulatedTradesCount: number;
  winningTradesCount: number;
  losingTradesCount: number;
  winRatePercent: number;
  totalProfitLossPips: number;
  profitFactor: number;
  maxDrawdownPips: number;
  simulatedTrades: HistoricalTradeSimulation[];
  historicalMatches: ScannerMatchResult[];
  durationMs: number;
}export interface StrategyAlertNotification {
  id: string;
  strategyId: string;
  strategyName: string;
  symbol: string;
  timeframe: Timeframe;
  lastPrice: number;
  state: SignalState;
  matchScore: number;
  summaryMessage: string;
  createdAtUtc: string;
  isAcknowledged: boolean;
  acknowledgedAtUtc?: string | null;
  reminderCount: number;
  lastRemindedAtUtc?: string | null;
}

export interface BackgroundScannerStatus {
  isEnabled: boolean;
  isRunning: boolean;
  lastScanUtc?: string | null;
  totalScansCompleted: number;
  activeAlertCount: number;
  unacknowledgedAlertCount: number;
  nextScheduledScanUtc: Record<string, string>;
  lastError?: string | null;
}

export interface BackgroundScannerSettings {
  isEnabled: boolean;
  soundAlertsEnabled: boolean;
  desktopNotificationEnabled: boolean;
  reminderIntervalMinutes: number;
  maxRemindersPerAlert: number;
}

// AI Engine & Copilot Types
export interface GeneratedStrategyResult {
  name: string;
  description: string;
  timeframe: Timeframe;
  rawJsonRules: string;
  autoTradingEnabled: boolean;
  aiValidationEnabled: boolean;
  plainEnglishSummary: string;
  triggerConditions: string[];
  recommendedIndicators: string[];
}

export interface MarketAnalysisResult {
  symbol: string;
  timeframe: string;
  trendBias: string;
  confidenceScore: number;
  summaryOverview: string;
  technicalHighlights: string[];
  supportLevel: string;
  resistanceLevel: string;
  actionableSuggestion: string;
  analyzedAtUtc: string;
}

export interface AuditExplanationResult {
  fingerprint: string;
  strategyId: string;
  symbol: string;
  state: string;
  plainEnglishVerdict: string;
  rulesPassed: string[];
  rulesFailedOrNearMiss: string[];
  optimizationTip: string;
}

export interface AICopilotContext {
  currentSymbol?: string;
  currentTimeframe?: string;
  openPositionsCount?: number;
  activeStrategiesCount?: number;
  currentDrawdown?: number;
  isKillSwitchEngaged?: boolean;
}

export interface CopilotChatResult {
  responseMarkdown: string;
  suggestedFollowups: string[];
  contextSymbol?: string;
}

export interface AIProviderConfig {
  provider: 'BuiltIn' | 'OpenAI' | 'Claude' | 'Gemini' | 'Ollama' | string;
  model?: string | null;
  apiKey?: string | null;
  endpoint?: string | null;
  hasApiKey?: boolean;
  maskedApiKey?: string | null;
}

