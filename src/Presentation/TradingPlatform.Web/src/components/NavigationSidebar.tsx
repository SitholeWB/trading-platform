import React from 'react';
import { BookOpen, MessageSquarePlus } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export type PageId = 'dashboard' | 'scanner' | 'strategies' | 'radar' | 'positions' | 'sandbox' | 'chart' | 'docs';

interface NavigationSidebarProps {
  activePage: PageId;
  onSelectPage: (page: PageId) => void;
  activeStrategiesCount: number;
  openPositionsCount: number;
  auditLogsCount: number;
  isKillSwitchEngaged: boolean;
  activeProvider?: string;
  onOpenSettings?: () => void;
  onOpenFeedback?: () => void;
  onOpenAbout?: () => void;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  activePage,
  onSelectPage,
  activeStrategiesCount,
  openPositionsCount,
  auditLogsCount,
  isKillSwitchEngaged,
  activeProvider = 'KeylessPublic',
  onOpenSettings,
  onOpenFeedback,
  onOpenAbout,
}) => {
  const { t } = useLanguage();
  const navItems = [
    {
      id: 'dashboard' as PageId,
      icon: '🤖',
      label: t('nav.dashboard', 'Dashboard'),
      badge: null,
    },
    {
      id: 'scanner' as PageId,
      icon: '📡',
      label: t('nav.scanner', 'Market Scanner'),
      badge: t('nav.robot', 'Robot'),
      badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    },
    {
      id: 'strategies' as PageId,
      icon: '⚡',
      label: t('nav.strategies', 'Strategies'),
      badge: activeStrategiesCount > 0 ? `${activeStrategiesCount} Active` : null,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
    {
      id: 'radar' as PageId,
      icon: '🎯',
      label: t('nav.radar', 'Audit Radar'),
      badge: auditLogsCount > 0 ? `${auditLogsCount}` : null,
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    },
    {
      id: 'positions' as PageId,
      icon: '💼',
      label: t('nav.positions', 'Positions'),
      badge: openPositionsCount > 0 ? `${openPositionsCount}` : null,
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    },
    {
      id: 'sandbox' as PageId,
      icon: '🔬',
      label: t('nav.simulator', 'Simulator'),
      badge: null,
    },
    {
      id: 'chart' as PageId,
      icon: '📈',
      label: t('nav.chart', 'Live Chart'),
      badge: null,
    },
  ];

  return (
    <aside className="w-56 bg-slate-950 border-r border-slate-800 flex flex-col justify-between select-none flex-shrink-0 h-screen">
      {/* Top: Clean Robot Identity & Status */}
      <div>
        <div
          onClick={onOpenAbout}
          className="h-13 min-h-[52px] px-3.5 border-b border-slate-800 flex items-center gap-2.5 cursor-pointer hover:bg-slate-900/60 transition-colors group"
          title="About Trading Platform Workstation"
        >
          <img
            src="/app-icon.png"
            alt="Trading Platform"
            className="w-9 h-9 rounded-lg object-cover border border-cyan-500/30 shadow-md shadow-cyan-950/40 group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold tracking-wider text-slate-100 uppercase truncate group-hover:text-cyan-200 transition-colors">
              {t('common.appTitle', 'Trading Platform')}
            </span>
            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isKillSwitchEngaged ? 'bg-red-500 animate-ping' : 'bg-emerald-400 animate-pulse'
                }`}
              />
              <span className={isKillSwitchEngaged ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                {isKillSwitchEngaged ? t('common.halted', 'Halted') : t('common.autoTrading', 'Auto-Trading')}
              </span>
            </span>
          </div>
        </div>

        {/* Clean Single-Line Navigation Items */}
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectPage(item.id)}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-all border text-xs font-medium ${
                  isActive
                    ? 'bg-blue-600/20 border-blue-500/40 text-blue-300 font-semibold shadow-sm'
                    : 'bg-transparent border-transparent hover:bg-slate-900 hover:text-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base leading-none">{item.icon}</span>
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full border font-bold ${
                      item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Documentation Entry, Connection Status & Settings */}
      <div className="p-2.5 border-t border-slate-800/80 bg-slate-950 text-[11px] font-mono text-slate-400 space-y-2">
        {/* Prominent, Clearly Visible Documentation Button (Bottom Left on Side Menu) */}
        <button
          onClick={() => onSelectPage('docs')}
          className={`w-full p-2 rounded-xl flex items-center justify-between text-xs font-medium transition-all border cursor-pointer group shadow-sm ${
            activePage === 'docs'
              ? 'bg-cyan-950/90 border-cyan-500/80 text-cyan-200 font-semibold ring-1 ring-cyan-500/40 shadow-cyan-950/50'
              : 'bg-slate-900/90 hover:bg-slate-800/90 border-slate-800 text-slate-300 hover:text-white'
          }`}
          title="Open Detailed Platform Documentation & User Guide"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`p-1.5 rounded-lg transition-all ${
                activePage === 'docs'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col text-left min-w-0">
              <span className="font-semibold text-xs leading-none truncate font-sans">{t('nav.docs', 'User Manual')}</span>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5">Documentation</span>
            </div>
          </div>
          <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
            Docs
          </span>
        </button>

        <div className="pt-1 border-t border-slate-800/60 space-y-1">
          <div className="flex items-center justify-between text-[10.5px]">
            <span className="text-slate-500">{t('common.brokerBridge', 'Broker Bridge')}</span>
            <span className="text-emerald-400 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {t('common.connected', 'Connected')}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="truncate">
              {t('common.feed', 'Feed')}: {activeProvider === 'KeylessPublic' ? 'Public (Yahoo/Binance)' : activeProvider === 'Oanda' ? 'OANDA v20' : activeProvider === 'ZeroMQ' ? 'MT5 ZeroMQ' : 'Sandbox'}
            </span>
            <span className="text-slate-500 font-mono">M5</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenFeedback && (
            <button
              onClick={onOpenFeedback}
              className="flex-1 py-1.5 px-2 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/50 hover:text-indigo-200 border border-indigo-500/30 text-[11px] font-sans font-medium flex items-center justify-center gap-1.5 text-indigo-300 transition-colors cursor-pointer"
              title="Quick Feedback & Bug Report directly to Discord"
            >
              <MessageSquarePlus className="w-3.5 h-3.5 text-indigo-400" />
              <span>{t('common.feedback', 'Feedback')}</span>
            </button>
          )}

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className={`${onOpenFeedback ? 'flex-1' : 'w-full'} py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 hover:text-slate-200 border border-slate-800 text-[11px] font-sans font-medium flex items-center justify-center gap-1.5 text-slate-400 transition-colors cursor-pointer`}
              title="Configure Broker, API Keys & AI Provider"
            >
              <span>⚙️</span>
              <span>{t('common.settings', 'Settings')}</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
