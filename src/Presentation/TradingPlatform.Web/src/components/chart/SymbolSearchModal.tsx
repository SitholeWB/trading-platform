import React, { useState } from 'react';
import { Search, X, TrendingUp, TrendingDown, Check } from 'lucide-react';

interface SymbolItem {
  symbol: string;
  name: string;
  category: 'forex' | 'crypto' | 'indices' | 'commodities';
  price: string;
  change: string;
  isPositive: boolean;
  spreadPips: string;
}

const AVAILABLE_SYMBOLS: SymbolItem[] = [
  // Forex
  { symbol: 'EURUSD', name: 'Euro / US Dollar', category: 'forex', price: '1.08520', change: '+0.18%', isPositive: true, spreadPips: '0.6' },
  { symbol: 'GBPUSD', name: 'British Pound / US Dollar', category: 'forex', price: '1.26420', change: '-0.12%', isPositive: false, spreadPips: '0.8' },
  { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', category: 'forex', price: '154.210', change: '+0.45%', isPositive: true, spreadPips: '0.7' },
  { symbol: 'AUDUSD', name: 'Australian Dollar / US Dollar', category: 'forex', price: '0.65340', change: '+0.04%', isPositive: true, spreadPips: '0.9' },
  { symbol: 'USDCAD', name: 'US Dollar / Canadian Dollar', category: 'forex', price: '1.38120', change: '-0.22%', isPositive: false, spreadPips: '1.1' },
  { symbol: 'USDCHF', name: 'US Dollar / Swiss Franc', category: 'forex', price: '0.90230', change: '+0.10%', isPositive: true, spreadPips: '1.0' },
  { symbol: 'NZDUSD', name: 'New Zealand Dollar / US Dollar', category: 'forex', price: '0.59840', change: '-0.08%', isPositive: false, spreadPips: '1.2' },
  { symbol: 'EURGBP', name: 'Euro / British Pound', category: 'forex', price: '0.85840', change: '+0.25%', isPositive: true, spreadPips: '0.9' },
  { symbol: 'EURJPY', name: 'Euro / Japanese Yen', category: 'forex', price: '167.350', change: '+0.62%', isPositive: true, spreadPips: '1.2' },
  // Crypto
  { symbol: 'BTCUSDT', name: 'Bitcoin / Tether USD', category: 'crypto', price: '68,450.00', change: '+1.85%', isPositive: true, spreadPips: '1.5' },
  { symbol: 'ETHUSDT', name: 'Ethereum / Tether USD', category: 'crypto', price: '3,520.50', change: '+0.95%', isPositive: true, spreadPips: '0.5' },
  { symbol: 'SOLUSDT', name: 'Solana / Tether USD', category: 'crypto', price: '178.40', change: '+4.20%', isPositive: true, spreadPips: '0.2' },
  { symbol: 'BNBUSDT', name: 'Binance Coin / Tether USD', category: 'crypto', price: '585.10', change: '-0.30%', isPositive: false, spreadPips: '0.4' },
  { symbol: 'XRPUSDT', name: 'Ripple / Tether USD', category: 'crypto', price: '0.5840', change: '+0.80%', isPositive: true, spreadPips: '0.01' },
  // Commodities
  { symbol: 'XAUUSD', name: 'Gold / US Dollar', category: 'commodities', price: '2,654.80', change: '+0.74%', isPositive: true, spreadPips: '2.5' },
  { symbol: 'XAGUSD', name: 'Silver / US Dollar', category: 'commodities', price: '31.85', change: '+1.15%', isPositive: true, spreadPips: '1.8' },
  { symbol: 'USOIL', name: 'WTI Crude Oil', category: 'commodities', price: '72.40', change: '-1.40%', isPositive: false, spreadPips: '3.0' },
  // Indices
  { symbol: 'US500', name: 'S&P 500 Index', category: 'indices', price: '5,780.20', change: '+0.52%', isPositive: true, spreadPips: '0.8' },
  { symbol: 'NAS100', name: 'Nasdaq 100 Index', category: 'indices', price: '20,140.50', change: '+0.88%', isPositive: true, spreadPips: '1.2' },
];

interface SymbolSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

export const SymbolSearchModal: React.FC<SymbolSearchModalProps> = ({
  isOpen,
  onClose,
  selectedSymbol,
  onSelectSymbol,
}) => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'forex' | 'crypto' | 'commodities' | 'indices'>('all');

  if (!isOpen) return null;

  const filtered = AVAILABLE_SYMBOLS.filter((item) => {
    const matchesTab = activeTab === 'all' || item.category === activeTab;
    const matchesSearch =
      item.symbol.toLowerCase().includes(search.toLowerCase()) ||
      item.name.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header with Search Input */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/70">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search symbol, pair or market (e.g. EURUSD, BTC, Gold)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-900/50 flex gap-1.5 overflow-x-auto text-xs font-sans">
          {[
            { id: 'all', label: 'All Markets' },
            { id: 'forex', label: 'Forex' },
            { id: 'crypto', label: 'Crypto' },
            { id: 'commodities', label: 'Commodities' },
            { id: 'indices', label: 'Indices' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50 font-sans">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              No instruments found matching "{search}"
            </div>
          ) : (
            filtered.map((item) => {
              const isSelected = selectedSymbol === item.symbol;
              return (
                <div
                  key={item.symbol}
                  onClick={() => {
                    onSelectSymbol(item.symbol);
                    onClose();
                  }}
                  className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-600/15 hover:bg-blue-600/20'
                      : 'hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase ${
                        item.category === 'forex'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : item.category === 'crypto'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : item.category === 'commodities'
                          ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {item.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-100 font-mono">
                          {item.symbol}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">{item.name}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right font-mono">
                      <div className="text-sm font-semibold text-slate-200">
                        {item.price}
                      </div>
                      <div
                        className={`text-xs font-medium flex items-center justify-end gap-1 ${
                          item.isPositive ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {item.isPositive ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span>{item.change}</span>
                      </div>
                    </div>

                    <div className="w-6 flex items-center justify-center">
                      {isSelected && <Check className="w-5 h-5 text-blue-400" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between font-mono">
          <span>{filtered.length} instruments available</span>
          <span>Multi-broker NetMQ / Oanda / Keyless</span>
        </div>
      </div>
    </div>
  );
};
