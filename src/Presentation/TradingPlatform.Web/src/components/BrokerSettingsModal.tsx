import React, { useState, useEffect } from 'react';
import { tradingApi } from '../api/tradingClient';

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
  const [activeProvider, setActiveProvider] = useState<string>('KeylessPublic');
  const [oandaAccountId, setOandaAccountId] = useState('');
  const [oandaApiToken, setOandaApiToken] = useState('');
  const [oandaEnvironment, setOandaEnvironment] = useState('Practice');
  const [twelveDataKey, setTwelveDataKey] = useState('');
  const [hasExistingToken, setHasExistingToken] = useState(false);
  const [maskedToken, setMaskedToken] = useState('');
  const [showToken, setShowToken] = useState(false);

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
    } catch (err) {
      console.warn('Failed to load broker settings:', err);
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
                Market Data & Broker Settings
              </h2>
              <p className="text-[11px] text-slate-400">
                Configure keyless public data feeds, custom broker API tokens, and desktop database
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
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Apply & Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};
