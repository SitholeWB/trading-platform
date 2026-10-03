import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Flame,
  FolderPlus,
  Layers,
  Play,
  Plus,
  RefreshCw,
  Search,
  Sliders,
  Sparkles,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { tradingApi } from '../api/tradingClient';
import {
  HistoricalScanReport,
  LiveScanReport,
  OrderType,
  ScannerMatchResult,
  StrategyDefinition,
  SymbolGroup,
  Timeframe,
} from '../types/trading';

interface MarketScannerViewProps {
  onOpenChart: (symbol: string, timeframe?: Timeframe) => void;
  onPlaceQuickOrder?: (symbol: string, side: OrderType, price: number, sl?: number, tp?: number) => void;
  activeProvider?: string;
}

const SCANNER_STORAGE_LIVE = 'tp_scanner_live_report';
const SCANNER_STORAGE_HIST = 'tp_scanner_hist_report';
const SCANNER_STORAGE_GROUP = 'tp_scanner_group_id';
const SCANNER_STORAGE_STRAT = 'tp_scanner_strategy_id';
const SCANNER_STORAGE_TF = 'tp_scanner_timeframe';
const SCANNER_STORAGE_TAB = 'tp_scanner_tab';
const SCANNER_STORAGE_VIEWED = 'tp_scanner_last_viewed';
const SCANNER_STORAGE_BARS = 'tp_scanner_bar_count';

