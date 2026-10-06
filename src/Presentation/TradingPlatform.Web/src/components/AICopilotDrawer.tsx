import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  RefreshCw,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Activity,
  Copy,
  Check,
  Zap,
  ArrowRight,
  ShieldCheck,
  Search,
  Sliders,
  Key,
  Cpu,
  Globe,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  AICopilotContext,
  AIProviderConfig,
  AuditExplanationResult,
  MarketAnalysisResult,
  SignalAuditLog,
  Timeframe,
} from '../types/trading';
import { tradingApi } from '../api/tradingClient';
import { useTimezone } from '../context/TimezoneContext';

interface ProviderInfo {
  name: string;
  shortName: string;
  icon: string;
  badge: string;
  modelPlaceholder: string;
  desc: string;
}

export const PROVIDER_METADATA: Record<string, ProviderInfo> = {
  BuiltIn: {
    name: 'Built-in Quant Engine',
    shortName: 'Built-in',
    icon: '🧠',
    badge: 'Free & Local',
    modelPlaceholder: 'Built-in Quant Engine',
    desc: 'Local high-speed algorithmic quant intelligence • 100% Free • Zero API key needed',
  },
  OpenAI: {
    name: 'OpenAI (GPT-4o)',
    shortName: 'OpenAI',
    icon: '🟢',
    badge: 'BYOK Active',
    modelPlaceholder: 'gpt-4o or gpt-4o-mini',
    desc: 'Reasoning & market insights via OpenAI API with your personal API key',
  },
  Claude: {
    name: 'Claude (Sonnet 3.5)',
    shortName: 'Claude',
    icon: '🟣',
    badge: 'BYOK Active',
    modelPlaceholder: 'claude-3-5-sonnet-20241022',
    desc: 'Deep strategy code analysis via Anthropic API with your personal API key',
  },
  Gemini: {
    name: 'Gemini (1.5 Pro)',
    shortName: 'Gemini',
    icon: '🔵',
    badge: 'BYOK Active',
    modelPlaceholder: 'gemini-1.5-pro',
    desc: 'High-speed multimodal and deep market context via Google AI API',
  },
  Ollama: {
    name: 'Ollama (Local LLM)',
    shortName: 'Ollama',
    icon: '🦙',
    badge: 'Self-Hosted',
    modelPlaceholder: 'llama3.2 or mistral',
    desc: 'Privacy-focused self-hosted local model on your own local server',
  },
};

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentSymbol: string;
  currentTimeframe: Timeframe;
  openPositionsCount?: number;
  activeStrategiesCount?: number;
  currentDrawdown?: number;
  isKillSwitchEngaged?: boolean;
  auditLogs?: SignalAuditLog[];
  onOpenStrategyGenerator?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  provider?: string;
  model?: string;
  suggestedFollowups?: string[];
}

const DEFAULT_PROMPTS = [
  'Analyze current trend and momentum',
  'What key support and resistance levels should I watch?',
  'How can I optimize my risk management right now?',
  'Explain Ichimoku Cloud entry criteria',
];

