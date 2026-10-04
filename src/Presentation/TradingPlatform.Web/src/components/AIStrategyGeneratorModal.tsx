import React, { useState } from 'react';
import { Sparkles, Wand2, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, X, Layers, Clock, Zap } from 'lucide-react';
import { GeneratedStrategyResult, Timeframe } from '../types/trading';
import { tradingApi } from '../api/tradingClient';

interface AIStrategyGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyStrategy: (generated: GeneratedStrategyResult) => void;
  initialTimeframe?: Timeframe;
}

const PRESET_PROMPTS = [
  {
    title: '🚀 Trend Pullback Momentum',
    prompt: 'Create a trend-following pullback strategy on M15 that buys when price trades above the 200 EMA, pulls back to the 50 EMA, and RSI is above 48 with a bullish confirmation candle.',
    tf: 'M15' as Timeframe,
  },
  {
    title: '⚡ Ichimoku Cloud Breakout',
    prompt: 'Create an Ichimoku Cloud breakout strategy on M5 that buys when price closes cleanly above Span A and the 50 EMA with RSI above 52.',
    tf: 'M5' as Timeframe,
  },
  {
    title: '🛡️ Oversold Mean Reversion',
    prompt: 'Create a high-probability mean reversion strategy on M15 that buys when RSI drops below 30 and prints a candlestick with a lower wick ratio above 0.35.',
    tf: 'M15' as Timeframe,
  },
  {
    title: '💥 Volatility Expansion Breakout',
    prompt: 'Create a fast breakout strategy on M5 that goes long when price breaks above the 20 EMA while the 20 EMA is stacked above the 50 EMA and RSI is above 58.',
    tf: 'M5' as Timeframe,
  },
];

export const AIStrategyGeneratorModal: React.FC<AIStrategyGeneratorModalProps> = ({
  isOpen,
  onClose,
  onApplyStrategy,
  initialTimeframe = 'M15',
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedTf, setSelectedTf] = useState<Timeframe>(initialTimeframe);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<GeneratedStrategyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (customPrompt?: string) => {
    const textToUse = customPrompt || prompt;
    if (!textToUse.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await tradingApi.generateStrategyAi(textToUse, selectedTf);
      setGeneratedResult(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate strategy. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (generatedResult) {
      onApplyStrategy(generatedResult);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/40">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                AI Strategy Architect
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  Natural Language
                </span>
              </h2>
              <p className="text-xs text-slate-400">Describe your trading idea in plain English and let AI engineer the exact quantitative rules.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Quick Presets */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Popular Strategy Templates (1-Click)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_PROMPTS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(item.prompt);
                    setSelectedTf(item.tf);
                    handleGenerate(item.prompt);
                  }}
                  className="text-left p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-cyan-500/50 hover:bg-slate-800 transition-all text-xs group"
                >
                  <div className="font-semibold text-slate-200 group-hover:text-cyan-400 flex items-center justify-between">
                    <span>{item.title}</span>
                    <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-900">{item.tf}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{item.prompt}</p>
                </button>
              ))}
            </div>
          </div>

          {/* User Prompt Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
                Describe Your Strategy
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Timeframe:</span>
                <select
                  value={selectedTf}
                  onChange={(e) => setSelectedTf(e.target.value as Timeframe)}
                  className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2 py-1 outline-none focus:border-cyan-500"
                >
                  {(['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'] as Timeframe[]).map((tf) => (
                    <option key={tf} value={tf}>{tf}</option>
                  ))}
                </select>
              </div>
            </div>

            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. When price is above the 200 EMA, wait for a pullback to the 50 EMA and enter long when RSI is oversold (< 40) and price prints a bullish candle..."
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none font-sans"
            />

            <div className="flex justify-end">
              <button
                disabled={isLoading || !prompt.trim()}
                onClick={() => handleGenerate()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-cyan-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Synthesizing Rules with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate Strategy Rules
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/80 flex items-center gap-2.5 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Generated Result Preview */}
          {generatedResult && (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-cyan-500/30 space-y-3.5 animate-in fade-in duration-300">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-cyan-300 tracking-wide">{generatedResult.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      {generatedResult.timeframe}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">{generatedResult.plainEnglishSummary}</p>
                </div>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>

              {/* Trigger Points */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Rule Execution Pipeline:</span>
                <div className="space-y-1">
                  {generatedResult.triggerConditions.map((cond, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-200 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                      <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{cond}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Indicators Utilized */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {generatedResult.recommendedIndicators.map((ind, i) => (
                  <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                    {ind}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!generatedResult}
            onClick={handleApply}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Load into Rule Studio
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
