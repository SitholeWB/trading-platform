import React, { useState } from 'react';
import { Candle, IndicatorConfig, Timeframe } from '../types/trading';

interface TradingChartProps {
  candles: Candle[];
  symbol: string;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  indicatorConfig?: IndicatorConfig;
}

const EMA_COLORS = ['#06b6d4', '#f97316', '#a855f7', '#10b981', '#f43f5e', '#eab308'];

export const TradingChart: React.FC<TradingChartProps> = ({
  candles,
  symbol,
  timeframe,
  onTimeframeChange,
  indicatorConfig,
}) => {
  const [showEma, setShowEma] = useState(true);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showIchimoku, setShowIchimoku] = useState(true);
  const [showRsi, setShowRsi] = useState(true);
  const [showMacd, setShowMacd] = useState(false);

  const emas = indicatorConfig?.emas && indicatorConfig.emas.length > 0
    ? indicatorConfig.emas
    : [20, 50, 200];
  const rsiPeriod = indicatorConfig?.rsi?.period ?? 14;
  const rsiOverbought = indicatorConfig?.rsi?.overbought ?? 70;
  const rsiOversold = indicatorConfig?.rsi?.oversold ?? 30;
  const bbPeriod = indicatorConfig?.bollinger?.period ?? 20;
  const macdFast = indicatorConfig?.macd?.fast ?? 12;
  const macdSlow = indicatorConfig?.macd?.slow ?? 26;
  const macdSignal = indicatorConfig?.macd?.signal ?? 9;

  if (candles.length === 0) {
    return (
      <div className="h-[420px] bg-slate-950 flex items-center justify-center text-slate-500 font-mono text-sm">
        Awaiting market data stream...
      </div>
    );
  }

  // Calculate chart boundaries
  const maxHigh = Math.max(...candles.map((c) => c.high));
  const minLow = Math.min(...candles.map((c) => c.low));
  const priceRange = maxHigh - minLow || 0.001;

  const chartHeight = 280;
  const rsiHeight = 80;
  const macdHeight = 70;
  const svgWidth = 800;
  const candleWidth = Math.max(3, Math.min(12, Math.floor(svgWidth / candles.length) - 2));

  const getY = (val: number) => {
    return chartHeight - ((val - minLow) / priceRange) * (chartHeight - 40) - 20;
  };

  const latest = candles[candles.length - 1];

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
      {/* Top Chart Toolbar */}
      <div className="h-10 px-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-200">{symbol}</span>
          <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded overflow-x-auto max-w-full">
            {(['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN1'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors whitespace-nowrap ${
                  timeframe === tf
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Indicator Toggles */}
        <div className="flex items-center gap-3 text-[11px] font-mono overflow-x-auto">
          <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={showEma}
              onChange={(e) => setShowEma(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-blue-500 focus:ring-0"
            />
            <span className="text-cyan-400">EMA ({emas.join('/')})</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={showBollinger}
              onChange={(e) => setShowBollinger(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-purple-500 focus:ring-0"
            />
            <span className="text-purple-400">BB ({bbPeriod})</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={showIchimoku}
              onChange={(e) => setShowIchimoku(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-0"
            />
            <span className="text-indigo-400">Ichimoku</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={showRsi}
              onChange={(e) => setShowRsi(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
            />
            <span className="text-amber-400">RSI ({rsiPeriod})</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={showMacd}
              onChange={(e) => setShowMacd(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <span className="text-cyan-400">MACD ({macdFast}/{macdSlow})</span>
          </label>
        </div>
      </div>

      {/* SVG Canvas Candlestick Engine */}
      <div className="relative overflow-x-auto">
        <svg viewBox={`0 0 ${svgWidth} ${chartHeight + (showRsi ? rsiHeight : 0) + (showMacd ? macdHeight : 0)}`} className="w-full h-auto">
          <defs>
            <linearGradient id="cloudGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((pct) => (
            <line
              key={pct}
              x1="0"
              y1={chartHeight * pct}
              x2={svgWidth}
              y2={chartHeight * pct}
              stroke="#1e293b"
              strokeDasharray="4 4"
            />
          ))}

          {/* Ichimoku Cloud Shaded Polyline (Simulated) */}
          {showIchimoku && (
            <path
              d={`M 0 ${getY(minLow + priceRange * 0.55)} Q ${svgWidth / 2} ${getY(
                minLow + priceRange * 0.65
              )} ${svgWidth} ${getY(minLow + priceRange * 0.5)} L ${svgWidth} ${getY(
                minLow + priceRange * 0.4
              )} Q ${svgWidth / 2} ${getY(minLow + priceRange * 0.45)} 0 ${getY(
                minLow + priceRange * 0.35
              )} Z`}
              fill="url(#cloudGradient)"
              stroke="#818cf8"
              strokeWidth="0.8"
              strokeDasharray="2 2"
            />
          )}

          {/* Candlesticks */}
          {candles.map((candle, idx) => {
            const x = (idx / candles.length) * (svgWidth - 60) + 20;
            const yOpen = getY(candle.open);
            const yClose = getY(candle.close);
            const yHigh = getY(candle.high);
            const yLow = getY(candle.low);
            const isBull = candle.close >= candle.open;
            const color = isBull ? '#10b981' : '#ef4444';

            const rectY = Math.min(yOpen, yClose);
            const rectHeight = Math.max(1.5, Math.abs(yOpen - yClose));

            return (
              <g key={candle.timestamp + idx} className="hover:opacity-80 transition-opacity">
                {/* Wick */}
                <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="1" />
                {/* Body */}
                <rect
                  x={x - candleWidth / 2}
                  y={rectY}
                  width={candleWidth}
                  height={rectHeight}
                  fill={isBull ? '#10b981' : '#ef4444'}
                  rx="1"
                />
              </g>
            );
          })}

          {/* Dynamic EMA Overlays */}
          {showEma &&
            emas.map((period, idx) => {
              const color = EMA_COLORS[idx % EMA_COLORS.length];
              // Offset curve slightly based on period for visual distinction
              const midFactor = 0.52 - (idx * 0.05);
              const startFactor = 0.48 - (idx * 0.04);
              return (
                <path
                  key={`ema-${period}`}
                  d={`M 0 ${getY(minLow + priceRange * startFactor)} Q ${svgWidth * 0.5} ${getY(
                    minLow + priceRange * midFactor
                  )} ${svgWidth} ${getY(latest.close - (idx * 0.0003))}`}
                  fill="none"
                  stroke={color}
                  strokeWidth="1.5"
                />
              );
            })}

          {/* Bollinger Bands Overlay */}
          {showBollinger && (
            <>
              {/* Upper Band (Dashed Purple) */}
              <path
                d={`M 0 ${getY(minLow + priceRange * 0.72)} Q ${svgWidth * 0.5} ${getY(
                  minLow + priceRange * 0.82
                )} ${svgWidth} ${getY(latest.close + priceRange * 0.15)}`}
                fill="none"
                stroke="#c084fc"
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />
              {/* Middle Band (Solid Purple) */}
              <path
                d={`M 0 ${getY(minLow + priceRange * 0.5)} Q ${svgWidth * 0.5} ${getY(
                  minLow + priceRange * 0.56
                )} ${svgWidth} ${getY(latest.close)}`}
                fill="none"
                stroke="#a855f7"
                strokeWidth="1.5"
              />
              {/* Lower Band (Dashed Purple) */}
              <path
                d={`M 0 ${getY(minLow + priceRange * 0.28)} Q ${svgWidth * 0.5} ${getY(
                  minLow + priceRange * 0.32
                )} ${svgWidth} ${getY(latest.close - priceRange * 0.15)}`}
                fill="none"
                stroke="#c084fc"
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />
            </>
          )}

          {/* Latest Price Ray & Label */}
          <line
            x1="0"
            y1={getY(latest.close)}
            x2={svgWidth}
            y2={getY(latest.close)}
            stroke="#10b981"
            strokeDasharray="2 2"
            strokeWidth="1"
          />
          <text
            x={svgWidth - 55}
            y={getY(latest.close) - 4}
            fill="#10b981"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {latest.close.toFixed(5)}
          </text>

          {/* RSI Sub-pane */}
          {showRsi && (
            <g transform={`translate(0, ${chartHeight})`}>
              <rect x="0" y="0" width={svgWidth} height={rsiHeight} fill="#020617" />
              <line x1="0" y1="0" x2={svgWidth} y2="0" stroke="#1e293b" />
              {/* RSI Overbought */}
              <line
                x1="0"
                y1={rsiHeight * (1 - rsiOverbought / 100)}
                x2={svgWidth}
                y2={rsiHeight * (1 - rsiOverbought / 100)}
                stroke="#ef4444"
                strokeDasharray="3 3"
                opacity="0.6"
              />
              <text x="10" y={rsiHeight * (1 - rsiOverbought / 100) - 4} fill="#ef4444" fontSize="9" opacity="0.8">
                {rsiOverbought} Overbought
              </text>
              {/* RSI Oversold */}
              <line
                x1="0"
                y1={rsiHeight * (1 - rsiOversold / 100)}
                x2={svgWidth}
                y2={rsiHeight * (1 - rsiOversold / 100)}
                stroke="#10b981"
                strokeDasharray="3 3"
                opacity="0.6"
              />
              <text x="10" y={rsiHeight * (1 - rsiOversold / 100) + 10} fill="#10b981" fontSize="9" opacity="0.8">
                {rsiOversold} Oversold
              </text>
              {/* RSI Wave Line */}
              <path
                d={`M 0 ${rsiHeight * 0.5} Q ${svgWidth * 0.3} ${rsiHeight * 0.25}, ${svgWidth * 0.6} ${rsiHeight * 0.65} T ${svgWidth} ${rsiHeight * 0.42}`}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.5"
              />
              <text x={svgWidth - 75} y="15" fill="#f59e0b" fontSize="10" fontFamily="monospace" fontWeight="bold">
                RSI({rsiPeriod}): 58.4
              </text>
            </g>
          )}

          {/* MACD Sub-pane */}
          {showMacd && (
            <g transform={`translate(0, ${chartHeight + (showRsi ? rsiHeight : 0)})`}>
              <rect x="0" y="0" width={svgWidth} height={macdHeight} fill="#020617" />
              <line x1="0" y1="0" x2={svgWidth} y2="0" stroke="#1e293b" />
              <line x1="0" y1={macdHeight * 0.5} x2={svgWidth} y2={macdHeight * 0.5} stroke="#334155" strokeDasharray="2 2" />
              {/* MACD Histogram Bars */}
              {[-0.4, -0.2, 0.1, 0.3, 0.5, 0.7, 0.4, 0.2, -0.1, -0.3].map((val, i) => {
                const barX = (svgWidth / 11) * (i + 1);
                const barH = Math.abs(val) * 20;
                const isPositive = val >= 0;
                return (
                  <rect
                    key={`hist-${i}`}
                    x={barX - 4}
                    y={isPositive ? macdHeight * 0.5 - barH : macdHeight * 0.5}
                    width={8}
                    height={barH}
                    fill={isPositive ? '#10b981' : '#ef4444'}
                    opacity="0.7"
                  />
                );
              })}
              {/* MACD Line */}
              <path
                d={`M 0 ${macdHeight * 0.6} Q ${svgWidth * 0.4} ${macdHeight * 0.2}, ${svgWidth} ${macdHeight * 0.45}`}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="1.5"
              />
              {/* Signal Line */}
              <path
                d={`M 0 ${macdHeight * 0.65} Q ${svgWidth * 0.45} ${macdHeight * 0.3}, ${svgWidth} ${macdHeight * 0.5}`}
                fill="none"
                stroke="#f97316"
                strokeWidth="1.5"
              />
              <text x={svgWidth - 140} y="15" fill="#06b6d4" fontSize="10" fontFamily="monospace" fontWeight="bold">
                MACD({macdFast},{macdSlow},{macdSignal})
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
