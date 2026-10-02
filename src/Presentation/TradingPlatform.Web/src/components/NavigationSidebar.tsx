import React from 'react';

export type PageId = 'dashboard' | 'strategies' | 'radar' | 'positions' | 'sandbox' | 'chart';

interface NavigationSidebarProps {
  activePage: PageId;
  onSelectPage: (page: PageId) => void;
  activeStrategiesCount: number;
  openPositionsCount: number;
  auditLogsCount: number;
  isKillSwitchEngaged: boolean;
  onOpenKillSwitch: () => void;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  activePage,
  onSelectPage,
  activeStrategiesCount,
  openPositionsCount,
  auditLogsCount,
  isKillSwitchEngaged,
  onOpenKillSwitch,
}) => {
  const navItems = [
    {
      id: 'dashboard' as PageId,
      icon: '🤖',
      label: 'Bot Overview',
      desc: 'System health & decisions',
      badge: null,
    },
    {
      id: 'strategies' as PageId,
      icon: '⚡',
      label: 'Strategy Studio',
      desc: 'Rules AST & Indicators',
      badge: activeStrategiesCount > 0 ? `${activeStrategiesCount} Active` : null,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
    {
      id: 'radar' as PageId,
      icon: '🎯',
      label: 'Near-Miss Radar',
      desc: 'Forensic audits & signals',
      badge: auditLogsCount > 0 ? `${auditLogsCount}` : null,
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    },
    {
      id: 'positions' as PageId,
      icon: '💼',
      label: 'Positions & Orders',
      desc: 'Order book & trailing stop',
      badge: openPositionsCount > 0 ? `${openPositionsCount} Open` : null,
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    },
    {
      id: 'sandbox' as PageId,
      icon: '🔬',
      label: 'Ingestion Sandbox',
      desc: 'Synthetic tick simulator',
      badge: null,
    },
    {
      id: 'chart' as PageId,
      icon: '📈',
      label: 'Chart Inspector',
      desc: 'Candles & indicator curves',
      badge: null,
    },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between p-3 select-none flex-shrink-0">
      <div className="space-y-4">
        {/* Navigation Section */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 font-mono">
            Navigation
          </div>

          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectPage(item.id)}
                className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-all border ${
                  isActive
                    ? 'bg-blue-600/15 border-blue-500/40 text-slate-100 shadow-sm'
                    : 'bg-transparent border-transparent hover:bg-slate-900 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg leading-none">{item.icon}</span>
                  <div>
                    <div className={`text-xs font-bold ${isActive ? 'text-blue-400' : 'text-slate-200'}`}>
                      {item.label}
                    </div>
                    <div className="text-[10px] text-slate-400 leading-tight">
                      {item.desc}
                    </div>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${
                      item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Sentinel & Kill Switch */}
      <div className="pt-3 border-t border-slate-800 space-y-2.5">
        {/* Engine Status Card */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-2.5 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px]">ENGINE STATE</span>
            <span className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isKillSwitchEngaged ? 'bg-red-500 animate-ping' : 'bg-emerald-400 animate-pulse'
                }`}
              />
              <span
                className={`text-[10px] font-bold ${
                  isKillSwitchEngaged ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {isKillSwitchEngaged ? 'EMERGENCY STOP' : 'SCANNING LIVE'}
              </span>
            </span>
          </div>

          <div className="mt-1 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Broker Protocol:</span>
            <span className="text-slate-200 font-semibold">NetMQ MT5 PUB</span>
          </div>
        </div>

        {/* Emergency Kill Switch Button */}
        <button
          onClick={onOpenKillSwitch}
          className={`w-full py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
            isKillSwitchEngaged
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-red-600/90 hover:bg-red-600 text-white shadow-red-950/40'
          }`}
        >
          <span>🚨</span>
          <span>{isKillSwitchEngaged ? 'Reset Emergency Stop' : 'Kill Switch (Halt Robot)'}</span>
        </button>

        <div className="text-[10px] text-slate-400 text-center font-mono">
          .NET 10 LTS · Clean Hexagonal
        </div>
      </div>
    </aside>
  );
};
