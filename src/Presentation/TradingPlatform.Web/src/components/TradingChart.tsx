import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  ColorType,
  LineStyle,
  CrosshairMode,
  UTCTimestamp,
  SeriesMarker,
  IPriceLine,
  LogicalRange,
} from 'lightweight-charts';
import {
  AccountSummary,
  Candle,
  IndicatorConfig,
  Position,
  SignalAuditLog,
  Timeframe,
} from '../types/trading';
import {
  calculateATR,
  calculateBollingerBands,
  calculateEMA,
  calculateHeikinAshi,
  calculateIchimoku,
  calculateMACD,
  calculateRSI,
  calculateSMA,
  calculateStochastic,
  calculateSupertrend,
  calculateVWAP,
  formatPrice,
  getCandleTimeSeconds,
  sanitizeCandles,
} from '../utils/indicators';
import {
  ActiveIndicators,
  ChartType,
  ChartLayoutMode,
  ChartAlert,
  DrawingItem,
  DrawingTool,
  IndicatorSettings,
} from './chart/types';
import { DrawingToolbar } from './chart/DrawingToolbar';
import { ChartToolbar } from './chart/ChartToolbar';
import { DrawingCanvas } from './chart/DrawingCanvas';
import { SymbolSearchModal } from './chart/SymbolSearchModal';
import { IndicatorsModal } from './chart/IndicatorsModal';
import { QuickOrderWidget } from './chart/QuickOrderWidget';
import { HistoryOverlay } from './chart/HistoryOverlay';
import { ChartTradeOverlay } from './chart/ChartTradeOverlay';
import { ChartAlertsModal } from './chart/ChartAlertsModal';
import { SecondaryChartPane } from './chart/SecondaryChartPane';
import { playAlertChime } from '../utils/audioAlert';
import { tradingApi } from '../api/tradingClient';
import { Clock, X, Bell } from 'lucide-react';

interface TradingChartProps {
  candles: Candle[];
  symbol: string;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  onSymbolChange?: (symbol: string) => void;
  indicatorConfig?: IndicatorConfig;
  positions?: Position[];
  auditLogs?: SignalAuditLog[];
  onPlaceOrder?: (
    side: 'Buy' | 'Sell',
    lots: number,
    price: number,
    stopLoss?: number,
    takeProfit?: number
  ) => Promise<void>;
  onClosePosition?: (ticket: number) => Promise<void>;
  onLoadOlderCandles?: () => Promise<HistoryLoadResult>;
  isLoadingHistory?: boolean;
  activeProvider?: string;
  account?: AccountSummary | null;
  secondsUntilSync?: number;
  isRefreshingCandles?: boolean;
  onManualSyncCandles?: () => void;
}

export interface HistoryLoadResult {
  loaded: number; // bars added by this page (0 = provider has no older data)
  total: number; // total bars now on the chart
  boundaryTime: number; // unix seconds of the previously-oldest bar (where the new page joins)
}

interface HistoryLoadMark {
  time: number;
  loaded: number;
  total: number;
  batch: number;
}

