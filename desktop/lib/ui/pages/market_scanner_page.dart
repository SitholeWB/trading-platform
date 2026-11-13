import 'package:flutter/material.dart';
import '../../models/trading_models.dart';
import '../../services/indicator_engine.dart';
import '../../services/market_data_service.dart';
import '../../services/strategy_scanner.dart';
import '../../services/symbol_catalog.dart';

class MarketScannerPage extends StatefulWidget {
  final MarketDataService marketData;
  final void Function(String symbol, Timeframe tf) onOpenChart;
  final Future<void> Function(String side, String symbol, double lots, double price)
      onQuickOrder;

  const MarketScannerPage({
    super.key,
    required this.marketData,
    required this.onOpenChart,
    required this.onQuickOrder,
  });

  @override
  State<MarketScannerPage> createState() => _MarketScannerPageState();
}

class _MarketScannerPageState extends State<MarketScannerPage> {
  int _tabIndex = 0; // 0 = Live Scan, 1 = Historical Backtester
  Timeframe _tf = Timeframe.m15;
  AssetCategory _category = AssetCategory.all;
  bool _scanning = false;
  List<ScannerHit> _hits = [];

  // Backtester state
  String _btSymbol = 'EURUSD';
  bool _btRunning = false;
  int _btTrades = 0;
  double _btWinRate = 0;
  double _btProfitFactor = 0;
  double _btReturnPct = 0;
  double _btMaxDdPct = 0;
  List<String> _btLog = [];

  @override
  void initState() {
    super.initState();
    _runScan();
  }

  Future<void> _runBacktest() async {
    setState(() => _btRunning = true);
    final res = await widget.marketData.fetchCandles(_btSymbol, _tf);
    final candles = res.candles;
    if (candles.length < 30) {
      if (mounted) setState(() => _btRunning = false);
      return;
    }

    final ema20Pts = IndicatorEngine.calculateEMA(candles, 20, _btSymbol);
    final rsiPts = IndicatorEngine.calculateRSI(candles, 14);
    final emaMap = {for (final p in ema20Pts) p.timeSeconds: p.value};
    final rsiMap = {for (final p in rsiPts) p.timeSeconds: p.value};
    double equity = 10000.0;
    double peak = equity;
    double maxDd = 0.0;
    double grossWin = 0.0;
    double grossLoss = 0.0;
    int wins = 0;
    int trades = 0;
    final logs = <String>[];

    bool inPos = false;
    bool isLong = true;
    double entry = 0;

    for (var i = 21; i < candles.length; i++) {
      final c = candles[i];
      final e = emaMap[c.timeSeconds] ?? c.close;
      final r = rsiMap[c.timeSeconds] ?? 50.0;

      if (!inPos) {
        if (c.close > e && r < 65) {
          inPos = true;
          isLong = true;
          entry = c.close;
        } else if (c.close < e && r > 35) {
          inPos = true;
          isLong = false;
          entry = c.close;
        }
      } else {
        final pctMove = isLong
            ? (c.close - entry) / entry
            : (entry - c.close) / entry;
        if (pctMove.abs() >= 0.004 || i == candles.length - 1) {
          final pnl = equity * pctMove * 10; // 10x notional
          equity += pnl;
          if (equity > peak) peak = equity;
          final dd = ((peak - equity) / peak) * 100;
          if (dd > maxDd) maxDd = dd;
          trades++;
          if (pnl >= 0) {
            wins++;
            grossWin += pnl;
          } else {
            grossLoss += pnl.abs();
          }
          logs.insert(
            0,
            '${isLong ? "BUY" : "SELL"} $_btSymbol @ ${IndicatorEngine.formatPrice(entry, _btSymbol)} → ${IndicatorEngine.formatPrice(c.close, _btSymbol)} (${pnl >= 0 ? "+" : "-"}\$${pnl.abs().toStringAsFixed(2)})',
          );
          inPos = false;
        }
      }
    }

    if (!mounted) return;
    setState(() {
      _btTrades = trades;
      _btWinRate = trades == 0 ? 0 : (wins / trades) * 100;
      _btProfitFactor = grossLoss == 0 ? (grossWin > 0 ? 9.99 : 0) : grossWin / grossLoss;
      _btReturnPct = ((equity - 10000.0) / 10000.0) * 100;
      _btMaxDdPct = maxDd;
      _btLog = logs.take(40).toList();
      _btRunning = false;
    });
  }

