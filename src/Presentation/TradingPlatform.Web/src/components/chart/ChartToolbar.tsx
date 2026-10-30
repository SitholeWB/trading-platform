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
  PanelLeft,
  Bell,
  Clock,
  Globe,
  Cpu,
} from 'lucide-react';
import { ChartType, ChartLayoutMode } from './types';
import { Timeframe } from '../../types/trading';

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
  // Collapsible Watchlist toggle
  isWatchlistCollapsed?: boolean;
  onToggleWatchlist?: () => void;
  // Chart Engine Mode: Native Bot Chart vs TradingView Live Widget
  chartEngine?: 'native' | 'tradingview';
  onChartEngineChange?: (engine: 'native' | 'tradingview') => void;
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
  isWatchlistCollapsed,
  onToggleWatchlist,
  chartEngine = 'native',
  onChartEngineChange,
}) => {
  const [showLayoutDropdown, setShowLayoutDropdown] = useState(false);
  const [showChartTypeDropdown, setShowChartTypeDropdown] = useState(false);
  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState(false);

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
  const currentChartType = chartTypes.find((t) => t.id === chartType) || chartTypes[0];
  const formattedPrice = currentPrice >= 100
    ? currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : currentPrice > 10
    ? currentPrice.toFixed(3)
    : currentPrice.toFixed(5);

  return (
    <div className="relative">
      <div className="h-10 px-2 sm:px-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs select-none flex-shrink-0 z-20">
        {/* Left Segment: Watchlist Toggle, Symbol Picker, Timeframes, Chart Styles, Indicators, Alerts */}
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 overflow-x-auto scrollbar-none py-1 min-w-0">
          {/* Toggle Watchlist Button (reclaims sidebar width on small screens) */}
          {onToggleWatchlist && (
            <button
              onClick={onToggleWatchlist}
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all flex-shrink-0 cursor-pointer ${
                isWatchlistCollapsed
                  ? 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
                  : 'bg-blue-600/20 text-blue-300 border-blue-500/40'
              }`}
              title={isWatchlistCollapsed ? 'Show Watchlist Sidebar' : 'Collapse Watchlist Sidebar'}
            >
              <PanelLeft className="w-3.5 h-3.5" />
              <span className="hidden xl:inline text-[11px] font-sans font-medium">Watchlist</span>
            </button>
          )}

          {/* Symbol Search Button */}
          <button
            onClick={onOpenSymbolSearch}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-slate-100 font-bold transition-all group flex-shrink-0 cursor-pointer"
            title="Search or Browse Symbol / Pair (Shortcut: /)"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400" />
            <span className="font-mono text-xs sm:text-sm tracking-wide">{symbol}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded border font-mono hidden md:inline ${badge.color}`}>
              {badge.label}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Timeframe Selector Bar - Priority #1 right next to symbol, guaranteed never hidden */}
          {/* Mobile / Narrow Screen Dropdown (< sm) */}
          <div className="relative sm:hidden flex-shrink-0">
            <button
              onClick={() => setShowTimeframeDropdown(!showTimeframeDropdown)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-600 text-white font-mono font-bold text-xs shadow-sm cursor-pointer"
              title="Select Timeframe"
            >
              <Clock className="w-3 h-3 text-blue-200" />
              <span>{timeframe}</span>
              <ChevronDown className="w-3 h-3 text-blue-200" />
            </button>
            {showTimeframeDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowTimeframeDropdown(false)}
                />
                <div className="absolute top-9 left-0 w-36 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 z-50 font-mono text-xs">
                  {timeframes.map((tf) => (
                    <button
                      key={tf.value}
                      onClick={() => {
                        onTimeframeChange(tf.value);
                        setShowTimeframeDropdown(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left transition-colors cursor-pointer ${
                        timeframe === tf.value
                          ? 'bg-blue-600 text-white font-bold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{tf.label}</span>
                      <span className="text-[10px] text-slate-400">{tf.value}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Tablet & Desktop Timeframe Selector Bar (>= sm) */}
          <div className="hidden sm:flex items-center gap-0.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800 flex-shrink-0">
            {timeframes.map((tf) => (
              <button
                key={tf.value}
                onClick={() => onTimeframeChange(tf.value)}
                className={`px-1.5 md:px-2 py-0.5 rounded text-[11px] font-mono transition-all cursor-pointer ${
                  timeframe === tf.value
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Direct Chart Style Switcher: Compact Dropdown on < 2xl, Full bar on 2xl+ */}
          {/* Dropdown (< 2xl) */}
          <div className="relative 2xl:hidden flex-shrink-0">
            <button
              onClick={() => setShowChartTypeDropdown(!showChartTypeDropdown)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-200 text-xs transition-all cursor-pointer"
              title={`Chart Type: ${currentChartType.label}`}
            >
              <span>{currentChartType.icon}</span>
              <span className="hidden md:inline font-mono text-[11px]">{currentChartType.short}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {showChartTypeDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowChartTypeDropdown(false)}
                />
                <div className="absolute top-9 left-0 w-40 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 z-50 font-sans text-xs">
                  {chartTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => {
                        onChartTypeChange(type.id);
                        setShowChartTypeDropdown(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-left transition-colors cursor-pointer ${
                        chartType === type.id
                          ? 'bg-blue-600 text-white font-bold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{type.icon}</span>
                      <span>{type.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Full Bar (>= 2xl) */}
          <div className="hidden 2xl:flex items-center gap-0.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800 flex-shrink-0">
            {chartTypes.map((type) => {
              const isActive = chartType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => onChartTypeChange(type.id)}
                  className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title={`Switch to ${type.label}`}
                >
                  <span>{type.icon}</span>
                  <span>{type.short}</span>
                </button>
              );
            })}
          </div>

          {/* Indicators Dialog Trigger */}
          <button
            onClick={onOpenIndicatorsModal}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 font-bold transition-all flex-shrink-0 cursor-pointer"
            title="Technical Indicators (fx)"
          >
            <span className="italic font-serif font-black">fx</span>
            <span className="hidden lg:inline">Indicators</span>
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
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold transition-all flex-shrink-0 cursor-pointer"
              title="Price Level Alerts & Chimes"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">Alerts</span>
              {activeAlertsCount !== undefined && activeAlertsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center justify-center font-mono">
                  {activeAlertsCount}
                </span>
              )}
            </button>
          )}

          {/* Live Ticker Price & % Change (Only when room permits on wide screens) */}
          <div className="hidden xl:flex items-center gap-1.5 font-mono text-xs px-2 border-l border-slate-800/80 flex-shrink-0">
            <span className="font-bold text-slate-200">{formattedPrice}</span>
            <span className={`text-[11px] font-semibold ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPos ? `+${priceChange.pct.toFixed(2)}%` : `${priceChange.pct.toFixed(2)}%`}
            </span>
          </div>
        </div>

        {/* Right Segment: Chart Engine Switcher, Load History, Split, Trade, Tools */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          {/* Segmented Toggle: Native Bot Chart vs TradingView Live Widget */}
          {onChartEngineChange && (
            <div
              className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 flex-shrink-0"
              title="Switch between Native Algorithmic Bot Chart and Official TradingView Live Widget"
            >
              <button
                type="button"
                onClick={() => onChartEngineChange('native')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-sans font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  chartEngine === 'native'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Native Bot Chart (Supports Bot Signals, Position SL/TP Dragging & Custom Drawings)"
              >
                <Cpu className="w-3 h-3 flex-shrink-0" />
                <span className="hidden md:inline">Bot Chart</span>
              </button>
              <button
                type="button"
                onClick={() => onChartEngineChange('tradingview')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-sans font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  chartEngine === 'tradingview'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="TradingView Live Widget (Direct Real-Time TradingView Feed & Built-in Studies)"
              >
                <Globe className="w-3 h-3 flex-shrink-0" />
                <span className="hidden md:inline">TradingView Live</span>
              </button>
            </div>
          )}

          {/* Historical Data Loading Trigger */}
          {chartEngine === 'native' && onLoadOlderHistory && (
            <button
              onClick={onLoadOlderHistory}
              disabled={isLoadingHistory || !hasMoreHistory}
              className={`px-2 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all border cursor-pointer ${
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
                  <span className="hidden 2xl:inline">Loading...</span>
                </>
              ) : (
                <>
                  <History className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden 2xl:inline">
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
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
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
                    className={`w-full px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs text-left cursor-pointer ${
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
                    className={`w-full px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs text-left cursor-pointer ${
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
                    className={`w-full px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs text-left cursor-pointer ${
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
                    className={`w-full px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs text-left cursor-pointer ${
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
              className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                showOrderWidget
                  ? 'bg-blue-600/90 text-white shadow-sm ring-1 ring-blue-400/40'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
              title={showOrderWidget ? 'Hide 1-Click Order Dock' : 'Show 1-Click Order Dock'}
            >
              <span>⚡</span>
              <span className="hidden md:inline">Trade</span>
            </button>
          )}

          {/* Fit Content / Reset View */}
          <button
            onClick={onFitContent}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Reset Zoom / Fit Content (Auto)"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Take Snapshot / Screenshot */}
          <button
            onClick={onTakeSnapshot}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Save Chart Screenshot (PNG)"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={onToggleFullscreen}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
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
