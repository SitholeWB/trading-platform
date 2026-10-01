import React, { useState } from 'react';
import { SignalAuditLog, SignalState } from '../types/trading';

interface NearMissRadarProps {
  logs: SignalAuditLog[];
}

export const NearMissRadar: React.FC<NearMissRadarProps> = ({ logs }) => {
  const [filter, setFilter] = useState<string>('All');
  const [selectedLog, setSelectedLog] = useState<SignalAuditLog | null>(null);

  const filteredLogs = logs.filter((log) => {
    if (filter === 'All') return true;
    return log.state === filter;
  });

  const getStateBadge = (state: SignalState) => {
    switch (state) {
      case 'Dispatched':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'FullyMet':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'NearMiss':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'RejectedByRisk':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const parseDetails = (json: string) => {
    try {
      return JSON.parse(json);
    } catch {
      return { raw: json };
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-full font-mono">
      {/* Top Filter Bar */}
      <div className="h-12 px-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-slate-100 font-sans">Near-Miss & Signal Auditing Radar</span>
          <span className="text-xs text-slate-400">({filteredLogs.length} events)</span>
        </div>

        {/* Filter Pills */}
        <div className="flex bg-slate-800/80 p-0.5 rounded text-xs">
          {['All', 'NearMiss', 'FullyMet', 'Dispatched', 'RejectedByRisk'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-2.5 py-1 rounded transition-colors text-[11px] ${
                filter === st
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3">
        {/* Signal Table */}
        <div className="lg:col-span-2 overflow-y-auto border-r border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Timestamp (UTC)</th>
                <th className="py-2.5 px-3">Symbol</th>
                <th className="py-2.5 px-3">TF</th>
                <th className="py-2.5 px-3">State</th>
                <th className="py-2.5 px-3">Fingerprint</th>
                <th className="py-2.5 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.map((log) => {
                const isSelected = selectedLog?.id === log.id;
                return (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-600/10' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-2 px-3 text-slate-400 text-[11px]">
                      {new Date(log.createdAtUtc).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-200">{log.symbol}</td>
                    <td className="py-2 px-3 text-slate-400">{log.timeframe}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getStateBadge(log.state)}`}>
                        {log.state}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-500 text-[10px] truncate max-w-[140px]" title={log.signalFingerprint}>
                      {log.signalFingerprint}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button className="text-blue-400 hover:text-blue-300 font-bold text-[11px]">
                        Inspect →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Signal Inspection Drawer */}
        <div className="bg-slate-950/80 p-4 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">
              Signal Forensic Telemetry
            </span>
            {selectedLog && (
              <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getStateBadge(selectedLog.state)}`}>
                {selectedLog.state}
              </span>
            )}
          </div>

          {selectedLog ? (
            <div className="space-y-3 text-xs">
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Idempotency Fingerprint</div>
                <div className="text-[11px] text-slate-300 bg-slate-900 p-2 rounded border border-slate-800 break-all select-all font-mono">
                  {selectedLog.signalFingerprint}
                </div>
              </div>

              {/* Parsed Near-Miss Details */}
              {(() => {
                const details = parseDetails(selectedLog.evaluationDetailsJson);
                const passRatio = details.PassRatio != null ? details.PassRatio * 100 : null;

                return (
                  <div className="space-y-3">
                    {passRatio != null && (
                      <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                        <div className="flex items-center justify-between text-[11px] mb-1.5">
                          <span className="text-slate-400 font-bold">Near-Miss Satisfaction Score:</span>
                          <span className={`font-mono font-bold ${passRatio >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {passRatio.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              passRatio >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, passRatio)}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          Passed: {details.PassedRules ?? 0} / Total: {details.TotalRules ?? 0} conditions
                        </div>
                      </div>
                    )}

                    {/* Failed Rules Breakdown */}
                    {details.FailedRules && details.FailedRules.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                          Failed Condition Diagnostic
                        </div>
                        {details.FailedRules.map((f: any, i: number) => (
                          <div key={i} className="bg-red-950/20 border border-red-900/40 p-2 rounded text-[11px]">
                            <div className="font-bold text-red-300">{f.RuleName || `Rule ${i + 1}`}</div>
                            <div className="text-slate-400 text-[10px] mt-0.5">{f.Expression}</div>
                            <div className="text-amber-300/80 text-[10px] mt-1 font-mono">{f.FailureReason}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Market Snapshot Indicator Values */}
                    {details.SnapshotFeatures && (
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Snapshot State</div>
                        <div className="grid grid-cols-2 gap-1.5 text-[10px] bg-slate-900 p-2 rounded border border-slate-800">
                          <div>Close: <span className="text-slate-200">{details.SnapshotFeatures.Close}</span></div>
                          <div>RSI: <span className="text-amber-400">{details.SnapshotFeatures.Rsi14 ?? 'N/A'}</span></div>
                          <div>EMA 20: <span className="text-cyan-400">{details.SnapshotFeatures.Ema20 ?? 'N/A'}</span></div>
                          <div>EMA 50: <span className="text-orange-400">{details.SnapshotFeatures.Ema50 ?? 'N/A'}</span></div>
                          <div>EMA 200: <span className="text-purple-400">{details.SnapshotFeatures.Ema200 ?? 'N/A'}</span></div>
                          <div>ATR: <span className="text-slate-200">{details.SnapshotFeatures.Atr14 ?? 'N/A'}</span></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="text-center text-slate-500 py-12 text-xs">
              Select any audit event from the radar table to view near-miss analysis and condition metrics.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
