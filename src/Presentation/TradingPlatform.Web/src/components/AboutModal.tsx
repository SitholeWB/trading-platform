import React, { useState } from 'react';
import { X, Check, Copy, ExternalLink, Github, Sparkles, Cpu, HardDrive, Terminal, MessageSquarePlus, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProvider?: string;
  onOpenFeedback?: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  activeProvider = 'KeylessPublic',
  onOpenFeedback,
}) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const electronApi = (window as any).electronAPI;
  const isElectron = Boolean(electronApi?.isElectron);
  const platform = electronApi?.platform || navigator.platform || 'Unknown OS';
  const electronVersion = electronApi?.versions?.electron || (isElectron ? '33.2.1' : 'Web Browser');
  const chromeVersion = electronApi?.versions?.chrome || (isElectron ? '130.0' : 'Blink');
  const nodeVersion = electronApi?.versions?.node || (isElectron ? '20.18.0' : 'N/A');
  const appVersion = '1.3.0';

  const handleCopyDiagnostics = async () => {
    const diagText = [
      '### Trading Platform Workstation Diagnostics',
      `- **App Version**: v${appVersion}`,
      `- **Environment**: ${isElectron ? 'Desktop (Electron)' : 'Web Browser'}`,
      `- **OS / Platform**: ${platform} (${navigator.userAgent})`,
      `- **Electron**: ${electronVersion}`,
      `- **Chromium**: ${chromeVersion}`,
      `- **Node.js**: ${nodeVersion}`,
      `- **Backend Engine**: .NET 10.0 Native ASP.NET Core Engine`,
      `- **Active Market Provider**: ${activeProvider}`,
      `- **Persistence**: SQLite WAL & Memory Buffers`,
      `- **Timestamp (UTC)**: ${new Date().toISOString()}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(diagText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const openUrl = (url: string) => {
    if (electronApi?.openExternal) {
      electronApi.openExternal(url);
    } else {
      window.open(url, '_blank', 'noreferrer');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with App Logo and Badges */}
        <div className="relative p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src="/app-icon.png"
                alt="Trading Platform"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-500/40 shadow-xl shadow-cyan-950/50"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {t('common.appTitle', 'Trading Platform')}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  v{appVersion}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                Institutional Algorithmic Workstation & Multi-Asset Scanner
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  MIT License
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                  {isElectron ? 'Desktop Shell' : 'Web Terminal'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Architecture Specifications */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto text-xs">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-start gap-2.5">
              <Cpu className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-mono text-slate-500 font-semibold">Engine</div>
                <div className="text-xs font-bold text-slate-200 truncate">.NET 10 Native</div>
                <div className="text-[10px] text-emerald-400 font-mono">ASP.NET Core Kestrel</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-start gap-2.5">
              <Terminal className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-mono text-slate-500 font-semibold">Desktop Shell</div>
                <div className="text-xs font-bold text-slate-200 truncate">Electron {electronVersion}</div>
                <div className="text-[10px] text-slate-400 font-mono truncate">Chrome {chromeVersion}</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-start gap-2.5">
              <HardDrive className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-mono text-slate-500 font-semibold">Persistence</div>
                <div className="text-xs font-bold text-slate-200 truncate">SQLite WAL Journal</div>
                <div className="text-[10px] text-slate-400 font-mono">Circular Memory Buffers</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-mono text-slate-500 font-semibold">Market Provider</div>
                <div className="text-xs font-bold text-slate-200 truncate">{activeProvider}</div>
                <div className="text-[10px] text-slate-400 font-mono truncate">Yahoo / Binance / OANDA</div>
              </div>
            </div>
          </div>

          {/* Quick System Environment Details */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono space-y-1.5 text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Platform OS:</span>
              <span className="text-slate-200">{platform}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Frontend Stack:</span>
              <span className="text-slate-200">React 18 • TypeScript • TailwindCSS</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Charting Library:</span>
              <span className="text-slate-200">TradingView Lightweight Charts v4.2</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Node Runtime:</span>
              <span className="text-slate-200">{nodeVersion}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyDiagnostics}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copy system and version diagnostics to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Diagnostics' : 'Copy System Info'}</span>
            </button>

            <button
              onClick={() => openUrl('https://github.com/SitholeWB/trading-platform')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onOpenFeedback && (
              <button
                onClick={() => {
                  onClose();
                  onOpenFeedback();
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageSquarePlus className="w-3.5 h-3.5 text-indigo-400" />
                <span>{t('common.feedback', 'Feedback')}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
            >
              {t('common.close', 'Close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

