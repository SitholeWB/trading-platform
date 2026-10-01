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
  getStrategies: () => request<StrategyDefinition[]>('/strategies'),
  getStrategyById: (id: string) => request<StrategyDefinition>(`/strategies/${id}`),
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
};
