import 'package:flutter/material.dart';
import '../../models/trading_models.dart';
import '../../services/indicator_engine.dart';
import '../../services/localization_service.dart';

class AuditRadarPage extends StatefulWidget {
  final List<SignalAuditLog> logs;
  final VoidCallback? onEvaluateAll;
  final void Function(String symbol, Timeframe tf)? onOpenChart;

  const AuditRadarPage({
    super.key,
    required this.logs,
    this.onEvaluateAll,
    this.onOpenChart,
  });

  @override
  State<AuditRadarPage> createState() => _AuditRadarPageState();
}

class _AuditRadarPageState extends State<AuditRadarPage> {
  String _filter = 'ALL';
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final q = _query.trim().toLowerCase();
    final filtered = widget.logs.where((l) {
      if (_filter != 'ALL' && l.outcome.toUpperCase() != _filter) return false;
      if (q.isEmpty) return true;
      return l.symbol.toLowerCase().contains(q) ||
          l.strategyName.toLowerCase().contains(q) ||
          l.reason.toLowerCase().contains(q);
    }).toList();

    final executedCount =
        widget.logs.where((l) => l.outcome.toUpperCase() == 'EXECUTED').length;
    final nearMissCount =
        widget.logs.where((l) => l.outcome.toUpperCase() == 'NEARMISS').length;
    final avgScore = widget.logs.isEmpty
        ? 0.0
        : widget.logs.fold<double>(0, (s, l) => s + l.matchScore) /
            widget.logs.length;

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.track_changes,
                  size: 20, color: Color(0xFFF59E0B)),
              const SizedBox(width: 8),
              Text(
                AppL10n.tr('radar.title', 'Near-Miss & Signal Audit Radar'),
                style:
                    const TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
              ),
              const Spacer(),
              if (widget.onEvaluateAll != null) ...[
                FilledButton.icon(
                  onPressed: widget.onEvaluateAll,
                  icon: const Icon(Icons.play_arrow, size: 16),
                  label: Text(AppL10n.tr('radar.evalAll', 'Evaluate All Active')),
                ),
                const SizedBox(width: 10),
              ],
              SegmentedButton<String>(
                segments: [
                  ButtonSegment(value: 'ALL', label: Text(AppL10n.tr('radar.all', 'All'))),
                  ButtonSegment(value: 'EXECUTED', label: Text(AppL10n.tr('radar.executed', 'Executed'))),
                  ButtonSegment(value: 'NEARMISS', label: Text(AppL10n.tr('radar.nearMissLabel', 'Near-Miss'))),
                  ButtonSegment(value: 'REJECTED', label: Text(AppL10n.tr('radar.rejected', 'Rejected'))),
                ],
                selected: {_filter},
                onSelectionChanged: (s) => setState(() => _filter = s.first),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 10,
            runSpacing: 8,
            children: [
              _statChip(AppL10n.tr('radar.totalAudits', 'Total Audits'),
                  '${widget.logs.length}', const Color(0xFF38BDF8)),
              _statChip(AppL10n.tr('radar.executed', 'Executed'),
                  '$executedCount', const Color(0xFF10B981)),
              _statChip(AppL10n.tr('radar.nearMisses', 'Near-Misses'),
                  '$nearMissCount', const Color(0xFFF59E0B)),
              _statChip(AppL10n.tr('radar.avgMatch', 'Avg Match'),
                  '${avgScore.toStringAsFixed(0)}%', const Color(0xFFA855F7)),
            ],
          ),
          const SizedBox(height: 10),
          TextField(
            decoration: InputDecoration(
              prefixIcon: const Icon(Icons.search, size: 18),
              hintText: AppL10n.tr('radar.filterHint',
                  'Filter audit logs by symbol, strategy, or reason...'),
              isDense: true,
              border: const OutlineInputBorder(),
            ),
            onChanged: (v) => setState(() => _query = v),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: filtered.isEmpty
                ? Center(
                    child: Text(
                      AppL10n.tr(
                          'radar.noMatch', 'No audit logs match this filter yet.'),
                      style: const TextStyle(color: Colors.grey),
                    ),
                  )
                : Card(
                    child: ListView.separated(
                      itemCount: filtered.length,
                      separatorBuilder: (_, _) => const Divider(height: 1),
                      itemBuilder: (ctx, i) {
                        final log = filtered[i];
                        final color = log.outcome == 'Executed'
                            ? const Color(0xFF10B981)
                            : log.outcome == 'NearMiss'
                                ? const Color(0xFFF59E0B)
                                : const Color(0xFFEF4444);
                        return ListTile(
                          leading: Chip(
                            backgroundColor: color.withValues(alpha: 0.16),
                            label: Text(
                              AppL10n.enumTerm(log.outcome),
                              style: TextStyle(
                                color: color,
                                fontWeight: FontWeight.bold,
                                fontSize: 11,
                              ),
                            ),
                          ),
                          title: Text(
                            '${log.strategyName} · ${log.symbol} (${log.timeframe.code})',
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                          subtitle: Text(log.reason),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    '${AppL10n.enumTerm(log.direction)} @ ${IndicatorEngine.formatPrice(log.price, log.symbol)}',
                                    style: const TextStyle(
                                      fontFamily: 'monospace',
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  Text(
                                    '${AppL10n.tr('radar.match', 'Match')}: ${log.matchScore.toStringAsFixed(0)}%',
                                    style: const TextStyle(
                                        fontSize: 11, color: Colors.grey),
                                  ),
                                ],
                              ),
                              if (widget.onOpenChart != null) ...[
                                const SizedBox(width: 8),
                                OutlinedButton(
                                  onPressed: () => widget.onOpenChart!(
                                      log.symbol, log.timeframe),
                                  child: Text(AppL10n.tr('scan.chart', 'Chart')),
                                ),
                              ],
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

  Widget _statChip(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('$label: ',
              style: const TextStyle(fontSize: 11.5, color: Colors.white70)),
          Text(value,
              style: TextStyle(
                fontFamily: 'monospace',
                fontWeight: FontWeight.bold,
                fontSize: 12,
                color: color,
              )),
        ],
      ),
    );
  }
}
