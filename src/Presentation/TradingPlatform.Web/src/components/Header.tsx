import React from 'react';
import { AccountSummary, RiskProfile } from '../types/trading';

interface HeaderProps {
  account: AccountSummary | null;
  risk: RiskProfile | null;
  onOpenKillSwitch: () => void;
  selectedSymbol: string;
  currentPrice: number;
}

export const Header: React.FC<HeaderProps> = ({
  account,
  risk,
  onOpenKillSwitch,
  selectedSymbol,
  currentPrice,
}) => {
  const isKillSwitchEngaged = risk?.isKillSwitchEngaged ?? false;
  const currentDrawdown = account?.currentDrawdownPercent ?? 0;
  const maxDrawdown = risk?.maxDailyDrawdownPercent ?? 5.0;

  const ddColor =
    currentDrawdown >= maxDrawdown
      ? 'text-red-500'
      : currentDrawdown >= maxDrawdown * 0.7
      ? 'text-amber-400'
      : 'text-emerald-400';

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 select-none">
      {/* Brand & Market Ticker */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
            AG
          </div>
          <div>
            <div className="text-sm font-bold tracking-wider text-slate-100 uppercase">
              Antigravity <span className="text-blue-400 font-mono">FX Terminal</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">.NET 10 LTS · CQRS Engine</div>
          </div>
        </div>

        {/* Selected Pair & Live Price */}
        <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800 px-3 py-1.5 rounded-lg">
          <span className="font-bold text-sm text-slate-200 tracking-wide">{selectedSymbol}</span>
          <span className="font-mono text-base font-semibold text-emerald-400">
            {currentPrice.toFixed(5)}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
            +0.18%
          </span>
        </div>
      </div>

      {/* Broker Connection Status Pills */}
      <div className="hidden lg:flex items-center gap-3 font-mono text-xs">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/60 border border-slate-700/50">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-300 font-medium">Oanda v20</span>
          <span className="text-[10px] text-slate-400">STREAMING</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/60 border border-slate-700/50">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="text-slate-300 font-medium">MT5 ZeroMQ</span>
          <span className="text-[10px] text-slate-400">PUB/SUB</span>
        </div>
      </div>

      {/* Account Telemetry & Drawdown Gauge */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 font-mono text-xs">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Equity</div>
            <div className="text-sm font-semibold text-slate-100">
              ${account?.equity ? account.equity.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '100,000.00'}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Balance</div>
            <div className="text-slate-300">
              ${account?.balance ? account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '100,000.00'}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Daily Drawdown</div>
            <div className={`font-bold ${ddColor}`}>
              {currentDrawdown.toFixed(2)}%{' '}
              <span className="text-[10px] text-slate-500 font-normal">/ {maxDrawdown.toFixed(1)}% Max</span>
            </div>
          </div>
        </div>

        {/* Emergency Kill Switch */}
        <button
          onClick={onOpenKillSwitch}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all shadow-md ${
            isKillSwitchEngaged
              ? 'bg-red-600 text-white animate-bounce shadow-red-600/40 ring-2 ring-red-400'
              : 'bg-red-950/60 border border-red-800/60 text-red-300 hover:bg-red-900/80 hover:text-white'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
          {isKillSwitchEngaged ? 'KILL SWITCH ENGAGED' : 'EMERGENCY KILL SWITCH'}
        </button>
      </div>
    </header>
  );
};
