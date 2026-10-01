import React from 'react';
import { AccountSummary, Position, RiskProfile } from '../types/trading';

interface RiskConsoleProps {
  account: AccountSummary | null;
  risk: RiskProfile | null;
  positions: Position[];
  onOpenKillSwitch: () => void;
}

export const RiskConsole: React.FC<RiskConsoleProps> = ({
  account,
  risk,
  positions,
  onOpenKillSwitch,
}) => {
  const currentDrawdown = account?.currentDrawdownPercent ?? 0;
  const maxDrawdown = risk?.maxDailyDrawdownPercent ?? 5.0;
  const maxPositions = risk?.maxOpenPositionsTotal ?? 5;
  const openCount = positions.filter((p) => p.status === 'Open').length;

  const ddRatio = Math.min(100, (currentDrawdown / maxDrawdown) * 100);

  // Currency exposure count
  const currencyCounts: Record<string, number> = { USD: 0, EUR: 0, GBP: 0, JPY: 0 };
  positions
    .filter((p) => p.status === 'Open')
    .forEach((p) => {
      Object.keys(currencyCounts).forEach((cur) => {
        if (p.symbol.includes(cur)) currencyCounts[cur]++;
      });
    });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 font-mono text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <span className="font-bold text-sm text-slate-100 font-sans">Institutional Risk Radar</span>
        <span className="text-[10px] text-slate-400">10s Background Heartbeat</span>
      </div>

      {/* Daily Drawdown Gauge */}
      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400 font-sans">Daily Drawdown</span>
          <span className={`font-bold ${currentDrawdown >= maxDrawdown ? 'text-red-400' : 'text-emerald-400'}`}>
            {currentDrawdown.toFixed(2)}% / {maxDrawdown.toFixed(1)}% Max
          </span>
        </div>
        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              ddRatio > 80 ? 'bg-red-500' : ddRatio > 50 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${ddRatio}%` }}
          />
        </div>
        <div className="text-[10px] text-slate-500 flex justify-between">
          <span>Safe (0-2%)</span>
          <span>Warning (2-4%)</span>
          <span>Breach (5%+)</span>
        </div>
      </div>

      {/* Max Open Positions Gauge */}
      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400 font-sans">Open Positions Capacity</span>
          <span className="font-bold text-slate-200">
            {openCount} / {maxPositions} Total
          </span>
        </div>
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${(openCount / maxPositions) * 100}%` }}
          />
        </div>
      </div>

      {/* Currency Exposure Matrix */}
      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
        <div className="text-[11px] text-slate-400 font-sans font-bold">Currency Risk Concentration</div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          {Object.entries(currencyCounts).map(([cur, count]) => (
            <div key={cur} className="flex justify-between p-1.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400">{cur} Pairs:</span>
              <span className={`font-bold ${count >= (risk?.maxCurrencyExposure ?? 2) ? 'text-amber-400' : 'text-slate-200'}`}>
                {count} / {risk?.maxCurrencyExposure ?? 2}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Button */}
      <div className="pt-2">
        <button
          onClick={onOpenKillSwitch}
          className="w-full py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-red-600/20"
        >
          {risk?.isKillSwitchEngaged ? '⚠️ KILL SWITCH ENGAGED' : '🚨 EMERGENCY KILL SWITCH'}
        </button>
      </div>
    </div>
  );
};
