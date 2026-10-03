import React, { useState, useRef } from 'react';
import { DrawingItem, DrawingTool, Point } from './types';
import { calculatePips, formatPrice } from '../../utils/indicators';

interface DrawingCanvasProps {
  activeTool: DrawingTool;
  onToolComplete: () => void;
  drawings: DrawingItem[];
  onAddDrawing: (drawing: DrawingItem) => void;
  onUpdateDrawing: (drawing: DrawingItem) => void;
  showDrawings: boolean;
  symbol: string;
  chartDimensions: { width: number; height: number };
  priceRange: { min: number; max: number };
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  activeTool,
  onToolComplete,
  drawings,
  onAddDrawing,
  showDrawings,
  symbol,
  chartDimensions,
  priceRange,
}) => {
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [hoverPoint, setHoverPoint] = useState<Point | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  if (!showDrawings && activeTool === 'cursor') return null;

  const { width, height } = chartDimensions;
  const isInteracting = activeTool !== 'cursor';

  // Helper to convert screen Y to estimated price
  const screenYToPrice = (y: number) => {
    if (height <= 0) return 0;
    const range = priceRange.max - priceRange.min || 0.001;
    return priceRange.max - (y / height) * range;
  };

  const getCoordinates = (e: React.MouseEvent<SVGSVGElement>): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return { x, y, price: screenYToPrice(y) };
  };

  const handlePointerDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isInteracting) return;
    const point = getCoordinates(e);

    // Single-click tools: Horizontal line
    if (activeTool === 'horizontal_line') {
      const newDrawing: DrawingItem = {
        id: `draw_${Date.now()}`,
        tool: 'horizontal_line',
        points: [{ x: 0, y: point.y, price: point.price }, { x: width, y: point.y, price: point.price }],
        color: '#38bdf8',
        isComplete: true,
      };
      onAddDrawing(newDrawing);
      onToolComplete();
      return;
    }

    // Two-point tools: Trendline, Horizontal ray, Fibonacci, Long/Short position, Rectangle, Ruler
    if (currentPoints.length === 0) {
      setCurrentPoints([point]);
    } else {
      const startPoint = currentPoints[0];
      const endPoint = point;

      let extraData: DrawingItem['extraData'] = undefined;

      if (activeTool === 'long_position') {
        const entry = startPoint.price || 0;
        const target = Math.max(entry, endPoint.price || entry);
        const stop = entry - (target - entry) * 0.5;
        const rr = (target - entry) > 0 && (entry - stop) > 0 ? (target - entry) / (entry - stop) : 2;
        extraData = {
          entryPrice: entry,
          takeProfitPrice: target,
          stopLossPrice: stop,
          riskRewardRatio: Number(rr.toFixed(2)),
        };
      } else if (activeTool === 'short_position') {
        const entry = startPoint.price || 0;
        const target = Math.min(entry, endPoint.price || entry);
        const stop = entry + (entry - target) * 0.5;
        const rr = (entry - target) > 0 && (stop - entry) > 0 ? (entry - target) / (stop - entry) : 2;
        extraData = {
          entryPrice: entry,
          takeProfitPrice: target,
          stopLossPrice: stop,
          riskRewardRatio: Number(rr.toFixed(2)),
        };
      }

      const newDrawing: DrawingItem = {
        id: `draw_${Date.now()}`,
        tool: activeTool,
        points: [startPoint, endPoint],
        color:
          activeTool === 'fibonacci'
            ? '#f59e0b'
            : activeTool === 'long_position'
            ? '#10b981'
            : activeTool === 'short_position'
            ? '#ef4444'
            : activeTool === 'rectangle'
            ? '#a855f7'
            : activeTool === 'ruler'
            ? '#06b6d4'
            : '#3b82f6',
        isComplete: true,
        extraData,
      };

      onAddDrawing(newDrawing);
      setCurrentPoints([]);
      setHoverPoint(null);
      onToolComplete();
    }
  };

  const handlePointerMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isInteracting) return;
    const pt = getCoordinates(e);
    setHoverPoint(pt);
  };

  // Helper to render individual drawings
  const renderDrawing = (drawing: DrawingItem, isDraft = false) => {
    const p1 = drawing.points[0];
    const p2 = drawing.points[1] || hoverPoint || p1;
    if (!p1) return null;

    switch (drawing.tool) {
      case 'horizontal_line': {
        const y = p1.y;
        const price = p1.price ?? screenYToPrice(y);
        return (
          <g key={drawing.id}>
            <line x1={0} y1={y} x2={width} y2={y} stroke="#38bdf8" strokeWidth={1.5} strokeDasharray="3 3" />
            <rect x={width - 70} y={y - 10} width={65} height={20} fill="#0284c7" rx={4} />
            <text x={width - 38} y={y + 4} fill="#ffffff" fontSize={10} fontFamily="monospace" textAnchor="middle" fontWeight="bold">
              {formatPrice(price, symbol)}
            </text>
          </g>
        );
      }

      case 'horizontal_ray': {
        const y = p1.y;
        return (
          <g key={drawing.id}>
            <line x1={p1.x} y1={y} x2={width} y2={y} stroke="#0ea5e9" strokeWidth={1.5} />
            <circle cx={p1.x} cy={y} r={3} fill="#0ea5e9" />
          </g>
        );
      }

      case 'trendline': {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const pips = p1.price && p2.price ? calculatePips(Math.abs(p2.price - p1.price), symbol) : 0;
        return (
          <g key={drawing.id}>
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#3b82f6" strokeWidth={2} />
            <circle cx={p1.x} cy={p1.y} r={3.5} fill="#60a5fa" />
            <circle cx={p2.x} cy={p2.y} r={3.5} fill="#60a5fa" />
            {/* Midpoint tag with pips */}
            <rect
              x={(p1.x + p2.x) / 2 - 25}
              y={(p1.y + p2.y) / 2 - 16}
              width={50}
              height={16}
              fill="#1e293b"
              rx={3}
              stroke="#334155"
            />
            <text
              x={(p1.x + p2.x) / 2}
              y={(p1.y + p2.y) / 2 - 4}
              fill="#93c5fd"
              fontSize={9}
              fontFamily="monospace"
              textAnchor="middle"
            >
              {pips} pips
            </text>
          </g>
        );
      }

      case 'fibonacci': {
        const topY = Math.min(p1.y, p2.y);
        const botY = Math.max(p1.y, p2.y);
        const diffY = botY - topY;

        // TradingView Fibonacci Levels
        const fibs = [
          { level: 0.0, color: '#94a3b8', label: '0.0%' },
          { level: 0.236, color: '#f87171', label: '23.6%' },
          { level: 0.382, color: '#fb923c', label: '38.2%' },
          { level: 0.5, color: '#4ade80', label: '50.0%' },
          { level: 0.618, color: '#facc15', label: '61.8% (Golden)' },
          { level: 0.786, color: '#60a5fa', label: '78.6%' },
          { level: 1.0, color: '#94a3b8', label: '100.0%' },
        ];

        return (
          <g key={drawing.id}>
            {fibs.map((fib, idx) => {
              const y = p1.y < p2.y ? topY + diffY * fib.level : botY - diffY * fib.level;
              const nextFib = fibs[idx + 1];
              const nextY = nextFib ? (p1.y < p2.y ? topY + diffY * nextFib.level : botY - diffY * nextFib.level) : null;

              return (
                <g key={fib.level}>
                  {/* Shaded ribbon between levels */}
                  {nextY !== null && (
                    <rect
                      x={Math.min(p1.x, p2.x)}
                      y={Math.min(y, nextY)}
                      width={Math.max(width - Math.min(p1.x, p2.x), 100)}
                      height={Math.abs(nextY - y)}
                      fill={fib.color}
                      opacity={0.08}
                    />
                  )}
                  {/* Line */}
                  <line
                    x1={Math.min(p1.x, p2.x)}
                    y1={y}
                    x2={width}
                    y2={y}
                    stroke={fib.color}
                    strokeWidth={fib.level === 0.618 || fib.level === 0.5 ? 1.5 : 1}
                    strokeDasharray={fib.level === 0 || fib.level === 1 ? 'none' : '3 3'}
                  />
                  {/* Label */}
                  <text
                    x={Math.min(p1.x, p2.x) + 4}
                    y={y - 3}
                    fill={fib.color}
                    fontSize={9}
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {fib.label}
                  </text>
                </g>
              );
            })}
          </g>
        );
      }

      case 'long_position': {
        const entryY = p1.y;
        const targetY = Math.min(p1.y, p2.y);
        const stopY = p1.y + (p1.y - targetY) * 0.5;
        const boxWidth = Math.max(120, Math.abs(p2.x - p1.x));
        const leftX = Math.min(p1.x, p2.x);

        return (
          <g key={drawing.id}>
            {/* Target Green Profit Zone */}
            <rect
              x={leftX}
              y={targetY}
              width={boxWidth}
              height={Math.max(1, entryY - targetY)}
              fill="#10b981"
              opacity={0.2}
              stroke="#10b981"
              strokeWidth={1}
            />
            {/* Stop Red Loss Zone */}
            <rect
              x={leftX}
              y={entryY}
              width={boxWidth}
              height={Math.max(1, stopY - entryY)}
              fill="#ef4444"
              opacity={0.2}
              stroke="#ef4444"
              strokeWidth={1}
            />
            {/* Central Entry Line */}
            <line x1={leftX} y1={entryY} x2={leftX + boxWidth} y2={entryY} stroke="#38bdf8" strokeWidth={2} />
            {/* Badge R:R */}
            <rect x={leftX + 4} y={entryY - 12} width={75} height={18} fill="#0f172a" rx={3} stroke="#38bdf8" />
            <text x={leftX + 41} y={entryY + 1} fill="#38bdf8" fontSize={10} fontFamily="monospace" textAnchor="middle" fontWeight="bold">
              R:R 2.00
            </text>
            <text x={leftX + 6} y={targetY + 12} fill="#34d399" fontSize={9} fontFamily="monospace" fontWeight="bold">
              Target (TP)
            </text>
            <text x={leftX + 6} y={stopY - 4} fill="#f87171" fontSize={9} fontFamily="monospace" fontWeight="bold">
              Stop Loss (SL)
            </text>
          </g>
        );
      }

      case 'short_position': {
        const entryY = p1.y;
        const targetY = Math.max(p1.y, p2.y);
        const stopY = p1.y - (targetY - p1.y) * 0.5;
        const boxWidth = Math.max(120, Math.abs(p2.x - p1.x));
        const leftX = Math.min(p1.x, p2.x);

        return (
          <g key={drawing.id}>
            {/* Stop Red Loss Zone */}
            <rect
              x={leftX}
              y={stopY}
              width={boxWidth}
              height={Math.max(1, entryY - stopY)}
              fill="#ef4444"
              opacity={0.2}
              stroke="#ef4444"
              strokeWidth={1}
            />
            {/* Target Green Profit Zone */}
            <rect
              x={leftX}
              y={entryY}
              width={boxWidth}
              height={Math.max(1, targetY - entryY)}
              fill="#10b981"
              opacity={0.2}
              stroke="#10b981"
              strokeWidth={1}
            />
            {/* Central Entry Line */}
            <line x1={leftX} y1={entryY} x2={leftX + boxWidth} y2={entryY} stroke="#38bdf8" strokeWidth={2} />
            <rect x={leftX + 4} y={entryY - 12} width={75} height={18} fill="#0f172a" rx={3} stroke="#38bdf8" />
            <text x={leftX + 41} y={entryY + 1} fill="#38bdf8" fontSize={10} fontFamily="monospace" textAnchor="middle" fontWeight="bold">
              R:R 2.00
            </text>
            <text x={leftX + 6} y={stopY + 12} fill="#f87171" fontSize={9} fontFamily="monospace" fontWeight="bold">
              Stop Loss (SL)
            </text>
            <text x={leftX + 6} y={targetY - 4} fill="#34d399" fontSize={9} fontFamily="monospace" fontWeight="bold">
              Target (TP)
            </text>
          </g>
        );
      }

      case 'rectangle': {
        const x = Math.min(p1.x, p2.x);
        const y = Math.min(p1.y, p2.y);
        const w = Math.abs(p2.x - p1.x);
        const h = Math.abs(p2.y - p1.y);
        return (
          <g key={drawing.id}>
            <rect x={x} y={y} width={w} height={h} fill="#a855f7" opacity={0.15} stroke="#c084fc" strokeWidth={1.5} />
            <text x={x + 5} y={y + 12} fill="#c084fc" fontSize={9} fontFamily="monospace" fontWeight="bold">
              Order Block / Zone
            </text>
          </g>
        );
      }

      case 'ruler': {
        const x = Math.min(p1.x, p2.x);
        const y = Math.min(p1.y, p2.y);
        const w = Math.abs(p2.x - p1.x);
        const h = Math.abs(p2.y - p1.y);
        const p1Price = p1.price ?? screenYToPrice(p1.y);
        const p2Price = p2.price ?? screenYToPrice(p2.y);
        const diffPrice = p2Price - p1Price;
        const pips = calculatePips(diffPrice, symbol);
        const pct = p1Price ? ((diffPrice / p1Price) * 100).toFixed(2) : '0';

        return (
          <g key={drawing.id}>
            <rect x={x} y={y} width={w} height={h} fill="#06b6d4" opacity={0.12} stroke="#06b6d4" strokeWidth={1} strokeDasharray="2 2" />
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#06b6d4" strokeWidth={1.5} />
            {/* Ruler Info Box */}
            <rect x={x + w / 2 - 45} y={y + h / 2 - 16} width={90} height={32} fill="#0f172a" rx={4} stroke="#06b6d4" />
            <text x={x + w / 2} y={y + h / 2 - 2} fill="#38bdf8" fontSize={9} fontFamily="monospace" textAnchor="middle" fontWeight="bold">
              {pips >= 0 ? `+${pips}` : pips} pips ({pct}%)
            </text>
            <text x={x + w / 2} y={y + h / 2 + 10} fill="#94a3b8" fontSize={8} fontFamily="monospace" textAnchor="middle">
              Δ {Math.abs(diffPrice).toFixed(5)}
            </text>
          </g>
        );
      }

      default:
        return null;
    }
  };

  return (
    <svg
      ref={svgRef}
      className={`absolute inset-0 w-full h-full z-10 ${
        isInteracting ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'
      }`}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
    >
      {/* Existing finalized drawings */}
      {showDrawings && drawings.map((d) => renderDrawing(d, false))}

      {/* In-progress active draft drawing */}
      {currentPoints.length > 0 &&
        renderDrawing(
          {
            id: 'draft',
            tool: activeTool,
            points: currentPoints,
            isComplete: false,
          },
          true
        )}
    </svg>
  );
};
