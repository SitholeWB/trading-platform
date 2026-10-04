import React, { useState, useEffect, useCallback } from 'react';
import { IChartApi, ISeriesApi } from 'lightweight-charts';
import { Position } from '../../types/trading';
import { calculatePips, formatPrice } from '../../utils/indicators';
import { X, Check, Edit3, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';

interface ChartTradeOverlayProps {
  positions: Position[];
  symbol: string;
  chart: IChartApi | null;
  series: ISeriesApi<any> | null;
  currentPrice: number;
  onClosePosition?: (ticket: number) => Promise<void>;
  onModifyPosition?: (ticket: number, stopLoss?: number, takeProfit?: number) => Promise<void>;
}

export const ChartTradeOverlay: React.FC<ChartTradeOverlayProps> = ({
  positions,
  symbol,
  chart,
  series,
  currentPrice,
  onClosePosition,
  onModifyPosition,
}) => {
  const [, setTick] = useState(0);

  // Subscribe to range/scroll changes to smoothly reposition price lines
  useEffect(() => {
    if (!chart) return;
    const update = () => setTick((t) => t + 1);
    chart.timeScale().subscribeVisibleLogicalRangeChange(update);
    return () => {
      try {
        chart.timeScale().unsubscribeVisibleLogicalRangeChange(update);
      } catch {}
    };
  }, [chart]);

  // Edit protection modal/popover state
  const [editingProtection, setEditingProtection] = useState<{
    ticket: number;
    stopLoss: string;
    takeProfit: string;
    orderType: string;
  } | null>(null);

  const getY = useCallback(
    (price: number): number | null => {
      if (!series || !price || isNaN(price)) return null;
      try {
        const coord = series.priceToCoordinate(price);
        return coord !== null && !isNaN(coord) ? Math.round(coord) : null;
      } catch {
        return null;
      }
    },
    [series]
  );

  const activePositions = positions.filter(
    (p) => p.symbol.toUpperCase() === symbol.toUpperCase() && p.status === 'Open'
  );

  const handleSaveProtection = async () => {
    if (!editingProtection || !onModifyPosition) return;
    const sl = editingProtection.stopLoss ? parseFloat(editingProtection.stopLoss) : undefined;
    const tp = editingProtection.takeProfit ? parseFloat(editingProtection.takeProfit) : undefined;
    await onModifyPosition(editingProtection.ticket, sl, tp);
    setEditingProtection(null);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden font-sans">
      {/* Interactive Position Overlays (Entry, Stop Loss, Take Profit lines & badges) */}
      {activePositions.map((pos) => {
        const yEntry = getY(pos.entryPrice);
        const ySL = pos.stopLossPrice ? getY(pos.stopLossPrice) : null;
        const yTP = pos.takeProfitPrice ? getY(pos.takeProfitPrice) : null;
        if (yEntry === null) return null;

        const isBuy = pos.orderType === 'Buy';
        const diff = isBuy ? currentPrice - pos.entryPrice : pos.entryPrice - currentPrice;
        const pips = calculatePips(diff, symbol);
        const isProfitable = diff >= 0;
        const signedPips = (pips >= 0 ? `+${pips}` : `${pips}`);
        const pnl = pos.unrealizedPnl !== 0
          ? pos.unrealizedPnl
          : diff * pos.lots * 100000;

        return (
          <React.Fragment key={pos.brokerTicketId}>
            {/* Visual Risk/Reward Shading Zone */}
            {yTP !== null && (
              <div
                className="absolute left-0 right-16 bg-emerald-500/10 border-l-4 border-emerald-500 pointer-events-none transition-all"
                style={{
                  top: Math.min(yEntry, yTP),
                  height: Math.abs(yTP - yEntry),
                }}
              />
            )}
            {ySL !== null && (
              <div
                className="absolute left-0 right-16 bg-red-500/10 border-l-4 border-red-500 pointer-events-none transition-all"
                style={{
                  top: Math.min(yEntry, ySL),
                  height: Math.abs(ySL - yEntry),
                }}
              />
            )}

            {/* Entry Line across chart */}
            <div
              className="absolute left-0 right-16 border-t border-dashed transition-all"
              style={{
                top: yEntry,
                borderColor: isBuy ? '#38bdf8' : '#fb923c',
              }}
            />

            {/* Entry Badge (Left side on chart) */}
            <div
              className="absolute left-4 -translate-y-1/2 pointer-events-auto flex items-center gap-1.5 bg-slate-950/90 border rounded-lg px-2 py-1 shadow-lg text-xs font-mono transition-all"
              style={{
                top: yEntry,
                borderColor: isBuy ? 'rgba(56, 189, 248, 0.5)' : 'rgba(251, 146, 60, 0.5)',
              }}
            >
              <span
                className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                  isBuy ? 'bg-sky-500 text-slate-950' : 'bg-orange-500 text-slate-950'
                }`}
              >
                {pos.orderType.toUpperCase()} {pos.lots}L
              </span>

              <span className="text-slate-200 font-bold">
                @{formatPrice(pos.entryPrice, symbol)}
              </span>

              <span
                className={`font-bold px-1.5 py-0.2 rounded ${
                  isProfitable ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}
              >
                {pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`} ({signedPips}p)
              </span>

              {/* Adjust SL/TP Button */}
              <button
                onClick={() =>
                  setEditingProtection({
                    ticket: pos.brokerTicketId,
                    stopLoss: pos.stopLossPrice?.toString() || '',
                    takeProfit: pos.takeProfitPrice?.toString() || '',
                    orderType: pos.orderType,
                  })
                }
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-blue-400 transition-colors"
                title="Adjust Stop Loss / Take Profit"
              >
                <Edit3 className="w-3 h-3" />
              </button>

              {/* Quick Close Position Button right on the line! */}
              {onClosePosition && (
                <button
                  onClick={() => onClosePosition(pos.brokerTicketId)}
                  className="px-1.5 py-0.5 rounded bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white text-[10px] font-sans font-bold transition-all flex items-center gap-0.5 ml-0.5"
                  title="Close Position Directly from Chart"
                >
                  <X className="w-3 h-3" />
                  <span>Close</span>
                </button>
              )}
            </div>

            {/* Stop Loss Line & Badge */}
            {pos.stopLossPrice && ySL !== null && (
              <>
                <div
                  className="absolute left-0 right-16 border-t border-dashed border-red-500/80 transition-all"
                  style={{ top: ySL }}
                />
                <div
                  className="absolute left-16 -translate-y-1/2 pointer-events-auto flex items-center gap-1.5 bg-red-950/90 border border-red-500/40 rounded-lg px-2 py-0.5 shadow-lg text-[11px] font-mono text-red-300 transition-all"
                  style={{ top: ySL }}
                >
                  <span className="font-bold text-red-400">SL</span>
                  <span>{formatPrice(pos.stopLossPrice, symbol)}</span>
                  <button
                    onClick={() =>
                      setEditingProtection({
                        ticket: pos.brokerTicketId,
                        stopLoss: '',
                        takeProfit: pos.takeProfitPrice?.toString() || '',
                        orderType: pos.orderType,
                      })
                    }
                    className="hover:text-white transition-colors"
                    title="Remove Stop Loss"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              </>
            )}

            {/* Take Profit Line & Badge */}
            {pos.takeProfitPrice && yTP !== null && (
              <>
                <div
                  className="absolute left-0 right-16 border-t border-dashed border-emerald-500/80 transition-all"
                  style={{ top: yTP }}
                />
                <div
                  className="absolute left-16 -translate-y-1/2 pointer-events-auto flex items-center gap-1.5 bg-emerald-950/90 border border-emerald-500/40 rounded-lg px-2 py-0.5 shadow-lg text-[11px] font-mono text-emerald-300 transition-all"
                  style={{ top: yTP }}
                >
                  <span className="font-bold text-emerald-400">TP</span>
                  <span>{formatPrice(pos.takeProfitPrice, symbol)}</span>
                  <button
                    onClick={() =>
                      setEditingProtection({
                        ticket: pos.brokerTicketId,
                        stopLoss: pos.stopLossPrice?.toString() || '',
                        takeProfit: '',
                        orderType: pos.orderType,
                      })
                    }
                    className="hover:text-white transition-colors"
                    title="Remove Take Profit"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              </>
            )}
          </React.Fragment>
        );
      })}

      {/* 3. Inline Protection Adjustment Dialog (Triggered when user clicks Edit on chart line) */}
      {editingProtection && (
        <div className="absolute inset-0 z-40 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 pointer-events-auto">
          <div className="w-full max-w-xs bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-2xl space-y-3 font-sans">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-100 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-blue-400" />
                <span>Adjust SL / TP (#Ticket {editingProtection.ticket})</span>
              </span>
              <button
                onClick={() => setEditingProtection(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Stop Loss (SL Price)
              </label>
              <input
                type="number"
                step="any"
                value={editingProtection.stopLoss}
                onChange={(e) =>
                  setEditingProtection({ ...editingProtection, stopLoss: e.target.value })
                }
                placeholder="Leave blank for none"
                className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Take Profit (TP Price)
              </label>
              <input
                type="number"
                step="any"
                value={editingProtection.takeProfit}
                onChange={(e) =>
                  setEditingProtection({ ...editingProtection, takeProfit: e.target.value })
                }
                placeholder="Leave blank for none"
                className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setEditingProtection(null)}
                className="flex-1 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProtection}
                className="flex-1 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
