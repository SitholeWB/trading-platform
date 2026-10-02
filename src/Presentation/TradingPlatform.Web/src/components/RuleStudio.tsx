import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IndicatorConfig, StrategyDefinition, Timeframe } from '../types/trading';

interface RuleStudioProps {
  strategies: StrategyDefinition[];
  onSaveStrategy: (strategy: any) => Promise<void>;
  onDeleteStrategy: (id: string) => Promise<void>;
  onIndicatorConfigChange?: (config: IndicatorConfig) => void;
}

interface RuleItem {
  id: string;
  field: string;
  operator: string;
  value: string;
  valueSource: 'value' | 'field';
}

const DEFAULT_INDICATOR_CONFIG: IndicatorConfig = {
  emas: [20, 50, 200],
  smas: [20, 50, 200],
  rsi: {
    period: 14,
    overbought: 70,
    oversold: 30,
  },
  macd: {
    fast: 12,
    slow: 26,
    signal: 9,
  },
  bollinger: {
    period: 20,
    stdDev: 2.0,
  },
  stoch: {
    kPeriod: 14,
    dPeriod: 3,
    smooth: 3,
  },
  atr: {
    period: 14,
    slMultiplier: 1.5,
    tpMultiplier: 3.0,
  },
  adx: {
    period: 14,
    threshold: 25,
  },
  ichimoku: {
    tenkan: 9,
    kijun: 26,
    senkou: 52,
  },
};

