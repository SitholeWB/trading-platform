import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Globe,
  Clock,
  Search,
  Check,
  X,
  Sliders,
  Activity,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useTimezone, TimezoneOption } from '../context/TimezoneContext';

interface TimezoneSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TimezoneSelectorModal: React.FC<TimezoneSelectorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    timezone,
    resolvedIana,
    setTimezone,
    use24Hour,
    setUse24Hour,
    now,
    currentFormattedTime,
    currentFormattedDate,
    currentOffset,
    currentAbbr,
    activeTimezoneInfo,
    popularTimezones,
    allTimezones,
    marketSessions,
  } = useTimezone();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'financial' | 'all'>('financial');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filtered popular timezones
  const filteredPopular = useMemo(() => {
    if (!searchQuery.trim()) return popularTimezones;
    const q = searchQuery.toLowerCase();
    return popularTimezones.filter(
      (tz) =>
        tz.label.toLowerCase().includes(q) ||
        tz.city.toLowerCase().includes(q) ||
        tz.region.toLowerCase().includes(q) ||
        tz.iana.toLowerCase().includes(q)
    );
  }, [popularTimezones, searchQuery]);

  // Filtered all IANA timezones
  const filteredAll = useMemo(() => {
    if (!searchQuery.trim()) return allTimezones.slice(0, 60);
    const q = searchQuery.toLowerCase();
    return allTimezones
      .filter((tz) => tz.toLowerCase().includes(q))
      .slice(0, 60);
  }, [allTimezones, searchQuery]);

  // Helper to get time in specific timezone for preview
  const getTimePreview = (iana: string) => {
    try {
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: iana,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: !use24Hour,
      }).format(now);
    } catch {
      return '--:--:--';
    }
  };

  const getOffsetPreview = (iana: string) => {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: iana,
        timeZoneName: 'shortOffset',
      });
      const parts = formatter.formatToParts(now);
      const tzPart = parts.find((p) => p.type === 'timeZoneName');
      return tzPart ? tzPart.value.replace('GMT', 'UTC') : 'UTC';
    } catch {
      return 'UTC';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
              <Globe className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Platform Timezone & Clock</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure your active trading clock, chart axis times, and market session indicators
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Active Clock Banner */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-mono font-semibold">
                Current Active Timezone
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {currentOffset} ({currentAbbr})
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-wider">
                {currentFormattedTime}
              </span>
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                {currentFormattedDate}
              </span>
            </div>
            <div className="text-xs text-cyan-400/90 font-medium flex items-center gap-1.5 pt-0.5">
              <span>{activeTimezoneInfo.flag}</span>
              <span className="font-semibold">{activeTimezoneInfo.label}</span>
              <span className="text-slate-500 font-mono">({resolvedIana})</span>
            </div>
          </div>

          {/* 24-Hour vs 12-Hour Toggle */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setUse24Hour(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                use24Hour
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              24-Hour (Quant)
            </button>
            <button
              onClick={() => setUse24Hour(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                !use24Hour
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              12-Hour (AM/PM)
            </button>
          </div>
        </div>

        {/* Global Market Sessions Status Strip */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-[11px] font-mono">
          <span className="text-slate-500 flex-shrink-0 flex items-center gap-1 font-semibold">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Market Sessions:</span>
          </span>
          <div className="flex items-center gap-3">
            {marketSessions.map((session) => (
              <div
                key={session.name}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10.5px] ${
                  session.isOpen
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 font-semibold'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
                title={`${session.name} session: ${session.isOpen ? 'OPEN' : 'CLOSED'}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    session.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                  }`}
                />
                <span>{session.name}</span>
                <span className="text-[9.5px] opacity-75">
                  ({session.isOpen ? 'OPEN' : 'CLOSED'})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Search & Tabs Controls */}
        <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-900/50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search financial hubs (e.g. New York, London, Tokyo, UTC, Johannesburg)..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('financial')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeTab === 'financial'
                    ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Major Financial Hubs ({popularTimezones.length})
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Global Timezones ({allTimezones.length})
              </button>
            </div>
            <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
              Click any timezone to apply instantly
            </span>
          </div>
        </div>

        {/* Scrollable Timezone List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[360px] custom-scrollbar">
          {activeTab === 'financial' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredPopular.map((tz) => {
                const isSelected = timezone === tz.id;
                const timePreview = getTimePreview(tz.iana);
                const offsetPreview = getOffsetPreview(tz.iana);

                return (
                  <button
                    key={tz.id}
                    onClick={() => {
                      setTimezone(tz.id);
                      onClose();
                    }}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between group cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/80 border-cyan-500 text-white shadow-md ring-1 ring-cyan-500/40'
                        : 'bg-slate-950/70 border-slate-800/80 hover:bg-slate-800/80 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{tz.flag}</span>
                        <span className="font-bold text-xs truncate text-slate-100">
                          {tz.city}
                        </span>
                        {isSelected && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-500 text-slate-950 font-extrabold uppercase">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {tz.label}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 mt-1 flex items-center gap-1.5">
                        <span>{offsetPreview}</span>
                        <span>•</span>
                        <span>{tz.region}</span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-mono font-bold text-cyan-300">
                        {timePreview}
                      </div>
                      {isSelected ? (
                        <div className="mt-1 flex items-center justify-end text-cyan-400">
                          <Check className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="mt-1 text-[10px] text-slate-500 group-hover:text-cyan-400 font-mono transition-colors">
                          Select →
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
              {filteredPopular.length === 0 && (
                <div className="col-span-2 text-center py-8 text-slate-500 text-xs">
                  No financial hub matched "{searchQuery}". Switch to "All Global Timezones" tab to find any city.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredAll.map((iana) => {
                const isSelected = resolvedIana === iana;
                const timePreview = getTimePreview(iana);
                const offsetPreview = getOffsetPreview(iana);

                return (
                  <button
                    key={iana}
                    onClick={() => {
                      setTimezone(iana);
                      onClose();
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/80 border-cyan-500 text-white shadow-sm'
                        : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Clock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <div className="truncate">
                        <span className="font-mono text-xs font-semibold text-slate-200">
                          {iana.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono ml-2">
                          ({offsetPreview})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs font-mono font-bold text-cyan-300">
                        {timePreview}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                    </div>
                  </button>
                );
              })}
              {filteredAll.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No timezone found matching "{searchQuery}".
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Timezone persists across application reloads & desktop restarts</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
