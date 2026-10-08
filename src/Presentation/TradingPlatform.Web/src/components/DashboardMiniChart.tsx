import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  ColorType,
  CrosshairMode,
  UTCTimestamp,
} from 'lightweight-charts';
import { Candle, Timeframe } from '../types/trading';
import {
  getCandleTimeSeconds,
  sanitizeCandles,
  calculateEMA,
  formatPrice,
  getSymbolPriceFormat,
} from '../utils/indicators';
import { tradingApi } from '../api/tradingClient';
import {
  Maximize2,
  ExternalLink,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Layers,
  PenTool,
  Activity,
  BarChart2,
  ArrowRight,
  Shield,
  Eye,
} from 'lucide-react';

interface DashboardMiniChartProps {
  candles?: Candle[];
  selectedSymbol: string;
  timeframe?: Timeframe;
  currentPrice: number;
  onNavigateToChart: (symbol?: string, tf?: Timeframe) => void;
  onSelectSymbol?: (symbol: string) => void;
  onSelectTimeframe?: (tf: Timeframe) => void;
}

const POPULAR_SYMBOLS = [
  { symbol: 'EURUSD', label: 'EUR/USD', category: 'Forex' },
  { symbol: 'GBPUSD', label: 'GBP/USD', category: 'Forex' },
  { symbol: 'USDJPY', label: 'USD/JPY', category: 'Forex' },
  { symbol: 'BTCUSD', label: 'BTC/USD', category: 'Crypto' },
  { symbol: 'ETHUSD', label: 'ETH/USD', category: 'Crypto' },
  { symbol: 'XAUUSD', label: 'Gold Spot', category: 'Commodity' },
  { symbol: 'US500', label: 'S&P 500', category: 'Index' },
];

const QUICK_TIMEFRAMES: { label: string; value: Timeframe }[] = [
  { label: 'M1', value: 'M1' },
  { label: 'M5', value: 'M5' },
  { label: 'M15', value: 'M15' },
  { label: 'M30', value: 'M30' },
  { label: 'H1', value: 'H1' },
  { label: 'H4', value: 'H4' },
  { label: 'D1', value: 'D1' },
  { label: 'W1', value: 'W1' },
  { label: 'MN1', value: 'MN1' },
];

