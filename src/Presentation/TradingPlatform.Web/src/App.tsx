import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { TradingChart } from './components/TradingChart';
import { RuleStudio } from './components/RuleStudio';
import { NearMissRadar } from './components/NearMissRadar';
import { PositionsManager } from './components/PositionsManager';
import { RiskConsole } from './components/RiskConsole';
import { SimulatorConsole } from './components/SimulatorConsole';
import { KillSwitchModal } from './components/KillSwitchModal';
import { tradingApi } from './api/tradingClient';
import {
  AccountSummary,
  Candle,
  IndicatorConfig,
  Position,
  RiskProfile,
  SignalAuditLog,
  StrategyDefinition,
  Timeframe,
} from './types/trading';

export function App() {
  const [selectedSymbol, setSelectedSymbol] = useState('EURUSD');
  const [timeframe, setTimeframe] = useState<Timeframe>('M5');
  const [activeBottomTab, setActiveBottomTab] = useState<'rules' | 'nearmiss' | 'positions' | 'sim'>('rules');

  const [indicatorConfig, setIndicatorConfig] = useState<IndicatorConfig>({
    emas: [20, 50, 200],
    smas: [20, 50, 200],
    rsi: { period: 14, overbought: 70, oversold: 30 },
    macd: { fast: 12, slow: 26, signal: 9 },
    bollinger: { period: 20, stdDev: 2.0 },
    stoch: { kPeriod: 14, dPeriod: 3, smooth: 3 },
    atr: { period: 14, slMultiplier: 1.5, tpMultiplier: 3.0 },
    adx: { period: 14, threshold: 25 },
    ichimoku: { tenkan: 9, kijun: 26, senkou: 52 },
  });

  const [strategies, setStrategies] = useState<StrategyDefinition[]>([]);
  const [auditLogs, setAuditLogs] = useState<SignalAuditLog[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [risk, setRisk] = useState<RiskProfile | null>(null);
  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [isKillSwitchOpen, setIsKillSwitchOpen] = useState(false);

  // Initial synthetic candlestick data for charting
  const [candles, setCandles] = useState<Candle[]>(() => {
    const list: Candle[] = [];
    let p = 1.0820;
    const now = Date.now();
    for (let i = 50; i >= 0; i--) {
      const open = p;
      const delta = (Math.random() - 0.48) * 0.0012;
      const close = open + delta;
      const high = Math.max(open, close) + Math.random() * 0.0006;
      const low = Math.min(open, close) - Math.random() * 0.0006;
      list.push({
        symbol: 'EURUSD',
        timeframe: 'M5',
        timestamp: new Date(now - i * 5 * 60000).toISOString(),
        open: Number(open.toFixed(5)),
        high: Number(high.toFixed(5)),
        low: Number(low.toFixed(5)),
        close: Number(close.toFixed(5)),
        volume: Math.floor(Math.random() * 1500 + 300),
        isComplete: true,
      });
      p = close;
    }
    return list;
  });

  const currentPrice = candles[candles.length - 1]?.close ?? 1.0852;

  // Poll backend API every 2.5s for real-time telemetry
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [strats, logs, pos, rk, acc] = await Promise.allSettled([
          tradingApi.getStrategies(),
          tradingApi.getAuditLogs(30),
          tradingApi.getPositions(),
          tradingApi.getRiskProfile(),
          tradingApi.getAccountSummary(),
        ]);

        if (strats.status === 'fulfilled') setStrategies(strats.value);
        if (logs.status === 'fulfilled') setAuditLogs(logs.value);
        if (pos.status === 'fulfilled') setPositions(pos.value);
        if (rk.status === 'fulfilled') setRisk(rk.value);
        if (acc.status === 'fulfilled') setAccount(acc.value);
      } catch (err) {
        console.warn('Backend polling warning:', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleSaveStrategy = async (strategyDto: any) => {
    await tradingApi.createStrategy(strategyDto);
    const updated = await tradingApi.getStrategies();
    setStrategies(updated);
  };

  const handleDeleteStrategy = async (id: string) => {
    await tradingApi.deleteStrategy(id);
    const updated = await tradingApi.getStrategies();
    setStrategies(updated);
  };

  const handleClosePosition = async (ticket: number) => {
    await tradingApi.closePosition(ticket, 'ManualTerminalClose');
    const updated = await tradingApi.getPositions();
    setPositions(updated);
  };

  const handleToggleKillSwitch = async (engage: boolean, reason?: string) => {
    const updated = await tradingApi.toggleKillSwitch(engage, reason);
    setRisk(updated);
  };

  const handleSimulateCandle = async (candleData: any) => {
    const res = await tradingApi.simulateCandle(candleData);
    if (res.candleIngested) {
      setCandles((prev) => [...prev.slice(1), res.candleIngested]);
    }
    // Refresh audits and positions
    const [logs, pos] = await Promise.all([
      tradingApi.getAuditLogs(30),
      tradingApi.getPositions(),
    ]);
    setAuditLogs(logs);
    setPositions(pos);
    return res;
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090d16] text-slate-100 overflow-hidden font-sans">
      {/* Top Header & Telemetry */}
      <Header
        account={account}
        risk={risk}
        onOpenKillSwitch={() => setIsKillSwitchOpen(true)}
        selectedSymbol={selectedSymbol}
        currentPrice={currentPrice}
      />

      {/* Main Terminal Workspace */}
      <div className="flex-1 flex overflow-hidden p-3 gap-3">
        {/* Left Watchlist Sidebar */}
        <aside className="w-56 bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col font-mono text-xs hidden md:flex">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Forex Watchlist
          </div>
          <div className="space-y-1.5 flex-1 overflow-y-auto">
            {[
              { s: 'EURUSD', p: currentPrice.toFixed(5), chg: '+0.18%', up: true },
              { s: 'GBPUSD', p: '1.26420', chg: '-0.12%', up: false },
              { s: 'USDJPY', p: '154.210', chg: '+0.45%', up: true },
              { s: 'AUDUSD', p: '0.65340', chg: '+0.04%', up: true },
              { s: 'USDCAD', p: '1.38120', chg: '-0.22%', up: false },
            ].map((pair) => (
              <button
                key={pair.s}
                onClick={() => setSelectedSymbol(pair.s)}
                className={`w-full p-2 rounded-lg flex items-center justify-between text-left transition-colors border ${
                  selectedSymbol === pair.s
                    ? 'bg-blue-600/20 border-blue-500/40 text-blue-300 font-bold'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/60 text-slate-300'
                }`}
              >
                <div>
                  <div className="font-bold">{pair.s}</div>
                  <div className="text-[10px] text-slate-500">{pair.p}</div>
                </div>
                <div
                  className={`text-[11px] font-bold ${
                    pair.up ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {pair.chg}
                </div>
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 text-center">
            NetMQ MT5 & Oanda Stream
          </div>
        </aside>

        {/* Center / Right Multi-Pane Layout */}
        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
          {/* Top Row: Interactive Chart & Risk Radar */}
          <div className="h-[46%] grid grid-cols-1 lg:grid-cols-4 gap-3">
            <div className="lg:col-span-3 h-full">
              <TradingChart
                candles={candles}
                symbol={selectedSymbol}
                timeframe={timeframe}
                onTimeframeChange={setTimeframe}
                indicatorConfig={indicatorConfig}
              />
            </div>
            <div className="h-full">
              <RiskConsole
                account={account}
                risk={risk}
                positions={positions}
                onOpenKillSwitch={() => setIsKillSwitchOpen(true)}
              />
            </div>
          </div>

          {/* Bottom Row: Tabbed Command Center */}
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
            {/* Tab Navigation */}
            <div className="h-10 px-4 bg-slate-950 border-b border-slate-800 flex items-center gap-2">
              <button
                onClick={() => setActiveBottomTab('rules')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeBottomTab === 'rules'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ⚡ Dynamic Strategy Studio
              </button>
              <button
                onClick={() => setActiveBottomTab('nearmiss')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeBottomTab === 'nearmiss'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🎯 Near-Miss & Audit Radar ({auditLogs.length})
              </button>
              <button
                onClick={() => setActiveBottomTab('positions')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeBottomTab === 'positions'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                💼 Active Positions ({positions.filter((p) => p.status === 'Open').length})
              </button>
              <button
                onClick={() => setActiveBottomTab('sim')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeBottomTab === 'sim'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🔬 Ingestion Sandbox
              </button>
            </div>

            {/* Tab Pane Body */}
            <div className="flex-1 overflow-hidden p-2">
              {activeBottomTab === 'rules' && (
                <RuleStudio
                  strategies={strategies}
                  onSaveStrategy={handleSaveStrategy}
                  onDeleteStrategy={handleDeleteStrategy}
                  onIndicatorConfigChange={setIndicatorConfig}
                />
              )}
              {activeBottomTab === 'nearmiss' && <NearMissRadar logs={auditLogs} />}
              {activeBottomTab === 'positions' && (
                <PositionsManager positions={positions} onClosePosition={handleClosePosition} />
              )}
              {activeBottomTab === 'sim' && (
                <SimulatorConsole onSimulateCandle={handleSimulateCandle} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Kill Switch Modal */}
      <KillSwitchModal
        isOpen={isKillSwitchOpen}
        onClose={() => setIsKillSwitchOpen(false)}
        risk={risk}
        onToggleKillSwitch={handleToggleKillSwitch}
      />
    </div>
  );
}

export default App;
