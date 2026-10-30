import React, { useState } from 'react';
import { AccountSummary, RiskProfile } from '../types/trading';
import { Clock, Globe, Cpu } from 'lucide-react';
import { useTimezone } from '../context/TimezoneContext';
import { useLanguage } from '../context/LanguageContext';
import { TimezoneSelectorModal } from './TimezoneSelectorModal';
import { LanguageSelectorModal } from './LanguageSelectorModal';

interface HeaderProps {
  pageTitle: string;
  account: AccountSummary | null;
  risk: RiskProfile | null;
  onOpenKillSwitch: () => void;
  openPositionsCount?: number;
  chartEngine?: 'native' | 'tradingview';
  onChartEngineChange?: (engine: 'native' | 'tradingview') => void;
}

export const Header: React.FC<HeaderProps> = ({
  pageTitle,
  account,
  risk,
  onOpenKillSwitch,
  openPositionsCount = 0,
  chartEngine = 'native',
  onChartEngineChange,
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

  return (
    <header className="h-13 min-h-[52px] bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 select-none flex-shrink-0 z-10 gap-3">
      {/* Left: Page Title & Prominent Chart Engine Switcher */}
      <div className="flex items-center gap-4 min-w-0">
        <h1 className="text-sm font-bold text-slate-100 tracking-wide font-sans truncate">
          {pageTitle}
        </h1>

        {onChartEngineChange && (
          <div
            className="flex items-center gap-2 bg-slate-950 px-2 py-1 rounded-xl border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.18)] flex-shrink-0"
            title="Switch between Native Algorithmic Bot Chart and Official TradingView Live Widget"
          >
            <span className="hidden sm:inline text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 pl-1 select-none">
              Chart Mode:
            </span>
            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => onChartEngineChange('native')}
                className={`px-3 py-1 rounded-md text-xs font-sans flex items-center gap-1.5 transition-all cursor-pointer ${
                  chartEngine === 'native'
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 font-medium'
                }`}
                title="Native Bot Chart (Supports Bot Signals, Position SL/TP Dragging & Custom Drawings)"
              >
                {chartEngine === 'native' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                )}
                <Cpu className={`w-3.5 h-3.5 flex-shrink-0 ${chartEngine === 'native' ? 'text-white' : 'text-slate-500'}`} />
                <span className="whitespace-nowrap">Bot Chart</span>
              </button>
              <button
                type="button"
                onClick={() => onChartEngineChange('tradingview')}
                className={`px-3 py-1 rounded-md text-xs font-sans flex items-center gap-1.5 transition-all cursor-pointer ${
                  chartEngine === 'tradingview'
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 font-medium'
                }`}
                title="TradingView Live Widget (Direct Real-Time TradingView Feed & Built-in Studies)"
              >
                {chartEngine === 'tradingview' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                )}
                <Globe className={`w-3.5 h-3.5 flex-shrink-0 ${chartEngine === 'tradingview' ? 'text-white' : 'text-slate-500'}`} />
                <span className="whitespace-nowrap">TradingView Live</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right: Essential Account Figures, Clock, Language & Emergency Stop */}
      <div className="flex items-center gap-3 sm:gap-5 font-mono text-xs flex-shrink-0">
        <div className="flex items-center gap-3 sm:gap-4">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">{t('header.equity', 'Equity')}</span>
            <span className="font-semibold text-slate-100">
              ${account?.equity ? account.equity.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '100,000.00'}
            </span>
          </div>

          <div className="hidden md:block">
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
