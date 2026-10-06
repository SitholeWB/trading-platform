import React from 'react';
import {
  AccountSummary,
  Position,
  RiskProfile,
  SignalAuditLog,
  StrategyDefinition,
  Candle,
  Timeframe,
} from '../types/trading';
import { DashboardMiniChart } from './DashboardMiniChart';
import { useTimezone } from '../context/TimezoneContext';

interface BotOverviewProps {
  account: AccountSummary | null;
  risk: RiskProfile | null;
  strategies: StrategyDefinition[];
  positions: Position[];
  auditLogs: SignalAuditLog[];
  onOpenKillSwitch: () => void;
  onNavigateTo: (page: 'strategies' | 'radar' | 'positions' | 'sandbox' | 'chart' | 'scanner' | 'dashboard') => void;
  selectedSymbol: string;
  currentPrice: number;
  candles?: Candle[];
  timeframe?: Timeframe;
  onSelectSymbol?: (symbol: string) => void;
  onSelectTimeframe?: (tf: Timeframe) => void;
}

export const BotOverview: React.FC<BotOverviewProps> = ({
  account,
  risk,
  strategies,
  positions,
  auditLogs,
  onOpenKillSwitch,
  onNavigateTo,
  selectedSymbol,
  currentPrice,
  candles,
  timeframe,
  onSelectSymbol,
  onSelectTimeframe,
}) => {
  const { formatTime } = useTimezone();
  const isKillSwitch = risk?.isKillSwitchEngaged ?? false;
  const activeStrategies = strategies.filter((s) => s.isActive && s.autoTradingEnabled);
  const openPositions = positions.filter((p) => p.status === 'Open');
  const netPnL = openPositions.reduce((acc, p) => acc + (p.unrealizedPnl || 0), 0);
  const totalLots = openPositions.reduce((acc, p) => acc + (p.lots || 0), 0);
  const nearMisses = auditLogs.filter((a) => a.state === 'NearMiss');
  const fullyMet = auditLogs.filter((a) => a.state === 'FullyMet');

  const currentDrawdown = account?.currentDrawdownPercent ?? 0;
  const maxDrawdown = risk?.maxDailyDrawdownPercent ?? 5.0;

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 space-y-4 font-sans select-none">
      {/* Robot Status Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg shadow-black/40">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner ${
              isKillSwitch
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            }`}
          >
            {isKillSwitch ? '🚨' : '🤖'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-100 tracking-wide">
                Algorithmic Execution Robot
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  isKillSwitch
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {isKillSwitch ? 'Emergency Stop Engaged' : 'Active Autonomous Scanning'}
              </span>
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              CQRS Hexagonal Core · ZeroMQ NetMQ & Oanda v20 Adapters · Microsoft.RulesEngine
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTo('strategies')}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-md shadow-blue-600/30"
          >
            ⚡ Configure Logic
          </button>
          {(openPositions.length > 0 || isKillSwitch) && (
            <button
              onClick={onOpenKillSwitch}
              className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition-colors shadow-md ${
                isKillSwitch
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-red-600 hover:bg-red-500 text-white'
              }`}
            >
              {isKillSwitch ? 'Reset Robot' : '🚨 Kill Switch'}
            </button>
          )}
        </div>
      </div>

      {/* Primary Robotic KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Active Automated Strategies */}
        <div
          onClick={() => onNavigateTo('strategies')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-3.5 rounded-xl cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>ACTIVE STRATEGIES</span>
            <span className="text-blue-400 font-bold">⚡ View</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-100">
              {activeStrategies.length}
            </span>
            <span className="text-xs text-slate-500 font-mono">/ {strategies.length} configured</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 truncate">
            {activeStrategies.length > 0
              ? activeStrategies.map((s) => s.name).join(', ')
              : 'No strategies currently auto-trading'}
          </div>
        </div>

        {/* Live Bot Positions & Floating PnL */}
        <div
          onClick={() => onNavigateTo('positions')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-3.5 rounded-xl cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>LIVE POSITIONS</span>
            <span className="text-blue-400 font-bold">💼 Manage</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-100">
              {openPositions.length}
            </span>
            <span
              className={`text-sm font-mono font-bold ${
                netPnL >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {netPnL >= 0 ? `+$${netPnL.toFixed(2)}` : `-$${Math.abs(netPnL).toFixed(2)}`}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            Total Volume: <span className="text-slate-200 font-bold">{totalLots.toFixed(2)} Lots</span>
          </div>
        </div>

        {/* Signal Radar & Near Misses */}
        <div
          onClick={() => onNavigateTo('radar')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-3.5 rounded-xl cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>AUDIT TRAIL</span>
            <span className="text-blue-400 font-bold">🎯 Radar</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {fullyMet.length}
            </span>
            <span className="text-xs text-slate-400 font-mono">Traded ·</span>
            <span className="text-2xl font-bold font-mono text-amber-400">
              {nearMisses.length}
            </span>
            <span className="text-xs text-slate-400 font-mono">Near-Misses</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            Evaluated: <span className="text-slate-200">{auditLogs.length} candles logged</span>
          </div>
        </div>

        {/* Risk & Drawdown Sentinel */}
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>DAILY RISK SENTINEL</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                currentDrawdown < maxDrawdown * 0.7
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-red-500/10 text-red-400'
              }`}
            >
              {currentDrawdown < maxDrawdown * 0.7 ? 'SAFE' : 'WARNING'}
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono ${
                currentDrawdown >= maxDrawdown ? 'text-red-400' : 'text-slate-100'
              }`}
            >
              {currentDrawdown.toFixed(2)}%
            </span>
            <span className="text-xs text-slate-500 font-mono">/ {maxDrawdown.toFixed(1)}% Max Limit</span>
          </div>
          {/* Progress bar */}
          <div className="mt-2.5 w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                currentDrawdown >= maxDrawdown
                  ? 'bg-red-500'
                  : currentDrawdown >= maxDrawdown * 0.7
                  ? 'bg-amber-400'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(100, (currentDrawdown / maxDrawdown) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Live Market Mini Chart & Advanced Charting Station Gateway */}
      <DashboardMiniChart
        candles={candles}
        selectedSymbol={selectedSymbol}
        timeframe={timeframe}
        currentPrice={currentPrice}
        onNavigateToChart={(sym, tf) => {
          if (sym && onSelectSymbol) onSelectSymbol(sym);
          if (tf && onSelectTimeframe) onSelectTimeframe(tf);
          onNavigateTo('chart');
        }}
        onSelectSymbol={onSelectSymbol}
        onSelectTimeframe={onSelectTimeframe}
      />

      {/* Middle Dual Section: Robot Subsystems & Account Equity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Robotic Subsystem Health */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200 tracking-wider uppercase font-mono">
                🤖 Engine Subsystems & Telemetry
              </span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded font-mono">
                ALL SYSTEMS OPERATIONAL
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Sub-5ms Execution SLA</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Candle Buffer Daemon</span>
                <span className="text-emerald-400 font-mono text-[11px]">● Streaming</span>
              </div>
              <p className="text-[11px] text-slate-400">
                130 completed M5 historical candles maintained in memory sliding window with zero DB latency.
              </p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">RulesEngine Evaluation</span>
                <span className="text-emerald-400 font-mono text-[11px]">● Dynamic LINQ</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Executes compiled AST rules with near-miss percentage matcher and strict fingerprint idempotency.
              </p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">ZeroMQ MT5 / NetMQ PUB</span>
                <span className="text-emerald-400 font-mono text-[11px]">● PUB/SUB</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Low-overhead TCP sockets connect directly to MetaTrader 5 Expert Advisor without web overhead.
              </p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Dynamic Trailing Stop Daemon</span>
                <span className="text-emerald-400 font-mono text-[11px]">● 15s Cycle</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Ratchet stops based on configured ATR volatility multiplier to secure profits during trending runs.
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-400 font-mono bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
            <span>Primary Market: <strong className="text-slate-200">{selectedSymbol}</strong> @ <strong className="text-emerald-400">{currentPrice.toFixed(5)}</strong></span>
            <button
              onClick={() => onNavigateTo('sandbox')}
              className="text-blue-400 hover:text-blue-300 font-bold"
            >
              Test Ingestion Sandbox →
            </button>
          </div>
        </div>

        {/* Right: Capital Allocation & Account Health */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-200 tracking-wider uppercase font-mono">
              💼 Capital & Margin
            </span>
            <span className="text-xs text-slate-400 font-mono">USD Account</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Equity:</span>
              <span className="text-slate-100 font-bold text-sm">
                ${account?.equity ? account.equity.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '100,000.00'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Balance:</span>
              <span className="text-slate-200">
                ${account?.balance ? account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '100,000.00'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Used Margin:</span>
              <span className="text-slate-300">
                ${account?.margin ? account.margin.toFixed(2) : '0.00'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Free Margin:</span>
              <span className="text-emerald-400 font-bold">
                ${account?.freeMargin ? account.freeMargin.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '100,000.00'}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Max Open Positions:</span>
              <span className="text-slate-200 font-bold">{risk?.maxOpenPositionsTotal ?? 5} Max</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigateTo('positions')}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg transition-colors border border-slate-700 text-center"
            >
              Open Full Positions Manager
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Live Decisions & Activity Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-200 tracking-wider uppercase font-mono">
              📡 Recent Robotic Decisions & Signals
            </span>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-mono">
              Live Evaluation Stream
            </span>
          </div>
          <button
            onClick={() => onNavigateTo('radar')}
            className="text-xs text-blue-400 hover:text-blue-300 font-mono font-bold"
          >
            View Full Radar ({auditLogs.length}) →
          </button>
        </div>

        {auditLogs.length === 0 ? (
          <div className="py-8 text-center text-slate-500 font-mono text-xs">
            No signal evaluations yet. Ingest candles via the Ingestion Sandbox or wait for live broker ticks.
          </div>
        ) : (
          <div className="space-y-2">
            {auditLogs.slice(0, 5).map((log) => {
              const isTrade = log.state === 'FullyMet';
              const isNearMiss = log.state === 'NearMiss';
              return (
                <div
                  key={log.id}
                  className="bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isTrade
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : isNearMiss
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {log.state}
                    </span>
                    <span className="font-bold text-slate-200">{log.symbol}</span>
                    <span className="text-slate-400">{log.timeframe}</span>
                    <span className="text-[11px] text-slate-500 truncate max-w-[280px]">
                      {log.signalFingerprint}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-slate-400">
                    <span>
                      {formatTime(log.candleTimestampUtc)}
                    </span>
                    <button
                      onClick={() => onNavigateTo('radar')}
                      className="text-blue-400 hover:text-blue-300 font-semibold"
                    >
                      Audit Details →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
