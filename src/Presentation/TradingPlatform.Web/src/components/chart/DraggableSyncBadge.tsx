import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, Clock, GripVertical, Minimize2, Maximize2 } from 'lucide-react';

interface DraggableSyncBadgeProps {
  secondsUntilSync?: number;
  isRefreshingCandles?: boolean;
  onManualSyncCandles?: () => void;
  containerWidth?: number;
  containerHeight?: number;
}

interface Position {
  x: number;
  y: number;
}

const STORAGE_POS_KEY = 'tp_chart_sync_widget_pos_v1';
const STORAGE_COMPACT_KEY = 'tp_chart_sync_widget_compact_v1';

export const DraggableSyncBadge: React.FC<DraggableSyncBadgeProps> = ({
  secondsUntilSync,
  isRefreshingCandles = false,
  onManualSyncCandles,
  containerWidth = 800,
  containerHeight = 450,
}) => {
  const badgeRef = useRef<HTMLDivElement | null>(null);

  // null = default anchored position at top-right of the chart canvas (left of price scale)
  const [pos, setPos] = useState<Position | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_POS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [isCompact, setIsCompact] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_COMPACT_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  // Clamp saved position inside visible chart viewport when window/container resizes
  useEffect(() => {
    if (!pos || !badgeRef.current) return;
    const rect = badgeRef.current.getBoundingClientRect();
    const w = rect.width || 220;
    const h = rect.height || 34;
    const maxX = Math.max(8, containerWidth - w - 8);
    const maxY = Math.max(8, containerHeight - h - 8);
    const clampedX = Math.min(Math.max(8, pos.x), maxX);
    const clampedY = Math.min(Math.max(8, pos.y), maxY);
    if (clampedX !== pos.x || clampedY !== pos.y) {
      setPos({ x: clampedX, y: clampedY });
    }
  }, [containerWidth, containerHeight]);

  const handleToggleCompact = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCompact((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_COMPACT_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleResetPosition = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPos(null);
    try {
      localStorage.removeItem(STORAGE_POS_KEY);
    } catch {
      // ignore
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Do not start dragging when clicking interactive action buttons inside the badge
    if ((e.target as HTMLElement).closest('button')) return;
    if (!badgeRef.current) return;

    const parentRect = badgeRef.current.offsetParent?.getBoundingClientRect();
    const badgeRect = badgeRef.current.getBoundingClientRect();
    const currentX = pos ? pos.x : parentRect ? badgeRect.left - parentRect.left : 16;
    const currentY = pos ? pos.y : parentRect ? badgeRect.top - parentRect.top : 8;

    dragStateRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: currentX,
      originY: currentY,
      moved: false,
    };

    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStateRef.current || !badgeRef.current) return;
    const dx = e.clientX - dragStateRef.current.startX;
    const dy = e.clientY - dragStateRef.current.startY;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      dragStateRef.current.moved = true;
    }

    const rect = badgeRef.current.getBoundingClientRect();
    const w = rect.width || 200;
    const h = rect.height || 34;

    const maxX = Math.max(8, containerWidth - w - 8);
    const maxY = Math.max(8, containerHeight - h - 8);

    const nextX = Math.min(Math.max(8, dragStateRef.current.originX + dx), maxX);
    const nextY = Math.min(Math.max(8, dragStateRef.current.originY + dy), maxY);

    setPos({ x: nextX, y: nextY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (pos && dragStateRef.current?.moved) {
      try {
        localStorage.setItem(STORAGE_POS_KEY, JSON.stringify(pos));
      } catch {
        // ignore
      }
    }
    dragStateRef.current = null;
  };

  const isUrgent = secondsUntilSync !== undefined && secondsUntilSync <= 5;

  return (
    <div
      ref={badgeRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={handleResetPosition}
      style={
        pos
          ? { left: `${pos.x}px`, top: `${pos.y}px` }
          : { top: '8px', right: '78px' }
      }
      className={`absolute z-30 flex items-center gap-1.5 px-2 py-1 rounded-xl text-xs font-sans select-none pointer-events-auto shadow-xl backdrop-blur-md transition-shadow border ${
        isDragging ? 'cursor-grabbing ring-2 ring-blue-400/70 shadow-2xl' : 'cursor-grab'
      } ${
        isRefreshingCandles
          ? 'bg-slate-950/90 border-blue-500/80 text-blue-200 shadow-blue-950/60'
          : isUrgent
          ? 'bg-slate-950/90 border-amber-400/90 text-amber-200 shadow-amber-950/60'
          : 'bg-slate-950/88 border-emerald-500/60 text-emerald-300 shadow-slate-950/70'
      }`}
      title="Drag to move anywhere on chart (double-click to reset position)"
    >
      {/* Drag Handle Grip */}
      <GripVertical className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 flex-shrink-0 -ml-0.5" />

      {/* Glowing Live / Radar Beacon */}
      <span className="relative flex h-2 w-2 flex-shrink-0">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            isRefreshingCandles ? 'bg-blue-400' : isUrgent ? 'bg-amber-400' : 'bg-emerald-400'
          }`}
        />
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            isRefreshingCandles ? 'bg-blue-500' : isUrgent ? 'bg-amber-400' : 'bg-emerald-400'
          }`}
        />
      </span>

      {/* Countdown / Refresh Status */}
      {isRefreshingCandles ? (
        <div className="flex items-center gap-1 font-semibold text-blue-200">
          <RefreshCw className="w-3 h-3 animate-spin text-blue-400 flex-shrink-0" />
          {!isCompact && <span className="tracking-tight text-[11px] whitespace-nowrap">Refreshing prices...</span>}
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          {!isCompact && (
            <>
              <Clock
                className={`w-3 h-3 flex-shrink-0 ${
                  isUrgent ? 'text-amber-300 animate-spin' : 'text-emerald-400'
                }`}
              />
              <span className="text-slate-200 font-medium tracking-tight whitespace-nowrap text-[11px]">
                Refresh prices in
              </span>
            </>
          )}
          <span
            className={`px-1.5 py-0.2 rounded-md font-mono font-black text-[11px] tracking-wider shadow-inner border ${
              isUrgent
                ? 'bg-amber-500/30 text-amber-100 border-amber-300 ring-1 ring-amber-400/50'
                : 'bg-emerald-500/25 text-emerald-100 border-emerald-400/60 ring-1 ring-emerald-400/30'
            }`}
          >
            {secondsUntilSync !== undefined ? `${secondsUntilSync}s` : '60s'}
          </span>
        </div>
      )}

      {/* Manual Sync Button */}
      {onManualSyncCandles && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onManualSyncCandles();
          }}
          disabled={isRefreshingCandles}
          className={`px-1.5 py-0.5 rounded-md border text-[10px] font-sans font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${
            isRefreshingCandles
              ? 'bg-slate-800/40 border-slate-700/50 text-slate-500 cursor-not-allowed'
              : 'bg-emerald-500/20 hover:bg-emerald-500/35 border-emerald-400/50 text-emerald-200 hover:text-white shadow-sm cursor-pointer'
          }`}
          title="Immediate Sync: Pull latest market tick & candles now"
        >
          <RefreshCw className={`w-2.5 h-2.5 ${isRefreshingCandles ? 'animate-spin text-blue-400' : 'text-emerald-300'}`} />
          {!isCompact && <span>Sync</span>}
        </button>
      )}

      {/* Compact / Expand Toggle Button */}
      <button
        type="button"
        onClick={handleToggleCompact}
        className="p-0.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors cursor-pointer"
        title={isCompact ? 'Expand refresh countdown badge' : 'Minimize to compact countdown pill'}
      >
        {isCompact ? <Maximize2 className="w-2.5 h-2.5" /> : <Minimize2 className="w-2.5 h-2.5" />}
      </button>
    </div>
  );
};

