import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Zap,
  X,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Check,
  Sliders,
  DollarSign,
} from 'lucide-react';
import { AccountSummary } from '../../types/trading';
import { formatPrice, getSymbolDigits } from '../../utils/indicators';

interface QuickOrderWidgetProps {
  symbol: string;
  currentPrice: number;
  activeProvider?: string;
  account?: AccountSummary | null;
  onPlaceOrder?: (
    side: 'Buy' | 'Sell',
    lots: number,
    price: number,
    stopLoss?: number,
    takeProfit?: number
  ) => Promise<void>;
  onClose?: () => void;
}

export const QuickOrderWidget: React.FC<QuickOrderWidgetProps> = ({
  symbol,
  currentPrice,
  activeProvider = 'KeylessPublic',
  account,
  onPlaceOrder,
  onClose,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [lots, setLots] = useState(0.1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Stop Loss & Take Profit quick settings
  const [enableSl, setEnableSl] = useState(false);
  const [slPips, setSlPips] = useState(25);
  const [enableTp, setEnableTp] = useState(false);
  const [tpPips, setTpPips] = useState(50);
  const [showProtectionSettings, setShowProtectionSettings] = useState(false);

  const digits = getSymbolDigits(symbol);
  const isJpy = symbol.toUpperCase().includes('JPY');
  const isCryptoOrIndex = digits <= 2;

  // Realistic spread calculation based on asset class
  const pipValue = isCryptoOrIndex ? 1.0 : isJpy ? 0.01 : 0.0001;
  const spreadPips = isCryptoOrIndex ? 0.5 : 1.2;
  const spreadDelta = spreadPips * pipValue;

  const bidPrice = Number((currentPrice - spreadDelta / 2).toFixed(digits));
  const askPrice = Number((currentPrice + spreadDelta / 2).toFixed(digits));

  const isDemo = activeProvider === 'KeylessPublic' || activeProvider === 'Synthetic';
  const balance = account?.balance ?? 100_000;
  const equity = account?.equity ?? 100_000;

  const handleOrder = async (side: 'Buy' | 'Sell') => {
    if (isSubmitting || !onPlaceOrder) return;
    setIsSubmitting(true);
    setFeedback(null);

    const execPrice = side === 'Buy' ? askPrice : bidPrice;

    // Calculate SL and TP prices if enabled
    let calculatedSl: number | undefined;
    let calculatedTp: number | undefined;

    if (enableSl && slPips > 0) {
      calculatedSl = side === 'Buy'
        ? Number((execPrice - slPips * pipValue).toFixed(digits))
        : Number((execPrice + slPips * pipValue).toFixed(digits));
    }

    if (enableTp && tpPips > 0) {
      calculatedTp = side === 'Buy'
        ? Number((execPrice + tpPips * pipValue).toFixed(digits))
        : Number((execPrice - tpPips * pipValue).toFixed(digits));
    }

    try {
      await onPlaceOrder(side, lots, execPrice, calculatedSl, calculatedTp);
      const modeLabel = isDemo ? 'DEMO ' : '';
      setFeedback({
        text: `✓ Filled ${modeLabel}${side} ${lots} ${symbol} @ ${formatPrice(execPrice, symbol)}`,
        type: 'success',
      });
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: any) {
      setFeedback({
        text: `✕ ${err.message || 'Execution rejected'}`,
        type: 'error',
      });
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLotChange = (delta: number) => {
    setLots((prev) => {
      const next = Math.max(0.01, Math.min(50, Number((prev + delta).toFixed(2))));
      return next;
    });
  };

  return (
    <div className="absolute top-12 left-3 z-30 font-mono select-none pointer-events-auto transition-all duration-200">
      <div className="bg-slate-950/92 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col min-w-[245px] max-w-[275px] ring-1 ring-white/5">
        {/* Top Header: Account Identity & Money */}
        <div className="px-2.5 py-1.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            {isDemo ? (
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse flex-shrink-0" />
            ) : activeProvider === 'Oanda' ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1 font-sans font-bold text-[11px] leading-tight">
                <span className={isDemo ? 'text-cyan-300' : activeProvider === 'Oanda' ? 'text-emerald-300' : 'text-blue-300'}>
                  {isDemo ? 'DEMO ACCOUNT' : activeProvider === 'Oanda' ? 'OANDA PRACTICE' : 'MT5 BRIDGE'}
                </span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                  {isDemo ? 'Paper' : 'Live'}
                </span>
              </div>
              <div className="text-[10px] text-slate-300 font-mono font-semibold truncate">
                ${equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              title={isMinimized ? 'Expand Order Dock' : 'Minimize Order Dock'}
            >
              {isMinimized ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close Order Dock"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Minimized 1-Line Compact Mode */}
        {isMinimized ? (
          <div className="p-1.5 flex items-center justify-between gap-1 text-[11px]">
            <button
              onClick={() => handleOrder('Sell')}
              disabled={isSubmitting}
              className="flex-1 py-1 px-1.5 rounded bg-rose-600/25 hover:bg-rose-600/40 border border-rose-500/40 text-rose-300 font-bold text-center transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              SELL {formatPrice(bidPrice, symbol)}
            </button>
            <span className="px-1.5 py-1 bg-slate-900 border border-slate-800 rounded font-bold text-slate-200 text-[10px]">
              {lots}L
            </span>
            <button
              onClick={() => handleOrder('Buy')}
              disabled={isSubmitting}
              className="flex-1 py-1 px-1.5 rounded bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 font-bold text-center transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              BUY {formatPrice(askPrice, symbol)}
            </button>
          </div>
        ) : (
          /* Full Expanded Trading Dock */
          <div className="p-2.5 space-y-2">
            {/* Symbol & Spread Strip */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800/80 pb-1.5 font-sans">
              <span className="font-bold text-slate-200">{symbol}</span>
              <span className="font-mono text-slate-400">
                Spread: <strong className="text-slate-200">{spreadPips.toFixed(1)}</strong> pips
              </span>
            </div>

            {/* Tactile SELL & BUY Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {/* SELL (BID) */}
              <button
                onClick={() => handleOrder('Sell')}
                disabled={isSubmitting}
                className="group relative bg-gradient-to-b from-rose-600/20 to-rose-700/30 hover:from-rose-600/35 hover:to-rose-700/45 border border-rose-500/50 rounded-lg p-2 text-left transition-all active:scale-[0.97] disabled:opacity-50 shadow-md shadow-rose-950/40 cursor-pointer"
              >
                <div className="flex items-center justify-between text-[10px] font-bold text-rose-300 uppercase tracking-wider font-sans mb-0.5">
                  <span className="flex items-center gap-0.5">
                    <ArrowDownRight className="w-3 h-3 text-rose-400" /> SELL
                  </span>
                  <span className="text-[9px] text-rose-400/80 font-mono">BID</span>
                </div>
                <div className="text-xs sm:text-[13px] font-bold text-white group-hover:text-rose-200 font-mono tracking-tight">
                  {formatPrice(bidPrice, symbol)}
                </div>
              </button>

              {/* BUY (ASK) */}
              <button
                onClick={() => handleOrder('Buy')}
                disabled={isSubmitting}
                className="group relative bg-gradient-to-b from-emerald-600/20 to-emerald-700/30 hover:from-emerald-600/35 hover:to-emerald-700/45 border border-emerald-500/50 rounded-lg p-2 text-right transition-all active:scale-[0.97] disabled:opacity-50 shadow-md shadow-emerald-950/40 cursor-pointer"
              >
                <div className="flex items-center justify-between text-[10px] font-bold text-emerald-300 uppercase tracking-wider font-sans mb-0.5">
                  <span className="text-[9px] text-emerald-400/80 font-mono">ASK</span>
                  <span className="flex items-center gap-0.5">
                    BUY <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                  </span>
                </div>
                <div className="text-xs sm:text-[13px] font-bold text-white group-hover:text-emerald-200 font-mono tracking-tight">
                  {formatPrice(askPrice, symbol)}
                </div>
              </button>
            </div>

            {/* Lots Stepper & Presets */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] text-slate-400 font-sans font-semibold uppercase">Volume (Lots):</span>
                <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleLotChange(-0.01)}
                    className="px-2 py-0.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="100"
                    value={lots}
                    onChange={(e) => setLots(Math.max(0.01, parseFloat(e.target.value) || 0.1))}
                    className="w-14 text-center py-0.5 bg-transparent text-slate-100 font-mono text-xs font-bold focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleLotChange(0.01)}
                    className="px-2 py-0.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-5 gap-1">
                {[0.01, 0.05, 0.1, 0.5, 1.0].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setLots(val)}
                    className={`py-0.5 rounded text-[10px] font-mono text-center transition-all cursor-pointer ${
                      lots === val
                        ? 'bg-blue-600 text-white font-bold shadow-sm'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Protection Controls (SL / TP Toggle) */}
            <div className="pt-1 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowProtectionSettings(!showProtectionSettings)}
                className="w-full flex items-center justify-between text-[10px] text-slate-400 hover:text-slate-200 font-sans py-0.5 cursor-pointer"
              >
                <span className="flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3 h-3 text-blue-400" />
                  <span>Bracket Protection (SL / TP)</span>
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  {showProtectionSettings ? '▲ Hide' : '▼ Setup'}
                </span>
              </button>

              {showProtectionSettings && (
                <div className="space-y-1.5 pt-1.5 text-[10px] font-sans">
                  <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-1 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableSl}
                        onChange={(e) => setEnableSl(e.target.checked)}
                        className="rounded bg-slate-900 border-slate-700 text-rose-500 focus:ring-0 w-3 h-3 cursor-pointer"
                      />
                      <span>Stop Loss:</span>
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="5"
                        max="1000"
                        value={slPips}
                        onChange={(e) => setSlPips(parseInt(e.target.value) || 20)}
                        disabled={!enableSl}
                        className="w-12 px-1 py-0.5 text-center bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono disabled:opacity-40"
                      />
                      <span className="text-slate-400 font-mono">pips</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-1 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableTp}
                        onChange={(e) => setEnableTp(e.target.checked)}
                        className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 w-3 h-3 cursor-pointer"
                      />
                      <span>Take Profit:</span>
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="5"
                        max="2000"
                        value={tpPips}
                        onChange={(e) => setTpPips(parseInt(e.target.value) || 40)}
                        disabled={!enableTp}
                        className="w-12 px-1 py-0.5 text-center bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono disabled:opacity-40"
                      />
                      <span className="text-slate-400 font-mono">pips</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Execution Feedback Banner */}
            {feedback && (
              <div
                className={`text-[10px] p-2 rounded-lg font-mono text-center border animate-in fade-in duration-150 leading-tight ${
                  feedback.type === 'success'
                    ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
                    : 'bg-red-950/90 border-red-500/50 text-red-300'
                }`}
              >
                {feedback.text}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
