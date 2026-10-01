import React, { useState } from 'react';
import { StrategyDefinition, Timeframe } from '../types/trading';

interface RuleStudioProps {
  strategies: StrategyDefinition[];
  onSaveStrategy: (strategy: any) => Promise<void>;
  onDeleteStrategy: (id: string) => Promise<void>;
}

interface RuleItem {
  id: string;
  field: string;
  operator: string;
  value: string;
  valueSource: 'value' | 'field';
}

const AVAILABLE_FIELDS = [
  { group: 'Price Action', items: ['Close', 'Open', 'High', 'Low', 'Volume'] },
  { group: 'Moving Averages', items: ['Ema20', 'Ema50', 'Ema200'] },
  { group: 'Momentum & Volatility', items: ['Rsi14', 'Atr14'] },
  { group: 'Ichimoku Cloud', items: ['IchimokuSpanA', 'IchimokuSpanB', 'IchimokuTenkan', 'IchimokuKijun', 'IchimokuChikou'] },
  { group: 'Candle Geometry', items: ['UpperWickRatio', 'LowerWickRatio', 'BodyRatio'] },
];

export const RuleStudio: React.FC<RuleStudioProps> = ({
  strategies,
  onSaveStrategy,
  onDeleteStrategy,
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyDefinition | null>(
    strategies[0] || null
  );

  const [name, setName] = useState('NewStrategy');
  const [description, setDescription] = useState('Quantitative strategy');
  const [timeframe, setTimeframe] = useState<Timeframe>('M5');
  const [autoTrading, setAutoTrading] = useState(true);
  const [aiValidation, setAiValidation] = useState(false);
  const [combinator, setCombinator] = useState<'and' | 'or'>('and');

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

  // Compile visual state to React Query Builder JSON schema
  const compiledJson = JSON.stringify(
    {
      combinator,
      rules: rules.map((r) => ({
        field: r.field,
        operator: r.operator,
        value: r.valueSource === 'value' ? Number(r.value) || r.value : r.value,
        valueSource: r.valueSource,
      })),
    },
    null,
    2
  );

  const handleSave = async () => {
    await onSaveStrategy({
      name,
      description,
      timeframe,
      rawJsonRules: compiledJson,
      autoTradingEnabled: autoTrading,
      aiValidationEnabled: aiValidation,
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-full">
      {/* Studio Header */}
      <div className="h-12 px-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm text-slate-100">Dynamic Strategy Studio</span>
          <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-mono">
            React Query Builder ⇄ RulesEngine
          </span>
        </div>

        <div className="flex items-center gap-2">
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
            onClick={handleSave}
            className="px-3.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors"
          >
            Save Strategy
          </button>
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
              {['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'].map((tf) => (
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
                    {AVAILABLE_FIELDS.map((grp) => (
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
                      {AVAILABLE_FIELDS.map((grp) => (
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
