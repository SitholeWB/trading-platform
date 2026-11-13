import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import '../../models/trading_models.dart';
import '../../services/indicator_engine.dart';

class SimulatorPage extends StatefulWidget {
  final String selectedSymbol;
  final double currentPrice;
  final ValueChanged<Candle> onInjectCandle;

  const SimulatorPage({
    super.key,
    required this.selectedSymbol,
    required this.currentPrice,
    required this.onInjectCandle,
  });

  @override
  State<SimulatorPage> createState() => _SimulatorPageState();
}

class _SimulatorPageState extends State<SimulatorPage> {
  double _deltaPercent = 0.35;
  bool _autoReplay = false;
  Timer? _replayTimer;
  final List<String> _history = [];
  final _rng = math.Random();

  final _openCtrl = TextEditingController();
  final _highCtrl = TextEditingController();
  final _lowCtrl = TextEditingController();
  final _closeCtrl = TextEditingController();
  final _volCtrl = TextEditingController(text: '1500');

  @override
  void initState() {
    super.initState();
    _syncFormFromPrice();
  }

  @override
  void didUpdateWidget(covariant SimulatorPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.selectedSymbol != widget.selectedSymbol) {
      _syncFormFromPrice();
    }
  }

  void _syncFormFromPrice() {
    final p = widget.currentPrice;
    _openCtrl.text = IndicatorEngine.formatPrice(p, widget.selectedSymbol);
    _highCtrl.text =
        IndicatorEngine.formatPrice(p * 1.0015, widget.selectedSymbol);
    _lowCtrl.text =
        IndicatorEngine.formatPrice(p * 0.9985, widget.selectedSymbol);
    _closeCtrl.text =
        IndicatorEngine.formatPrice(p * 1.0008, widget.selectedSymbol);
  }

  @override
  void dispose() {
    _replayTimer?.cancel();
    _openCtrl.dispose();
    _highCtrl.dispose();
    _lowCtrl.dispose();
    _closeCtrl.dispose();
    _volCtrl.dispose();
    super.dispose();
  }

  void _toggleAutoReplay(bool enabled) {
    _replayTimer?.cancel();
    setState(() => _autoReplay = enabled);
    if (enabled) {
      _replayTimer = Timer.periodic(const Duration(seconds: 1), (_) {
        if (!mounted) return;
        final shift = (_rng.nextDouble() - 0.48) * _deltaPercent;
        _inject(shift, silent: true);
      });
    }
  }

  void _inject(double pctShift, {bool silent = false}) {
    final open = widget.currentPrice;
    final close = open * (1 + pctShift / 100.0);
    final high = (open > close ? open : close) * 1.001;
    final low = (open < close ? open : close) * 0.999;
    final candle = Candle(
      timestamp: DateTime.now().toUtc(),
      open: IndicatorEngine.roundDynamic(open, widget.selectedSymbol, open),
      high: IndicatorEngine.roundDynamic(high, widget.selectedSymbol, open),
      low: IndicatorEngine.roundDynamic(low, widget.selectedSymbol, open),
      close: IndicatorEngine.roundDynamic(close, widget.selectedSymbol, open),
      volume: 1250,
      isComplete: false,
    );
    widget.onInjectCandle(candle);
    setState(() {
      _history.insert(
        0,
        '${candle.timestamp.toIso8601String().substring(11, 19)} UTC · ${widget.selectedSymbol} '
        '${pctShift >= 0 ? '+' : ''}${pctShift.toStringAsFixed(2)}% → '
        '${IndicatorEngine.formatPrice(candle.close, widget.selectedSymbol)}',
      );
      if (_history.length > 40) _history.removeLast();
    });
    if (!silent) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Injected ${pctShift >= 0 ? '+' : ''}${pctShift.toStringAsFixed(2)}% candle on ${widget.selectedSymbol}',
          ),
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  void _injectCustomCandle() {
    final o = double.tryParse(_openCtrl.text.trim()) ?? widget.currentPrice;
    final h = double.tryParse(_highCtrl.text.trim()) ?? o * 1.001;
    final l = double.tryParse(_lowCtrl.text.trim()) ?? o * 0.999;
    final c = double.tryParse(_closeCtrl.text.trim()) ?? o;
    final v = double.tryParse(_volCtrl.text.trim()) ?? 1500;
    final candle = Candle(
      timestamp: DateTime.now().toUtc(),
      open: IndicatorEngine.roundDynamic(o, widget.selectedSymbol, o),
      high: IndicatorEngine.roundDynamic(h, widget.selectedSymbol, o),
      low: IndicatorEngine.roundDynamic(l, widget.selectedSymbol, o),
      close: IndicatorEngine.roundDynamic(c, widget.selectedSymbol, o),
      volume: v,
      isComplete: true,
    );
    widget.onInjectCandle(candle);
    setState(() {
      _history.insert(
        0,
        'CUSTOM OHLCV · ${widget.selectedSymbol} O:${IndicatorEngine.formatPrice(o, widget.selectedSymbol)} '
        'H:${IndicatorEngine.formatPrice(h, widget.selectedSymbol)} '
        'L:${IndicatorEngine.formatPrice(l, widget.selectedSymbol)} '
        'C:${IndicatorEngine.formatPrice(c, widget.selectedSymbol)}',
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 3,
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.science, color: Color(0xFF06B6D4)),
                          const SizedBox(width: 8),
                          const Text(
                            'Ingestion & Candle Simulation Sandbox',
                            style: TextStyle(
                                fontSize: 17, fontWeight: FontWeight.bold),
                          ),
                          const Spacer(),
                          Switch(
                            value: _autoReplay,
                            onChanged: _toggleAutoReplay,
                          ),
                          const Text('Auto-Tick Stream (1s)',
                              style: TextStyle(fontSize: 12)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Active Instrument: ${widget.selectedSymbol} @ ${IndicatorEngine.formatPrice(widget.currentPrice, widget.selectedSymbol)}',
                        style: const TextStyle(
                            fontFamily: 'monospace',
                            fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          const Text('Impulse Size (%): '),
                          Expanded(
                            child: Slider(
                              value: _deltaPercent,
                              min: 0.05,
                              max: 5.0,
                              divisions: 99,
                              label: '${_deltaPercent.toStringAsFixed(2)}%',
                              onChanged: (v) =>
                                  setState(() => _deltaPercent = v),
                            ),
                          ),
                          Text('${_deltaPercent.toStringAsFixed(2)}%'),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 10,
                        runSpacing: 10,
                        children: [
                          FilledButton.icon(
                            style: FilledButton.styleFrom(
                                backgroundColor: const Color(0xFF10B981)),
                            onPressed: () => _inject(_deltaPercent),
                            icon: const Icon(Icons.trending_up),
                            label: Text(
                                'Bullish (+${_deltaPercent.toStringAsFixed(2)}%)'),
                          ),
                          FilledButton.icon(
                            style: FilledButton.styleFrom(
                                backgroundColor: const Color(0xFFEF4444)),
                            onPressed: () => _inject(-_deltaPercent),
                            icon: const Icon(Icons.trending_down),
                            label: Text(
                                'Bearish (-${_deltaPercent.toStringAsFixed(2)}%)'),
                          ),
                          OutlinedButton.icon(
                            onPressed: () => _inject(2.5),
                            icon: const Icon(Icons.bolt,
                                color: Color(0xFF10B981)),
                            label: const Text('Pump (+2.5%)'),
                          ),
                          OutlinedButton.icon(
                            onPressed: () => _inject(-2.5),
                            icon: const Icon(Icons.flash_on,
                                color: Color(0xFFEF4444)),
                            label: const Text('Flash Crash (-2.5%)'),
                          ),
                        ],
                      ),
                      const Divider(height: 28),
                      Row(
                        children: [
                          const Text(
                            'Custom OHLCV Candle Builder',
                            style: TextStyle(
                                fontSize: 14, fontWeight: FontWeight.bold),
                          ),
                          const Spacer(),
                          TextButton(
                            onPressed: _syncFormFromPrice,
                            child: const Text('Reset to Current Price'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _openCtrl,
                              decoration: const InputDecoration(
                                labelText: 'Open',
                                border: OutlineInputBorder(),
                                isDense: true,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: TextField(
                              controller: _highCtrl,
                              decoration: const InputDecoration(
                                labelText: 'High',
                                border: OutlineInputBorder(),
                                isDense: true,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: TextField(
                              controller: _lowCtrl,
                              decoration: const InputDecoration(
                                labelText: 'Low',
                                border: OutlineInputBorder(),
                                isDense: true,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: TextField(
                              controller: _closeCtrl,
                              decoration: const InputDecoration(
                                labelText: 'Close',
                                border: OutlineInputBorder(),
                                isDense: true,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          SizedBox(
                            width: 90,
                            child: TextField(
                              controller: _volCtrl,
                              decoration: const InputDecoration(
                                labelText: 'Volume',
                                border: OutlineInputBorder(),
                                isDense: true,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      FilledButton.icon(
                        onPressed: _injectCustomCandle,
                        icon: const Icon(Icons.add_chart),
                        label: const Text('Inject Custom OHLCV Candle'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            flex: 2,
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Text(
                          'Injected Tick & Candle Log',
                          style: TextStyle(
                              fontSize: 14, fontWeight: FontWeight.bold),
                        ),
                        const Spacer(),
                        if (_history.isNotEmpty)
                          TextButton(
                            onPressed: () => setState(() => _history.clear()),
                            child: const Text('Clear'),
                          ),
                      ],
                    ),
                    const Divider(),
                    Expanded(
                      child: _history.isEmpty
                          ? const Center(
                              child: Text(
                                'No simulated candles injected yet.',
                                style: TextStyle(color: Colors.grey),
                              ),
                            )
                          : ListView.separated(
                              itemCount: _history.length,
                              separatorBuilder: (_, _) =>
                                  const Divider(height: 1),
                              itemBuilder: (_, i) => ListTile(
                                dense: true,
                                title: Text(
                                  _history[i],
                                  style: const TextStyle(
                                      fontFamily: 'monospace', fontSize: 11.5),
                                ),
                              ),
                            ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
