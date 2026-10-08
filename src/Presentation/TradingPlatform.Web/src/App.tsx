import React, { useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { NavigationSidebar, PageId } from './components/NavigationSidebar';
import { BotOverview } from './components/BotOverview';
import { TradingChart } from './components/TradingChart';
import { MarketScannerView } from './components/MarketScannerView';
import { RuleStudio } from './components/RuleStudio';
import { NearMissRadar } from './components/NearMissRadar';
import { PositionsManager } from './components/PositionsManager';
import { RiskConsole } from './components/RiskConsole';
import { SimulatorConsole } from './components/SimulatorConsole';
import { KillSwitchModal } from './components/KillSwitchModal';
import { BrokerSettingsModal } from './components/BrokerSettingsModal';
import { SymbolSearchModal } from './components/chart/SymbolSearchModal';
import { Search, Layers, Globe, Coins, TrendingUp, Flame, BarChart3, Sparkles } from 'lucide-react';
import { StrategyAlertsModal } from './components/StrategyAlertsModal';
import { AICopilotDrawer } from './components/AICopilotDrawer';
import { AIStrategyGeneratorModal } from './components/AIStrategyGeneratorModal';
import { DocumentationPage } from './components/DocumentationPage';
import { FeedbackModal } from './components/FeedbackModal';
import { AboutModal } from './components/AboutModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { sendDesktopNotification } from './utils/desktopNotification';
import { tradingApi } from './api/tradingClient';
import {
  AccountSummary,
  BackgroundScannerSettings,
  BackgroundScannerStatus,
  Candle,
  IndicatorConfig,
  MarketQuote,
  OrderType,
  Position,
  RiskProfile,
  SignalAuditLog,
  StrategyAlertNotification,
  StrategyDefinition,
  Timeframe,
} from './types/trading';
import { getCandleTimeSeconds } from './utils/indicators';

const VALID_PAGES: PageId[] = ['dashboard', 'scanner', 'strategies', 'radar', 'positions', 'sandbox', 'chart', 'docs'];

function getPageFromUrl(): PageId {
  if (typeof window === 'undefined') return 'dashboard';

  // 1. Check Hash first (e.g. #/scanner or #scanner)
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase().trim();
  if (VALID_PAGES.includes(hash as PageId)) {
    return hash as PageId;
  }

  // 2. Check Pathname (e.g. /scanner)
  const path = window.location.pathname.replace(/^\//, '').toLowerCase().trim();
  if (VALID_PAGES.includes(path as PageId)) {
    return path as PageId;
  }

  // 3. Fallback to localStorage
  try {
    const saved = localStorage.getItem('tp_active_page') as PageId | null;
    if (saved && VALID_PAGES.includes(saved)) {
      return saved;
    }
  } catch {
    // ignore
  }

  return 'dashboard';
}

export function App() {
  const [activePage, setActivePage] = useState<PageId>(() => getPageFromUrl());
  const [selectedSymbol, setSelectedSymbol] = useState<string>(() => {
    try {
      return localStorage.getItem('tp_selected_symbol') || 'EURUSD';
    } catch {
      return 'EURUSD';
    }
  });
  const [timeframe, setTimeframe] = useState<Timeframe>(() => {
    try {
      return (localStorage.getItem('tp_selected_timeframe') as Timeframe) || 'M5';
    } catch {
      return 'M5';
    }
  });

  const handleNavigateTo = (page: PageId) => {
    setActivePage(page);
    try {
      localStorage.setItem('tp_active_page', page);
      const targetHash = page === 'dashboard' ? '#/' : `#/${page}`;
      if (window.location.hash !== targetHash) {
        window.location.hash = targetHash;
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem('tp_selected_symbol', selectedSymbol);
    } catch {
      // ignore
    }
  }, [selectedSymbol]);

  useEffect(() => {
    try {
      localStorage.setItem('tp_selected_timeframe', timeframe);
    } catch {
      // ignore
    }
  }, [timeframe]);

  // Synchronize on browser Back/Forward (popstate & hashchange)
  useEffect(() => {
    const handleLocationChange = () => {
      const page = getPageFromUrl();
      setActivePage(page);
    };

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);

    // Initial URL sync: ensure hash reflects activePage if not set
    const currentHash = window.location.hash.replace(/^#\/?/, '').toLowerCase().trim();
    if (!currentHash && activePage !== 'dashboard') {
      window.location.hash = `#/${activePage}`;
    }

    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const [indicatorConfig, setIndicatorConfig] = useState<IndicatorConfig>({
    emas: [20, 50, 200],
    smas: [20, 50, 200],
    rsi: { period: 14, overbought: 70, oversold: 30 },
    macd: { fast: 12, slow: 26, signal: 9 },
    bollinger: { period: 20, stdDev: 2.0 },
    stoch: { kPeriod: 14, dPeriod: 3, smooth: 3 },
    atr: { period: 14, slMultiplier: 1.5, tpMultiplier: 3.0 },
    adx: { period: 14, threshold: 25 },
    ichimoku: { tenkan: 9, kijun: 26, senkou: 52 },
  });

  const [strategies, setStrategies] = useState<StrategyDefinition[]>([]);
  const [auditLogs, setAuditLogs] = useState<SignalAuditLog[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [risk, setRisk] = useState<RiskProfile | null>(null);
  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [isKillSwitchOpen, setIsKillSwitchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeProvider, setActiveProvider] = useState('KeylessPublic');
  const [isSymbolSearchOpen, setIsSymbolSearchOpen] = useState(false);
  const [watchlistCategory, setWatchlistCategory] = useState<'all' | 'forex' | 'indices' | 'commodities' | 'crypto' | 'stocks'>('all');
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isAiStrategyModalOpen, setIsAiStrategyModalOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Global keyboard shortcuts (/ for search, Ctrl+/ for shortcuts reference)
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === '/' || (e.ctrlKey && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        setIsSymbolSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  // Listen for Electron native application menu triggers (About, Shortcuts)
  useEffect(() => {
    const electron = (window as any).electronAPI;
    if (electron) {
      const cleanAbout = electron.onOpenAbout?.(() => setIsAboutOpen(true));
      const cleanShortcuts = electron.onOpenShortcuts?.(() => setIsShortcutsOpen(true));
      return () => {
        cleanAbout?.();
        cleanShortcuts?.();
      };
    }
  }, []);

  // Initial synthetic candlestick data for charting
  const [candles, setCandles] = useState<Candle[]>(() => {
    const list: Candle[] = [];
    let p = 1.0820;
    const now = Date.now();
    for (let i = 50; i >= 0; i--) {
      const open = p;
      const delta = (Math.random() - 0.48) * 0.0012;
      const close = open + delta;
      const high = Math.max(open, close) + Math.random() * 0.0006;
      const low = Math.min(open, close) - Math.random() * 0.0006;
      list.push({
        symbol: 'EURUSD',
        timeframe: 'M5',
        timestamp: new Date(now - i * 5 * 60000).toISOString(),
        open: Number(open.toFixed(5)),
        high: Number(high.toFixed(5)),
        low: Number(low.toFixed(5)),
        close: Number(close.toFixed(5)),
        volume: Math.floor(Math.random() * 1500 + 300),
        isComplete: true,
      });
      p = close;
    }
    return list;
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [watchlistQuotes, setWatchlistQuotes] = useState<Record<string, MarketQuote>>({});
  const [secondsUntilSync, setSecondsUntilSync] = useState<number>(60);

  const currentPrice = watchlistQuotes[selectedSymbol]?.price ?? candles[candles.length - 1]?.close ?? 1.0852;
  const [isSyncingCandles, setIsSyncingCandles] = useState<boolean>(false);
  const [alerts, setAlerts] = useState<StrategyAlertNotification[]>([]);
  const [scannerStatus, setScannerStatus] = useState<BackgroundScannerStatus | null>(null);
  const [scannerSettings, setScannerSettings] = useState<BackgroundScannerSettings | null>(null);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const scannerSettingsRef = useRef<BackgroundScannerSettings | null>(null);
  const notifiedRemindersRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    scannerSettingsRef.current = scannerSettings;
  }, [scannerSettings]);

  const fetchQuotesData = async () => {
    try {
      const quotesList = await tradingApi.getQuotes();
      if (quotesList && quotesList.length > 0) {
        const map: Record<string, MarketQuote> = {};
        quotesList.forEach((q) => { map[q.symbol] = q; });
        setWatchlistQuotes((prev) => ({ ...prev, ...map }));
      }
    } catch (err) {
      console.warn('Watchlist quotes fetch warning:', err);
    }
  };

  const fetchTelemetryData = async () => {
    try {
      const [strats, logs, pos, rk, acc, cfg] = await Promise.allSettled([
        tradingApi.getStrategies(),
        tradingApi.getAuditLogs(30),
        tradingApi.getPositions(),
        tradingApi.getRiskProfile(),
        tradingApi.getAccountSummary(),
        tradingApi.getBrokerConfig(),
      ]);

      if (strats.status === 'fulfilled') setStrategies(strats.value);
      if (logs.status === 'fulfilled') setAuditLogs(logs.value);
      if (pos.status === 'fulfilled') setPositions(pos.value);
      if (rk.status === 'fulfilled') setRisk(rk.value);
      if (acc.status === 'fulfilled') setAccount(acc.value);
      if (cfg.status === 'fulfilled' && cfg.value?.activeProvider) {
        setActiveProvider(cfg.value.activeProvider);
      }
      fetchQuotesData();
    } catch (err) {
      console.warn('Telemetry fetch warning:', err);
    }
  };

  const fetchNotificationsData = async () => {
    try {
      const [alertsRes, statusRes, settingsRes] = await Promise.allSettled([
        tradingApi.getNotifications(),
        tradingApi.getScannerStatus(),
        tradingApi.getScannerSettings(),
      ]);

      if (alertsRes.status === 'fulfilled') {
        const newAlerts = alertsRes.value;
        setAlerts(newAlerts);

        const currentSettings = scannerSettingsRef.current;
        if (currentSettings?.isEnabled) {
          for (const alert of newAlerts) {
            if (alert.isAcknowledged) continue;

            const prevReminderCount = notifiedRemindersRef.current.get(alert.id);
            if (prevReminderCount === undefined || prevReminderCount < alert.reminderCount) {
              notifiedRemindersRef.current.set(alert.id, alert.reminderCount);

              if (currentSettings.desktopNotificationEnabled) {
                const isReminder = (alert.reminderCount ?? 0) > 0;
                sendDesktopNotification({
                  title: isReminder
                    ? `⏰ [Reminder #${alert.reminderCount}] Strategy Alert: ${alert.strategyName}`
                    : `🎯 Strategy Opportunity: ${alert.strategyName}`,
                  body: `${alert.symbol} (${alert.timeframe}) · $${Number(alert.lastPrice).toFixed(4)} · ${alert.summaryMessage}`,
                  tag: `strategy-alert-${alert.id}`,
                  playSound: currentSettings.soundAlertsEnabled,
                  onClick: () => {
                    setSelectedSymbol(alert.symbol);
                    setTimeframe(alert.timeframe);
                    handleNavigateTo('chart');
                  },
                });
              }
            }
          }
        }
      }

      if (statusRes.status === 'fulfilled') setScannerStatus(statusRes.value);
      if (settingsRes.status === 'fulfilled') {
        setScannerSettings(settingsRes.value);
        scannerSettingsRef.current = settingsRes.value;
      }
    } catch (err) {
      console.warn('Notifications fetch warning:', err);
    }
  };

  // Initial telemetry load on mount (no automatic polling - user refreshes via Manual Refresh button)
  useEffect(() => {
    fetchTelemetryData();
  }, []);

  // Notifications poll (15s lightweight in-memory local endpoint)
  useEffect(() => {
    fetchNotificationsData();
    const interval = setInterval(fetchNotificationsData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledgeAlert = async (id: string) => {
    try {
      await tradingApi.acknowledgeNotification(id);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isAcknowledged: true, acknowledgedAtUtc: new Date().toISOString() } : a))
      );
    } catch (e) {
      console.warn('Acknowledge alert failed:', e);
    }
  };

  const handleDismissAlert = async (id: string) => {
    try {
      await tradingApi.dismissNotification(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      notifiedRemindersRef.current.delete(id);
    } catch (e) {
      console.warn('Dismiss alert failed:', e);
    }
  };

  const handleClearAllAlerts = async () => {
    try {
      await tradingApi.clearNotifications();
      setAlerts([]);
      notifiedRemindersRef.current.clear();
    } catch (e) {
      console.warn('Clear alerts failed:', e);
    }
  };

  const handleTestNotification = async () => {
    try {
      const testAlert = await tradingApi.testNotification();
      setAlerts((prev) => [testAlert, ...prev]);
    } catch (e) {
      console.warn('Test notification failed:', e);
    }
  };

  const handleUpdateScannerSettings = async (newSettings: BackgroundScannerSettings) => {
    try {
      const updated = await tradingApi.updateScannerSettings(newSettings);
      setScannerSettings(updated);
      scannerSettingsRef.current = updated;
    } catch (e) {
      console.warn('Update scanner settings failed:', e);
    }
  };

  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const selectedSymbolRef = useRef(selectedSymbol);
  const timeframeRef = useRef(timeframe);
  const activeProviderRef = useRef(activeProvider);

  useEffect(() => {
    selectedSymbolRef.current = selectedSymbol;
    timeframeRef.current = timeframe;
    activeProviderRef.current = activeProvider;
  }, [selectedSymbol, timeframe, activeProvider]);

  const seriesKey = `${selectedSymbol}|${timeframe}|${activeProvider}`;
  const seriesKeyRef = useRef(seriesKey);
  const candlesRef = useRef<Candle[]>(candles);
  const isLoadingHistoryRef = useRef(false);
  const hasMoreHistoryRef = useRef(true);

  useEffect(() => {
    candlesRef.current = candles;
  }, [candles]);

  const mergeCandles = (a: Candle[], b: Candle[]): Candle[] => {
    const map = new Map<number, Candle>();
    a.forEach((c) => map.set(getCandleTimeSeconds(c.timestamp), c));
    b.forEach((c) => map.set(getCandleTimeSeconds(c.timestamp), c));
    return Array.from(map.entries())
      .sort((x, y) => x[0] - y[0])
      .map((e) => e[1]);
  };

  // Fetch real-time / public multi-timeframe candles from active provider
  const fetchLiveCandles = async (isInitial = false, key?: string, force = true) => {
    const targetSymbol = selectedSymbolRef.current;
    const targetTimeframe = timeframeRef.current;
    const targetKey = key || `${targetSymbol}|${targetTimeframe}|${activeProviderRef.current}`;
    try {
      setIsSyncingCandles(true);
      const countToFetch = isInitial ? 300 : 60;
      const realCandles = await tradingApi.getCandles(targetSymbol, targetTimeframe, countToFetch, undefined, force);
      // Drop responses for a symbol/timeframe the user has already navigated away from
      if (targetKey !== `${selectedSymbolRef.current}|${timeframeRef.current}|${activeProviderRef.current}`) return;
      if (realCandles && realCandles.length > 0) {
        // Initial load replaces; live polls merge (overwriting the forming bar with the latest quote price)
        setCandles((prev) => (isInitial ? mergeCandles([], realCandles) : mergeCandles(prev, realCandles)));
      }
    } catch (err) {
      console.warn('Live candles fetch warning:', err);
    } finally {
      setIsSyncingCandles(false);
    }
  };

  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setSecondsUntilSync(60);
    try {
      await Promise.allSettled([
        fetchTelemetryData(),
        fetchQuotesData(),
        fetchLiveCandles(false, undefined, true),
        fetchNotificationsData(),
      ]);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Immediate initial candle fetch on series change & reset 60s countdown
  useEffect(() => {
    seriesKeyRef.current = seriesKey;
    hasMoreHistoryRef.current = true;
    isLoadingHistoryRef.current = false;
    candlesRef.current = [];
    setCandles([]);
    setSecondsUntilSync(60);
    fetchLiveCandles(true, seriesKey, true);
    fetchQuotesData();
  }, [seriesKey]);

  // Synchronized 1-minute (60s) cadence ticker for all timeframes & watchlist quotes
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsUntilSync((prev) => {
        if (prev <= 1) {
          fetchLiveCandles(false, undefined, true);
          fetchQuotesData();
          fetchTelemetryData();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Loads one page of real older bars from the provider.
   * Returns how many bars were added (0 = provider has no more history) and the new total.
   * No bars are fabricated: when the provider runs out, the chart reports the end of history.
   */
  const handleLoadOlderCandles = async (): Promise<{ loaded: number; total: number; boundaryTime: number }> => {
    const current = candlesRef.current;
    const key = seriesKeyRef.current;
    if (isLoadingHistoryRef.current || !hasMoreHistoryRef.current || current.length === 0) {
      return { loaded: 0, total: current.length, boundaryTime: 0 };
    }
    isLoadingHistoryRef.current = true;
    setIsLoadingHistory(true);
    try {
      const oldestSec = getCandleTimeSeconds(current[0].timestamp);
      const olderCandles = await tradingApi.getCandles(selectedSymbol, timeframe, 300, oldestSec);
      if (key !== seriesKeyRef.current) return { loaded: 0, total: candlesRef.current.length, boundaryTime: 0 };

      const strictlyOlder = (olderCandles || []).filter(
        (c) => getCandleTimeSeconds(c.timestamp) < oldestSec
      );

      if (strictlyOlder.length === 0) {
        hasMoreHistoryRef.current = false;
        return { loaded: 0, total: current.length, boundaryTime: oldestSec };
      }

      const merged = mergeCandles(strictlyOlder, candlesRef.current);
      candlesRef.current = merged;
      setCandles(merged);
      return { loaded: merged.length - current.length, total: merged.length, boundaryTime: oldestSec };
    } catch (err) {
      // A network error is not "end of history" - allow retrying
      console.warn('Load older candles error:', err);
      throw err;
    } finally {
      isLoadingHistoryRef.current = false;
      setIsLoadingHistory(false);
    }
  };

  const handleSaveStrategy = async (strategyDto: any) => {
    if (strategyDto.id) {
      await tradingApi.updateStrategy(strategyDto.id, strategyDto);
    } else {
      await tradingApi.createStrategy(strategyDto);
    }
    const updated = await tradingApi.getStrategies();
    setStrategies(updated);
  };

  const handleDeleteStrategy = async (id: string) => {
    await tradingApi.deleteStrategy(id);
    const updated = await tradingApi.getStrategies();
    setStrategies(updated);
  };

  const handleApplyStrategyFromCopilot = async (generated: any) => {
    handleNavigateTo('strategies');
    await handleSaveStrategy({
      name: generated.name,
      description: generated.description,
      timeframe: generated.timeframe,
      rawJsonRules: generated.rawJsonRules,
      isActive: true,
      autoTradingEnabled: generated.autoTradingEnabled,
      aiValidationEnabled: generated.aiValidationEnabled,
    });
  };

  const handleClosePosition = async (ticket: number) => {
    await tradingApi.closePosition(ticket, 'ManualTerminalClose');
    const updated = await tradingApi.getPositions();
    setPositions(updated);
    try {
      const acc = await tradingApi.getAccountSummary();
      setAccount(acc);
    } catch {}
  };

  const handlePlaceOrder = async (
    side: 'Buy' | 'Sell',
    lots: number,
    price: number,
    stopLoss?: number,
    takeProfit?: number
  ) => {
    try {
      await tradingApi.placeOrder({
        symbol: selectedSymbol,
        orderType: side,
        lots,
        price,
        stopLoss,
        takeProfit,
      });
      const updated = await tradingApi.getPositions();
      setPositions(updated);
      try {
        const acc = await tradingApi.getAccountSummary();
        setAccount(acc);
      } catch {}
    } catch (err) {
      console.warn('Manual order placement fallback:', err);
      throw err;
    }
  };

  const handlePlaceQuickOrder = async (symbol: string, side: OrderType, price: number, sl?: number, tp?: number) => {
    try {
      await tradingApi.placeOrder({
        symbol,
        orderType: side,
        lots: 0.1,
        price,
        stopLoss: sl,
        takeProfit: tp,
      });
      const updated = await tradingApi.getPositions();
      setPositions(updated);
    } catch (err) {
      console.warn('Quick order placement error:', err);
    }
  };

  const handleToggleKillSwitch = async (engage: boolean, reason?: string) => {
    const updated = await tradingApi.toggleKillSwitch(engage, reason);
    setRisk(updated);
  };

  const handleSimulateCandle = async (candleData: any) => {
    const res = await tradingApi.simulateCandle(candleData);
    if (res.candleIngested) {
      setCandles((prev) => [...prev.slice(1), res.candleIngested]);
    }
    // Refresh audits and positions
    const [logs, pos] = await Promise.all([
      tradingApi.getAuditLogs(30),
      tradingApi.getPositions(),
    ]);
    setAuditLogs(logs);
    setPositions(pos);
    return res;
  };

  const pageTitles: Record<PageId, string> = {
    dashboard: '🤖 Bot Operations & Health',
    scanner: '📡 Robotic Market Scanner & Backtester',
    strategies: '⚡ Dynamic Strategy Studio',
    radar: '🎯 Near-Miss & Forensic Radar',
    positions: '💼 Positions & Risk Management',
    sandbox: '🔬 Ingestion & Simulation Sandbox',
    chart: '📈 Market Chart & Technical Inspector',
    docs: '📖 User Manual & Architecture Documentation',
  };

  return (
    <div className="flex h-screen w-screen bg-[#080c15] text-slate-100 overflow-hidden font-sans">
      {/* Robotic Navigation Sidebar - Full Screen Height on Left */}
      <NavigationSidebar
        activePage={activePage}
        onSelectPage={handleNavigateTo}
        activeStrategiesCount={strategies.filter((s) => s.isActive && s.autoTradingEnabled).length}
        openPositionsCount={positions.filter((p) => p.status === 'Open').length}
        auditLogsCount={auditLogs.length}
        isKillSwitchEngaged={risk?.isKillSwitchEngaged ?? false}
        activeProvider={activeProvider}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      {/* Main Terminal Workspace: Top Header + Dedicated Page Viewport */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <Header
          pageTitle={pageTitles[activePage]}
          account={account}
          risk={risk}
          onOpenKillSwitch={() => setIsKillSwitchOpen(true)}
          selectedSymbol={selectedSymbol}
          currentPrice={currentPrice}
          onOpenSymbolSearch={() => setIsSymbolSearchOpen(true)}
          openPositionsCount={positions.filter((p) => p.status === 'Open').length}
          onManualRefresh={handleManualRefresh}
          isRefreshing={isRefreshing}
          unacknowledgedAlertsCount={alerts.filter((a) => !a.isAcknowledged).length}
          onOpenAlertsModal={() => setIsAlertsModalOpen(true)}
          isBackgroundScannerRunning={scannerSettings?.isEnabled ?? true}
          onToggleCopilot={() => setIsCopilotOpen((prev) => !prev)}
          isCopilotOpen={isCopilotOpen}
          activeProvider={activeProvider}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenFeedback={() => setIsFeedbackOpen(true)}
        />

        {/* Dedicated Page Viewport */}
        <main className="flex-1 h-full overflow-hidden bg-[#090e1a] flex flex-col min-w-0">
          {/* Page 1: Bot Operations & Mission Control */}
          {activePage === 'dashboard' && (
            <BotOverview
              account={account}
              risk={risk}
              strategies={strategies}
              positions={positions}
              auditLogs={auditLogs}
              onOpenKillSwitch={() => setIsKillSwitchOpen(true)}
              onNavigateTo={handleNavigateTo}
              selectedSymbol={selectedSymbol}
              currentPrice={currentPrice}
              candles={candles}
              timeframe={timeframe}
              onSelectSymbol={setSelectedSymbol}
              onSelectTimeframe={setTimeframe}
            />
          )}

          {/* Page: Robotic Market Scanner & Backtester */}
          <div className={activePage === 'scanner' ? 'flex-1 h-full flex flex-col overflow-hidden' : 'hidden'}>
            <MarketScannerView
              onOpenChart={(symbol, tf) => {
                setSelectedSymbol(symbol);
                if (tf) setTimeframe(tf);
                handleNavigateTo('chart');
              }}
              onPlaceQuickOrder={handlePlaceQuickOrder}
              activeProvider={activeProvider}
              onOpenAlertsModal={() => setIsAlertsModalOpen(true)}
            />
          </div>

          {/* Page 2: Strategy Studio & Brain */}
          {activePage === 'strategies' && (
            <div className="flex-1 h-full p-3 overflow-hidden">
              <RuleStudio
                strategies={strategies}
                onSaveStrategy={handleSaveStrategy}
                onDeleteStrategy={handleDeleteStrategy}
                onIndicatorConfigChange={setIndicatorConfig}
              />
            </div>
          )}

          {/* Page 3: Near-Miss & Audit Radar */}
          {activePage === 'radar' && (
            <div className="flex-1 h-full p-3 overflow-hidden">
              <NearMissRadar logs={auditLogs} />
            </div>
          )}

          {/* Page 4: Positions & Risk Engine */}
          {activePage === 'positions' && (
            <div className="flex-1 h-full p-4 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 h-full">
                <div className="xl:col-span-2 min-h-[500px] h-full">
                  <PositionsManager
                    positions={positions}
                    onClosePosition={handleClosePosition}
                  />
                </div>
                <div className="min-h-[500px]">
                  <RiskConsole
                    account={account}
                    risk={risk}
                    positions={positions}
                    onOpenKillSwitch={() => setIsKillSwitchOpen(true)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Page 5: Ingestion & Simulation Sandbox */}
          {activePage === 'sandbox' && (
            <div className="flex-1 h-full p-4 overflow-y-auto">
              <div className="max-w-4xl mx-auto py-2">
                <SimulatorConsole onSimulateCandle={handleSimulateCandle} />
              </div>
            </div>
          )}

          {/* Page 6: Dedicated Chart & Technical Inspector */}
          {activePage === 'chart' && (
            <div className="flex-1 h-full p-3 flex gap-3 overflow-hidden">
              {/* Market Watchlist Sidebar */}
              <aside className="w-64 bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col font-mono text-xs hidden md:flex flex-shrink-0">
                {/* Watchlist Header + Browse Button */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      Watchlist
                    </span>
                    <span
                      className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center gap-1 font-semibold"
                      title="Auto-refreshes every 1 min (60s) to protect market data servers from rate-limiting"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      1m sync
                    </span>
                  </div>
                  <button
                    onClick={() => setIsSymbolSearchOpen(true)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 text-[10px] font-sans font-medium transition-all"
                    title="Search & Browse All Symbols (Shortcut: /)"
                  >
                    <Search className="w-3 h-3" />
                    <span>Browse All</span>
                  </button>
                </div>

                {/* Category Pills on Watchlist */}
                <div className="flex gap-1 mb-2 overflow-x-auto scrollbar-none text-[10px] font-sans pb-1">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'indices', label: 'Indices' },
                    { id: 'commodities', label: 'Commodities' },
                    { id: 'forex', label: 'Forex' },
                    { id: 'crypto', label: 'Crypto' },
                    { id: 'stocks', label: 'Stocks' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setWatchlistCategory(cat.id as any)}
                      className={`px-2 py-0.5 rounded transition-all whitespace-nowrap ${
                        watchlistCategory === cat.id
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Watchlist Items */}
                <div className="space-y-1.5 flex-1 overflow-y-auto pr-0.5">
                  {[
                    // Indices
                    { s: 'US500', name: 'S&P 500', cat: 'indices', defaultPrice: '5,782.40', defaultChange: '+0.52%', defaultUp: true },
                    { s: 'NAS100', name: 'Nasdaq 100', cat: 'indices', defaultPrice: '20,140.50', defaultChange: '+0.88%', defaultUp: true },
                    { s: 'US30', name: 'Dow Jones', cat: 'indices', defaultPrice: '42,352.00', defaultChange: '+0.35%', defaultUp: true },
                    { s: 'GER40', name: 'DAX 40', cat: 'indices', defaultPrice: '19,450.20', defaultChange: '+0.28%', defaultUp: true },
                    // Commodities
                    { s: 'XAUUSD', name: 'Gold Spot', cat: 'commodities', defaultPrice: '2,654.80', defaultChange: '+0.74%', defaultUp: true },
                    { s: 'USOIL', name: 'WTI Oil', cat: 'commodities', defaultPrice: '71.50', defaultChange: '-1.40%', defaultUp: false },
                    // Forex
                    { s: 'EURUSD', name: 'EUR/USD', cat: 'forex', defaultPrice: '1.08520', defaultChange: '+0.18%', defaultUp: true },
                    { s: 'GBPUSD', name: 'GBP/USD', cat: 'forex', defaultPrice: '1.26420', defaultChange: '-0.12%', defaultUp: false },
                    { s: 'USDJPY', name: 'USD/JPY', cat: 'forex', defaultPrice: '154.210', defaultChange: '+0.45%', defaultUp: true },
                    { s: 'AUDUSD', name: 'AUD/USD', cat: 'forex', defaultPrice: '0.65340', defaultChange: '+0.04%', defaultUp: true },
                    { s: 'USDCAD', name: 'USD/CAD', cat: 'forex', defaultPrice: '1.38120', defaultChange: '-0.22%', defaultUp: false },
                    // Crypto
                    { s: 'BTCUSDT', name: 'Bitcoin', cat: 'crypto', defaultPrice: '68,450.00', defaultChange: '+1.85%', defaultUp: true },
                    { s: 'ETHUSDT', name: 'Ethereum', cat: 'crypto', defaultPrice: '3,520.50', defaultChange: '+0.95%', defaultUp: true },
                    { s: 'SOLUSDT', name: 'Solana', cat: 'crypto', defaultPrice: '178.40', defaultChange: '+4.20%', defaultUp: true },
                    // Stocks
                    { s: 'AAPL', name: 'Apple', cat: 'stocks', defaultPrice: '232.50', defaultChange: '+0.65%', defaultUp: true },
                    { s: 'NVDA', name: 'NVIDIA', cat: 'stocks', defaultPrice: '126.40', defaultChange: '+2.15%', defaultUp: true },
                    { s: 'TSLA', name: 'Tesla', cat: 'stocks', defaultPrice: '254.20', defaultChange: '-1.20%', defaultUp: false },
                  ]
                    .filter((item) => watchlistCategory === 'all' || item.cat === watchlistCategory)
                    .map((item) => {
                      const quote = watchlistQuotes[item.s];
                      let displayPrice = item.defaultPrice;
                      let displayChange = item.defaultChange;
                      let isUp = item.defaultUp;

                      if (quote) {
                        displayPrice = quote.price >= 100
                          ? quote.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : quote.price > 10
                          ? quote.price.toFixed(3)
                          : quote.price.toFixed(quote.decimals || 5);
                        displayChange = `${quote.changePct >= 0 ? '+' : ''}${quote.changePct.toFixed(2)}%`;
                        isUp = quote.isPositive;
                      } else if (item.s === selectedSymbol && currentPrice) {
                        displayPrice = currentPrice >= 100
                          ? currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : currentPrice > 10
                          ? currentPrice.toFixed(3)
                          : currentPrice.toFixed(5);
                      }

                      return (
                        <button
                          key={item.s}
                          onClick={() => setSelectedSymbol(item.s)}
                          className={`w-full p-2 rounded-lg flex items-center justify-between text-left transition-all border ${
                            selectedSymbol === item.s
                              ? 'bg-blue-600/20 border-blue-500/40 text-blue-300 font-bold shadow-sm'
                              : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/60 text-slate-300'
                          }`}
                        >
                          <div>
                            <div className="font-bold flex items-center gap-1.5">
                              <span>{item.s}</span>
                              <span className="text-[9px] font-sans text-slate-500 font-normal">{item.name}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                              <span>{displayPrice}</span>
                              {quote && (
                                <span className="w-1 h-1 rounded-full bg-emerald-400/80 inline-block" title="Live dynamic price feed" />
                              )}
                            </div>
                          </div>
                          <div
                            className={`text-[11px] font-bold font-mono ${
                              isUp ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {displayChange}
                          </div>
                        </button>
                      );
                    })}
                </div>

                {/* Bottom Browse Full Catalog Link */}
                <div className="pt-2.5 mt-2 border-t border-slate-800 space-y-1.5">
                  <button
                    onClick={() => setIsSymbolSearchOpen(true)}
                    className="w-full py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800/90 border border-slate-800 text-slate-300 hover:text-white text-[11px] font-sans font-medium transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Search className="w-3 h-3 text-blue-400" />
                    <span>Browse All 45+ Symbols</span>
                  </button>
                  <div className="space-y-1.5 pt-1 font-sans">
                    <div className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-950/70 via-slate-900 to-cyan-950/60 border border-emerald-500/40 text-emerald-300 flex items-center justify-between text-[10px] font-mono shadow-sm">
                      <span className="flex items-center gap-1.5 text-slate-300 font-sans">
                        <span className="relative flex h-2 w-2">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${secondsUntilSync <= 5 ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75`} />
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${secondsUntilSync <= 5 ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                        </span>
                        <span>Refresh prices in</span>
                      </span>
                      <span className={`px-1.5 py-0.5 rounded font-black font-mono text-[11px] border ${
                        secondsUntilSync <= 5
                          ? 'bg-amber-500/25 text-amber-200 border-amber-400/60 animate-pulse'
                          : 'bg-emerald-500/20 text-emerald-200 border-emerald-400/50'
                      }`}>
                        {secondsUntilSync}s
                      </span>
                    </div>
                    <div className="text-[9px] text-slate-500 text-center flex items-center justify-center gap-1.5">
                      <span>Feed: <strong className="text-slate-400 font-mono">{activeProvider}</strong></span>
                      <span className="text-slate-600">·</span>
                      <span className="text-emerald-500/80">Rate-limit protected</span>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Full Interactive Chart */}
              <div className="flex-1 h-full overflow-hidden">
                <TradingChart
                  candles={candles}
                  symbol={selectedSymbol}
                  timeframe={timeframe}
                  onTimeframeChange={setTimeframe}
                  onSymbolChange={setSelectedSymbol}
                  indicatorConfig={indicatorConfig}
                  positions={positions}
                  auditLogs={auditLogs}
                  onPlaceOrder={handlePlaceOrder}
                  onClosePosition={handleClosePosition}
                  onLoadOlderCandles={handleLoadOlderCandles}
                  isLoadingHistory={isLoadingHistory}
                  activeProvider={activeProvider}
                  account={account}
                  secondsUntilSync={secondsUntilSync}
                  isRefreshingCandles={isSyncingCandles}
                  onManualSyncCandles={() => {
                    setSecondsUntilSync(60);
                    fetchLiveCandles(false, undefined, true);
                    fetchQuotesData();
                  }}
                />
              </div>
            </div>
          )}

          {/* Page 7: Comprehensive Platform Documentation & Architecture Guide */}
          {activePage === 'docs' && (
            <DocumentationPage
              onNavigateTo={handleNavigateTo}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenCopilot={() => setIsCopilotOpen(true)}
              onOpenFeedback={() => setIsFeedbackOpen(true)}
              activeProvider={activeProvider}
            />
          )}
        </main>
      </div>

      {/* Emergency Kill Switch Modal */}
      <KillSwitchModal
        isOpen={isKillSwitchOpen}
        onClose={() => setIsKillSwitchOpen(false)}
        risk={risk}
        onToggleKillSwitch={handleToggleKillSwitch}
      />

      {/* Broker & Keyless Market Data Settings Modal */}
      <BrokerSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onProviderChanged={(newProvider) => {
          setActiveProvider(newProvider);
        }}
      />

      {/* Global Symbol Search & Browser Modal */}
      <SymbolSearchModal
        isOpen={isSymbolSearchOpen}
        onClose={() => setIsSymbolSearchOpen(false)}
        selectedSymbol={selectedSymbol}
        onSelectSymbol={(newSym) => setSelectedSymbol(newSym)}
        activeProvider={activeProvider}
      />

      {/* Strategy Alerts & Background Notification Center Modal */}
      <StrategyAlertsModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        alerts={alerts}
        scannerStatus={scannerStatus}
        settings={scannerSettings}
        onUpdateSettings={handleUpdateScannerSettings}
        onAcknowledgeAlert={handleAcknowledgeAlert}
        onDismissAlert={handleDismissAlert}
        onClearAllAlerts={handleClearAllAlerts}
        onTestNotification={handleTestNotification}
        onNavigateToChart={(sym, tf) => {
          setSelectedSymbol(sym);
          if (tf) setTimeframe(tf);
          handleNavigateTo('chart');
        }}
      />

      {/* Floating AI Copilot Trigger Button (Always accessible) */}
      {!isCopilotOpen && (
        <button
          onClick={() => setIsCopilotOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:via-indigo-500 hover:to-purple-500 text-white shadow-xl shadow-indigo-950/60 border border-cyan-400/30 transition-all hover:scale-105 group cursor-pointer"
          title="Open AI Market Copilot & Quant Assistant"
        >
          <Sparkles className="w-4 h-4 text-cyan-200 animate-pulse group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-semibold tracking-wide font-sans hidden sm:inline">AI Copilot</span>
        </button>
      )}

      {/* AI Market Copilot & Quant Assistant Drawer */}
      <AICopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        currentSymbol={selectedSymbol}
        currentTimeframe={timeframe}
        openPositionsCount={positions.filter((p) => p.status === 'Open').length}
        activeStrategiesCount={strategies.filter((s) => s.isActive).length}
        currentDrawdown={account?.currentDrawdownPercent ?? 0}
        isKillSwitchEngaged={risk?.isKillSwitchEngaged ?? false}
        auditLogs={auditLogs}
        onOpenStrategyGenerator={() => {
          setIsCopilotOpen(false);
          setIsAiStrategyModalOpen(true);
        }}
      />

      {/* AI Strategy Generator Modal (Platform-wide) */}
      <AIStrategyGeneratorModal
        isOpen={isAiStrategyModalOpen}
        onClose={() => setIsAiStrategyModalOpen(false)}
        onApplyStrategy={handleApplyStrategyFromCopilot}
        initialTimeframe={timeframe}
      />

      {/* Quick Client Feedback to Discord Modal (No Login Required) */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        activeProvider={activeProvider}
        appVersion="1.3.1"
      />

      {/* About Trading Platform Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        activeProvider={activeProvider}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
      />

      {/* Keyboard Shortcuts Reference Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}

export default App;
