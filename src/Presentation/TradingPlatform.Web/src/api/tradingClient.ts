import {
  AccountSummary,
  Candle,
  MarketSnapshot,
  Position,
  RiskProfile,
  SignalAuditLog,
  StrategyDefinition,
} from '../types/trading';

const BASE_URL = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return (await res.json()) as T;
  } catch (err) {
    // If backend is disconnected or offline, log warning and rethrow or fallback
    console.warn(`[API CLIENT] Error calling ${endpoint}:`, err);
    throw err;
  }
}

export const tradingApi = {
  // Strategies
  getStrategies: async (): Promise<StrategyDefinition[]> => {
    const list = await request<StrategyDefinition[]>('/strategies');
    return list.map((s) => {
      if (!s.indicators && s.rawJsonRules) {
        try {
          const parsed = JSON.parse(s.rawJsonRules);
          if (parsed && parsed.indicators) {
            return { ...s, indicators: parsed.indicators };
          }
        } catch { }
      }
      return s;
    });
  },
  getStrategyById: async (id: string): Promise<StrategyDefinition> => {
    const s = await request<StrategyDefinition>(`/strategies/${id}`);
    if (!s.indicators && s.rawJsonRules) {
      try {
        const parsed = JSON.parse(s.rawJsonRules);
        if (parsed && parsed.indicators) {
          return { ...s, indicators: parsed.indicators };
        }
      } catch { }
    }
    return s;
  },
  createStrategy: (strategy: {
    name: string;
    description: string;
    timeframe: string;
    rawJsonRules: string;
    autoTradingEnabled: boolean;
    aiValidationEnabled: boolean;
  }) =>
    request<StrategyDefinition>('/strategies', {
      method: 'POST',
      body: JSON.stringify(strategy),
    }),
  updateStrategy: (
    id: string,
    strategy: {
      name: string;
      description: string;
      timeframe: string;
      rawJsonRules: string;
      isActive: boolean;
      autoTradingEnabled: boolean;
      aiValidationEnabled: boolean;
    }
  ) =>
    request<StrategyDefinition>(`/strategies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(strategy),
    }),
  deleteStrategy: (id: string) =>
    fetch(`${BASE_URL}/strategies/${id}`, { method: 'DELETE' }),

  // Audits & Near-Misses
  getAuditLogs: (count = 50) =>
    request<SignalAuditLog[]>(`/audit-logs?count=${count}`),
  getAuditByFingerprint: (fingerprint: string) =>
    request<SignalAuditLog>(`/audit-logs/${fingerprint}`),

  // Positions
  getPositions: () => request<Position[]>('/positions'),
  closePosition: (ticket: number, reason?: string) =>
    request<any>(`/positions/${ticket}/close?reason=${encodeURIComponent(reason || 'ManualClose')}`, {
      method: 'POST',
    }),
  placeOrder: (order: {
    symbol: string;
    orderType: string;
    lots: number;
    price: number;
    stopLoss?: number;
    takeProfit?: number;
  }) =>
    request<any>('/positions/order', {
      method: 'POST',
      body: JSON.stringify(order),
    }),

  // Risk & Kill Switch
  getRiskProfile: () => request<RiskProfile>('/risk'),
  toggleKillSwitch: (engage: boolean, reason?: string) =>
    request<RiskProfile>('/risk/kill-switch', {
      method: 'POST',
      body: JSON.stringify({ engage, reason }),
    }),

  // Account
  getAccountSummary: () => request<AccountSummary>('/account'),

  // Simulation
  simulateCandle: (candle: {
    symbol: string;
    timeframe: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    isComplete: boolean;
  }) =>
    request<{
      candleIngested: Candle;
      generatedSnapshot: MarketSnapshot | null;
      evaluationTriggered: boolean;
    }>('/simulation/candle', {
      method: 'POST',
      body: JSON.stringify(candle),
    }),

  // Market Data & Public Multi-Timeframe Feeds
  getCandles: (symbol: string, timeframe: string, count = 120, before?: number) =>
    request<Candle[]>(
      `/market-data/candles?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(timeframe)}&count=${count}${
        before ? `&before=${before}` : ''
      }`
    ),

  getProviders: () =>
    request<{ activeProvider: string; providers: any[] }>('/market-data/providers'),

  // Broker Settings & Key Configuration
  getBrokerConfig: () =>
    request<any>('/settings/broker-config'),

  updateBrokerConfig: (config: any) =>
    request<any>('/settings/broker-config', {
      method: 'POST',
      body: JSON.stringify(config),
    }),
};

