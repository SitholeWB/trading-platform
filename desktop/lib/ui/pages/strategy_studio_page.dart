import 'dart:convert';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../models/trading_models.dart';
import '../../services/indicator_engine.dart';
import '../../services/market_data_service.dart';
import '../../services/strategy_scanner.dart';
import '../../services/symbol_catalog.dart';

class StrategyStudioPage extends StatefulWidget {
  final List<StrategyDefinition> strategies;
  final MarketDataService marketData;
  final ValueChanged<StrategyDefinition> onSaveStrategy;
  final ValueChanged<String> onDeleteStrategy;
  final ValueChanged<StrategyDefinition> onRunEvaluation;

  const StrategyStudioPage({
    super.key,
    required this.strategies,
    required this.marketData,
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
    'RSI_OS',
    'RSI_OB',
    'MACD_CROSS',
    'BB_BREAK',
  ];

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
  int _testLookbackBars = 500;
  bool _testing = false;
  StrategyBacktestResult? _testResult;

  late final TextEditingController _nameCtrl;
  late final TextEditingController _descCtrl;
  String _symbol = 'EURUSD';
  Timeframe _timeframe = Timeframe.m15;
  bool _isEnabled = true;
  double _riskPercent = 1.0;
  double _slMult = 1.5;
  double _tpMult = 3.0;
  List<StrategyRule> _rules = [];

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
      _nameCtrl.text = s.name;
      _descCtrl.text = s.description;
      _symbol = SymbolCatalog.allSymbols.any((x) => x.symbol == s.symbol)
          ? s.symbol
          : 'EURUSD';
      _timeframe = s.timeframe;
      _isEnabled = s.isEnabled;
      _riskPercent = s.riskPercent.clamp(0.25, 5.0);
      _slMult = s.stopLossAtrMult.clamp(0.5, 4.0);
      _tpMult = s.takeProfitAtrMult.clamp(1.0, 8.0);
      _rules = List<StrategyRule>.from(s.entryRules);
      _testResult = null;
      _testing = false;
    });
  }

  void _startNewStrategy() {
    setState(() {
      _isCreatingNew = true;
      _selectedId = 'strat_${DateTime.now().millisecondsSinceEpoch}';
      _statusBanner = null;
      _testResult = null;
      _testing = false;
      _nameCtrl.text = 'Custom Momentum Strategy';
      _descCtrl.text = 'Quantitative multi-indicator rule';
      _symbol = 'EURUSD';
      _timeframe = Timeframe.m15;
      _isEnabled = true;
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
    });
  }

  StrategyDefinition _buildCurrentDraft() {
    final id = _selectedId ?? 'strat_${DateTime.now().millisecondsSinceEpoch}';
    return StrategyDefinition(
      id: id,
      name: _nameCtrl.text.trim().isEmpty
          ? 'Unnamed Strategy'
          : _nameCtrl.text.trim(),
      description: _descCtrl.text.trim(),
      symbol: _symbol,
      timeframe: _timeframe,
      isEnabled: _isEnabled,
      riskPercent: _riskPercent,
      stopLossAtrMult: _slMult,
      takeProfitAtrMult: _tpMult,
      entryRules: List<StrategyRule>.from(_rules),
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

    const presets = [
      'RSI oversold mean reversion on pullback with 1% risk',
      'EMA 20/50 trend crossover with MACD momentum confirmation',
      'Bollinger Band breakout scalp with tight 1.0x ATR stop',
    ];

    final generated = await showDialog<StrategyDefinition>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setS) => AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.auto_awesome, color: Color(0xFFA855F7), size: 20),
              SizedBox(width: 8),
              Text('AI Strategy Generator'),
            ],
          ),
          content: SizedBox(
            width: 500,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Describe the trading logic you want to build, or pick a template:',
                  style: TextStyle(fontSize: 12, color: Colors.grey),
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: presets
                      .map((p) => ActionChip(
                            label: Text(p, style: const TextStyle(fontSize: 11)),
                            onPressed: () => promptCtrl.text = p,
                          ))
                      .toList(),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: promptCtrl,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    labelText: 'Strategy Prompt',
                    hintText:
                        'e.g. Buy when RSI < 30 and EMA crosses above on H1...',
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
                          labelText: 'Target Symbol',
                          border: OutlineInputBorder(),
                          isDense: true,
                        ),
                        items: SymbolCatalog.allSymbols
                            .map((s) => DropdownMenuItem(
                                  value: s.symbol,
                                  child: Text(s.symbol),
                                ))
                            .toList(),
                        onChanged: (v) {
                          if (v != null) setS(() => selectedSym = v);
                        },
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: DropdownButtonFormField<Timeframe>(
                        initialValue: selectedTf,
                        decoration: const InputDecoration(
                          labelText: 'Timeframe',
                          border: OutlineInputBorder(),
                          isDense: true,
                        ),
                        items: Timeframe.values
                            .map((t) => DropdownMenuItem(
                                  value: t,
                                  child: Text(t.code),
                                ))
                            .toList(),
                        onChanged: (v) {
                          if (v != null) setS(() => selectedTf = v);
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            FilledButton.icon(
              icon: const Icon(Icons.auto_awesome, size: 16),
              label: const Text('Generate Strategy'),
              onPressed: () {
                final text = promptCtrl.text.trim().toLowerCase();
                final rules = <StrategyRule>[];
                if (text.contains('rsi')) {
                  rules.add(StrategyRule(
                    indicator: text.contains('overbought') ? 'RSI_OB' : 'RSI_OS',
                    condition: text.contains('overbought')
                        ? 'GreaterThan'
                        : 'LessThan',
                    threshold: text.contains('overbought') ? 70 : 30,
                    period: 14,
                  ));
                }
                if (text.contains('ema') || text.contains('trend')) {
                  rules.add(const StrategyRule(
                    indicator: 'EMA_CROSS',
                    condition: 'CrossAbove',
                    threshold: 0,
                    period: 20,
                  ));
                }
                if (text.contains('macd')) {
                  rules.add(const StrategyRule(
                    indicator: 'MACD_CROSS',
                    condition: 'CrossAbove',
                    threshold: 0,
                    period: 12,
                  ));
                }
                if (text.contains('bollinger') || text.contains('bb')) {
                  rules.add(const StrategyRule(
                    indicator: 'BB_BREAK',
                    condition: 'CrossAbove',
                    threshold: 2.0,
                    period: 20,
                  ));
                }
                if (rules.isEmpty) {
                  rules.add(const StrategyRule(
                    indicator: 'EMA_CROSS',
                    condition: 'CrossAbove',
                    threshold: 0,
                    period: 20,
                  ));
                  rules.add(const StrategyRule(
                    indicator: 'RSI_OS',
                    condition: 'LessThan',
                    threshold: 40,
                    period: 14,
                  ));
                }

                Navigator.pop(
                  ctx,
                  StrategyDefinition(
                    id: 'strat_ai_${DateTime.now().millisecondsSinceEpoch}',
                    name: 'AI · $selectedSym ${selectedTf.code} Strategy',
                    description: promptCtrl.text.trim().isEmpty
                        ? 'AI-synthesized quantitative rule'
                        : promptCtrl.text.trim(),
                    symbol: selectedSym,
                    timeframe: selectedTf,
                    isEnabled: true,
                    riskPercent: text.contains('0.5') ? 0.5 : 1.0,
                    stopLossAtrMult: text.contains('tight') ? 1.0 : 1.5,
                    takeProfitAtrMult: 3.0,
                    entryRules: rules,
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
    promptCtrl.dispose();

    if (generated != null) {
      widget.onSaveStrategy(generated);
      _loadStrategy(generated);
      setState(() => _statusBanner = 'Generated & saved "${generated.name}"');
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
                    const Text(
                      'RULE STUDIO',
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.9,
                        color: Colors.grey,
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      tooltip: 'AI Strategy Generator',
                      icon: const Icon(Icons.auto_awesome,
                          size: 18, color: Color(0xFFA855F7)),
                      onPressed: _showAiGeneratorDialog,
                    ),
                    FilledButton.icon(
                      onPressed: _startNewStrategy,
                      icon: const Icon(Icons.add, size: 15),
                      label: const Text('New', style: TextStyle(fontSize: 12)),
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
                        decoration: const InputDecoration(
                          labelText: 'Strategy Name',
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
                        decoration: const InputDecoration(
                          labelText: 'Symbol',
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
                      width: 100,
                      child: DropdownButtonFormField<Timeframe>(
                        initialValue: _timeframe,
                        decoration: const InputDecoration(
                          labelText: 'TF',
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
                        const Text('Active', style: TextStyle(fontSize: 12)),
                        Switch(
                          value: _isEnabled,
                          onChanged: (v) => setState(() => _isEnabled = v),
                        ),
                      ],
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
                        label: const Text('Test Strategy'),
                      ),
                    ],
                    const SizedBox(width: 8),
                    FilledButton.icon(
                      onPressed: _saveCurrent,
                      icon: const Icon(Icons.save, size: 16),
                      label: const Text('Save'),
                    ),
                    if (!_isCreatingNew && _selectedId != null) ...[
                      const SizedBox(width: 6),
                      IconButton(
                        tooltip: 'Delete Strategy',
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
                  color: const Color(0xFF10B981).withValues(alpha: 0.14),
                  child: Row(
                    children: [
                      const Icon(Icons.check_circle_outline,
                          size: 15, color: Color(0xFF10B981)),
                      const SizedBox(width: 6),
                      Text(
                        _statusBanner!,
                        style: const TextStyle(
                            fontSize: 12, color: Color(0xFF10B981)),
                      ),
                      const Spacer(),
                      InkWell(
                        onTap: () => setState(() => _statusBanner = null),
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
                    _tabChip(0, 'Visual Builder', Icons.tune),
                    const SizedBox(width: 6),
                    _tabChip(1, 'JSON Definition', Icons.code),
                    const SizedBox(width: 6),
                    _tabChip(2, 'Risk & Evaluation', Icons.analytics_outlined),
                    const Spacer(),
                    Text(
                      'R:R 1:${rr.toStringAsFixed(1)} · Risk ${_riskPercent.toStringAsFixed(1)}%',
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
          decoration: const InputDecoration(
            labelText: 'Strategy Description / Notes',
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
                    const Text(
                      'Risk & Rule Combinator',
                      style:
                          TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                    const Spacer(),
                    SegmentedButton<String>(
                      segments: const [
                        ButtonSegment(value: 'AND', label: Text('ALL (AND)')),
                        ButtonSegment(value: 'OR', label: Text('ANY (OR)')),
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
                          Text('Risk %: ${_riskPercent.toStringAsFixed(2)}%',
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
                          Text('SL ATR: ${_slMult.toStringAsFixed(1)}x',
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
                          Text('TP ATR: ${_tpMult.toStringAsFixed(1)}x',
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
        Row(
          children: [
            const Text(
              'Entry Rules',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            ),
            const SizedBox(width: 10),
            ActionChip(
              label: const Text('+ RSI Oversold', style: TextStyle(fontSize: 11)),
              onPressed: () => setState(() => _rules.add(const StrategyRule(
                    indicator: 'RSI_OS',
                    condition: 'LessThan',
                    threshold: 30,
                    period: 14,
                  ))),
            ),
            const SizedBox(width: 6),
            ActionChip(
              label: const Text('+ EMA Cross', style: TextStyle(fontSize: 11)),
              onPressed: () => setState(() => _rules.add(const StrategyRule(
                    indicator: 'EMA_CROSS',
                    condition: 'CrossAbove',
                    threshold: 0,
                    period: 20,
                  ))),
            ),
            const Spacer(),
            FilledButton.tonalIcon(
              onPressed: () => setState(() => _rules.add(const StrategyRule(
                    indicator: 'MACD_CROSS',
                    condition: 'CrossAbove',
                    threshold: 0,
                    period: 12,
                  ))),
              icon: const Icon(Icons.add, size: 16),
              label: const Text('Add Rule'),
            ),
          ],
        ),
        const SizedBox(height: 10),
        if (_rules.isEmpty)
          const Card(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Center(
                child: Text(
                  'No entry rules configured. Click "+ Add Rule" to add a condition.',
                  style: TextStyle(color: Colors.grey),
                ),
              ),
            ),
          )
        else
          ...List.generate(_rules.length, (i) {
            final r = _rules[i];
            final indVal = _indicators.contains(r.indicator)
                ? r.indicator
                : _indicators.first;
            final condVal = _conditions.contains(r.condition)
                ? r.condition
                : _conditions.first;
            return Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 12,
                      child: Text('${i + 1}',
                          style: const TextStyle(fontSize: 11)),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      flex: 2,
                      child: DropdownButtonFormField<String>(
                        initialValue: indVal,
                        decoration: const InputDecoration(
                          labelText: 'Indicator',
                          border: OutlineInputBorder(),
                          isDense: true,
                        ),
                        items: _indicators
                            .map((ind) => DropdownMenuItem(
                                  value: ind,
                                  child: Text(ind,
                                      style: const TextStyle(fontSize: 12)),
                                ))
                            .toList(),
                        onChanged: (v) {
                          if (v != null) {
                            setState(() {
                              _rules[i] = StrategyRule(
                                indicator: v,
                                condition: r.condition,
                                threshold: r.threshold,
                                period: r.period,
                              );
                            });
                          }
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      flex: 2,
                      child: DropdownButtonFormField<String>(
                        initialValue: condVal,
                        decoration: const InputDecoration(
                          labelText: 'Condition',
                          border: OutlineInputBorder(),
                          isDense: true,
                        ),
                        items: _conditions
                            .map((c) => DropdownMenuItem(
                                  value: c,
                                  child: Text(c,
                                      style: const TextStyle(fontSize: 12)),
                                ))
                            .toList(),
                        onChanged: (v) {
                          if (v != null) {
                            setState(() {
                              _rules[i] = StrategyRule(
                                indicator: r.indicator,
                                condition: v,
                                threshold: r.threshold,
                                period: r.period,
                              );
                            });
                          }
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    SizedBox(
                      width: 90,
                      child: TextFormField(
                        key: ValueKey('${_selectedId}_thr_$i'),
                        initialValue: r.threshold.toString(),
                        keyboardType: const TextInputType.numberWithOptions(
                            decimal: true),
                        decoration: const InputDecoration(
                          labelText: 'Threshold',
                          border: OutlineInputBorder(),
                          isDense: true,
                        ),
                        onChanged: (v) {
                          final val = double.tryParse(v);
                          if (val != null) {
                            _rules[i] = StrategyRule(
                              indicator: r.indicator,
                              condition: r.condition,
                              threshold: val,
                              period: r.period,
                            );
                          }
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    SizedBox(
                      width: 80,
                      child: TextFormField(
                        key: ValueKey('${_selectedId}_per_$i'),
                        initialValue: r.period.toString(),
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: 'Period',
                          border: OutlineInputBorder(),
                          isDense: true,
                        ),
                        onChanged: (v) {
                          final val = int.tryParse(v);
                          if (val != null && val > 0) {
                            _rules[i] = StrategyRule(
                              indicator: r.indicator,
                              condition: r.condition,
                              threshold: r.threshold,
                              period: val,
                            );
                          }
                        },
                      ),
                    ),
                    const SizedBox(width: 6),
                    IconButton(
                      tooltip: 'Remove Rule',
                      icon: const Icon(Icons.close, size: 18),
                      onPressed: () => setState(() => _rules.removeAt(i)),
                    ),
                  ],
                ),
              ),
            );
          }),
      ],
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
                label: const Text('Copy JSON'),
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
    widget.onRunEvaluation(draft);
    if (!mounted) return;
    setState(() {
      _testing = false;
      _testResult = bt;
      _statusBanner =
          'Tested "${draft.name}" over ${bt.barsTested} bars (${bt.totalTrades} trades)';
    });
  }

  Widget _buildEvaluationTab(BuildContext context, double rr) {
    final draft = _buildCurrentDraft();
    final bt = _testResult;

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
                        'Historical Period Test · ${draft.name}',
                        style: const TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                    ),
                    const Text('Period: ',
                        style: TextStyle(fontSize: 12, color: Colors.grey)),
                    DropdownButton<int>(
                      value: _testLookbackBars,
                      isDense: true,
                      underline: const SizedBox.shrink(),
                      items: const [
                        DropdownMenuItem(
                            value: 100, child: Text('Last 100 Bars')),
                        DropdownMenuItem(
                            value: 300, child: Text('Last 300 Bars')),
                        DropdownMenuItem(
                            value: 500, child: Text('Last 500 Bars')),
                        DropdownMenuItem(
                            value: 1000, child: Text('Last 1,000 Bars')),
                        DropdownMenuItem(
                            value: 2000, child: Text('Last 2,000 Bars')),
                        DropdownMenuItem(
                            value: 5000, child: Text('Last 5,000 Bars')),
                      ],
                      onChanged: (v) {
                        if (v != null) setState(() => _testLookbackBars = v);
                      },
                    ),
                    const SizedBox(width: 10),
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
                      label: Text(_testing ? 'Testing...' : 'Run Period Test'),
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
                        label: Text('Symbol: ${draft.symbol}')),
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
        const SizedBox(height: 12),
        if (bt == null)
          const Card(
            margin: EdgeInsets.zero,
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Center(
                child: Text(
                  'Select a previous period above and click "Run Period Test" to list all rule evaluations and simulated trades.',
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
