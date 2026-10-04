import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Sparkles,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Activity,
  Terminal,
  Settings,
  Layers,
  Zap,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  HelpCircle,
  Sliders,
  Radio,
  LineChart,
  Bot,
  Briefcase,
  Crosshair,
  Key,
  Flame,
  ArrowRight,
  Maximize2,
  RefreshCw,
} from 'lucide-react';
import { PageId } from './NavigationSidebar';

interface DocumentationPageProps {
  onNavigateTo?: (page: PageId) => void;
  onOpenSettings?: () => void;
  onOpenCopilot?: () => void;
  activeProvider?: string;
}

interface DocSection {
  id: string;
  title: string;
  category: string;
  icon: string;
  badge?: string;
}

const SECTIONS: DocSection[] = [
  { id: 'overview', title: '1. Platform Overview & Quick Start', category: 'Getting Started', icon: '🚀' },
  { id: 'modes', title: '2. Demo Simulator vs Real Broker Mode', category: 'Getting Started', icon: '🎮', badge: 'Essential' },
  { id: 'scanner', title: '3. Robotic Market Scanner & Radar', category: 'Core Features', icon: '📡' },
  { id: 'strategies', title: '4. Quantitative Strategies & Rules Engine', category: 'Core Features', icon: '⚡' },
  { id: 'chart', title: '5. Live Charting, Indicators & Drawings', category: 'Trading Tools', icon: '📈' },
  { id: 'orderdock', title: '6. 1-Click Quick Order Dock', category: 'Trading Tools', icon: '⚡' },
  { id: 'risk', title: '7. Capital Protection & Kill Switch', category: 'Risk & Safety', icon: '🛡️', badge: 'Safety' },
  { id: 'ai', title: '8. AI Market Copilot & BYOK Setup', category: 'AI Intelligence', icon: '🤖', badge: 'AI' },
  { id: 'settings', title: '9. Customizing Settings & Connections', category: 'Configuration', icon: '⚙️' },
  { id: 'faq', title: '10. FAQ & Troubleshooting Guide', category: 'Support', icon: '💡' },
];

