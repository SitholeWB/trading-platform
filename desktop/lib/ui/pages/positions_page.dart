import 'package:flutter/material.dart';
import '../../models/trading_models.dart';
import '../../services/indicator_engine.dart';
import '../../services/localization_service.dart';
import 'journal_page.dart';

class PositionsPage extends StatelessWidget {
  final List<Position> positions;
  final AccountSummary account;
  final RiskProfile risk;
  final ValueChanged<int> onClosePosition;
  final VoidCallback? onCloseAllPositions;
  final void Function(int ticket, double? sl, double? tp)? onUpdateSlTp;
  final void Function(int ticket, String note, String setupTag, int? rating)?
      onUpdatePositionNote;
  final ValueChanged<RiskProfile>? onUpdateRisk;
  final ValueChanged<double>? onResetDemoAccount;
  final VoidCallback onToggleKillSwitch;

  const PositionsPage({
    super.key,
    required this.positions,
    required this.account,
    required this.risk,
    required this.onClosePosition,
    this.onCloseAllPositions,
    this.onUpdateSlTp,
    this.onUpdatePositionNote,
    this.onUpdateRisk,
    this.onResetDemoAccount,
    required this.onToggleKillSwitch,
  });

  Future<void> _showPositionNoteDialog(BuildContext context, Position p) async {
    if (onUpdatePositionNote == null) return;
    final noteCtrl = TextEditingController(text: p.note);
    String setupTag = JournalPage.tags.contains(p.setupTag)
        ? p.setupTag
        : 'Trend Continuation';
    int? rating = p.rating ?? 4;

    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Text('Trade Note · ${p.symbol} (#${p.ticket})'),
          content: SizedBox(
            width: 400,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                DropdownButtonFormField<String>(
                  initialValue: setupTag,
                  decoration: const InputDecoration(
                    labelText: 'Setup Tag',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                  items: JournalPage.tags
                      .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                      .toList(),
                  onChanged: (v) {
                    if (v != null) setDialogState(() => setupTag = v);
                  },
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    const Text('Execution Rating:',
                        style: TextStyle(fontSize: 12.5)),
                    const SizedBox(width: 8),
                    for (int star = 1; star <= 5; star++)
                      IconButton(
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(minWidth: 28),
                        icon: Icon(
                          (rating ?? 0) >= star
                              ? Icons.star
                              : Icons.star_border,
                          color: const Color(0xFFF59E0B),
                          size: 20,
                        ),
                        onPressed: () => setDialogState(() => rating = star),
                      ),
                  ],
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: noteCtrl,
                  minLines: 4,
                  maxLines: 7,
                  decoration: const InputDecoration(
                    labelText: 'Trade Note / Post-Trade Review',
                    border: OutlineInputBorder(),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: Text(AppL10n.tr('common.cancel', 'Cancel')),
            ),
            FilledButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              child: Text(AppL10n.tr('journal.saveNote', 'Save Note')),
            ),
          ],
        ),
      ),
    );

    if (ok == true) {
      onUpdatePositionNote!(p.ticket, noteCtrl.text.trim(), setupTag, rating);
    }
  }

  Future<void> _showResetDemoDialog(BuildContext context) async {
    double selectedBalance = 100000.0;
    final customCtrl = TextEditingController(text: '100000');
    const presets = [10000.0, 50000.0, 100000.0, 250000.0];

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Row(
            children: [
              const Icon(Icons.restart_alt, color: Color(0xFF38BDF8)),
              const SizedBox(width: 8),
              Text(AppL10n.tr('pos.resetDemoTitle', 'Reset Demo Account')),
            ],
          ),
          content: SizedBox(
            width: 380,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  AppL10n.tr('pos.resetDemoDesc',
                      'Choose a starting paper balance. This will clear open/closed positions, reset PnL metrics, and disengage the kill switch.'),
                  style: const TextStyle(fontSize: 12.5, color: Colors.grey),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: presets.map((amt) {
                    final active = (selectedBalance - amt).abs() < 1;
                    return ChoiceChip(
                      label: Text('\$${(amt ~/ 1000)}k'),
                      selected: active,
                      onSelected: (_) {
                        setDialogState(() {
                          selectedBalance = amt;
                          customCtrl.text = amt.toStringAsFixed(0);
                        });
                      },
                    );
                  }).toList(),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: customCtrl,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  decoration: InputDecoration(
                    labelText: AppL10n.tr(
                        'pos.startingBalance', 'Starting Balance (USD)'),
                    prefixText: '\$ ',
                    border: const OutlineInputBorder(),
                    isDense: true,
                  ),
                  onChanged: (v) {
                    final parsed = double.tryParse(v.trim());
                    if (parsed != null && parsed >= 100) {
                      setDialogState(() => selectedBalance = parsed);
                    }
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: Text(AppL10n.tr('common.cancel', 'Cancel')),
            ),
            FilledButton.icon(
              onPressed: () => Navigator.of(ctx).pop(true),
              icon: const Icon(Icons.check, size: 16),
              label:
                  Text(AppL10n.tr('pos.resetAccountBtn', 'Reset Account')),
            ),
          ],
        ),
      ),
    );

    if (confirmed == true && onResetDemoAccount != null) {
      final parsed = double.tryParse(customCtrl.text.trim()) ?? selectedBalance;
      onResetDemoAccount!(parsed.clamp(100.0, 10000000.0));
    }
  }

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
        title: Text(
            '${AppL10n.tr('pos.modifySlTp', 'Modify SL / TP')} · ${p.symbol} (#${p.ticket})'),
        content: SizedBox(
          width: 340,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '${p.orderType.toUpperCase()} ${p.lots.toStringAsFixed(2)} ${AppL10n.tr('pos.lots', 'lots')} @ ${IndicatorEngine.formatPrice(p.entryPrice, p.symbol)}',
                style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: slCtrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: InputDecoration(
                  labelText: AppL10n.tr(
                      'pos.slBlankNone', 'Stop Loss Price (blank = none)'),
                  border: const OutlineInputBorder(),
                  isDense: true,
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: tpCtrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: InputDecoration(
                  labelText: AppL10n.tr(
                      'pos.tpBlankNone', 'Take Profit Price (blank = none)'),
                  border: const OutlineInputBorder(),
                  isDense: true,
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text(AppL10n.tr('common.cancel', 'Cancel')),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text(AppL10n.tr('common.save', 'Save')),
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
            child: Text(AppL10n.tr('common.cancel', 'Cancel')),
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
          title: Text(AppL10n.tr('pos.editGuardrails', 'Edit Risk Guardrails')),
          content: SizedBox(
            width: 380,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Expanded(
                        child: Text(AppL10n.tr(
                            'pos.maxDailyDdPct', 'Max Daily Drawdown %'))),
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
                    Expanded(
                        child: Text(AppL10n.tr(
                            'pos.maxRiskTradePct', 'Max Risk / Trade %'))),
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
                    Expanded(
                        child: Text(AppL10n.tr(
                            'pos.maxOpenPos', 'Max Open Positions'))),
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
              child: Text(AppL10n.tr('common.cancel', 'Cancel')),
            ),
            FilledButton(
              onPressed: () => Navigator.of(ctx).pop(
                risk.copyWith(
                  maxDailyDrawdownPercent: maxDd,
                  maxRiskPerTradePercent: maxRisk,
                  maxOpenPositions: maxPos,
                ),
              ),
              child: Text(AppL10n.tr('pos.saveGuardrails', 'Save Guardrails')),
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
                        Text(
                          AppL10n.tr('pos.title',
                              'Active Positions & Execution Ledger'),
                          style: const TextStyle(
                              fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(width: 8),
                        Chip(
                            label: Text(
                                '${open.length} ${AppL10n.tr('dash.open', 'Open')}')),
                        const SizedBox(width: 8),
                        if (open.isNotEmpty)
                          Text(
                            '${AppL10n.tr('pos.netPnl', 'Net PnL')}: ${openPnl >= 0 ? '+' : '-'}\$${openPnl.abs().toStringAsFixed(2)}',
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
                            label: Text(AppL10n.tr('pos.closeAll', 'Close All')),
                          ),
                      ],
                    ),
                    const Divider(),
                    Expanded(
                      child: open.isEmpty && closed.isEmpty
                          ? Center(
                              child: Text(
                                AppL10n.tr('pos.noPositions',
                                    'No positions yet. Use Quick Trade on the Live Chart or Market Scanner.'),
                                style: const TextStyle(color: Colors.grey),
                              ),
                            )
                          : ListView(
                              children: [
                                if (open.isNotEmpty) ...[
                                  Padding(
                                    padding:
                                        const EdgeInsets.symmetric(vertical: 6),
                                    child: Text(
                                        AppL10n.tr('pos.openPositionsTab',
                                            'OPEN POSITIONS'),
                                        style: const TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.grey)),
                                  ),
                                  ...open.map((p) => _posTile(context, p, true)),
                                ],
                                if (closed.isNotEmpty) ...[
                                  Padding(
                                    padding:
                                        const EdgeInsets.symmetric(vertical: 6),
                                    child: Text(
                                        AppL10n.tr('pos.closedHistoryTab',
                                            'CLOSED HISTORY'),
                                        style: const TextStyle(
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
            child: ListView(
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(
                          children: [
                            Text(
                              AppL10n.tr('pos.riskConsole', 'Risk Console'),
                              style: const TextStyle(
                                  fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                            const Spacer(),
                            if (onResetDemoAccount != null)
                              TextButton.icon(
                                onPressed: () => _showResetDemoDialog(context),
                                icon: const Icon(Icons.restart_alt, size: 16),
                                label: Text(
                                    AppL10n.tr('pos.resetDemo', 'Reset Demo'),
                                    style: const TextStyle(fontSize: 12)),
                              ),
                            if (onUpdateRisk != null)
                              IconButton(
                                tooltip: AppL10n.tr('pos.editGuardrails',
                                    'Edit Risk Guardrails'),
                                icon: const Icon(Icons.tune, size: 18),
                                onPressed: () => _showRiskEditor(context),
                              ),
                          ],
                        ),
                        const Divider(),
                        _metric(AppL10n.tr('pos.balance', 'Balance'),
                            '\$${account.balance.toStringAsFixed(2)}'),
                        _metric(AppL10n.tr('pos.equity', 'Equity'),
                            '\$${account.equity.toStringAsFixed(2)}'),
                        _metric(
                          AppL10n.tr(
                              'pos.dailyRealizedPnl', 'Daily Realized PnL'),
                          '${account.dailyRealizedPnl >= 0 ? '+' : '-'}\$${account.dailyRealizedPnl.abs().toStringAsFixed(2)}',
                        ),
                        _metric(
                          AppL10n.tr('pos.dailyDrawdown', 'Daily Drawdown'),
                          '${account.currentDrawdownPercent.toStringAsFixed(2)}% / ${risk.maxDailyDrawdownPercent.toStringAsFixed(1)}%',
                        ),
                        _metric(
                            AppL10n.tr(
                                'pos.maxRiskPerTrade', 'Max Risk / Trade'),
                            '${risk.maxRiskPerTradePercent.toStringAsFixed(2)}%'),
                        _metric(
                            AppL10n.tr(
                                'pos.maxOpenPositions', 'Max Open Positions'),
                            '${risk.maxOpenPositions}'),
                        if (risk.isKillSwitchEngaged &&
                            (risk.killSwitchReason ?? '').isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Text(
                              '${AppL10n.tr('pos.haltReason', 'Halt reason')}: ${risk.killSwitchReason}',
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
                                ? AppL10n.tr('pos.disengageKillSwitch',
                                    'DISENGAGE KILL SWITCH')
                                : AppL10n.tr('pos.engageKillSwitch',
                                    'ENGAGE KILL SWITCH')),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                _buildStrategyLeaderboardCard(context),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStrategyLeaderboardCard(BuildContext context) {
    final byStrat = <String, List<Position>>{};
    for (final p in positions) {
      final key = p.strategyName.trim().isEmpty ? 'Manual' : p.strategyName;
      byStrat.putIfAbsent(key, () => []).add(p);
    }
    final entries = byStrat.entries.toList()
      ..sort((a, b) {
        double netOf(List<Position> list) => list.fold(
              0.0,
              (s, p) => s + (p.isOpen ? p.unrealizedPnl : p.realizedPnl),
            );
        return netOf(b.value).compareTo(netOf(a.value));
      });

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                const Icon(Icons.emoji_events_outlined,
                    size: 18, color: Color(0xFFF59E0B)),
                const SizedBox(width: 8),
                Text(
                  AppL10n.tr('pos.leaderboard', 'Strategy Paper Leaderboard'),
                  style: const TextStyle(
                      fontSize: 15, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const Divider(),
            if (entries.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Text(
                  AppL10n.tr('pos.noPaperTrades',
                      'No paper trades yet. Place a manual order or enable Auto-Trade on a strategy.'),
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
              )
            else
              ...entries.map((e) {
                final list = e.value;
                final openCount = list.where((p) => p.isOpen).length;
                final closedList = list.where((p) => !p.isOpen).toList();
                final wins =
                    closedList.where((p) => p.realizedPnl >= 0).length;
                final winRate = closedList.isEmpty
                    ? 0.0
                    : (wins / closedList.length) * 100.0;
                final netPnl = list.fold<double>(
                  0.0,
                  (s, p) => s + (p.isOpen ? p.unrealizedPnl : p.realizedPnl),
                );
                final posColor = netPnl >= 0
                    ? const Color(0xFF10B981)
                    : const Color(0xFFEF4444);

                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Theme.of(context).dividerColor),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              e.key,
                              style: const TextStyle(
                                  fontWeight: FontWeight.bold, fontSize: 12.5),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${AppL10n.tr('dash.open', 'Open')}: $openCount · ${AppL10n.tr('pos.closed', 'Closed')}: ${closedList.length} · ${AppL10n.tr('pos.win', 'Win')}: ${winRate.toStringAsFixed(0)}%',
                              style: const TextStyle(
                                  fontSize: 11,
                                  color: Colors.grey,
                                  fontFamily: 'monospace'),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        '${netPnl >= 0 ? '+' : '-'}\$${netPnl.abs().toStringAsFixed(2)}',
                        style: TextStyle(
                          fontFamily: 'monospace',
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                          color: posColor,
                        ),
                      ),
                    ],
                  ),
                );
              }),
          ],
        ),
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
        '${p.symbol} · ${p.lots.toStringAsFixed(2)} lots (${p.strategyName})'
        '${p.setupTag.isNotEmpty ? ' · [${p.setupTag}]' : ''}',
        style:
            const TextStyle(fontWeight: FontWeight.bold, fontFamily: 'monospace'),
      ),
      subtitle: Text(
        'Entry: ${IndicatorEngine.formatPrice(p.entryPrice, p.symbol)} | '
        'Now: ${IndicatorEngine.formatPrice(p.currentPrice, p.symbol)} | '
        'SL: ${p.stopLossPrice != null ? IndicatorEngine.formatPrice(p.stopLossPrice!, p.symbol) : 'None'} | '
        'TP: ${p.takeProfitPrice != null ? IndicatorEngine.formatPrice(p.takeProfitPrice!, p.symbol) : 'None'}'
        '${p.note.isNotEmpty ? '\nNote: ${p.note}' : ''}',
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
          if (onUpdatePositionNote != null) ...[
            const SizedBox(width: 4),
            IconButton(
              tooltip: p.note.isEmpty ? 'Add Trade Note' : 'Edit Trade Note',
              icon: Icon(
                p.note.isEmpty
                    ? Icons.note_add_outlined
                    : Icons.sticky_note_2,
                size: 16,
                color: p.note.isNotEmpty ? const Color(0xFF38BDF8) : null,
              ),
              onPressed: () => _showPositionNoteDialog(context, p),
            ),
          ],
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
              child: Text(AppL10n.tr('pos.close', 'Close')),
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
