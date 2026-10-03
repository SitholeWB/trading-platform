import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { formatPrice, getSymbolDigits } from '../../utils/indicators';

interface QuickOrderWidgetProps {
  symbol: string;
  currentPrice: number;
  onPlaceOrder?: (side: 'Buy' | 'Sell', lots: number, price: number) => Promise<void>;
}

export const QuickOrderWidget: React.FC<QuickOrderWidgetProps> = ({
  symbol,
  currentPrice,
  onPlaceOrder,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [lots, setLots] = useState(0.1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const digits = getSymbolDigits(symbol);
  const spreadDelta = digits === 5 ? 0.00008 : digits === 3 ? 0.008 : 0.08;
  const bidPrice = Number((currentPrice - spreadDelta / 2).toFixed(digits));
  const askPrice = Number((currentPrice + spreadDelta / 2).toFixed(digits));

  const handleOrder = async (side: 'Buy' | 'Sell') => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const execPrice = side === 'Buy' ? askPrice : bidPrice;
    try {
      if (onPlaceOrder) {
        await onPlaceOrder(side, lots, execPrice);
      }
      setFeedback(`Filled ${side} ${lots} ${symbol} @ ${execPrice}`);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback(`Error: ${err.message || 'Execution failed'}`);
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="absolute top-12 left-14 z-20 font-mono select-none">
      {/* Floating Header Tab */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg shadow-xl overflow-hidden flex flex-col min-w-[220px]">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="px-2.5 py-1 bg-slate-950/80 flex items-center justify-between text-[11px] cursor-pointer hover:bg-slate-800/60 transition-colors"
        >
          <div className="flex items-center gap-1.5 text-slate-300 font-sans font-bold">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>One-Click Trading</span>
          </div>
          <button className="text-slate-400 hover:text-slate-200">
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {isOpen && (
          <div className="p-2 space-y-2">
            {/* Sell and Buy buttons grid */}
            <div className="grid grid-cols-2 gap-1.5">
              {/* SELL BUTTON */}
              <button
                onClick={() => handleOrder('Sell')}
                disabled={isSubmitting}
                className="group relative bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 rounded-lg p-2 text-left transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                  SELL
                </div>
                <div className="text-xs font-bold text-slate-100 group-hover:text-red-300">
                  {formatPrice(bidPrice, symbol)}
                </div>
              </button>

              {/* BUY BUTTON */}
              <button
                onClick={() => handleOrder('Buy')}
                disabled={isSubmitting}
                className="group relative bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 rounded-lg p-2 text-left transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  BUY
                </div>
                <div className="text-xs font-bold text-slate-100 group-hover:text-emerald-300">
                  {formatPrice(askPrice, symbol)}
                </div>
              </button>
            </div>

            {/* Lot size selector */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800 text-[11px]">
              <span className="text-slate-400">Lots:</span>
              <div className="flex items-center gap-1 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                {[0.01, 0.1, 0.5, 1.0].map((val) => (
                  <button
                    key={val}
                    onClick={() => setLots(val)}
                    className={`px-1.5 py-0.2 rounded text-[10px] transition-colors ${
                      lots === val
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Execution feedback toast */}
            {feedback && (
              <div className="text-[10px] p-1.5 rounded bg-blue-950/80 border border-blue-500/30 text-blue-300 text-center animate-in fade-in">
                {feedback}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
