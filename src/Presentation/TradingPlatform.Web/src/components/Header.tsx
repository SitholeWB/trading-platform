import React, { useState } from 'react';
import { AccountSummary, RiskProfile } from '../types/trading';
import { Search, RefreshCw, Bell, Sparkles, Settings, Clock, Globe, MessageSquarePlus, Languages } from 'lucide-react';
import { useTimezone } from '../context/TimezoneContext';
import { useLanguage } from '../context/LanguageContext';
import { TimezoneSelectorModal } from './TimezoneSelectorModal';
import { LanguageSelectorModal } from './LanguageSelectorModal';

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
  activeProvider?: string;
  onOpenSettings?: () => void;
  onOpenFeedback?: () => void;
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
  activeProvider,
  onOpenSettings,
  onOpenFeedback,
}) => {
  const [isTimezoneModalOpen, setIsTimezoneModalOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const { currentFormattedTime, currentAbbr, currentOffset, activeTimezoneInfo } = useTimezone();
  const { language, activeLanguageInfo, t } = useLanguage();

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
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">{t('header.equity', 'Equity')}</span>
            <span className="font-semibold text-slate-100">
              ${account?.equity ? account.equity.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '100,000.00'}
            </span>
          </div>

          <div className="hidden sm:block">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">{t('header.balance', 'Balance')}</span>
            <span className="text-slate-300">
              ${account?.balance ? account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '100,000.00'}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">{t('header.dailyDrawdown', 'Drawdown')}</span>
            <span className={`font-bold ${ddColor}`}>
              {currentDrawdown.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Timezone & Live Platform Clock Button */}
        <button
          onClick={() => setIsTimezoneModalOpen(true)}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-white transition-all text-xs font-mono shadow-sm group cursor-pointer"
          title={`Platform Timezone: ${activeTimezoneInfo.label} (${currentOffset}, ${currentAbbr}). Click to change timezone.`}
        >
          <Clock className="w-3.5 h-3.5 text-cyan-400 group-hover:text-cyan-300 transition-colors animate-pulse" />
          <span className="font-bold text-slate-100 group-hover:text-cyan-200">
            {currentFormattedTime}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/60 hidden sm:inline">
            {currentAbbr || activeTimezoneInfo.city}
          </span>
        </button>

        {/* Language Selector Button */}
        <button
          onClick={() => setIsLanguageModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 text-slate-300 hover:text-white transition-all text-xs font-mono shadow-sm group cursor-pointer"
          title={`Platform Language: ${activeLanguageInfo.nativeName} (${activeLanguageInfo.label}). Click to change language.`}
        >
          <span className="text-sm leading-none">{activeLanguageInfo.flag}</span>
          <span className="font-bold text-slate-100 uppercase text-[11px] hidden sm:inline">
            {language}
          </span>
        </button>

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

        {/* Account / Broker Provider Identity Badge */}
        {activeProvider && (
          <div
            onClick={onOpenSettings}
            className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-mono border cursor-pointer transition-all ${
              activeProvider === 'Oanda'
                ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 shadow-sm'
                : activeProvider === 'TwelveData'
                ? 'bg-purple-950/70 border-purple-500/40 text-purple-300 hover:bg-purple-900/60 shadow-sm'
                : 'bg-blue-950/70 border-blue-500/40 text-blue-300 hover:bg-blue-900/60 shadow-sm'
            }`}
            title="Active Broker Account: Click to configure broker API credentials or switch to OANDA/TwelveData"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            <span className="font-semibold">{activeProvider === 'Demo' ? 'DEMO SIMULATOR' : activeProvider.toUpperCase()}</span>
          </div>
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
            <span className="font-sans font-semibold hidden md:inline">{t('header.aiCopilot', 'AI Copilot')}</span>
          </button>
        )}

        {/* Quick Feedback Button */}
        {onOpenFeedback && (
          <button
            onClick={onOpenFeedback}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-850 hover:border-indigo-500/40 text-slate-400 hover:text-indigo-300 transition-all text-xs font-mono cursor-pointer"
            title="Send Quick Feedback to Discord (No login required)"
          >
            <MessageSquarePlus className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-sans font-semibold hidden lg:inline">{t('common.feedback', 'Feedback')}</span>
          </button>
        )}

        {/* Platform Settings Button */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Configure Broker, API Keys & AI Provider"
          >
            <Settings className="w-3.5 h-3.5" />
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
            <span>{isKillSwitchEngaged ? t('common.halted', 'HALTED') : t('header.killSwitch', 'KILL SWITCH')}</span>
          </button>
        )}
      </div>

      {/* Interactive Timezone & Clock Modal */}
      <TimezoneSelectorModal
        isOpen={isTimezoneModalOpen}
        onClose={() => setIsTimezoneModalOpen(false)}
      />

      {/* Interactive Language & Region Modal */}
      <LanguageSelectorModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
      />
    </header>
  );
};
