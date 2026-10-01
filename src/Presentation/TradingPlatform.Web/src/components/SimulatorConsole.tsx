import React, { useState } from 'react';
import { Timeframe } from '../types/trading';

interface SimulatorConsoleProps {
  onSimulateCandle: (candle: any) => Promise<any>;
}

export const SimulatorConsole: React.FC<SimulatorConsoleProps> = ({ onSimulateCandle }) => {
  const [symbol, setSymbol] = useState('EURUSD');
  const [timeframe, setTimeframe] = useState<Timeframe>('M5');
  const [open, setOpen] = useState('1.0850');
  const [high, setHigh] = useState('1.0880');
  const [low, setLow] = useState('1.0845');
  const [close, setClose] = useState('1.0875');
  const [volume, setVolume] = useState('1500');
  const [isComplete, setIsComplete] = useState(true);

  const [lastResult, setLastResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleInject = async () => {
    setLoading(true);
    try {
      const res = await onSimulateCandle({
        symbol,
        timeframe,
        open: Number(open),
        high: Number(high),
        low: Number(low),
        close: Number(close),
        volume: Number(volume),
        isComplete,
      });
      setLastResult(res);
    } catch (err: any) {
      setLastResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (type: 'bull' | 'bear' | 'incomplete') => {
    if (type === 'bull') {
      setOpen('1.0850');
      setHigh('1.0895');
      setLow('1.0845');
      setClose('1.0890');
      setIsComplete(true);
    } else if (type === 'bear') {
      setOpen('1.0890');
      setHigh('1.0895');
      setLow('1.0830');
      setClose('1.0835');
      setIsComplete(true);
    } else {
      setIsComplete(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 font-mono text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <span className="font-bold text-sm text-slate-100 font-sans">Market Ingestion Sandbox</span>
        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
          POST /api/simulation/candle
        </span>
      </div>

      {/* Preset Quick Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setPreset('bull')}
          className="flex-1 py-1.5 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-bold text-[11px] transition-colors"
        >
          Preset: Bullish Breakout
        </button>
        <button
          onClick={() => setPreset('bear')}
          className="flex-1 py-1.5 rounded bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-bold text-[11px] transition-colors"
        >
          Preset: Bear Breakdown
        </button>
        <button
          onClick={() => setPreset('incomplete')}
          className="flex-1 py-1.5 rounded bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 font-bold text-[11px] transition-colors"
        >
          Preset: Incomplete (Tick Guard)
        </button>
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
        <div>
          <label className="text-[10px] text-slate-500">Symbol</label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-500">Timeframe</label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as Timeframe)}
            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
          >
            {(['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN1'] as Timeframe[]).map((tf) => (
              <option key={tf} value={tf}>{tf}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-slate-500">Open</label>
          <input
            type="text"
            value={open}
            onChange={(e) => setOpen(e.target.value)}
            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-500">High</label>
          <input
            type="text"
            value={high}
            onChange={(e) => setHigh(e.target.value)}
            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-500">Low</label>
          <input
            type="text"
            value={low}
            onChange={(e) => setLow(e.target.value)}
            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-500">Close</label>
          <input
            type="text"
            value={close}
            onChange={(e) => setClose(e.target.value)}
            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
          />
        </div>
        <div className="flex items-center gap-2 pt-4">
          <input
            type="checkbox"
            id="isComplete"
            checked={isComplete}
            onChange={(e) => setIsComplete(e.target.checked)}
            className="rounded bg-slate-800 border-slate-700 text-blue-500"
          />
          <label htmlFor="isComplete" className="text-[10px] text-slate-300 cursor-pointer">
            IsComplete
          </label>
        </div>
      </div>

      <button
        onClick={handleInject}
        disabled={loading}
        className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50"
      >
        {loading ? 'Injecting & Processing CQRS Pipeline...' : '⚡ Inject Candle & Trigger CQRS Pipeline'}
      </button>

      {/* Output Response */}
      {lastResult && (
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-400 font-bold mb-1">Downstream Pipeline Execution Trace:</div>
          <pre className="text-[10px] text-emerald-400 overflow-x-auto max-h-40">
            {JSON.stringify(lastResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
