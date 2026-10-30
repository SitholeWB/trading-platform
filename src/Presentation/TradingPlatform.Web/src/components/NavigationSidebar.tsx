import React, { useState } from 'react';
import { BookOpen, MessageSquarePlus, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
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
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('tp_nav_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('tp_nav_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

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

  if (isCollapsed) {
    return (
      <aside className="w-14 bg-slate-950 border-r border-slate-800 flex flex-col justify-between select-none flex-shrink-0 h-screen transition-all duration-200">
        {/* Top: Logo & Status */}
        <div>
          <div className="h-13 min-h-[52px] border-b border-slate-800 flex items-center justify-center relative group">
            <img
              onClick={onOpenAbout}
              src="/app-icon.png"
              alt="Trading Platform"
              className="w-8 h-8 rounded-lg object-cover border border-cyan-500/30 shadow-md shadow-cyan-950/40 hover:scale-105 transition-transform cursor-pointer"
              title="About Trading Platform"
            />
            {/* Status dot */}
            <span
              className={`absolute top-2 right-2 w-2 h-2 rounded-full border border-slate-950 ${
                isKillSwitchEngaged ? 'bg-red-500 animate-ping' : 'bg-emerald-400 animate-pulse'
              }`}
              title={isKillSwitchEngaged ? 'Halted' : 'Auto-Trading Connected'}
            />
          </div>

          {/* Nav Icons */}
          <nav className="p-1.5 space-y-1">
            {navItems.map((item) => {
              const isActive = activePage === item.id;
              return (
                <div key={item.id} className="relative group flex justify-center">
                  <button
                    onClick={() => onSelectPage(item.id)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all border cursor-pointer ${
                      isActive
                        ? 'bg-blue-600/20 border-blue-500/40 text-blue-300 font-semibold shadow-sm'
                        : 'bg-transparent border-transparent hover:bg-slate-900 hover:text-slate-200 text-slate-400'
                    }`}
                  >
                    <span className="text-base leading-none">{item.icon}</span>
                  </button>

                  {/* Tooltip on hover */}
                  <div className="absolute left-12 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-2 bg-slate-950 border border-slate-700 text-slate-100 text-xs px-2.5 py-1.5 rounded-lg shadow-2xl whitespace-nowrap z-50 pointer-events-none font-sans">
                    <span className="font-semibold">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Icons (Docs, Feedback, Settings, Expand Toggle) */}
        <div className="p-1.5 border-t border-slate-800/80 bg-slate-950 flex flex-col items-center gap-1.5">
          {/* Docs button */}
          <div className="relative group flex justify-center">
            <button
              onClick={() => onSelectPage('docs')}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all border cursor-pointer ${
                activePage === 'docs'
                  ? 'bg-cyan-950/90 border-cyan-500/80 text-cyan-200 ring-1 ring-cyan-500/40'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-cyan-400 hover:text-cyan-200'
              }`}
              title="Documentation & User Manual"
            >
              <BookOpen className="w-4 h-4" />
            </button>
            <div className="absolute left-12 top-1/2 -translate-y-1/2 hidden group-hover:block bg-slate-950 border border-slate-700 text-cyan-200 text-xs px-2.5 py-1 rounded-lg shadow-2xl whitespace-nowrap z-50 pointer-events-none font-sans font-semibold">
              Documentation
            </div>
          </div>

          {/* Feedback button */}
          {onOpenFeedback && (
            <div className="relative group flex justify-center">
              <button
                onClick={onOpenFeedback}
                className="w-10 h-10 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-400 hover:text-indigo-200 border border-indigo-500/30 flex items-center justify-center transition-colors cursor-pointer"
                title="Send Feedback"
              >
                <MessageSquarePlus className="w-4 h-4" />
              </button>
              <div className="absolute left-12 top-1/2 -translate-y-1/2 hidden group-hover:block bg-slate-950 border border-slate-700 text-indigo-200 text-xs px-2.5 py-1 rounded-lg shadow-2xl whitespace-nowrap z-50 pointer-events-none font-sans font-semibold">
                Feedback
              </div>
            </div>
          )}

          {/* Settings button */}
          {onOpenSettings && (
            <div className="relative group flex justify-center">
              <button
                onClick={onOpenSettings}
                className="w-10 h-10 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                title="Settings"
              >
                <span className="text-sm">⚙️</span>
              </button>
              <div className="absolute left-12 top-1/2 -translate-y-1/2 hidden group-hover:block bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2.5 py-1 rounded-lg shadow-2xl whitespace-nowrap z-50 pointer-events-none font-sans font-semibold">
                Settings
              </div>
            </div>
          )}

          {/* Expand Toggle Button */}
          <button
            onClick={handleToggleCollapse}
            className="w-10 h-8 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white flex items-center justify-center transition-colors cursor-pointer mt-1"
            title="Expand Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-56 bg-slate-950 border-r border-slate-800 flex flex-col justify-between select-none flex-shrink-0 h-screen transition-all duration-200">
      {/* Top: Clean Robot Identity & Status */}
      <div>
        <div className="h-13 min-h-[52px] px-3.5 border-b border-slate-800 flex items-center justify-between">
          <div
            onClick={onOpenAbout}
            className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-900/60 p-1 -ml-1 rounded-lg transition-colors group min-w-0"
            title="About Trading Platform Workstation"
          >
            <img
              src="/app-icon.png"
              alt="Trading Platform"
              className="w-8 h-8 rounded-lg object-cover border border-cyan-500/30 shadow-md shadow-cyan-950/40 group-hover:scale-105 transition-transform flex-shrink-0"
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

          <button
            onClick={handleToggleCollapse}
            className="p-1 rounded-md text-slate-500 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
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
