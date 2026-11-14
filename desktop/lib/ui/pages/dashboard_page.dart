import 'package:flutter/material.dart';
import '../../services/localization_service.dart';
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
    final isKillSwitch = risk.isKillSwitchEngaged;

    return ListView(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 16),
      children: [
        // Compact Robot Status + Standout Live Chart CTA
        Card(
          margin: EdgeInsets.zero,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            child: Row(
              children: [
                Container(
                  width: 34,
                  height: 34,
                  decoration: BoxDecoration(
                    color: (isKillSwitch
                            ? const Color(0xFFEF4444)
                            : const Color(0xFF10B981))
                        .withValues(alpha: 0.16),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: (isKillSwitch
                              ? const Color(0xFFEF4444)
                              : const Color(0xFF10B981))
                          .withValues(alpha: 0.4),
                    ),
                  ),
                  child: Icon(
                    isKillSwitch ? Icons.gpp_bad : Icons.smart_toy_outlined,
                    size: 18,
                    color: isKillSwitch
                        ? const Color(0xFFEF4444)
                        : const Color(0xFF10B981),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            AppL10n.tr(
                                'dash.robotTitle', 'Algorithmic Execution Robot'),
                            style: const TextStyle(
                              fontSize: 13.5,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: (isKillSwitch
                                      ? const Color(0xFFEF4444)
                                      : const Color(0xFF10B981))
                                  .withValues(alpha: 0.16),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              isKillSwitch
                                  ? AppL10n.tr('dash.halted', 'HALTED')
                                  : AppL10n.tr('dash.scanning', 'SCANNING'),
                              style: TextStyle(
                                fontSize: 9.5,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'monospace',
                                color: isKillSwitch
                                    ? const Color(0xFFEF4444)
                                    : const Color(0xFF10B981),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${AppL10n.tr('dash.drawdown', 'Drawdown')}: ${account.currentDrawdownPercent.toStringAsFixed(2)}% / ${risk.maxDailyDrawdownPercent.toStringAsFixed(1)}% · ${auditLogs.length} ${AppL10n.tr('dash.auditEvents', 'audit events')}',
                        style:
                            const TextStyle(fontSize: 11, color: Colors.grey),
                      ),
                    ],
                  ),
                ),
                // Standout Open Live Chart CTA
                DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF06B6D4), Color(0xFF2563EB)],
                    ),
                    borderRadius: BorderRadius.circular(10),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF0EA5E9).withValues(alpha: 0.35),
                        blurRadius: 12,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      borderRadius: BorderRadius.circular(10),
                      onTap: onOpenChart,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 18, vertical: 10),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.candlestick_chart,
                                size: 18, color: Colors.white),
                            const SizedBox(width: 8),
                            Text(
                              AppL10n.tr('nav.chart', 'Open Live Chart'),
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.2,
                              ),
                            ),
                            SizedBox(width: 4),
                            Icon(Icons.arrow_forward_rounded,
                                size: 16, color: Colors.white),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                OutlinedButton.icon(
                  onPressed: onOpenScanner,
                  icon: const Icon(Icons.radar, size: 16),
                  label: Text(AppL10n.tr('dash.scannerBtn', 'Scanner'),
                      style: const TextStyle(fontSize: 12)),
                ),
                const SizedBox(width: 6),
                OutlinedButton.icon(
                  onPressed: onOpenStrategies,
                  icon: const Icon(Icons.auto_awesome, size: 16),
                  label: Text(AppL10n.tr('dash.strategiesBtn', 'Strategies'),
                      style: const TextStyle(fontSize: 12)),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 10),

        // Compact 4-tile KPI Strip
        Row(
          children: [
            Expanded(
              child: _compactKpiCard(
                AppL10n.tr('dash.equity', 'Equity'),
                '\$${account.equity.toStringAsFixed(2)}',
                '${AppL10n.tr('dash.bal', 'Bal')} \$${account.balance.toStringAsFixed(0)}',
                const Color(0xFF38BDF8),
                Icons.account_balance_wallet_outlined,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _compactKpiCard(
                AppL10n.tr('dash.floatingPnl', 'Floating PnL'),
                '${totalPnl >= 0 ? '+' : '-'}\$${totalPnl.abs().toStringAsFixed(2)}',
                '${openPos.length} ${AppL10n.tr('dash.open', 'Open')}',
                totalPnl >= 0
                    ? const Color(0xFF10B981)
                    : const Color(0xFFEF4444),
                Icons.trending_up,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _compactKpiCard(
                AppL10n.tr('dash.activeBots', 'Active Bots'),
                '$activeStrats / ${strategies.length}',
                '${auditLogs.length} ${AppL10n.tr('dash.signals', 'Signals')}',
                const Color(0xFFA855F7),
                Icons.memory,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _compactKpiCard(
                '${AppL10n.tr('dash.focus', 'Focus')} ($selectedSymbol)',
                IndicatorEngine.formatPrice(currentPrice, selectedSymbol),
                isKillSwitch
                    ? AppL10n.tr('header.killSwitch', 'KILL SWITCH')
                    : AppL10n.tr('dash.riskNormal', 'Risk Normal'),
                isKillSwitch
                    ? const Color(0xFFEF4444)
                    : const Color(0xFF10B981),
                Icons.show_chart,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),

        // Expanded Live Market Preview Chart
        if (candles.isNotEmpty)
          Card(
            margin: EdgeInsets.zero,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.show_chart,
                          size: 17, color: Color(0xFF38BDF8)),
                      const SizedBox(width: 6),
                      Text(
                        '${AppL10n.tr('dash.livePreview', 'Live Market Preview')} · $selectedSymbol (${timeframe.code})',
                        style: const TextStyle(
                            fontSize: 13.5, fontWeight: FontWeight.bold),
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
                  const SizedBox(height: 8),
                  SizedBox(
                    height: 350,
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
        const SizedBox(height: 12),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
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
                        AppL10n.tr('dash.activeStrategies',
                            'Active Algorithmic Strategies'),
                        style: const TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 13.5),
                      ),
                      const SizedBox(height: 8),
                      ...strategies.map((s) => ListTile(
                            dense: true,
                            visualDensity: VisualDensity.compact,
                            contentPadding: EdgeInsets.zero,
                            leading: Icon(
                              s.isEnabled
                                  ? Icons.play_circle_filled
                                  : Icons.pause_circle_outline,
                              size: 18,
                              color: s.isEnabled
                                  ? const Color(0xFF10B981)
                                  : Colors.grey,
                            ),
                            title: Text(s.name,
                                style: const TextStyle(
                                    fontWeight: FontWeight.w600, fontSize: 12.5)),
                            subtitle: Text(
                              '${s.symbol} · ${s.timeframe.code} · ${AppL10n.tr('dash.risk', 'Risk')} ${s.riskPercent}%',
                              style: const TextStyle(fontSize: 11),
                            ),
                            trailing: Chip(
                              visualDensity: VisualDensity.compact,
                              label: Text(
                                  s.isEnabled
                                      ? AppL10n.tr('common.active', 'ACTIVE')
                                      : AppL10n.tr('common.paused', 'PAUSED'),
                                  style: const TextStyle(fontSize: 9.5)),
                            ),
                          )),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Card(
                margin: EdgeInsets.zero,
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        AppL10n.tr(
                            'dash.recentAudit', 'Recent Signal Audit Trail'),
                        style: const TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 13.5),
                      ),
                      const SizedBox(height: 8),
                      if (auditLogs.isEmpty)
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          child: Text(
                            AppL10n.tr('dash.noAuditYet',
                                'No strategy evaluations recorded yet. Run a scan or wait for the 1m cadence.'),
                            style: const TextStyle(
                                color: Colors.grey, fontSize: 12),
                          ),
                        )
                      else
                        ...auditLogs.take(6).map((log) => ListTile(
                              dense: true,
                              visualDensity: VisualDensity.compact,
                              contentPadding: EdgeInsets.zero,
                              leading: Chip(
                                visualDensity: VisualDensity.compact,
                                label: Text(log.outcome,
                                    style: const TextStyle(fontSize: 9.5)),
                              ),
                              title: Text(
                                '${log.symbol} (${log.timeframe.code}) · ${log.direction}',
                                style: const TextStyle(fontSize: 12.5),
                              ),
                              subtitle: Text(log.reason,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontSize: 11)),
                              trailing: Text(
                                '${log.matchScore.toStringAsFixed(0)}%',
                                style: const TextStyle(
                                    fontFamily: 'monospace',
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12),
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

  Widget _compactKpiCard(
    String title,
    String value,
    String subtitle,
    Color accent,
    IconData icon,
  ) {
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 8),
        child: Row(
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: accent.withValues(alpha: 0.14),
                borderRadius: BorderRadius.circular(7),
              ),
              child: Icon(icon, size: 15, color: accent),
            ),
            const SizedBox(width: 9),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 10.5, color: Colors.grey),
                  ),
                  Text(
                    value,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'monospace',
                      color: accent,
                    ),
                  ),
                ],
              ),
            ),
            Text(
              subtitle,
              style: const TextStyle(fontSize: 10, color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }
}
