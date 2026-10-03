import React from 'react';
import { AccountSummary, RiskProfile } from '../types/trading';
import { Search } from 'lucide-react';

interface HeaderProps {
  pageTitle: string;
  account: AccountSummary | null;
  risk: RiskProfile | null;
  onOpenKillSwitch: () => void;
  selectedSymbol: string;
  currentPrice: number;
  onOpenSymbolSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  pageTitle,
  account,
  risk,
  onOpenKillSwitch,
  selectedSymbol,
  currentPrice,
  onOpenSymbolSearch,
}) => {
  const isKillSwitchEngaged = risk?.isKillSwitchEngaged ?? false;
  const currentDrawdown = account?.currentDrawdownPercent ?? 0;
  const maxDrawdown = risk?.maxDailyDrawdownPercent ?? 5.0;

  const ddColor =
    currentDrawdown >= maxDrawdown
      ? 'text-red-400'
      : currentDrawdown >= maxDrawdown * 0.7
      ? 'text-amber-400'
      : 'text-emerald-400';

  const formattedPrice = currentPrice >= 100
    ? currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : currentPrice > 10
    ? currentPrice.toFixed(3)
    : currentPrice.toFixed(5);

  return (
    <header className="h-13 min-h-[52px] bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 select-none flex-shrink-0 z-10">
      {/* Left: Page Title & Current Pair */}
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="text-sm font-bold text-slate-100 tracking-wide font-sans truncate">
          {pageTitle}
        </h1>

        <button
          onClick={onOpenSymbolSearch}
          className="flex items-center gap-2 bg-slate-950 hover:bg-slate-850 hover:border-blue-500/40 border border-slate-800 px-2.5 py-1 rounded-lg text-xs font-mono transition-all group cursor-pointer shadow-sm"
          title="Search or Browse Symbol / Pair (Shortcut: /)"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 transition-colors" />
          <span className="font-bold text-slate-200 group-hover:text-white">{selectedSymbol}</span>
          <span className="font-semibold text-emerald-400">
            {formattedPrice}
          </span>
          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded font-mono hidden sm:inline">
            +0.18%
          </span>
        </button>
      </div>

      {/* Right: Essential Account Figures & Emergency Stop */}
      <div className="flex items-center gap-3 sm:gap-5 font-mono text-xs flex-shrink-0">
        <div className="flex items-center gap-3 sm:gap-4">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Equity</span>
            <span className="font-semibold text-slate-100">
              ${account?.equity ? account.equity.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '100,000.00'}
            </span>
          </div>

          <div className="hidden sm:block">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Balance</span>
            <span className="text-slate-300">
              ${account?.balance ? account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '100,000.00'}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Drawdown</span>
            <span className={`font-bold ${ddColor}`}>
              {currentDrawdown.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Emergency Kill Switch Button */}
        <button
          onClick={onOpenKillSwitch}
          className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-md ${
            isKillSwitchEngaged
              ? 'bg-red-600 text-white animate-pulse ring-2 ring-red-400'
              : 'bg-red-950/70 border border-red-800/80 text-red-300 hover:bg-red-900/80 hover:text-white'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-red-400" />
          <span>{isKillSwitchEngaged ? 'HALTED' : 'KILL SWITCH'}</span>
        </button>
      </div>
    </header>
  );
};