export const TradingChart: React.FC<TradingChartProps> = ({
  candles,
  symbol,
  timeframe,
  onTimeframeChange,
  onSymbolChange,
  indicatorConfig,
  positions = [],
  auditLogs = [],
  onPlaceOrder,
  onClosePosition,
  onLoadOlderCandles,
  isLoadingHistory = false,
  activeProvider = 'KeylessPublic',
  account = null,
  secondsUntilSync,
  isRefreshingCandles = false,
  onManualSyncCandles,
}) => {
  // Chart layout and state
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [layoutMode, setLayoutMode] = useState<ChartLayoutMode>('single');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSymbolSearchOpen, setIsSymbolSearchOpen] = useState(false);
  const [isIndicatorsModalOpen, setIsIndicatorsModalOpen] = useState(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [showOrderWidget, setShowOrderWidget] = useState(true);

  // Active Alert Trigger Notice Banner
  const [activeTriggerNotice, setActiveTriggerNotice] = useState<{
    id: string;
    symbol: string;
    price: number;
    label?: string;
  } | null>(null);

  // Auto-dismiss trigger notice after 7s
  useEffect(() => {
    if (!activeTriggerNotice) return;
    const timer = setTimeout(() => setActiveTriggerNotice(null), 7000);
    return () => clearTimeout(timer);
  }, [activeTriggerNotice]);

  // Global keyboard shortcut to open symbol search modal (/ or Ctrl+K)
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === '/' || (e.ctrlKey && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        setIsSymbolSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  // 1. Drawing Tools state - Persistent per symbol (CRUD across sessions)
  const [activeTool, setActiveTool] = useState<DrawingTool>('cursor');
  const [showDrawings, setShowDrawings] = useState(true);
  const [drawingsMap, setDrawingsMap] = useState<Record<string, DrawingItem[]>>(() => {
    try {
      const saved = localStorage.getItem('tradingview_drawings_v2');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Load drawings from backend when symbol changes
  useEffect(() => {
    let isSubscribed = true;
    const loadRemoteDrawings = async () => {
      try {
        const remote = await tradingApi.getDrawings(symbol);
        if (isSubscribed && Array.isArray(remote) && remote.length > 0) {
          setDrawingsMap((prev) => {
            const next = { ...prev, [symbol]: remote };
            try {
              localStorage.setItem('tradingview_drawings_v2', JSON.stringify(next));
            } catch {}
            return next;
          });
        }
      } catch {}
    };
    loadRemoteDrawings();
    return () => {
      isSubscribed = false;
    };
  }, [symbol]);

  const activeDrawings = drawingsMap[symbol] || [];

  const saveDrawingsForSymbol = (sym: string, list: DrawingItem[]) => {
    setDrawingsMap((prev) => {
      const next = { ...prev, [sym]: list };
      try {
        localStorage.setItem('tradingview_drawings_v2', JSON.stringify(next));
      } catch {}
      return next;
    });
    tradingApi.saveDrawings(sym, list);
  };

  const handleAddDrawing = (d: DrawingItem) => {
    const updated = [...(drawingsMap[symbol] || []), d];
    saveDrawingsForSymbol(symbol, updated);
  };

  const handleUpdateDrawing = (d: DrawingItem) => {
    const updated = (drawingsMap[symbol] || []).map((item) => (item.id === d.id ? d : item));
    saveDrawingsForSymbol(symbol, updated);
  };

  const handleDeleteDrawing = (id: string) => {
    const updated = (drawingsMap[symbol] || []).filter((item) => item.id !== id);
    saveDrawingsForSymbol(symbol, updated);
  };

  const handleClearDrawings = () => {
    saveDrawingsForSymbol(symbol, []);
    tradingApi.clearDrawings(symbol);
  };

  // 2. Chart Price Level Alerts State & Engine
  const [alerts, setAlerts] = useState<ChartAlert[]>(() => {
    try {
      const saved = localStorage.getItem('tradingview_alerts_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const syncAlerts = async () => {
      try {
        const remote = await tradingApi.getAlerts();
        if (Array.isArray(remote) && remote.length > 0) {
          setAlerts(remote);
        }
      } catch {}
    };
    syncAlerts();
  }, []);

  const saveAlerts = (newAlerts: ChartAlert[]) => {
    setAlerts(newAlerts);
    try {
      localStorage.setItem('tradingview_alerts_v1', JSON.stringify(newAlerts));
    } catch {}
    tradingApi.saveAlerts(newAlerts);
  };

  const handleCreateAlert = (newAlert: ChartAlert) => {
    const next = [...alerts, newAlert];
    saveAlerts(next);
  };

  const handleDeleteAlert = (id: string) => {
    const next = alerts.filter((a) => a.id !== id);
    saveAlerts(next);
  };

  // 3. Trade Protection modification handler
  const handleModifyPosition = async (ticket: number, stopLoss?: number, takeProfit?: number) => {
    try {
      await tradingApi.modifyPosition(ticket, stopLoss, takeProfit);
    } catch (e) {
      console.warn('Failed to modify position protection:', e);
    }
  };

  // Indicators toggle state
  const [activeIndicators, setActiveIndicators] = useState<ActiveIndicators>({
    ema9: false,
    ema20: true,
    ema50: true,
    ema100: false,
    ema200: true,
    sma20: false,
    sma50: false,
    sma200: false,
    bollinger: false,
    vwap: false,
    supertrend: false,
    ichimoku: false,
    volume: true,
    rsi: true,
    macd: false,
    stoch: false,
    atr: false,
  });

  // Indicator Settings
  const [indicatorSettings, setIndicatorSettings] = useState<IndicatorSettings>({
    emaPeriods: indicatorConfig?.emas ?? [20, 50, 200],
    bollingerPeriod: indicatorConfig?.bollinger?.period ?? 20,
    bollingerStdDev: indicatorConfig?.bollinger?.stdDev ?? 2.0,
    rsiPeriod: indicatorConfig?.rsi?.period ?? 14,
    rsiOverbought: indicatorConfig?.rsi?.overbought ?? 70,
    rsiOversold: indicatorConfig?.rsi?.oversold ?? 30,
    macdFast: indicatorConfig?.macd?.fast ?? 12,
    macdSlow: indicatorConfig?.macd?.slow ?? 26,
    macdSignal: indicatorConfig?.macd?.signal ?? 9,
    stochK: indicatorConfig?.stoch?.kPeriod ?? 14,
    stochD: indicatorConfig?.stoch?.dPeriod ?? 3,
    atrPeriod: indicatorConfig?.atr?.period ?? 14,
    supertrendPeriod: 10,
    supertrendMultiplier: 3,
    showIndicatorPriceLines: false,
  });

  // Crosshair hover inspection values
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);

  // Container references
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mainChartContainerRef = useRef<HTMLDivElement | null>(null);
  const rsiChartContainerRef = useRef<HTMLDivElement | null>(null);
  const macdChartContainerRef = useRef<HTMLDivElement | null>(null);

  // Chart API references
  const mainChartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const macdChartRef = useRef<IChartApi | null>(null);

  // Main series & indicators references
  const mainSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const currentChartTypeRef = useRef<ChartType>('candlestick');
  const volumeSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const indicatorSeriesMapRef = useRef<Map<string, ISeriesApi<any>>>(new Map());
  const priceLinesRef = useRef<IPriceLine[]>([]);

  // Sub-pane series references
  const rsiSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const macdSeriesMapRef = useRef<{
    hist?: ISeriesApi<any>;
    macd?: ISeriesApi<any>;
    signal?: ISeriesApi<any>;
  }>({});

  // Chart dimensions for drawing canvas
  const [chartDimensions, setChartDimensions] = useState({ width: 800, height: 400 });

  // Sanitize and sort candles
  const cleanCandles = useMemo(() => sanitizeCandles(candles), [candles]);
  const latestCandle = cleanCandles[cleanCandles.length - 1];
  const currentPrice = latestCandle?.close ?? 1.085;

  // Price change calculations
  const priceChange = useMemo(() => {
    if (cleanCandles.length < 2) return { diff: 0, pct: 0 };
    const first = cleanCandles[0].open;
    const last = cleanCandles[cleanCandles.length - 1].close;
    const diff = last - first;
    const pct = first !== 0 ? (diff / first) * 100 : 0;
    return { diff, pct };
  }, [cleanCandles]);

  // Price range for drawing canvas
  const priceRange = useMemo(() => {
    if (cleanCandles.length === 0) return { min: 1.0, max: 1.1 };
    const highs = cleanCandles.map((c) => c.high);
    const lows = cleanCandles.map((c) => c.low);
    return { min: Math.min(...lows), max: Math.max(...highs) };
  }, [cleanCandles]);

  // Monitor live price against active alerts
  const prevPriceRef = useRef<number>(currentPrice);
  useEffect(() => {
    const prevP = prevPriceRef.current;
    const curP = currentPrice;
    prevPriceRef.current = curP;

    if (!prevP || !curP || prevP === curP) return;

    let anyTriggered = false;
    const updatedAlerts = alerts.map((a) => {
      if (a.symbol.toUpperCase() !== symbol.toUpperCase() || a.triggered) return a;

      let triggered = false;
      if (a.condition === 'crosses_above' && prevP < a.targetPrice && curP >= a.targetPrice) {
        triggered = true;
      } else if (a.condition === 'crosses_below' && prevP > a.targetPrice && curP <= a.targetPrice) {
        triggered = true;
      } else if (
        a.condition === 'crosses_any' &&
        ((prevP < a.targetPrice && curP >= a.targetPrice) || (prevP > a.targetPrice && curP <= a.targetPrice))
      ) {
        triggered = true;
      }

      if (triggered) {
        anyTriggered = true;
        playAlertChime();
        setActiveTriggerNotice({
          id: a.id,
          symbol: a.symbol,
          price: a.targetPrice,
          label: a.label,
        });
        return { ...a, triggered: true, triggeredAt: Date.now() };
      }
      return a;
    });

    if (anyTriggered) {
      saveAlerts(updatedAlerts);
    }
  }, [currentPrice, alerts, symbol]);

  // Countdown to next candle close
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  useEffect(() => {
    const timeframeSecondsMap: Record<Timeframe, number> = {
      M1: 60,
      M5: 300,
      M15: 900,
      M30: 1800,
      H1: 3600,
      H4: 14400,
      D1: 86400,
      W1: 604800,
      MN1: 2592000,
    };
    const periodSeconds = timeframeSecondsMap[timeframe] || 300;

    const interval = setInterval(() => {
      const nowSec = Math.floor(Date.now() / 1000);
      const remaining = periodSeconds - (nowSec % periodSeconds);
      setSecondsRemaining(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeframe]);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Historical pagination & notice
  const [hasMoreHistory, setHasMoreHistory] = useState<boolean>(true);
  const [historyNotice, setHistoryNotice] = useState<string | null>(null);
  const [historyMarks, setHistoryMarks] = useState<HistoryLoadMark[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Auto-dismiss transient notice after 6 seconds (end-of-history state stays in the status badge)
  useEffect(() => {
    if (!historyNotice) return;
    const timer = setTimeout(() => setHistoryNotice(null), 6000);
    return () => clearTimeout(timer);
  }, [historyNotice]);

  // Synchronizer & Pagination refs
  const lastFetchTimeRef = useRef<number>(0);
  const isLoadingHistoryRef = useRef<boolean>(isLoadingHistory);
  const hasMoreHistoryRef = useRef<boolean>(true);
  const onLoadOlderCandlesRef = useRef<(() => Promise<HistoryLoadResult>) | undefined>(onLoadOlderCandles);
  const symbolRef = useRef(symbol);
  const timeframeRef = useRef(timeframe);
  symbolRef.current = symbol;
  timeframeRef.current = timeframe;

  useEffect(() => {
    isLoadingHistoryRef.current = isLoadingHistory;
  }, [isLoadingHistory]);

  useEffect(() => {
    onLoadOlderCandlesRef.current = onLoadOlderCandles;
  }, [onLoadOlderCandles]);

  // Reset pagination state when symbol or timeframe changes
  useEffect(() => {
    hasMoreHistoryRef.current = true;
    setHasMoreHistory(true);
    setHistoryNotice(null);
    setHistoryError(null);
    setHistoryMarks([]);
  }, [symbol, timeframe]);

  // Track candles info across updates to lock zoom and scroll position
  const prevCandlesInfoRef = useRef<{
    count: number;
    earliestTime: number;
    latestTime: number;
    symbol: string;
    timeframe: Timeframe;
  } | null>(null);

  const runHistoryLoad = async () => {
    if (isLoadingHistoryRef.current || !hasMoreHistoryRef.current || !onLoadOlderCandlesRef.current) return;
    isLoadingHistoryRef.current = true;
    const requestKey = `${symbolRef.current}|${timeframeRef.current}`;
    try {
      const result = await onLoadOlderCandlesRef.current();
      if (requestKey !== `${symbolRef.current}|${timeframeRef.current}`) return;
      setHistoryError(null);
      if (result.loaded > 0) {
        setHistoryMarks((prev) => [
          ...prev,
          { time: result.boundaryTime, loaded: result.loaded, total: result.total, batch: prev.length + 1 },
        ]);
        setHistoryNotice(`Loaded ${result.loaded} older bars · ${result.total} bars total`);
      } else if (result.boundaryTime > 0) {
        hasMoreHistoryRef.current = false;
        setHasMoreHistory(false);
        setHistoryNotice(
          `No older data from provider before ${new Date(result.boundaryTime * 1000).toUTCString().slice(5, 22)} UTC · ${result.total} bars total`
        );
      }
    } catch {
      setHistoryError('Failed to load older bars (network/provider error). Scroll left again to retry.');
    } finally {
      isLoadingHistoryRef.current = false;
    }
  };

  const checkAndLoadOlderHistory = () => {
    const now = Date.now();
    if (now - lastFetchTimeRef.current > 1200) {
      lastFetchTimeRef.current = now;
      runHistoryLoad();
    }
  };

  const handleManualLoadHistory = async () => {
    await runHistoryLoad();
  };

  // ----------------------------------------------------
  // 1. Initialize Main Lightweight Chart (Runs ONCE on mount)
  // ----------------------------------------------------
  useEffect(() => {
    if (!mainChartContainerRef.current) return;
    const container = mainChartContainerRef.current;

    // Safely remove any existing chart instance
    if (mainChartRef.current) {
      try {
        mainChartRef.current.remove();
      } catch {}
      mainChartRef.current = null;
    }

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 450;
    setChartDimensions({ width, height });

    const chart = createChart(container, {
      width,
      height,
      layout: {
        background: { type: ColorType.Solid, color: '#090d16' },
        textColor: '#94a3b8',
        fontFamily: "'JetBrains Mono', 'Fira Code', -apple-system, BlinkMacSystemFont, monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.45)', style: LineStyle.Dotted },
        horzLines: { color: 'rgba(30, 41, 59, 0.45)', style: LineStyle.Dotted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#64748b', width: 1, style: LineStyle.Dashed },
        horzLine: { color: '#64748b', width: 1, style: LineStyle.Dashed },
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        visible: true,
        autoScale: true,
        scaleMargins: { top: 0.1, bottom: 0.15 },
      },
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    mainChartRef.current = chart;

    // Crosshair inspection listener
    const crosshairHandler = (param: any) => {
      if (!param || !param.time || !param.seriesData || !mainSeriesRef.current) {
        setHoveredCandle(null);
        return;
      }
      try {
        const series = mainSeriesRef.current;
        if (!series) {
          setHoveredCandle(null);
          return;
        }
        const data = param.seriesData.get(series) as any;
        if (data) {
          setHoveredCandle({
            symbol,
            timeframe,
            timestamp: new Date((param.time as number) * 1000).toISOString(),
            open: data.open ?? data.value ?? 0,
            high: data.high ?? data.value ?? 0,
            low: data.low ?? data.value ?? 0,
            close: data.close ?? data.value ?? 0,
            volume: 0,
            isComplete: true,
          });
        } else {
          setHoveredCandle(null);
        }
      } catch {
        setHoveredCandle(null);
      }
    };
    chart.subscribeCrosshairMove(crosshairHandler);

    // Visible range listener: sync to sub-panes and auto-fetch history on scroll left
    const handleMainRangeChange = (range: LogicalRange | null) => {
      if (!range) return;

      // 1. Unidirectionally synchronize sub-charts (RSI, MACD) to match main chart range
      try {
        if (rsiChartRef.current) {
          rsiChartRef.current.timeScale().setVisibleLogicalRange(range);
        }
        if (macdChartRef.current) {
          macdChartRef.current.timeScale().setVisibleLogicalRange(range);
        }
      } catch {}

      // 2. Auto-load older bars when scrolled near earliest bar
      if (range.from < 10) {
        checkAndLoadOlderHistory();
      }
    };
    chart.timeScale().subscribeVisibleLogicalRangeChange(handleMainRangeChange);

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0 || !mainChartRef.current) return;
      const { width: w, height: h } = entries[0].contentRect;
      try {
        chart.applyOptions({ width: w, height: h });
        setChartDimensions({ width: w, height: h });
      } catch {}
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      try {
        chart.unsubscribeCrosshairMove(crosshairHandler);
      } catch {}
      try {
        chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleMainRangeChange);
      } catch {}
      try {
        chart.remove();
      } catch {}
      mainChartRef.current = null;
      mainSeriesRef.current = null;
      volumeSeriesRef.current = null;
      indicatorSeriesMapRef.current.clear();
      priceLinesRef.current = [];
    };
  }, []);

  // ----------------------------------------------------
  // 2. Synchronize Data, Series Type, and Overlays smoothly
  // ----------------------------------------------------
  useEffect(() => {
    const chart = mainChartRef.current;
    if (!chart) return;
    if (cleanCandles.length === 0) {
      // Series is being switched (App clears candles first): treat the next dataset as a fresh series
      prevCandlesInfoRef.current = null;
      return;
    }

    const timeScale = chart.timeScale();
    const prevRange = timeScale.getVisibleLogicalRange();
    const prevInfo = prevCandlesInfoRef.current;

    const isNewSymbolOrTimeframe =
      !prevInfo || prevInfo.symbol !== symbol || prevInfo.timeframe !== timeframe;

    const earliestTime = cleanCandles.length > 0 ? getCandleTimeSeconds(cleanCandles[0].timestamp) : 0;
    const latestTime = cleanCandles.length > 0 ? getCandleTimeSeconds(cleanCandles[cleanCandles.length - 1].timestamp) : 0;

    // A. Recreate Main Series if chartType changed or doesn't exist
    const needsNewSeries = !mainSeriesRef.current || currentChartTypeRef.current !== chartType;
    if (needsNewSeries) {
      if (mainSeriesRef.current) {
        priceLinesRef.current = [];
        try {
          mainSeriesRef.current.setMarkers([]);
        } catch {}
        try {
          chart.removeSeries(mainSeriesRef.current);
        } catch {}
        mainSeriesRef.current = null;
      }

      let series: ISeriesApi<any>;
      if (chartType === 'bar') {
        series = chart.addBarSeries({
          upColor: '#10b981',
          downColor: '#ef4444',
        });
      } else if (chartType === 'line') {
        series = chart.addLineSeries({
          color: '#38bdf8',
          lineWidth: 2,
        });
      } else if (chartType === 'area') {
        series = chart.addAreaSeries({
          topColor: 'rgba(56, 189, 248, 0.4)',
          bottomColor: 'rgba(56, 189, 248, 0.01)',
          lineColor: '#38bdf8',
          lineWidth: 2,
        });
      } else if (chartType === 'baseline') {
        const baseValue = cleanCandles[0]?.open ?? 1.085;
        series = chart.addBaselineSeries({
          baseValue: { type: 'price', price: baseValue },
          topLineColor: '#10b981',
          topFillColor1: 'rgba(16, 185, 129, 0.28)',
          topFillColor2: 'rgba(16, 185, 129, 0.05)',
          bottomLineColor: '#ef4444',
          bottomFillColor1: 'rgba(239, 68, 68, 0.05)',
          bottomFillColor2: 'rgba(239, 68, 68, 0.28)',
        });
      } else {
        // Default: Candlestick (or Heikin Ashi)
        series = chart.addCandlestickSeries({
          upColor: '#10b981',
          downColor: '#ef4444',
          borderUpColor: '#10b981',
          borderDownColor: '#ef4444',
          wickUpColor: '#10b981',
          wickDownColor: '#ef4444',
        });
      }

      mainSeriesRef.current = series;
      currentChartTypeRef.current = chartType;
    }

    // B. Set Main Series Data
    const isHeikinAshi = chartType === 'heikin_ashi';
    const sourceCandles = isHeikinAshi ? calculateHeikinAshi(cleanCandles) : cleanCandles;

    try {
      if (['line', 'area', 'baseline'].includes(chartType)) {
        mainSeriesRef.current?.setData(
          sourceCandles.map((c) => ({
            time: getCandleTimeSeconds(c.timestamp) as UTCTimestamp,
            value: c.close,
          }))
        );
      } else {
        mainSeriesRef.current?.setData(
          sourceCandles.map((c) => ({
            time: getCandleTimeSeconds(c.timestamp) as UTCTimestamp,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          }))
        );
      }
    } catch (err) {
      console.warn('Failed to set series data:', err);
    }

    // C. Volume Series
    if (activeIndicators.volume) {
      if (!volumeSeriesRef.current) {
        const vol = chart.addHistogramSeries({
          priceFormat: { type: 'volume' },
          priceScaleId: '',
        });
        vol.priceScale().applyOptions({
          scaleMargins: { top: 0.8, bottom: 0 },
        });
        volumeSeriesRef.current = vol;
      }
      try {
        volumeSeriesRef.current.setData(
          cleanCandles.map((c) => ({
            time: getCandleTimeSeconds(c.timestamp) as UTCTimestamp,
            value: c.volume || 100,
            color: c.close >= c.open ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)',
          }))
        );
      } catch {}
    } else if (volumeSeriesRef.current) {
      try {
        chart.removeSeries(volumeSeriesRef.current);
      } catch {}
      volumeSeriesRef.current = null;
    }

    // D. Helper to manage indicator lines
    const syncIndicatorLine = (
      key: string,
      isActive: boolean,
      color: string,
      lineWidth: 1 | 2,
      points: { time: number; value: number }[],
      lineStyle: LineStyle = LineStyle.Solid,
      title?: string
    ) => {
      let series = indicatorSeriesMapRef.current.get(key);
      const showPriceLine = Boolean(indicatorSettings.showIndicatorPriceLines);
      if (isActive) {
        if (!series) {
          series = chart.addLineSeries({
            color,
            lineWidth,
            lineStyle,
            title: showPriceLine ? title : undefined,
            priceLineVisible: showPriceLine,
            lastValueVisible: showPriceLine,
          });
          indicatorSeriesMapRef.current.set(key, series);
        } else {
          series.applyOptions({
            color,
            lineWidth,
            lineStyle,
            title: showPriceLine ? title : undefined,
            priceLineVisible: showPriceLine,
            lastValueVisible: showPriceLine,
          });
        }
        try {
          series.setData(points.map((p) => ({ time: p.time as UTCTimestamp, value: p.value })));
        } catch {}
      } else if (series) {
        try {
          chart.removeSeries(series);
        } catch {}
        indicatorSeriesMapRef.current.delete(key);
      }
    };

    // EMA & SMA Overlays
    syncIndicatorLine('ema20', activeIndicators.ema20, '#06b6d4', 2, calculateEMA(cleanCandles, 20), LineStyle.Solid, 'EMA 20');
    syncIndicatorLine('ema50', activeIndicators.ema50, '#f97316', 2, calculateEMA(cleanCandles, 50), LineStyle.Solid, 'EMA 50');
    syncIndicatorLine('ema200', activeIndicators.ema200, '#a855f7', 2, calculateEMA(cleanCandles, 200), LineStyle.Solid, 'EMA 200');
    syncIndicatorLine('sma20', activeIndicators.sma20, '#3b82f6', 2, calculateSMA(cleanCandles, 20), LineStyle.Solid, 'SMA 20');

    // Bollinger Bands
    const bb = calculateBollingerBands(
      cleanCandles,
      indicatorSettings.bollingerPeriod,
      indicatorSettings.bollingerStdDev
    );
    syncIndicatorLine('bb_upper', activeIndicators.bollinger, '#c084fc', 1, bb.upper, LineStyle.Dashed, 'BB Upper');
    syncIndicatorLine('bb_mid', activeIndicators.bollinger, '#a855f7', 2, bb.middle, LineStyle.Solid, 'BB Mid');
    syncIndicatorLine('bb_lower', activeIndicators.bollinger, '#c084fc', 1, bb.lower, LineStyle.Dashed, 'BB Lower');

    // VWAP
    syncIndicatorLine('vwap', activeIndicators.vwap, '#eab308', 2, calculateVWAP(cleanCandles), LineStyle.Solid, 'VWAP');

    // Supertrend
    const stPoints = calculateSupertrend(
      cleanCandles,
      indicatorSettings.supertrendPeriod,
      indicatorSettings.supertrendMultiplier
    );
    syncIndicatorLine('supertrend', activeIndicators.supertrend, '#10b981', 2, stPoints, LineStyle.Solid, 'Supertrend');

    // Ichimoku Cloud
    const ichi = calculateIchimoku(cleanCandles);
    syncIndicatorLine('tenkan', activeIndicators.ichimoku, '#06b6d4', 1, ichi.tenkan, LineStyle.Solid, 'Tenkan');
    syncIndicatorLine('kijun', activeIndicators.ichimoku, '#ef4444', 2, ichi.kijun, LineStyle.Solid, 'Kijun');
    syncIndicatorLine('spanA', activeIndicators.ichimoku, '#10b981', 1, ichi.spanA, LineStyle.Dotted, 'Span A');
    syncIndicatorLine('spanB', activeIndicators.ichimoku, '#f59e0b', 1, ichi.spanB, LineStyle.Dotted, 'Span B');

    // E. Viewport & Zoom Lock Synchronization
    // Detect a genuine series replacement (symbol/timeframe/provider switch) vs. an incremental update.
    let isReplacement = isNewSymbolOrTimeframe;
    if (!isReplacement && prevInfo) {
      const times = new Set(cleanCandles.map((c) => getCandleTimeSeconds(c.timestamp)));
      isReplacement = !times.has(prevInfo.latestTime) && !times.has(prevInfo.earliestTime);
    }

    if (isReplacement) {
      // Open new series TradingView-style: fixed readable bar spacing anchored to the latest bar.
      // (fitContent squeezed every bar onto screen, put range.from at 0 and instantly triggered history paging.)
      try {
        timeScale.applyOptions({ barSpacing: 8, rightOffset: 6 });
        timeScale.scrollToRealTime();
      } catch {}
    } else if (prevRange && prevInfo) {
      let prependedCount = 0;
      if (earliestTime < prevInfo.earliestTime) {
        prependedCount = cleanCandles.filter(
          (c) => getCandleTimeSeconds(c.timestamp) < prevInfo.earliestTime
        ).length;
      }

      if (prependedCount > 0) {
        // Older bars were inserted on the left: every existing bar's logical index grew by prependedCount.
        // Shift by exactly that amount so the same candles stay under the cursor at the same zoom.
        try {
          timeScale.setVisibleLogicalRange({
            from: prevRange.from + prependedCount,
            to: prevRange.to + prependedCount,
          });
        } catch {}
      }
      // Live ticks / appended bars: do NOT touch the range. Lightweight Charts keeps bar spacing and
      // auto-follows the newest bar only when it is already visible (shiftVisibleRangeOnNewBar).
    }

    prevCandlesInfoRef.current = {
      count: cleanCandles.length,
      earliestTime,
      latestTime,
      symbol,
      timeframe,
    };
  }, [
    cleanCandles,
    chartType,
    activeIndicators,
    indicatorSettings,
    symbol,
    timeframe,
  ]);

  // ----------------------------------------------------
  // 2b. Open Positions & Signal Audit Logs (Price Lines & Markers)
  // Kept in a dedicated effect so 2.5s polling never resets candle data or viewport
  // ----------------------------------------------------
  useEffect(() => {
    const series = mainSeriesRef.current;
    if (!series) return;

    // Clear existing price lines
    priceLinesRef.current.forEach((pl) => {
      try {
        series.removePriceLine(pl);
      } catch {}
    });
    priceLinesRef.current = [];

    // Add entry, SL, TP price lines for current symbol positions
    positions
      .filter((p) => p.symbol === symbol && p.status === 'Open')
      .forEach((pos) => {
        try {
          const entryLine = series.createPriceLine({
            price: pos.entryPrice,
            color: pos.orderType === 'Buy' ? '#38bdf8' : '#fb923c',
            lineWidth: 1,
            lineStyle: LineStyle.Dotted,
            axisLabelVisible: true,
            title: `${pos.orderType.toUpperCase()} ${pos.lots}L @ ${formatPrice(pos.entryPrice, symbol)}`,
          });
          if (entryLine) priceLinesRef.current.push(entryLine);

          if (pos.stopLossPrice) {
            const slLine = series.createPriceLine({
              price: pos.stopLossPrice,
              color: '#ef4444',
              lineWidth: 1,
              lineStyle: LineStyle.Dashed,
              axisLabelVisible: true,
              title: `SL: ${formatPrice(pos.stopLossPrice, symbol)}`,
            });
            if (slLine) priceLinesRef.current.push(slLine);
          }

          if (pos.takeProfitPrice) {
            const tpLine = series.createPriceLine({
              price: pos.takeProfitPrice,
              color: '#10b981',
              lineWidth: 1,
              lineStyle: LineStyle.Dashed,
              axisLabelVisible: true,
              title: `TP: ${formatPrice(pos.takeProfitPrice, symbol)}`,
            });
            if (tpLine) priceLinesRef.current.push(tpLine);
          }
        } catch {}
      });

    // Add Price Lines for Active Alerts for this symbol
    alerts
      .filter((a) => a.symbol.toUpperCase() === symbol.toUpperCase() && !a.triggered)
      .forEach((alt) => {
        try {
          const alertLine = series.createPriceLine({
            price: alt.targetPrice,
            color: '#f59e0b',
            lineWidth: 1,
            lineStyle: LineStyle.Dotted,
            axisLabelVisible: true,
            title: `🔔 ALERT: ${formatPrice(alt.targetPrice, symbol)}`,
          });
          if (alertLine) priceLinesRef.current.push(alertLine);
        } catch {}
      });

    // Markers (Order executions & Near-miss audits)
    const markers: SeriesMarker<UTCTimestamp>[] = [];
    positions
      .filter((p) => p.symbol === symbol && p.status === 'Open')
      .forEach((pos) => {
        const posTime = getCandleTimeSeconds(pos.openedAtUtc);
        markers.push({
          time: posTime as UTCTimestamp,
          position: pos.orderType === 'Buy' ? 'belowBar' : 'aboveBar',
          color: pos.orderType === 'Buy' ? '#10b981' : '#ef4444',
          shape: pos.orderType === 'Buy' ? 'arrowUp' : 'arrowDown',
          text: `${pos.orderType.toUpperCase()} ${pos.lots}`,
        });
      });

    auditLogs
      .filter((log) => log.symbol === symbol && log.state === 'NearMiss')
      .slice(0, 10)
      .forEach((log) => {
        const t = getCandleTimeSeconds(log.candleTimestampUtc);
        markers.push({
          time: t as UTCTimestamp,
          position: 'aboveBar',
          color: '#f59e0b',
          shape: 'circle',
          text: 'NEAR MISS',
        });
      });

    // History page boundaries: placed on the bar that was the oldest before each page was loaded
    historyMarks.forEach((m) => {
      markers.push({
        time: m.time as UTCTimestamp,
        position: 'aboveBar',
        color: '#a78bfa',
        shape: 'arrowDown',
        text: `#${m.batch} +${m.loaded} bars · total ${m.total}`,
      });
    });

    if (markers.length > 0) {
      markers.sort((a, b) => Number(a.time) - Number(b.time));
      try {
        series.setMarkers(markers);
      } catch {}
    } else {
      try {
        series.setMarkers([]);
      } catch {}
    }
  }, [positions, auditLogs, symbol, historyMarks, chartType, cleanCandles, alerts]);

  // ----------------------------------------------------
  // 3. RSI Oscillator Sub-Pane (Lifecycle & Data separated)
  // ----------------------------------------------------
  useEffect(() => {
    if (!activeIndicators.rsi) {
      if (rsiChartRef.current) {
        try {
          rsiChartRef.current.remove();
        } catch {}
        rsiChartRef.current = null;
        rsiSeriesRef.current = null;
      }
      return;
    }

    const container = rsiChartContainerRef.current;
    if (!container) return;

    if (rsiChartRef.current) {
      try {
        rsiChartRef.current.remove();
      } catch {}
      rsiChartRef.current = null;
      rsiSeriesRef.current = null;
    }

    const width = container.clientWidth || 800;
    const height = 95;

    const rsiChart = createChart(container, {
      width,
      height,
      layout: {
        background: { type: ColorType.Solid, color: '#090d16' },
        textColor: '#64748b',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.3)' },
        horzLines: { color: 'rgba(30, 41, 59, 0.3)' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#1e293b' },
      timeScale: { borderColor: '#1e293b', visible: false },
    });

    rsiChartRef.current = rsiChart;

    const rsiSeries = rsiChart.addLineSeries({
      color: '#f59e0b',
      lineWidth: 2,
    });
    rsiSeriesRef.current = rsiSeries;

    rsiSeries.createPriceLine({
      price: indicatorSettings.rsiOverbought,
      color: '#ef4444',
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      axisLabelVisible: true,
      title: '70 OB',
    });
    rsiSeries.createPriceLine({
      price: indicatorSettings.rsiOversold,
      color: '#10b981',
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      axisLabelVisible: true,
      title: '30 OS',
    });

    // Synchronize initial range
    if (mainChartRef.current) {
      try {
        const curRange = mainChartRef.current.timeScale().getVisibleLogicalRange();
        if (curRange) {
          rsiChart.timeScale().setVisibleLogicalRange(curRange);
        }
      } catch {}
    }

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0 || !rsiChartRef.current) return;
      const { width: w, height: h } = entries[0].contentRect;
      try {
        rsiChart.applyOptions({ width: w, height: h });
      } catch {}
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      try {
        rsiChart.remove();
      } catch {}
      rsiChartRef.current = null;
      rsiSeriesRef.current = null;
    };
  }, [activeIndicators.rsi]);

  // RSI Data Update (Never destroys the chart)
  useEffect(() => {
    if (!activeIndicators.rsi || !rsiSeriesRef.current || cleanCandles.length === 0) return;
    try {
      const rsiPoints = calculateRSI(cleanCandles, indicatorSettings.rsiPeriod);
      rsiSeriesRef.current.setData(
        rsiPoints.map((p) =>
          p.value !== undefined
            ? { time: p.time as UTCTimestamp, value: p.value }
            : { time: p.time as UTCTimestamp }
        )
      );
    } catch {}
  }, [cleanCandles, activeIndicators.rsi, indicatorSettings.rsiPeriod]);

  // ----------------------------------------------------
  // 4. MACD Oscillator Sub-Pane (Lifecycle & Data separated)
  // ----------------------------------------------------
  useEffect(() => {
    if (!activeIndicators.macd) {
      if (macdChartRef.current) {
        try {
          macdChartRef.current.remove();
        } catch {}
        macdChartRef.current = null;
        macdSeriesMapRef.current = {};
      }
      return;
    }

    const container = macdChartContainerRef.current;
    if (!container) return;

    if (macdChartRef.current) {
      try {
        macdChartRef.current.remove();
      } catch {}
      macdChartRef.current = null;
      macdSeriesMapRef.current = {};
    }

    const width = container.clientWidth || 800;
    const height = 100;

    const macdChart = createChart(container, {
      width,
      height,
      layout: {
        background: { type: ColorType.Solid, color: '#090d16' },
        textColor: '#64748b',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.3)' },
        horzLines: { color: 'rgba(30, 41, 59, 0.3)' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#1e293b' },
      timeScale: { borderColor: '#1e293b', visible: false },
    });

    macdChartRef.current = macdChart;

    const hist = macdChart.addHistogramSeries({ priceFormat: { type: 'volume' } });
    const macd = macdChart.addLineSeries({ color: '#06b6d4', lineWidth: 2 });
    const signal = macdChart.addLineSeries({ color: '#f97316', lineWidth: 2 });
    macdSeriesMapRef.current = { hist, macd, signal };

    // Synchronize initial range
    if (mainChartRef.current) {
      try {
        const curRange = mainChartRef.current.timeScale().getVisibleLogicalRange();
        if (curRange) {
          macdChart.timeScale().setVisibleLogicalRange(curRange);
        }
      } catch {}
    }

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0 || !macdChartRef.current) return;
      const { width: w, height: h } = entries[0].contentRect;
      try {
        macdChart.applyOptions({ width: w, height: h });
      } catch {}
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      try {
        macdChart.remove();
      } catch {}
      macdChartRef.current = null;
      macdSeriesMapRef.current = {};
    };
  }, [activeIndicators.macd]);

  // MACD Data Update (Never destroys the chart)
  useEffect(() => {
    if (!activeIndicators.macd || !macdSeriesMapRef.current.hist || cleanCandles.length === 0) return;
    try {
      const macdData = calculateMACD(
        cleanCandles,
        indicatorSettings.macdFast,
        indicatorSettings.macdSlow,
        indicatorSettings.macdSignal
      );
      const { hist, macd, signal } = macdSeriesMapRef.current;
      if (hist) {
        hist.setData(
          macdData.histogram.map((h) =>
            h.value !== undefined
              ? {
                  time: h.time as UTCTimestamp,
                  value: h.value,
                  color: h.color,
                }
              : { time: h.time as UTCTimestamp }
          )
        );
      }
      if (macd) {
        macd.setData(
          macdData.macd.map((p) =>
            p.value !== undefined
              ? { time: p.time as UTCTimestamp, value: p.value }
              : { time: p.time as UTCTimestamp }
          )
        );
      }
      if (signal) {
        signal.setData(
          macdData.signal.map((p) =>
            p.value !== undefined
              ? { time: p.time as UTCTimestamp, value: p.value }
              : { time: p.time as UTCTimestamp }
          )
        );
      }
    } catch {}
  }, [
    cleanCandles,
    activeIndicators.macd,
    indicatorSettings.macdFast,
    indicatorSettings.macdSlow,
    indicatorSettings.macdSignal,
  ]);

  // Toolbar Actions
  const handleFitContent = () => {
    if (mainChartRef.current) {
      try {
        mainChartRef.current.timeScale().fitContent();
      } catch {}
    }
  };

  const handleTakeSnapshot = () => {
    if (!mainChartRef.current) return;
    const canvas = mainChartContainerRef.current?.querySelector('canvas');
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${symbol}_${timeframe}_chart.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  const displayCandle = hoveredCandle || latestCandle;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-[#0b0f19] border border-slate-800 rounded-xl overflow-hidden flex flex-col font-sans select-none ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
    >
      {/* Top TradingView Toolbar */}
      <ChartToolbar
        symbol={symbol}
        onOpenSymbolSearch={() => setIsSymbolSearchOpen(true)}
        timeframe={timeframe}
        onTimeframeChange={onTimeframeChange}
        chartType={chartType}
        onChartTypeChange={setChartType}
        onOpenIndicatorsModal={() => setIsIndicatorsModalOpen(true)}
        activeIndicatorsCount={
          Object.values(activeIndicators).filter(Boolean).length
        }
        onOpenAlertsModal={() => setIsAlertsModalOpen(true)}
        activeAlertsCount={
          alerts.filter((a) => a.symbol.toUpperCase() === symbol.toUpperCase() && !a.triggered).length
        }
        showOrderWidget={showOrderWidget}
        onToggleOrderWidget={() => setShowOrderWidget(!showOrderWidget)}
        onFitContent={handleFitContent}
        onTakeSnapshot={handleTakeSnapshot}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        layoutMode={layoutMode}
        onLayoutModeChange={setLayoutMode}
        currentPrice={currentPrice}
        priceChange={priceChange}
        candlesCount={cleanCandles.length}
        isLoadingHistory={isLoadingHistory}
        onLoadOlderHistory={handleManualLoadHistory}
        hasMoreHistory={hasMoreHistory}
        historyNotice={historyNotice}
        onDismissHistoryNotice={() => setHistoryNotice(null)}
        secondsUntilSync={secondsUntilSync}
        isRefreshingCandles={isRefreshingCandles}
        onManualSyncCandles={onManualSyncCandles}
      />

      {/* Alert Trigger Toast Notification */}
      {activeTriggerNotice && (
        <div className="absolute top-12 right-6 z-50 bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce border-2 border-amber-300 pointer-events-auto">
          <Bell className="w-5 h-5 animate-pulse text-slate-950 flex-shrink-0" />
          <div>
            <div className="text-[10px] uppercase tracking-wider font-extrabold">Price Alert Triggered!</div>
            <div className="text-xs font-mono">
              {activeTriggerNotice.symbol} reached {formatPrice(activeTriggerNotice.price, activeTriggerNotice.symbol)}
              {activeTriggerNotice.label ? ` · ${activeTriggerNotice.label}` : ''}
            </div>
          </div>
          <button
            onClick={() => setActiveTriggerNotice(null)}
            className="p-1 hover:bg-black/20 rounded ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Chart Body (Sidebar + Chart Canvas + Overlay) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Drawing Tools Sidebar */}
        <DrawingToolbar
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          onClearDrawings={handleClearDrawings}
          showDrawings={showDrawings}
          onToggleShowDrawings={() => setShowDrawings(!showDrawings)}
          drawingsCount={activeDrawings.length}
        />

        {/* Center Viewport / Multi-Chart Grid */}
        <div
          className={`flex-1 h-full relative overflow-hidden bg-[#0b0f19] ${
            layoutMode === 'split-v'
              ? 'flex flex-row gap-1 p-0.5'
              : layoutMode === 'split-h'
              ? 'flex flex-col gap-1 p-0.5'
              : layoutMode === 'grid-4'
              ? 'grid grid-cols-2 grid-rows-2 gap-1 p-0.5'
              : 'flex flex-col'
          }`}
        >
          {/* Slot 0: Primary Chart (Always mounted) */}
          <div
            className={`flex flex-col h-full relative overflow-hidden bg-[#0b0f19] ${
              layoutMode === 'split-v'
                ? 'w-1/2 border-r border-slate-800'
                : layoutMode === 'split-h'
                ? 'h-1/2 border-b border-slate-800'
                : layoutMode === 'grid-4'
                ? 'w-full h-full border-r border-b border-slate-800'
                : 'w-full'
            }`}
          >
            {/* Quick One-Click Trading Dock */}
            {showOrderWidget && (
              <QuickOrderWidget
                symbol={symbol}
                currentPrice={currentPrice}
                activeProvider={activeProvider}
                account={account}
                onPlaceOrder={onPlaceOrder}
                onClose={() => setShowOrderWidget(false)}
              />
            )}

            {/* Interactive Inspection Bar / OHLCV Header */}
            <div className="absolute top-2 left-3 right-3 z-10 flex flex-wrap items-center justify-between pointer-events-none text-xs font-mono">
              {displayCandle && (
                <div className="flex flex-wrap items-center gap-2.5 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800/80 pointer-events-auto">
                  <span className="font-bold text-slate-100">{symbol}</span>
                  <span className="text-slate-400 font-semibold">{timeframe}</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-400">
                    O: <strong className="text-slate-200">{formatPrice(displayCandle.open, symbol)}</strong>
                  </span>
                  <span className="text-slate-400">
                    H: <strong className="text-slate-200">{formatPrice(displayCandle.high, symbol)}</strong>
                  </span>
                  <span className="text-slate-400">
                    L: <strong className="text-slate-200">{formatPrice(displayCandle.low, symbol)}</strong>
                  </span>
                  <span className="text-slate-400">
                    C: <strong className={displayCandle.close >= displayCandle.open ? 'text-emerald-400' : 'text-red-400'}>
                      {formatPrice(displayCandle.close, symbol)}
                    </strong>
                  </span>
                  {displayCandle.volume > 0 && (
                    <span className="text-slate-400 hidden sm:inline">
                      Vol: <strong className="text-slate-300">{displayCandle.volume.toLocaleString()}</strong>
                    </span>
                  )}
                  {/* Candle Close Countdown */}
                  <div className="flex items-center gap-1 pl-1 text-[11px] text-blue-400 font-bold border-l border-slate-800">
                    <Clock className="w-3 h-3 text-blue-400 animate-pulse" />
                    <span>{formatCountdown(secondsRemaining)}</span>
                  </div>
                </div>
              )}

              {/* Active Indicator Tags with quick toggle/remove */}
              <div className="hidden xl:flex items-center gap-1.5 pointer-events-auto">
                {activeIndicators.ema20 && (
                  <div className="flex items-center gap-1 bg-slate-950/80 border border-cyan-500/30 text-cyan-400 px-2 py-0.5 rounded text-[10px]">
                    <span>EMA 20</span>
                    <button
                      onClick={() => setActiveIndicators({ ...activeIndicators, ema20: false })}
                      className="hover:text-cyan-200"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
                {activeIndicators.ema50 && (
                  <div className="flex items-center gap-1 bg-slate-950/80 border border-orange-500/30 text-orange-400 px-2 py-0.5 rounded text-[10px]">
                    <span>EMA 50</span>
                    <button
                      onClick={() => setActiveIndicators({ ...activeIndicators, ema50: false })}
                      className="hover:text-orange-200"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
                {activeIndicators.bollinger && (
                  <div className="flex items-center gap-1 bg-slate-950/80 border border-purple-500/30 text-purple-400 px-2 py-0.5 rounded text-[10px]">
                    <span>BB (20,2)</span>
                    <button
                      onClick={() => setActiveIndicators({ ...activeIndicators, bollinger: false })}
                      className="hover:text-purple-200"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Primary Candlestick Canvas Container */}
            <div className="flex-1 w-full h-full relative overflow-hidden">
              <div ref={mainChartContainerRef} className="w-full h-full" />

              {/* Drawing Canvas Overlay */}
              <DrawingCanvas
                activeTool={activeTool}
                onToolComplete={() => setActiveTool('cursor')}
                drawings={activeDrawings}
                onAddDrawing={handleAddDrawing}
                onUpdateDrawing={handleUpdateDrawing}
                onDeleteDrawing={handleDeleteDrawing}
                showDrawings={showDrawings}
                symbol={symbol}
                chart={mainChartRef.current}
                series={mainSeriesRef.current}
                chartDimensions={chartDimensions}
                priceRange={priceRange}
                candles={cleanCandles}
              />

              {/* Interactive On-Chart Trade & Position Overlay */}
              <ChartTradeOverlay
                positions={positions}
                symbol={symbol}
                chart={mainChartRef.current}
                series={mainSeriesRef.current}
                currentPrice={currentPrice}
                onClosePosition={onClosePosition}
                onModifyPosition={handleModifyPosition}
              />

              {/* History page boundaries + persistent history status */}
              <HistoryOverlay
                chart={mainChartRef.current}
                boundaries={historyMarks}
                totalBars={cleanCandles.length}
                oldestTime={cleanCandles.length > 0 ? getCandleTimeSeconds(cleanCandles[0].timestamp) : null}
                isLoading={isLoadingHistory}
                hasMore={hasMoreHistory}
                error={historyError}
                onLoadMore={handleManualLoadHistory}
              />
            </div>

            {/* Sub-Pane 1: RSI Oscillator */}
            {activeIndicators.rsi && (
              <div className="h-24 border-t border-slate-800 bg-[#090d16] relative flex flex-col flex-shrink-0">
                <div className="h-5 px-3 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="font-bold text-amber-400">
                    RSI ({indicatorSettings.rsiPeriod})
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">OB: 70 | OS: 30</span>
                    <button
                      onClick={() => setActiveIndicators({ ...activeIndicators, rsi: false })}
                      className="hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div ref={rsiChartContainerRef} className="flex-1 w-full h-full" />
              </div>
            )}

            {/* Sub-Pane 2: MACD Oscillator */}
            {activeIndicators.macd && (
              <div className="h-24 border-t border-slate-800 bg-[#090d16] relative flex flex-col flex-shrink-0">
                <div className="h-5 px-3 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="font-bold text-cyan-400">
                    MACD ({indicatorSettings.macdFast},{indicatorSettings.macdSlow},{indicatorSettings.macdSignal})
                  </span>
                  <button
                    onClick={() => setActiveIndicators({ ...activeIndicators, macd: false })}
                    className="hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div ref={macdChartContainerRef} className="flex-1 w-full h-full" />
              </div>
            )}
          </div>

          {/* Secondary Panes when Split or Grid active */}
          {layoutMode === 'split-v' && (
            <div className="w-1/2 h-full">
              <SecondaryChartPane
                paneId="split-v-1"
                defaultSymbol={symbol}
                defaultTimeframe={timeframe === 'M5' ? 'H1' : 'M5'}
                onMaximize={() => setLayoutMode('single')}
                onClose={() => setLayoutMode('single')}
              />
            </div>
          )}

          {layoutMode === 'split-h' && (
            <div className="h-1/2 w-full">
              <SecondaryChartPane
                paneId="split-h-1"
                defaultSymbol={symbol}
                defaultTimeframe={timeframe === 'M5' ? 'H1' : 'M5'}
                onMaximize={() => setLayoutMode('single')}
                onClose={() => setLayoutMode('single')}
              />
            </div>
          )}

          {layoutMode === 'grid-4' && (
            <>
              <div className="w-full h-full border-b border-slate-800">
                <SecondaryChartPane
                  paneId="grid-4-1"
                  defaultSymbol={symbol}
                  defaultTimeframe="H1"
                  onMaximize={() => setLayoutMode('single')}
                  onClose={() => setLayoutMode('single')}
                />
              </div>
              <div className="w-full h-full border-r border-slate-800">
                <SecondaryChartPane
                  paneId="grid-4-2"
                  defaultSymbol={symbol}
                  defaultTimeframe="M15"
                  onMaximize={() => setLayoutMode('single')}
                  onClose={() => setLayoutMode('single')}
                />
              </div>
              <div className="w-full h-full">
                <SecondaryChartPane
                  paneId="grid-4-3"
                  defaultSymbol={symbol}
                  defaultTimeframe="M1"
                  onMaximize={() => setLayoutMode('single')}
                  onClose={() => setLayoutMode('single')}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Asset / Symbol Search Modal */}
      <SymbolSearchModal
        isOpen={isSymbolSearchOpen}
        onClose={() => setIsSymbolSearchOpen(false)}
        selectedSymbol={symbol}
        onSelectSymbol={(newSym) => {
          if (onSymbolChange) onSymbolChange(newSym);
        }}
        activeProvider={activeProvider}
      />

      {/* Indicators Configuration Modal */}
      <IndicatorsModal
        isOpen={isIndicatorsModalOpen}
        onClose={() => setIsIndicatorsModalOpen(false)}
        activeIndicators={activeIndicators}
        onToggleIndicator={(k) =>
          setActiveIndicators({ ...activeIndicators, [k]: !activeIndicators[k] })
        }
        settings={indicatorSettings}
        onUpdateSettings={setIndicatorSettings}
      />

      {/* Price Alerts Modal */}
      <ChartAlertsModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        symbol={symbol}
        currentPrice={currentPrice}
        alerts={alerts}
        onCreateAlert={handleCreateAlert}
        onDeleteAlert={handleDeleteAlert}
        onTestSound={playAlertChime}
      />
    </div>
  );
};
