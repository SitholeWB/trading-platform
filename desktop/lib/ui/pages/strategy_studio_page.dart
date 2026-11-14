import 'dart:convert';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../models/trading_models.dart';
import '../../services/ai_copilot_service.dart';
import '../../services/indicator_engine.dart';
import '../../services/localization_service.dart';
import '../../services/market_data_service.dart';
import '../../services/strategy_scanner.dart';
import '../../services/symbol_catalog.dart';
import '../widgets/markdown_message_view.dart';

class StrategyStudioPage extends StatefulWidget {
  final List<StrategyDefinition> strategies;
  final MarketDataService marketData;
  final AiCopilotService? copilot;
  final ValueChanged<StrategyDefinition> onSaveStrategy;
  final ValueChanged<String> onDeleteStrategy;
  final ValueChanged<StrategyDefinition> onRunEvaluation;

  const StrategyStudioPage({
    super.key,
    required this.strategies,
    required this.marketData,
    this.copilot,
    required this.onSaveStrategy,
    required this.onDeleteStrategy,
    required this.onRunEvaluation,
  });

  @override
  State<StrategyStudioPage> createState() => _StrategyStudioPageState();
}

class _StrategyStudioPageState extends State<StrategyStudioPage> {
  static const List<String> _indicators = [
    'EMA_CROSS',
    'SMA_CROSS',
    'EMA_TREND',
    'RSI_OS',
    'RSI_OB',
    'MACD_CROSS',
    'BB_BREAK',
    'SUPERTREND',
    'VWAP_CROSS',
    'ICHIMOKU_BULL',
    'ADX_TREND',
    'SESSION_UTC',
    'DONCHIAN_BREAK',
    'ENGULFING',
    'PIN_BAR',
    'VOLUME_SPIKE',
    'ATR_VOLATILITY',
  ];

  static const Map<String, String> _universes = {
    'SINGLE': 'Single Symbol',
    'MAJORS': 'Major Forex (7)',
    'FOREX': 'All Forex',
    'METALS': 'Metals & Energy',
    'CRYPTO': 'Crypto',
    'INDICES': 'Indices',
    'STOCKS': 'Stocks',
    'CUSTOM': 'Custom List',
  };

  static const List<String> _conditions = [
    'CrossAbove',
    'CrossBelow',
    'LessThan',
    'GreaterThan',
  ];

  String? _selectedId;
  bool _isCreatingNew = false;
  int _activeTab = 0; // 0 = Visual Builder, 1 = JSON Preview, 2 = Test & Results
  String _combinator = 'AND';
  String? _statusBanner;
  bool _statusIsWarning = false;
  int _testLookbackBars = 500;
  bool _testing = false;
  bool _scanning = false;
  String? _validatingSymbol;
  StrategyBacktestResult? _testResult;
  MultiSymbolBacktestResult? _multiBtResult;
  List<StrategyScanHit> _scanHits = [];
  final Map<String, String> _hitOpinions = {};

  late final TextEditingController _nameCtrl;
  late final TextEditingController _descCtrl;
  String _symbol = 'EURUSD';
  String _scanUniverse = 'SINGLE';
  List<String> _scanSymbols = [];
  Timeframe _timeframe = Timeframe.m15;
  bool _isEnabled = true;
  bool _autoTrade = true;
  double _riskPercent = 1.0;
  double _slMult = 1.5;
  double _tpMult = 3.0;
  List<StrategyRule> _rules = [];
  StrategyRuleGroup _rootGroup = const StrategyRuleGroup();
  List<StrategyRule> _exitRules = [];
  String _directionMode = 'LongOnly';
  Timeframe? _htfTimeframe;
  String _htfIndicator = 'EMA_TREND';
  int _htfPeriod = 200;
  double _breakEvenR = 0.0;
  double _trailingAtrMult = 0.0;
  int _maxHoldBars = 0;
  int _cooldownBarsAfterSl = 0;
  double _spreadBps = 1.0;

  @override
  void initState() {
    super.initState();
    _nameCtrl = TextEditingController();
    _descCtrl = TextEditingController();
    if (widget.strategies.isNotEmpty) {
      _loadStrategy(widget.strategies.first);
    } else {
      _startNewStrategy();
    }
  }