export const RuleStudio: React.FC<RuleStudioProps> = ({
  strategies,
  onSaveStrategy,
  onDeleteStrategy,
  onIndicatorConfigChange,
}) => {
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(
    strategies[0]?.id || null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [name, setName] = useState('NewStrategy');
  const [description, setDescription] = useState('Quantitative strategy');
  const [timeframe, setTimeframe] = useState<Timeframe>('M5');
  const [autoTrading, setAutoTrading] = useState(true);
  const [aiValidation, setAiValidation] = useState(false);
  const [combinator, setCombinator] = useState<'and' | 'or'>('and');

  // Indicator Configuration State
  const [indicatorConfig, setIndicatorConfig] = useState<IndicatorConfig>(DEFAULT_INDICATOR_CONFIG);
  const [showIndicatorSettings, setShowIndicatorSettings] = useState(false);
  const [newEmaInput, setNewEmaInput] = useState('');
  const [newSmaInput, setNewSmaInput] = useState('');

  // Dynamically compute available fields based on configured indicators
  const availableFields = useMemo(() => [
    { group: 'Price Action', items: ['Close', 'Open', 'High', 'Low', 'Volume'] },
    {
      group: 'Moving Averages (EMA)',
      items: indicatorConfig.emas.map((p) => `Ema${p}`),
    },
    {
      group: 'Moving Averages (SMA)',
      items: (indicatorConfig.smas || [20, 50, 200]).map((p) => `Sma${p}`),
    },
    {
      group: 'MACD (Trend / Momentum)',
      items: ['MacdLine', 'MacdSignal', 'MacdHistogram'],
    },
    {
      group: 'Bollinger Bands (Volatility)',
      items: ['BollingerUpper', 'BollingerMiddle', 'BollingerLower'],
    },
    {
      group: 'Oscillators (RSI & Stoch)',
      items: [
        `Rsi${indicatorConfig.rsi.period}`,
        'StochK',
        'StochD',
      ],
    },
    {
      group: 'Trend & Volatility (ATR & ADX)',
      items: [
        `Atr${indicatorConfig.atr.period}`,
        'Adx',
      ],
    },
    {
      group: 'Ichimoku Cloud',
      items: [
        'IchimokuSpanA',
        'IchimokuSpanB',
        'IchimokuTenkan',
        'IchimokuKijun',
        'IchimokuChikou',
      ],
    },
    { group: 'Candle Geometry', items: ['UpperWickRatio', 'LowerWickRatio', 'BodyRatio'] },
  ], [indicatorConfig]);

  const updateIndicatorConfig = (newConfig: IndicatorConfig) => {
    setIndicatorConfig(newConfig);
    onIndicatorConfigChange?.(newConfig);
  };

  const handleAddEma = () => {
    const period = parseInt(newEmaInput.trim(), 10);
    if (!isNaN(period) && period > 0 && !indicatorConfig.emas.includes(period)) {
      const updatedEmas = [...indicatorConfig.emas, period].sort((a, b) => a - b);
      const updated = { ...indicatorConfig, emas: updatedEmas };
      updateIndicatorConfig(updated);
      setNewEmaInput('');
    }
  };

  const handleRemoveEma = (period: number) => {
    const updatedEmas = indicatorConfig.emas.filter((p) => p !== period);
    const updated = { ...indicatorConfig, emas: updatedEmas };
    updateIndicatorConfig(updated);
  };

  const applyEmaPreset = (presetEmas: number[]) => {
    const updated = { ...indicatorConfig, emas: presetEmas };
    updateIndicatorConfig(updated);
  };

  const handleAddSma = () => {
    const period = parseInt(newSmaInput.trim(), 10);
    const currentSmas = indicatorConfig.smas || [20, 50, 200];
    if (!isNaN(period) && period > 0 && !currentSmas.includes(period)) {
      const updatedSmas = [...currentSmas, period].sort((a, b) => a - b);
      const updated = { ...indicatorConfig, smas: updatedSmas };
      updateIndicatorConfig(updated);
      setNewSmaInput('');
    }
  };

  const handleRemoveSma = (period: number) => {
    const currentSmas = indicatorConfig.smas || [20, 50, 200];
    const updatedSmas = currentSmas.filter((p) => p !== period);
    const updated = { ...indicatorConfig, smas: updatedSmas };
    updateIndicatorConfig(updated);
  };

  const applySmaPreset = (presetSmas: number[]) => {
    const updated = { ...indicatorConfig, smas: presetSmas };
    updateIndicatorConfig(updated);
  };

  const [rules, setRules] = useState<RuleItem[]>([
    { id: '1', field: 'Close', operator: '>', value: 'Ema50', valueSource: 'field' },
    { id: '2', field: 'Close', operator: '>', value: 'IchimokuSpanA', valueSource: 'field' },
    { id: '3', field: 'Rsi14', operator: '>', value: '45', valueSource: 'value' },
    { id: '4', field: 'UpperWickRatio', operator: '<', value: '0.35', valueSource: 'value' },
  ]);

  const [activeTab, setActiveTab] = useState<'visual' | 'json' | 'test'>('visual');

  const addRule = () => {
    setRules([
      ...rules,
      {
        id: Math.random().toString(36).substring(7),
        field: 'Close',
        operator: '>',
        value: 'Ema20',
        valueSource: 'field',
      },
    ]);
  };

  const removeRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
  };

  const updateRule = (id: string, updates: Partial<RuleItem>) => {
    setRules(rules.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const loadStrategy = (strat: StrategyDefinition | null) => {
    if (!strat) {
      setSelectedStrategyId(null);
      setName('NewCustomStrategy');
      setDescription('Custom quantitative strategy with dynamic indicators');
      setTimeframe('M5');
      setAutoTrading(true);
      setAiValidation(false);
      setCombinator('and');
      setRules([
        { id: '1', field: 'Close', operator: '>', value: 'Ema50', valueSource: 'field' },
        { id: '2', field: 'Rsi14', operator: '>', value: '45', valueSource: 'value' },
      ]);
      updateIndicatorConfig(DEFAULT_INDICATOR_CONFIG);
      return;
    }

    setSelectedStrategyId(strat.id);
    setName(strat.name);
    setDescription(strat.description || '');
    setTimeframe(strat.timeframe || 'M5');
    setAutoTrading(strat.autoTradingEnabled);
    setAiValidation(strat.aiValidationEnabled);

    try {
      const parsed = JSON.parse(strat.rawJsonRules);
      if (parsed.combinator) setCombinator(parsed.combinator);

      if (Array.isArray(parsed.rules) && parsed.rules.length > 0) {
        setRules(
          parsed.rules.map((r: any, idx: number) => ({
            id: `${idx + 1}-${Math.random().toString(36).substring(7)}`,
            field: r.field || 'Close',
            operator: r.operator || '>',
            value: String(r.value ?? ''),
            valueSource:
              r.valueSource ||
              (typeof r.value === 'string' && isNaN(Number(r.value)) ? 'field' : 'value'),
          }))
        );
      }

      if (parsed.indicators) {
        const loaded: IndicatorConfig = {
          ...DEFAULT_INDICATOR_CONFIG,
          ...parsed.indicators,
        };
        updateIndicatorConfig(loaded);
      } else if (strat.indicators) {
        updateIndicatorConfig({
          ...DEFAULT_INDICATOR_CONFIG,
          ...strat.indicators,
        });
      }
    } catch (err) {
      console.warn('Could not parse strategy JSON rules', err);
    }
  };

  const initialSyncRef = useRef(false);
  useEffect(() => {
    if (!initialSyncRef.current && strategies.length > 0) {
      loadStrategy(strategies[0]);
      initialSyncRef.current = true;
    }
  }, [strategies]);

  // Compile visual state to React Query Builder JSON schema including custom indicator configs
  const compiledJson = JSON.stringify(
    {
      combinator,
      rules: rules.map((r) => ({
        field: r.field,
        operator: r.operator,
        value: r.valueSource === 'value' ? Number(r.value) || r.value : r.value,
        valueSource: r.valueSource,
      })),
      indicators: indicatorConfig,
    },
    null,
    2
  );

  const handleSave = async (saveAsNew = false) => {
    try {
      setIsSaving(true);
      setStatusFeedback(null);
      const targetId = saveAsNew ? undefined : (selectedStrategyId || undefined);
      await onSaveStrategy({
        id: targetId,
        name: saveAsNew ? `${name}_Copy` : name,
        description,
        timeframe,
        rawJsonRules: compiledJson,
        isActive: true,
        autoTradingEnabled: autoTrading,
        aiValidationEnabled: aiValidation,
      });

      setStatusFeedback({
        type: 'success',
        message: saveAsNew || !targetId
          ? '✓ Saved new strategy with indicators to database!'
          : '✓ Updated strategy & indicator configs in database!',
      });
      setTimeout(() => setStatusFeedback(null), 4000);
    } catch (err: any) {
      setStatusFeedback({
        type: 'error',
        message: `Save failed: ${err.message || 'Unknown error'}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedStrategyId || !onDeleteStrategy) return;
    if (window.confirm(`Delete strategy "${name}" from database?`)) {
      await onDeleteStrategy(selectedStrategyId);
      loadStrategy(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-full">
      {/* Studio Header */}
      <div className="min-h-12 px-4 py-2 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm text-slate-100">Dynamic Strategy Studio</span>
          <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-mono">
            React Query Builder ⇄ RulesEngine
          </span>

          {/* Strategy Selection Toolbar */}
          <div className="flex items-center gap-1.5 ml-2 pl-3 border-l border-slate-800">
            <span className="text-[10px] text-slate-400 font-mono uppercase">Strategy:</span>
            <select
              value={selectedStrategyId || ''}
              onChange={(e) => {
                const strat = strategies.find((s) => s.id === e.target.value);
                loadStrategy(strat || null);
              }}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-medium focus:border-blue-500 focus:outline-none max-w-[190px]"
            >
              <option value="">+ New Strategy</option>
              {strategies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.timeframe})
                </option>
              ))}
            </select>

            <button
              onClick={() => loadStrategy(null)}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700"
              title="Create blank new strategy"
            >
              + New
            </button>

            {selectedStrategyId && (
              <button
                onClick={handleDelete}
                className="px-2 py-1 rounded bg-red-950/40 hover:bg-red-900/60 text-red-400 text-xs font-medium border border-red-800/50"
                title="Delete strategy from database"
              >
                🗑️
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {statusFeedback && (
            <span
              className={`text-xs px-2.5 py-1 rounded font-medium border ${
                statusFeedback.type === 'success'
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                  : 'bg-red-950/80 text-red-300 border-red-700'
              }`}
            >
              {statusFeedback.message}
            </span>
          )}

          <button
            onClick={() => setShowIndicatorSettings(!showIndicatorSettings)}
            className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              showIndicatorSettings
                ? 'bg-blue-600/30 text-blue-300 border-blue-500/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <span>⚙️ Indicators Config</span>
            <span className="bg-blue-500/20 text-blue-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {indicatorConfig.emas.length} EMAs
            </span>
          </button>

          <div className="flex bg-slate-800 rounded p-0.5 text-xs">
            <button
              onClick={() => setActiveTab('visual')}
              className={`px-3 py-1 rounded transition-colors ${
                activeTab === 'visual' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Visual Builder
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1 rounded transition-colors ${
                activeTab === 'json' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Compiled JSON AST
            </button>
          </div>

          <button
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="px-3.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-colors"
          >
            {isSaving ? 'Saving...' : selectedStrategyId ? 'Update Strategy' : 'Save Strategy'}
          </button>

          {selectedStrategyId && (
            <button
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 transition-colors"
              title="Save current rules & indicators as a new copy in database"
            >
              Save as Copy
            </button>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="p-4 overflow-y-auto flex-1 space-y-4">
        {/* Strategy Meta Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
          <div>
            <label className="text-[10px] text-slate-400 font-mono uppercase">Strategy Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 font-medium focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-mono uppercase">Timeframe</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as Timeframe)}
              className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 font-medium focus:border-blue-500 focus:outline-none"
            >
              {(['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN1'] as Timeframe[]).map((tf) => (
                <option key={tf} value={tf}>{tf}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4 pt-4">
            <label className="flex items-center gap-1.5 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={autoTrading}
                onChange={(e) => setAutoTrading(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-blue-500 focus:ring-0"
              />
              <span className="text-slate-300 font-medium">Auto-Trading</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={aiValidation}
                onChange={(e) => setAiValidation(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-0"
              />
              <span className="text-indigo-400 font-medium">AI Validation Hook</span>
            </label>
          </div>
        </div>

        {/* Expandable Indicator Configuration Panel */}
        {showIndicatorSettings && (
          <div className="bg-slate-950 p-4 rounded-xl border border-blue-500/30 shadow-lg shadow-blue-950/40 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-100">Indicator Parameters & Quant Settings</span>
                <span className="text-[11px] text-slate-400">Configure parameters for EMAs, Oscillators, and Volatility</span>
              </div>
              <button
                onClick={() => setShowIndicatorSettings(false)}
                className="text-xs text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded hover:bg-slate-800"
              >
                Close ✕
              </button>
            </div>

            {/* EMA Periods Configuration */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
                  <span>Exponential Moving Averages (EMA)</span>
                  <span className="text-[10px] text-slate-500 font-normal">Active in strategy rules & charts</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-mono">Presets:</span>
                  <button
                    onClick={() => applyEmaPreset([20, 50, 200])}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700"
                  >
                    Classic (20/50/200)
                  </button>
                  <button
                    onClick={() => applyEmaPreset([9, 21, 55])}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700"
                  >
                    Scalping (9/21/55)
                  </button>
                  <button
                    onClick={() => applyEmaPreset([50, 200])}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700"
                  >
                    Golden Cross (50/200)
                  </button>
                  <button
                    onClick={() => applyEmaPreset([8, 13, 21, 55, 89])}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700"
                  >
                    Fibonacci
                  </button>
                </div>
              </div>

              {/* Active EMA Badges & Input */}
              <div className="flex flex-wrap items-center gap-2 p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                {indicatorConfig.emas.map((period) => (
                  <div
                    key={period}
                    className="flex items-center gap-1.5 bg-blue-600/20 text-cyan-300 border border-blue-500/40 px-2.5 py-1 rounded-md text-xs font-mono font-bold"
                  >
                    <span>EMA {period}</span>
                    <button
                      onClick={() => handleRemoveEma(period)}
                      className="text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded p-0.5 transition-colors"
                      title="Remove this EMA"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                <div className="flex items-center gap-1 ml-2">
                  <input
                    type="number"
                    min="2"
                    max="500"
                    placeholder="Period (e.g. 10)"
                    value={newEmaInput}
                    onChange={(e) => setNewEmaInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddEma();
                      }
                    }}
                    className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 font-mono focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={handleAddEma}
                    className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold transition-colors"
                  >
                    + Add EMA
                  </button>
                </div>
              </div>
            </div>

            {/* SMA Periods Configuration */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <span>Simple Moving Averages (SMA)</span>
                  <span className="text-[10px] text-slate-500 font-normal">Active in strategy rules</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-mono">Presets:</span>
                  <button
                    onClick={() => applySmaPreset([20, 50, 200])}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700"
                  >
                    Classic (20/50/200)
                  </button>
                  <button
                    onClick={() => applySmaPreset([50, 100, 200])}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700"
                  >
                    Institutional (50/100/200)
                  </button>
                  <button
                    onClick={() => applySmaPreset([10, 20, 30])}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700"
                  >
                    Short-Term (10/20/30)
                  </button>
                </div>
              </div>

              {/* Active SMA Badges & Input */}
              <div className="flex flex-wrap items-center gap-2 p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                {(indicatorConfig.smas || [20, 50, 200]).map((period) => (
                  <div
                    key={`sma-${period}`}
                    className="flex items-center gap-1.5 bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-md text-xs font-mono font-bold"
                  >
                    <span>SMA {period}</span>
                    <button
                      onClick={() => handleRemoveSma(period)}
                      className="text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded p-0.5 transition-colors"
                      title="Remove this SMA"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                <div className="flex items-center gap-1 ml-2">
                  <input
                    type="number"
                    min="2"
                    max="500"
                    placeholder="Period (e.g. 50)"
                    value={newSmaInput}
                    onChange={(e) => setNewSmaInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSma();
                      }
                    }}
                    className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    onClick={handleAddSma}
                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-colors"
                  >
                    + Add SMA
                  </button>
                </div>
              </div>
            </div>

            {/* Other Indicators Grid (RSI, MACD, Bollinger, Stochastic, ATR, ADX, Ichimoku) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* RSI Configuration */}
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-amber-400 flex items-center justify-between">
                  <span>Relative Strength Index (RSI)</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400">Period</label>
                    <input
                      type="number"
                      min="2"
                      max="100"
                      value={indicatorConfig.rsi.period}
                      onChange={(e) =>
                        updateIndicatorConfig({
                          ...indicatorConfig,
                          rsi: { ...indicatorConfig.rsi, period: Number(e.target.value) || 14 },
                        })
                      }
                      className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-amber-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Overbought</label>
                    <input
                      type="number"
                      min="50"
                      max="95"
                      value={indicatorConfig.rsi.overbought}
                      onChange={(e) =>
                        updateIndicatorConfig({
                          ...indicatorConfig,
                          rsi: { ...indicatorConfig.rsi, overbought: Number(e.target.value) || 70 },
                        })
                      }
                      className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-red-400 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Oversold</label>
                    <input
                      type="number"
                      min="5"
                      max="50"
                      value={indicatorConfig.rsi.oversold}
                      onChange={(e) =>
                        updateIndicatorConfig({
                          ...indicatorConfig,
                          rsi: { ...indicatorConfig.rsi, oversold: Number(e.target.value) || 30 },
                        })
                      }
                      className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-emerald-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* MACD Configuration */}
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-cyan-400 flex items-center justify-between">
                  <span>MACD (Trend & Divergence)</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400">Fast EMA</label>
                    <input
                      type="number"
                      min="2"
                      max="100"
                      value={indicatorConfig.macd?.fast ?? 12}
                      onChange={(e) =>
                        updateIndicatorConfig({
                          ...indicatorConfig,
                          macd: { ...(indicatorConfig.macd || { fast: 12, slow: 26, signal: 9 }), fast: Number(e.target.value) || 12 },
                        })
                      }
                      className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-cyan-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Slow EMA</label>
                    <input
                      type="number"
                      min="5"
                      max="200"
                      value={indicatorConfig.macd?.slow ?? 26}
                      onChange={(e) =>
                        updateIndicatorConfig({
                          ...indicatorConfig,
                          macd: { ...(indicatorConfig.macd || { fast: 12, slow: 26, signal: 9 }), slow: Number(e.target.value) || 26 },
                        })
                      }
                      className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-cyan-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Signal</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={indicatorConfig.macd?.signal ?? 9}
                      onChange={(e) =>
                        updateIndicatorConfig({
                          ...indicatorConfig,
                          macd: { ...(indicatorConfig.macd || { fast: 12, slow: 26, signal: 9 }), signal: Number(e.target.value) || 9 },
                        })
                      }
                      className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-cyan-300 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Bollinger Bands Configuration */}
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-purple-400 flex items-center justify-between">
                  <span>Bollinger Bands (Volatility)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400">Lookback Period</label>
                    <input
                      type="number"
                      min="5"
                      max="100"
                      value={indicatorConfig.bollinger?.period ?? 20}
                      onChange={(e) =>
                        updateIndicatorConfig({
                          ...indicatorConfig,
                          bollinger: { ...(indicatorConfig.bollinger || { period: 20, stdDev: 2.0 }), period: Number(e.target.value) || 20 },
                        })
                      }
                      className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-purple-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Std Dev Multiplier</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="5.0"
                      value={indicatorConfig.bollinger?.stdDev ?? 2.0}
                      onChange={(e) =>
                        updateIndicatorConfig({
                          ...indicatorConfig,
                          bollinger: { ...(indicatorConfig.bollinger || { period: 20, stdDev: 2.0 }), stdDev: Number(e.target.value) || 2.0 },
                        })
                      }
                      className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-purple-300 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Stochastic Oscillator Configuration */}
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-rose-400 flex items-center justify-between">
                  <span>Stochastic Oscillator (%K / %D)</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400">%K Period</label>
                    <input
                      type="number"
                      min="2"
                      max="100"
                      value={indicatorConfig.stoch?.kPeriod ?? 14}
                      onChange={(e) =>
                        updateIndicatorConfig({
                          ...indicatorConfig,
                          stoch: { ...(indicatorConfig.stoch || { kPeriod: 14, dPeriod: 3, smooth: 3 }), kPeriod: Number(e.target.value) || 14 },
                        })
                      }
                      className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-rose-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">%D Period</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={indicatorConfig.stoch?.dPeriod ?? 3}
                      onChange={(e) =>
                        updateIndicatorConfig({
                          ...indicatorConfig,
                          stoch: { ...(indicatorConfig.stoch || { kPeriod: 14, dPeriod: 3, smooth: 3 }), dPeriod: Number(e.target.value) || 3 },
                        })
                      }
                      className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-rose-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Smooth</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={indicatorConfig.stoch?.smooth ?? 3}
                      onChange={(e) =>
                        updateIndicatorConfig({
                          ...indicatorConfig,
                          stoch: { ...(indicatorConfig.stoch || { kPeriod: 14, dPeriod: 3, smooth: 3 }), smooth: Number(e.target.value) || 3 },
                        })
                      }
                      className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-rose-300 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* ATR & ADX Configuration */}
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-emerald-400 flex items-center justify-between">
                  <span>ATR & ADX (Volatility / Trend)</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400">ATR Period</label>
                    <input
                      type="number"
                      min="2"
                      max="100"
                      value={indicatorConfig.atr.period}
                      onChange={(e) =>
                        updateIndicatorConfig({
                          ...indicatorConfig,
                          atr: { ...indicatorConfig.atr, period: Number(e.target.value) || 14 },
                        })
                      }
                      className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-emerald-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">ADX Period</label>
                    <input
                      type="number"
                      min="2"
                      max="100"
                      value={indicatorConfig.adx?.period ?? 14}
                      onChange={(e) =>
                        updateIndicatorConfig({
                          ...indicatorConfig,
                          adx: { ...(indicatorConfig.adx || { period: 14, threshold: 25 }), period: Number(e.target.value) || 14 },
                        })
                      }
                      className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-emerald-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">ADX Trend Level</label>
                    <input
                      type="number"
                      min="10"
                      max="50"
                      value={indicatorConfig.adx?.threshold ?? 25}
                      onChange={(e) =>
                        updateIndicatorConfig({
                          ...indicatorConfig,
                          adx: { ...(indicatorConfig.adx || { period: 14, threshold: 25 }), threshold: Number(e.target.value) || 25 },
                        })
                      }
                      className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-emerald-300 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Ichimoku Cloud Configuration */}
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-indigo-400 flex items-center justify-between">
                  <span>Ichimoku Cloud Periods</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400">Tenkan (Conversion)</label>
                    <input
                      type="number"
                      value={indicatorConfig.ichimoku.tenkan}
                      onChange={(e) =>
                        updateIndicatorConfig({
                          ...indicatorConfig,
                          ichimoku: { ...indicatorConfig.ichimoku, tenkan: Number(e.target.value) || 9 },
                        })
                      }
                      className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-indigo-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Kijun (Base)</label>
                    <input
                      type="number"
                      value={indicatorConfig.ichimoku.kijun}
                      onChange={(e) =>
                        updateIndicatorConfig({
                          ...indicatorConfig,
                          ichimoku: { ...indicatorConfig.ichimoku, kijun: Number(e.target.value) || 26 },
                        })
                      }
                      className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-indigo-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Senkou B (Leading)</label>
                    <input
                      type="number"
                      value={indicatorConfig.ichimoku.senkou}
                      onChange={(e) =>
                        updateIndicatorConfig({
                          ...indicatorConfig,
                          ichimoku: { ...indicatorConfig.ichimoku, senkou: Number(e.target.value) || 52 },
                        })
                      }
                      className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-indigo-300 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Visual Builder Tab */}
        {activeTab === 'visual' && (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Condition Group Match:</span>
                <div className="flex bg-slate-900 rounded border border-slate-700 p-0.5 text-xs font-mono">
                  <button
                    onClick={() => setCombinator('and')}
                    className={`px-2 py-0.5 rounded font-bold ${
                      combinator === 'and' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    AND (All must match)
                  </button>
                  <button
                    onClick={() => setCombinator('or')}
                    className={`px-2 py-0.5 rounded font-bold ${
                      combinator === 'or' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    OR (Any can match)
                  </button>
                </div>
              </div>

              <button
                onClick={addRule}
                className="px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-mono text-xs transition-colors flex items-center gap-1"
              >
                + Add Technical Rule
              </button>
            </div>

            {/* Rule Rows */}
            <div className="space-y-2.5">
              {rules.map((rule, idx) => (
                <div
                  key={rule.id}
                  className="flex items-center gap-2.5 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-xs font-mono"
                >
                  <span className="text-slate-500 text-[11px] w-5 text-center">#{idx + 1}</span>

                  {/* Left Indicator Field */}
                  <select
                    value={rule.field}
                    onChange={(e) => updateRule(rule.id, { field: e.target.value })}
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:border-blue-500 focus:outline-none"
                  >
                    {availableFields.map((grp) => (
                      <optgroup key={grp.group} label={grp.group}>
                        {grp.items.map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>

                  {/* Relational Operator */}
                  <select
                    value={rule.operator}
                    onChange={(e) => updateRule(rule.id, { operator: e.target.value })}
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-300 font-bold focus:border-blue-500 focus:outline-none"
                  >
                    <option value=">">&gt; (Greater)</option>
                    <option value="<">&lt; (Less)</option>
                    <option value=">=">&gt;= (Greater/Equal)</option>
                    <option value="<=">&lt;= (Less/Equal)</option>
                    <option value="==">== (Equal)</option>
                    <option value="!=">!= (Not Equal)</option>
                  </select>

                  {/* Value Source Toggle (Field vs Constant) */}
                  <button
                    onClick={() =>
                      updateRule(rule.id, {
                        valueSource: rule.valueSource === 'field' ? 'value' : 'field',
                        value: rule.valueSource === 'field' ? '50' : 'Ema50',
                      })
                    }
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px]"
                    title="Toggle between comparing against another indicator or a static number"
                  >
                    {rule.valueSource === 'field' ? '⚡ Field' : '# Value'}
                  </button>

                  {/* Right Target */}
                  {rule.valueSource === 'field' ? (
                    <select
                      value={rule.value}
                      onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                      className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-cyan-400 font-semibold focus:border-blue-500 focus:outline-none"
                    >
                      {availableFields.map((grp) => (
                        <optgroup key={grp.group} label={grp.group}>
                          {grp.items.map((item) => (
                            <option key={item} value={item}>{item}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={rule.value}
                      onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                      className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-amber-400 font-semibold w-24 focus:border-blue-500 focus:outline-none"
                    />
                  )}

                  {/* Remove Button */}
                  <button
                    onClick={() => removeRule(rule.id)}
                    className="ml-auto text-slate-500 hover:text-red-400 px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* JSON Preview Tab */}
        {activeTab === 'json' && (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs">
            <div className="text-slate-400 mb-2 font-semibold">
              Live React Query Builder Schema (Directly compiled by backend JsonStrategyCompiler):
            </div>
            <pre className="p-3 bg-slate-900 rounded border border-slate-800 text-blue-300 overflow-x-auto">
              {compiledJson}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
