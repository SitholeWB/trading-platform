import React, { useState, useRef, useEffect, useCallback } from 'react';
import { IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts';
import { Trash2, X } from 'lucide-react';
import { DrawingItem, DrawingTool, Point } from './types';
import { Candle } from '../../types/trading';
import { calculatePips, formatPrice, getCandleTimeSeconds } from '../../utils/indicators';

interface DrawingCanvasProps {
  activeTool: DrawingTool;
  onToolComplete: () => void;
  drawings: DrawingItem[];
  onAddDrawing: (drawing: DrawingItem) => void;
  onUpdateDrawing: (drawing: DrawingItem) => void;
  onDeleteDrawing?: (id: string) => void;
  showDrawings: boolean;
  symbol: string;
  chart: IChartApi | null;
  series: ISeriesApi<any> | null;
  chartDimensions: { width: number; height: number };
  priceRange: { min: number; max: number };
  candles: Candle[];
}

function findCandleIndexByTime(candles: Candle[], time: number): number {
  if (candles.length === 0) return -1;
  let low = 0;
  let high = candles.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const t = getCandleTimeSeconds(candles[mid].timestamp);
    if (t === time) return mid;
    if (t < time) low = mid + 1;
    else high = mid - 1;
  }
  return Math.min(candles.length - 1, Math.max(0, low));
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  activeTool,
  onToolComplete,
  drawings,
  onAddDrawing,
  onUpdateDrawing,
  onDeleteDrawing,
  showDrawings,
  symbol,
  chart,
  series,
  chartDimensions,
  priceRange,
  candles,
}) => {
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [hoverPoint, setHoverPoint] = useState<Point | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [, setCanvasUpdate] = useState(0);

  // Directly subscribe to chart range changes so SVG canvas re-projects points
  // smoothly on every scroll/zoom without causing parent TradingChart to re-render!
  useEffect(() => {
    if (!chart) return;
    const handleRangeChange = () => {
      setCanvasUpdate((v) => v + 1);
    };
    chart.timeScale().subscribeVisibleLogicalRangeChange(handleRangeChange);
    return () => {
      try {
        chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleRangeChange);
      } catch {}
    };
  }, [chart]);

  // Dragging state for moving entire drawing or individual anchor handles
  const [dragState, setDragState] = useState<{
    drawingId: string;
    handleIndex: number; // -1 for entire drawing body, 0 for point 1, 1 for point 2
    startData: Point;
    origPoints: Point[];
  } | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const { width, height } = chartDimensions;
  const isInteracting = activeTool !== 'cursor';

  // ----------------------------------------------------
  // Coordinate Conversion: Data { time, price } <-> Screen { x, y }
  // ----------------------------------------------------
  const toScreen = useCallback(
    (pt: Point): { x: number; y: number } => {
      let x: number | null = null;
      let y: number | null = null;

      if (chart && pt.time) {
        try {
          x = chart.timeScale().timeToCoordinate(pt.time as UTCTimestamp);
        } catch {}
      }

      if (series && pt.price !== undefined && pt.price !== null) {
        try {
          y = series.priceToCoordinate(pt.price);
        } catch {}
      }

      // If point is scrolled off-screen horizontally, calculate true off-screen coordinate
      // via logical coordinates so drawing line geometry stays anchored and unwarped
      if (x === null && chart && candles.length > 0) {
        try {
          const timeScale = chart.timeScale();
          const candleIdx = findCandleIndexByTime(candles, pt.time);
          if (candleIdx >= 0) {
            x = timeScale.logicalToCoordinate(candleIdx as any);
          }
          if (x === null) {
            const firstTime = getCandleTimeSeconds(candles[0].timestamp);
            const lastTime = getCandleTimeSeconds(candles[candles.length - 1].timestamp);
            const firstCoord = timeScale.logicalToCoordinate(0 as any) ?? 0;
            const lastCoord = timeScale.logicalToCoordinate((candles.length - 1) as any) ?? width;
            const totalDuration = lastTime - firstTime;
            if (totalDuration > 0) {
              const ratio = (pt.time - firstTime) / totalDuration;
              x = Math.round(firstCoord + ratio * (lastCoord - firstCoord));
            }
          }
        } catch {}
      }

      if (x === null) {
        x = width / 2;
      }

      if (y === null) {
        const minP = priceRange.min;
        const maxP = priceRange.max;
        const ratio = (maxP - (pt.price ?? minP)) / (maxP - minP || 0.001);
        y = Math.round(ratio * height);
      }

      return { x: Math.round(x), y: Math.round(y) };
    },
    [chart, series, candles, width, height, priceRange]
  );

  const toData = useCallback(
    (pixelX: number, pixelY: number): Point => {
      let time: number | null = null;
      let price: number | null = null;

      if (chart) {
        try {
          const t = chart.timeScale().coordinateToTime(pixelX);
          if (t !== null && typeof t === 'number') {
            time = t;
          } else {
            const logical = chart.timeScale().coordinateToLogical(pixelX);
            if (logical !== null && candles.length > 0) {
              if (logical >= candles.length) {
                const lastTime = getCandleTimeSeconds(candles[candles.length - 1].timestamp);
                const step = candles.length > 1 ? lastTime - getCandleTimeSeconds(candles[candles.length - 2].timestamp) : 300;
                time = lastTime + Math.round((logical - (candles.length - 1)) * step);
              } else if (logical < 0) {
                const firstTime = getCandleTimeSeconds(candles[0].timestamp);
                const step = candles.length > 1 ? getCandleTimeSeconds(candles[1].timestamp) - firstTime : 300;
                time = firstTime + Math.round(logical * step);
              } else {
                const idx = Math.min(candles.length - 1, Math.max(0, Math.round(logical)));
                time = getCandleTimeSeconds(candles[idx].timestamp);
              }
            }
          }
        } catch {}
      }

      if (series) {
        try {
          const p = series.coordinateToPrice(pixelY);
          if (p !== null && typeof p === 'number' && !isNaN(p)) {
            price = p;
          }
        } catch {}
      }

      // Fallback approximations
      if (time === null) {
        if (candles.length > 0) {
          const firstTime = getCandleTimeSeconds(candles[0].timestamp);
          const lastTime = getCandleTimeSeconds(candles[candles.length - 1].timestamp);
          const ratio = Math.max(0, Math.min(1, pixelX / (width || 1)));
          time = Math.round(firstTime + ratio * (lastTime - firstTime));
        } else {
          time = Math.floor(Date.now() / 1000);
        }
      }

      if (price === null) {
        const minP = priceRange.min;
        const maxP = priceRange.max;
        const ratio = Math.max(0, Math.min(1, pixelY / (height || 1)));
        price = Number((maxP - ratio * (maxP - minP)).toFixed(5));
      }

      return { time, price, x: pixelX, y: pixelY };
    },
    [chart, series, candles, width, height, priceRange]
  );

  const getCoordinatesFromEvent = (e: React.MouseEvent<any>): Point => {
    if (!svgRef.current) return { time: Math.floor(Date.now() / 1000), price: 1.085 };
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return toData(x, y);
  };

  // ----------------------------------------------------
  // Keyboard Deletion & Escape listener
  // ----------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedId && (e.key === 'Delete' || e.key === 'Backspace')) {
        if (onDeleteDrawing) onDeleteDrawing(selectedId);
        setSelectedId(null);
      } else if (e.key === 'Escape') {
        setSelectedId(null);
        setCurrentPoints([]);
        setHoverPoint(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, onDeleteDrawing]);

  if (!showDrawings && activeTool === 'cursor' && !selectedId) return null;

  // ----------------------------------------------------
  // Tool Creation & Canvas Pointer Events
  // ----------------------------------------------------
  const handlePointerDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool === 'cursor') {
      // Clicked on empty SVG canvas -> deselect
      if (e.target === svgRef.current) {
        setSelectedId(null);
      }
      return;
    }

    const point = getCoordinatesFromEvent(e);

    // Single-click tools: Horizontal line
    if (activeTool === 'horizontal_line') {
      const newDrawing: DrawingItem = {
        id: `draw_${Date.now()}`,
        tool: 'horizontal_line',
        points: [point, { time: point.time + 3600, price: point.price }],
        color: '#38bdf8',
        lineWidth: 2,
        lineStyle: 'dashed',
        isComplete: true,
      };
      onAddDrawing(newDrawing);
      setSelectedId(newDrawing.id);
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
        const entry = startPoint.price;
        const target = Math.max(entry, endPoint.price);
        const stop = entry - (target - entry) * 0.5;
        const rr = target - entry > 0 && entry - stop > 0 ? (target - entry) / (entry - stop) : 2.0;
        extraData = {
          entryPrice: entry,
          takeProfitPrice: target,
          stopLossPrice: stop,
          riskRewardRatio: Number(rr.toFixed(2)),
        };
      } else if (activeTool === 'short_position') {
        const entry = startPoint.price;
        const target = Math.min(entry, endPoint.price);
        const stop = entry + (entry - target) * 0.5;
        const rr = entry - target > 0 && stop - entry > 0 ? (entry - target) / (stop - entry) : 2.0;
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
            : '#38bdf8',
        lineWidth: 2,
        lineStyle: 'solid',
        isComplete: true,
        extraData,
      };

      onAddDrawing(newDrawing);
      setSelectedId(newDrawing.id);
      setCurrentPoints([]);
      setHoverPoint(null);
      onToolComplete();
    }
  };

  // Global window listeners for drag operations so high-speed cursor movements
  // never drop or stutter outside the SVG bounds
  useEffect(() => {
    if (!dragState) return;

    const onWindowMouseMove = (e: MouseEvent) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const pixelX = e.clientX - rect.left;
      const pixelY = e.clientY - rect.top;
      const currentData = toData(pixelX, pixelY);

      const targetDrawing = drawings.find((d) => d.id === dragState.drawingId);
      if (!targetDrawing) return;

      if (dragState.handleIndex >= 0) {
        const newPts = [...targetDrawing.points];
        newPts[dragState.handleIndex] = currentData;

        let extraData = targetDrawing.extraData;
        if (targetDrawing.tool === 'long_position') {
          const entry = newPts[0].price;
          const target = Math.max(entry, newPts[1].price);
          const stop = entry - (target - entry) * 0.5;
          const rr = target - entry > 0 && entry - stop > 0 ? (target - entry) / (entry - stop) : 2;
          extraData = { ...extraData, entryPrice: entry, takeProfitPrice: target, stopLossPrice: stop, riskRewardRatio: Number(rr.toFixed(2)) };
        } else if (targetDrawing.tool === 'short_position') {
          const entry = newPts[0].price;
          const target = Math.min(entry, newPts[1].price);
          const stop = entry + (entry - target) * 0.5;
          const rr = entry - target > 0 && stop - entry > 0 ? (entry - target) / (stop - entry) : 2;
          extraData = { ...extraData, entryPrice: entry, takeProfitPrice: target, stopLossPrice: stop, riskRewardRatio: Number(rr.toFixed(2)) };
        }

        onUpdateDrawing({ ...targetDrawing, points: newPts, extraData });
      } else {
        const deltaTime = currentData.time - dragState.startData.time;
        const deltaPrice = currentData.price - dragState.startData.price;

        const shiftedPts = dragState.origPoints.map((p) => ({
          time: p.time + deltaTime,
          price: Number((p.price + deltaPrice).toFixed(5)),
        }));

        let extraData = targetDrawing.extraData;
        if (extraData) {
          extraData = {
            ...extraData,
            entryPrice: extraData.entryPrice !== undefined ? extraData.entryPrice + deltaPrice : undefined,
            stopLossPrice: extraData.stopLossPrice !== undefined ? extraData.stopLossPrice + deltaPrice : undefined,
            takeProfitPrice: extraData.takeProfitPrice !== undefined ? extraData.takeProfitPrice + deltaPrice : undefined,
          };
        }

        onUpdateDrawing({ ...targetDrawing, points: shiftedPts, extraData });
      }
    };

    const onWindowMouseUp = () => {
      setDragState(null);
    };

    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('mouseup', onWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);
    };
  }, [dragState, drawings, onUpdateDrawing, toData]);

  const handlePointerMove = (e: React.MouseEvent<SVGSVGElement>) => {
    // In-progress creation rubber-banding
    if (isInteracting && currentPoints.length > 0) {
      const pt = getCoordinatesFromEvent(e);
      setHoverPoint(pt);
    }
  };

  const handlePointerUp = () => {
    if (dragState) {
      setDragState(null);
    }
  };

  // ----------------------------------------------------
  // Selected Drawing Context / Floating Bar Helpers
  // ----------------------------------------------------
  const selectedDrawing = drawings.find((d) => d.id === selectedId);

  const handleColorChange = (newColor: string) => {
    if (!selectedDrawing) return;
    onUpdateDrawing({ ...selectedDrawing, color: newColor });
  };

  const handleLineWidthChange = (w: number) => {
    if (!selectedDrawing) return;
    onUpdateDrawing({ ...selectedDrawing, lineWidth: w });
  };

  const handleLineStyleChange = (st: 'solid' | 'dashed' | 'dotted') => {
    if (!selectedDrawing) return;
    onUpdateDrawing({ ...selectedDrawing, lineStyle: st });
  };

  // ----------------------------------------------------
  // SVG Graphic Renderers for Each Drawing Tool
  // ----------------------------------------------------
  const renderDrawing = (drawing: DrawingItem, isDraft = false) => {
    const isSelected = selectedId === drawing.id && !isDraft;
    const p1 = drawing.points[0];
    const p2 = drawing.points[1] || hoverPoint || p1;
    if (!p1) return null;

    const s1 = toScreen(p1);
    const s2 = toScreen(p2);

    const strokeColor = drawing.color || '#38bdf8';
    const strokeW = drawing.lineWidth || 2;
    const strokeDash =
      drawing.lineStyle === 'dashed' ? '5 5' : drawing.lineStyle === 'dotted' ? '2 2' : 'none';

    const handleAnchorDragStart = (e: React.MouseEvent, handleIdx: number) => {
      e.stopPropagation();
      const currentPoint = getCoordinatesFromEvent(e);
      setDragState({
        drawingId: drawing.id,
        handleIndex: handleIdx,
        startData: currentPoint,
        origPoints: drawing.points,
      });
    };

    const handleBodyDragStart = (e: React.MouseEvent) => {
      if (activeTool !== 'cursor') return;
      e.stopPropagation();
      setSelectedId(drawing.id);
      const currentPoint = getCoordinatesFromEvent(e);
      setDragState({
        drawingId: drawing.id,
        handleIndex: -1,
        startData: currentPoint,
        origPoints: drawing.points,
      });
    };

    // Render interactive selection handles
    const renderHandles = () => {
      if (!isSelected) return null;
      return (
        <g className="pointer-events-auto">
          <circle
            cx={s1.x}
            cy={s1.y}
            r={5.5}
            fill="#ffffff"
            stroke="#2563eb"
            strokeWidth={2}
            className="cursor-move hover:scale-125 transition-transform"
            onMouseDown={(e) => handleAnchorDragStart(e, 0)}
          />
          {drawing.tool !== 'horizontal_line' && (
            <circle
              cx={s2.x}
              cy={s2.y}
              r={5.5}
              fill="#ffffff"
              stroke="#2563eb"
              strokeWidth={2}
              className="cursor-move hover:scale-125 transition-transform"
              onMouseDown={(e) => handleAnchorDragStart(e, 1)}
            />
          )}
        </g>
      );
    };

    switch (drawing.tool) {
      case 'horizontal_line': {
        const y = s1.y;
        return (
          <g
            key={drawing.id}
            className="group cursor-pointer pointer-events-auto"
            onMouseDown={handleBodyDragStart}
          >
            {/* Wider transparent hit zone */}
            <line x1={0} y1={y} x2={width} y2={y} stroke="transparent" strokeWidth={12} />
            <line
              x1={0}
              y1={y}
              x2={width}
              y2={y}
              stroke={strokeColor}
              strokeWidth={strokeW}
              strokeDasharray={strokeDash}
            />
            {/* Price Badge on Right Axis */}
            <rect x={width - 70} y={y - 10} width={65} height={20} fill="#0284c7" rx={4} />
            <text
              x={width - 38}
              y={y + 4}
              fill="#ffffff"
              fontSize={10}
              fontFamily="monospace"
              textAnchor="middle"
              fontWeight="bold"
            >
              {formatPrice(p1.price, symbol)}
            </text>
            {renderHandles()}
          </g>
        );
      }

      case 'horizontal_ray': {
        const y = s1.y;
        return (
          <g
            key={drawing.id}
            className="group cursor-pointer pointer-events-auto"
            onMouseDown={handleBodyDragStart}
          >
            <line x1={s1.x} y1={y} x2={width} y2={y} stroke="transparent" strokeWidth={12} />
            <line
              x1={s1.x}
              y1={y}
              x2={width}
              y2={y}
              stroke={strokeColor}
              strokeWidth={strokeW}
              strokeDasharray={strokeDash}
            />
            <circle cx={s1.x} cy={y} r={3.5} fill={strokeColor} />
            {renderHandles()}
          </g>
        );
      }

      case 'trendline': {
        const pips = calculatePips(Math.abs(p2.price - p1.price), symbol);
        const midX = (s1.x + s2.x) / 2;
        const midY = (s1.y + s2.y) / 2;

        return (
          <g
            key={drawing.id}
            className="group cursor-pointer pointer-events-auto"
            onMouseDown={handleBodyDragStart}
          >
            <line x1={s1.x} y1={s1.y} x2={s2.x} y2={s2.y} stroke="transparent" strokeWidth={14} />
            <line
              x1={s1.x}
              y1={s1.y}
              x2={s2.x}
              y2={s2.y}
              stroke={strokeColor}
              strokeWidth={strokeW}
              strokeDasharray={strokeDash}
            />
            {/* Midpoint Info Pill */}
            <rect x={midX - 25} y={midY - 18} width={50} height={16} fill="#0f172a" rx={3} stroke="#334155" />
            <text
              x={midX}
              y={midY - 6}
              fill={strokeColor}
              fontSize={9}
              fontFamily="monospace"
              textAnchor="middle"
              fontWeight="bold"
            >
              {pips} p
            </text>
            {renderHandles()}
          </g>
        );
      }

      case 'fibonacci': {
        const topY = Math.min(s1.y, s2.y);
        const botY = Math.max(s1.y, s2.y);
        const diffY = botY - topY;
        const leftX = Math.min(s1.x, s2.x);
        const rightX = Math.max(width, Math.max(s1.x, s2.x) + 100);

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
          <g
            key={drawing.id}
            className="group cursor-pointer pointer-events-auto"
            onMouseDown={handleBodyDragStart}
          >
            {fibs.map((fib, idx) => {
              const y = s1.y < s2.y ? topY + diffY * fib.level : botY - diffY * fib.level;
              const nextFib = fibs[idx + 1];
              const nextY = nextFib ? (s1.y < s2.y ? topY + diffY * nextFib.level : botY - diffY * nextFib.level) : null;

              return (
                <g key={fib.level}>
                  {nextY !== null && (
                    <rect
                      x={leftX}
                      y={Math.min(y, nextY)}
                      width={Math.max(10, rightX - leftX)}
                      height={Math.abs(nextY - y)}
                      fill={fib.color}
                      opacity={0.08}
                    />
                  )}
                  <line
                    x1={leftX}
                    y1={y}
                    x2={rightX}
                    y2={y}
                    stroke={fib.color}
                    strokeWidth={fib.level === 0.618 || fib.level === 0.5 ? 1.5 : 1}
                    strokeDasharray={fib.level === 0 || fib.level === 1 ? 'none' : '3 3'}
                  />
                  <text
                    x={leftX + 4}
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
            {renderHandles()}
          </g>
        );
      }

      case 'long_position': {
        const entryY = s1.y;
        const targetY = Math.min(s1.y, s2.y);
        const stopY = s1.y + Math.max(20, (s1.y - targetY) * 0.5);
        const boxWidth = Math.max(120, Math.abs(s2.x - s1.x));
        const leftX = Math.min(s1.x, s2.x);
        const rr = drawing.extraData?.riskRewardRatio ?? 2.0;

        return (
          <g
            key={drawing.id}
            className="group cursor-pointer pointer-events-auto"
            onMouseDown={handleBodyDragStart}
          >
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
            <rect x={leftX + 4} y={entryY - 11} width={80} height={18} fill="#0f172a" rx={3} stroke="#38bdf8" />
            <text x={leftX + 44} y={entryY + 2} fill="#38bdf8" fontSize={10} fontFamily="monospace" textAnchor="middle" fontWeight="bold">
              R:R {rr.toFixed(2)}
            </text>
            <text x={leftX + 6} y={targetY + 12} fill="#34d399" fontSize={9} fontFamily="monospace" fontWeight="bold">
              Target (TP)
            </text>
            <text x={leftX + 6} y={stopY - 4} fill="#f87171" fontSize={9} fontFamily="monospace" fontWeight="bold">
              Stop Loss (SL)
            </text>
            {renderHandles()}
          </g>
        );
      }

      case 'short_position': {
        const entryY = s1.y;
        const targetY = Math.max(s1.y, s2.y);
        const stopY = s1.y - Math.max(20, (targetY - s1.y) * 0.5);
        const boxWidth = Math.max(120, Math.abs(s2.x - s1.x));
        const leftX = Math.min(s1.x, s2.x);
        const rr = drawing.extraData?.riskRewardRatio ?? 2.0;

        return (
          <g
            key={drawing.id}
            className="group cursor-pointer pointer-events-auto"
            onMouseDown={handleBodyDragStart}
          >
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
            <rect x={leftX + 4} y={entryY - 11} width={80} height={18} fill="#0f172a" rx={3} stroke="#38bdf8" />
            <text x={leftX + 44} y={entryY + 2} fill="#38bdf8" fontSize={10} fontFamily="monospace" textAnchor="middle" fontWeight="bold">
              R:R {rr.toFixed(2)}
            </text>
            <text x={leftX + 6} y={stopY + 12} fill="#f87171" fontSize={9} fontFamily="monospace" fontWeight="bold">
              Stop Loss (SL)
            </text>
            <text x={leftX + 6} y={targetY - 4} fill="#34d399" fontSize={9} fontFamily="monospace" fontWeight="bold">
              Target (TP)
            </text>
            {renderHandles()}
          </g>
        );
      }

      case 'rectangle': {
        const x = Math.min(s1.x, s2.x);
        const y = Math.min(s1.y, s2.y);
        const w = Math.max(10, Math.abs(s2.x - s1.x));
        const h = Math.max(10, Math.abs(s2.y - s1.y));

        return (
          <g
            key={drawing.id}
            className="group cursor-pointer pointer-events-auto"
            onMouseDown={handleBodyDragStart}
          >
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill={strokeColor}
              opacity={0.16}
              stroke={strokeColor}
              strokeWidth={strokeW}
              strokeDasharray={strokeDash}
            />
            <text x={x + 6} y={y + 14} fill={strokeColor} fontSize={9} fontFamily="monospace" fontWeight="bold">
              Order Block / Zone
            </text>
            {renderHandles()}
          </g>
        );
      }

      case 'ruler': {
        const x = Math.min(s1.x, s2.x);
        const y = Math.min(s1.y, s2.y);
        const w = Math.max(10, Math.abs(s2.x - s1.x));
        const h = Math.max(10, Math.abs(s2.y - s1.y));
        const diffPrice = p2.price - p1.price;
        const pips = calculatePips(diffPrice, symbol);
        const pct = p1.price ? ((diffPrice / p1.price) * 100).toFixed(2) : '0';

        return (
          <g
            key={drawing.id}
            className="group cursor-pointer pointer-events-auto"
            onMouseDown={handleBodyDragStart}
          >
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill="#06b6d4"
              opacity={0.12}
              stroke="#06b6d4"
              strokeWidth={1}
              strokeDasharray="2 2"
            />
            <line x1={s1.x} y1={s1.y} x2={s2.x} y2={s2.y} stroke="#06b6d4" strokeWidth={1.5} />
            {/* Ruler Info Box */}
            <rect x={x + w / 2 - 45} y={y + h / 2 - 16} width={90} height={32} fill="#0f172a" rx={4} stroke="#06b6d4" />
            <text x={x + w / 2} y={y + h / 2 - 2} fill="#38bdf8" fontSize={9} fontFamily="monospace" textAnchor="middle" fontWeight="bold">
              {pips >= 0 ? `+${pips}` : pips} pips ({pct}%)
            </text>
            <text x={x + w / 2} y={y + h / 2 + 10} fill="#94a3b8" fontSize={8} fontFamily="monospace" textAnchor="middle">
              Δ {Math.abs(diffPrice).toFixed(5)}
            </text>
            {renderHandles()}
          </g>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden">
      {/* 1. Floating CRUD Action Bar for Selected Drawing */}
      {selectedDrawing && (
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-slate-900/95 border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-2xl backdrop-blur-md text-xs font-mono pointer-events-auto animate-in fade-in zoom-in-95">
          <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider border-r border-slate-800 pr-2">
            {selectedDrawing.tool.replace('_', ' ')}
          </span>

          {/* Color Palette (8 colors) */}
          <div className="flex items-center gap-1">
            {['#38bdf8', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4', '#f97316', '#ffffff'].map((c) => (
              <button
                key={c}
                onClick={() => handleColorChange(c)}
                style={{ backgroundColor: c }}
                className={`w-4 h-4 rounded-full transition-transform ${
                  (selectedDrawing.color || '#38bdf8') === c ? 'scale-125 ring-2 ring-white shadow-md' : 'hover:scale-110'
                }`}
                title={`Set color ${c}`}
              />
            ))}
          </div>

          {/* Line Width */}
          <div className="flex items-center gap-0.5 border-l border-r border-slate-800 px-1.5">
            {[1, 2, 3, 4].map((w) => (
              <button
                key={w}
                onClick={() => handleLineWidthChange(w)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  (selectedDrawing.lineWidth || 2) === w ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                }`}
                title={`Stroke width ${w}px`}
              >
                {w}px
              </button>
            ))}
          </div>

          {/* Line Style */}
          <div className="flex items-center gap-0.5 border-r border-slate-800 pr-1.5">
            {(['solid', 'dashed', 'dotted'] as const).map((style) => (
              <button
                key={style}
                onClick={() => handleLineStyleChange(style)}
                className={`px-1.5 py-0.5 rounded text-[10px] ${
                  (selectedDrawing.lineStyle || 'solid') === style
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
                title={`Line style ${style}`}
              >
                {style === 'solid' ? '—' : style === 'dashed' ? '--' : '···'}
              </button>
            ))}
          </div>

          {/* Delete Button */}
          {onDeleteDrawing && (
            <button
              onClick={() => {
                onDeleteDrawing(selectedDrawing.id);
                setSelectedId(null);
              }}
              className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
              title="Delete Drawing (Delete / Backspace)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Deselect Button */}
          <button
            onClick={() => setSelectedId(null)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 ml-1"
            title="Deselect (Escape)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Interactive SVG Drawing Surface */}
      <svg
        ref={svgRef}
        className={`absolute inset-0 w-full h-full z-10 ${
          isInteracting ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'
        }`}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
      >
        {/* Render finalized drawings */}
        {showDrawings && drawings.map((d) => renderDrawing(d, false))}

        {/* Render live in-progress drawing preview */}
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
    </div>
  );
};
