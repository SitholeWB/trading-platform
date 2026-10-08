import React, { useState, useEffect } from 'react';
import { tradingApi } from '../api/tradingClient';
import { AIProviderConfig } from '../types/trading';
import { ShieldCheck, Cpu, Database, Globe, Clock, Check, Activity, Languages } from 'lucide-react';
import { useTimezone } from '../context/TimezoneContext';
import { useLanguage } from '../context/LanguageContext';

interface BrokerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProviderChanged?: (newProvider: string) => void;
}

export const BrokerSettingsModal: React.FC<BrokerSettingsModalProps> = ({
  isOpen,
  onClose,
  onProviderChanged,
}) => {
  const [modalTab, setModalTab] = useState<'broker' | 'ai' | 'timezone' | 'language'>('broker');
  const { language, setLanguage, activeLanguageInfo, supportedLanguages, t } = useLanguage();
  const {
    timezone,
    resolvedIana,
    setTimezone,
    use24Hour,
    setUse24Hour,
    currentFormattedTime,
    currentFormattedDate,
    currentOffset,
    currentAbbr,
    activeTimezoneInfo,
    popularTimezones,
    allTimezones,
    marketSessions,
  } = useTimezone();

  // Broker Settings
  const [activeProvider, setActiveProvider] = useState<string>('KeylessPublic');
  const [oandaAccountId, setOandaAccountId] = useState('');
  const [oandaApiToken, setOandaApiToken] = useState('');
  const [oandaEnvironment, setOandaEnvironment] = useState('Practice');
  const [twelveDataKey, setTwelveDataKey] = useState('');
  const [hasExistingToken, setHasExistingToken] = useState(false);
  const [maskedToken, setMaskedToken] = useState('');
  const [showToken, setShowToken] = useState(false);

  // AI BYOK Settings
  const [aiConfig, setAiConfig] = useState<AIProviderConfig>({
    provider: 'BuiltIn',
    model: 'Built-in Quant Engine',
    hasApiKey: false,
  });
  const [selectedAiProvider, setSelectedAiProvider] = useState('BuiltIn');
  const [aiApiKeyInput, setAiApiKeyInput] = useState('');
  const [aiModelInput, setAiModelInput] = useState('');
  const [aiEndpointInput, setAiEndpointInput] = useState('');
  const [aiStatusMessage, setAiStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const res = await tradingApi.getBrokerConfig();
      if (res) {
        setActiveProvider(res.activeProvider || 'KeylessPublic');
        setOandaAccountId(res.oandaAccountId || '');
        setOandaEnvironment(res.oandaEnvironment || 'Practice');
        setTwelveDataKey(res.twelveDataApiKey || '');
        setHasExistingToken(res.hasOandaToken || false);
        setMaskedToken(res.maskedOandaToken || '');
        setOandaApiToken('');
      }
      const ai = await tradingApi.getAiConfig();
      if (ai) {
        setAiConfig(ai);
        setSelectedAiProvider(ai.provider || 'BuiltIn');
        setAiModelInput(ai.model || '');
        setAiEndpointInput(ai.endpoint || '');
      }
    } catch (err) {
      console.warn('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setStatusMessage(null);

      const payload: any = {
        activeProvider,
        oandaAccountId,
        oandaEnvironment,
        twelveDataApiKey: twelveDataKey,
      };

      if (oandaApiToken.trim()) {
        payload.oandaApiToken = oandaApiToken.trim();
      }

      await tradingApi.updateBrokerConfig(payload);
      setStatusMessage({ text: 'Data provider and broker settings updated successfully!', type: 'success' });
      if (onProviderChanged) {
        onProviderChanged(activeProvider);
      }
      setTimeout(() => {
        onClose();
        setStatusMessage(null);
      }, 1000);
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to save settings', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAi = async () => {
    try {
      setIsLoading(true);
      setStatusMessage(null);
      const keyToSave = aiApiKeyInput.trim()
        ? aiApiKeyInput.trim()
        : (selectedAiProvider === aiConfig.provider ? aiConfig.apiKey : null);

      const updated = await tradingApi.updateAiConfig({
        provider: selectedAiProvider,
        model: aiModelInput || null,
        apiKey: keyToSave,
        endpoint: aiEndpointInput || null,
      });
      setAiConfig(updated);
      setAiApiKeyInput('');
      setStatusMessage({ text: 'AI BYOK credentials saved in browser storage!', type: 'success' });
      setTimeout(() => {
        onClose();
        setStatusMessage(null);
      }, 1000);
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to save AI settings', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAiProviderSelect = (prov: string) => {
    setSelectedAiProvider(prov);
    if (prov === 'OpenAI') setAiModelInput('gpt-4o');
    else if (prov === 'Claude') setAiModelInput('claude-3-5-sonnet-20241022');
    else if (prov === 'Gemini') setAiModelInput('gemini-1.5-pro');
    else if (prov === 'Ollama') setAiModelInput('llama3.2');
    else setAiModelInput('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⚙️</span>
            <div>
              <h2 className="text-sm font-bold text-slate-100 tracking-wide uppercase font-mono">
                Platform Settings & Connections
              </h2>
              <p className="text-[11px] text-slate-400">
                Configure keyless public data feeds, custom broker credentials, and Bring Your Own Key AI providers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-lg leading-none p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2">
          <button
            type="button"
            onClick={() => { setModalTab('broker'); setStatusMessage(null); }}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              modalTab === 'broker'
                ? 'border-blue-500 text-blue-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Market Data & Broker Feeds
          </button>
          <button
            type="button"
            onClick={() => { setModalTab('ai'); setStatusMessage(null); }}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              modalTab === 'ai'
                ? 'border-cyan-500 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            AI Copilot (BYOK Keys)
          </button>
          <button
            type="button"
            onClick={() => { setModalTab('timezone'); setStatusMessage(null); }}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              modalTab === 'timezone'
                ? 'border-emerald-500 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Timezone & Clock
          </button>
          <button
            type="button"
            onClick={() => { setModalTab('language'); setStatusMessage(null); }}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              modalTab === 'language'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            {t('settings.languageTab', 'Language & Region')}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          {statusMessage && (
            <div
              className={`p-3 rounded-lg text-xs font-mono flex items-center gap-2 border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-red-500/15 border-red-500/40 text-red-300'
              }`}
            >
              <span>{statusMessage.type === 'success' ? '✓' : '⚠'}</span>
              <span>{statusMessage.text}</span>
            </div>
          )}

          {modalTab === 'language' ? (
            <div className="space-y-4">
              {/* Active Language Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono font-semibold">
                      {t('settings.languageTab', 'Language & Region')}
                    </span>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
                      <span>{activeLanguageInfo.flag}</span>
                      <span>{activeLanguageInfo.nativeName}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-semibold uppercase">
                        {activeLanguageInfo.code}
                      </span>
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {activeLanguageInfo.region}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Select your preferred interface language. Menus, trading metrics, controls, feedback dialogs, and alerts update instantly without reloading.
                </p>
              </div>

              {/* Supported Languages Grid */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-200 block">
                  Available Languages:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {supportedLanguages.map((lang) => {
                    const isSelected = language === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          setLanguage(lang.code);
                          setStatusMessage({
                            text: `Language switched to ${lang.nativeName} (${lang.label})`,
                            type: 'success',
                          });
                        }}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/40'
                            : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl leading-none">{lang.flag}</span>
                          <div>
                            <div className="text-xs font-bold flex items-center gap-1.5">
                              <span>{lang.nativeName}</span>
                              <span className="text-[10px] font-mono text-slate-400 font-normal">
                                ({lang.label})
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {lang.region}
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : modalTab === 'timezone' ? (
            <div className="space-y-4">
              {/* Active Timezone Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono font-semibold">
                      Active Platform Clock & Timezone
                    </span>
                    <div className="text-xl font-bold font-mono text-white flex items-center gap-2 mt-0.5">
                      <span>{currentFormattedTime}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-semibold">
                        {currentOffset} ({currentAbbr})
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 font-mono">{currentFormattedDate}</span>
                    <div className="text-xs text-emerald-400 font-semibold mt-0.5">
                      {activeTimezoneInfo.flag} {activeTimezoneInfo.city}
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Clock Format:</span>
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setUse24Hour(true)}
                      className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-all cursor-pointer ${
                        use24Hour ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      24-Hour (Quant)
                    </button>
                    <button
                      type="button"
                      onClick={() => setUse24Hour(false)}
                      className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-all cursor-pointer ${
                        !use24Hour ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      12-Hour (AM/PM)
                    </button>
                  </div>
                </div>
              </div>

              {/* Major Financial Center Presets */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-200 block">
                  Select Financial Market Hub:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {popularTimezones.slice(0, 10).map((tz) => {
                    const isSelected = timezone === tz.id;
                    return (
                      <button
                        type="button"
                        key={tz.id}
                        onClick={() => setTimezone(tz.id)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-950/80 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/50'
                            : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60 text-slate-300'
                        }`}
                      >
                        <div className="min-w-0 pr-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold truncate">
                            <span>{tz.flag}</span>
                            <span>{tz.city}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate mt-0.5 font-mono">
                            {tz.region}
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* All IANA Timezones Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200 block">
                  Or Choose from All Global Timezones ({allTimezones.length}):
                </label>
                <select
                  value={resolvedIana}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {allTimezones.map((iana) => (
                    <option key={iana} value={iana}>
                      {iana.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Market Sessions Strip */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Market Session Statuses (London / New York / Tokyo / Sydney):</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  {marketSessions.map((s) => (
                    <div
                      key={s.name}
                      className={`p-2 rounded-lg border text-center ${
                        s.isOpen
                          ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300 font-bold'
                          : 'bg-slate-900 border-slate-800/80 text-slate-500'
                      }`}
                    >
                      <div>{s.name}</div>
                      <div className="text-[10px] mt-0.5">{s.isOpen ? '● OPEN' : '○ CLOSED'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : modalTab === 'broker' ? (
            <>
              {/* Section 1: Choose Active Provider */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block font-mono">
                  1. Active Market Data Feed
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Option 1: Keyless Public */}
                  <div
                    onClick={() => setActiveProvider('KeylessPublic')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      activeProvider === 'KeylessPublic'
                        ? 'bg-blue-600/15 border-blue-500 ring-1 ring-blue-500/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 font-bold text-slate-100">
                        <span>🌐</span>
                        <span>Keyless Public</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        No Keys Needed
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Yahoo Finance for Forex (EURUSD, GBPUSD, etc.) + Binance 24/7 for Crypto. Works instantly out-of-the-box for sharing with others.
                    </p>
                  </div>

                  {/* Option 2: OANDA */}
                  <div
                    onClick={() => setActiveProvider('Oanda')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      activeProvider === 'Oanda'
                        ? 'bg-blue-600/15 border-blue-500 ring-1 ring-blue-500/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 font-bold text-slate-100">
                        <span>⚡</span>
                        <span>OANDA v20 Broker</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        Requires API Token
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Direct institutional broker stream and order execution. Practice and Live accounts supported.
                    </p>
                  </div>

                  {/* Option 3: MT5 ZeroMQ */}
                  <div
                    onClick={() => setActiveProvider('ZeroMQ')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      activeProvider === 'ZeroMQ'
                        ? 'bg-blue-600/15 border-blue-500 ring-1 ring-blue-500/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 font-bold text-slate-100">
                        <span>🖥️</span>
                        <span>MT5 Local Bridge</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        NetMQ Local
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Streams ticks and bars directly from your running desktop MetaTrader 5 terminal over local port 5556.
                    </p>
                  </div>

                  {/* Option 4: Synthetic Sandbox */}
                  <div
                    onClick={() => setActiveProvider('Synthetic')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      activeProvider === 'Synthetic'
                        ? 'bg-blue-600/15 border-blue-500 ring-1 ring-blue-500/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 font-bold text-slate-100">
                        <span>🔬</span>
                        <span>Offline Sandbox</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        Synthetic
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Internal price generator. Runs without any network connectivity or external dependency.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: Broker API Keys Configuration */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider font-mono">
                    2. Broker Credentials (OANDA / Custom Feeds)
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {hasExistingToken ? '● Token Configured in Database' : '○ No Token Stored'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1 font-mono">
                      OANDA Account ID
                    </label>
                    <input
                      type="text"
                      value={oandaAccountId}
                      onChange={(e) => setOandaAccountId(e.target.value)}
                      placeholder="e.g. 101-004-1234567-001"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1 font-mono">
                      OANDA Environment
                    </label>
                    <select
                      value={oandaEnvironment}
                      onChange={(e) => setOandaEnvironment(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="Practice">Practice (Demo Account)</option>
                      <option value="Trade">Trade (Live Production)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-400 font-mono">
                      OANDA v20 Bearer API Token
                    </label>
                    {hasExistingToken && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        Current: {maskedToken}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={oandaApiToken}
                      onChange={(e) => setOandaApiToken(e.target.value)}
                      placeholder={hasExistingToken ? 'Leave blank to keep existing token' : 'Paste your OANDA token here'}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 pr-16 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-2 top-2 text-[10px] text-slate-400 hover:text-slate-200 font-mono px-2 py-0.5 bg-slate-800 rounded"
                    >
                      {showToken ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 3: Architecture & Database Notice */}
              <div className="bg-blue-950/20 border border-blue-900/40 rounded-xl p-3.5 space-y-1 text-slate-400 text-[11px]">
                <div className="flex items-center gap-2 text-blue-300 font-semibold font-mono text-xs">
                  <span>💾</span>
                  <span>Desktop & Web Deployment Mode</span>
                </div>
                <p>
                  This platform supports <strong className="text-slate-200">SQLite</strong> (<code className="text-blue-300">trading_platform.db</code>) for standalone, zero-configuration local desktop execution on Ubuntu/Linux/Windows, as well as <strong className="text-slate-200">SQL Server</strong> for enterprise multi-user Web hosting.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* AI Copilot Bring Your Own Key Configuration */}
              <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-800/40 space-y-2">
                <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span>Bring Your Own Key (BYOK) — Zero Server Billing Policy</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[11.5px]">
                  All AI keys are stored purely in your browser's private local storage. Requests to OpenAI, Claude, Gemini, or Ollama execute solely with your personal quota and billing. The platform host pays nothing on your behalf, and you maintain complete control of your AI costs.
                </p>
              </div>

              {/* Provider Selection */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block font-mono">
                    Select AI Provider
                  </label>
                  <span className="text-[10px] text-cyan-400 font-mono">
                    Active in Browser: <strong>{aiConfig.provider}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'BuiltIn', label: '🧠 Built-in', desc: '100% Free & Offline' },
                    { id: 'OpenAI', label: '🟢 OpenAI', desc: 'GPT-4o, Mini' },
                    { id: 'Claude', label: '🟣 Claude', desc: 'Sonnet 3.5' },
                    { id: 'Gemini', label: '🔵 Gemini', desc: '1.5 Pro / Flash' },
                    { id: 'Ollama', label: '🦙 Ollama', desc: 'Local Self-Hosted' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleAiProviderSelect(p.id)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        selectedAiProvider === p.id
                          ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500/50 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-semibold text-xs">{p.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedAiProvider === 'BuiltIn' ? (
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-300 font-semibold text-xs">
                    <span>⚡</span>
                    <span>Built-in Algorithmic Quant Engine</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Operates deterministically inside the server application using multi-timeframe mathematical analysis (EMA crosses, RSI regimes, ATR dynamic bands, Ichimoku cloud breakout detection). Requires zero API keys and never incurs API token costs.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3.5">
                  <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider font-mono block">
                    {selectedAiProvider} Credentials (BYOK)
                  </span>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1 font-mono uppercase">
                      Model Identifier:
                    </label>
                    <input
                      type="text"
                      value={aiModelInput}
                      onChange={(e) => setAiModelInput(e.target.value)}
                      placeholder={
                        selectedAiProvider === 'OpenAI'
                          ? 'gpt-4o'
                          : selectedAiProvider === 'Claude'
                          ? 'claude-3-5-sonnet-20241022'
                          : selectedAiProvider === 'Gemini'
                          ? 'gemini-1.5-pro'
                          : 'llama3.2'
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  {selectedAiProvider !== 'Ollama' && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] text-slate-400 font-mono uppercase">
                          Your Personal API Key:
                        </label>
                        {aiConfig.hasApiKey && (
                          <span className="text-[10px] text-emerald-400 font-mono">
                            Stored in Browser: {aiConfig.maskedApiKey}
                          </span>
                        )}
                      </div>
                      <input
                        type="password"
                        value={aiApiKeyInput}
                        onChange={(e) => setAiApiKeyInput(e.target.value)}
                        placeholder={aiConfig.hasApiKey ? 'Leave blank to preserve stored key' : 'Enter your API key (e.g. sk-...)'}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1 font-mono uppercase">
                      Custom Endpoint URL (Optional):
                    </label>
                    <input
                      type="text"
                      value={aiEndpointInput}
                      onChange={(e) => setAiEndpointInput(e.target.value)}
                      placeholder={
                        selectedAiProvider === 'Ollama'
                          ? 'http://localhost:11434'
                          : 'Leave blank to use official API gateway'
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={
              modalTab === 'timezone' || modalTab === 'language'
                ? onClose
                : modalTab === 'broker'
                ? handleSave
                : handleSaveAi
            }
            disabled={isLoading}
            className={`px-5 py-2 rounded-lg text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
              modalTab === 'timezone'
                ? 'bg-emerald-600 hover:bg-emerald-500'
                : modalTab === 'language'
                ? 'bg-indigo-600 hover:bg-indigo-500'
                : modalTab === 'broker'
                ? 'bg-blue-600 hover:bg-blue-500'
                : 'bg-cyan-600 hover:bg-cyan-500'
            }`}
          >
            {isLoading
              ? 'Saving...'
              : modalTab === 'timezone' || modalTab === 'language'
              ? 'Done (Applied)'
              : modalTab === 'broker'
              ? 'Apply & Save Broker Settings'
              : 'Save AI BYOK Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};
