import React from 'react';
import { Position } from '../types/trading';

interface PositionsManagerProps {
  positions: Position[];
  onClosePosition: (ticket: number) => Promise<void>;
}

export const PositionsManager: React.FC<PositionsManagerProps> = ({
  positions,
  onClosePosition,
}) => {
  const openPositions = positions.filter((p) => p.status === 'Open');
  const closedPositions = positions.filter((p) => p.status === 'Closed');

  const totalPnl = openPositions.reduce((sum, p) => sum + (p.unrealizedPnl || 0), 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-full font-mono text-xs">
      {/* Header Bar */}
      <div className="h-12 px-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-bold text-sm text-slate-100 font-sans">Active Positions & Execution Ledger</span>
          <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
            {openPositions.length} Open
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px]">Unrealized Total:</span>
          <span
            className={`font-bold font-mono text-sm ${
              totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {totalPnl >= 0 ? `+$${totalPnl.toFixed(2)}` : `-$${Math.abs(totalPnl).toFixed(2)}`}
          </span>
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto">
        {openPositions.length === 0 ? (
          <div className="text-center text-slate-500 py-16 text-xs">
            No active positions open. Automated scanning active...
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Ticket</th>
                <th className="py-2.5 px-3">Symbol</th>
                <th className="py-2.5 px-3">Side</th>
                <th className="py-2.5 px-3">Lots</th>
                <th className="py-2.5 px-3">Entry Price</th>
                <th className="py-2.5 px-3">Mark Price</th>
                <th className="py-2.5 px-3">SL / TP</th>
                <th className="py-2.5 px-3 text-right">Floating PnL</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {openPositions.map((pos) => {
                const isBuy = pos.orderType === 'Buy';
                const pnl = pos.unrealizedPnl || 0;
                return (
                  <tr key={pos.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-3 text-slate-400">#{pos.brokerTicketId}</td>
                    <td className="py-2 px-3 font-bold text-slate-200">{pos.symbol}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isBuy
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {pos.orderType.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-300">{pos.lots.toFixed(2)}</td>
                    <td className="py-2 px-3 text-slate-300">{pos.entryPrice.toFixed(5)}</td>
                    <td className="py-2 px-3 text-slate-200 font-bold">{pos.currentPrice.toFixed(5)}</td>
                    <td className="py-2 px-3 text-[11px] text-slate-400">
                      SL: {pos.stopLossPrice?.toFixed(5) ?? 'None'} | TP: {pos.takeProfitPrice?.toFixed(5) ?? 'None'}
                    </td>
                    <td
                      className={`py-2 px-3 text-right font-bold ${
                        pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => onClosePosition(pos.brokerTicketId)}
                        className="px-2.5 py-1 rounded bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-bold text-[10px] transition-colors"
                      >
                        Close
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