export const DocumentationPage: React.FC<DocumentationPageProps> = ({
  onNavigateTo,
  onOpenSettings,
  onOpenCopilot,
  activeProvider = 'KeylessPublic',
}) => {
  const [activeSectionId, setActiveSectionId] = useState<string>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return SECTIONS;
    const query = searchQuery.toLowerCase();
    return SECTIONS.filter(
      (s) =>
        s.title.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query) ||
        s.id.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const scrollToSection = (id: string) => {
    setActiveSectionId(id);
    const element = document.getElementById(`doc-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col md:flex-row overflow-hidden bg-[#070b14] text-slate-200">
      {/* ==================== LEFT STICKY OUTLINE (TOC) ==================== */}
      <aside className="w-full md:w-72 lg:w-80 bg-slate-950/90 border-r border-slate-800 flex flex-col flex-shrink-0 h-auto md:h-full">
        {/* Outline Header & Search */}
        <div className="p-4 border-b border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <BookOpen className="w-4 h-4" />
              </div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100 font-mono">
                Platform Manual
              </h2>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-1.5 py-0.5 rounded">
              v2.4
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guide & topics..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
            />
          </div>
        </div>

        {/* Outline Navigation List */}
        <nav className="flex-1 overflow-y-auto p-2.5 space-y-1">
          {filteredSections.map((sec) => {
            const isActive = activeSectionId === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between border cursor-pointer ${
                  isActive
                    ? 'bg-cyan-950/70 border-cyan-500/60 text-cyan-200 font-semibold shadow-sm'
                    : 'bg-transparent border-transparent hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm leading-none">{sec.icon}</span>
                  <span className="truncate">{sec.title}</span>
                </div>
                {sec.badge && (
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex-shrink-0">
                    {sec.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Outline Bottom Quick Actions */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950 space-y-1.5">
          <div className="text-[10px] text-slate-400 font-mono uppercase px-1">Quick Shortcuts</div>
          <div className="grid grid-cols-2 gap-1.5">
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-sans text-slate-300 hover:text-white flex items-center justify-center gap-1 transition-colors"
              >
                <Settings className="w-3 h-3 text-cyan-400" />
                <span>Settings</span>
              </button>
            )}
            {onOpenCopilot && (
              <button
                onClick={onOpenCopilot}
                className="py-1.5 px-2 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-800/60 text-[11px] font-sans text-indigo-300 hover:text-white flex items-center justify-center gap-1 transition-colors"
              >
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>AI Copilot</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ==================== MAIN DOCUMENTATION BODY ==================== */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 space-y-12 max-w-5xl mx-auto font-sans leading-relaxed">
        {/* Hero Header */}
        <div className="border-b border-slate-800/80 pb-6 space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono">
            <span>⚡ Smart Trading Workstation & AI Copilot</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Trading Platform User Guide
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-normal">
            Welcome to <strong>Trading Platform</strong>. This guide explains how to navigate your trading terminal, practice risk-free with virtual capital, use automated trading strategies, and get AI-assisted market insights in plain English.
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Default Account: <strong>$100,000.00 Demo Money</strong>
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Capital Safety: <strong>Max Drawdown & Kill Switch Active</strong>
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> AI Engine: <strong>Free Built-in + OpenAI & Claude</strong>
            </span>
          </div>
        </div>

        {/* -------------------- SECTION 1 -------------------- */}
        <section id="doc-overview" className="space-y-4 scroll-mt-6">
          <div className="flex items-center gap-2.5 text-lg font-bold text-slate-100">
            <span className="text-xl">🚀</span>
            <h2>1. Platform Overview & Quick Start</h2>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">
            <strong>Trading Platform</strong> is your all-in-one smart trading command center. Whether you are an active day trader looking for fast 1-click execution or you prefer hands-off automated strategies, everything is designed to be clear, responsive, and easy to use:
          </p>

          {/* 3 Step Quick Start Guide */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs font-mono uppercase">
                <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-[10px] font-bold">1</span>
                <span>Watch Live Markets</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Click <strong>Live Chart</strong> or <strong>Market Scanner</strong> on the side menu to watch live price action across Forex, Crypto, and major pairs with zero setup needed.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs font-mono uppercase">
                <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-[10px] font-bold">2</span>
                <span>Practice Risk-Free</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Start in <strong>Demo Simulator Mode</strong> with <strong>$100,000.00</strong> in virtual paper money. Test 1-click Buy and Sell orders and explore trading strategies with zero risk.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs font-mono uppercase">
                <span className="w-5 h-5 rounded-full bg-purple-950 border border-purple-500/40 flex items-center justify-center text-[10px] font-bold">3</span>
                <span>Use AI & Automation</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Open the <strong>AI Copilot</strong> (Sparkles icon) to ask questions in plain English, diagnose chart patterns, or let automated trading bots alert you when setups trigger.
              </p>
            </div>
          </div>

          {/* Key Capabilities for the User */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex-shrink-0 mt-0.5">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-xs text-slate-200 block">Live Charts & Drawing Tools</span>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Fast candlestick charts with 10+ popular indicators (EMA, RSI, MACD, Bollinger Bands, Ichimoku Cloud) and tools to draw support, resistance, and Fibonacci levels.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex-shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-xs text-slate-200 block">Automatic Capital Protection</span>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Automatic Daily Drawdown protection stops emotional over-trading, and an instant Emergency Kill Switch lets you close all positions with a single click.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------- SECTION 2 -------------------- */}
        <section id="doc-modes" className="space-y-4 scroll-mt-6">
          <div className="flex items-center gap-2.5 text-lg font-bold text-slate-100">
            <span className="text-xl">🎮</span>
            <h2>2. Demo Simulator vs Real Broker Mode</h2>
          </div>
          <p className="text-slate-300 text-sm">
            You never have to risk real money while exploring or designing strategies. The platform supports seamless switching between simulated paper accounts and live broker accounts:
          </p>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs font-mono uppercase">
                <CheckCircle2 className="w-4 h-4" />
                <span>Default Experience: Zero-Risk Keyless Demo</span>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
                Virtual $100,000.00 Capital
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              When launching the app for the first time or operating without broker keys, you are automatically placed in <strong>Demo Simulator Mode</strong>. Every buy or sell order executes against real live market quotes with realistic slippage and spread, updating your simulated equity and balance without touching a real broker.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Mode</th>
                  <th className="py-2.5 px-3">Capital</th>
                  <th className="py-2.5 px-3">Market Feeds</th>
                  <th className="py-2.5 px-3">Required Credentials</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-blue-400">Demo Simulator</td>
                  <td className="py-2.5 px-3 font-mono text-emerald-400">$100,000 Paper Money</td>
                  <td className="py-2.5 px-3">Public Crypto & Forex streams</td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">None (100% Keyless)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-emerald-400">OANDA v20</td>
                  <td className="py-2.5 px-3 font-mono text-slate-200">Live or Practice Account</td>
                  <td className="py-2.5 px-3">Official OANDA Streaming API</td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">OANDA Token + Account ID</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-purple-400">MT5 ZeroMQ</td>
                  <td className="py-2.5 px-3 font-mono text-slate-200">Local MetaTrader 5 Terminal</td>
                  <td className="py-2.5 px-3">Direct MT5 Broker Bridge</td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">ZeroMQ Socket Port 5555/5556</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* -------------------- SECTION 3 -------------------- */}
        <section id="doc-scanner" className="space-y-4 scroll-mt-6">
          <div className="flex items-center gap-2.5 text-lg font-bold text-slate-100">
            <span className="text-xl">📡</span>
            <h2>3. Robotic Market Scanner & Radar Engine</h2>
          </div>
          <p className="text-slate-300 text-sm">
            The <strong>Market Scanner</strong> operates autonomously in the background. It continuously monitors major asset pairs (EUR/USD, GBP/USD, USD/JPY, BTC/USD, ETH/USD, Gold) across multiple timeframes (M1, M5, M15, H1, D1) for quantitative opportunities:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="text-indigo-400 font-mono text-xs font-semibold">1. Multi-Timeframe Matrix</div>
              <p className="text-[11px] text-slate-400">
                Instant visual matrix of bullish/bearish alignment across M1 through Daily candles.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="text-cyan-400 font-mono text-xs font-semibold">2. Live Signal Radar</div>
              <p className="text-[11px] text-slate-400">
                Audits near-miss events and explains exactly why a signal passed or failed entry gates.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="text-amber-400 font-mono text-xs font-semibold">3. Audio & Web Alerts</div>
              <p className="text-[11px] text-slate-400">
                Triggers desktop notifications and chime alerts whenever high-probability setups trigger.
              </p>
            </div>
          </div>
        </section>

        {/* -------------------- SECTION 4 -------------------- */}
        <section id="doc-strategies" className="space-y-4 scroll-mt-6">
          <div className="flex items-center gap-2.5 text-lg font-bold text-slate-100">
            <span className="text-xl">⚡</span>
            <h2>4. Quantitative Strategies & Rules Engine</h2>
          </div>
          <p className="text-slate-300 text-sm">
            Under the hood, the backend evaluates trading rules with deterministic mathematical criteria:
          </p>

          <div className="space-y-2.5">
            {[
              {
                name: 'EMA 9/21 Trend Crossover',
                badge: 'Momentum',
                desc: 'Captures dynamic trend shifts when the fast 9-period EMA crosses above or below the slow 21-period EMA with ATR volatility filters.',
              },
              {
                name: 'RSI Mean Reversion (Period 14)',
                badge: 'Oscillator',
                desc: 'Identifies overextended price movements below 30 (oversold long trigger) or above 70 (overbought short trigger) expecting regression to the mean.',
              },
              {
                name: 'Ichimoku Kumo Cloud Breakout',
                badge: 'Multi-Timeframe',
                desc: 'Requires Tenkan-sen / Kijun-sen bullish cross strictly above the Senkou Span A/B Cloud boundary to prevent false chop entries.',
              },
              {
                name: 'Supertrend & ATR Volatility Trailing',
                badge: 'Trend Follower',
                desc: 'Dynamically shifts trailing stop boundaries based on Average True Range multipliers, letting profitable runners stay open.',
              },
            ].map((strat, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-start gap-3">
                <span className="text-cyan-400 font-mono font-bold text-xs mt-0.5">#{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-200">{strat.name}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {strat.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{strat.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-300 flex items-center justify-between">
            <span>Want to generate custom rules without writing code?</span>
            {onNavigateTo && (
              <button
                onClick={() => onNavigateTo('strategies')}
                className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Open Strategy Studio →
              </button>
            )}
          </div>
        </section>

        {/* -------------------- SECTION 5 -------------------- */}
        <section id="doc-chart" className="space-y-4 scroll-mt-6">
          <div className="flex items-center gap-2.5 text-lg font-bold text-slate-100">
            <span className="text-xl">📈</span>
            <h2>5. Live Charting, Indicators & Drawings</h2>
          </div>
          <p className="text-slate-300 text-sm">
            The chart engine is powered by high-performance canvas rendering. It supports institutional-grade interactive features:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>10+ Technical Indicators</span>
              </div>
              <ul className="text-slate-400 space-y-1 text-[11px] list-disc list-inside">
                <li>SMA, EMA (Fast/Slow/Trend)</li>
                <li>RSI, MACD, Stochastic</li>
                <li>Bollinger Bands & ATR volatility bands</li>
                <li>Ichimoku Kinko Hyo & Supertrend</li>
                <li>Volume Weighted Average Price (VWAP)</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-indigo-400" />
                <span>Interactive Drawing Suite</span>
              </div>
              <ul className="text-slate-400 space-y-1 text-[11px] list-disc list-inside">
                <li>Trendlines with angle snaps</li>
                <li>Horizontal Support & Resistance Rays</li>
                <li>Fibonacci Retracement (23.6%, 38.2%, 50%, 61.8%)</li>
                <li>Parallel channels & measured price targets</li>
                <li>Snapshot tool to export instant PNG screenshots</li>
              </ul>
            </div>
          </div>
        </section>

        {/* -------------------- SECTION 6 -------------------- */}
        <section id="doc-orderdock" className="space-y-4 scroll-mt-6">
          <div className="flex items-center gap-2.5 text-lg font-bold text-slate-100">
            <span className="text-xl">⚡</span>
            <h2>6. 1-Click Quick Order Dock</h2>
          </div>
          <p className="text-slate-300 text-sm">
            Placed directly on the live chart for instant trade execution without navigating away:
          </p>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Features of the Quick Order Dock</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
              <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-emerald-400 font-bold">BUY</span>
                <span className="text-slate-400 text-[11px]">Instant 1-click execution at live ask price</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-red-400 font-bold">SELL</span>
                <span className="text-slate-400 text-[11px]">Instant 1-click execution at live bid price</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-cyan-400 font-bold">SL / TP</span>
                <span className="text-slate-400 text-[11px]">Bracket orders automatically placed on execution</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-purple-400 font-bold">LOTS</span>
                <span className="text-slate-400 text-[11px]">Position sizing from micro lots (0.01) to standard</span>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------- SECTION 7 -------------------- */}
        <section id="doc-risk" className="space-y-4 scroll-mt-6">
          <div className="flex items-center gap-2.5 text-lg font-bold text-slate-100">
            <span className="text-xl">🛡️</span>
            <h2>7. Capital Protection & Emergency Kill Switch</h2>
          </div>
          <p className="text-slate-300 text-sm">
            Professional trading demands strict risk control. Trading Platform enforces hard boundaries to ensure capital is never wiped out:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs font-mono uppercase">
                <ShieldCheck className="w-4 h-4" />
                <span>Max Daily Drawdown Guard (5.0%)</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                If cumulative daily loss approaches or reaches the configured risk ceiling, the risk manager engages circuit breakers, preventing bots from opening further risk.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-red-950/30 border border-red-800/40 space-y-2">
              <div className="flex items-center gap-2 text-red-400 font-semibold text-xs font-mono uppercase">
                <Flame className="w-4 h-4" />
                <span>Emergency Kill Switch</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Accessible via the prominent red button in the top navigation bar. Clicking engages an instant execution halt and provides a 1-click panic button to liquidate all open positions across all pairs.
              </p>
            </div>
          </div>
        </section>

        {/* -------------------- SECTION 8 -------------------- */}
        <section id="doc-ai" className="space-y-4 scroll-mt-6">
          <div className="flex items-center gap-2.5 text-lg font-bold text-slate-100">
            <span className="text-xl">🤖</span>
            <h2>8. AI Market Copilot & Bring Your Own Key (BYOK)</h2>
          </div>
          <p className="text-slate-300 text-sm">
            The platform features an intelligent AI Market Copilot drawer. You can switch between providers in real time:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {[
              {
                name: '🧠 Built-in Engine',
                badge: '100% Free',
                desc: 'Local mathematical quant intelligence. Zero API keys, zero token fees, zero network latency.',
              },
              {
                name: '🟢 OpenAI',
                badge: 'BYOK (GPT-4o)',
                desc: 'State-of-the-art market structure reasoning using your personal OpenAI API key.',
              },
              {
                name: '🟣 Claude',
                badge: 'BYOK (Sonnet 3.5)',
                desc: 'Nuanced strategy code diagnosis and risk explanations via Anthropic API.',
              },
              {
                name: '🔵 Gemini',
                badge: 'BYOK (1.5 Pro)',
                desc: 'Google ultra-fast multimodal model with massive multi-candle context.',
              },
              {
                name: '🦙 Ollama',
                badge: 'Self-Hosted',
                desc: 'Run Llama 3.2, Mistral or DeepSeek locally on your machine with 100% offline privacy.',
              },
            ].map((p, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-200">{p.name}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                    {p.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40 space-y-2">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs font-mono uppercase">
              <Key className="w-4 h-4 text-indigo-400" />
              <span>How Bring Your Own Key (BYOK) Works</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              When you configure OpenAI, Claude, or Gemini, your API key is saved strictly in your browser's private local storage (<code className="text-cyan-300 font-mono">localStorage.getItem('tp_ai_config')</code>). Requests use your own provider account quota. The server never bills you for AI tokens and never stores your private keys.
            </p>
          </div>
        </section>

        {/* -------------------- SECTION 9 -------------------- */}
        <section id="doc-settings" className="space-y-4 scroll-mt-6">
          <div className="flex items-center gap-2.5 text-lg font-bold text-slate-100">
            <span className="text-xl">⚙️</span>
            <h2>9. Customizing Settings & Connections</h2>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">
            Customizing the platform to your personal preferences is simple and takes just a few clicks. Open your settings anytime via <strong>Feed & Keys Settings</strong> (⚙️ at the bottom-left of the side menu or in the top navigation bar):
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs font-mono uppercase">
                <Sliders className="w-4 h-4" />
                <span>1. Broker & Market Feed Selection</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Easily toggle between <strong>Demo Simulator Mode</strong> (100% free paper trading) and live broker connections like <strong>OANDA v20</strong> or <strong>MetaTrader 5 (MT5)</strong> when you're ready to trade with real broker capital.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs font-mono uppercase">
                <Radio className="w-4 h-4" />
                <span>2. Audio & Desktop Notifications</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Turn sound chimes on or off, configure desktop notifications, and choose how frequently the background scanner checks for new trading opportunities (e.g. every 30 seconds or 1 minute).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs font-mono uppercase">
                <Key className="w-4 h-4" />
                <span>3. 100% Private Client Storage</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Any API keys or tokens you enter (such as OpenAI or OANDA keys) stay strictly inside your browser's private local storage. They are never uploaded to external servers, ensuring complete privacy.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs font-mono uppercase">
                <RefreshCw className="w-4 h-4" />
                <span>4. One-Click Reset & Restore</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Want to restore all settings to default or switch back to the clean Demo simulator experience? You can do so with a single click inside the Settings modal at any time.
              </p>
            </div>
          </div>

          {onOpenSettings && (
            <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-300 flex items-center justify-between flex-wrap gap-2">
              <span>Ready to check or update your settings?</span>
              <button
                onClick={onOpenSettings}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Open Settings Window →</span>
              </button>
            </div>
          )}
        </section>

        {/* -------------------- SECTION 10 -------------------- */}
        <section id="doc-faq" className="space-y-4 scroll-mt-6">
          <div className="flex items-center gap-2.5 text-lg font-bold text-slate-100">
            <span className="text-xl">💡</span>
            <h2>10. FAQ & Troubleshooting Guide</h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'Why does my balance show $100,000.00?',
                a: 'You are currently in Demo Simulator Mode. This allows you to place trades, test algorithms, and practice risk management without any financial risk. To connect your live broker, click "Settings" and choose OANDA v20 or MT5.',
              },
              {
                q: 'How do I switch the AI model to Claude or GPT-4o?',
                a: 'Open the AI Copilot by clicking the Sparkles icon in the header. Click the prominent "Switch AI Provider" button at the top of the drawer, select your provider (e.g. OpenAI or Claude), enter your API key, and click Save Settings.',
              },
              {
                q: 'Where are my API keys saved?',
                a: 'AI keys and broker tokens are stored in your browser local storage. They are never sent to third parties or logged by our servers.',
              },
              {
                q: 'How does the Kill Switch work?',
                a: 'Clicking the red HALTED / KILL SWITCH button in the header immediately suspends all algorithmic signal evaluations and gives you a one-click button to close all active open positions.',
              },
            ].map((faq, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="font-semibold text-xs text-slate-200 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                  <span>{faq.q}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pl-5">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Back to top footer */}
        <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>Trading Platform Documentation • Updated October 2026</span>
          <button
            onClick={() => scrollToSection('overview')}
            className="hover:text-cyan-400 transition-colors cursor-pointer"
          >
            ↑ Back to Top
          </button>
        </div>
      </main>
    </div>
  );
};