export const MarketScannerView: React.FC<MarketScannerViewProps> = ({
  onOpenChart,
  onPlaceQuickOrder,
  activeProvider = 'KeylessPublic',
}) => {
  const [activeTab, setActiveTabState] = useState<'live' | 'historical' | 'buckets'>(() => {
    return (localStorage.getItem(SCANNER_STORAGE_TAB) as any) || 'live';
  });
  const setActiveTab = (tab: 'live' | 'historical' | 'buckets') => {
    setActiveTabState(tab);
    localStorage.setItem(SCANNER_STORAGE_TAB, tab);
  };

  // Common data
  const [symbolGroups, setSymbolGroups] = useState<SymbolGroup[]>([]);
  const [strategies, setStrategies] = useState<StrategyDefinition[]>([]);
  
  const [selectedGroupId, setSelectedGroupIdState] = useState<string>(() => {
    return localStorage.getItem(SCANNER_STORAGE_GROUP) || 'group-fx-majors';
  });
  const setSelectedGroupId = (id: string) => {
    setSelectedGroupIdState(id);
    localStorage.setItem(SCANNER_STORAGE_GROUP, id);
  };

  const [selectedStrategyId, setSelectedStrategyIdState] = useState<string>(() => {
    return localStorage.getItem(SCANNER_STORAGE_STRAT) || '';
  });
  const setSelectedStrategyId = (id: string) => {
    setSelectedStrategyIdState(id);
    localStorage.setItem(SCANNER_STORAGE_STRAT, id);
  };

  const [timeframe, setTimeframeState] = useState<Timeframe>(() => {
    return (localStorage.getItem(SCANNER_STORAGE_TF) as Timeframe) || 'M5';
  });
  const setTimeframe = (tf: Timeframe) => {
    setTimeframeState(tf);
    localStorage.setItem(SCANNER_STORAGE_TF, tf);
  };

  const [lastViewedSymbol, setLastViewedSymbol] = useState<string | null>(() => {
    return localStorage.getItem(SCANNER_STORAGE_VIEWED) || null;
  });

  // Live scan states
  const [isLiveScanning, setIsLiveScanning] = useState(false);
  const [liveReport, setLiveReportState] = useState<LiveScanReport | null>(() => {
    try {
      const saved = localStorage.getItem(SCANNER_STORAGE_LIVE);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const setLiveReport = (report: LiveScanReport | null) => {
    setLiveReportState(report);
    if (report) {
      try {
        localStorage.setItem(SCANNER_STORAGE_LIVE, JSON.stringify(report));
      } catch (e) {
        console.warn('Could not cache live report in localStorage', e);
      }
    } else {
      localStorage.removeItem(SCANNER_STORAGE_LIVE);
    }
  };

  const [autoScanInterval, setAutoScanInterval] = useState<number>(0); // 0 = off, 15, 30, 60
  const [expandedMatchIndex, setExpandedMatchIndex] = useState<number | null>(null);

  // Historical scan states
  const [barCount, setBarCountState] = useState<number>(() => {
    const saved = localStorage.getItem(SCANNER_STORAGE_BARS);
    return saved ? Number(saved) : 200;
  });
  const setBarCount = (count: number) => {
    setBarCountState(count);
    localStorage.setItem(SCANNER_STORAGE_BARS, String(count));
  };

  const [isHistScanning, setIsHistScanning] = useState(false);
  const [histReport, setHistReportState] = useState<HistoricalScanReport | null>(() => {
    try {
      const saved = localStorage.getItem(SCANNER_STORAGE_HIST);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const setHistReport = (report: HistoricalScanReport | null) => {
    setHistReportState(report);
    if (report) {
      try {
        localStorage.setItem(SCANNER_STORAGE_HIST, JSON.stringify(report));
      } catch (e) {
        console.warn('Could not cache hist report in localStorage', e);
      }
    } else {
      localStorage.removeItem(SCANNER_STORAGE_HIST);
    }
  };

  const [histFilter, setHistFilter] = useState<'all' | 'trades' | 'matches'>('trades');

  // Bucket management states
  const [isCreateBucketOpen, setIsCreateBucketOpen] = useState(false);
  const [newBucketName, setNewBucketName] = useState('');
  const [newBucketDesc, setNewBucketDesc] = useState('');
  const [newBucketCat, setNewBucketCat] = useState('forex');
  const [newBucketSymbols, setNewBucketSymbols] = useState('');
  const [newSymbolInput, setNewSymbolInput] = useState<{ [groupId: string]: string }>({});

  const handleInspectChart = (symbol: string, tf?: Timeframe) => {
    setLastViewedSymbol(symbol);
    localStorage.setItem(SCANNER_STORAGE_VIEWED, symbol);
    onOpenChart(symbol, tf);
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [groups, strats] = await Promise.all([
        tradingApi.getSymbolGroups(),
        tradingApi.getStrategies(),
      ]);
      setSymbolGroups(groups);
      setStrategies(strats);
      if (groups.length > 0 && !selectedGroupId) {
        setSelectedGroupId(groups[0].id);
      }
      if (strats.length > 0 && !selectedStrategyId) {
        setSelectedStrategyId(strats[0].id);
      }

      // Restore latest scans from backend if not already cached in localStorage
      if (!liveReport) {
        tradingApi.getLatestLiveScan().then((latest) => {
          if (latest) setLiveReport(latest);
        });
      }
      if (!histReport) {
        tradingApi.getLatestHistoricalScan().then((latest) => {
          if (latest) setHistReport(latest);
        });
      }
    } catch (err) {
      console.error('[MARKET SCANNER] Error loading initial data:', err);
    }
  };

  // Run Live Scan
  const handleRunLiveScan = async () => {
    if (isLiveScanning) return;
    setIsLiveScanning(true);
    try {
      const report = await tradingApi.runLiveScan({
        symbolGroupId: selectedGroupId || undefined,
        strategyId: selectedStrategyId || undefined,
        timeframe: timeframe,
      });
      setLiveReport(report);
    } catch (err) {
      console.error('[MARKET SCANNER] Live scan failed:', err);
    } finally {
      setIsLiveScanning(false);
    }
  };

  // Auto-scan timer
  useEffect(() => {
    if (autoScanInterval <= 0) return;
    const interval = setInterval(() => {
      handleRunLiveScan();
    }, autoScanInterval * 1000);
    return () => clearInterval(interval);
  }, [autoScanInterval, selectedGroupId, selectedStrategyId, timeframe, isLiveScanning]);

  // Run Historical Scan
  const handleRunHistoricalScan = async () => {
    if (isHistScanning) return;
    if (!selectedStrategyId) {
      alert('Please select a strategy to run historical scan.');
      return;
    }
    setIsHistScanning(true);
    try {
      const report = await tradingApi.runHistoricalScan({
        strategyId: selectedStrategyId,
        symbolGroupId: selectedGroupId || undefined,
        timeframe: timeframe,
        barCount: barCount,
      });
      setHistReport(report);
    } catch (err) {
      console.error('[MARKET SCANNER] Historical scan failed:', err);
    } finally {
      setIsHistScanning(false);
    }
  };

  // Bucket actions
  const handleCreateBucket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBucketName.trim()) return;
    const syms = newBucketSymbols
      .split(/[\s,]+/)
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s.length > 0);

    try {
      const created = await tradingApi.createSymbolGroup({
        name: newBucketName.trim(),
        description: newBucketDesc.trim(),
        category: newBucketCat,
        symbols: syms,
      });
      setSymbolGroups((prev) => [...prev, created]);
      setSelectedGroupId(created.id);
      setIsCreateBucketOpen(false);
      setNewBucketName('');
      setNewBucketDesc('');
      setNewBucketSymbols('');
    } catch (err) {
      console.error('[MARKET SCANNER] Failed to create bucket:', err);
    }
  };

  const handleDeleteBucket = async (id: string) => {
    if (!confirm('Are you sure you want to delete this symbol bucket?')) return;
    try {
      await tradingApi.deleteSymbolGroup(id);
      setSymbolGroups((prev) => prev.filter((g) => g.id !== id));
      if (selectedGroupId === id) {
        setSelectedGroupId(symbolGroups[0]?.id || '');
      }
    } catch (err) {
      console.error('[MARKET SCANNER] Failed to delete bucket:', err);
    }
  };

  const handleAddSymbolToGroup = async (group: SymbolGroup) => {
    const sym = newSymbolInput[group.id]?.trim().toUpperCase();
    if (!sym) return;
    if (group.symbols.includes(sym)) return;

    const updatedSymbols = [...group.symbols, sym];
    try {
      const updated = await tradingApi.updateSymbolGroup(group.id, {
        ...group,
        symbols: updatedSymbols,
      });
      setSymbolGroups((prev) => prev.map((g) => (g.id === group.id ? updated : g)));
      setNewSymbolInput((prev) => ({ ...prev, [group.id]: '' }));
    } catch (err) {
      console.error('[MARKET SCANNER] Failed to add symbol:', err);
    }
  };

  const handleRemoveSymbolFromGroup = async (group: SymbolGroup, symToRemove: string) => {
    const updatedSymbols = group.symbols.filter((s) => s !== symToRemove);
    try {
      const updated = await tradingApi.updateSymbolGroup(group.id, {
        ...group,
        symbols: updatedSymbols,
      });
      setSymbolGroups((prev) => prev.map((g) => (g.id === group.id ? updated : g)));
    } catch (err) {
      console.error('[MARKET SCANNER] Failed to remove symbol:', err);
    }
  };

  const selectedGroup = symbolGroups.find((g) => g.id === selectedGroupId);

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Header & Navigation Sub-Tabs */}
      <div className="h-14 min-h-[56px] px-6 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide flex items-center gap-2">
              <span>Robotic Market Scanner & Backtester</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-mono">
                Closed-Candle Invariant
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">
              Feed: <span className="text-blue-400 font-semibold">{activeProvider}</span> • Continuous multi-symbol rule evaluation
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'live'
                ? 'bg-indigo-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Live Scanner</span>
            {liveReport && liveReport.verifiedMatches.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('historical')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'historical'
                ? 'bg-indigo-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Historical Backtest</span>
          </button>

          <button
            onClick={() => setActiveTab('buckets')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'buckets'
                ? 'bg-indigo-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Symbol Buckets ({symbolGroups.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        {/* ============================================================== */}
        {/* TAB 1: LIVE MARKET SCANNER */}
        {/* ============================================================== */}
        {activeTab === 'live' && (
          <div className="space-y-6">
            {/* Control Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Bucket Picker */}
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1">
                    Target Bucket / Basket
                  </label>
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    {symbolGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.symbols.length} symbols)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Strategy Picker */}
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1">
                    Strategy Rule
                  </label>
                  <select
                    value={selectedStrategyId}
                    onChange={(e) => setSelectedStrategyId(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    <option value="">⚡ All Active Strategies</option>
                    {strategies.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.timeframe})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Timeframe Picker */}
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1">
                    Candle Bar Timeframe
                  </label>
                  <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs font-mono overflow-x-auto scrollbar-none">
                    {(['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN1'] as Timeframe[]).map((tf) => (
                      <button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={`px-2 py-1 rounded transition-all whitespace-nowrap ${
                          timeframe === tf
                            ? 'bg-blue-600 text-white font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Auto Refresh Interval */}
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1">
                    Auto-Scan Interval
                  </label>
                  <select
                    value={autoScanInterval}
                    onChange={(e) => setAutoScanInterval(Number(e.target.value))}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    <option value="0">Manual Only</option>
                    <option value="300">Every 5 Minutes</option>
                    <option value="900">Every 15 Minutes</option>
                    <option value="1800">Every 30 Minutes</option>
                    <option value="3600">Every 1 Hour</option>
                    <option value="7200">Every 2 Hours</option>
                    <option value="14400">Every 4 Hours</option>
                    <option value="28800">Every 8 Hours</option>
                    <option value="43200">Every 12 Hours</option>
                    <option value="86400">Every 24 Hours (1 Day)</option>
                  </select>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunLiveScan}
                  disabled={isLiveScanning}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                  <RefreshCw className={`w-4 h-4 ${isLiveScanning ? 'animate-spin' : ''}`} />
                  <span>{isLiveScanning ? 'Scanning Market...' : 'Run Live Scan Now'}</span>
                </button>
              </div>
            </div>

            {/* Target Bucket Summary Chips */}
            {selectedGroup && (
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="text-slate-400">Scanning Bucket:</span>
                <span className="text-white font-bold">{selectedGroup.name}</span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-400">Symbols ({selectedGroup.symbols.length}):</span>
                {selectedGroup.symbols.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[11px]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}

            {/* KPI Highlights Bar */}
            {liveReport && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Symbols Analyzed
                  </div>
                  <div className="text-2xl font-bold font-mono text-white mt-1">
                    {liveReport.totalSymbolsScanned}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Completed in {liveReport.durationMs}ms
                  </div>
                </div>

                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5">
                  <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Verified Matches (100%)</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                    {liveReport.verifiedMatches.length}
                  </div>
                  <div className="text-[10px] text-emerald-500/80 mt-0.5">
                    All rule conditions fully met
                  </div>
                </div>

                <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3.5">
                  <div className="text-[10px] font-mono text-amber-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Near Misses (60%–99%)</span>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                    {liveReport.nearMisses.length}
                  </div>
                  <div className="text-[10px] text-amber-500/80 mt-0.5">
                    Close to trigger threshold
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Last Scan Time (UTC)
                  </div>
                  <div className="text-sm font-bold font-mono text-slate-200 mt-2 truncate">
                    {new Date(liveReport.scannedAtUtc).toLocaleTimeString()}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Timeframe: {liveReport.timeframe}
                  </div>
                </div>
              </div>
            )}

            {/* Results Grid: 2 Columns (Verified vs Near Misses) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: 100% Verified Matches */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase font-mono tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Verified Signals ({liveReport?.verifiedMatches.length ?? 0})</span>
                  </h2>
                  <span className="text-[11px] text-slate-500 font-mono">100% Rule Compliance</span>
                </div>

                {liveReport?.verifiedMatches.length === 0 && (
                  <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-8 text-center text-slate-400 font-mono text-xs">
                    No 100% verified matches at this closed bar. Check near misses or adjust strategy parameters.
                  </div>
                )}

                {liveReport?.verifiedMatches.map((m, idx) => {
                  const isLastViewed = m.symbol === lastViewedSymbol;
                  return (
                    <div
                      key={`${m.symbol}-${m.strategyId}-${idx}`}
                      className={`bg-slate-900 rounded-xl p-4 space-y-3 relative overflow-hidden shadow-lg transition-all ${
                        isLastViewed
                          ? 'border-2 border-blue-500/80 ring-2 ring-blue-500/20 shadow-blue-950/40'
                          : 'border border-emerald-500/40 shadow-emerald-950/20'
                      }`}
                    >
                      <div className="absolute top-0 right-0 flex items-center">
                        {isLastViewed && (
                          <div className="px-2.5 py-0.5 bg-blue-600 text-white text-[10px] font-mono font-bold rounded-bl-lg flex items-center gap-1 shadow-sm">
                            <Eye className="w-3 h-3" />
                            <span>LAST VIEWED</span>
                          </div>
                        )}
                        <div className={`px-3 py-0.5 bg-emerald-500/20 text-emerald-400 border-b border-l border-emerald-500/40 text-[10px] font-mono font-bold ${isLastViewed ? '' : 'rounded-bl-lg'}`}>
                          100% MATCH
                        </div>
                      </div>

                      <div className="flex items-start justify-between pr-24">
                        <div className="flex items-center gap-3">
                          <span className="text-base font-bold font-mono text-white tracking-wider">
                            {m.symbol}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold font-mono flex items-center gap-1 ${
                              m.recommendedSide === 'Buy'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {m.recommendedSide === 'Buy' ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            <span>{m.recommendedSide === 'Buy' ? 'BUY' : 'SELL'}</span>
                          </span>
                          <span className="text-xs text-slate-400 font-mono">({m.timeframe})</span>
                        </div>
                      </div>

                      {/* Price, SL, TP Grid */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-950/80 rounded-lg p-2.5 font-mono text-xs border border-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-500 block">ENTRY</span>
                          <span className="font-bold text-slate-200">{m.entryPrice}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-red-400 block">STOP LOSS</span>
                          <span className="font-bold text-red-400">{m.stopLoss ?? 'None'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-400 block">TAKE PROFIT</span>
                          <span className="font-bold text-emerald-400">{m.takeProfit ?? 'None'}</span>
                        </div>
                      </div>

                      {/* Strategy and Condition Highlights */}
                      <div className="text-xs font-mono space-y-1">
                        <div className="text-slate-400">
                          Strategy: <span className="text-indigo-400 font-semibold">{m.strategyName}</span>
                        </div>
                        <div className="text-emerald-400/90 text-[11px] flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>All entry rules evaluated to true on closed candle</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                        <button
                          onClick={() => handleInspectChart(m.symbol, m.timeframe as Timeframe)}
                          className={`flex-1 py-1.5 rounded-lg border text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all ${
                            isLastViewed
                              ? 'bg-blue-600 text-white border-blue-500 font-bold shadow-md shadow-blue-900/40'
                              : 'bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/40 text-blue-400'
                          }`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{isLastViewed ? 'Inspect Again' : 'Inspect Chart'}</span>
                        </button>

                      {onPlaceQuickOrder && (
                        <button
                          onClick={() =>
                            onPlaceQuickOrder(
                              m.symbol,
                              m.recommendedSide,
                              m.entryPrice,
                              m.stopLoss ?? undefined,
                              m.takeProfit ?? undefined
                            )
                          }
                          className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-950"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Execute Robot Trade</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              </div>

              {/* Right Column: 60%–99% Near Misses */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase font-mono tracking-wider text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Near Misses ({liveReport?.nearMisses.length ?? 0})</span>
                  </h2>
                  <span className="text-[11px] text-slate-500 font-mono">60%–99% Setup Match</span>
                </div>

                {liveReport?.nearMisses.length === 0 && (
                  <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-8 text-center text-slate-400 font-mono text-xs">
                    No near misses detected on this closed candle.
                  </div>
                )}

                {liveReport?.nearMisses.map((m, idx) => {
                  const isExpanded = expandedMatchIndex === idx;
                  const isLastViewed = m.symbol === lastViewedSymbol;
                  return (
                    <div
                      key={`near-${m.symbol}-${m.strategyId}-${idx}`}
                      className={`bg-slate-900 rounded-xl p-4 space-y-3 relative overflow-hidden transition-all ${
                        isLastViewed
                          ? 'border-2 border-blue-500/80 ring-2 ring-blue-500/20 shadow-blue-950/40'
                          : 'border border-amber-500/30'
                      }`}
                    >
                      {isLastViewed && (
                        <div className="absolute top-0 right-0 px-2.5 py-0.5 bg-blue-600 text-white text-[10px] font-mono font-bold rounded-bl-lg flex items-center gap-1 shadow-sm">
                          <Eye className="w-3 h-3" />
                          <span>LAST VIEWED</span>
                        </div>
                      )}

                      <div className="flex items-start justify-between pr-24">
                        <div className="flex items-center gap-3">
                          <span className="text-base font-bold font-mono text-white tracking-wider">
                            {m.symbol}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold font-mono flex items-center gap-1 ${
                              m.recommendedSide === 'Buy'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}
                          >
                            <span>{m.recommendedSide === 'Buy' ? 'BUY' : 'SELL'}</span>
                          </span>
                          <span className="text-xs text-slate-400 font-mono">({m.timeframe})</span>
                        </div>

                        {/* Match Gauge */}
                        <div className="text-right">
                          <div className="text-sm font-bold font-mono text-amber-400">
                            {m.matchPercentage.toFixed(0)}% MATCH
                          </div>
                          <div className="w-24 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full"
                              style={{ width: `${m.matchPercentage}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Strategy & Price */}
                      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                        <div>
                          Strategy: <span className="text-slate-200">{m.strategyName}</span>
                        </div>
                        <div>
                          Close: <span className="text-slate-200">{m.entryPrice}</span>
                        </div>
                      </div>

                      {/* Condition Breakdown */}
                      <div className="bg-slate-950/80 rounded-lg p-3 font-mono text-[11px] border border-slate-800 space-y-1.5">
                        {m.passedConditions.map((pass, pIdx) => (
                          <div key={pIdx} className="text-emerald-400 flex items-start gap-1.5">
                            <CheckCircle2 className="w-3 h-3 flex-shrink-0 mt-0.5" />
                            <span>{pass}</span>
                          </div>
                        ))}

                        {m.failedConditions.map((fail, fIdx) => (
                          <div key={fIdx} className="text-red-400 flex items-start gap-1.5">
                            <X className="w-3 h-3 flex-shrink-0 mt-0.5" />
                            <span>{fail}</span>
                          </div>
                        ))}
                      </div>

                      {/* Chart Navigation */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                        <button
                          onClick={() => setExpandedMatchIndex(isExpanded ? null : idx)}
                          className="text-[11px] text-slate-400 hover:text-slate-200 font-mono"
                        >
                          {isExpanded ? 'Hide Raw Details' : 'View Raw Details'}
                        </button>

                        <button
                          onClick={() => handleInspectChart(m.symbol, m.timeframe as Timeframe)}
                          className={`px-3 py-1 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
                            isLastViewed
                              ? 'bg-blue-600 text-white border border-blue-500 font-bold shadow-sm'
                              : 'bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400'
                          }`}
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>{isLastViewed ? 'Inspect Again' : 'Inspect Setup on Chart'}</span>
                        </button>
                      </div>

                      {isExpanded && m.detailsJson && (
                        <pre className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-400 font-mono overflow-x-auto max-h-40">
                          {m.detailsJson}
                        </pre>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: HISTORICAL BAR BACKTESTER */}
        {/* ============================================================== */}
        {activeTab === 'historical' && (
          <div className="space-y-6">
            {/* Historical Configuration Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Strategy Picker */}
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1">
                    Select Strategy to Backtest
                  </label>
                  <select
                    value={selectedStrategyId}
                    onChange={(e) => setSelectedStrategyId(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    {strategies.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.timeframe})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bucket Picker */}
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1">
                    Symbol Bucket
                  </label>
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    {symbolGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.symbols.length} symbols)
                      </option>
                    ))}
                  </select>
                </div>

                {/* History Bar Count Slider */}
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1">
                    History Depth: {barCount} Bars
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={50}
                      max={500}
                      step={25}
                      value={barCount}
                      onChange={(e) => setBarCount(Number(e.target.value))}
                      className="w-36 accent-indigo-500"
                    />
                    <span className="text-xs font-mono text-slate-300">{barCount}b</span>
                  </div>
                </div>

                {/* Timeframe */}
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1">
                    Timeframe
                  </label>
                  <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs font-mono overflow-x-auto scrollbar-none">
                    {(['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN1'] as Timeframe[]).map((tf) => (
                      <button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={`px-2 py-1 rounded transition-all whitespace-nowrap ${
                          timeframe === tf
                            ? 'bg-blue-600 text-white font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Run Historical Button */}
              <button
                onClick={handleRunHistoricalScan}
                disabled={isHistScanning}
                className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
              >
                <Clock className={`w-4 h-4 ${isHistScanning ? 'animate-spin' : ''}`} />
                <span>{isHistScanning ? 'Simulating Backtest...' : 'Execute Backtest'}</span>
              </button>
            </div>

            {/* Backtest KPI Dashboard */}
            {histReport && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Win Rate</div>
                    <div
                      className={`text-xl font-bold font-mono mt-1 ${
                        histReport.winRatePercent >= 50 ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {histReport.winRatePercent.toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {histReport.winningTradesCount}W / {histReport.losingTradesCount}L
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Total P&L</div>
                    <div
                      className={`text-xl font-bold font-mono mt-1 ${
                        histReport.totalProfitLossPips >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {histReport.totalProfitLossPips >= 0 ? '+' : ''}
                      {histReport.totalProfitLossPips} pips
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Simulated 1-lot baseline
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Profit Factor</div>
                    <div className="text-xl font-bold font-mono text-indigo-400 mt-1">
                      {histReport.profitFactor.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">Gross W / Gross L</div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Max Drawdown</div>
                    <div className="text-xl font-bold font-mono text-red-400 mt-1">
                      -{histReport.maxDrawdownPips} pips
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">Peak-to-trough</div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Simulated Trades</div>
                    <div className="text-xl font-bold font-mono text-white mt-1">
                      {histReport.simulatedTradesCount}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">100% Verified Entry</div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Bars Evaluated</div>
                    <div className="text-xl font-bold font-mono text-slate-200 mt-1">
                      {histReport.barsAnalyzed}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      In {histReport.durationMs}ms
                    </div>
                  </div>
                </div>

                {/* Sub-Tabs: Simulated Trades vs Historical Setups */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="h-12 px-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setHistFilter('trades')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                          histFilter === 'trades'
                            ? 'bg-blue-600 text-white font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Simulated Trades Timeline ({histReport.simulatedTrades.length})
                      </button>
                      <button
                        onClick={() => setHistFilter('matches')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                          histFilter === 'matches'
                            ? 'bg-blue-600 text-white font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        All Historical Setups ({histReport.historicalMatches.length})
                      </button>
                    </div>

                    <div className="text-[11px] font-mono text-slate-400">
                      Period: {new Date(histReport.periodStartUtc).toLocaleDateString()} —{' '}
                      {new Date(histReport.periodEndUtc).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Trades Timeline Table */}
                  {histFilter === 'trades' && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-mono text-xs">
                        <thead className="bg-slate-950/40 text-[10px] uppercase text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="py-2.5 px-4">Symbol</th>
                            <th className="py-2.5 px-4">Side</th>
                            <th className="py-2.5 px-4">Entry Time</th>
                            <th className="py-2.5 px-4">Entry Price</th>
                            <th className="py-2.5 px-4">SL / TP</th>
                            <th className="py-2.5 px-4">Exit Time</th>
                            <th className="py-2.5 px-4">Exit Price</th>
                            <th className="py-2.5 px-4">Outcome</th>
                            <th className="py-2.5 px-4 text-right">P&L (Pips)</th>
                            <th className="py-2.5 px-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {histReport.simulatedTrades.map((t, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                              <td className="py-2.5 px-4 font-bold text-white">{t.symbol}</td>
                              <td className="py-2.5 px-4">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    t.side === 'Buy'
                                      ? 'bg-emerald-500/20 text-emerald-400'
                                      : 'bg-red-500/20 text-red-400'
                                  }`}
                                >
                                  {t.side === 'Buy' ? 'BUY' : 'SELL'}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                                {new Date(t.entryTime).toLocaleString([], {
                                  month: 'numeric',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td className="py-2.5 px-4 text-slate-200">{t.entryPrice}</td>
                              <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                                <span className="text-red-400">{t.stopLoss}</span> /{' '}
                                <span className="text-emerald-400">{t.takeProfit}</span>
                              </td>
                              <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                                {t.exitTime
                                  ? new Date(t.exitTime).toLocaleString([], {
                                      month: 'numeric',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : '—'}
                              </td>
                              <td className="py-2.5 px-4 text-slate-200">{t.exitPrice ?? '—'}</td>
                              <td className="py-2.5 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    t.outcome === 'Win'
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      : t.outcome === 'Loss'
                                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  }`}
                                >
                                  {t.outcome}
                                </span>
                              </td>
                              <td
                                className={`py-2.5 px-4 text-right font-bold ${
                                  t.profitLossPips >= 0 ? 'text-emerald-400' : 'text-red-400'
                                }`}
                              >
                                {t.profitLossPips >= 0 ? '+' : ''}
                                {t.profitLossPips}
                              </td>
                              <td className="py-2.5 px-4 text-right">
                                <button
                                  onClick={() => handleInspectChart(t.symbol, timeframe)}
                                  className="text-blue-400 hover:text-blue-300 text-[11px] underline flex items-center gap-1 justify-end"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Chart</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Matches Breakdown */}
                  {histFilter === 'matches' && (
                    <div className="divide-y divide-slate-800/80 p-4 space-y-3">
                      {histReport.historicalMatches.map((m, idx) => (
                        <div key={idx} className="pt-3 first:pt-0 flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-white">{m.symbol}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                m.state === 'FullyMet'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}
                            >
                              {m.state === 'FullyMet' ? '100% MATCH' : `${m.matchPercentage}% NEAR MISS`}
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              {new Date(m.candleTimestamp).toLocaleString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="text-slate-300">Close: {m.entryPrice}</span>
                            <button
                              onClick={() => handleInspectChart(m.symbol, timeframe)}
                              className="text-blue-400 hover:text-blue-300 text-[11px] flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>View Bar</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: SYMBOL BUCKETS & BASKETS MANAGER */}
        {/* ============================================================== */}
        {activeTab === 'buckets' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white">Configured Symbol Buckets</h2>
                <p className="text-xs text-slate-400 font-mono">
                  Group symbols into market baskets for targeted robotic scanning. Avoid careless global scans.
                </p>
              </div>

              <button
                onClick={() => setIsCreateBucketOpen(true)}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Bucket</span>
              </button>
            </div>

            {/* Grid of Buckets */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {symbolGroups.map((g) => (
                <div
                  key={g.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4 shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-white font-mono">{g.name}</h3>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 mt-1 inline-block">
                          {g.category}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteBucket(g.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors p-1"
                        title="Delete Bucket"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-400">{g.description || 'Custom user symbol basket'}</p>

                    {/* Symbols Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {g.symbols.map((sym) => (
                        <span
                          key={sym}
                          className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono flex items-center gap-1 group"
                        >
                          <span>{sym}</span>
                          <button
                            onClick={() => handleRemoveSymbolFromGroup(g, sym)}
                            className="text-slate-500 group-hover:text-red-400 text-[10px] ml-0.5"
                            title={`Remove ${sym}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Add Symbol Input */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add symbol (e.g. EURUSD)"
                      value={newSymbolInput[g.id] || ''}
                      onChange={(e) =>
                        setNewSymbolInput((prev) => ({ ...prev, [g.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddSymbolToGroup(g);
                      }}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono uppercase"
                    />
                    <button
                      onClick={() => handleAddSymbolToGroup(g)}
                      className="px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 text-xs font-mono font-medium"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Create Bucket Modal */}
            {isCreateBucketOpen && (
              <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <FolderPlus className="w-4 h-4 text-indigo-400" />
                      <span>Create New Symbol Bucket</span>
                    </h3>
                    <button
                      onClick={() => setIsCreateBucketOpen(false)}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateBucket} className="space-y-4 text-xs font-mono">
                    <div>
                      <label className="block text-slate-400 mb-1">Bucket Name</label>
                      <input
                        type="text"
                        placeholder="e.g. High Volatility Pairs"
                        value={newBucketName}
                        onChange={(e) => setNewBucketName(e.target.value)}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Category</label>
                      <select
                        value={newBucketCat}
                        onChange={(e) => setNewBucketCat(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="forex">Forex</option>
                        <option value="crypto">Crypto</option>
                        <option value="stocks">Stocks / Equities</option>
                        <option value="indices">Indices</option>
                        <option value="commodities">Commodities</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Description (Optional)</label>
                      <input
                        type="text"
                        placeholder="Short description of this strategy basket"
                        value={newBucketDesc}
                        onChange={(e) => setNewBucketDesc(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">
                        Symbols (Space or comma separated)
                      </label>
                      <textarea
                        rows={3}
                        placeholder="e.g. EURUSD, GBPUSD, USDJPY, AUDUSD"
                        value={newBucketSymbols}
                        onChange={(e) => setNewBucketSymbols(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-indigo-500 uppercase"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsCreateBucketOpen(false)}
                        className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                      >
                        Save Bucket
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
