import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { NavigationSidebar, PageId } from './components/NavigationSidebar';
import { BotOverview } from './components/BotOverview';
import { TradingChart } from './components/TradingChart';
import { RuleStudio } from './components/RuleStudio';
import { NearMissRadar } from './components/NearMissRadar';
import { PositionsManager } from './components/PositionsManager';
import { RiskConsole } from './components/RiskConsole';
import { SimulatorConsole } from './components/SimulatorConsole';
import { KillSwitchModal } from './components/KillSwitchModal';
import { BrokerSettingsModal } from './components/BrokerSettingsModal';
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
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [selectedSymbol, setSelectedSymbol] = useState('EURUSD');
  const [timeframe, setTimeframe] = useState<Timeframe>('M5');

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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeProvider, setActiveProvider] = useState('KeylessPublic');

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
        const [strats, logs, pos, rk, acc, cfg] = await Promise.allSettled([
          tradingApi.getStrategies(),
          tradingApi.getAuditLogs(30),
          tradingApi.getPositions(),
          tradingApi.getRiskProfile(),
          tradingApi.getAccountSummary(),
          tradingApi.getBrokerConfig(),
        ]);

        if (strats.status === 'fulfilled') setStrategies(strats.value);
        if (logs.status === 'fulfilled') setAuditLogs(logs.value);
        if (pos.status === 'fulfilled') setPositions(pos.value);
        if (rk.status === 'fulfilled') setRisk(rk.value);
        if (acc.status === 'fulfilled') setAccount(acc.value);
        if (cfg.status === 'fulfilled' && cfg.value?.activeProvider) {
          setActiveProvider(cfg.value.activeProvider);
        }
      } catch (err) {
        console.warn('Backend polling warning:', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2500);
    return () => clearInterval(interval);
  }, []);

  // Fetch real-time / public multi-timeframe candles from active provider
  const fetchLiveCandles = async () => {
    try {
      const realCandles = await tradingApi.getCandles(selectedSymbol, timeframe, 60);
      if (realCandles && realCandles.length > 0) {
        setCandles(realCandles);
      }
    } catch (err) {
      console.warn('Live candles fetch warning:', err);
    }
  };

  useEffect(() => {
    fetchLiveCandles();
    const interval = setInterval(fetchLiveCandles, 8000);
    return () => clearInterval(interval);
  }, [selectedSymbol, timeframe, activeProvider]);

  const handleSaveStrategy = async (strategyDto: any) => {
    if (strategyDto.id) {
      await tradingApi.updateStrategy(strategyDto.id, strategyDto);
    } else {
      await tradingApi.createStrategy(strategyDto);
    }
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

  const pageTitles: Record<PageId, string> = {
    dashboard: '🤖 Bot Operations & Health',
    strategies: '⚡ Dynamic Strategy Studio',
    radar: '🎯 Near-Miss & Forensic Radar',
    positions: '💼 Positions & Risk Management',
    sandbox: '🔬 Ingestion & Simulation Sandbox',
    chart: '📈 Market Chart & Technical Inspector',
  };

  return (
    <div className="flex h-screen w-screen bg-[#080c15] text-slate-100 overflow-hidden font-sans">
      {/* Robotic Navigation Sidebar - Full Screen Height on Left */}
      <NavigationSidebar
        activePage={activePage}
        onSelectPage={setActivePage}
        activeStrategiesCount={strategies.filter((s) => s.isActive && s.autoTradingEnabled).length}
        openPositionsCount={positions.filter((p) => p.status === 'Open').length}
        auditLogsCount={auditLogs.length}
        isKillSwitchEngaged={risk?.isKillSwitchEngaged ?? false}
        activeProvider={activeProvider}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Terminal Workspace: Top Header + Dedicated Page Viewport */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <Header
          pageTitle={pageTitles[activePage]}
          account={account}
          risk={risk}
          onOpenKillSwitch={() => setIsKillSwitchOpen(true)}
          selectedSymbol={selectedSymbol}
          currentPrice={currentPrice}
        />

        {/* Dedicated Page Viewport */}
        <main className="flex-1 h-full overflow-hidden bg-[#090e1a] flex flex-col min-w-0">
          {/* Page 1: Bot Operations & Mission Control */}
          {activePage === 'dashboard' && (
            <BotOverview
              account={account}
              risk={risk}
              strategies={strategies}
              positions={positions}
              auditLogs={auditLogs}
              onOpenKillSwitch={() => setIsKillSwitchOpen(true)}
              onNavigateTo={setActivePage}
              selectedSymbol={selectedSymbol}
              currentPrice={currentPrice}
            />
          )}

          {/* Page 2: Strategy Studio & Brain */}
          {activePage === 'strategies' && (
            <div className="flex-1 h-full p-3 overflow-hidden">
              <RuleStudio
                strategies={strategies}
                onSaveStrategy={handleSaveStrategy}
                onDeleteStrategy={handleDeleteStrategy}
                onIndicatorConfigChange={setIndicatorConfig}
              />
            </div>
          )}

          {/* Page 3: Near-Miss & Audit Radar */}
          {activePage === 'radar' && (
            <div className="flex-1 h-full p-3 overflow-hidden">
              <NearMissRadar logs={auditLogs} />
            </div>
          )}

          {/* Page 4: Positions & Risk Engine */}
          {activePage === 'positions' && (
            <div className="flex-1 h-full p-4 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 h-full">
                <div className="xl:col-span-2 min-h-[500px] h-full">
                  <PositionsManager
                    positions={positions}
                    onClosePosition={handleClosePosition}
                  />
                </div>
                <div className="min-h-[500px]">
                  <RiskConsole
                    account={account}
                    risk={risk}
                    positions={positions}
                    onOpenKillSwitch={() => setIsKillSwitchOpen(true)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Page 5: Ingestion & Simulation Sandbox */}
          {activePage === 'sandbox' && (
            <div className="flex-1 h-full p-4 overflow-y-auto">
              <div className="max-w-4xl mx-auto py-2">
                <SimulatorConsole onSimulateCandle={handleSimulateCandle} />
              </div>
            </div>
          )}

          {/* Page 6: Dedicated Chart & Technical Inspector */}
          {activePage === 'chart' && (
            <div className="flex-1 h-full p-3 flex gap-3 overflow-hidden">
              {/* Forex Pair Watchlist Sidebar */}
              <aside className="w-56 bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col font-mono text-xs hidden md:flex flex-shrink-0">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Market Watchlist
                </div>
                <div className="space-y-1.5 flex-1 overflow-y-auto">
                  {[
                    { s: 'EURUSD', p: currentPrice.toFixed(5), chg: '+0.18%', up: true },
                    { s: 'GBPUSD', p: '1.26420', chg: '-0.12%', up: false },
                    { s: 'USDJPY', p: '154.210', chg: '+0.45%', up: true },
                    { s: 'BTCUSDT', p: '68,450', chg: '+1.85%', up: true },
                    { s: 'ETHUSDT', p: '3,520', chg: '+0.95%', up: true },
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
                  NetMQ MT5 & Oanda Feeds
                </div>
              </aside>

              {/* Full Interactive Chart */}
              <div className="flex-1 h-full overflow-hidden">
                <TradingChart
                  candles={candles}
                  symbol={selectedSymbol}
                  timeframe={timeframe}
                  onTimeframeChange={setTimeframe}
                  indicatorConfig={indicatorConfig}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Emergency Kill Switch Modal */}
      <KillSwitchModal
        isOpen={isKillSwitchOpen}
        onClose={() => setIsKillSwitchOpen(false)}
        risk={risk}
        onToggleKillSwitch={handleToggleKillSwitch}
      />

      {/* Broker & Keyless Market Data Settings Modal */}
      <BrokerSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onProviderChanged={(newProvider) => {
          setActiveProvider(newProvider);
          fetchLiveCandles();
        }}
      />
    </div>
  );
}

export default App;