export const DashboardMiniChart: React.FC<DashboardMiniChartProps> = ({
  candles: propCandles,
  selectedSymbol,
  timeframe = 'M5',
  currentPrice: propPrice,
  onNavigateToChart,
  onSelectSymbol,
  onSelectTimeframe,
}) => {
  const [activeSymbol, setActiveSymbol] = useState(selectedSymbol);
  const [activeTf, setActiveTf] = useState<Timeframe>(timeframe);
  const [chartType, setChartType] = useState<'candle' | 'area'>('candle');
  const [localCandles, setLocalCandles] = useState<Candle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const areaSeriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const emaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  // Synchronize when parent prop changes
  useEffect(() => {
    setActiveSymbol(selectedSymbol);
  }, [selectedSymbol]);

  useEffect(() => {
    setActiveTf(timeframe);
  }, [timeframe]);

  // Determine active candles: use props if matching active symbol/tf, otherwise use local fetched
  const isUsingPropCandles = activeSymbol === selectedSymbol && propCandles && propCandles.length > 0;
  const rawCandles = isUsingPropCandles ? propCandles! : localCandles;
  const sanitized = useMemo(() => sanitizeCandles(rawCandles), [rawCandles]);

  // Fetch local candles when activeSymbol or activeTf differs from props
  useEffect(() => {
    if (activeSymbol === selectedSymbol && propCandles && propCandles.length > 0) {
      return;
    }
    let isCancelled = false;
    const loadCandles = async () => {
      setIsLoading(true);
      try {
        const fetched = await tradingApi.getCandles(activeSymbol, activeTf, 100);
        if (!isCancelled && fetched && fetched.length > 0) {
          setLocalCandles(fetched);
        }
      } catch (err) {
        console.warn('[DashboardMiniChart] Failed to load candles for', activeSymbol, err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    loadCandles();
    return () => {
      isCancelled = true;
    };
  }, [activeSymbol, activeTf, selectedSymbol, propCandles]);

  // Stats calculation
  const lastCandle = sanitized.length > 0 ? sanitized[sanitized.length - 1] : null;
  const firstCandle = sanitized.length > 0 ? sanitized[0] : null;
  const currentPrice = lastCandle ? lastCandle.close : propPrice;
  const openPrice = firstCandle ? firstCandle.open : currentPrice;
  const priceDelta = currentPrice - openPrice;
  const percentDelta = openPrice !== 0 ? (priceDelta / openPrice) * 100 : 0;
  const isPositive = priceDelta >= 0;

  const highPrice = useMemo(
    () => (sanitized.length > 0 ? Math.max(...sanitized.map((c) => c.high)) : currentPrice),
    [sanitized, currentPrice]
  );
  const lowPrice = useMemo(
    () => (sanitized.length > 0 ? Math.min(...sanitized.map((c) => c.low)) : currentPrice),
    [sanitized, currentPrice]
  );

  // Initialize and mount Lightweight Chart
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch {}
      chartRef.current = null;
    }

    const chart = createChart(container, {
      width: container.clientWidth || 600,
      height: container.clientHeight || 260,
      layout: {
        background: { type: ColorType.Solid, color: '#090e1a' },
        textColor: '#64748b',
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.35)' },
        horzLines: { color: 'rgba(30, 41, 59, 0.35)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        scaleMargins: {
          top: 0.1,
          bottom: 0.15,
        },
      },
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    });

    chartRef.current = chart;

    // Volume histogram on bottom 20%
    const volumeSeries = chart.addHistogramSeries({
      color: 'rgba(59, 130, 246, 0.25)',
      priceFormat: { type: 'volume' },
      priceScaleId: '', // overlay
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries;

    // EMA 20 line
    const samplePrice = sanitized.length > 0 ? sanitized[sanitized.length - 1].close : undefined;
    const priceFormatConfig = getSymbolPriceFormat(activeSymbol, samplePrice);

    const emaSeries = chart.addLineSeries({
      color: '#38bdf8',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
      title: 'EMA 20',
      priceFormat: priceFormatConfig,
    });
    emaSeriesRef.current = emaSeries;

    // Main Price Series (Candles or Area)
    if (chartType === 'candle') {
      const candleSeries = chart.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
        priceFormat: priceFormatConfig,
      });
      candleSeriesRef.current = candleSeries;
      areaSeriesRef.current = null;
    } else {
      const areaSeries = chart.addAreaSeries({
        topColor: isPositive ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)',
        bottomColor: 'rgba(15, 23, 42, 0.0)',
        lineColor: isPositive ? '#10b981' : '#ef4444',
        lineWidth: 2,
        priceFormat: priceFormatConfig,
      });
      areaSeriesRef.current = areaSeries;
      candleSeriesRef.current = null;
    }

    // Clicking anywhere on the chart triggers navigation to full chart
    chart.subscribeClick(() => {
      handleOpenFullChart();
    });

    // Responsive auto-resizing
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      if (chartRef.current && width > 0 && height > 0) {
        chartRef.current.applyOptions({ width, height });
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      try {
        chart.remove();
      } catch {}
      chartRef.current = null;
    };
  }, [chartType]);

  // Update chart data whenever sanitized candles change
  useEffect(() => {
    if (!chartRef.current || sanitized.length === 0) return;

    const samplePrice = sanitized.length > 0 ? sanitized[sanitized.length - 1].close : undefined;
    const priceFormatConfig = getSymbolPriceFormat(activeSymbol, samplePrice);
    if (candleSeriesRef.current) candleSeriesRef.current.applyOptions({ priceFormat: priceFormatConfig });
    if (areaSeriesRef.current) areaSeriesRef.current.applyOptions({ priceFormat: priceFormatConfig });
    if (emaSeriesRef.current) emaSeriesRef.current.applyOptions({ priceFormat: priceFormatConfig });

    // 1. Volume data
    if (volumeSeriesRef.current) {
      const volData = sanitized.map((c) => ({
        time: getCandleTimeSeconds(c.timestamp) as UTCTimestamp,
        value: c.volume ?? 100,
        color: c.close >= c.open ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)',
      }));
      volumeSeriesRef.current.setData(volData);
    }

    // 2. EMA 20 line
    if (emaSeriesRef.current && sanitized.length >= 20) {
      const emaData = calculateEMA(sanitized, 20).map((p) => ({
        time: p.time as UTCTimestamp,
        value: p.value,
      }));
      emaSeriesRef.current.setData(emaData);
    }

    // 3. Price series
    if (chartType === 'candle' && candleSeriesRef.current) {
      const candleData = sanitized.map((c) => ({
        time: getCandleTimeSeconds(c.timestamp) as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));
      candleSeriesRef.current.setData(candleData);
    } else if (chartType === 'area' && areaSeriesRef.current) {
      const areaData = sanitized.map((c) => ({
        time: getCandleTimeSeconds(c.timestamp) as UTCTimestamp,
        value: c.close,
      }));
      areaSeriesRef.current.setData(areaData);
    }

    // Fit content
    try {
      chartRef.current.timeScale().fitContent();
    } catch {}
  }, [sanitized, chartType]);

  const handleOpenFullChart = () => {
    onSelectSymbol?.(activeSymbol);
    onSelectTimeframe?.(activeTf);
    onNavigateToChart(activeSymbol, activeTf);
  };

  const handleSelectQuickSymbol = (sym: string) => {
    setActiveSymbol(sym);
    onSelectSymbol?.(sym);
  };

  const handleSelectQuickTf = (tf: Timeframe) => {
    setActiveTf(tf);
    onSelectTimeframe?.(tf);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl shadow-black/50 transition-all hover:border-slate-700">
      {/* 1. Header Bar: Symbol Telemetry + Quick Controls + Prominent CTA */}
      <div className="p-3.5 pb-2.5 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Symbol & Live Pricing */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white font-mono tracking-wider flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              {activeSymbol}
            </span>
            <span className="text-[10px] bg-blue-600/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-md font-mono font-bold uppercase">
              {POPULAR_SYMBOLS.find((s) => s.symbol === activeSymbol)?.category ?? 'Market'}
            </span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono font-semibold">
              {activeTf}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          {/* Real-time price & delta */}
          <div className="flex items-baseline gap-2 font-mono">
            <span className="text-lg font-bold text-slate-100">
              {formatPrice(currentPrice, activeSymbol)}
            </span>
            <span
              className={`text-xs font-bold flex items-center gap-0.5 ${
                isPositive ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isPositive ? '+' : ''}
              {formatPrice(priceDelta, activeSymbol)} ({isPositive ? '+' : ''}
              {percentDelta.toFixed(2)}%)
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-3 text-[11px] font-mono text-slate-400 pl-2">
            <span>
              H: <strong className="text-slate-200">{formatPrice(highPrice, activeSymbol)}</strong>
            </span>
            <span>
              L: <strong className="text-slate-200">{formatPrice(lowPrice, activeSymbol)}</strong>
            </span>
          </div>
        </div>

        {/* Right: Quick Style Toggle & High-Visibility Advanced Chart CTA */}
        <div className="flex items-center gap-2">
          {/* Quick Chart Style Toggle */}
          <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px] font-sans">
            <button
              onClick={() => setChartType('candle')}
              className={`px-2 py-1 rounded transition-colors ${
                chartType === 'candle'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Candles
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`px-2 py-1 rounded transition-colors ${
                chartType === 'area'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Area
            </button>
          </div>

          {/* High-Visibility Primary Call to Action */}
          <button
            onClick={handleOpenFullChart}
            title="Launch full-screen institutional charting terminal"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all group border border-blue-400/40 hover:scale-[1.02] cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span className="tracking-wide">Open Advanced Chart</span>
            <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* 2. Quick Symbol & Timeframe Switcher Ribbon */}
      <div className="px-3.5 py-1.5 bg-slate-950/40 border-b border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Quick Symbols */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mr-1">
            Quick Watch:
          </span>
          {POPULAR_SYMBOLS.map((item) => (
            <button
              key={item.symbol}
              onClick={() => handleSelectQuickSymbol(item.symbol)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-colors whitespace-nowrap ${
                activeSymbol === item.symbol
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 font-bold'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/80'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Quick Timeframes */}
        <div className="flex items-center gap-1 font-mono text-[11px]">
          {QUICK_TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              onClick={() => handleSelectQuickTf(tf.value)}
              className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                activeTf === tf.value
                  ? 'bg-slate-800 text-blue-400 border border-blue-500/40'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Interactive Mini Chart Canvas with Hover Maximizer Overlay */}
      <div
        className="relative w-full h-[250px] bg-[#090e1a] cursor-pointer group select-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleOpenFullChart}
      >
        {/* Lightweight Chart DOM container */}
        <div ref={containerRef} className="w-full h-full" />

        {/* Subtle Watermark Indicator */}
        <div className="absolute top-2 left-3 pointer-events-none flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-500/80 bg-slate-950/60 px-1.5 py-0.5 rounded border border-slate-800/40 flex items-center gap-1">
            <Eye className="w-2.5 h-2.5 text-blue-400" />
            Mini Preview · Click for Advanced Tools
          </span>
          <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-800/30">
            EMA 20 Active
          </span>
        </div>

        {/* Floating Expand Button (Top-Right) */}
        <div className="absolute top-2 right-3 pointer-events-none">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-700/80 text-slate-200 text-xs font-mono font-medium shadow-md group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all">
            <Maximize2 className="w-3 h-3" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Expand Full Chart</span>
          </div>
        </div>

        {/* Dynamic Translucent Hover Banner */}
        <div
          className={`absolute inset-x-0 bottom-3 flex justify-center pointer-events-none transition-all duration-200 ${
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <div className="bg-slate-900/95 border border-blue-500/50 shadow-2xl shadow-blue-500/30 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 text-xs font-sans text-slate-100">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span className="font-semibold text-blue-300">Click to launch Full Advanced Workstation:</span>
            <span className="text-slate-300 text-[11px]">15+ Indicators · Smart Drawing Suite · Dual Split Screen</span>
            <ArrowRight className="w-3.5 h-3.5 text-blue-400 ml-1" />
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px] flex items-center justify-center">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="w-3 h-3 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
              <span>Fetching live candles...</span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Advanced Charting Station Capabilities Feature Strip */}
      <div
        onClick={handleOpenFullChart}
        className="p-3 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-t border-slate-800/80 cursor-pointer hover:bg-slate-800/50 transition-colors group"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              ADVANCED CHARTS READY
            </span>
            <span className="text-xs text-slate-300 font-sans font-medium">
              Professional institutional workstation with deep analytical tooling:
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-blue-400 font-bold group-hover:text-blue-300 font-mono transition-colors">
            <span>Explore All Advanced Tools</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 4 Feature Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 pt-2 border-t border-slate-800/60 font-sans">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2 flex items-start gap-2 hover:border-blue-500/40 transition-colors">
            <Activity className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-[11px] font-bold text-slate-200">15+ Indicators</div>
              <div className="text-[10px] text-slate-400 leading-tight">
                RSI, MACD, Ichimoku, Supertrend, Bollinger, ATR, VWAP
              </div>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2 flex items-start gap-2 hover:border-blue-500/40 transition-colors">
            <PenTool className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-[11px] font-bold text-slate-200">Drawing Suite</div>
              <div className="text-[10px] text-slate-400 leading-tight">
                Fibonacci, Trendlines, Channels, Ray Lines, Ruler
              </div>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2 flex items-start gap-2 hover:border-blue-500/40 transition-colors">
            <Layers className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-[11px] font-bold text-slate-200">Dual Split View</div>
              <div className="text-[10px] text-slate-400 leading-tight">
                Side-by-side multi-timeframe trend & entry confirmation
              </div>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2 flex items-start gap-2 hover:border-blue-500/40 transition-colors">
            <BarChart2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-[11px] font-bold text-slate-200">Visual Trading</div>
              <div className="text-[10px] text-slate-400 leading-tight">
                On-chart drag & drop SL/TP, 1-click break-even & quick orders
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
