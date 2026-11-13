import 'package:flutter/material.dart';
import '../../models/trading_models.dart';
import '../../services/indicator_engine.dart';

class PositionsPage extends StatelessWidget {
  final List<Position> positions;
  final AccountSummary account;
  final RiskProfile risk;
  final ValueChanged<int> onClosePosition;
  final VoidCallback? onCloseAllPositions;
  final void Function(int ticket, double? sl, double? tp)? onUpdateSlTp;
  final ValueChanged<RiskProfile>? onUpdateRisk;
  final VoidCallback onToggleKillSwitch;

  const PositionsPage({
    super.key,
    required this.positions,
    required this.account,
    required this.risk,
    required this.onClosePosition,
    this.onCloseAllPositions,
    this.onUpdateSlTp,
    this.onUpdateRisk,
    required this.onToggleKillSwitch,
  });

  Future<void> _showEditSlTpDialog(BuildContext context, Position p) async {
    final slCtrl = TextEditingController(
      text: p.stopLossPrice != null
          ? IndicatorEngine.formatPrice(p.stopLossPrice!, p.symbol)
          : '',
    );
    final tpCtrl = TextEditingController(
      text: p.takeProfitPrice != null
          ? IndicatorEngine.formatPrice(p.takeProfitPrice!, p.symbol)
          : '',
    );

    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Modify SL / TP · ${p.symbol} (#${p.ticket})'),
        content: SizedBox(
          width: 340,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '${p.orderType.toUpperCase()} ${p.lots.toStringAsFixed(2)} lots @ ${IndicatorEngine.formatPrice(p.entryPrice, p.symbol)}',
                style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: slCtrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(
                  labelText: 'Stop Loss Price (blank = none)',
                  border: OutlineInputBorder(),
                  isDense: true,
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: tpCtrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(
                  labelText: 'Take Profit Price (blank = none)',
                  border: OutlineInputBorder(),
                  isDense: true,
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Save'),
          ),
        ],
      ),
    );

    if (ok == true && onUpdateSlTp != null) {
      final sl = double.tryParse(slCtrl.text.trim());
      final tp = double.tryParse(tpCtrl.text.trim());
      onUpdateSlTp!(p.ticket, sl, tp);
    }
  }

