import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import '../../models/trading_models.dart';
import '../../services/indicator_engine.dart';
import '../../services/strategy_scanner.dart';
import '../chart/native_chart_widget.dart';

class SimulatorPage extends StatefulWidget {
  final String selectedSymbol;
  final Timeframe timeframe;
  final double currentPrice;
  final List<Candle> candles;
  final List<Position> openPositions;
  final List<PriceAlert> activeAlerts;
  final List<StrategyDefinition> strategies;
  final double balance;
  final double equity;
  final ValueChanged<Candle> onInjectCandle;
  final Future<void> Function() onResetToLive;
  final void Function(String side, String symbol, double lots, double price)?
      onQuickOrder;

  const SimulatorPage({
    super.key,
    required this.selectedSymbol,
    required this.timeframe,
    required this.currentPrice,
    required this.candles,
    required this.openPositions,
    required this.activeAlerts,
    required this.strategies,
    required this.balance,
    required this.equity,
    required this.onInjectCandle,
    required this.onResetToLive,
    this.onQuickOrder,
  });

  @override
  State<SimulatorPage> createState() => _SimulatorPageState();
}

class _SimulatorPageState extends State<SimulatorPage> {
  double _deltaPercent = 0.50;
  bool _autoReplay = false;
  String _replayRegime = 'Random Walk'; // Random Walk, Bull Drift, Bear Drift, Volatility
  bool _showCustomOhlc = false;
  bool _resetting = false;
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
        final double shift = switch (_replayRegime) {
          'Bull Drift' => (_rng.nextDouble() - 0.25) * _deltaPercent,
          'Bear Drift' => (_rng.nextDouble() - 0.75) * _deltaPercent,
          'Volatility' => (_rng.nextDouble() - 0.5) * _deltaPercent * 2.5,
          _ => (_rng.nextDouble() - 0.48) * _deltaPercent,
        };
        _injectScenario(
          label: 'Auto-Tick ($_replayRegime)',
          closePct: shift,
          silent: true,
        );
      });
    }
  }

  void _injectScenario({
    required String label,
    required double closePct,
    double? wickHighPct,
    double? wickLowPct,
    bool silent = false,
  }) {
    final open = widget.currentPrice > 0 ? widget.currentPrice : 1.0;
    final close = open * (1 + closePct / 100.0);
    final baseHigh = math.max(open, close);
    final baseLow = math.min(open, close);
    final high = wickHighPct != null
        ? math.max(baseHigh, open * (1 + wickHighPct / 100.0))
        : baseHigh * 1.001;
    final low = wickLowPct != null
        ? math.min(baseLow, open * (1 + wickLowPct / 100.0))
        : baseLow * 0.999;

    final candle = Candle(
      timestamp: DateTime.now().toUtc(),
      open: IndicatorEngine.roundDynamic(open, widget.selectedSymbol, open),
      high: IndicatorEngine.roundDynamic(high, widget.selectedSymbol, open),
      low: IndicatorEngine.roundDynamic(low, widget.selectedSymbol, open),
      close: IndicatorEngine.roundDynamic(close, widget.selectedSymbol, open),
      volume: 1400,
      isComplete: true,
    );
    widget.onInjectCandle(candle);
    setState(() {
      _history.insert(
        0,
        '${candle.timestamp.toIso8601String().substring(11, 19)} UTC · $label '
        '(${closePct >= 0 ? '+' : ''}${closePct.toStringAsFixed(2)}%) → '
        '${IndicatorEngine.formatPrice(candle.close, widget.selectedSymbol)}',
      );
      if (_history.length > 40) _history.removeLast();
      _syncFormFromPrice();
    });
    if (!silent) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '$label applied on ${widget.selectedSymbol} → ${IndicatorEngine.formatPrice(candle.close, widget.selectedSymbol)}',
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
        'C:${IndicatorEngine.formatPrice(c, widget.selectedSymbol)}',
      );
      if (_history.length > 40) _history.removeLast();
    });
  }

  Future<void> _handleReset() async {
    _toggleAutoReplay(false);
    setState(() => _resetting = true);
    await widget.onResetToLive();
    if (!mounted) return;
    setState(() {
      _resetting = false;
      _history.clear();
      _syncFormFromPrice();
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Reset ${widget.selectedSymbol} back to live market data'),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final symbolPositions = widget.openPositions
        .where((p) => p.symbol == widget.selectedSymbol)
        .toList();
    final symbolAlerts = widget.activeAlerts
        .where((a) => a.symbol == widget.selectedSymbol && !a.triggered)
        .toList();
    final symbolStrategies = widget.strategies
        .where((s) =>
            s.symbol == widget.selectedSymbol || s.scanUniverse != 'SINGLE')
        .toList();
    final openPnl =
        widget.openPositions.fold<double>(0.0, (s, p) => s + p.unrealizedPnl);

    return Padding(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Top Lab Banner
          Card(
            margin: EdgeInsets.zero,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              child: Row(
                children: [
                  const Icon(Icons.science, color: Color(0xFF06B6D4), size: 22),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Market Replay & Stress-Test Lab',
                          style: TextStyle(
                              fontSize: 15, fontWeight: FontWeight.bold),
                        ),
                        Text(
                          'Simulate price spikes, stop-hunts, or weekend ticks on ${widget.selectedSymbol} to test SL/TP, alerts, and strategies visually.',
                          style: const TextStyle(
                              fontSize: 11.5, color: Colors.grey),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 10),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFF06B6D4).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      '${widget.selectedSymbol}  ${IndicatorEngine.formatPrice(widget.currentPrice, widget.selectedSymbol)}',
                      style: const TextStyle(
                        fontFamily: 'monospace',
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        color: Color(0xFF38BDF8),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  if (widget.onQuickOrder != null) ...[
                    FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        visualDensity: VisualDensity.compact,
                      ),
                      onPressed: () => widget.onQuickOrder!(
                        'Buy',
                        widget.selectedSymbol,
                        0.10,
                        widget.currentPrice,
                      ),
                      child: const Text('Test Buy 0.10',
                          style: TextStyle(fontSize: 11.5)),
                    ),
                    const SizedBox(width: 6),
                    FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFFEF4444),
                        visualDensity: VisualDensity.compact,
                      ),
                      onPressed: () => widget.onQuickOrder!(
                        'Sell',
                        widget.selectedSymbol,
                        0.10,
                        widget.currentPrice,
                      ),
                      child: const Text('Test Sell 0.10',
                          style: TextStyle(fontSize: 11.5)),
                    ),
                    const SizedBox(width: 10),
                  ],
                  OutlinedButton.icon(
                    onPressed: _resetting ? null : _handleReset,
                    icon: _resetting
                        ? const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.refresh, size: 16),
                    label: Text(
                        _resetting ? 'Resetting...' : 'Reset to Live Market'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Left Control Panel: Scenarios + Auto-Replay + Custom OHLCV
                SizedBox(
                  width: 375,
                  child: Card(
                    margin: EdgeInsets.zero,
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: SingleChildScrollView(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              '1. One-Click Market Scenarios',
                              style: TextStyle(
                                  fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            const SizedBox(height: 8),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                ActionChip(
                                  avatar: const Icon(Icons.trending_up,
                                      size: 15, color: Color(0xFF10B981)),
                                  label: const Text('Breakout +1.5%',
                                      style: TextStyle(fontSize: 11.5)),
                                  onPressed: () => _injectScenario(
                                    label: 'Breakout Spike',
                                    closePct: 1.5,
                                  ),
                                ),
                                ActionChip(
                                  avatar: const Icon(Icons.trending_down,
                                      size: 15, color: Color(0xFFEF4444)),
                                  label: const Text('Flash Crash -2.5%',
                                      style: TextStyle(fontSize: 11.5)),
                                  onPressed: () => _injectScenario(
                                    label: 'Flash Crash',
                                    closePct: -2.5,
                                  ),
                                ),
                                ActionChip(
                                  avatar: const Icon(Icons.bolt,
                                      size: 15, color: Color(0xFFF59E0B)),
                                  label: const Text('Bull Stop-Hunt Wick',
                                      style: TextStyle(fontSize: 11.5)),
                                  onPressed: () => _injectScenario(
                                    label: 'Bull Stop-Hunt',
                                    closePct: 0.4,
                                    wickLowPct: -1.3,
                                  ),
                                ),
                                ActionChip(
                                  avatar: const Icon(Icons.bolt,
                                      size: 15, color: Color(0xFFF59E0B)),
                                  label: const Text('Bear Stop-Hunt Wick',
                                      style: TextStyle(fontSize: 11.5)),
                                  onPressed: () => _injectScenario(
                                    label: 'Bear Stop-Hunt',
                                    closePct: -0.4,
                                    wickHighPct: 1.3,
                                  ),
                                ),
                                ActionChip(
                                  avatar: const Icon(Icons.horizontal_rule,
                                      size: 15, color: Colors.grey),
                                  label: const Text('Sideways Chop',
                                      style: TextStyle(fontSize: 11.5)),
                                  onPressed: () => _injectScenario(
                                    label: 'Sideways Chop',
                                    closePct: (_rng.nextDouble() - 0.5) * 0.2,
                                    wickHighPct: 0.25,
                                    wickLowPct: -0.25,
                                  ),
                                ),
                              ],
                            ),
                            const Divider(height: 22),
                            const Text(
                              '2. Manual Candle Move',
                              style: TextStyle(
                                  fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                Text(
                                  'Move Size: ${_deltaPercent.toStringAsFixed(2)}%',
                                  style: const TextStyle(
                                      fontSize: 12, color: Colors.grey),
                                ),
                                Expanded(
                                  child: Slider(
                                    value: _deltaPercent,
                                    min: 0.05,
                                    max: 5.0,
                                    divisions: 99,
                                    onChanged: (v) =>
                                        setState(() => _deltaPercent = v),
                                  ),
                                ),
                              ],
                            ),
                            Row(
                              children: [
                                Expanded(
                                  child: FilledButton.icon(
                                    style: FilledButton.styleFrom(
                                        backgroundColor:
                                            const Color(0xFF10B981)),
                                    icon: const Icon(Icons.arrow_upward,
                                        size: 15),
                                    label: Text(
                                        '+${_deltaPercent.toStringAsFixed(2)}%'),
                                    onPressed: () => _injectScenario(
                                      label: 'Bull Impulse',
                                      closePct: _deltaPercent,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: FilledButton.icon(
                                    style: FilledButton.styleFrom(
                                        backgroundColor:
                                            const Color(0xFFEF4444)),
                                    icon: const Icon(Icons.arrow_downward,
                                        size: 15),
                                    label: Text(
                                        '-${_deltaPercent.toStringAsFixed(2)}%'),
                                    onPressed: () => _injectScenario(
                                      label: 'Bear Impulse',
                                      closePct: -_deltaPercent,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const Divider(height: 22),
                            Row(
                              children: [
                                const Expanded(
                                  child: Text(
                                    '3. Weekend Auto-Replay (1s)',
                                    style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 13),
                                  ),
                                ),
                                Switch(
                                  value: _autoReplay,
                                  onChanged: _toggleAutoReplay,
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            DropdownButtonFormField<String>(
                              initialValue: _replayRegime,
                              isDense: true,
                              decoration: const InputDecoration(
                                labelText: 'Replay Regime',
                                border: OutlineInputBorder(),
                                isDense: true,
                              ),
                              items: const [
                                DropdownMenuItem(
                                    value: 'Random Walk',
                                    child: Text('Random Walk (Balanced)')),
                                DropdownMenuItem(
                                    value: 'Bull Drift',
                                    child: Text('Bullish Trend Drift')),
                                DropdownMenuItem(
                                    value: 'Bear Drift',
                                    child: Text('Bearish Trend Drift')),
                                DropdownMenuItem(
                                    value: 'Volatility',
                                    child: Text('High Volatility Shock')),
                              ],
                              onChanged: (v) {
                                if (v != null) {
                                  setState(() => _replayRegime = v);
                                }
                              },
                            ),
                            const Divider(height: 22),
                            InkWell(
                              onTap: () => setState(
                                  () => _showCustomOhlc = !_showCustomOhlc),
                              child: Row(
                                children: [
                                  const Expanded(
                                    child: Text(
                                      '4. Exact Price / Custom OHLCV',
                                      style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 13),
                                    ),
                                  ),
                                  Icon(
                                    _showCustomOhlc
                                        ? Icons.expand_less
                                        : Icons.expand_more,
                                    size: 18,
                                  ),
                                ],
                              ),
                            ),
                            if (_showCustomOhlc) ...[
                              const SizedBox(height: 10),
                              Row(
                                children: [
                                  Expanded(
                                      child: _numField(_openCtrl, 'Open')),
                                  const SizedBox(width: 6),
                                  Expanded(
                                      child: _numField(_highCtrl, 'High')),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  Expanded(child: _numField(_lowCtrl, 'Low')),
                                  const SizedBox(width: 6),
                                  Expanded(
                                      child: _numField(_closeCtrl, 'Close')),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  Expanded(
                                      child: _numField(_volCtrl, 'Volume')),
                                  const SizedBox(width: 8),
                                  FilledButton.icon(
                                    icon: const Icon(Icons.add_chart, size: 15),
                                    label: const Text('Inject'),
                                    onPressed: _injectCustomCandle,
                                  ),
                                ],
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                // Right Live Feedback Area: Mini-Chart + Impact Cards + Log
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Live Chart showing injected candles, positions & alerts
                      Expanded(
                        flex: 3,
                        child: Card(
                          margin: EdgeInsets.zero,
                          clipBehavior: Clip.antiAlias,
                          child: widget.candles.isEmpty
                              ? const Center(
                                  child: Text(
                                    'Waiting for candles...',
                                    style: TextStyle(color: Colors.grey),
                                  ),
                                )
                              : NativeChartWidget(
                                  symbol: widget.selectedSymbol,
                                  timeframe: widget.timeframe,
                                  candles: widget.candles,
                                  chartType: ChartType.candlestick,
                                  indicators: const IndicatorSettings(
                                      ema20: true, ema50: true),
                                  activeTool: DrawingTool.cursor,
                                  drawings: const [],
                                  onAddDrawing: (_) {},
                                  onDrawingComplete: () {},
                                  openPositions: symbolPositions,
                                  activeAlerts: symbolAlerts,
                                  timezoneOffsetHours: 0,
                                  secondsUntilSync: 60,
                                  isSyncing: false,
                                  onManualSync: () {},
                                  showSyncBadge: false,
                                ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      // Bottom Impact & Log Row
                      SizedBox(
                        height: 195,
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // Card 1: Account & Positions Impact
                            Expanded(
                              child: Card(
                                margin: EdgeInsets.zero,
                                child: Padding(
                                  padding: const EdgeInsets.all(12),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'Account & Position Impact',
                                        style: TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 12.5),
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        'Equity: \$${widget.equity.toStringAsFixed(2)}  (Open P&L: ${openPnl >= 0 ? '+' : ''}\$${openPnl.toStringAsFixed(2)})',
                                        style: TextStyle(
                                          fontSize: 11.5,
                                          fontFamily: 'monospace',
                                          color: openPnl >= 0
                                              ? const Color(0xFF10B981)
                                              : const Color(0xFFEF4444),
                                        ),
                                      ),
                                      const Divider(height: 12),
                                      Expanded(
                                        child: symbolPositions.isEmpty
                                            ? const Center(
                                                child: Text(
                                                  'No open positions on this symbol.\nUse "Test Buy/Sell" above to stress-test SL/TP.',
                                                  textAlign: TextAlign.center,
                                                  style: TextStyle(
                                                      fontSize: 11,
                                                      color: Colors.grey),
                                                ),
                                              )
                                            : ListView.builder(
                                                itemCount:
                                                    symbolPositions.length,
                                                itemBuilder: (_, i) {
                                                  final p = symbolPositions[i];
                                                  final pos = p.unrealizedPnl >= 0;
                                                  return Padding(
                                                    padding:
                                                        const EdgeInsets.only(
                                                            bottom: 4),
                                                    child: Text(
                                                      '#${p.ticket} ${p.orderType} ${p.lots} @ ${IndicatorEngine.formatPrice(p.entryPrice, p.symbol)} → ${pos ? '+' : ''}\$${p.unrealizedPnl.toStringAsFixed(2)}',
                                                      style: TextStyle(
                                                        fontSize: 11,
                                                        fontFamily: 'monospace',
                                                        color: pos
                                                            ? const Color(
                                                                0xFF10B981)
                                                            : const Color(
                                                                0xFFEF4444),
                                                      ),
                                                    ),
                                                  );
                                                },
                                              ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            // Card 2: Alerts & Strategy Rules Live Check
                            Expanded(
                              child: Card(
                                margin: EdgeInsets.zero,
                                child: Padding(
                                  padding: const EdgeInsets.all(12),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Active Alerts (${symbolAlerts.length}) & Strategies (${symbolStrategies.length})',
                                        style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 12.5),
                                      ),
                                      const Divider(height: 12),
                                      Expanded(
                                        child: (symbolAlerts.isEmpty &&
                                                symbolStrategies.isEmpty)
                                            ? const Center(
                                                child: Text(
                                                  'No active alerts or strategies for this symbol.',
                                                  textAlign: TextAlign.center,
                                                  style: TextStyle(
                                                      fontSize: 11,
                                                      color: Colors.grey),
                                                ),
                                              )
                                            : ListView(
                                                children: [
                                                  for (final a in symbolAlerts)
                                                    Padding(
                                                      padding:
                                                          const EdgeInsets.only(
                                                              bottom: 4),
                                                      child: Text(
                                                        'Alert: ${a.condition} ${IndicatorEngine.formatPrice(a.targetPrice, a.symbol)}',
                                                        style: const TextStyle(
                                                          fontSize: 11,
                                                          color:
                                                              Color(0xFFF59E0B),
                                                        ),
                                                      ),
                                                    ),
                                                  for (final s
                                                      in symbolStrategies)
                                                    Builder(builder: (_) {
                                                      final audit = StrategyScanner
                                                          .evaluateStrategyOnCandles(
                                                        s.copyWith(
                                                            symbol: widget
                                                                .selectedSymbol),
                                                        widget.candles,
                                                      );
                                                      return Padding(
                                                        padding:
                                                            const EdgeInsets
                                                                .only(
                                                                bottom: 4),
                                                        child: Text(
                                                          '${s.name}: ${audit.outcome} (${audit.direction} · ${audit.matchScore.toStringAsFixed(0)}%)',
                                                          style: TextStyle(
                                                            fontSize: 11,
                                                            color: audit.outcome ==
                                                                    'Executed'
                                                                ? const Color(
                                                                    0xFF10B981)
                                                                : Colors.grey,
                                                          ),
                                                        ),
                                                      );
                                                    }),
                                                ],
                                              ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            // Card 3: Simulation Log
                            Expanded(
                              child: Card(
                                margin: EdgeInsets.zero,
                                child: Padding(
                                  padding: const EdgeInsets.all(12),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'Simulation Event Log',
                                        style: TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 12.5),
                                      ),
                                      const Divider(height: 12),
                                      Expanded(
                                        child: _history.isEmpty
                                            ? const Center(
                                                child: Text(
                                                  'Click a scenario on the left to inject a candle.',
                                                  textAlign: TextAlign.center,
                                                  style: TextStyle(
                                                      fontSize: 11,
                                                      color: Colors.grey),
                                                ),
                                              )
                                            : ListView.builder(
                                                itemCount: _history.length,
                                                itemBuilder: (_, i) => Padding(
                                                  padding:
                                                      const EdgeInsets.only(
                                                          bottom: 4),
                                                  child: Text(
                                                    _history[i],
                                                    style: const TextStyle(
                                                      fontSize: 10.5,
                                                      fontFamily: 'monospace',
                                                      color: Color(0xFF94A3B8),
                                                    ),
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
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _numField(TextEditingController ctrl, String label) {
    return TextField(
      controller: ctrl,
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
        isDense: true,
      ),
      style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
    );
  }
}
