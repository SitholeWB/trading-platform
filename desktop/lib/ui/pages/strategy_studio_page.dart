import 'package:flutter/material.dart';
import '../../models/trading_models.dart';
import '../../services/symbol_catalog.dart';

class StrategyStudioPage extends StatefulWidget {
  final List<StrategyDefinition> strategies;
  final ValueChanged<StrategyDefinition> onSaveStrategy;
  final ValueChanged<String> onDeleteStrategy;
  final ValueChanged<StrategyDefinition> onRunEvaluation;

  const StrategyStudioPage({
    super.key,
    required this.strategies,
    required this.onSaveStrategy,
    required this.onDeleteStrategy,
    required this.onRunEvaluation,
  });

  @override
  State<StrategyStudioPage> createState() => _StrategyStudioPageState();
}

class _StrategyStudioPageState extends State<StrategyStudioPage> {
  Future<void> _showStrategyEditorDialog({StrategyDefinition? existing}) async {
    final nameCtrl = TextEditingController(
        text: existing?.name ?? 'Custom Momentum Strategy');
    final descCtrl = TextEditingController(
        text: existing?.description ?? 'Quantitative multi-indicator rule');
    String sym = existing?.symbol ?? 'EURUSD';
    Timeframe tf = existing?.timeframe ?? Timeframe.m15;
    double risk = existing?.riskPercent ?? 1.0;
    double slMult = existing?.stopLossAtrMult ?? 1.5;
    double tpMult = existing?.takeProfitAtrMult ?? 3.0;
    final rules = List<StrategyRule>.from(
      existing?.entryRules ??
          const [
            StrategyRule(
              indicator: 'RSI_OS',
              condition: 'LessThan',
              threshold: 35,
              period: 14,
            ),
          ],
    );

    final saved = await showDialog<StrategyDefinition>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setS) => AlertDialog(
          title: Text(existing == null
              ? 'New Algorithmic Strategy'
              : 'Edit Strategy · ${existing.name}'),
          content: SizedBox(
            width: 520,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextField(
                    controller: nameCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Strategy Name',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: descCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Description',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          initialValue: sym,
                          decoration: const InputDecoration(
                            labelText: 'Symbol',
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
                            if (v != null) setS(() => sym = v);
                          },
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: DropdownButtonFormField<Timeframe>(
                          initialValue: tf,
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
                            if (v != null) setS(() => tf = v);
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: Text('Risk %: ${risk.toStringAsFixed(1)}%',
                            style: const TextStyle(fontSize: 12)),
                      ),
                      Expanded(
                        flex: 2,
                        child: Slider(
                          value: risk,
                          min: 0.25,
                          max: 5.0,
                          divisions: 19,
                          onChanged: (v) => setS(() => risk = v),
                        ),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      Expanded(
                        child: Text('SL ATR: ${slMult.toStringAsFixed(1)}x',
                            style: const TextStyle(fontSize: 12)),
                      ),
                      Expanded(
                        flex: 2,
                        child: Slider(
                          value: slMult,
                          min: 0.5,
                          max: 4.0,
                          divisions: 14,
                          onChanged: (v) => setS(() => slMult = v),
                        ),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      Expanded(
                        child: Text('TP ATR: ${tpMult.toStringAsFixed(1)}x',
                            style: const TextStyle(fontSize: 12)),
                      ),
                      Expanded(
                        flex: 2,
                        child: Slider(
                          value: tpMult,
                          min: 1.0,
                          max: 8.0,
                          divisions: 14,
                          onChanged: (v) => setS(() => tpMult = v),
                        ),
                      ),
                    ],
                  ),
                  const Divider(),
                  Row(
                    children: [
                      const Text('Entry Rules',
                          style: TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 13)),
                      const Spacer(),
                      TextButton.icon(
                        onPressed: () {
                          setS(() {
                            rules.add(const StrategyRule(
                              indicator: 'EMA_CROSS',
                              condition: 'CrossAbove',
                              threshold: 0,
                              period: 20,
                            ));
                          });
                        },
                        icon: const Icon(Icons.add, size: 16),
                        label: const Text('Add Rule'),
                      ),
                    ],
                  ),
                  ...rules.asMap().entries.map((entry) {
                    final idx = entry.key;
                    final r = entry.value;
                    return Card(
                      margin: const EdgeInsets.only(bottom: 6),
                      child: Padding(
                        padding: const EdgeInsets.all(8),
                        child: Row(
                          children: [
                            Expanded(
                              flex: 2,
                              child: DropdownButton<String>(
                                value: r.indicator,
                                isExpanded: true,
                                isDense: true,
                                underline: const SizedBox.shrink(),
                                items: const [
                                  DropdownMenuItem(value: 'EMA_CROSS', child: Text('EMA Cross')),
                                  DropdownMenuItem(value: 'RSI_OS', child: Text('RSI Oversold')),
                                  DropdownMenuItem(value: 'RSI_OB', child: Text('RSI Overbought')),
                                  DropdownMenuItem(value: 'MACD_CROSS', child: Text('MACD Cross')),
                                  DropdownMenuItem(value: 'BB_BREAK', child: Text('Bollinger Break')),
                                ],
                                onChanged: (v) {
                                  if (v != null) {
                                    setS(() => rules[idx] = StrategyRule(
                                          indicator: v,
                                          condition: r.condition,
                                          threshold: r.threshold,
                                          period: r.period,
                                        ));
                                  }
                                },
                              ),
                            ),
                            const SizedBox(width: 6),
                            Expanded(
                              flex: 2,
                              child: DropdownButton<String>(
                                value: r.condition,
                                isExpanded: true,
                                isDense: true,
                                underline: const SizedBox.shrink(),
                                items: const [
                                  DropdownMenuItem(value: 'CrossAbove', child: Text('Cross Above')),
                                  DropdownMenuItem(value: 'CrossBelow', child: Text('Cross Below')),
                                  DropdownMenuItem(value: 'LessThan', child: Text('Less Than')),
                                  DropdownMenuItem(value: 'GreaterThan', child: Text('Greater Than')),
                                ],
                                onChanged: (v) {
                                  if (v != null) {
                                    setS(() => rules[idx] = StrategyRule(
                                          indicator: r.indicator,
                                          condition: v,
                                          threshold: r.threshold,
                                          period: r.period,
                                        ));
                                  }
                                },
                              ),
                            ),
                            const SizedBox(width: 6),
                            SizedBox(
                              width: 58,
                              child: TextFormField(
                                initialValue: r.threshold.toString(),
                                decoration: const InputDecoration(
                                  labelText: 'Val',
                                  isDense: true,
                                  border: OutlineInputBorder(),
                                ),
                                keyboardType: TextInputType.number,
                                onChanged: (v) {
                                  final parsed = double.tryParse(v);
                                  if (parsed != null) {
                                    rules[idx] = StrategyRule(
                                      indicator: r.indicator,
                                      condition: r.condition,
                                      threshold: parsed,
                                      period: r.period,
                                    );
                                  }
                                },
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete_outline,
                                  size: 16, color: Colors.redAccent),
                              onPressed: rules.length <= 1
                                  ? null
                                  : () => setS(() => rules.removeAt(idx)),
                            ),
                          ],
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () {
                Navigator.of(ctx).pop(
                  StrategyDefinition(
                    id: existing?.id ??
                        'strat_${DateTime.now().millisecondsSinceEpoch}',
                    name: nameCtrl.text.trim().isEmpty
                        ? 'Custom Strategy'
                        : nameCtrl.text.trim(),
                    symbol: sym,
                    timeframe: tf,
                    isEnabled: existing?.isEnabled ?? true,
                    riskPercent: risk,
                    stopLossAtrMult: slMult,
                    takeProfitAtrMult: tpMult,
                    description: descCtrl.text.trim(),
                    entryRules: rules,
                  ),
                );
              },
              child: const Text('Save Strategy'),
            ),
          ],
        ),
      ),
    );
    if (saved != null) widget.onSaveStrategy(saved);
  }

  Future<void> _showAiGeneratorDialog() async {
    final promptCtrl = TextEditingController(
      text: 'Momentum breakout on XAUUSD M15 using EMA crossover and RSI filter',
    );
    String sym = 'XAUUSD';
    Timeframe tf = Timeframe.m15;

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
            width: 460,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'Describe your trading edge in plain English. The synthesizer builds deterministic rules with ATR risk controls.',
                  style: TextStyle(fontSize: 12, color: Colors.white70),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: promptCtrl,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    labelText: 'Strategy Prompt',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        initialValue: sym,
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
                          if (v != null) setS(() => sym = v);
                        },
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: DropdownButtonFormField<Timeframe>(
                        initialValue: tf,
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
                          if (v != null) setS(() => tf = v);
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
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Cancel'),
            ),
            FilledButton.icon(
              icon: const Icon(Icons.auto_awesome, size: 16),
              label: const Text('Generate Strategy'),
              onPressed: () {
                final lower = promptCtrl.text.toLowerCase();
                final rules = <StrategyRule>[];
                if (lower.contains('rsi')) {
                  rules.add(StrategyRule(
                    indicator: lower.contains('overbought') ? 'RSI_OB' : 'RSI_OS',
                    condition: lower.contains('overbought')
                        ? 'GreaterThan'
                        : 'LessThan',
                    threshold: lower.contains('overbought') ? 70 : 32,
                    period: 14,
                  ));
                }
                if (lower.contains('macd')) {
                  rules.add(const StrategyRule(
                    indicator: 'MACD_CROSS',
                    condition: 'CrossAbove',
                    threshold: 0,
                    period: 12,
                  ));
                }
                if (lower.contains('bollinger') || lower.contains('bb')) {
                  rules.add(const StrategyRule(
                    indicator: 'BB_BREAK',
                    condition: 'CrossAbove',
                    threshold: 2,
                    period: 20,
                  ));
                }
                if (rules.isEmpty || lower.contains('ema')) {
                  rules.add(const StrategyRule(
                    indicator: 'EMA_CROSS',
                    condition: 'CrossAbove',
                    threshold: 0,
                    period: 20,
                  ));
                }
                Navigator.of(ctx).pop(
                  StrategyDefinition(
                    id: 'ai_${DateTime.now().millisecondsSinceEpoch}',
                    name: 'AI $sym ${tf.code} Alpha',
                    symbol: sym,
                    timeframe: tf,
                    isEnabled: true,
                    riskPercent: lower.contains('scalp') ? 0.5 : 1.0,
                    stopLossAtrMult: 1.5,
                    takeProfitAtrMult: 3.0,
                    description: promptCtrl.text.trim(),
                    entryRules: rules,
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );

    if (generated != null) {
      widget.onSaveStrategy(generated);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Generated strategy "${generated.name}"')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.auto_awesome, size: 20, color: Color(0xFFA855F7)),
              const SizedBox(width: 8),
              const Text(
                'Strategy Studio & Visual Rule Builder',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
              ),
              const Spacer(),
              OutlinedButton.icon(
                onPressed: _showAiGeneratorDialog,
                icon: const Icon(Icons.psychology, size: 17, color: Color(0xFFA855F7)),
                label: const Text('AI Generator'),
              ),
              const SizedBox(width: 8),
              FilledButton.icon(
                onPressed: () => _showStrategyEditorDialog(),
                icon: const Icon(Icons.add, size: 18),
                label: const Text('New Strategy'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Expanded(
            child: ListView.builder(
              itemCount: widget.strategies.length,
              itemBuilder: (ctx, i) {
                final s = widget.strategies[i];
                return Card(
                  margin: const EdgeInsets.only(bottom: 10),
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Switch(
                              value: s.isEnabled,
                              onChanged: (v) =>
                                  widget.onSaveStrategy(s.copyWith(isEnabled: v)),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(s.name,
                                      style: const TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.bold)),
                                  Text(
                                    '${s.symbol} · ${s.timeframe.code} · Risk ${s.riskPercent.toStringAsFixed(1)}% · SL ${s.stopLossAtrMult}x ATR / TP ${s.takeProfitAtrMult}x ATR',
                                    style: const TextStyle(
                                        fontSize: 12, color: Colors.grey),
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              tooltip: 'Edit Rules',
                              icon: const Icon(Icons.edit_outlined, size: 18),
                              onPressed: () =>
                                  _showStrategyEditorDialog(existing: s),
                            ),
                            OutlinedButton.icon(
                              onPressed: () => widget.onRunEvaluation(s),
                              icon: const Icon(Icons.play_arrow, size: 16),
                              label: const Text('Evaluate Now'),
                            ),
                            const SizedBox(width: 8),
                            IconButton(
                              icon: const Icon(Icons.delete_outline,
                                  color: Colors.redAccent),
                              onPressed: () => widget.onDeleteStrategy(s.id),
                            ),
                          ],
                        ),
                        if (s.description.isNotEmpty) ...[
                          const SizedBox(height: 6),
                          Text(s.description,
                              style: const TextStyle(
                                  fontSize: 12, color: Colors.white70)),
                        ],
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: s.entryRules
                              .map((r) => Chip(
                                    label: Text(
                                      '${r.indicator} (${r.condition} ${r.threshold})',
                                      style: const TextStyle(fontSize: 11),
                                    ),
                                  ))
                              .toList(),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
