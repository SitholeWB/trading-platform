import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import '../../models/trading_models.dart';
import '../../services/indicator_engine.dart';
import '../../services/localization_service.dart';
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
  int _mode = 0; // 0 = Synthetic Stress-Test (Multi-Month), 1 = Live Shock Replay

  // --- Mode 0: Synthetic Multi-Month Stress-Test ---
  String? _selectedStrategyId;
  int _periodMonths = 6; // 1, 3, 6, 12
  String _stressRegime = 'Sideways / Whipsaw Chop';
  List<Candle> _syntheticCandles = [];
  StrategyBacktestResult? _stressResult;
  int _slHits = 0;
  int _tpHits = 0;
  int _worstLosingStreak = 0;
  int _runNumber = 0;

  // --- Mode 1: Live Shock Replay ---
  double _deltaPercent = 0.50;
  bool _autoReplay = false;
  String _replayRegime = 'Random Walk';
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
    if (widget.strategies.isNotEmpty) {
      _selectedStrategyId = widget.strategies.first.id;
    }
    _syncFormFromPrice();
  }

  @override
  void didUpdateWidget(covariant SimulatorPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.selectedSymbol != widget.selectedSymbol) {
      _syncFormFromPrice();
    }
    if ((_selectedStrategyId == null ||
            !widget.strategies.any((s) => s.id == _selectedStrategyId)) &&
        widget.strategies.isNotEmpty) {
      _selectedStrategyId = widget.strategies.first.id;
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

  StrategyDefinition? get _selectedStrategy {
    if (widget.strategies.isEmpty) return null;
    return widget.strategies.firstWhere(
      (s) => s.id == _selectedStrategyId,
      orElse: () => widget.strategies.first,
    );
  }

  int _barsForMonths(Timeframe tf, int months) {
    final totalSeconds = months * 30 * 24 * 60 * 60;
    final raw = (totalSeconds / tf.seconds).round();
    return raw.clamp(120, 5000);
  }

  List<Candle> _generateSyntheticSeries({
    required String symbol,
    required Timeframe tf,
    required double startPrice,
    required int barCount,
    required String regime,
  }) {
    final base = startPrice > 0 ? startPrice : 1.0;
    final now = DateTime.now().toUtc();
    final step = Duration(seconds: tf.seconds);
    final start = now.subtract(step * barCount);
    final out = <Candle>[];
    double price = base;

    final double volScale = switch (tf) {
      Timeframe.m1 => 0.0008,
      Timeframe.m5 => 0.0016,
      Timeframe.m15 => 0.0026,
      Timeframe.m30 => 0.0036,
      Timeframe.h1 => 0.0048,
      Timeframe.h4 => 0.0085,
      Timeframe.d1 => 0.0150,
      Timeframe.w1 => 0.0280,
    };

    for (int i = 0; i < barCount; i++) {
      final t = start.add(step * i);
      final noise = (_rng.nextDouble() - 0.5) * 2.0; // -1..1
      double pctMove;

      switch (regime) {
        case 'Bullish Trend':
          // Upward drift with occasional pullback waves
          final wave = math.sin(i / 18.0) * 0.25;
          pctMove = (0.14 + wave + noise * 0.85) * volScale;
          break;
        case 'Bearish Trend':
          final wave = math.sin(i / 18.0) * 0.25;
          pctMove = (-0.14 + wave + noise * 0.85) * volScale;
          break;
        case 'High-Volatility & Flash Crashes':
          // Large volatility + periodic 2-4% flash crash / spike shocks
          final isShock = _rng.nextDouble() < 0.035;
          if (isShock) {
            final dir = _rng.nextBool() ? -1.0 : 0.7;
            pctMove = dir * (0.018 + _rng.nextDouble() * 0.025);
          } else {
            pctMove = noise * volScale * 1.9;
          }
          break;
        case 'Sideways / Whipsaw Chop':
        default:
          // Mean-reverting oscillation around startPrice to stress-test false breakouts
          final pullToMean = ((base - price) / base) * 0.12;
          pctMove = pullToMean + noise * volScale * 1.1;
          break;
      }

      final open = price;
      final close = math.max(open * 0.0001, open * (1.0 + pctMove));
      final wickUp =
          math.max(open, close) * (1.0 + _rng.nextDouble() * volScale * 0.65);
      final wickDown =
          math.min(open, close) * (1.0 - _rng.nextDouble() * volScale * 0.65);

      out.add(Candle(
        timestamp: t,
        open: IndicatorEngine.roundDynamic(open, symbol, base),
        high: IndicatorEngine.roundDynamic(wickUp, symbol, base),
        low: IndicatorEngine.roundDynamic(wickDown, symbol, base),
        close: IndicatorEngine.roundDynamic(close, symbol, base),
        volume: 1000 + _rng.nextDouble() * 2500,
        isComplete: true,
      ));
      price = close;
    }
    return out;
  }

  void _runSyntheticStressTest() {
    final strat = _selectedStrategy;
    if (strat == null) return;
    final barCount = _barsForMonths(strat.timeframe, _periodMonths);
    final seedPrice =
        strat.symbol == widget.selectedSymbol && widget.currentPrice > 0
            ? widget.currentPrice
            : (widget.candles.isNotEmpty ? widget.candles.last.close : 1.0850);

    final fakeCandles = _generateSyntheticSeries(
      symbol: strat.symbol,
      tf: strat.timeframe,
      startPrice: seedPrice,
      barCount: barCount,
      regime: _stressRegime,
    );

    final bt = StrategyScanner.backtestStrategy(
      strat,
      fakeCandles,
      lookbackBars: barCount,
      requireAllRules: strat.combinator != 'OR',
    );

    int sl = 0;
    int tp = 0;
    int curLoss = 0;
    int maxLoss = 0;
    for (final tr in bt.trades) {
      if (tr.exitReason == 'SL Hit') sl++;
      if (tr.exitReason == 'TP Hit') tp++;
      if (tr.pnlPercent < 0) {
        curLoss++;
        if (curLoss > maxLoss) maxLoss = curLoss;
      } else {
        curLoss = 0;
      }
    }

    setState(() {
      _syntheticCandles = fakeCandles;
      _stressResult = bt;
      _slHits = sl;
      _tpHits = tp;
      _worstLosingStreak = maxLoss;
      _runNumber++;
    });
  }

  // --- Mode 1 Helpers ---
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
    return Padding(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Top Lab Banner with explicit SYNTHETIC DATA warning + Mode Switch
          Card(
            margin: EdgeInsets.zero,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              child: Row(
                children: [
                  const Icon(Icons.science, color: Color(0xFFF59E0B), size: 22),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              AppL10n.tr('sim.labTitle',
                                  'Synthetic Market & Risk Stress-Test Lab'),
                              style: const TextStyle(
                                  fontSize: 15, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 7, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF59E0B)
                                    .withValues(alpha: 0.16),
                                borderRadius: BorderRadius.circular(4),
                                border: Border.all(
                                  color: const Color(0xFFF59E0B)
                                      .withValues(alpha: 0.5),
                                ),
                              ),
                              child: Text(
                                AppL10n.tr('sim.syntheticBadge',
                                    'SYNTHETIC / FAKE DATA'),
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFFF59E0B),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          AppL10n.tr('sim.labSubtitle',
                              'Not real market prices — generates fake market regimes & shocks to stress-test your strategies, SL/TP sizing, and max drawdown survival.'),
                          style:
                              const TextStyle(fontSize: 11.5, color: Colors.grey),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  SegmentedButton<int>(
                    segments: [
                      ButtonSegment(
                        value: 0,
                        icon: const Icon(Icons.shield_outlined, size: 15),
                        label: Text(AppL10n.tr(
                            'sim.stressTest', 'Strategy Stress-Test')),
                      ),
                      ButtonSegment(
                        value: 1,
                        icon: const Icon(Icons.bolt, size: 15),
                        label: Text(AppL10n.tr(
                            'sim.shockReplay', 'Live Shock Replay')),
                      ),
                    ],
                    selected: {_mode},
                    onSelectionChanged: (s) {
                      if (s.first != 1 && _autoReplay) {
                        _toggleAutoReplay(false);
                      }
                      setState(() => _mode = s.first);
                    },
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: _mode == 0
                ? _buildSyntheticStressTestBody(context)
                : _buildLiveShockReplayBody(context),
          ),
        ],
      ),
    );
  }

  Widget _buildSyntheticStressTestBody(BuildContext context) {
    final strat = _selectedStrategy;
    final barCount =
        strat != null ? _barsForMonths(strat.timeframe, _periodMonths) : 0;
    final bt = _stressResult;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Left Config Panel
        SizedBox(
          width: 365,
          child: Card(
            margin: EdgeInsets.zero,
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    AppL10n.tr(
                        'sim.step1', '1. Choose Strategy to Stress-Test'),
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  const SizedBox(height: 8),
                  if (widget.strategies.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: Colors.white12),
                      ),
                      child: Text(
                        AppL10n.tr('sim.noStrategies',
                            'No saved strategies yet. Create one in Strategies first.'),
                        style:
                            const TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    )
                  else
                    DropdownButtonFormField<String>(
                      initialValue: strat?.id,
                      isExpanded: true,
                      decoration: InputDecoration(
                        labelText: AppL10n.tr('sim.strategyLabel', 'Strategy'),
                        border: const OutlineInputBorder(),
                        isDense: true,
                      ),
                      items: widget.strategies
                          .map((s) => DropdownMenuItem(
                                value: s.id,
                                child: Text(
                                  '${s.name} (${s.symbol} · ${s.timeframe.code})',
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontSize: 12.5),
                                ),
                              ))
                          .toList(),
                      onChanged: (v) => setState(() => _selectedStrategyId = v),
                    ),
                  if (strat != null) ...[
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: [
                        Chip(
                          visualDensity: VisualDensity.compact,
                          label: Text(
                              '${AppL10n.tr('dash.risk', 'Risk')}: ${strat.riskPercent}%',
                              style: const TextStyle(fontSize: 11)),
                        ),
                        Chip(
                          visualDensity: VisualDensity.compact,
                          label: Text('SL: ${strat.stopLossAtrMult}x ATR',
                              style: const TextStyle(fontSize: 11)),
                        ),
                        Chip(
                          visualDensity: VisualDensity.compact,
                          label: Text('TP: ${strat.takeProfitAtrMult}x ATR',
                              style: const TextStyle(fontSize: 11)),
                        ),
                        Chip(
                          visualDensity: VisualDensity.compact,
                          label: Text(
                              '${strat.entryRules.length} ${strat.entryRules.length == 1 ? AppL10n.tr('sim.rule', 'rule') : AppL10n.tr('sim.rules', 'rules')} (${strat.combinator})',
                              style: const TextStyle(fontSize: 11)),
                        ),
                      ],
                    ),
                  ],
                  const Divider(height: 22),
                  Text(
                    AppL10n.tr(
                        'sim.step2', '2. Synthetic Period (Fake History)'),
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<int>(
                    initialValue: _periodMonths,
                    decoration: InputDecoration(
                      labelText: AppL10n.tr('sim.period', 'Simulated Period'),
                      border: const OutlineInputBorder(),
                      isDense: true,
                    ),
                    items: [
                      DropdownMenuItem(
                          value: 1,
                          child: Text(
                              AppL10n.tr('sim.1m', '1 Month (30 Days)'))),
                      DropdownMenuItem(
                          value: 3,
                          child: Text(
                              AppL10n.tr('sim.3m', '3 Months (90 Days)'))),
                      DropdownMenuItem(
                          value: 6,
                          child: Text(
                              AppL10n.tr('sim.6m', '6 Months (180 Days)'))),
                      DropdownMenuItem(
                          value: 12,
                          child: Text(
                              AppL10n.tr('sim.1y', '1 Year (365 Days)'))),
                    ],
                    onChanged: (v) {
                      if (v != null) setState(() => _periodMonths = v);
                    },
                  ),
                  if (strat != null) ...[
                    const SizedBox(height: 6),
                    Text(
                      '${AppL10n.tr('sim.generates', 'Generates')} $barCount ${AppL10n.tr('sim.synthetic', 'synthetic')} ${strat.timeframe.code} ${AppL10n.tr('sim.candles', 'candles')} (~$_periodMonths ${AppL10n.tr('sim.mo', 'mo')}).',
                      style: const TextStyle(fontSize: 11, color: Colors.grey),
                    ),
                  ],
                  const Divider(height: 22),
                  Text(
                    AppL10n.tr('sim.step3', '3. Synthetic Market Regime'),
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    initialValue: _stressRegime,
                    decoration: InputDecoration(
                      labelText: AppL10n.tr('sim.behavior', 'Market Behavior'),
                      border: const OutlineInputBorder(),
                      isDense: true,
                    ),
                    items: [
                      DropdownMenuItem(
                        value: 'Bullish Trend',
                        child: Text(AppL10n.tr('sim.bullish',
                            'Bullish Trend (Pullbacks + Drift)')),
                      ),
                      DropdownMenuItem(
                        value: 'Bearish Trend',
                        child: Text(AppL10n.tr('sim.bearish',
                            'Bearish Trend (Bounces + Drift)')),
                      ),
                      DropdownMenuItem(
                        value: 'Sideways / Whipsaw Chop',
                        child: Text(AppL10n.tr(
                            'sim.chop', 'Sideways / Whipsaw Chop')),
                      ),
                      DropdownMenuItem(
                        value: 'High-Volatility & Flash Crashes',
                        child: Text(AppL10n.tr(
                            'sim.crash', 'High-Volatility & Flash Crashes')),
                      ),
                    ],
                    onChanged: (v) {
                      if (v != null) setState(() => _stressRegime = v);
                    },
                  ),
                  const SizedBox(height: 16),
                  FilledButton.icon(
                    onPressed: strat == null ? null : _runSyntheticStressTest,
                    icon: const Icon(Icons.play_arrow, size: 18),
                    label: Text(_runNumber == 0
                        ? AppL10n.tr('sim.runTest', 'Generate & Stress-Test')
                        : '${AppL10n.tr('sim.syntheticRun', 'Synthetic Run')} #${_runNumber + 1}'),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF59E0B).withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: const Color(0xFFF59E0B).withValues(alpha: 0.3),
                      ),
                    ),
                    child: Text(
                      AppL10n.tr('sim.tip',
                          'Tip: Run the same strategy across "Sideways Chop" and "Flash Crashes" 3-5 times to see if your SL multiplier & Max Drawdown survive worst-case conditions.'),
                      style: const TextStyle(
                          fontSize: 11, color: Color(0xFFFCD34D)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        // Right Results Area
        Expanded(
          child: bt == null || strat == null
              ? Card(
                  margin: EdgeInsets.zero,
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.shield_outlined,
                            size: 46, color: Color(0xFFF59E0B)),
                        const SizedBox(height: 10),
                        Text(
                          AppL10n.tr('sim.readyTitle',
                              'Ready to Stress-Test Your Risk Management'),
                          style: const TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 15),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          AppL10n.tr('sim.readyDesc',
                              'Pick a strategy, choose 1M–1Y of fake data + a market regime on the left, then click "Generate & Stress-Test".'),
                          style: const TextStyle(
                              color: Colors.grey, fontSize: 12.5),
                        ),
                      ],
                    ),
                  ),
                )
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Synthetic Chart
                    Expanded(
                      flex: 3,
                      child: Card(
                        margin: EdgeInsets.zero,
                        clipBehavior: Clip.antiAlias,
                        child: NativeChartWidget(
                          symbol: strat.symbol,
                          timeframe: strat.timeframe,
                          candles: _syntheticCandles,
                          chartType: ChartType.candlestick,
                          indicators: const IndicatorSettings(
                              ema20: true, ema50: true),
                          activeTool: DrawingTool.cursor,
                          drawings: const [],
                          onAddDrawing: (_) {},
                          onDrawingComplete: () {},
                          openPositions: const [],
                          activeAlerts: const [],
                          timezoneOffsetHours: 0,
                          secondsUntilSync: 60,
                          isSyncing: false,
                          onManualSync: () {},
                          showSyncBadge: false,
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    // Risk KPI Strip
                    Row(
                      children: [
                        _kpiCard(
                          'Synthetic Net Return',
                          '${bt.netReturnPct >= 0 ? '+' : ''}${bt.netReturnPct.toStringAsFixed(2)}%',
                          bt.netReturnPct >= 0
                              ? const Color(0xFF10B981)
                              : const Color(0xFFEF4444),
                        ),
                        const SizedBox(width: 8),
                        _kpiCard(
                          'Max Drawdown',
                          '${bt.maxDrawdownPct.toStringAsFixed(2)}%',
                          bt.maxDrawdownPct <= 10
                              ? const Color(0xFF38BDF8)
                              : const Color(0xFFEF4444),
                        ),
                        const SizedBox(width: 8),
                        _kpiCard(
                          'Win Rate / PF',
                          '${bt.winRate.toStringAsFixed(1)}% / ${bt.profitFactor.toStringAsFixed(2)}',
                          bt.winRate >= 50
                              ? const Color(0xFF10B981)
                              : const Color(0xFFF59E0B),
                        ),
                        const SizedBox(width: 8),
                        _kpiCard(
                          'SL vs TP Exits',
                          '$_slHits SL / $_tpHits TP',
                          const Color(0xFFA855F7),
                        ),
                        const SizedBox(width: 8),
                        _kpiCard(
                          'Worst Loss Streak',
                          '$_worstLosingStreak in a row',
                          _worstLosingStreak >= 5
                              ? const Color(0xFFEF4444)
                              : const Color(0xFF94A3B8),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    // Simulated Trades Table
                    Expanded(
                      flex: 2,
                      child: Card(
                        margin: EdgeInsets.zero,
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Synthetic Run #$_runNumber · ${bt.totalTrades} Simulated Trades over ${bt.barsTested} Fake ${strat.timeframe.code} Bars ($_stressRegime)',
                                style: const TextStyle(
                                    fontWeight: FontWeight.bold, fontSize: 12.5),
                              ),
                              const Divider(height: 12),
                              Expanded(
                                child: bt.trades.isEmpty
                                    ? const Center(
                                        child: Text(
                                          'No trades triggered in this synthetic run. Try another regime or re-roll.',
                                          style: TextStyle(
                                              color: Colors.grey, fontSize: 12),
                                        ),
                                      )
                                    : ListView.builder(
                                        itemCount: bt.trades.length,
                                        itemBuilder: (_, i) {
                                          final tr =
                                              bt.trades[bt.trades.length - 1 - i];
                                          final pos = tr.pnlPercent >= 0;
                                          return Padding(
                                            padding: const EdgeInsets.only(
                                                bottom: 4),
                                            child: Row(
                                              children: [
                                                SizedBox(
                                                  width: 44,
                                                  child: Text(
                                                    tr.direction.toUpperCase(),
                                                    style: TextStyle(
                                                      fontSize: 11,
                                                      fontWeight:
                                                          FontWeight.bold,
                                                      color: tr.direction ==
                                                              'Buy'
                                                          ? const Color(
                                                              0xFF10B981)
                                                          : const Color(
                                                              0xFFEF4444),
                                                    ),
                                                  ),
                                                ),
                                                SizedBox(
                                                  width: 110,
                                                  child: Text(
                                                    tr.exitReason,
                                                    style: const TextStyle(
                                                        fontSize: 11,
                                                        color: Colors.grey),
                                                  ),
                                                ),
                                                Expanded(
                                                  child: Text(
                                                    '${IndicatorEngine.formatPrice(tr.entryPrice, strat.symbol)} → ${IndicatorEngine.formatPrice(tr.exitPrice, strat.symbol)}',
                                                    style: const TextStyle(
                                                      fontFamily: 'monospace',
                                                      fontSize: 11,
                                                    ),
                                                  ),
                                                ),
                                                Text(
                                                  '${pos ? '+' : ''}${tr.pnlPercent.toStringAsFixed(2)}%',
                                                  style: TextStyle(
                                                    fontFamily: 'monospace',
                                                    fontSize: 11.5,
                                                    fontWeight: FontWeight.w600,
                                                    color: pos
                                                        ? const Color(
                                                            0xFF10B981)
                                                        : const Color(
                                                            0xFFEF4444),
                                                  ),
                                                ),
                                              ],
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
                  ],
                ),
        ),
      ],
    );
  }

  Widget _kpiCard(String label, String value, Color color) {
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
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                  color: color,
                  fontFamily: 'monospace',
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLiveShockReplayBody(BuildContext context) {
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

    return Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
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
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            '${widget.selectedSymbol} @ ${IndicatorEngine.formatPrice(widget.currentPrice, widget.selectedSymbol)}',
                            style: const TextStyle(
                              fontFamily: 'monospace',
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                              color: Color(0xFF38BDF8),
                            ),
                          ),
                        ),
                        OutlinedButton.icon(
                          onPressed: _resetting ? null : _handleReset,
                          icon: _resetting
                              ? const SizedBox(
                                  width: 13,
                                  height: 13,
                                  child:
                                      CircularProgressIndicator(strokeWidth: 2),
                                )
                              : const Icon(Icons.refresh, size: 15),
                          label: Text(AppL10n.tr('sim.resetLive', 'Reset Live'),
                              style: const TextStyle(fontSize: 11.5)),
                        ),
                      ],
                    ),
                    if (widget.onQuickOrder != null) ...[
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: FilledButton(
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
                              child: Text(
                                  AppL10n.tr('sim.testBuy', 'Test Buy 0.10'),
                                  style: const TextStyle(fontSize: 11.5)),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: FilledButton(
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
                              child: Text(
                                  AppL10n.tr('sim.testSell', 'Test Sell 0.10'),
                                  style: const TextStyle(fontSize: 11.5)),
                            ),
                          ),
                        ],
                      ),
                    ],
                    const Divider(height: 20),
                    Text(
                      AppL10n.tr(
                          'sim.shocksTitle', '1. One-Click Synthetic Shocks'),
                      style: const TextStyle(
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
                          label: Text(AppL10n.tr('sim.breakout', 'Breakout +1.5%'),
                              style: const TextStyle(fontSize: 11.5)),
                          onPressed: () => _injectScenario(
                            label: AppL10n.tr(
                                'sim.breakoutSpike', 'Breakout Spike'),
                            closePct: 1.5,
                          ),
                        ),
                        ActionChip(
                          avatar: const Icon(Icons.trending_down,
                              size: 15, color: Color(0xFFEF4444)),
                          label: Text(AppL10n.tr('sim.flashCrash', 'Flash Crash -2.5%'),
                              style: const TextStyle(fontSize: 11.5)),
                          onPressed: () => _injectScenario(
                            label:
                                AppL10n.tr('sim.flashCrash', 'Flash Crash'),
                            closePct: -2.5,
                          ),
                        ),
                        ActionChip(
                          avatar: const Icon(Icons.bolt,
                              size: 15, color: Color(0xFFF59E0B)),
                          label: Text(AppL10n.tr('sim.bullWick', 'Bull Stop-Hunt Wick'),
                              style: const TextStyle(fontSize: 11.5)),
                          onPressed: () => _injectScenario(
                            label: AppL10n.tr(
                                'sim.bullStopHunt', 'Bull Stop-Hunt'),
                            closePct: 0.4,
                            wickLowPct: -1.3,
                          ),
                        ),
                        ActionChip(
                          avatar: const Icon(Icons.bolt,
                              size: 15, color: Color(0xFFF59E0B)),
                          label: Text(AppL10n.tr('sim.bearWick', 'Bear Stop-Hunt Wick'),
                              style: const TextStyle(fontSize: 11.5)),
                          onPressed: () => _injectScenario(
                            label: AppL10n.tr(
                                'sim.bearStopHunt', 'Bear Stop-Hunt'),
                            closePct: -0.4,
                            wickHighPct: 1.3,
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 20),
                    Text(
                      AppL10n.tr('sim.manualMove', '2. Manual Candle Move'),
                      style: const TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                    Row(
                      children: [
                        Text(
                          '${_deltaPercent.toStringAsFixed(2)}%',
                          style:
                              const TextStyle(fontSize: 12, color: Colors.grey),
                        ),
                        Expanded(
                          child: Slider(
                            value: _deltaPercent,
                            min: 0.05,
                            max: 5.0,
                            divisions: 99,
                            onChanged: (v) => setState(() => _deltaPercent = v),
                          ),
                        ),
                      ],
                    ),
                    Row(
                      children: [
                        Expanded(
                          child: FilledButton.icon(
                            style: FilledButton.styleFrom(
                                backgroundColor: const Color(0xFF10B981)),
                            icon: const Icon(Icons.arrow_upward, size: 15),
                            label: Text('+${_deltaPercent.toStringAsFixed(2)}%'),
                            onPressed: () => _injectScenario(
                              label: AppL10n.tr('sim.bullImpulse', 'Bull Impulse'),
                              closePct: _deltaPercent,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: FilledButton.icon(
                            style: FilledButton.styleFrom(
                                backgroundColor: const Color(0xFFEF4444)),
                            icon: const Icon(Icons.arrow_downward, size: 15),
                            label: Text('-${_deltaPercent.toStringAsFixed(2)}%'),
                            onPressed: () => _injectScenario(
                              label: AppL10n.tr('sim.bearImpulse', 'Bear Impulse'),
                              closePct: -_deltaPercent,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 20),
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            AppL10n.tr('sim.autoReplay',
                                '3. Weekend Auto-Replay (1s)'),
                            style: const TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                        ),
                        Switch(
                          value: _autoReplay,
                          onChanged: _toggleAutoReplay,
                        ),
                      ],
                    ),
                    DropdownButtonFormField<String>(
                      initialValue: _replayRegime,
                      isDense: true,
                      decoration: InputDecoration(
                        labelText:
                            AppL10n.tr('sim.replayRegime', 'Replay Regime'),
                        border: const OutlineInputBorder(),
                        isDense: true,
                      ),
                      items: [
                        DropdownMenuItem(
                            value: 'Random Walk',
                            child: Text(AppL10n.tr('sim.randomWalk', 'Random Walk (Balanced)'))),
                        DropdownMenuItem(
                            value: 'Bull Drift',
                            child: Text(AppL10n.tr('sim.bullDrift', 'Bullish Trend Drift'))),
                        DropdownMenuItem(
                            value: 'Bear Drift',
                            child: Text(AppL10n.tr('sim.bearDrift', 'Bearish Trend Drift'))),
                        DropdownMenuItem(
                            value: 'Volatility',
                            child: Text(AppL10n.tr('sim.highVolShock', 'High Volatility Shock'))),
                      ],
                      onChanged: (v) {
                        if (v != null) setState(() => _replayRegime = v);
                      },
                    ),
                    const Divider(height: 20),
                    InkWell(
                      onTap: () =>
                          setState(() => _showCustomOhlc = !_showCustomOhlc),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              AppL10n.tr('sim.exactOhlcv',
                                  '4. Exact Price / Custom OHLCV'),
                              style: const TextStyle(
                                  fontWeight: FontWeight.bold, fontSize: 13),
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
                          Expanded(child: _numField(_openCtrl, 'Open')),
                          const SizedBox(width: 6),
                          Expanded(child: _numField(_highCtrl, 'High')),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(child: _numField(_lowCtrl, 'Low')),
                          const SizedBox(width: 6),
                          Expanded(child: _numField(_closeCtrl, 'Close')),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(child: _numField(_volCtrl, 'Volume')),
                          const SizedBox(width: 8),
                          FilledButton.icon(
                            icon: const Icon(Icons.add_chart, size: 15),
                            label: Text(AppL10n.tr('sim.inject', 'Inject')),
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
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                flex: 3,
                child: Card(
                  margin: EdgeInsets.zero,
                  clipBehavior: Clip.antiAlias,
                  child: widget.candles.isEmpty
                      ? Center(
                          child: Text(
                              AppL10n.tr('sim.waiting', 'Waiting for candles...'),
                              style: const TextStyle(color: Colors.grey)),
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
              SizedBox(
                height: 185,
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Expanded(
                      child: Card(
                        margin: EdgeInsets.zero,
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                AppL10n.tr('sim.accountImpact',
                                    'Account & Position Impact'),
                                style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12.5),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${AppL10n.tr('dash.equity', 'Equity')}: \$${widget.equity.toStringAsFixed(2)} (${openPnl >= 0 ? '+' : ''}\$${openPnl.toStringAsFixed(2)})',
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
                                    ? Center(
                                        child: Text(
                                          AppL10n.tr('sim.noOpenOnSymbol',
                                              'No open positions on this symbol.'),
                                          style: TextStyle(
                                              fontSize: 11, color: Colors.grey),
                                        ),
                                      )
                                    : ListView.builder(
                                        itemCount: symbolPositions.length,
                                        itemBuilder: (_, i) {
                                          final p = symbolPositions[i];
                                          final pos = p.unrealizedPnl >= 0;
                                          return Text(
                                            '#${p.ticket} ${p.orderType} ${p.lots} → ${pos ? '+' : ''}\$${p.unrealizedPnl.toStringAsFixed(2)}',
                                            style: TextStyle(
                                              fontSize: 11,
                                              fontFamily: 'monospace',
                                              color: pos
                                                  ? const Color(0xFF10B981)
                                                  : const Color(0xFFEF4444),
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
                    Expanded(
                      child: Card(
                        margin: EdgeInsets.zero,
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Alerts (${symbolAlerts.length}) & Strategies (${symbolStrategies.length})',
                                style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12.5),
                              ),
                              const Divider(height: 12),
                              Expanded(
                                child: (symbolAlerts.isEmpty &&
                                        symbolStrategies.isEmpty)
                                    ? Center(
                                        child: Text(
                                          AppL10n.tr('sim.noAlertsOrStrats',
                                              'No active alerts or strategies.'),
                                          style: const TextStyle(
                                              fontSize: 11, color: Colors.grey),
                                        ),
                                      )
                                    : ListView(
                                        children: [
                                          for (final a in symbolAlerts)
                                            Text(
                                              'Alert: ${a.condition} ${IndicatorEngine.formatPrice(a.targetPrice, a.symbol)}',
                                              style: const TextStyle(
                                                fontSize: 11,
                                                color: Color(0xFFF59E0B),
                                              ),
                                            ),
                                          for (final s in symbolStrategies)
                                            Builder(builder: (_) {
                                              final audit = StrategyScanner
                                                  .evaluateStrategyOnCandles(
                                                s.copyWith(
                                                    symbol:
                                                        widget.selectedSymbol),
                                                widget.candles,
                                              );
                                              return Text(
                                                '${s.name}: ${audit.outcome} (${audit.matchScore.toStringAsFixed(0)}%)',
                                                style: TextStyle(
                                                  fontSize: 11,
                                                  color:
                                                      audit.outcome == 'Executed'
                                                          ? const Color(
                                                              0xFF10B981)
                                                          : Colors.grey,
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
                    Expanded(
                      child: Card(
                        margin: EdgeInsets.zero,
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                AppL10n.tr('sim.shockLog', 'Shock Event Log'),
                                style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12.5),
                              ),
                              const Divider(height: 12),
                              Expanded(
                                child: _history.isEmpty
                                    ? const Center(
                                        child: Text(
                                          'Click a shock scenario on the left.',
                                          style: TextStyle(
                                              fontSize: 11, color: Colors.grey),
                                        ),
                                      )
                                    : ListView.builder(
                                        itemCount: _history.length,
                                        itemBuilder: (_, i) => Text(
                                          _history[i],
                                          style: const TextStyle(
                                            fontSize: 10.5,
                                            fontFamily: 'monospace',
                                            color: Color(0xFF94A3B8),
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