  Future<void> _runScan() async {
    setState(() => _scanning = true);
    final symbols = SymbolCatalog.allSymbols
        .where((s) => _category == AssetCategory.all || s.category == _category)
        .take(18)
        .map((s) => s.symbol)
        .toList();
    final res = await StrategyScanner.scanMarket(widget.marketData, symbols, _tf);
    if (!mounted) return;
    setState(() {
      _hits = res;
      _scanning = false;
    });
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
              const Icon(Icons.radar, size: 20, color: Color(0xFF38BDF8)),
              const SizedBox(width: 8),
              const Text(
                'Robotic Multi-Market Scanner',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
              ),
              const SizedBox(width: 16),
              SegmentedButton<int>(
                segments: const [
                  ButtonSegment(value: 0, label: Text('Live Scan')),
                  ButtonSegment(value: 1, label: Text('Backtester')),
                ],
                selected: {_tabIndex},
                onSelectionChanged: (s) {
                  setState(() => _tabIndex = s.first);
                  if (s.first == 1 && _btTrades == 0) _runBacktest();
                },
              ),
              const Spacer(),
              if (_tabIndex == 0) ...[
                DropdownButton<AssetCategory>(
                  value: _category,
                  items: AssetCategory.values
                      .map((c) => DropdownMenuItem(value: c, child: Text(c.label)))
                      .toList(),
                  onChanged: (v) {
                    if (v != null) {
                      setState(() => _category = v);
                      _runScan();
                    }
                  },
                ),
                const SizedBox(width: 10),
                DropdownButton<Timeframe>(
                  value: _tf,
                  items: Timeframe.values
                      .map((t) => DropdownMenuItem(value: t, child: Text(t.code)))
                      .toList(),
                  onChanged: (v) {
                    if (v != null) {
                      setState(() => _tf = v);
                      _runScan();
                    }
                  },
                ),
                const SizedBox(width: 10),
                FilledButton.icon(
                  onPressed: _scanning ? null : _runScan,
                  icon: _scanning
                      ? const SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.refresh, size: 16),
                  label: Text(_scanning ? 'Scanning...' : 'Scan Now'),
                ),
              ] else ...[
                DropdownButton<String>(
                  value: _btSymbol,
                  items: SymbolCatalog.allSymbols
                      .map((s) => DropdownMenuItem(
                            value: s.symbol,
                            child: Text(s.symbol),
                          ))
                      .toList(),
                  onChanged: (v) {
                    if (v != null) setState(() => _btSymbol = v);
                  },
                ),
                const SizedBox(width: 10),
                DropdownButton<Timeframe>(
                  value: _tf,
                  items: Timeframe.values
                      .map((t) => DropdownMenuItem(value: t, child: Text(t.code)))
                      .toList(),
                  onChanged: (v) {
                    if (v != null) setState(() => _tf = v);
                  },
                ),
                const SizedBox(width: 10),
                FilledButton.icon(
                  onPressed: _btRunning ? null : _runBacktest,
                  icon: const Icon(Icons.play_arrow, size: 16),
                  label: Text(_btRunning ? 'Running...' : 'Run Backtest'),
                ),
              ],
            ],
          ),
          const SizedBox(height: 12),
          if (_tabIndex == 1)
            Expanded(child: _buildBacktesterBody())
          else
          Expanded(
            child: Card(
              child: _hits.isEmpty && _scanning
                  ? const Center(child: CircularProgressIndicator())
                  : ListView.separated(
                      itemCount: _hits.length,
                      separatorBuilder: (_, _) => const Divider(height: 1),
                      itemBuilder: (ctx, i) {
                        final hit = _hits[i];
                        final isBuy = hit.signal.contains('Buy');
                        final isSell = hit.signal.contains('Sell');
                        final sigColor = isBuy
                            ? const Color(0xFF10B981)
                            : isSell
                                ? const Color(0xFFEF4444)
                                : Colors.grey;
                        return ListTile(
                          leading: Chip(
                            label: Text(
                              hit.spec.category.label.toUpperCase(),
                              style: const TextStyle(fontSize: 10),
                            ),
                          ),
                          title: Row(
                            children: [
                              Text(
                                hit.spec.symbol,
                                style: const TextStyle(
                                  fontFamily: 'monospace',
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                hit.spec.name,
                                style: const TextStyle(
                                    fontSize: 12, color: Colors.grey),
                              ),
                            ],
                          ),
                          subtitle: Text(
                            'Price: ${IndicatorEngine.formatPrice(hit.price, hit.spec.symbol)} · '
                            'RSI: ${hit.rsi.toStringAsFixed(1)} · Trend: ${hit.trend}',
                            style: const TextStyle(
                                fontFamily: 'monospace', fontSize: 11.5),
                          ),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Chip(
                                backgroundColor:
                                    sigColor.withValues(alpha: 0.16),
                                label: Text(
                                  '${hit.signal} (${hit.score.toStringAsFixed(0)})',
                                  style: TextStyle(
                                    color: sigColor,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 11,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              OutlinedButton(
                                onPressed: () =>
                                    widget.onOpenChart(hit.spec.symbol, _tf),
                                child: const Text('Chart'),
                              ),
                              const SizedBox(width: 6),
                              if (isBuy || isSell)
                                FilledButton(
                                  onPressed: () => widget.onQuickOrder(
                                    isBuy ? 'Buy' : 'Sell',
                                    hit.spec.symbol,
                                    0.10,
                                    hit.price,
                                  ),
                                  child: Text(isBuy ? 'Buy 0.10' : 'Sell 0.10'),
                                ),
                            ],
                          ),
                        );
                      },
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBacktesterBody() {
    if (_btRunning) {
      return const Center(child: CircularProgressIndicator());
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            _btStat('Total Trades', '$_btTrades', const Color(0xFF38BDF8)),
            _btStat('Win Rate', '${_btWinRate.toStringAsFixed(1)}%',
                _btWinRate >= 50 ? const Color(0xFF10B981) : const Color(0xFFF59E0B)),
            _btStat('Profit Factor', _btProfitFactor.toStringAsFixed(2),
                _btProfitFactor >= 1.2 ? const Color(0xFF10B981) : const Color(0xFFEF4444)),
            _btStat('Net Return',
                '${_btReturnPct >= 0 ? "+" : ""}${_btReturnPct.toStringAsFixed(2)}%',
                _btReturnPct >= 0 ? const Color(0xFF10B981) : const Color(0xFFEF4444)),
            _btStat('Max Drawdown', '${_btMaxDdPct.toStringAsFixed(2)}%',
                const Color(0xFFEF4444)),
          ],
        ),
        const SizedBox(height: 12),
        Expanded(
          child: Card(
            child: _btLog.isEmpty
                ? const Center(child: Text('Click "Run Backtest" to simulate trades.'))
                : ListView.separated(
                    itemCount: _btLog.length,
                    separatorBuilder: (_, _) => const Divider(height: 1),
                    itemBuilder: (_, i) => ListTile(
                      dense: true,
                      leading: const Icon(Icons.history, size: 16),
                      title: Text(_btLog[i],
                          style: const TextStyle(
                              fontFamily: 'monospace', fontSize: 12)),
                    ),
                  ),
          ),
        ),
      ],
    );
  }

  Widget _btStat(String label, String value, Color color) {
    return SizedBox(
      width: 170,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
              const SizedBox(height: 4),
              Text(value,
                  style: TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: color,
                  )),
            ],
          ),
        ),
      ),
    );
  }
}
