import React, { useState } from 'react';
import { X, Search, Command } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keyCombo: string[];
  description: string;
  category: 'Navigation' | 'Workstation' | 'Scanner & Trading';
}

const SHORTCUTS: ShortcutItem[] = [
  { keyCombo: ['F1'], description: 'Open in-app documentation & user manual', category: 'Navigation' },
  { keyCombo: ['/', 'Ctrl+K'], description: 'Open global symbol search & ticker browser', category: 'Navigation' },
  { keyCombo: ['Esc'], description: 'Close active modal, search bar or drawer', category: 'Navigation' },
  { keyCombo: ['Space'], description: 'Pause / Resume Near-Miss Scanner live tick audit', category: 'Scanner & Trading' },
  { keyCombo: ['F11'], description: 'Toggle fullscreen multi-monitor workstation mode', category: 'Workstation' },
  { keyCombo: ['Ctrl', 'R'], description: 'Soft reload platform and refresh market quotes', category: 'Workstation' },
  { keyCombo: ['Ctrl', 'Shift', 'R'], description: 'Hard reload and clear frontend web cache', category: 'Workstation' },
  { keyCombo: ['Ctrl', '+'], description: 'Zoom in interface display scale', category: 'Workstation' },
  { keyCombo: ['Ctrl', '-'], description: 'Zoom out interface display scale', category: 'Workstation' },
  { keyCombo: ['Ctrl', '0'], description: 'Reset interface display zoom to 100%', category: 'Workstation' },
  { keyCombo: ['Ctrl', 'Shift', 'I'], description: 'Toggle developer diagnostics and console', category: 'Workstation' },
  { keyCombo: ['Ctrl', '/'], description: 'Open this keyboard shortcuts quick reference', category: 'Navigation' },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredShortcuts = SHORTCUTS.filter(
    (s) =>
      s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.keyCombo.some((k) => k.toLowerCase().includes(searchTerm.toLowerCase())) ||
      s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300">
              <Command className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Keyboard Shortcuts Reference
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Trading Platform Desktop Shortcuts
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter shortcuts (e.g. zoom, chart, reload, F11)..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 font-sans"
              autoFocus
            />
          </div>
        </div>

        {/* Shortcuts List */}
        <div className="p-4 space-y-2 max-h-[55vh] overflow-y-auto">
          {filteredShortcuts.map((item, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
            >
              <div className="min-w-0">
                <span className="text-xs text-slate-200 font-medium block truncate">
                  {item.description}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {item.category}
                </span>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {item.keyCombo.map((k, kIdx) => (
                  <kbd
                    key={kIdx}
                    className="px-2 py-0.5 rounded-md bg-slate-850 border border-slate-700 text-slate-200 font-mono text-[11px] font-bold shadow-sm"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}

          {filteredShortcuts.length === 0 && (
            <div className="py-8 text-center text-slate-500 text-xs font-mono">
              No shortcuts found matching "{searchTerm}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>Press Esc anytime to close</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            {t('common.close', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
};
