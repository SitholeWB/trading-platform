import 'package:flutter/material.dart';
import '../../models/trading_models.dart';
import '../../services/indicator_engine.dart';
import '../chart/native_chart_widget.dart';

class DashboardPage extends StatelessWidget {
  final AccountSummary account;
  final RiskProfile risk;
  final List<StrategyDefinition> strategies;
  final List<Position> positions;
  final List<SignalAuditLog> auditLogs;
  final String selectedSymbol;
  final double currentPrice;
  final List<Candle> candles;
  final Timeframe timeframe;
  final ValueChanged<String>? onSelectSymbol;
  final ValueChanged<Timeframe>? onSelectTimeframe;
  final VoidCallback onOpenChart;
  final VoidCallback onOpenScanner;
  final VoidCallback onOpenStrategies;

  const DashboardPage({
    super.key,
    required this.account,
    required this.risk,
    required this.strategies,
    required this.positions,
    required this.auditLogs,
    required this.selectedSymbol,
    required this.currentPrice,
    this.candles = const [],
    this.timeframe = Timeframe.m5,
    this.onSelectSymbol,
    this.onSelectTimeframe,
    required this.onOpenChart,
    required this.onOpenScanner,
    required this.onOpenStrategies,
  });

  @override
  Widget build(BuildContext context) {
    final openPos = positions.where((p) => p.status == 'Open').toList();
    final activeStrats = strategies.where((s) => s.isEnabled).length;
    final totalPnl = openPos.fold<double>(0, (s, p) => s + p.unrealizedPnl);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            _kpiCard(
              context,
              'Account Equity',
              '\$${account.equity.toStringAsFixed(2)}',
              'Balance: \$${account.balance.toStringAsFixed(2)}',
              const Color(0xFF38BDF8),
              Icons.account_balance_wallet,
            ),
            _kpiCard(
              context,
              'Unrealized PnL',
              '${totalPnl >= 0 ? '+' : '-'}\$${totalPnl.abs().toStringAsFixed(2)}',
              '${openPos.length} Open Position(s)',
              totalPnl >= 0 ? const Color(0xFF10B981) : const Color(0xFFEF4444),
              Icons.trending_up,
            ),
            _kpiCard(
              context,
              'Active Bots',
              '$activeStrats / ${strategies.length}',
              '${auditLogs.length} Audit Events',
              const Color(0xFFA855F7),
              Icons.memory,
            ),
            _kpiCard(
              context,
              'Focus Market ($selectedSymbol)',
              IndicatorEngine.formatPrice(currentPrice, selectedSymbol),
              risk.isKillSwitchEngaged ? 'KILL SWITCH HALTED' : 'Risk Guard: Normal',
              risk.isKillSwitchEngaged
                  ? const Color(0xFFEF4444)
                  : const Color(0xFF10B981),
              Icons.candlestick_chart,
            ),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            FilledButton.icon(
              onPressed: onOpenChart,
              icon: const Icon(Icons.candlestick_chart, size: 18),
              label: const Text('Open Live Chart'),
            ),
            const SizedBox(width: 10),
            OutlinedButton.icon(
              onPressed: onOpenScanner,
              icon: const Icon(Icons.radar, size: 18),
              label: const Text('Run Market Scanner'),
            ),
            const SizedBox(width: 10),
            OutlinedButton.icon(
              onPressed: onOpenStrategies,
              icon: const Icon(Icons.auto_awesome, size: 18),
              label: const Text('Strategy Studio'),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (candles.isNotEmpty)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.show_chart,
                          size: 18, color: Color(0xFF38BDF8)),
                      const SizedBox(width: 8),
                      Text(
                        'Live Market Preview · $selectedSymbol (${timeframe.code})',
                        style: const TextStyle(
                            fontSize: 14, fontWeight: FontWeight.bold),
                      ),
                      const Spacer(),
                      ...['EURUSD', 'XAUUSD', 'BTCUSD', 'US500'].map((sym) {
                        final active = sym == selectedSymbol;
                        return Padding(
                          padding: const EdgeInsets.only(left: 4),
                          child: ChoiceChip(
                            label: Text(sym,
                                style: const TextStyle(
                                    fontSize: 10.5, fontFamily: 'monospace')),
                            selected: active,
                            visualDensity: VisualDensity.compact,
                            onSelected: onSelectSymbol == null
                                ? null
                                : (_) => onSelectSymbol!(sym),
                          ),
                        );
                      }),
                      const SizedBox(width: 8),
                      if (onSelectTimeframe != null)
                        DropdownButton<Timeframe>(
                          value: timeframe,
                          isDense: true,
                          underline: const SizedBox.shrink(),
                          items: const [
                            Timeframe.m5,
                            Timeframe.m15,
                            Timeframe.h1,
                            Timeframe.h4,
                            Timeframe.d1,
                          ]
                              .map((tf) => DropdownMenuItem(
                                    value: tf,
                                    child: Text(tf.code,
                                        style: const TextStyle(fontSize: 11.5)),
                                  ))
                              .toList(),
                          onChanged: (tf) {
                            if (tf != null) onSelectTimeframe!(tf);
                          },
                        ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    height: 240,
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: NativeChartWidget(
                        symbol: selectedSymbol,
                        timeframe: timeframe,
                        candles: candles,
                        chartType: ChartType.candlestick,
                        indicators: const IndicatorSettings(ema20: true),
                        activeTool: DrawingTool.cursor,
                        drawings: const [],
                        onAddDrawing: (_) {},
                        onDrawingComplete: () {},
                        openPositions: openPos,
                        activeAlerts: const [],
                        timezoneOffsetHours: 0,
                        secondsUntilSync: 60,
                        isSyncing: false,
                        onManualSync: () {},
                        showSyncBadge: false,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        const SizedBox(height: 18),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Active Algorithmic Strategies',
                        style: TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      const SizedBox(height: 10),
                      ...strategies.map((s) => ListTile(
                            dense: true,
                            contentPadding: EdgeInsets.zero,
                            leading: Icon(
                              s.isEnabled
                                  ? Icons.play_circle_filled
                                  : Icons.pause_circle_outline,
                              color: s.isEnabled
                                  ? const Color(0xFF10B981)
                                  : Colors.grey,
                            ),
                            title: Text(s.name,
                                style: const TextStyle(
                                    fontWeight: FontWeight.w600)),
                            subtitle: Text(
                                '${s.symbol} · ${s.timeframe.code} · Risk ${s.riskPercent}%'),
                            trailing: Chip(
                              label: Text(s.isEnabled ? 'ACTIVE' : 'PAUSED',
                                  style: const TextStyle(fontSize: 10)),
                            ),
                          )),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Recent Signal Audit Trail',
                        style: TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      const SizedBox(height: 10),
                      if (auditLogs.isEmpty)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 20),
                          child: Text(
                            'No strategy evaluations recorded yet. Run a scan or wait for the 1m cadence.',
                            style: TextStyle(color: Colors.grey),
                          ),
                        )
                      else
                        ...auditLogs.take(6).map((log) => ListTile(
                              dense: true,
                              contentPadding: EdgeInsets.zero,
                              leading: Chip(
                                label: Text(log.outcome,
                                    style: const TextStyle(fontSize: 10)),
                              ),
                              title: Text(
                                  '${log.symbol} (${log.timeframe.code}) · ${log.direction}'),
                              subtitle: Text(log.reason,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis),
                              trailing: Text(
                                '${log.matchScore.toStringAsFixed(0)}%',
                                style: const TextStyle(
                                    fontFamily: 'monospace',
                                    fontWeight: FontWeight.bold),
                              ),
                            )),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _kpiCard(
    BuildContext context,
    String title,
    String value,
    String subtitle,
    Color accent,
    IconData icon,
  ) {
    return SizedBox(
      width: 260,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(icon, size: 18, color: accent),
                  const SizedBox(width: 6),
                  Text(
                    title,
                    style: const TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                value,
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'monospace',
                  color: accent,
                ),
              ),
              const SizedBox(height: 4),
              Text(subtitle,
                  style: const TextStyle(fontSize: 11, color: Colors.grey)),
            ],
          ),
        ),
      ),
    );
  }
}
