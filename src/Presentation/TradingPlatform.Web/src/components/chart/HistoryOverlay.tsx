import React, { useEffect, useState } from 'react';
import { IChartApi, UTCTimestamp } from 'lightweight-charts';
import { History, Loader2, Ban, AlertTriangle } from 'lucide-react';

export interface HistoryBoundary {
  time: number;
  loaded: number;
  total: number;
  batch: number;
}

interface HistoryOverlayProps {
  chart: IChartApi | null;
  boundaries: HistoryBoundary[];
  totalBars: number;
  oldestTime: number | null;
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;
  onLoadMore: () => void;
}

const fmtTime = (t: number) => {
  const d = new Date(t * 1000);
  return d.toISOString().slice(0, 16).replace('T', ' ');
};

/**
 * Draws a dashed vertical line at every history-page boundary (where an older page joins the
 * previously loaded data) and shows a persistent status badge: total bars, pages loaded,
 * oldest bar time and whether the provider has more history.
 */
export const HistoryOverlay: React.FC<HistoryOverlayProps> = ({
  chart,
  boundaries,
  totalBars,
  oldestTime,
  isLoading,
  hasMore,
  error,
  onLoadMore,
}) => {
  const [, setTick] = useState(0);

  // Re-project boundary lines on every scroll/zoom, locally (no parent re-render)
  useEffect(() => {
    if (!chart) return;
    const onChange = () => setTick((v) => v + 1);
    chart.timeScale().subscribeVisibleLogicalRangeChange(onChange);
    return () => {
      try {
        chart.timeScale().unsubscribeVisibleLogicalRangeChange(onChange);
      } catch {}
    };
  }, [chart]);

  const lines = chart
    ? boundaries
        .map((b) => {
          let x: number | null = null;
          try {
            x = chart.timeScale().timeToCoordinate(b.time as UTCTimestamp);
          } catch {}
          return x === null ? null : { ...b, x };
        })
        .filter((l): l is HistoryBoundary & { x: number } => l !== null)
    : [];

  return (
    <>
      {/* Boundary lines (non-interactive so they never block chart panning) */}
      <div className="absolute inset-0 pointer-events-none z-[5] overflow-hidden">
        {lines.map((l) => (
          <div
            key={`${l.batch}-${l.time}`}
            className="absolute top-0 bottom-0 border-l border-dashed border-violet-400/60"
            style={{ left: Math.round(l.x) - 4 }}
          >
            <div className="absolute bottom-6 left-1 whitespace-nowrap rounded bg-violet-950/85 border border-violet-500/40 px-1.5 py-0.5 text-[10px] font-mono text-violet-200">
              ◀ page #{l.batch}: +{l.loaded} bars · total {l.total}
            </div>
          </div>
        ))}
      </div>

      {/* Persistent history status badge */}
      <div className="absolute bottom-2 left-2 z-20 flex items-center gap-2 rounded-md border border-slate-700/80 bg-slate-950/90 px-2 py-1 text-[10px] font-mono text-slate-300 shadow-lg">
        <History className="h-3 w-3 text-violet-400" />
        <span>
          <span className="text-slate-100 font-bold">{totalBars}</span> bars
        </span>
        <span className="text-slate-600">|</span>
        <span>{boundaries.length} older page{boundaries.length === 1 ? '' : 's'}</span>
        {oldestTime !== null && (
          <>
            <span className="text-slate-600">|</span>
            <span>from {fmtTime(oldestTime)} UTC</span>
          </>
        )}
        <span className="text-slate-600">|</span>
        {isLoading ? (
          <span className="flex items-center gap-1 text-sky-300">
            <Loader2 className="h-3 w-3 animate-spin" /> loading older bars…
          </span>
        ) : error ? (
          <button onClick={onLoadMore} className="flex items-center gap-1 text-amber-300 hover:text-amber-200" title={error}>
            <AlertTriangle className="h-3 w-3" /> load failed – retry
          </button>
        ) : hasMore ? (
          <button onClick={onLoadMore} className="text-emerald-300 hover:text-emerald-200" title="Or scroll to the left edge">
            ◀ more available (scroll left)
          </button>
        ) : (
          <span className="flex items-center gap-1 text-rose-300">
            <Ban className="h-3 w-3" /> start of provider history reached
          </span>
        )}
      </div>
    </>
  );
};
