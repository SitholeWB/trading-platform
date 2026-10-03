import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, ColorType, CrosshairMode, UTCTimestamp } from 'lightweight-charts';
import { Timeframe, Candle } from '../../types/trading';
import { tradingApi } from '../../api/tradingClient';
import { getCandleTimeSeconds, sanitizeCandles, calculateEMA, formatPrice } from '../../utils/indicators';
import { Maximize2, X, RefreshCw, Loader2 } from 'lucide-react';

interface SecondaryChartPaneProps {
  paneId: string;
  defaultSymbol: string;
  defaultTimeframe: Timeframe;
  onMaximize?: () => void;
  onClose?: () => void;
}

export const SecondaryChartPane: React.FC<SecondaryChartPaneProps> = ({
  paneId,
  defaultSymbol,
  defaultTimeframe,
  onMaximize,
  onClose,
}) => {
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [timeframe, setTimeframe] = useState<Timeframe>(defaultTimeframe);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<any> | null>(null);
  const emaSeriesRef = useRef<ISeriesApi<any> | null>(null);

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

  // Fetch candles for this secondary pane
  const fetchCandles = async () => {
    setIsLoading(true);
    try {
      const data = await tradingApi.getCandles(symbol, timeframe, 150);
      if (data && data.length > 0) {
        setCandles(sanitizeCandles(data));
      }
    } catch (e) {
      console.warn(`[SecondaryChartPane ${paneId}] failed to load candles:`, e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandles();
    const interval = setInterval(fetchCandles, 8000);
    return () => clearInterval(interval);
  }, [symbol, timeframe]);

  // Initialize Lightweight Chart on mount
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
      width: container.clientWidth || 400,
      height: container.clientHeight || 300,
      layout: {
        background: { type: ColorType.Solid, color: '#090e1a' },
        textColor: '#64748b',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.4)' },
        horzLines: { color: 'rgba(30, 41, 59, 0.4)' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#1e293b' },
      timeScale: { borderColor: '#1e293b', timeVisible: true, secondsVisible: false },
    });

    chartRef.current = chart;

    const series = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });
    seriesRef.current = series;

    const emaSeries = chart.addLineSeries({
      color: '#06b6d4',
      lineWidth: 1,
      title: 'EMA 20',
    });
    emaSeriesRef.current = emaSeries;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0 || !chartRef.current) return;
      const { width, height } = entries[0].contentRect;
      try {
        chartRef.current.applyOptions({ width, height });
      } catch {}
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      try {
        chart.remove();
      } catch {}
      chartRef.current = null;
      seriesRef.current = null;
      emaSeriesRef.current = null;
    };
  }, []);

  // Update candle data in secondary chart
  useEffect(() => {
    if (!seriesRef.current || candles.length === 0) return;
    try {
      seriesRef.current.setData(
        candles.map((c) => ({
          time: getCandleTimeSeconds(c.timestamp) as UTCTimestamp,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }))
      );

      if (emaSeriesRef.current) {
        const ema20 = calculateEMA(candles, 20);
        emaSeriesRef.current.setData(
          ema20.map((p) => ({ time: p.time as UTCTimestamp, value: p.value }))
        );
      }
    } catch {}
  }, [candles]);

  const latestCandle = candles[candles.length - 1];
  const currentPrice = latestCandle?.close ?? 0;

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-[#090e1a] border border-slate-800 rounded-xl overflow-hidden relative">
      {/* Pane Mini Header */}
      <div className="h-8 px-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs select-none flex-shrink-0 z-10 font-sans">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-slate-200 text-xs">{symbol}</span>
          <span className="font-mono text-[11px] text-slate-400">
            {currentPrice > 0 ? formatPrice(currentPrice, symbol) : '—'}
          </span>

          {/* Timeframe selector pills */}
          <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded border border-slate-800 ml-1">
            {timeframes.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                className={`px-1.5 py-0.2 rounded text-[10px] font-mono transition-all ${
                  timeframe === tf.value
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isLoading && <Loader2 className="w-3 h-3 text-blue-400 animate-spin mr-1" />}
          <button
            onClick={fetchCandles}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            title="Refresh feed"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
          {onMaximize && (
            <button
              onClick={onMaximize}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              title="Maximize this chart"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800"
              title="Close split pane"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Chart Canvas */}
      <div ref={containerRef} className="flex-1 w-full h-full relative" />
    </div>
  );
};
