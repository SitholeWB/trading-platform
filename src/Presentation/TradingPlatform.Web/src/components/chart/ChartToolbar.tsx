import React, { useState } from 'react';
import {
  Search,
  Maximize2,
  Minimize2,
  Camera,
  RefreshCw,
  ChevronDown,
  Split,
  History,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { ChartType, ChartLayoutMode } from './types';
import { Timeframe } from '../../types/trading';
import { Bell, Clock } from 'lucide-react';

interface ChartToolbarProps {
  symbol: string;
  onOpenSymbolSearch: () => void;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  chartType: ChartType;
  onChartTypeChange: (type: ChartType) => void;
  onOpenIndicatorsModal: () => void;
  activeIndicatorsCount: number;
  onOpenAlertsModal?: () => void;
  activeAlertsCount?: number;
  onFitContent: () => void;
  onTakeSnapshot: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  layoutMode: ChartLayoutMode;
  onLayoutModeChange: (mode: ChartLayoutMode) => void;
  currentPrice: number;
  priceChange: { diff: number; pct: number };
  // Quick order execution dock
  showOrderWidget?: boolean;
  onToggleOrderWidget?: () => void;
  // Historical pagination
  candlesCount?: number;
  isLoadingHistory?: boolean;
  onLoadOlderHistory?: () => void;
  hasMoreHistory?: boolean;
  historyNotice?: string | null;
  onDismissHistoryNotice?: () => void;
  // Live Feed Cadence & Server Protection
  secondsUntilSync?: number;
  isRefreshingCandles?: boolean;
  onManualSyncCandles?: () => void;
}

export const ChartToolbar: React.FC<ChartToolbarProps> = ({
  symbol,
  onOpenSymbolSearch,
  timeframe,
  onTimeframeChange,
  chartType,
  onChartTypeChange,
  onOpenIndicatorsModal,
  activeIndicatorsCount,
  onOpenAlertsModal,
  activeAlertsCount = 0,
  showOrderWidget = true,
  onToggleOrderWidget,
  onFitContent,
  onTakeSnapshot,
  isFullscreen,
  onToggleFullscreen,
  layoutMode,
  onLayoutModeChange,
  currentPrice,
  priceChange,
  candlesCount = 0,
  isLoadingHistory = false,
  onLoadOlderHistory,
  hasMoreHistory = true,
  historyNotice,
  onDismissHistoryNotice,
  secondsUntilSync,
  isRefreshingCandles = false,
  onManualSyncCandles,
}) => {
  const [showLayoutDropdown, setShowLayoutDropdown] = useState(false);

  const timeframes: { label: string; value: Timeframe }[] = [
    { label: '1m', value: 'M1' },
    { label: '5m', value: 'M5' },
    { label: '15m', value: 'M15' },
    { label: '30m', value: 'M30' },
    { label: '1h', value: 'H1' },
    { label: '4h', value: 'H4' },
    { label: '1D', value: 'D1' },
    { label: '1W', value: 'W1' },
    { label: '1M', value: 'MN1' },
  ];

  const chartTypes: { id: ChartType; label: string; icon: string; short: string }[] = [
    { id: 'candlestick', label: 'Candles', icon: '🕯️', short: 'Candle' },
    { id: 'heikin_ashi', label: 'Heikin Ashi', icon: '🏮', short: 'HA' },
    { id: 'bar', label: 'Bars', icon: '📊', short: 'Bar' },
    { id: 'line', label: 'Line', icon: '📈', short: 'Line' },
    { id: 'area', label: 'Area', icon: '🏔️', short: 'Area' },
    { id: 'baseline', label: 'Baseline', icon: '⚖️', short: 'Base' },
  ];

  const isPos = priceChange.pct >= 0;

  const getCategoryBadge = (sym: string): { label: string; color: string } => {
    const s = sym.toUpperCase();
    if (['US500', 'NAS100', 'US30', 'GER40', 'UK100', 'JP225', 'US2000', 'SPX'].includes(s) || s.startsWith('^')) {
      return { label: 'INDEX', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' };
    }
    if (['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT', 'LINKUSDT'].includes(s) || s.endsWith('USDT')) {
      return { label: 'CRYPTO', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
    }
    if (['XAUUSD', 'XAGUSD', 'USOIL', 'UKOIL', 'NATGAS', 'COPPER', 'GOLD', 'SILVER', 'OIL'].includes(s)) {
      return { label: 'COMM', color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' };
    }
    if (['AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMZN', 'GOOGL', 'META', 'AMD'].includes(s)) {
      return { label: 'STOCK', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
    }
    return { label: 'FX', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' };
  };

  const badge = getCategoryBadge(symbol);
  const formattedPrice = currentPrice >= 100
    ? currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : currentPrice > 10
    ? currentPrice.toFixed(3)
    : currentPrice.toFixed(5);

  return (
    <div className="relative">
      <div className="h-10 px-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs select-none flex-shrink-0 z-20">
        {/* Left Segment: Symbol Picker, Price Stats, Timeframes, 1-Click Chart Type Selector */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          {/* Symbol Search Button */}
          <button
            onClick={onOpenSymbolSearch}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-slate-100 font-bold transition-all group flex-shrink-0"
            title="Search or Browse Symbol / Pair (Shortcut: /)"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400" />
            <span className="font-mono text-sm tracking-wide">{symbol}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded border font-mono hidden sm:inline ${badge.color}`}>
              {badge.label}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Live Ticker Price & % Change */}
          <div className="hidden lg:flex items-center gap-1.5 font-mono text-xs px-2 border-r border-slate-800/80 flex-shrink-0">
            <span className="font-bold text-slate-200">{formattedPrice}</span>
            <span className={`text-[11px] font-semibold ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPos ? `+${priceChange.pct.toFixed(2)}%` : `${priceChange.pct.toFixed(2)}%`}
            </span>
          </div>

          {/* Timeframe Selector Bar */}
          <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800 flex-shrink-0">
            {timeframes.map((tf) => (
              <button
                key={tf.value}
                onClick={() => onTimeframeChange(tf.value)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
                  timeframe === tf.value
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Direct 1-Click Chart Style Switcher Buttons */}
          <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800 flex-shrink-0">
            {chartTypes.map((type) => {
              const isActive = chartType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => onChartTypeChange(type.id)}
                  className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title={`Switch to ${type.label}`}
                >
                  <span>{type.icon}</span>
                  <span className="hidden xl:inline">{type.short}</span>
                </button>
              );
            })}
          </div>

          {/* Indicators Dialog Trigger */}
          <button
            onClick={onOpenIndicatorsModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 font-bold transition-all flex-shrink-0"
          >
            <span className="italic font-serif font-black">fx</span>
            <span>Indicators</span>
            {activeIndicatorsCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-mono">
                {activeIndicatorsCount}
              </span>
            )}
          </button>

          {/* Price Level Alerts Dialog Trigger */}
          {onOpenAlertsModal && (
            <button
              onClick={onOpenAlertsModal}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold transition-all flex-shrink-0"
              title="Price Level Alerts & Chimes"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Alerts</span>
              {activeAlertsCount !== undefined && activeAlertsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center justify-center font-mono">
                  {activeAlertsCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Right Segment: Live Feed Cadence, Load History Button, Tools, Split View, Snapshot, Fullscreen, Reset */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Live Feed Cadence & Server Rate-Limit Protection Standout Badge */}
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-sans flex-shrink-0 group relative shadow-md transition-all border ${
              isRefreshingCandles
                ? 'bg-gradient-to-r from-blue-950/95 via-indigo-950/90 to-slate-900 border-blue-500/80 text-blue-200 shadow-blue-950/60'
                : secondsUntilSync !== undefined && secondsUntilSync <= 5
                ? 'bg-gradient-to-r from-amber-950/95 via-orange-950/90 to-slate-900 border-amber-400 text-amber-200 shadow-amber-950/60 animate-pulse'
                : 'bg-gradient-to-r from-emerald-950/90 via-slate-900 to-cyan-950/80 border-emerald-500/70 text-emerald-300 shadow-emerald-950/50'
            }`}
          >
            {/* Glowing Live / Radar Beacon */}
            <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isRefreshingCandles
                    ? 'bg-blue-400'
                    : secondsUntilSync !== undefined && secondsUntilSync <= 5
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isRefreshingCandles
                    ? 'bg-blue-500'
                    : secondsUntilSync !== undefined && secondsUntilSync <= 5
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
              />
            </span>

            {/* Standout Countdown / Syncing Label */}
            {isRefreshingCandles ? (
              <div className="flex items-center gap-1.5 font-semibold text-blue-200">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                <span className="tracking-tight">Refreshing prices now...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Clock
                  className={`w-3.5 h-3.5 flex-shrink-0 ${
                    secondsUntilSync !== undefined && secondsUntilSync <= 5
                      ? 'text-amber-300 animate-spin'
                      : 'text-emerald-400'
                  }`}
                />
                <span className="text-slate-200 font-medium tracking-tight whitespace-nowrap">
                  <span className="hidden sm:inline">Refresh prices in </span>
                  <span className="sm:hidden">Refresh in </span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md font-mono font-black text-xs tracking-wider shadow-inner border ${
                    secondsUntilSync !== undefined && secondsUntilSync <= 5
                      ? 'bg-amber-500/30 text-amber-100 border-amber-300 ring-1 ring-amber-400/50'
                      : 'bg-emerald-500/25 text-emerald-100 border-emerald-400/60 ring-1 ring-emerald-400/30'
                  }`}
                >
                  {secondsUntilSync !== undefined ? `${secondsUntilSync}s` : '60s'}
                </span>
              </div>
            )}

            {/* Instant Manual Refresh Trigger Button */}
            {onManualSyncCandles && (
              <button
                onClick={onManualSyncCandles}
                disabled={isRefreshingCandles}
                className={`ml-1 px-1.5 py-0.5 rounded-md border text-[10px] font-sans font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${
                  isRefreshingCandles
                    ? 'bg-slate-800/40 border-slate-700/50 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-500/20 hover:bg-emerald-500/35 border-emerald-400/50 text-emerald-200 hover:text-white shadow-sm hover:scale-105 active:scale-95 cursor-pointer'
                }`}
                title="Immediate Sync: Pull latest market tick & candles now (bypasses 60s cache)"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshingCandles ? 'animate-spin text-blue-400' : 'text-emerald-300'}`} />
                <span className="hidden md:inline">Sync</span>
              </button>
            )}

            {/* Rate-Limit / Server Load Protection Tooltip */}
            <div className="absolute top-10 right-0 hidden group-hover:block z-50 w-80 p-3 bg-slate-900/98 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl text-[11px] font-sans text-slate-300 pointer-events-none leading-relaxed">
              <div className="font-bold text-white flex items-center gap-1.5 mb-1 text-xs">
                <span className="text-emerald-400">●</span> 1-Minute Live Market Data Cadence
              </div>
              Prices, candles, and watchlist quotes refresh automatically every 60 seconds across all timeframes to avoid rate-limiting and protect exchange data feeds. Click <span className="text-emerald-400 font-semibold">Sync</span> to fetch immediate updates anytime.
            </div>
          </div>

          {/* Historical Data Loading Trigger */}
          {onLoadOlderHistory && (
            <button
              onClick={onLoadOlderHistory}
              disabled={isLoadingHistory || !hasMoreHistory}
              className={`px-2 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all border ${
                isLoadingHistory
                  ? 'bg-blue-900/30 border-blue-500/40 text-blue-300 animate-pulse'
                  : !hasMoreHistory
                  ? 'bg-slate-950/40 border-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
              }`}
              title={
                !hasMoreHistory
                  ? 'Earliest history reached for this timeframe'
                  : `Load older bars before earliest bar (Currently ${candlesCount} bars loaded)`
              }
            >
              {isLoadingHistory ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  <span className="hidden sm:inline">Loading...</span>
                </>
              ) : (
                <>
                  <History className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">
                    {!hasMoreHistory ? 'Earliest Reached' : `+Bars (${candlesCount})`}
                  </span>
                </>
              )}
            </button>
          )}

          {/* Layout Split Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowLayoutDropdown(!showLayoutDropdown)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Chart Split View Layout"
            >
              <Split className="w-4 h-4" />
            </button>

            {showLayoutDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowLayoutDropdown(false)}
                />
                <div className="absolute top-9 right-0 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 z-50 font-sans">
                  <button
                    onClick={() => {
                      onLayoutModeChange('single');
                      setShowLayoutDropdown(false);
                    }}
                    className={`w-full px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs text-left ${
                      layoutMode === 'single'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>[ 1 ]</span>
                    <span>Single Chart</span>
                  </button>
                  <button
                    onClick={() => {
                      onLayoutModeChange('split-v');
                      setShowLayoutDropdown(false);
                    }}
                    className={`w-full px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs text-left ${
                      layoutMode === 'split-v'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>[ | ]</span>
                    <span>Dual Vertical Split</span>
                  </button>
                  <button
                    onClick={() => {
                      onLayoutModeChange('split-h');
                      setShowLayoutDropdown(false);
                    }}
                    className={`w-full px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs text-left ${
                      layoutMode === 'split-h'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>[ = ]</span>
                    <span>Dual Horizontal Split</span>
                  </button>
                  <button
                    onClick={() => {
                      onLayoutModeChange('grid-4');
                      setShowLayoutDropdown(false);
                    }}
                    className={`w-full px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs text-left ${
                      layoutMode === 'grid-4'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>[ ⊞ ]</span>
                    <span>Quad 2x2 Grid (4 Timeframes)</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Quick Trade Dock Toggle */}
          {onToggleOrderWidget && (
            <button
              onClick={onToggleOrderWidget}
              className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                showOrderWidget
                  ? 'bg-blue-600/90 text-white shadow-sm ring-1 ring-blue-400/40'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
              title={showOrderWidget ? 'Hide 1-Click Order Dock' : 'Show 1-Click Order Dock'}
            >
              <span>⚡ Trade</span>
            </button>
          )}

          {/* Fit Content / Reset View */}
          <button
            onClick={onFitContent}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Reset Zoom / Fit Content (Auto)"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Take Snapshot / Screenshot */}
          <button
            onClick={onTakeSnapshot}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Save Chart Screenshot (PNG)"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={onToggleFullscreen}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* History Toast / Notice Notification Banner */}
      {historyNotice && (
        <div className="absolute top-11 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border border-amber-500/40 text-amber-300 px-4 py-2 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-mono backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>{historyNotice}</span>
          {onDismissHistoryNotice && (
            <button
              onClick={onDismissHistoryNotice}
              className="text-slate-400 hover:text-slate-200 ml-2"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
};