  @override
  void didUpdateWidget(covariant StrategyStudioPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!_isCreatingNew && _selectedId != null) {
      final stillExists = widget.strategies.any((s) => s.id == _selectedId);
      if (!stillExists) {
        if (widget.strategies.isNotEmpty) {
          _loadStrategy(widget.strategies.first);
        } else {
          _startNewStrategy();
        }
      }
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  void _loadStrategy(StrategyDefinition s) {
    setState(() {
      _isCreatingNew = false;
      _selectedId = s.id;
      _statusBanner = null;
      _statusIsWarning = false;
      _nameCtrl.text = s.name;
      _descCtrl.text = s.description;
      _symbol = SymbolCatalog.allSymbols.any((x) => x.symbol == s.symbol)
          ? s.symbol
          : 'EURUSD';
      _scanUniverse = _universes.containsKey(s.scanUniverse.toUpperCase())
          ? s.scanUniverse.toUpperCase()
          : 'SINGLE';
      _scanSymbols = List<String>.from(s.scanSymbols);
      _timeframe = s.timeframe;
      _isEnabled = s.isEnabled;
      _autoTrade = s.autoTrade;
      _combinator = s.effectiveRuleGroup.combinator;
      _riskPercent = s.riskPercent.clamp(0.25, 5.0);
      _slMult = s.stopLossAtrMult.clamp(0.5, 4.0);
      _tpMult = s.takeProfitAtrMult.clamp(1.0, 8.0);
      _rootGroup = s.effectiveRuleGroup;
      _rules = List<StrategyRule>.from(_rootGroup.flattenRules());
      _exitRules = List<StrategyRule>.from(s.exitRules);
      _directionMode = s.directionMode;
      _htfTimeframe = s.htfTimeframe;
      _htfIndicator = s.htfIndicator;
      _htfPeriod = s.htfPeriod;
      _breakEvenR = s.breakEvenR;
      _trailingAtrMult = s.trailingAtrMult;
      _maxHoldBars = s.maxHoldBars;
      _cooldownBarsAfterSl = s.cooldownBarsAfterSl;
      _spreadBps = s.spreadBps;
      _testResult = null;
      _multiBtResult = null;
      _scanHits = [];
      _hitOpinions.clear();
      _testing = false;
      _scanning = false;
    });
  }

  void _startNewStrategy() {
    setState(() {
      _isCreatingNew = true;
      _selectedId = 'strat_${DateTime.now().millisecondsSinceEpoch}';
      _statusBanner = null;
      _statusIsWarning = false;
      _testResult = null;
      _multiBtResult = null;
      _scanHits = [];
      _hitOpinions.clear();
      _testing = false;
      _scanning = false;
      _nameCtrl.text = 'Custom Momentum Strategy';
      _descCtrl.text = 'Quantitative multi-indicator rule';
      _symbol = 'EURUSD';
      _scanUniverse = 'SINGLE';
      _scanSymbols = [];
      _timeframe = Timeframe.m15;
      _isEnabled = true;
      _autoTrade = true;
      _combinator = 'AND';
      _riskPercent = 1.0;
      _slMult = 1.5;
      _tpMult = 3.0;
      _rules = const [
        StrategyRule(
          indicator: 'RSI_OS',
          condition: 'LessThan',
          threshold: 35,
          period: 14,
        ),
      ];
      _rootGroup = StrategyRuleGroup(combinator: 'AND', rules: _rules);
      _exitRules = [];
      _directionMode = 'LongOnly';
      _htfTimeframe = null;
      _htfIndicator = 'EMA_TREND';
      _htfPeriod = 200;
      _breakEvenR = 0.0;
      _trailingAtrMult = 0.0;
      _maxHoldBars = 0;
      _cooldownBarsAfterSl = 0;
      _spreadBps = 1.0;
    });
  }

  StrategyDefinition _buildCurrentDraft() {
    final id = _selectedId ?? 'strat_${DateTime.now().millisecondsSinceEpoch}';
    final syncedGroup = _rootGroup.copyWith(combinator: _combinator);
    return StrategyDefinition(
      id: id,
      name: _nameCtrl.text.trim().isEmpty
          ? 'Unnamed Strategy'
          : _nameCtrl.text.trim(),
      description: _descCtrl.text.trim(),
      symbol: _symbol,
      timeframe: _timeframe,
      isEnabled: _isEnabled,
      autoTrade: _autoTrade,
      combinator: _combinator,
      riskPercent: _riskPercent,
      stopLossAtrMult: _slMult,
      takeProfitAtrMult: _tpMult,
      entryRules: syncedGroup.flattenRules(),
      rootRuleGroup: syncedGroup,
      exitRules: List<StrategyRule>.from(_exitRules),
      directionMode: _directionMode,
      htfTimeframe: _htfTimeframe,
      htfIndicator: _htfIndicator,
      htfPeriod: _htfPeriod,
      breakEvenR: _breakEvenR,
      trailingAtrMult: _trailingAtrMult,
      maxHoldBars: _maxHoldBars,
      cooldownBarsAfterSl: _cooldownBarsAfterSl,
      spreadBps: _spreadBps,
      scanUniverse: _scanUniverse,
      scanSymbols: List<String>.from(_scanSymbols),
    );
  }

  void _saveCurrent() {
    final strat = _buildCurrentDraft();
    widget.onSaveStrategy(strat);
    setState(() {
      _isCreatingNew = false;
      _selectedId = strat.id;
      _statusBanner = 'Saved "${strat.name}"';
    });
  }

  Future<void> _showAiGeneratorDialog() async {
    final promptCtrl = TextEditingController();
    String selectedSym = _symbol;
    Timeframe selectedTf = _timeframe;
    bool compiling = false;
    String? compileError;

    const presets = [
      'Major FX H1 with H4 200 EMA trend filter: ADX >= 20 AND (RSI < 35 OR Bullish Engulfing). Both directions, 1R break-even, 1.5x ATR trailing stop',
      'Crypto H4 breakout: Donchian(20) breakout AND Volume >= 1.5x AND (MACD cross OR Supertrend). 2R TP, 3-bar SL cooldown',
      'Metals M15 London session (7-16 UTC): Price > VWAP AND (Pin Bar OR RSI < 32), 1.5x ATR SL',
    ];

    final aiProvider = widget.copilot?.storage.aiProvider ?? 'BuiltIn';
    final hasKey = widget.copilot?.storage.aiApiKey.trim().isNotEmpty ?? false;
    final needsKey =
        aiProvider != 'BuiltIn' && aiProvider != 'Ollama' && !hasKey;
    final isLimitedBuiltIn = aiProvider == 'BuiltIn' || needsKey;

    final compileRes = await showDialog<StrategyCompileResult>(
      context: context,
      barrierDismissible: !compiling,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setS) => AlertDialog(
          title: Row(
            children: [
              const Icon(Icons.auto_awesome, color: Color(0xFFA855F7), size: 20),
              const SizedBox(width: 8),
              Text(AppL10n.tr(
                  'strat.aiCompilerTitle', 'Plain-Text AI Strategy Compiler')),
            ],
          ),
          content: SizedBox(
            width: 560,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (isLimitedBuiltIn)
                  Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF59E0B).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: const Color(0xFFF59E0B).withValues(alpha: 0.5),
                      ),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.warning_amber_rounded,
                            size: 18, color: Color(0xFFF59E0B)),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            aiProvider == 'BuiltIn'
                                ? 'Built-in Keyword Compiler Active: It only matches simple keywords and CANNOT understand complex nested (A AND B) AND (C OR D) rules. Configure Gemini, OpenAI, Anthropic, or Ollama in Settings for full AI compilation.'
                                : 'No API key configured for $aiProvider — falling back to the limited Built-in Keyword Compiler. Add your API key in Settings for full nested AI compilation.',
                            style: const TextStyle(
                                fontSize: 11.5, color: Color(0xFFFCD34D)),
                          ),
                        ),
                      ],
                    ),
                  )
                else
                  Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withValues(alpha: 0.10),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      'Using $aiProvider for full nested AND/OR, HTF filter, and trade-management compilation (~500 tokens, 1 call).',
                      style: const TextStyle(
                          fontSize: 11.5, color: Color(0xFF34D399)),
                    ),
                  ),
                const Text(
                  'Describe your strategy, nested AND/OR logic, risk management, and target market in plain English:',
                  style: TextStyle(fontSize: 12, color: Colors.grey),
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: presets
                      .map((p) => ActionChip(
                            label: Text(p, style: const TextStyle(fontSize: 11)),
                            onPressed: compiling
                                ? null
                                : () => promptCtrl.text = p,
                          ))
                      .toList(),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: promptCtrl,
                  maxLines: 3,
                  enabled: !compiling,
                  decoration: const InputDecoration(
                    labelText: 'Plain-Text Strategy & Universe',
                    hintText:
                        'e.g. Scan only major pairs on H1 when price > 200 EMA and RSI < 35...',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        initialValue: selectedSym,
                        decoration: const InputDecoration(
                          labelText: 'Fallback Symbol',
                          border: OutlineInputBorder(),
                          isDense: true,
                        ),
                        items: SymbolCatalog.allSymbols
                            .map((s) => DropdownMenuItem(
                                  value: s.symbol,
                                  child: Text(s.symbol),
                                ))
                            .toList(),
                        onChanged: compiling
                            ? null
                            : (v) {
                                if (v != null) setS(() => selectedSym = v);
                              },
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: DropdownButtonFormField<Timeframe>(
                        initialValue: selectedTf,
                        decoration: const InputDecoration(
                          labelText: 'Default Timeframe',
                          border: OutlineInputBorder(),
                          isDense: true,
                        ),
                        items: Timeframe.values
                            .map((t) => DropdownMenuItem(
                                  value: t,
                                  child: Text(t.code),
                                ))
                            .toList(),
                        onChanged: compiling
                            ? null
                            : (v) {
                                if (v != null) setS(() => selectedTf = v);
                              },
                      ),
                    ),
                  ],
                ),
                if (compileError != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    compileError!,
                    style: const TextStyle(
                      fontSize: 11,
                      color: Color(0xFFF59E0B),
                    ),
                  ),
                ],
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: compiling ? null : () => Navigator.pop(ctx),
              child: Text(AppL10n.tr('common.cancel', 'Cancel')),
            ),
            FilledButton.icon(
              icon: compiling
                  ? const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.auto_awesome, size: 16),
              label: Text(compiling ? 'Compiling...' : 'Compile Strategy'),
              onPressed: compiling
                  ? null
                  : () async {
                      final text = promptCtrl.text.trim();
                      if (text.isEmpty) {
                        setS(() =>
                            compileError = 'Enter a strategy description first.');
                        return;
                      }
                      setS(() {
                        compiling = true;
                        compileError = null;
                      });
                      final copilot = widget.copilot;
                      if (copilot != null) {
                        final res = await copilot.compileStrategyFromText(
                          text,
                          defaultSymbol: selectedSym,
                          defaultTimeframe: selectedTf,
                        );
                        if (ctx.mounted) Navigator.pop(ctx, res);
                      } else {
                        final fallback = StrategyDefinition(
                          id: 'strat_${DateTime.now().millisecondsSinceEpoch}',
                          name: 'Custom Plain-Text Strategy',
                          symbol: selectedSym,
                          timeframe: selectedTf,
                          description: text,
                          entryRules: const [
                            StrategyRule(
                              indicator: 'EMA_CROSS',
                              condition: 'CrossAbove',
                              period: 20,
                            ),
                            StrategyRule(
                              indicator: 'RSI_OS',
                              condition: 'LessThan',
                              period: 14,
                              threshold: 35,
                            ),
                          ],
                        );
                        if (ctx.mounted) {
                          Navigator.pop(
                            ctx,
                            StrategyCompileResult(
                              strategy: fallback,
                              providerUsed: 'Local Template',
                            ),
                          );
                        }
                      }
                    },
            ),
          ],
        ),
      ),
    );
    promptCtrl.dispose();

    if (compileRes != null) {
      widget.onSaveStrategy(compileRes.strategy);
      _loadStrategy(compileRes.strategy);
      setState(() {
        _statusIsWarning = compileRes.usedBuiltInFallback;
        _statusBanner =
            'Compiled "${compileRes.strategy.name}" via ${compileRes.providerUsed}'
            '${compileRes.note != null ? ' — ${compileRes.note}' : ''}';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final rr = _slMult > 0 ? (_tpMult / _slMult) : 0.0;

    return Row(
      children: [
        // Left Strategy List Sidebar
        Container(
          width: 280,
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            border: Border(
              right: BorderSide(color: Theme.of(context).dividerColor),
            ),
          ),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 12, 10, 8),
                child: Row(
                  children: [
                    Text(
                      AppL10n.tr('strat.ruleStudio', 'RULE STUDIO'),
                      style: const TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.9,
                        color: Colors.grey,
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      tooltip: AppL10n.tr(
                          'strat.aiGenerator', 'AI Strategy Generator'),
                      icon: const Icon(Icons.auto_awesome,
                          size: 18, color: Color(0xFFA855F7)),
                      onPressed: _showAiGeneratorDialog,
                    ),
                    FilledButton.icon(
                      onPressed: _startNewStrategy,
                      icon: const Icon(Icons.add, size: 15),
                      label: Text(AppL10n.tr('strat.new', 'New'),
                          style: const TextStyle(fontSize: 12)),
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 6),
                        minimumSize: Size.zero,
                      ),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.all(8),
                  itemCount: widget.strategies.length,
                  itemBuilder: (_, i) {
                    final s = widget.strategies[i];
                    final selected = !_isCreatingNew && s.id == _selectedId;
                    return Card(
                      elevation: 0,
                      margin: const EdgeInsets.only(bottom: 6),
                      color: selected
                          ? const Color(0xFF0EA5E9).withValues(alpha: 0.14)
                          : null,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                        side: BorderSide(
                          color: selected
                              ? const Color(0xFF38BDF8)
                              : Theme.of(context).dividerColor,
                        ),
                      ),
                      child: InkWell(
                        borderRadius: BorderRadius.circular(10),
                        onTap: () => _loadStrategy(s),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 8),
                          child: Row(
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: s.isEnabled
                                      ? const Color(0xFF10B981)
                                      : Colors.grey,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      s.name,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w600,
                                        fontSize: 12.5,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      '${s.symbol} · ${s.timeframe.code} · ${s.entryRules.length} rule(s)',
                                      style: const TextStyle(
                                          fontSize: 10.5, color: Colors.grey),
                                    ),
                                  ],
                                ),
                              ),
                              Switch(
                                value: s.isEnabled,
                                materialTapTargetSize:
                                    MaterialTapTargetSize.shrinkWrap,
                                onChanged: (v) {
                                  final updated = s.copyWith(isEnabled: v);
                                  widget.onSaveStrategy(updated);
                                  if (s.id == _selectedId) {
                                    setState(() => _isEnabled = v);
                                  }
                                },
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),

        // Right Split-Pane Inline Editor
        Expanded(
          child: Column(
            children: [
              // Editor Header Bar
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  border: Border(
                    bottom: BorderSide(color: Theme.of(context).dividerColor),
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      flex: 2,
                      child: TextField(
                        controller: _nameCtrl,
                        style: const TextStyle(
                            fontSize: 14, fontWeight: FontWeight.bold),
                        decoration: InputDecoration(
                          labelText: AppL10n.tr('strat.name', 'Strategy Name'),
                          border: OutlineInputBorder(),
                          isDense: true,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    SizedBox(
                      width: 130,
                      child: DropdownButtonFormField<String>(
                        initialValue: _symbol,
                        decoration: InputDecoration(
                          labelText: AppL10n.tr('strat.symbol', 'Symbol'),
                          border: OutlineInputBorder(),
                          isDense: true,
                        ),
                        items: SymbolCatalog.allSymbols
                            .map((s) => DropdownMenuItem(
                                  value: s.symbol,
                                  child: Text(s.symbol,
                                      style: const TextStyle(fontSize: 12)),
                                ))
                            .toList(),
                        onChanged: (v) {
                          if (v != null) setState(() => _symbol = v);
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    SizedBox(
                      width: 145,
                      child: DropdownButtonFormField<String>(
                        initialValue: _scanUniverse,
                        decoration: InputDecoration(
                          labelText: AppL10n.tr('strat.universe', 'Universe'),
                          border: OutlineInputBorder(),
                          isDense: true,
                        ),
                        items: _universes.entries
                            .map((e) => DropdownMenuItem(
                                  value: e.key,
                                  child: Text(e.value,
                                      style: const TextStyle(fontSize: 12)),
                                ))
                            .toList(),
                        onChanged: (v) {
                          if (v != null) setState(() => _scanUniverse = v);
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    SizedBox(
                      width: 100,
                      child: DropdownButtonFormField<Timeframe>(
                        initialValue: _timeframe,
                        decoration: InputDecoration(
                          labelText: AppL10n.tr('strat.tf', 'TF'),
                          border: OutlineInputBorder(),
                          isDense: true,
                        ),
                        items: Timeframe.values
                            .map((t) => DropdownMenuItem(
                                  value: t,
                                  child: Text(t.code,
                                      style: const TextStyle(fontSize: 12)),
                                ))
                            .toList(),
                        onChanged: (v) {
                          if (v != null) setState(() => _timeframe = v);
                        },
                      ),
                    ),
                    const SizedBox(width: 10),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(AppL10n.tr('strat.active', 'Active'),
                            style: const TextStyle(fontSize: 12)),
                        Switch(
                          value: _isEnabled,
                          onChanged: (v) => setState(() => _isEnabled = v),
                        ),
                      ],
                    ),
                    const SizedBox(width: 6),
                    Tooltip(
                      message:
                          'Auto-execute demo trades when all rules align on live/simulated bars',
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(AppL10n.tr('strat.autoTrade', 'Auto-Trade'),
                              style: const TextStyle(fontSize: 12)),
                          Switch(
                            value: _autoTrade,
                            onChanged: (v) => setState(() => _autoTrade = v),
                          ),
                        ],
                      ),
                    ),
                    if (_activeTab != 2) ...[
                      const SizedBox(width: 8),
                      OutlinedButton.icon(
                        onPressed: _testing ? null : _runPeriodTest,
                        icon: _testing
                            ? const SizedBox(
                                width: 14,
                                height: 14,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Icon(Icons.play_arrow, size: 16),
                        label: Text(AppL10n.tr(
                            'strat.testStrategy', 'Test Strategy')),
                      ),
                    ],
                    const SizedBox(width: 8),
                    FilledButton.icon(
                      onPressed: _saveCurrent,
                      icon: const Icon(Icons.save, size: 16),
                      label: Text(AppL10n.tr('common.save', 'Save')),
                    ),
                    if (!_isCreatingNew && _selectedId != null) ...[
                      const SizedBox(width: 6),
                      IconButton(
                        tooltip:
                            AppL10n.tr('strat.delete', 'Delete Strategy'),
                        icon: const Icon(Icons.delete_outline,
                            color: Colors.redAccent),
                        onPressed: () => widget.onDeleteStrategy(_selectedId!),
                      ),
                    ],
                  ],
                ),
              ),

              if (_statusBanner != null)
                Container(
                  width: double.infinity,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  color: (_statusIsWarning
                          ? const Color(0xFFF59E0B)
                          : const Color(0xFF10B981))
                      .withValues(alpha: 0.14),
                  child: Row(
                    children: [
                      Icon(
                        _statusIsWarning
                            ? Icons.warning_amber_rounded
                            : Icons.check_circle_outline,
                        size: 15,
                        color: _statusIsWarning
                            ? const Color(0xFFF59E0B)
                            : const Color(0xFF10B981),
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          _statusBanner!,
                          style: TextStyle(
                            fontSize: 12,
                            color: _statusIsWarning
                                ? const Color(0xFFFCD34D)
                                : const Color(0xFF10B981),
                          ),
                        ),
                      ),
                      InkWell(
                        onTap: () => setState(() {
                          _statusBanner = null;
                          _statusIsWarning = false;
                        }),
                        child: const Icon(Icons.close, size: 15),
                      ),
                    ],
                  ),
                ),

              // Sub-tabs: Visual Builder | JSON Definition | Evaluation
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(color: Theme.of(context).dividerColor),
                  ),
                ),
                child: Row(
                  children: [
                    _tabChip(
                        0,
                        AppL10n.tr('strat.visualBuilder', 'Visual Builder'),
                        Icons.tune),
                    const SizedBox(width: 6),
                    _tabChip(1, AppL10n.tr('strat.jsonDef', 'JSON Definition'),
                        Icons.code),
                    const SizedBox(width: 6),
                    _tabChip(
                        2,
                        AppL10n.tr('strat.riskEval', 'Risk & Evaluation'),
                        Icons.analytics_outlined),
                    const Spacer(),
                    Text(
                      'R:R 1:${rr.toStringAsFixed(1)} · ${AppL10n.tr('dash.risk', 'Risk')} ${_riskPercent.toStringAsFixed(1)}%',
                      style: const TextStyle(
                        fontSize: 11.5,
                        fontFamily: 'monospace',
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
              ),

              Expanded(
                child: switch (_activeTab) {
                  0 => _buildVisualBuilderTab(context),
                  1 => _buildJsonPreviewTab(context),
                  _ => _buildEvaluationTab(context, rr),
                },
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _tabChip(int idx, String label, IconData icon) {
    final active = _activeTab == idx;
    return ChoiceChip(
      avatar: Icon(icon, size: 15),
      label: Text(label, style: const TextStyle(fontSize: 12)),
      selected: active,
      visualDensity: VisualDensity.compact,
      onSelected: (_) => setState(() => _activeTab = idx),
    );
  }

  Widget _buildVisualBuilderTab(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        TextField(
          controller: _descCtrl,
          decoration: InputDecoration(
            labelText: AppL10n.tr('strat.description', 'Strategy Description / Notes'),
            border: OutlineInputBorder(),
            isDense: true,
          ),
        ),
        const SizedBox(height: 14),
        // Risk & Combinator Controls
        Card(
          margin: EdgeInsets.zero,
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      AppL10n.tr(
                          'strat.riskCombinator', 'Risk & Rule Combinator'),
                      style: const TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                    const Spacer(),
                    SegmentedButton<String>(
                      segments: [
                        ButtonSegment(
                            value: 'AND',
                            label: Text(
                                AppL10n.tr('strat.allAnd', 'ALL (AND)'))),
                        ButtonSegment(
                            value: 'OR',
                            label:
                                Text(AppL10n.tr('strat.anyOr', 'ANY (OR)'))),
                      ],
                      selected: {_combinator},
                      onSelectionChanged: (v) =>
                          setState(() => _combinator = v.first),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                              '${AppL10n.tr('strat.riskPct', 'Risk %')}: ${_riskPercent.toStringAsFixed(2)}%',
                              style: const TextStyle(fontSize: 11.5)),
                          Slider(
                            value: _riskPercent,
                            min: 0.25,
                            max: 5.0,
                            divisions: 19,
                            onChanged: (v) => setState(() => _riskPercent = v),
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                              '${AppL10n.tr('strat.slAtr', 'SL ATR')}: ${_slMult.toStringAsFixed(1)}x',
                              style: const TextStyle(fontSize: 11.5)),
                          Slider(
                            value: _slMult,
                            min: 0.5,
                            max: 4.0,
                            divisions: 14,
                            onChanged: (v) => setState(() => _slMult = v),
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                              '${AppL10n.tr('strat.tpAtr', 'TP ATR')}: ${_tpMult.toStringAsFixed(1)}x',
                              style: const TextStyle(fontSize: 11.5)),
                          Slider(
                            value: _tpMult,
                            min: 1.0,
                            max: 8.0,
                            divisions: 14,
                            onChanged: (v) => setState(() => _tpMult = v),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 14),
        // Trade Management, HTF Filter & Risk Guardrails
        Card(
          margin: EdgeInsets.zero,
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  AppL10n.tr('strat.tradeMgmt',
                      'Trade Management, HTF Filter & Guardrails'),
                  style: const TextStyle(
                      fontWeight: FontWeight.bold, fontSize: 13),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        initialValue: _directionMode,
                        isDense: true,
                        decoration: InputDecoration(
                          labelText: AppL10n.tr('strat.directionMode', 'Direction Mode'),
                          border: OutlineInputBorder(),
                          isDense: true,
                        ),
                        items: [
                          DropdownMenuItem(
                              value: 'LongOnly', child: Text(AppL10n.tr('strat.longOnly', 'Long Only'))),
                          DropdownMenuItem(
                              value: 'Both',
                              child: Text(AppL10n.tr('strat.bothMirrored', 'Both (Auto-Mirrored)'))),
                          DropdownMenuItem(
                              value: 'ShortOnly', child: Text(AppL10n.tr('strat.shortOnly', 'Short Only'))),
                        ],
                        onChanged: (v) {
                          if (v != null) setState(() => _directionMode = v);
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        initialValue: _htfTimeframe?.code ?? 'NONE',
                        isDense: true,
                        decoration: InputDecoration(
                          labelText: AppL10n.tr('strat.htfFilter', 'HTF Trend Filter'),
                          border: OutlineInputBorder(),
                          isDense: true,
                        ),
                        items: [
                          DropdownMenuItem(
                              value: 'NONE', child: Text(AppL10n.tr('strat.none', 'None'))),
                          ...Timeframe.values.map((t) => DropdownMenuItem(
                              value: t.code,
                              child: Text('${t.code} Confirmation'))),
                        ],
                        onChanged: (v) {
                          setState(() {
                            _htfTimeframe = (v == null || v == 'NONE')
                                ? null
                                : Timeframe.fromCode(v);
                          });
                        },
                      ),
                    ),
                    if (_htfTimeframe != null) ...[
                      const SizedBox(width: 8),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          initialValue: _htfIndicator,
                          isDense: true,
                          decoration: InputDecoration(
                            labelText: AppL10n.tr('strat.htfIndicator', 'HTF Indicator'),
                            border: const OutlineInputBorder(),
                            isDense: true,
                          ),
                          items: const [
                            DropdownMenuItem(
                                value: 'EMA_TREND', child: Text('EMA(200)')),
                            DropdownMenuItem(
                                value: 'SUPERTREND', child: Text('Supertrend')),
                            DropdownMenuItem(
                                value: 'ICHIMOKU_BULL',
                                child: Text('Ichimoku Cloud')),
                          ],
                          onChanged: (v) {
                            if (v != null) setState(() => _htfIndicator = v);
                          },
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 12,
                  runSpacing: 8,
                  children: [
                    SizedBox(
                      width: 135,
                      child: TextFormField(
                        key: ValueKey('${_selectedId}_be'),
                        initialValue: _breakEvenR.toStringAsFixed(1),
                        keyboardType: const TextInputType.numberWithOptions(
                            decimal: true),
                        decoration: InputDecoration(
                          labelText: AppL10n.tr(
                              'strat.breakEvenR', 'Break-Even (R)'),
                          hintText: AppL10n.tr('strat.zeroOff', '0 = off'),
                          border: const OutlineInputBorder(),
                          isDense: true,
                        ),
                        onChanged: (v) {
                          final val = double.tryParse(v);
                          if (val != null && val >= 0) {
                            _breakEvenR = val.clamp(0.0, 5.0);
                          }
                        },
                      ),
                    ),
                    SizedBox(
                      width: 135,
                      child: TextFormField(
                        key: ValueKey('${_selectedId}_trail'),
                        initialValue: _trailingAtrMult.toStringAsFixed(1),
                        keyboardType: const TextInputType.numberWithOptions(
                            decimal: true),
                        decoration: InputDecoration(
                          labelText: AppL10n.tr(
                              'strat.trailingAtr', 'Trailing ATR'),
                          hintText: AppL10n.tr('strat.zeroOff', '0 = off'),
                          border: const OutlineInputBorder(),
                          isDense: true,
                        ),
                        onChanged: (v) {
                          final val = double.tryParse(v);
                          if (val != null && val >= 0) {
                            _trailingAtrMult = val.clamp(0.0, 6.0);
                          }
                        },
                      ),
                    ),
                    SizedBox(
                      width: 135,
                      child: TextFormField(
                        key: ValueKey('${_selectedId}_maxhold'),
                        initialValue: _maxHoldBars.toString(),
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: AppL10n.tr(
                              'strat.maxHoldBars', 'Max Hold Bars'),
                          hintText: AppL10n.tr('strat.zeroOff', '0 = off'),
                          border: const OutlineInputBorder(),
                          isDense: true,
                        ),
                        onChanged: (v) {
                          final val = int.tryParse(v);
                          if (val != null && val >= 0) {
                            _maxHoldBars = val.clamp(0, 500);
                          }
                        },
                      ),
                    ),
                    SizedBox(
                      width: 135,
                      child: TextFormField(
                        key: ValueKey('${_selectedId}_cool'),
                        initialValue: _cooldownBarsAfterSl.toString(),
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: AppL10n.tr(
                              'strat.slCooldownBars', 'SL Cooldown Bars'),
                          hintText: AppL10n.tr('strat.zeroOff', '0 = off'),
                          border: const OutlineInputBorder(),
                          isDense: true,
                        ),
                        onChanged: (v) {
                          final val = int.tryParse(v);
                          if (val != null && val >= 0) {
                            _cooldownBarsAfterSl = val.clamp(0, 100);
                          }
                        },
                      ),
                    ),
                    SizedBox(
                      width: 135,
                      child: TextFormField(
                        key: ValueKey('${_selectedId}_spread'),
                        initialValue: _spreadBps.toStringAsFixed(1),
                        keyboardType: const TextInputType.numberWithOptions(
                            decimal: true),
                        decoration: InputDecoration(
                          labelText:
                              AppL10n.tr('strat.spreadBps', 'Spread (bps)'),
                          border: const OutlineInputBorder(),
                          isDense: true,
                        ),
                        onChanged: (v) {
                          final val = double.tryParse(v);
                          if (val != null && val >= 0) {
                            _spreadBps = val.clamp(0.0, 25.0);
                          }
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 14),
        // Nested AND/OR Entry Rule Group Tree
        _buildRuleGroupCard(
          context,
          group: _rootGroup.copyWith(combinator: _combinator),
          pathPrefix: 'root',
          depth: 0,
          onChanged: (updated) {
            setState(() {
              _combinator = updated.combinator;
              _rootGroup = updated;
              _rules = updated.flattenRules();
            });
          },
        ),
        const SizedBox(height: 14),
        // Optional Exit Rules
        Row(
          children: [
            Text(
              AppL10n.tr(
                  'strat.optionalExit', 'Optional Exit Rules (Close Early)'),
              style:
                  const TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5),
            ),
            const Spacer(),
            OutlinedButton.icon(
              onPressed: () => setState(() => _exitRules.add(const StrategyRule(
                    indicator: 'RSI_OB',
                    condition: 'GreaterThan',
                    threshold: 70,
                    period: 14,
                  ))),
              icon: const Icon(Icons.add, size: 15),
              label: Text(AppL10n.tr('strat.addExitRule', 'Add Exit Rule'),
                  style: const TextStyle(fontSize: 12)),
            ),
          ],
        ),
        if (_exitRules.isNotEmpty) ...[
          const SizedBox(height: 8),
          ...List.generate(
            _exitRules.length,
            (i) => _buildSingleRuleRow(
              keyPrefix: '${_selectedId}_exit_$i',
              indexLabel: 'E${i + 1}',
              rule: _exitRules[i],
              onChanged: (nr) => setState(() => _exitRules[i] = nr),
              onDelete: () => setState(() => _exitRules.removeAt(i)),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildRuleGroupCard(
    BuildContext context, {
    required StrategyRuleGroup group,
    required String pathPrefix,
    required int depth,
    required ValueChanged<StrategyRuleGroup> onChanged,
    VoidCallback? onRemoveGroup,
  }) {
    final isOr = group.combinator.toUpperCase() == 'OR';
    final accent = isOr ? const Color(0xFFF59E0B) : const Color(0xFF38BDF8);

    return Container(
      margin: EdgeInsets.only(left: depth > 0 ? 18 : 0, bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: accent.withValues(alpha: 0.45)),
        color: accent.withValues(alpha: 0.04),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Icon(
                depth == 0 ? Icons.account_tree : Icons.subdirectory_arrow_right,
                size: 16,
                color: accent,
              ),
              const SizedBox(width: 6),
              Text(
                depth == 0
                    ? '${AppL10n.tr('strat.rootLogic', 'Root Entry Logic')} (${group.totalRuleCount} ${AppL10n.tr('sim.rules', 'rules')})'
                    : AppL10n.tr('strat.nestedGroupLabel', 'Nested Group'),
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 12.5,
                  color: accent,
                ),
              ),
              const SizedBox(width: 10),
              SegmentedButton<String>(
                segments: [
                  ButtonSegment(
                      value: 'AND',
                      label: Text(AppL10n.tr('strat.and', 'AND'))),
                  ButtonSegment(
                      value: 'OR',
                      label: Text(AppL10n.tr('strat.or', 'OR'))),
                ],
                selected: {isOr ? 'OR' : 'AND'},
                style: const ButtonStyle(
                  visualDensity: VisualDensity.compact,
                ),
                onSelectionChanged: (s) =>
                    onChanged(group.copyWith(combinator: s.first)),
              ),
              const Spacer(),
              OutlinedButton.icon(
                onPressed: () => onChanged(group.copyWith(
                  rules: [
                    ...group.rules,
                    const StrategyRule(
                      indicator: 'EMA_TREND',
                      condition: 'GreaterThan',
                      period: 200,
                      threshold: 0,
                    ),
                  ],
                )),
                icon: const Icon(Icons.add, size: 14),
                label: Text(AppL10n.tr('strat.addRule', '+ Rule'),
                    style: const TextStyle(fontSize: 11.5)),
              ),
              if (depth < 2) ...[
                const SizedBox(width: 6),
                OutlinedButton.icon(
                  onPressed: () => onChanged(group.copyWith(
                    groups: [
                      ...group.groups,
                      StrategyRuleGroup(
                        combinator: isOr ? 'AND' : 'OR',
                        rules: const [
                          StrategyRule(
                            indicator: 'RSI_OS',
                            condition: 'LessThan',
                            period: 14,
                            threshold: 35,
                          ),
                        ],
                      ),
                    ],
                  )),
                  icon: const Icon(Icons.create_new_folder_outlined, size: 14),
                  label: Text(AppL10n.tr('strat.nestedGroup', '+ Nested Group'),
                      style: const TextStyle(fontSize: 11.5)),
                ),
              ],
              if (onRemoveGroup != null) ...[
                const SizedBox(width: 4),
                IconButton(
                  tooltip: AppL10n.tr('strat.deleteGroup', 'Delete Group'),
                  icon: const Icon(Icons.delete_outline,
                      size: 17, color: Colors.redAccent),
                  onPressed: onRemoveGroup,
                ),
              ],
            ],
          ),
          const SizedBox(height: 8),
          if (group.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Center(
                child: Text(
                  'Empty group. Click "+ Rule" or "+ Nested Group".',
                  style: TextStyle(color: Colors.grey, fontSize: 12),
                ),
              ),
            ),
          ...List.generate(group.rules.length, (i) {
            return _buildSingleRuleRow(
              keyPrefix: '${_selectedId}_${pathPrefix}_r$i',
              indexLabel: '${i + 1}',
              rule: group.rules[i],
              onChanged: (nr) {
                final next = List<StrategyRule>.from(group.rules);
                next[i] = nr;
                onChanged(group.copyWith(rules: next));
              },
              onDelete: () {
                final next = List<StrategyRule>.from(group.rules)..removeAt(i);
                onChanged(group.copyWith(rules: next));
              },
            );
          }),
          ...List.generate(group.groups.length, (gIdx) {
            return _buildRuleGroupCard(
              context,
              group: group.groups[gIdx],
              pathPrefix: '${pathPrefix}_g$gIdx',
              depth: depth + 1,
              onChanged: (ng) {
                final nextGroups = List<StrategyRuleGroup>.from(group.groups);
                nextGroups[gIdx] = ng;
                onChanged(group.copyWith(groups: nextGroups));
              },
              onRemoveGroup: () {
                final nextGroups = List<StrategyRuleGroup>.from(group.groups)
                  ..removeAt(gIdx);
                onChanged(group.copyWith(groups: nextGroups));
              },
            );
          }),
        ],
      ),
    );
  }

  Widget _buildSingleRuleRow({
    required String keyPrefix,
    required String indexLabel,
    required StrategyRule rule,
    required ValueChanged<StrategyRule> onChanged,
    required VoidCallback onDelete,
  }) {
    final indVal = _indicators.contains(rule.indicator)
        ? rule.indicator
        : _indicators.first;
    final condVal = _conditions.contains(rule.condition)
        ? rule.condition
        : _conditions.first;
    return Card(
      margin: const EdgeInsets.only(bottom: 6),
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Row(
          children: [
            CircleAvatar(
              radius: 11,
              child: Text(indexLabel, style: const TextStyle(fontSize: 10)),
            ),
            const SizedBox(width: 8),
            Expanded(
              flex: 2,
              child: DropdownButtonFormField<String>(
                initialValue: indVal,
                decoration: InputDecoration(
                  labelText: AppL10n.tr('strat.indicator', 'Indicator'),
                  border: OutlineInputBorder(),
                  isDense: true,
                ),
                items: _indicators
                    .map((ind) => DropdownMenuItem(
                          value: ind,
                          child: Text(ind, style: const TextStyle(fontSize: 12)),
                        ))
                    .toList(),
                onChanged: (v) {
                  if (v != null) {
                    onChanged(StrategyRule(
                      indicator: v,
                      condition: rule.condition,
                      threshold: rule.threshold,
                      period: rule.period,
                    ));
                  }
                },
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              flex: 2,
              child: DropdownButtonFormField<String>(
                initialValue: condVal,
                decoration: InputDecoration(
                  labelText: AppL10n.tr('strat.condition', 'Condition'),
                  border: OutlineInputBorder(),
                  isDense: true,
                ),
                items: _conditions
                    .map((c) => DropdownMenuItem(
                          value: c,
                          child: Text(c, style: const TextStyle(fontSize: 12)),
                        ))
                    .toList(),
                onChanged: (v) {
                  if (v != null) {
                    onChanged(StrategyRule(
                      indicator: rule.indicator,
                      condition: v,
                      threshold: rule.threshold,
                      period: rule.period,
                    ));
                  }
                },
              ),
            ),
            const SizedBox(width: 8),
            SizedBox(
              width: 85,
              child: TextFormField(
                key: ValueKey('${keyPrefix}_thr'),
                initialValue: rule.threshold.toString(),
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                decoration: InputDecoration(
                  labelText: AppL10n.tr('strat.threshold', 'Threshold'),
                  border: OutlineInputBorder(),
                  isDense: true,
                ),
                onChanged: (v) {
                  final val = double.tryParse(v);
                  if (val != null) {
                    onChanged(StrategyRule(
                      indicator: rule.indicator,
                      condition: rule.condition,
                      threshold: val,
                      period: rule.period,
                    ));
                  }
                },
              ),
            ),
            const SizedBox(width: 8),
            SizedBox(
              width: 75,
              child: TextFormField(
                key: ValueKey('${keyPrefix}_per'),
                initialValue: rule.period.toString(),
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: AppL10n.tr('strat.period', 'Period'),
                  border: OutlineInputBorder(),
                  isDense: true,
                ),
                onChanged: (v) {
                  final val = int.tryParse(v);
                  if (val != null && val > 0) {
                    onChanged(StrategyRule(
                      indicator: rule.indicator,
                      condition: rule.condition,
                      threshold: rule.threshold,
                      period: val,
                    ));
                  }
                },
              ),
            ),
            const SizedBox(width: 4),
            IconButton(
              tooltip: AppL10n.tr('strat.removeRule', 'Remove Rule'),
              icon: const Icon(Icons.close, size: 17),
              onPressed: onDelete,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildJsonPreviewTab(BuildContext context) {
    final draft = _buildCurrentDraft();
    final jsonStr =
        const JsonEncoder.withIndent('  ').convert(draft.toJson());
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                'Compiled Strategy JSON',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
              const Spacer(),
              OutlinedButton.icon(
                onPressed: () {
                  Clipboard.setData(ClipboardData(text: jsonStr));
                  setState(() => _statusBanner = 'Copied JSON to clipboard');
                },
                icon: const Icon(Icons.copy, size: 15),
                label: Text(AppL10n.tr('strat.copyJson', 'Copy JSON')),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Expanded(
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.35),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Theme.of(context).dividerColor),
              ),
              child: SingleChildScrollView(
                child: SelectableText(
                  jsonStr,
                  style: const TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 12,
                    height: 1.45,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _runPeriodTest() async {
    final draft = _buildCurrentDraft();
    widget.onSaveStrategy(draft);
    setState(() {
      _isCreatingNew = false;
      _activeTab = 2;
      _testing = true;
    });

    final fetchCount = math.max(_testLookbackBars + 60, 140);
    final res = await widget.marketData.fetchCandles(
      draft.symbol,
      draft.timeframe,
      count: fetchCount,
    );
    final bt = StrategyScanner.backtestStrategy(
      draft,
      res.candles,
      lookbackBars: _testLookbackBars,
      requireAllRules: _combinator == 'AND',
    );
    MultiSymbolBacktestResult? multi;
    if (draft.scanUniverse != 'SINGLE') {
      multi = await StrategyScanner.backtestUniverse(
        draft,
        widget.marketData,
        lookbackBars: _testLookbackBars,
      );
    }
    widget.onRunEvaluation(draft);
    if (!mounted) return;
    setState(() {
      _testing = false;
      _testResult = bt;
      _multiBtResult = multi;
      _statusBanner = multi != null
          ? '0-token multi-pair backtest: ${multi.perSymbol.length} symbols, ${multi.totalTrades} trades (${multi.avgWinRate.toStringAsFixed(1)}% WR)'
          : 'Tested "${draft.name}" over ${bt.barsTested} bars (${bt.totalTrades} trades)';
    });
  }

  Future<void> _runUniverseScan() async {
    final draft = _buildCurrentDraft();
    widget.onSaveStrategy(draft);
    setState(() {
      _isCreatingNew = false;
      _activeTab = 2;
      _scanning = true;
      _hitOpinions.clear();
    });

    final hits = await StrategyScanner.scanUniverse(draft, widget.marketData);
    if (!mounted) return;
    final triggeredCount = hits.where((h) => h.triggered).length;
    setState(() {
      _scanning = false;
      _scanHits = hits;
      _statusBanner =
          'Scanned ${hits.length} symbols (0 tokens): $triggeredCount live setup${triggeredCount == 1 ? '' : 's'} triggered';
    });
  }

  Future<void> _validateHitWithAi(StrategyScanHit hit) async {
    final copilot = widget.copilot;
    if (copilot == null) return;
    setState(() => _validatingSymbol = hit.spec.symbol);
    final res = await widget.marketData.fetchCandles(
      hit.spec.symbol,
      hit.timeframe,
      count: 120,
    );
    final opinion = await copilot.validateScanHit(
      strategy: _buildCurrentDraft(),
      hit: hit,
      candles: res.candles,
    );
    if (!mounted) return;
    setState(() {
      _validatingSymbol = null;
      _hitOpinions[hit.spec.symbol] = opinion;
    });
  }

  Widget _buildEvaluationTab(BuildContext context, double rr) {
    final draft = _buildCurrentDraft();
    final bt = _testResult;
    final multi = _multiBtResult;
    final universeSymbols = SymbolCatalog.resolveUniverse(
      draft.scanUniverse,
      fallbackSymbol: draft.symbol,
      customSymbols: draft.scanSymbols,
    );

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          margin: EdgeInsets.zero,
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        '0-Token Backtest & Live Universe Scanner · ${draft.name}',
                        style: const TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                    ),
                    Text('\${AppL10n.tr(\'strat.period\', \'Period\')}: ',
                        style: TextStyle(fontSize: 12, color: Colors.grey)),
                    DropdownButton<int>(
                      value: _testLookbackBars,
                      isDense: true,
                      underline: const SizedBox.shrink(),
                      items: [
                        DropdownMenuItem(
                            value: 100, child: Text('${AppL10n.tr('strat.lastBars', 'Last')} 100 ${AppL10n.tr('strat.bars', 'Bars')}')),
                        DropdownMenuItem(
                            value: 300, child: Text('${AppL10n.tr('strat.lastBars', 'Last')} 300 ${AppL10n.tr('strat.bars', 'Bars')}')),
                        DropdownMenuItem(
                            value: 500, child: Text('${AppL10n.tr('strat.lastBars', 'Last')} 500 ${AppL10n.tr('strat.bars', 'Bars')}')),
                        DropdownMenuItem(
                            value: 1000, child: Text('${AppL10n.tr('strat.lastBars', 'Last')} 1,000 ${AppL10n.tr('strat.bars', 'Bars')}')),
                        DropdownMenuItem(
                            value: 2000, child: Text('${AppL10n.tr('strat.lastBars', 'Last')} 2,000 ${AppL10n.tr('strat.bars', 'Bars')}')),
                        DropdownMenuItem(
                            value: 5000, child: Text('${AppL10n.tr('strat.lastBars', 'Last')} 5,000 ${AppL10n.tr('strat.bars', 'Bars')}')),
                      ],
                      onChanged: (v) {
                        if (v != null) setState(() => _testLookbackBars = v);
                      },
                    ),
                    const SizedBox(width: 10),
                    OutlinedButton.icon(
                      onPressed: _scanning ? null : _runUniverseScan,
                      icon: _scanning
                          ? const SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.radar, size: 16),
                      label: Text(_scanning
                          ? 'Scanning...'
                          : '${AppL10n.tr('strat.scanUniverse', 'Scan Universe')} (${universeSymbols.length})'),
                    ),
                    const SizedBox(width: 8),
                    FilledButton.icon(
                      onPressed: _testing ? null : _runPeriodTest,
                      icon: _testing
                          ? const SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.play_arrow, size: 16),
                      label: Text(_testing
                          ? AppL10n.tr('scan.scanning', 'Testing...')
                          : AppL10n.tr('strat.runBacktest', 'Run Backtest')),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: [
                    Chip(
                        visualDensity: VisualDensity.compact,
                        label: Text(
                            'Universe: ${_universes[draft.scanUniverse] ?? draft.scanUniverse} (${universeSymbols.length})')),
                    Chip(
                        visualDensity: VisualDensity.compact,
                        label: Text('TF: ${draft.timeframe.code}')),
                    Chip(
                        visualDensity: VisualDensity.compact,
                        label: Text('Logic: $_combinator')),
                    Chip(
                        visualDensity: VisualDensity.compact,
                        label: Text('R:R 1:${rr.toStringAsFixed(1)}')),
                  ],
                ),
              ],
            ),
          ),
        ),
        if (_scanHits.isNotEmpty) ...[
          const SizedBox(height: 12),
          Card(
            margin: EdgeInsets.zero,
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.radar, size: 16, color: Color(0xFF10B981)),
                      const SizedBox(width: 6),
                      Text(
                        'Live Universe Scan Hits (${_scanHits.where((h) => h.triggered).length} Triggered / ${_scanHits.length} Scanned · 0 Tokens)',
                        style: const TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  ..._scanHits.map((hit) {
                    final opinion = _hitOpinions[hit.spec.symbol];
                    final isValidating = _validatingSymbol == hit.spec.symbol;
                    final digits = IndicatorEngine.getSymbolDigits(
                      hit.spec.symbol,
                      samplePrice: hit.price,
                    );
                    final sigColor = hit.signal == 'Buy'
                        ? const Color(0xFF10B981)
                        : hit.signal == 'Sell'
                            ? const Color(0xFFEF4444)
                            : Colors.grey;
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: hit.triggered
                              ? sigColor.withValues(alpha: 0.6)
                              : Colors.white12,
                        ),
                        color: hit.triggered
                            ? sigColor.withValues(alpha: 0.06)
                            : Colors.transparent,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 7, vertical: 2),
                                decoration: BoxDecoration(
                                  color: sigColor.withValues(alpha: 0.16),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  hit.triggered ? hit.signal.toUpperCase() : 'WATCH',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: sigColor,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                hit.spec.symbol,
                                style: const TextStyle(
                                    fontWeight: FontWeight.bold, fontSize: 13),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                hit.price.toStringAsFixed(digits),
                                style: const TextStyle(
                                    fontFamily: 'monospace', fontSize: 12),
                              ),
                              const Spacer(),
                              Text(
                                'Score ${hit.matchScore.toStringAsFixed(0)}%',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: sigColor,
                                ),
                              ),
                              if (widget.copilot != null) ...[
                                const SizedBox(width: 10),
                                OutlinedButton.icon(
                                  onPressed: isValidating
                                      ? null
                                      : () => _validateHitWithAi(hit),
                                  icon: isValidating
                                      ? const SizedBox(
                                          width: 12,
                                          height: 12,
                                          child: CircularProgressIndicator(
                                              strokeWidth: 2),
                                        )
                                      : const Icon(Icons.psychology, size: 14),
                                  label: Text(
                                    isValidating ? 'Checking...' : 'AI 2nd Opinion',
                                    style: const TextStyle(fontSize: 11),
                                  ),
                                  style: OutlinedButton.styleFrom(
                                    visualDensity: VisualDensity.compact,
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 8, vertical: 4),
                                  ),
                                ),
                              ],
                            ],
                          ),
                          if (hit.ruleBreakdown.isNotEmpty) ...[
                            const SizedBox(height: 6),
                            Text(
                              hit.ruleBreakdown.join('  ·  '),
                              style: const TextStyle(
                                  fontSize: 11, color: Colors.grey),
                            ),
                          ],
                          if (opinion != null) ...[
                            const SizedBox(height: 8),
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: Colors.black26,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: MarkdownMessageView(
                                data: opinion,
                                baseFontSize: 12,
                              ),
                            ),
                          ],
                        ],
                      ),
                    );
                  }),
                ],
              ),
            ),
          ),
        ],
        if (multi != null) ...[
          const SizedBox(height: 12),
          Card(
            margin: EdgeInsets.zero,
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Multi-Symbol Backtest Summary (${multi.perSymbol.length} Pairs · 0 Tokens)',
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      _btStatCard('Total Trades', '${multi.totalTrades}',
                          const Color(0xFFA855F7)),
                      const SizedBox(width: 8),
                      _btStatCard(
                          'Avg Win Rate',
                          '${multi.avgWinRate.toStringAsFixed(1)}%',
                          multi.avgWinRate >= 50
                              ? const Color(0xFF10B981)
                              : const Color(0xFFF59E0B)),
                      const SizedBox(width: 8),
                      _btStatCard(
                          'Avg Net Return',
                          '${multi.avgNetReturnPct >= 0 ? '+' : ''}${multi.avgNetReturnPct.toStringAsFixed(2)}%',
                          multi.avgNetReturnPct >= 0
                              ? const Color(0xFF10B981)
                              : const Color(0xFFEF4444)),
                      const SizedBox(width: 8),
                      _btStatCard(
                          'Avg PF / Max DD',
                          '${multi.avgProfitFactor.toStringAsFixed(2)} / ${multi.maxDrawdownPct.toStringAsFixed(1)}%',
                          const Color(0xFF38BDF8)),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: multi.perSymbol.map((s) {
                      final pos = s.result.netReturnPct >= 0;
                      return Chip(
                        visualDensity: VisualDensity.compact,
                        label: Text(
                          '${s.symbol}: ${s.result.totalTrades}T · ${s.result.winRate.toStringAsFixed(0)}% WR · ${pos ? '+' : ''}${s.result.netReturnPct.toStringAsFixed(1)}%',
                          style: TextStyle(
                            fontSize: 11,
                            color: pos
                                ? const Color(0xFF10B981)
                                : const Color(0xFFEF4444),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
          ),
        ],
        const SizedBox(height: 12),
        if (bt == null)
          const Card(
            margin: EdgeInsets.zero,
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Center(
                child: Text(
                  'Click "Run Backtest" for 0-token historical simulation or "Scan Universe" to find live setups across your selected market universe.',
                  style: TextStyle(color: Colors.grey),
                ),
              ),
            ),
          )
        else ...[
          // Summary KPIs
          Row(
            children: [
              _btStatCard('Bars Tested', '${bt.barsTested}',
                  const Color(0xFF38BDF8)),
              const SizedBox(width: 8),
              _btStatCard('Signals / Trades',
                  '${bt.totalSignals} / ${bt.totalTrades}', const Color(0xFFA855F7)),
              const SizedBox(width: 8),
              _btStatCard(
                  'Win Rate',
                  '${bt.winRate.toStringAsFixed(1)}%',
                  bt.winRate >= 50
                      ? const Color(0xFF10B981)
                      : const Color(0xFFF59E0B)),
              const SizedBox(width: 8),
              _btStatCard(
                  'Net Return',
                  '${bt.netReturnPct >= 0 ? '+' : ''}${bt.netReturnPct.toStringAsFixed(2)}%',
                  bt.netReturnPct >= 0
                      ? const Color(0xFF10B981)
                      : const Color(0xFFEF4444)),
              const SizedBox(width: 8),
              _btStatCard(
                  'Profit Factor',
                  bt.profitFactor.toStringAsFixed(2),
                  bt.profitFactor >= 1.2
                      ? const Color(0xFF10B981)
                      : const Color(0xFFF59E0B)),
              const SizedBox(width: 8),
              _btStatCard('Max DD', '${bt.maxDrawdownPct.toStringAsFixed(2)}%',
                  const Color(0xFFEF4444)),
            ],
          ),
          const SizedBox(height: 12),
          // Latest Bar Rule Breakdown
          Card(
            margin: EdgeInsets.zero,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Text(
                        'Latest Bar Rule Breakdown',
                        style: TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                      const Spacer(),
                      Text(
                        '${bt.latestDirection} · Match ${bt.latestScore.toStringAsFixed(0)}%',
                        style: const TextStyle(
                            fontFamily: 'monospace',
                            fontWeight: FontWeight.bold,
                            fontSize: 12),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: bt.latestRuleBreakdown
                        .map((lbl) => Chip(
                              visualDensity: VisualDensity.compact,
                              label: Text(lbl,
                                  style: const TextStyle(
                                      fontSize: 11, fontFamily: 'monospace')),
                            ))
                        .toList(),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          if (bt.equityCurve.length >= 2) ...[
            Card(
              margin: EdgeInsets.zero,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Text(
                          'Simulated Equity Curve (\$10,000 Base)',
                          style: TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                        const Spacer(),
                        Text(
                          'End: \$${bt.equityCurve.last.toStringAsFixed(2)}',
                          style: TextStyle(
                            fontFamily: 'monospace',
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                            color: bt.equityCurve.last >= 10000
                                ? const Color(0xFF10B981)
                                : const Color(0xFFEF4444),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    SizedBox(
                      height: 110,
                      width: double.infinity,
                      child: CustomPaint(
                        painter: _EquityCurvePainter(bt.equityCurve),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
          ],
          // Trade Results List
          Card(
            margin: EdgeInsets.zero,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Simulated Trades (${bt.trades.length})',
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 13.5),
                  ),
                  const SizedBox(height: 8),
                  if (bt.trades.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 14),
                      child: Text(
                        'No entry signals triggered in this period. Try a longer period, switching Logic to ANY (OR), or adjusting rule thresholds.',
                        style: TextStyle(color: Colors.grey, fontSize: 12),
                      ),
                    )
                  else
                    ...bt.trades.map((tr) {
                      final isWin = tr.pnlPercent >= 0;
                      final isBuy = tr.direction == 'Buy';
                      return Container(
                        margin: const EdgeInsets.only(bottom: 6),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 8),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                              color: Theme.of(context).dividerColor),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 7, vertical: 3),
                              decoration: BoxDecoration(
                                color: (isBuy
                                        ? const Color(0xFF10B981)
                                        : const Color(0xFFEF4444))
                                    .withValues(alpha: 0.16),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                tr.direction.toUpperCase(),
                                style: TextStyle(
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.bold,
                                  color: isBuy
                                      ? const Color(0xFF10B981)
                                      : const Color(0xFFEF4444),
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Entry ${IndicatorEngine.formatPrice(tr.entryPrice, draft.symbol)} → Exit ${IndicatorEngine.formatPrice(tr.exitPrice, draft.symbol)} (${tr.exitReason})',
                                    style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        fontFamily: 'monospace'),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${tr.entryTime.toIso8601String().substring(0, 16).replaceFirst('T', ' ')} → ${tr.exitTime.toIso8601String().substring(11, 16)} · ${tr.matchedRules.join(', ')}',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                        fontSize: 10.5, color: Colors.grey),
                                  ),
                                ],
                              ),
                            ),
                            Text(
                              '${tr.pnlPercent >= 0 ? '+' : ''}${tr.pnlPercent.toStringAsFixed(2)}%',
                              style: TextStyle(
                                fontFamily: 'monospace',
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                                color: isWin
                                    ? const Color(0xFF10B981)
                                    : const Color(0xFFEF4444),
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _btStatCard(String label, String value, Color accent) {
    return Expanded(
      child: Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label,
                  style: const TextStyle(fontSize: 10.5, color: Colors.grey)),
              const SizedBox(height: 3),
              Text(
                value,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'monospace',
                  color: accent,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _EquityCurvePainter extends CustomPainter {
  final List<double> points;

  _EquityCurvePainter(this.points);

  @override
  void paint(Canvas canvas, Size size) {
    if (points.length < 2) return;
    double minVal = points.first;
    double maxVal = points.first;
    for (final v in points) {
      if (v < minVal) minVal = v;
      if (v > maxVal) maxVal = v;
    }
    if ((maxVal - minVal).abs() < 1e-6) {
      maxVal += 100;
      minVal -= 100;
    }

    final isPositive = points.last >= points.first;
    final lineColor =
        isPositive ? const Color(0xFF10B981) : const Color(0xFFEF4444);

    // Draw baseline ($10,000)
    final baseRatio =
        ((10000.0 - minVal) / (maxVal - minVal)).clamp(0.0, 1.0);
    final baseY = size.height - baseRatio * size.height;
    final basePaint = Paint()
      ..color = const Color(0xFF64748B).withValues(alpha: 0.35)
      ..strokeWidth = 1;
    canvas.drawLine(Offset(0, baseY), Offset(size.width, baseY), basePaint);

    final path = Path();
    final fillPath = Path();
    for (int i = 0; i < points.length; i++) {
      final x = (i / (points.length - 1)) * size.width;
      final norm = (points[i] - minVal) / (maxVal - minVal);
      final y = size.height - (norm * (size.height - 8) + 4);
      if (i == 0) {
        path.moveTo(x, y);
        fillPath.moveTo(x, size.height);
        fillPath.lineTo(x, y);
      } else {
        path.lineTo(x, y);
        fillPath.lineTo(x, y);
      }
    }
    fillPath.lineTo(size.width, size.height);
    fillPath.close();

    final fillPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          lineColor.withValues(alpha: 0.28),
          lineColor.withValues(alpha: 0.02),
        ],
      ).createShader(Offset.zero & size);
    canvas.drawPath(fillPath, fillPaint);

    final strokePaint = Paint()
      ..color = lineColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;
    canvas.drawPath(path, strokePaint);
  }

  @override
  bool shouldRepaint(covariant _EquityCurvePainter oldDelegate) =>
      oldDelegate.points != points;
}