export const AICopilotDrawer: React.FC<AICopilotDrawerProps> = ({
  isOpen,
  onClose,
  currentSymbol,
  currentTimeframe,
  openPositionsCount = 0,
  activeStrategiesCount = 0,
  currentDrawdown = 0,
  isKillSwitchEngaged = false,
  auditLogs = [],
  onOpenStrategyGenerator,
}) => {
  const { formatTime } = useTimezone();
  const [activeTab, setActiveTab] = useState<'chat' | 'market' | 'audit'>('chat');

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I am your **AI Trading Copilot**. I analyze live market structure for **${currentSymbol} (${currentTimeframe})**, evaluate quantitative strategy performance, and diagnose trade executions in plain English.\n\n⚡ **Active Engine:** Built-in Quant Engine (Free & Offline)\n💡 Want to use **OpenAI (GPT-4o)**, **Claude (Sonnet 3.5)**, **Gemini**, or **Ollama**? Click **"Switch AI Provider"** above to insert your own private API key!`,
      timestamp: formatTime(new Date(), { withSeconds: false }),
      provider: 'BuiltIn',
      model: 'Built-in Quant Engine',
      suggestedFollowups: [
        `Analyze ${currentSymbol} structure`,
        'Assess current drawdown risk',
        'How to build an RSI mean reversion strategy?',
      ],
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Market Intelligence State
  const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysisResult | null>(null);
  const [isMarketLoading, setIsMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState<string | null>(null);

  // Audit Explainer State
  const [selectedAuditLog, setSelectedAuditLog] = useState<SignalAuditLog | null>(null);
  const [auditExplanation, setAuditExplanation] = useState<AuditExplanationResult | null>(null);
  const [isAuditLoading, setIsAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  // AI Provider Configuration State
  const [showConfig, setShowConfig] = useState(false);
  const [aiConfig, setAiConfig] = useState<AIProviderConfig>({
    provider: 'BuiltIn',
    model: 'Built-in Quant Engine',
    hasApiKey: false,
  });
  const [selectedProvider, setSelectedProvider] = useState('BuiltIn');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [modelInput, setModelInput] = useState('');
  const [endpointInput, setEndpointInput] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configFeedback, setConfigFeedback] = useState<string | null>(null);

  // Load AI configuration on drawer open
  useEffect(() => {
    if (isOpen) {
      tradingApi
        .getAiConfig()
        .then((cfg) => {
          if (cfg) {
            setAiConfig(cfg);
            setSelectedProvider(cfg.provider || 'BuiltIn');
            setModelInput(cfg.model || '');
            setEndpointInput(cfg.endpoint || '');
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const handleProviderSelect = (prov: string) => {
    setSelectedProvider(prov);
    if (prov === 'OpenAI') setModelInput('gpt-4o');
    else if (prov === 'Claude') setModelInput('claude-3-5-sonnet-20241022');
    else if (prov === 'Gemini') setModelInput('gemini-1.5-pro');
    else if (prov === 'Ollama') setModelInput('llama3.2');
    else setModelInput('');
  };

  const handleSaveAiConfig = async () => {
    setIsSavingConfig(true);
    setConfigFeedback(null);
    try {
      const keyToSave = apiKeyInput.trim()
        ? apiKeyInput.trim()
        : (selectedProvider === aiConfig.provider ? aiConfig.apiKey : null);

      const updated = await tradingApi.updateAiConfig({
        provider: selectedProvider,
        model: modelInput || null,
        apiKey: keyToSave,
        endpoint: endpointInput || null,
      });
      setAiConfig(updated);
      setApiKeyInput('');
      setConfigFeedback('✓ Saved in browser & active!');
      setTimeout(() => {
        setConfigFeedback(null);
        setShowConfig(false);
      }, 1400);
    } catch (err: any) {
      setConfigFeedback(`Failed: ${err?.message || 'Error saving'}`);
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Scroll chat to bottom
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Load initial market analysis when opening Market tab
  useEffect(() => {
    if (isOpen && activeTab === 'market' && !marketAnalysis && !isMarketLoading) {
      loadMarketAnalysis();
    }
  }, [isOpen, activeTab, currentSymbol, currentTimeframe]);

  // Set default audit log when opening Audit tab
  useEffect(() => {
    if (isOpen && activeTab === 'audit' && auditLogs.length > 0 && !selectedAuditLog) {
      setSelectedAuditLog(auditLogs[0]);
    }
  }, [isOpen, activeTab, auditLogs]);

  // Automatically trigger audit explanation when selectedAuditLog changes
  useEffect(() => {
    if (selectedAuditLog) {
      explainLog(selectedAuditLog);
    }
  }, [selectedAuditLog]);

  if (!isOpen) return null;

  const copilotContext: AICopilotContext = {
    currentSymbol,
    currentTimeframe,
    openPositionsCount,
    activeStrategiesCount,
    currentDrawdown,
    isKillSwitchEngaged,
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || chatInput).trim();
    if (!text || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: formatTime(new Date(), { withSeconds: false }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const res = await tradingApi.copilotChat(text, copilotContext);
      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: res.responseMarkdown,
        timestamp: formatTime(new Date(), { withSeconds: false }),
        provider: aiConfig.provider,
        model: aiConfig.model || undefined,
        suggestedFollowups: res.suggestedFollowups,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `e-${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ **Error communicating with ${PROVIDER_METADATA[aiConfig.provider]?.name || aiConfig.provider}:** ${err?.message || 'Unable to connect to service. Please check your network or API key.'}`,
        timestamp: formatTime(new Date(), { withSeconds: false }),
        provider: aiConfig.provider,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const loadMarketAnalysis = async () => {
    setIsMarketLoading(true);
    setMarketError(null);
    try {
      const res = await tradingApi.analyzeMarketAi(currentSymbol, currentTimeframe);
      setMarketAnalysis(res);
    } catch (err: any) {
      setMarketError(err?.message || 'Failed to fetch live market analysis.');
    } finally {
      setIsMarketLoading(false);
    }
  };

  const explainLog = async (log: SignalAuditLog) => {
    setIsAuditLoading(true);
    setAuditError(null);
    try {
      // Use signalFingerprint or synthesize from log
      const res = await tradingApi.explainAuditAi(log.signalFingerprint || `${log.strategyId}-${log.symbol}-${Date.now()}`);
      setAuditExplanation(res);
    } catch (err: any) {
      setAuditError(err?.message || 'Could not explain this signal event.');
    } finally {
      setIsAuditLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] md:w-[540px] bg-slate-950/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl flex flex-col transition-all duration-300 animate-in slide-in-from-right">
      {/* Top Header */}
      <div className="p-3.5 sm:p-4 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between flex-shrink-0 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/40 flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-slate-100 font-sans tracking-wide">AI Market Copilot</h2>
              
              {/* Interactive Provider Switcher Pill in Header */}
              <button
                type="button"
                onClick={() => setShowConfig(!showConfig)}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-medium bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 transition-all cursor-pointer group shadow-sm"
                title="Click to Switch AI Engine (Built-in, OpenAI, Claude, Gemini, Ollama)"
              >
                <span>{PROVIDER_METADATA[aiConfig.provider]?.icon || '🧠'}</span>
                <span className="font-semibold">{PROVIDER_METADATA[aiConfig.provider]?.shortName || aiConfig.provider}</span>
                <span className="text-[9.5px] text-cyan-400 font-mono flex items-center gap-0.5 bg-cyan-900/60 group-hover:bg-cyan-800/90 px-1 py-0.2 rounded border border-cyan-500/30">
                  {showConfig ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                  <span>{showConfig ? 'Close' : 'Switch'}</span>
                </span>
              </button>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-mono truncate">
              <span className="text-slate-200 font-semibold">{currentSymbol}</span>
              <span>•</span>
              <span className="text-cyan-300">{currentTimeframe}</span>
              <span>•</span>
              <span className={currentDrawdown > 3 ? 'text-amber-400' : 'text-emerald-400'}>
                DD: {currentDrawdown.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Prominent, Labeled "Switch AI Provider" Action Button */}
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-sm ${
              showConfig
                ? 'bg-cyan-950/90 border-cyan-500/70 text-cyan-200 ring-1 ring-cyan-500/50'
                : 'bg-slate-800/90 hover:bg-slate-700 border-slate-700/80 text-slate-200 hover:text-white'
            }`}
            title="Switch AI Provider or update your API keys"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">{showConfig ? 'Close Provider' : 'Switch AI Provider'}</span>
            <span className="sm:hidden">{showConfig ? 'Close' : 'Switch'}</span>
            {showConfig ? (
              <ChevronUp className="w-3 h-3 text-cyan-300" />
            ) : (
              <ChevronDown className="w-3 h-3 text-slate-400" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Close Copilot"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Provider Configuration Panel */}
      {showConfig && (
        <div className="p-4 bg-slate-900 border-b border-slate-800 space-y-3.5 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-200">Switch AI Engine Provider</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Active: <strong className="text-cyan-300">{PROVIDER_METADATA[aiConfig.provider]?.shortName || aiConfig.provider}</strong>
            </span>
          </div>

          {/* Provider Selection Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 font-sans">
            {[
              { id: 'BuiltIn', label: '🧠 Built-in', sub: 'Free & Local' },
              { id: 'OpenAI', label: '🟢 OpenAI', sub: 'GPT-4o' },
              { id: 'Claude', label: '🟣 Claude', sub: 'Sonnet 3.5' },
              { id: 'Gemini', label: '🔵 Gemini', sub: '1.5 Pro' },
              { id: 'Ollama', label: '🦙 Ollama', sub: 'Local LLM' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleProviderSelect(p.id)}
                className={`py-2 px-1.5 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                  selectedProvider === p.id
                    ? 'bg-cyan-950/90 border-cyan-500 text-cyan-200 shadow-md ring-1 ring-cyan-500/50'
                    : 'bg-slate-950/80 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="font-semibold text-[11.5px]">{p.label}</span>
                <span className="text-[9.5px] text-slate-400 font-mono">{p.sub}</span>
              </button>
            ))}
          </div>

          {selectedProvider === 'BuiltIn' ? (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
              <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Built-in Quant Engine (100% Free & Offline)</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[10.5px]">
                Deterministic mathematical reasoning running locally on your workstation. Computes real-time RSI, MACD, Ichimoku cloud, ATR volatility, and risk metrics with zero API keys and zero cost.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-800/50 text-[11px] text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5 text-indigo-300 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Bring Your Own Key (BYOK) — Zero Server Billing</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[10.5px]">
                  Your API key is stored safely in your browser's private local storage. Requests use your own provider account quota so you maintain full control of your AI budget.
                </p>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1">
                  Model Identifier:
                </label>
                <input
                  type="text"
                  value={modelInput}
                  onChange={(e) => setModelInput(e.target.value)}
                  placeholder={
                    selectedProvider === 'OpenAI'
                      ? 'gpt-4o or gpt-4o-mini'
                      : selectedProvider === 'Claude'
                      ? 'claude-3-5-sonnet-20241022'
                      : selectedProvider === 'Gemini'
                      ? 'gemini-1.5-pro'
                      : 'llama3.2'
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              {selectedProvider !== 'Ollama' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-400 font-mono uppercase">API Key (Stored in Browser):</label>
                    {aiConfig.hasApiKey && (
                      <span className="text-[10px] text-emerald-400 font-mono">
                        Saved: {aiConfig.maskedApiKey}
                      </span>
                    )}
                  </div>
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder={aiConfig.hasApiKey ? 'Enter new key to replace' : 'sk-...'}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1">
                  Custom Endpoint URL (Optional):
                </label>
                <input
                  type="text"
                  value={endpointInput}
                  onChange={(e) => setEndpointInput(e.target.value)}
                  placeholder={
                    selectedProvider === 'Ollama'
                      ? 'http://localhost:11434'
                      : 'Leave blank for official API endpoint'
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            {configFeedback && (
              <span className="text-xs text-cyan-400 font-mono">{configFeedback}</span>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => setShowConfig(false)}
                className="px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAiConfig}
                disabled={isSavingConfig}
                className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSavingConfig
                  ? 'Saving...'
                  : selectedProvider === 'BuiltIn'
                  ? 'Activate Free Built-in Engine'
                  : `Save & Activate ${selectedProvider}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800/80 bg-slate-900/30 px-3 flex-shrink-0">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2.5 text-xs font-semibold font-sans flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeTab === 'chat'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Copilot Chat</span>
        </button>
        <button
          onClick={() => setActiveTab('market')}
          className={`flex-1 py-2.5 text-xs font-semibold font-sans flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeTab === 'market'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Market Intelligence</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex-1 py-2.5 text-xs font-semibold font-sans flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeTab === 'audit'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span>Audit Explainer</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ==================== TAB 1: COPILOT CHAT ==================== */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full space-y-3">
            {/* Active AI Provider Status & Quick Switch Affordance */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800/90 rounded-xl p-3 flex items-center justify-between gap-3 shadow-md font-sans flex-shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-base flex-shrink-0 shadow-inner">
                  {PROVIDER_METADATA[aiConfig.provider]?.icon || '🧠'}
                </div>
                <div className="min-w-0">
                  <div className="text-[11.5px] font-bold text-slate-100 flex items-center gap-1.5 flex-wrap">
                    <span>Active Engine:</span>
                    <span className="text-cyan-300 font-semibold">
                      {PROVIDER_METADATA[aiConfig.provider]?.name || aiConfig.provider}
                    </span>
                    {aiConfig.hasApiKey ? (
                      <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/30 font-mono">
                        BYOK Active
                      </span>
                    ) : aiConfig.provider === 'BuiltIn' ? (
                      <span className="text-[9px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/30 font-mono">
                        Free & Offline
                      </span>
                    ) : (
                      <span className="text-[9px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/30 font-mono">
                        Key Required
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {PROVIDER_METADATA[aiConfig.provider]?.desc || 'Local quant algorithmic intelligence'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowConfig(!showConfig)}
                className="px-2.5 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/35 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer flex-shrink-0 shadow-sm"
                title="Switch AI Provider (Built-in, OpenAI, Claude, Gemini, Ollama)"
              >
                <span>{showConfig ? 'Close Settings ▲' : 'Switch Engine ▼'}</span>
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-900/20'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                    }`}
                  >
                    {/* Assistant engine identification header */}
                    {m.sender === 'assistant' && (
                      <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-slate-800/80 text-[10px] text-cyan-400 font-medium">
                        <span>{PROVIDER_METADATA[m.provider || aiConfig.provider]?.icon || '🧠'}</span>
                        <span className="font-semibold text-slate-200">
                          {PROVIDER_METADATA[m.provider || aiConfig.provider]?.shortName || 'AI Engine'}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400 font-mono text-[9.5px]">
                          {(m.provider || aiConfig.provider) === 'BuiltIn'
                            ? 'Free Offline Engine'
                            : (m.model || aiConfig.model || 'BYOK Model')}
                        </span>
                      </div>
                    )}

                    {/* Render message with line breaks and basic formatting */}
                    <div className="space-y-2 whitespace-pre-wrap font-sans">
                      {m.text}
                    </div>

                    {/* Footer / Copy button */}
                    <div className="mt-2 pt-1 border-t border-slate-800/40 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>{m.timestamp}</span>
                      {m.sender === 'assistant' && (
                        <button
                          onClick={() => copyToClipboard(m.text, m.id)}
                          className="hover:text-slate-200 flex items-center gap-1 transition-colors"
                          title="Copy response"
                        >
                          {copiedId === m.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Follow-up suggestions */}
                  {m.suggestedFollowups && m.suggestedFollowups.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 max-w-[90%]">
                      {m.suggestedFollowups.map((pill, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(pill)}
                          disabled={isChatLoading}
                          className="text-[11px] font-sans px-2.5 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-all text-left flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                          <span>{pill}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isChatLoading && (
                <div className="flex items-center gap-2 text-xs text-cyan-400 bg-slate-900/60 border border-slate-800/60 p-3 rounded-xl w-fit">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>AI Copilot is analyzing quantitative indicators...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Pills */}
            <div className="flex-shrink-0 pt-2 border-t border-slate-800/60">
              <div className="text-[10px] text-slate-400 font-mono uppercase mb-1.5 flex items-center justify-between">
                <span>Quick Inquiries</span>
                {onOpenStrategyGenerator && (
                  <button
                    onClick={onOpenStrategyGenerator}
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[10px] font-sans font-semibold"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Open Strategy Architect</span>
                  </button>
                )}
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {DEFAULT_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(p)}
                    disabled={isChatLoading}
                    className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-sans transition-all"
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="mt-2 relative flex items-center"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Ask anything about ${currentSymbol}, indicators, or strategy rules...`}
                  disabled={isChatLoading}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 pr-11 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isChatLoading}
                  className="absolute right-1.5 p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-40 disabled:hover:bg-cyan-600 transition-colors shadow-sm"
                  title="Send message"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Provider Quick Switch Hint Strip */}
              <div className="mt-2 px-1 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-slate-400 truncate">
                  <span className="text-slate-500">Engine:</span>
                  <strong className="text-cyan-300 font-medium">
                    {PROVIDER_METADATA[aiConfig.provider]?.icon} {PROVIDER_METADATA[aiConfig.provider]?.shortName}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => setShowConfig(!showConfig)}
                  className="text-cyan-400 hover:text-cyan-200 underline underline-offset-2 font-medium cursor-pointer transition-colors flex items-center gap-1 flex-shrink-0"
                >
                  <span>Switch to OpenAI / Claude / Gemini / Ollama</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: MARKET INTELLIGENCE ==================== */}
        {activeTab === 'market' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-200">Live Quantitative Diagnosis</h3>
                <p className="text-[11px] text-slate-400">Algorithmic technical assessment on active candle stream</p>
              </div>
              <button
                onClick={loadMarketAnalysis}
                disabled={isMarketLoading}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-mono transition-all border border-slate-700"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isMarketLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Scan</span>
              </button>
            </div>

            {marketError && (
              <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{marketError}</span>
              </div>
            )}

            {isMarketLoading && !marketAnalysis && (
              <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                <span className="text-xs font-mono">Synthesizing market indicators for {currentSymbol}...</span>
              </div>
            )}

            {marketAnalysis && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Bias & Confidence Banner */}
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between ${
                    marketAnalysis.trendBias.toLowerCase().includes('bullish')
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                      : marketAnalysis.trendBias.toLowerCase().includes('bearish')
                      ? 'bg-red-950/30 border-red-500/40 text-red-300'
                      : 'bg-slate-900 border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        marketAnalysis.trendBias.toLowerCase().includes('bullish')
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : marketAnalysis.trendBias.toLowerCase().includes('bearish')
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {marketAnalysis.trendBias.toLowerCase().includes('bullish') ? (
                        <TrendingUp className="w-6 h-6" />
                      ) : marketAnalysis.trendBias.toLowerCase().includes('bearish') ? (
                        <TrendingDown className="w-6 h-6" />
                      ) : (
                        <Minus className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-wider opacity-80 block">
                        Directional Regime
                      </span>
                      <span className="text-base font-bold tracking-wide">{marketAnalysis.trendBias}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-mono tracking-wider opacity-80 block">
                      Confidence
                    </span>
                    <span className="text-lg font-bold font-mono">
                      {(marketAnalysis.confidenceScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Plain-English Overview */}
                <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">
                    Executive Summary
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    {marketAnalysis.summaryOverview}
                  </p>
                </div>

                {/* Key Technical Highlights */}
                <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">
                    Technical Confluence Factors
                  </span>
                  <div className="space-y-1.5">
                    {marketAnalysis.technicalHighlights.map((hl, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span>{hl}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Levels Grid */}
                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-emerald-900/40">
                    <span className="text-[10px] text-emerald-400 uppercase tracking-wider block">Support Level</span>
                    <span className="text-sm font-bold text-slate-100">{marketAnalysis.supportLevel}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-red-900/40">
                    <span className="text-[10px] text-red-400 uppercase tracking-wider block">Resistance Level</span>
                    <span className="text-sm font-bold text-slate-100">{marketAnalysis.resistanceLevel}</span>
                  </div>
                </div>

                {/* Actionable Suggestion */}
                <div className="p-3.5 bg-indigo-950/20 border border-indigo-500/30 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-semibold">
                    <Lightbulb className="w-4 h-4" />
                    <span>Actionable Recommendation</span>
                  </div>
                  <p className="text-xs text-slate-200 font-sans leading-relaxed">
                    {marketAnalysis.actionableSuggestion}
                  </p>
                </div>

                {/* Bottom CTA: Generate Strategy */}
                {onOpenStrategyGenerator && (
                  <button
                    onClick={onOpenStrategyGenerator}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-purple-950/30 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Synthesize Strategy From This Market State</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 3: AUDIT & NEAR-MISS EXPLAINER ==================== */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-200">Trade Audit & Near-Miss Diagnoser</h3>
              <p className="text-[11px] text-slate-400">
                Understand in plain English why a strategy triggered, failed, or narrowly missed
              </p>
            </div>

            {/* Selector if multiple audit logs exist */}
            {auditLogs.length > 0 ? (
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-mono uppercase">Select Audit Event:</label>
                <select
                  value={selectedAuditLog?.signalFingerprint || ''}
                  onChange={(e) => {
                    const match = auditLogs.find((l) => l.signalFingerprint === e.target.value);
                    if (match) setSelectedAuditLog(match);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                >
                  {auditLogs.map((log, i) => (
                    <option key={log.signalFingerprint || i} value={log.signalFingerprint}>
                      [{log.state}] {log.strategyId} - {log.symbol} ({formatTime(log.createdAtUtc, { withSeconds: false, withAbbr: true })})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl text-xs text-slate-400 text-center font-sans">
                No recent signal logs recorded yet. Run a live scanner or wait for candle evaluations to audit near-misses.
              </div>
            )}

            {isAuditLoading && (
              <div className="py-8 flex flex-col items-center justify-center space-y-2 text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
                <span className="text-xs font-mono">Diagnosing quantitative conditions...</span>
              </div>
            )}

            {auditError && (
              <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{auditError}</span>
              </div>
            )}

            {auditExplanation && !isAuditLoading && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Status Card */}
                <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono uppercase block">Strategy ID</span>
                    <span className="text-xs font-bold text-slate-100 font-mono">{auditExplanation.strategyId}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-mono uppercase block">Signal Outcome</span>
                    <span
                      className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                        auditExplanation.state.toLowerCase() === 'triggered'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {auditExplanation.state}
                    </span>
                  </div>
                </div>

                {/* Plain-English Verdict */}
                <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">
                    Plain-English Explanation
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    {auditExplanation.plainEnglishVerdict}
                  </p>
                </div>

                {/* Conditions Passed */}
                {auditExplanation.rulesPassed.length > 0 && (
                  <div className="p-3.5 bg-emerald-950/15 border border-emerald-900/40 rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Conditions Fully Satisfied ({auditExplanation.rulesPassed.length})</span>
                    </div>
                    <div className="space-y-1">
                      {auditExplanation.rulesPassed.map((rule, idx) => (
                        <div key={idx} className="text-xs text-slate-300 font-mono pl-4 border-l border-emerald-500/30">
                          {rule}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conditions Failed / Near-Misses */}
                {auditExplanation.rulesFailedOrNearMiss.length > 0 && (
                  <div className="p-3.5 bg-amber-950/15 border border-amber-900/40 rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Bottlenecks & Near-Misses ({auditExplanation.rulesFailedOrNearMiss.length})</span>
                    </div>
                    <div className="space-y-1">
                      {auditExplanation.rulesFailedOrNearMiss.map((rule, idx) => (
                        <div key={idx} className="text-xs text-slate-300 font-mono pl-4 border-l border-amber-500/30">
                          {rule}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Optimization Tip */}
                <div className="p-3.5 bg-cyan-950/20 border border-cyan-500/30 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-semibold">
                    <Lightbulb className="w-4 h-4" />
                    <span>Quantitative Fine-Tuning Advice</span>
                  </div>
                  <p className="text-xs text-slate-200 font-sans leading-relaxed">
                    {auditExplanation.optimizationTip}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/40 text-[10px] text-slate-500 flex items-center justify-between flex-shrink-0 font-sans">
        <span>Integrated Quantitative AI • Trading Platform</span>
        <span className="font-mono text-slate-400">{currentSymbol}</span>
      </div>
    </div>
  );
};