  Future<void> _showKillSwitchConfirm(BuildContext context) async {
    final reasonCtrl = TextEditingController(
      text: risk.isKillSwitchEngaged
          ? 'Manual resume'
          : 'Emergency drawdown protection',
    );
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            Icon(
              Icons.warning_amber_rounded,
              color: risk.isKillSwitchEngaged
                  ? const Color(0xFF10B981)
                  : const Color(0xFFEF4444),
            ),
            const SizedBox(width: 8),
            Text(risk.isKillSwitchEngaged
                ? 'Disengage Kill Switch?'
                : 'Engage Emergency Kill Switch?'),
          ],
        ),
        content: SizedBox(
          width: 400,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                risk.isKillSwitchEngaged
                    ? 'Resuming will allow automated strategies and manual orders to execute again.'
                    : 'Engaging the Kill Switch halts all new automated and manual trade executions immediately.',
                style: const TextStyle(fontSize: 13),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: reasonCtrl,
                decoration: const InputDecoration(
                  labelText: 'Audit Reason',
                  border: OutlineInputBorder(),
                  isDense: true,
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: risk.isKillSwitchEngaged
                  ? const Color(0xFF10B981)
                  : const Color(0xFFDC2626),
            ),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text(risk.isKillSwitchEngaged ? 'Resume Trading' : 'HALT NOW'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      if (onUpdateRisk != null) {
        onUpdateRisk!(risk.copyWith(
          isKillSwitchEngaged: !risk.isKillSwitchEngaged,
          killSwitchReason: reasonCtrl.text.trim(),
        ));
      } else {
        onToggleKillSwitch();
      }
    }
  }

  Future<void> _showRiskEditor(BuildContext context) async {
    double maxDd = risk.maxDailyDrawdownPercent;
    double maxRisk = risk.maxRiskPerTradePercent;
    int maxPos = risk.maxOpenPositions;

    final updated = await showDialog<RiskProfile>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setS) => AlertDialog(
          title: const Text('Edit Risk Guardrails'),
          content: SizedBox(
            width: 380,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    const Expanded(child: Text('Max Daily Drawdown %')),
                    Text('${maxDd.toStringAsFixed(1)}%',
                        style: const TextStyle(fontFamily: 'monospace')),
                  ],
                ),
                Slider(
                  value: maxDd.clamp(1.0, 20.0),
                  min: 1.0,
                  max: 20.0,
                  divisions: 38,
                  onChanged: (v) => setS(() => maxDd = v),
                ),
                Row(
                  children: [
                    const Expanded(child: Text('Max Risk / Trade %')),
                    Text('${maxRisk.toStringAsFixed(2)}%',
                        style: const TextStyle(fontFamily: 'monospace')),
                  ],
                ),
                Slider(
                  value: maxRisk.clamp(0.25, 5.0),
                  min: 0.25,
                  max: 5.0,
                  divisions: 19,
                  onChanged: (v) => setS(() => maxRisk = v),
                ),
                Row(
                  children: [
                    const Expanded(child: Text('Max Open Positions')),
                    Text('$maxPos',
                        style: const TextStyle(fontFamily: 'monospace')),
                  ],
                ),
                Slider(
                  value: maxPos.toDouble().clamp(1, 30),
                  min: 1,
                  max: 30,
                  divisions: 29,
                  onChanged: (v) => setS(() => maxPos = v.round()),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(ctx).pop(
                risk.copyWith(
                  maxDailyDrawdownPercent: maxDd,
                  maxRiskPerTradePercent: maxRisk,
                  maxOpenPositions: maxPos,
                ),
              ),
              child: const Text('Save Guardrails'),
            ),
          ],
        ),
      ),
    );
    if (updated != null && onUpdateRisk != null) {
      onUpdateRisk!(updated);
    }
  }

  @override
  Widget build(BuildContext context) {
    final open = positions.where((p) => p.status == 'Open').toList();
    final closed = positions.where((p) => p.status == 'Closed').toList();
    final openPnl = open.fold<double>(0, (s, p) => s + p.unrealizedPnl);

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
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
                          'Active Positions & Execution Ledger',
                          style: TextStyle(
                              fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(width: 8),
                        Chip(label: Text('${open.length} Open')),
                        const SizedBox(width: 8),
                        if (open.isNotEmpty)
                          Text(
                            'Net PnL: ${openPnl >= 0 ? '+' : '-'}\$${openPnl.abs().toStringAsFixed(2)}',
                            style: TextStyle(
                              fontFamily: 'monospace',
                              fontWeight: FontWeight.bold,
                              color: openPnl >= 0
                                  ? const Color(0xFF10B981)
                                  : const Color(0xFFEF4444),
                            ),
                          ),
                        const Spacer(),
                        if (open.isNotEmpty && onCloseAllPositions != null)
                          OutlinedButton.icon(
                            style: OutlinedButton.styleFrom(
                              foregroundColor: const Color(0xFFEF4444),
                            ),
                            onPressed: onCloseAllPositions,
                            icon: const Icon(Icons.close_fullscreen, size: 15),
                            label: const Text('Close All'),
                          ),
                      ],
                    ),
                    const Divider(),
                    Expanded(
                      child: open.isEmpty && closed.isEmpty
                          ? const Center(
                              child: Text(
                                'No positions yet. Use Quick Trade on the Live Chart or Market Scanner.',
                                style: TextStyle(color: Colors.grey),
                              ),
                            )
                          : ListView(
                              children: [
                                if (open.isNotEmpty) ...[
                                  const Padding(
                                    padding: EdgeInsets.symmetric(vertical: 6),
                                    child: Text('OPEN POSITIONS',
                                        style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.grey)),
                                  ),
                                  ...open.map((p) => _posTile(context, p, true)),
                                ],
                                if (closed.isNotEmpty) ...[
                                  const Padding(
                                    padding: EdgeInsets.symmetric(vertical: 6),
                                    child: Text('CLOSED HISTORY',
                                        style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.grey)),
                                  ),
                                  ...closed
                                      .map((p) => _posTile(context, p, false)),
                                ],
                              ],
                            ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      children: [
                        const Text(
                          'Risk Console',
                          style: TextStyle(
                              fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        const Spacer(),
                        if (onUpdateRisk != null)
                          IconButton(
                            tooltip: 'Edit Risk Guardrails',
                            icon: const Icon(Icons.tune, size: 18),
                            onPressed: () => _showRiskEditor(context),
                          ),
                      ],
                    ),
                    const Divider(),
                    _metric(
                        'Balance', '\$${account.balance.toStringAsFixed(2)}'),
                    _metric('Equity', '\$${account.equity.toStringAsFixed(2)}'),
                    _metric(
                      'Daily Drawdown',
                      '${account.currentDrawdownPercent.toStringAsFixed(2)}% / ${risk.maxDailyDrawdownPercent.toStringAsFixed(1)}%',
                    ),
                    _metric('Max Risk / Trade',
                        '${risk.maxRiskPerTradePercent.toStringAsFixed(2)}%'),
                    _metric('Max Open Positions', '${risk.maxOpenPositions}'),
                    if (risk.isKillSwitchEngaged &&
                        (risk.killSwitchReason ?? '').isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(
                          'Halt reason: ${risk.killSwitchReason}',
                          style: const TextStyle(
                              fontSize: 11.5, color: Color(0xFFEF4444)),
                        ),
                      ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton.icon(
                        style: FilledButton.styleFrom(
                          backgroundColor: risk.isKillSwitchEngaged
                              ? const Color(0xFF10B981)
                              : const Color(0xFFDC2626),
                        ),
                        onPressed: () => _showKillSwitchConfirm(context),
                        icon: Icon(risk.isKillSwitchEngaged
                            ? Icons.play_arrow
                            : Icons.dangerous),
                        label: Text(risk.isKillSwitchEngaged
                            ? 'DISENGAGE KILL SWITCH'
                            : 'ENGAGE KILL SWITCH'),
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

  Widget _posTile(BuildContext context, Position p, bool isOpen) {
    final pnl = isOpen ? p.unrealizedPnl : p.realizedPnl;
    final pnlColor =
        pnl >= 0 ? const Color(0xFF10B981) : const Color(0xFFEF4444);
    return ListTile(
      dense: true,
      leading: Chip(
        backgroundColor: p.isBuy
            ? const Color(0xFF10B981).withValues(alpha: 0.16)
            : const Color(0xFFEF4444).withValues(alpha: 0.16),
        label: Text(
          p.orderType.toUpperCase(),
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.bold,
            color: p.isBuy
                ? const Color(0xFF10B981)
                : const Color(0xFFEF4444),
          ),
        ),
      ),
      title: Text(
        '${p.symbol} · ${p.lots.toStringAsFixed(2)} lots (${p.strategyName})',
        style:
            const TextStyle(fontWeight: FontWeight.bold, fontFamily: 'monospace'),
      ),
      subtitle: Text(
        'Entry: ${IndicatorEngine.formatPrice(p.entryPrice, p.symbol)} | '
        'Now: ${IndicatorEngine.formatPrice(p.currentPrice, p.symbol)} | '
        'SL: ${p.stopLossPrice != null ? IndicatorEngine.formatPrice(p.stopLossPrice!, p.symbol) : 'None'} | '
        'TP: ${p.takeProfitPrice != null ? IndicatorEngine.formatPrice(p.takeProfitPrice!, p.symbol) : 'None'}',
        style: const TextStyle(fontSize: 11, fontFamily: 'monospace'),
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '${pnl >= 0 ? '+' : '-'}\$${pnl.abs().toStringAsFixed(2)}',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontFamily: 'monospace',
              color: pnlColor,
            ),
          ),
          if (isOpen) ...[
            if (onUpdateSlTp != null) ...[
              const SizedBox(width: 6),
              IconButton(
                tooltip: 'Edit SL / TP',
                icon: const Icon(Icons.edit_outlined, size: 16),
                onPressed: () => _showEditSlTpDialog(context, p),
              ),
            ],
            const SizedBox(width: 4),
            OutlinedButton(
              onPressed: () => onClosePosition(p.ticket),
              child: const Text('Close'),
            ),
          ],
        ],
      ),
    );
  }

  Widget _metric(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey)),
          Text(value,
              style: const TextStyle(
                  fontWeight: FontWeight.bold, fontFamily: 'monospace')),
        ],
      ),
    );
  }
}
