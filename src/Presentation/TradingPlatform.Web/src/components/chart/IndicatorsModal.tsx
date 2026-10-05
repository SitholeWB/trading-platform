import React, { useState } from 'react';
import { X, Search, Check, Sliders, Eye, EyeOff } from 'lucide-react';
import { ActiveIndicators, IndicatorSettings } from './types';

interface IndicatorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeIndicators: ActiveIndicators;
  onToggleIndicator: (key: keyof ActiveIndicators) => void;
  settings: IndicatorSettings;
  onUpdateSettings: (settings: IndicatorSettings) => void;
}

export const IndicatorsModal: React.FC<IndicatorsModalProps> = ({
  isOpen,
  onClose,
  activeIndicators,
  onToggleIndicator,
  settings,
  onUpdateSettings,
}) => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'trend' | 'oscillators'>('all');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [localSettings, setLocalSettings] = useState<IndicatorSettings>(settings);

  if (!isOpen) return null;

  const indicatorList = [
    // Overlays
    {
      key: 'ema20' as keyof ActiveIndicators,
      name: 'EMA 20 (Exponential Moving Average)',
      category: 'trend',
      type: 'Overlay',
      desc: 'Fast 20-period trend follower and dynamic pullback support.',
      color: '#06b6d4',
    },
    {
      key: 'ema50' as keyof ActiveIndicators,
      name: 'EMA 50 (Exponential Moving Average)',
      category: 'trend',
      type: 'Overlay',
      desc: 'Intermediate 50-period trend filter for swing momentum.',
      color: '#f97316',
    },
    {
      key: 'ema200' as keyof ActiveIndicators,
      name: 'EMA 200 (Long-Term Trend Baseline)',
      category: 'trend',
      type: 'Overlay',
      desc: 'Institutional 200-period bull/bear macro trend demarcation.',
      color: '#a855f7',
    },
    {
      key: 'sma20' as keyof ActiveIndicators,
      name: 'SMA 20 (Simple Moving Average)',
      category: 'trend',
      type: 'Overlay',
      desc: 'Classic 20-period simple moving average.',
      color: '#3b82f6',
    },
    {
      key: 'bollinger' as keyof ActiveIndicators,
      name: 'Bollinger Bands (20, 2.0)',
      category: 'trend',
      type: 'Overlay',
      desc: 'Volatility channel with 2 standard deviations and mean reversion bands.',
      color: '#c084fc',
    },
    {
      key: 'vwap' as keyof ActiveIndicators,
      name: 'VWAP (Volume-Weighted Average Price)',
      category: 'trend',
      type: 'Overlay',
      desc: 'Intraday benchmark price representing true institutional volume weighting.',
      color: '#eab308',
    },
    {
      key: 'supertrend' as keyof ActiveIndicators,
      name: 'Supertrend (10, 3.0)',
      category: 'trend',
      type: 'Overlay',
      desc: 'Dynamic ATR-based trailing trend stop that flips bull/bear coloring.',
      color: '#10b981',
    },
    {
      key: 'ichimoku' as keyof ActiveIndicators,
      name: 'Ichimoku Cloud (9, 26, 52)',
      category: 'trend',
      type: 'Overlay',
      desc: 'Tenkan-sen, Kijun-sen, and Kumo Cloud equilibrium system.',
      color: '#818cf8',
    },
    // Oscillators
    {
      key: 'volume' as keyof ActiveIndicators,
      name: 'Volume & Volume MA',
      category: 'oscillators',
      type: 'Sub-Pane',
      desc: 'Tick/exchange transaction volume bars with moving average line.',
      color: '#64748b',
    },
    {
      key: 'rsi' as keyof ActiveIndicators,
      name: `RSI (${settings.rsiPeriod}) Relative Strength Index`,
      category: 'oscillators',
      type: 'Sub-Pane',
      desc: `Momentum oscillator with ${settings.rsiOversold}/${settings.rsiOverbought} overbought & oversold zones.`,
      color: '#f59e0b',
    },
    {
      key: 'macd' as keyof ActiveIndicators,
      name: `MACD (${settings.macdFast}, ${settings.macdSlow}, ${settings.macdSignal})`,
      category: 'oscillators',
      type: 'Sub-Pane',
      desc: 'Convergence-Divergence oscillator with 4-color momentum histogram.',
      color: '#06b6d4',
    },
    {
      key: 'stoch' as keyof ActiveIndicators,
      name: `Stochastic (${settings.stochK}, ${settings.stochD})`,
      category: 'oscillators',
      type: 'Sub-Pane',
      desc: '%K and %D lines measuring closing price relative to recent high-low range.',
      color: '#3b82f6',
    },
    {
      key: 'atr' as keyof ActiveIndicators,
      name: `ATR (${settings.atrPeriod}) Average True Range`,
      category: 'oscillators',
      type: 'Sub-Pane',
      desc: 'Market volatility measurement used for dynamic stop losses and target sizing.',
      color: '#ec4899',
    },
  ];

  const filtered = indicatorList.filter((item) => {
    const matchesTab = activeTab === 'all' || item.category === activeTab;
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.desc.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleSaveSettings = () => {
    onUpdateSettings(localSettings);
    setEditingKey(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-slate-100 font-sans">
              Technical Indicators & Oscillators
            </span>
            <span className="text-[10px] bg-blue-500/10 text-blue-400 font-mono px-2 py-0.5 rounded border border-blue-500/20">
              TradingView Spec
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Tabs */}
        <div className="p-3 border-b border-slate-800 bg-slate-900/40 flex flex-col sm:flex-row gap-2.5">
          <div className="flex-1 flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search indicators (e.g. RSI, MACD, EMA, Bollinger)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
            />
          </div>

          <div className="flex gap-1 text-xs font-sans">
            {[
              { id: 'all', label: 'All Indicators' },
              { id: 'trend', label: 'Trend Overlays' },
              { id: 'oscillators', label: 'Oscillators' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Indicators List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 font-sans">
          {filtered.map((item) => {
            const isActive = activeIndicators[item.key];
            const isEditing = editingKey === item.key;

            return (
              <div
                key={item.key}
                className={`p-3 rounded-xl transition-all ${
                  isActive ? 'bg-slate-800/40 border border-slate-700/50' : 'hover:bg-slate-800/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onToggleIndicator(item.key)}
                      className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-800 border border-slate-700 text-transparent hover:border-slate-500'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-bold text-sm text-slate-100">
                          {item.name}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                          {item.type}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Settings configuration trigger for customizable indicators */}
                    {['rsi', 'macd', 'bollinger', 'supertrend', 'stoch'].includes(item.key) && (
                      <button
                        onClick={() => setEditingKey(isEditing ? null : item.key)}
                        className={`p-1.5 rounded-lg text-xs transition-colors ${
                          isEditing
                            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                        title="Indicator Parameters"
                      >
                        <Sliders className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => onToggleIndicator(item.key)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-500'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {isActive ? 'Active' : '+ Add'}
                    </button>
                  </div>
                </div>

                {/* Inline Parameter Editing Form */}
                {isEditing && (
                  <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono space-y-2">
                    <div className="font-bold text-slate-300 mb-1">Tune Parameters:</div>

                    {item.key === 'rsi' && (
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400">Period</label>
                          <input
                            type="number"
                            value={localSettings.rsiPeriod}
                            onChange={(e) =>
                              setLocalSettings({ ...localSettings, rsiPeriod: Number(e.target.value) })
                            }
                            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400">Overbought</label>
                          <input
                            type="number"
                            value={localSettings.rsiOverbought}
                            onChange={(e) =>
                              setLocalSettings({ ...localSettings, rsiOverbought: Number(e.target.value) })
                            }
                            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400">Oversold</label>
                          <input
                            type="number"
                            value={localSettings.rsiOversold}
                            onChange={(e) =>
                              setLocalSettings({ ...localSettings, rsiOversold: Number(e.target.value) })
                            }
                            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                          />
                        </div>
                      </div>
                    )}

                    {item.key === 'macd' && (
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400">Fast EMA</label>
                          <input
                            type="number"
                            value={localSettings.macdFast}
                            onChange={(e) =>
                              setLocalSettings({ ...localSettings, macdFast: Number(e.target.value) })
                            }
                            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400">Slow EMA</label>
                          <input
                            type="number"
                            value={localSettings.macdSlow}
                            onChange={(e) =>
                              setLocalSettings({ ...localSettings, macdSlow: Number(e.target.value) })
                            }
                            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400">Signal</label>
                          <input
                            type="number"
                            value={localSettings.macdSignal}
                            onChange={(e) =>
                              setLocalSettings({ ...localSettings, macdSignal: Number(e.target.value) })
                            }
                            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                          />
                        </div>
                      </div>
                    )}

                    {item.key === 'bollinger' && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400">Period</label>
                          <input
                            type="number"
                            value={localSettings.bollingerPeriod}
                            onChange={(e) =>
                              setLocalSettings({ ...localSettings, bollingerPeriod: Number(e.target.value) })
                            }
                            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400">StdDev</label>
                          <input
                            type="number"
                            step="0.1"
                            value={localSettings.bollingerStdDev}
                            onChange={(e) =>
                              setLocalSettings({ ...localSettings, bollingerStdDev: Number(e.target.value) })
                            }
                            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setEditingKey(null)}
                        className="px-2.5 py-1 rounded text-slate-400 hover:text-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveSettings}
                        className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold"
                      >
                        Apply Parameters
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Opt-in Display Controls */}
        <div className="p-3 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-between text-xs font-sans">
          <div>
            <div className="text-slate-200 font-semibold flex items-center gap-2">
              <span>Show Indicator Tracking Lines & Scale Labels</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">Opt-in</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Display horizontal projection lines and axis badges for active overlay indicators
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const updated = {
                ...localSettings,
                showIndicatorPriceLines: !localSettings.showIndicatorPriceLines,
              };
              setLocalSettings(updated);
              onUpdateSettings(updated);
            }}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
              localSettings.showIndicatorPriceLines ? 'bg-blue-600' : 'bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                localSettings.showIndicatorPriceLines ? 'translate-x-4' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Active: {Object.values(activeIndicators).filter(Boolean).length} indicators</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
