import React from 'react';
import {
  Crosshair,
  TrendingUp,
  Minus,
  ArrowRight,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Square,
  Ruler,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { DrawingTool } from './types';

interface DrawingToolbarProps {
  activeTool: DrawingTool;
  onSelectTool: (tool: DrawingTool) => void;
  onClearDrawings: () => void;
  showDrawings: boolean;
  onToggleShowDrawings: () => void;
  drawingsCount: number;
}

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  activeTool,
  onSelectTool,
  onClearDrawings,
  showDrawings,
  onToggleShowDrawings,
  drawingsCount,
}) => {
  const tools: { id: DrawingTool; label: string; icon: React.ReactNode; shortcut?: string }[] = [
    {
      id: 'cursor',
      label: 'Crosshair Mode',
      icon: <Crosshair className="w-4 h-4" />,
      shortcut: 'C',
    },
    {
      id: 'trendline',
      label: 'Trend Line (2 Points)',
      icon: <TrendingUp className="w-4 h-4" />,
      shortcut: 'T',
    },
    {
      id: 'horizontal_line',
      label: 'Horizontal Support / Resistance Line',
      icon: <Minus className="w-4 h-4" />,
      shortcut: 'H',
    },
    {
      id: 'horizontal_ray',
      label: 'Horizontal Breakout Ray',
      icon: <ArrowRight className="w-4 h-4" />,
      shortcut: 'R',
    },
    {
      id: 'fibonacci',
      label: 'Fibonacci Retracement (Golden Pocket)',
      icon: <Layers className="w-4 h-4 text-amber-400" />,
      shortcut: 'F',
    },
    {
      id: 'long_position',
      label: 'Long Position (Risk / Reward Calc)',
      icon: <ArrowUpRight className="w-4 h-4 text-emerald-400" />,
      shortcut: 'L',
    },
    {
      id: 'short_position',
      label: 'Short Position (Risk / Reward Calc)',
      icon: <ArrowDownRight className="w-4 h-4 text-red-400" />,
      shortcut: 'S',
    },
    {
      id: 'rectangle',
      label: 'Order Block / Zone (Demand & Supply)',
      icon: <Square className="w-4 h-4 text-purple-400" />,
      shortcut: 'Z',
    },
    {
      id: 'ruler',
      label: 'Measure Tool (Pips, % Change, Bars)',
      icon: <Ruler className="w-4 h-4 text-cyan-400" />,
      shortcut: 'M',
    },
  ];

  return (
    <aside className="w-11 bg-slate-900/90 border-r border-slate-800 flex flex-col items-center py-2 select-none flex-shrink-0 z-10">
      <div className="flex-1 flex flex-col items-center gap-1 w-full px-1">
        {tools.map((tool) => {
          const isActive = activeTool === tool.id;
          return (
            <div key={tool.id} className="relative group w-full flex justify-center">
              <button
                onClick={() => onSelectTool(tool.id)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
                title={tool.label}
              >
                {tool.icon}
              </button>

              {/* Tooltip on hover */}
              <div className="absolute left-10 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-2 bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded shadow-xl whitespace-nowrap z-50 pointer-events-none font-sans">
                <span>{tool.label}</span>
                {tool.shortcut && (
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-1 py-0.5 rounded font-mono">
                    {tool.shortcut}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom controls: Hide/Show drawings and Clear all */}
      <div className="pt-2 border-t border-slate-800 flex flex-col items-center gap-1 w-full px-1">
        <div className="relative group w-full flex justify-center">
          <button
            onClick={onToggleShowDrawings}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              showDrawings
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                : 'text-amber-400 bg-amber-400/10'
            }`}
            title={showDrawings ? 'Hide Drawings' : 'Show Drawings'}
          >
            {showDrawings ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <div className="absolute left-10 top-1/2 -translate-y-1/2 hidden group-hover:block bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2 py-1 rounded shadow-xl whitespace-nowrap z-50 pointer-events-none font-sans">
            {showDrawings ? 'Hide Drawings' : 'Show Drawings'}
          </div>
        </div>

        <div className="relative group w-full flex justify-center">
          <button
            onClick={onClearDrawings}
            disabled={drawingsCount === 0}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
            title={`Clear All Drawings (${drawingsCount})`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="absolute left-10 top-1/2 -translate-y-1/2 hidden group-hover:block bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2 py-1 rounded shadow-xl whitespace-nowrap z-50 pointer-events-none font-sans">
            Clear All Drawings ({drawingsCount})
          </div>
        </div>
      </div>
    </aside>
  );
};
