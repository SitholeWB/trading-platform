import React, { useState } from 'react';
import { Bell, Plus, Trash2, X, Check, Volume2 } from 'lucide-react';
import { ChartAlert } from './types';
import { formatPrice } from '../../utils/indicators';

interface ChartAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  currentPrice: number;
  alerts: ChartAlert[];
  onCreateAlert: (alert: ChartAlert) => void;
  onDeleteAlert: (id: string) => void;
  onTestSound?: () => void;
}

export const ChartAlertsModal: React.FC<ChartAlertsModalProps> = ({
  isOpen,
  onClose,
  symbol,
  currentPrice,
  alerts,
  onCreateAlert,
  onDeleteAlert,
  onTestSound,
}) => {
  const [targetPrice, setTargetPrice] = useState<string>(
    currentPrice > 0 ? (currentPrice * 1.0015).toFixed(currentPrice >= 100 ? 2 : 5) : '1.08500'
  );
  const [condition, setCondition] = useState<'crosses_above' | 'crosses_below' | 'crosses_any'>('crosses_above');
  const [label, setLabel] = useState<string>('');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(targetPrice);
    if (isNaN(p) || p <= 0) return;

    const newAlert: ChartAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      symbol: symbol.toUpperCase(),
      targetPrice: p,
      condition,
      label: label.trim() || `${symbol} ${condition.replace('_', ' ')} ${p}`,
      createdAt: Date.now(),
      triggered: false,
    };

    onCreateAlert(newAlert);
    setLabel('');
  };

  const symbolAlerts = alerts.filter((a) => a.symbol === symbol.toUpperCase());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <span>Price Level Alerts</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  {symbol}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Current Price: <span className="font-mono font-bold text-slate-200">{formatPrice(currentPrice, symbol)}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {onTestSound && (
              <button
                onClick={onTestSound}
                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                title="Test Alert Chime"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* New Alert Form */}
          <form onSubmit={handleCreate} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>Create New Alert</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Target Price</label>
                <input
                  type="number"
                  step="any"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="e.g. 1.08500"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Trigger Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="crosses_above">Crosses Above (↑)</option>
                  <option value="crosses_below">Crosses Below (↓)</option>
                  <option value="crosses_any">Crosses Level (Any)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Note / Label (Optional)</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Resistance Breakout / Take Profit zone"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-600/30"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Set Alert at {targetPrice}</span>
            </button>
          </form>

          {/* Active Alerts for this symbol */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300">
                Active Alerts for {symbol} ({symbolAlerts.length})
              </span>
              <span className="text-[10px] text-slate-500">Auto-triggers chime and toast banner</span>
            </div>

            {symbolAlerts.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                No active alerts set for {symbol}. Create one above to track key breakout levels!
              </div>
            ) : (
              <div className="space-y-2">
                {symbolAlerts.map((alt) => (
                  <div
                    key={alt.id}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      alt.triggered
                        ? 'bg-amber-950/20 border-amber-500/30 text-slate-300'
                        : 'bg-slate-950 border-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                          alt.triggered
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {alt.triggered ? <Check className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-amber-300">
                            {formatPrice(alt.targetPrice, symbol)}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                            {alt.condition === 'crosses_above'
                              ? 'Cross Above'
                              : alt.condition === 'crosses_below'
                              ? 'Cross Below'
                              : 'Cross Level'}
                          </span>
                          {alt.triggered && (
                            <span className="text-[10px] font-bold text-emerald-400 uppercase">
                              Triggered!
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{alt.label}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteAlert(alt.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete Alert"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
