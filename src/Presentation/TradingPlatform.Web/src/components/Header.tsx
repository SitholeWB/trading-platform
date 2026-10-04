import React from 'react';
import { AccountSummary, RiskProfile } from '../types/trading';
import { Search, RefreshCw, Bell, Sparkles } from 'lucide-react';

interface HeaderProps {
  pageTitle: string;
  account: AccountSummary | null;
  risk: RiskProfile | null;
  onOpenKillSwitch: () => void;
  selectedSymbol: string;
  currentPrice: number;
  onOpenSymbolSearch?: () => void;
  openPositionsCount?: number;
  onManualRefresh?: () => void;
  isRefreshing?: boolean;
  unacknowledgedAlertsCount?: number;
  onOpenAlertsModal?: () => void;
  isBackgroundScannerRunning?: boolean;
  onToggleCopilot?: () => void;
  isCopilotOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  pageTitle,
  account,
  risk,
  onOpenKillSwitch,
  selectedSymbol,
  currentPrice,
  onOpenSymbolSearch,
  openPositionsCount = 0,
  onManualRefresh,
  isRefreshing = false,
  unacknowledgedAlertsCount = 0,
  onOpenAlertsModal,
  isBackgroundScannerRunning = true,
  onToggleCopilot,
  isCopilotOpen = false,
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

        {/* Manual Refresh Button - Eliminates high frequency polling overload */}
        {onManualRefresh && (
          <button
            onClick={onManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all text-xs font-mono shadow-sm group cursor-pointer disabled:opacity-50"
            title="Manual Data Refresh: Reloads account summary, open positions, risk profile, and market feeds immediately."
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-blue-400 group-hover:text-blue-300 transition-colors ${
                isRefreshing ? 'animate-spin' : ''
              }`}
            />
            <span className="hidden lg:inline text-[11px] font-sans">Refresh</span>
          </button>
        )}

        {/* Strategy Alerts & Notifications Bell */}
        {onOpenAlertsModal && (
          <button
            onClick={onOpenAlertsModal}
            className={`relative p-2 rounded-lg border transition-all cursor-pointer ${
              unacknowledgedAlertsCount > 0
                ? 'bg-amber-950/60 border-amber-500/60 text-amber-300 shadow-lg shadow-amber-950/30'
                : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Strategy Alerts & Background Scanner (Cross-Platform Desktop & Web Notifications)"
          >
            <Bell className={`w-3.5 h-3.5 ${unacknowledgedAlertsCount > 0 ? 'text-amber-400 animate-pulse' : ''}`} />
            {unacknowledgedAlertsCount > 0 ? (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[9px] font-bold px-1 rounded-full min-w-[16px] h-4 flex items-center justify-center font-mono">
                {unacknowledgedAlertsCount}
              </span>
            ) : isBackgroundScannerRunning ? (
              <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
            ) : null}
          </button>
        )}

        {/* AI Market Copilot Button */}
        {onToggleCopilot && (
          <button
            onClick={onToggleCopilot}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all shadow-sm cursor-pointer ${
              isCopilotOpen
                ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300 ring-1 ring-cyan-500/50 shadow-cyan-950/50'
                : 'bg-gradient-to-r from-slate-950 to-indigo-950/50 hover:from-slate-900 hover:to-indigo-900/50 border-indigo-500/30 text-indigo-300 hover:text-white'
            }`}
            title="AI Market Copilot: Quantitative market diagnostics, conversational assistant, and trade audit explanations"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="font-sans font-semibold hidden md:inline">AI Copilot</span>
          </button>
        )}

        {/* Emergency Kill Switch Button - Visible only if there are open positions (or already engaged) */}
        {(openPositionsCount > 0 || isKillSwitchEngaged) && (
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
        )}
      </div>
    </header>
  );
};
