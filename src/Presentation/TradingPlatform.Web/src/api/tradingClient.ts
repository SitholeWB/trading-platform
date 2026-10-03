import {
  AccountSummary,
  Candle,
  MarketSnapshot,
  Position,
  RiskProfile,
  SignalAuditLog,
  StrategyDefinition,
  SymbolsCatalogResponse,
  SymbolGroup,
  LiveScanRequest,
  LiveScanReport,
  HistoricalScanRequest,
  HistoricalScanReport,
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
  modifyPosition: (ticket: number, stopLoss?: number, takeProfit?: number) =>
    request<any>(`/positions/${ticket}/modify`, {
      method: 'POST',
      body: JSON.stringify({ stopLoss, takeProfit }),
    }),

  // Chart Drawings Persistence
  getDrawings: async (symbol: string): Promise<any[]> => {
    try {
      return await request<any[]>(`/chart-drawings/${encodeURIComponent(symbol)}`);
    } catch {
      return [];
    }
  },
  saveDrawings: async (symbol: string, drawings: any[]): Promise<void> => {
    try {
      await fetch(`${BASE_URL}/chart-drawings/${encodeURIComponent(symbol)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(drawings),
      });
    } catch (e) {
      console.warn('Failed to save drawings to backend:', e);
    }
  },
  clearDrawings: async (symbol: string): Promise<void> => {
    try {
      await fetch(`${BASE_URL}/chart-drawings/${encodeURIComponent(symbol)}`, { method: 'DELETE' });
    } catch {}
  },

  // Chart Alerts Persistence
  getAlerts: async (): Promise<any[]> => {
    try {
      return await request<any[]>('/chart-alerts');
    } catch {
      return [];
    }
  },
  saveAlerts: async (alerts: any[]): Promise<void> => {
    try {
      await fetch(`${BASE_URL}/chart-alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alerts),
      });
    } catch (e) {
      console.warn('Failed to save alerts to backend:', e);
    }
  },

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

  getSymbols: (provider?: string, category?: string, search?: string) => {
    const params = new URLSearchParams();
    if (provider && provider !== 'all') params.append('provider', provider);
    if (category && category !== 'all') params.append('category', category);
    if (search) params.append('search', search);
    const qs = params.toString();
    return request<SymbolsCatalogResponse>(`/market-data/symbols${qs ? `?${qs}` : ''}`);
  },

  // Broker Settings & Key Configuration
  getBrokerConfig: () =>
    request<any>('/settings/broker-config'),

  updateBrokerConfig: (config: any) =>
    request<any>('/settings/broker-config', {
      method: 'POST',
      body: JSON.stringify(config),
    }),

  // Symbol Groups (Buckets / Baskets)
  getSymbolGroups: () =>
    request<SymbolGroup[]>('/symbol-groups'),
  getSymbolGroupById: (id: string) =>
    request<SymbolGroup>(`/symbol-groups/${id}`),
  createSymbolGroup: (group: Partial<SymbolGroup>) =>
    request<SymbolGroup>('/symbol-groups', {
      method: 'POST',
      body: JSON.stringify(group),
    }),
  updateSymbolGroup: (id: string, group: Partial<SymbolGroup>) =>
    request<SymbolGroup>(`/symbol-groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(group),
    }),
  deleteSymbolGroup: (id: string) =>
    fetch(`${BASE_URL}/symbol-groups/${id}`, { method: 'DELETE' }),

  // Market Scanner Robot
  runLiveScan: (req: LiveScanRequest) =>
    request<LiveScanReport>('/scanner/live', {
      method: 'POST',
      body: JSON.stringify(req),
    }),
  getLatestLiveScan: async (): Promise<LiveScanReport | null> => {
    try {
      const res = await fetch(`${BASE_URL}/scanner/live/latest`);
      if (res.status === 204 || !res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },
  runHistoricalScan: (req: HistoricalScanRequest) =>
    request<HistoricalScanReport>('/scanner/historical', {
      method: 'POST',
      body: JSON.stringify(req),
    }),
  getLatestHistoricalScan: async (): Promise<HistoricalScanReport | null> => {
    try {
      const res = await fetch(`${BASE_URL}/scanner/historical/latest`);
      if (res.status === 204 || !res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },
};

