import React from 'react';

export type PageId = 'dashboard' | 'scanner' | 'strategies' | 'radar' | 'positions' | 'sandbox' | 'chart';

interface NavigationSidebarProps {
  activePage: PageId;
  onSelectPage: (page: PageId) => void;
  activeStrategiesCount: number;
  openPositionsCount: number;
  auditLogsCount: number;
  isKillSwitchEngaged: boolean;
  activeProvider?: string;
  onOpenSettings?: () => void;
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
}) => {
  const navItems = [
    {
      id: 'dashboard' as PageId,
      icon: '🤖',
      label: 'Dashboard',
      badge: null,
    },
    {
      id: 'scanner' as PageId,
      icon: '📡',
      label: 'Market Scanner',
      badge: 'Robot',
      badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    },
    {
      id: 'strategies' as PageId,
      icon: '⚡',
      label: 'Strategies',
      badge: activeStrategiesCount > 0 ? `${activeStrategiesCount} Active` : null,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
    {
      id: 'radar' as PageId,
      icon: '🎯',
      label: 'Audit Radar',
      badge: auditLogsCount > 0 ? `${auditLogsCount}` : null,
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    },
    {
      id: 'positions' as PageId,
      icon: '💼',
      label: 'Positions',
      badge: openPositionsCount > 0 ? `${openPositionsCount}` : null,
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    },
    {
      id: 'sandbox' as PageId,
      icon: '🔬',
      label: 'Simulator',
      badge: null,
    },
    {
      id: 'chart' as PageId,
      icon: '📈',
      label: 'Live Chart',
      badge: null,
    },
  ];

  return (
    <aside className="w-56 bg-slate-950 border-r border-slate-800 flex flex-col justify-between select-none flex-shrink-0 h-screen">
      {/* Top: Clean Robot Identity & Status */}
      <div>
        <div className="h-13 min-h-[52px] px-3.5 border-b border-slate-800 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-sm shadow-sm">
            🤖
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold tracking-wider text-slate-100 uppercase truncate">
              Trading Robot
            </span>
            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isKillSwitchEngaged ? 'bg-red-500 animate-ping' : 'bg-emerald-400 animate-pulse'
                }`}
              />
              <span className={isKillSwitchEngaged ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                {isKillSwitchEngaged ? 'Halted' : 'Auto-Trading'}
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

      {/* Bottom: Connection Status & Settings */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950 text-[11px] font-mono text-slate-400 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Broker Bridge</span>
          <span className="text-emerald-400 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Connected
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span className="truncate">
            Feed: {activeProvider === 'KeylessPublic' ? 'Public (Yahoo/Binance)' : activeProvider === 'Oanda' ? 'OANDA v20' : activeProvider === 'ZeroMQ' ? 'MT5 ZeroMQ' : 'Sandbox'}
          </span>
          <span className="text-slate-500">M5</span>
        </div>
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="w-full mt-1 py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 hover:text-slate-200 border border-slate-800 text-[11px] font-sans font-medium flex items-center justify-center gap-1.5 text-slate-400 transition-colors"
          >
            <span>⚙️</span>
            <span>Feed & Keys Settings</span>
          </button>
        )}
      </div>
    </aside>
  );
};
