import 'package:flutter/material.dart';
import '../../models/trading_models.dart';
import '../../services/indicator_engine.dart';
import '../../services/localization_service.dart';
import '../../services/notification_service.dart';
import '../../services/symbol_catalog.dart';

class AlertsDialog extends StatefulWidget {
  final String symbol;
  final double currentPrice;
  final List<PriceAlert> alerts;
  final ValueChanged<PriceAlert> onAddAlert;
  final ValueChanged<String> onDeleteAlert;
  final NotificationService? notifications;
  final bool showAllSymbols;
  final int initialTab;

  const AlertsDialog({
    super.key,
    required this.symbol,
    required this.currentPrice,
    required this.alerts,
    required this.onAddAlert,
    required this.onDeleteAlert,
    this.notifications,
    this.showAllSymbols = false,
    this.initialTab = 0,
  });

  @override
  State<AlertsDialog> createState() => _AlertsDialogState();
}

class _AlertsDialogState extends State<AlertsDialog> {
  late final TextEditingController _priceCtrl;
  final _labelCtrl = TextEditingController();
  late String _targetSymbol;
  String _condition = 'Above';
  late int _tabIndex;

  @override
  void initState() {
    super.initState();
    _targetSymbol = widget.symbol;
    _tabIndex = widget.initialTab;
    _priceCtrl = TextEditingController(
      text: IndicatorEngine.formatPrice(widget.currentPrice, widget.symbol)
          .replaceAll(',', ''),
    );
  }

  @override
  void dispose() {
    _priceCtrl.dispose();
    _labelCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final visibleAlerts = widget.showAllSymbols
        ? widget.alerts
        : widget.alerts.where((a) => a.symbol == widget.symbol).toList();
    final notifSvc = widget.notifications;
    final unreadCount = notifSvc?.unreadCount ?? 0;

    return Dialog(
      child: SizedBox(
        width: 580,
        height: 490,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.notifications_active,
                      color: Color(0xFFF59E0B), size: 20),
                  const SizedBox(width: 8),
                  Text(
                    widget.showAllSymbols
                        ? AppL10n.tr(
                            'alerts.centerTitle', 'Alerts & Notifications')
                        : '${AppL10n.tr('alerts.title', 'Price Alerts')} (${widget.symbol})',
                    style: const TextStyle(
                        fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const Spacer(),
                  if (notifSvc != null)
                    SegmentedButton<int>(
                      segments: [
                        ButtonSegment(
                          value: 0,
                          label: Text(
                              '${AppL10n.tr('chart.alerts', 'Alerts')} (${visibleAlerts.length})',
                              style: const TextStyle(fontSize: 11.5)),
                        ),
                        ButtonSegment(
                          value: 1,
                          label: Text(
                              '${AppL10n.tr('alerts.notificationsTab', 'Notifications')} ($unreadCount)',
                              style: const TextStyle(fontSize: 11.5)),
                        ),
                      ],
                      selected: {_tabIndex},
                      onSelectionChanged: (s) =>
                          setState(() => _tabIndex = s.first),
                    ),
                  const SizedBox(width: 6),
                  IconButton(
                    icon: const Icon(Icons.close, size: 18),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              if (_tabIndex == 0) ...[
                Row(
                  children: [
                    if (widget.showAllSymbols) ...[
                      DropdownButton<String>(
                        value: SymbolCatalog.allSymbols
                                .any((s) => s.symbol == _targetSymbol)
                            ? _targetSymbol
                            : SymbolCatalog.allSymbols.first.symbol,
                        items: SymbolCatalog.allSymbols
                            .map((s) => DropdownMenuItem<String>(
                                  value: s.symbol,
                                  child: Text(s.symbol,
                                      style: const TextStyle(
                                          fontFamily: 'monospace',
                                          fontSize: 12)),
                                ))
                            .toList(),
                        onChanged: (v) {
                          if (v != null) setState(() => _targetSymbol = v);
                        },
                      ),
                      const SizedBox(width: 8),
                    ],
                    DropdownButton<String>(
                      value: _condition,
                      items: [
                        DropdownMenuItem(
                            value: 'Above',
                            child: Text(AppL10n.tr('alerts.above', 'Above'))),
                        DropdownMenuItem(
                            value: 'Below',
                            child: Text(AppL10n.tr('alerts.below', 'Below'))),
                      ],
                      onChanged: (v) {
                        if (v != null) setState(() => _condition = v);
                      },
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: _priceCtrl,
                        decoration: InputDecoration(
                          labelText:
                              AppL10n.tr('alerts.targetPrice', 'Target Price'),
                          border: const OutlineInputBorder(),
                          isDense: true,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: _labelCtrl,
                        decoration: InputDecoration(
                          labelText: AppL10n.tr(
                              'alerts.noteOptional', 'Note (Optional)'),
                          border: const OutlineInputBorder(),
                          isDense: true,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    FilledButton(
                      onPressed: () {
                        final p = double.tryParse(_priceCtrl.text.trim());
                        if (p == null) return;
                        widget.onAddAlert(PriceAlert(
                          id: 'al_${DateTime.now().millisecondsSinceEpoch}',
                          symbol: _targetSymbol,
                          targetPrice: p,
                          condition: _condition,
                          label: _labelCtrl.text.trim(),
                          createdAt: DateTime.now().toUtc(),
                        ));
                        _labelCtrl.clear();
                        setState(() {});
                      },
                      child: Text(AppL10n.tr('common.add', 'Add')),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                const Divider(),
                Expanded(
                  child: visibleAlerts.isEmpty
                      ? Center(
                          child: Text(AppL10n.tr('alerts.noneConfigured',
                              'No alerts configured yet.')))
                      : ListView.builder(
                          itemCount: visibleAlerts.length,
                          itemBuilder: (ctx, i) {
                            final a = visibleAlerts[i];
                            return ListTile(
                              dense: true,
                              leading: Icon(
                                a.triggered
                                    ? Icons.check_circle
                                    : Icons.alarm_on,
                                color: a.triggered
                                    ? const Color(0xFF10B981)
                                    : const Color(0xFFF59E0B),
                              ),
                              title: Text(
                                '${a.symbol} ${a.condition == 'Above' ? AppL10n.tr('alerts.above', 'Above') : AppL10n.tr('alerts.below', 'Below')} ${IndicatorEngine.formatPrice(a.targetPrice, a.symbol)}',
                                style: const TextStyle(
                                    fontFamily: 'monospace',
                                    fontWeight: FontWeight.w600),
                              ),
                              subtitle: a.label.isEmpty ? null : Text(a.label),
                              trailing: IconButton(
                                icon:
                                    const Icon(Icons.delete_outline, size: 18),
                                onPressed: () {
                                  widget.onDeleteAlert(a.id);
                                  setState(() {});
                                },
                              ),
                            );
                          },
                        ),
                ),
              ] else if (notifSvc != null) ...[
                Row(
                  children: [
                    Text(
                      '${notifSvc.history.length} ${AppL10n.tr('alerts.totalNotifications', 'notifications')} · $unreadCount ${AppL10n.tr('alerts.unread', 'unread')}',
                      style:
                          const TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                    const Spacer(),
                    TextButton.icon(
                      onPressed: () async {
                        await notifSvc.sendDesktopNotification(
                          title: AppL10n.tr('alerts.testTitle',
                              'Trading Platform Notification'),
                          body: AppL10n.tr('alerts.testBody',
                              'Desktop notifications & launch icon badge are active.'),
                        );
                        if (mounted) setState(() {});
                      },
                      icon: const Icon(Icons.send_outlined, size: 15),
                      label: Text(AppL10n.tr('alerts.testNotify', 'Test'),
                          style: const TextStyle(fontSize: 12)),
                    ),
                    const SizedBox(width: 4),
                    TextButton.icon(
                      onPressed: unreadCount == 0
                          ? null
                          : () async {
                              await notifSvc.markAllRead();
                              if (mounted) setState(() {});
                            },
                      icon: const Icon(Icons.done_all, size: 15),
                      label: Text(
                          AppL10n.tr('alerts.markAllRead', 'Mark Read'),
                          style: const TextStyle(fontSize: 12)),
                    ),
                    const SizedBox(width: 4),
                    TextButton.icon(
                      onPressed: notifSvc.history.isEmpty
                          ? null
                          : () async {
                              await notifSvc.clearAll();
                              if (mounted) setState(() {});
                            },
                      icon: const Icon(Icons.clear_all, size: 15),
                      label: Text(AppL10n.tr('alerts.clearAll', 'Clear'),
                          style: const TextStyle(fontSize: 12)),
                    ),
                  ],
                ),
                const Divider(),
                Expanded(
                  child: notifSvc.history.isEmpty
                      ? Center(
                          child: Text(
                            AppL10n.tr('alerts.noNotifications',
                                'No notifications yet. Price alerts, SL/TP hits, and bot signals appear here.'),
                            style: const TextStyle(color: Colors.grey),
                          ),
                        )
                      : ListView.separated(
                          itemCount: notifSvc.history.length,
                          separatorBuilder: (_, _) =>
                              const Divider(height: 1),
                          itemBuilder: (_, i) {
                            final n = notifSvc.history[i];
                            final hhmm = n.timestamp
                                .toLocal()
                                .toIso8601String()
                                .substring(11, 19);
                            return ListTile(
                              dense: true,
                              leading: Icon(
                                n.urgent
                                    ? Icons.warning_amber_rounded
                                    : Icons.notifications_outlined,
                                color: n.urgent
                                    ? const Color(0xFFEF4444)
                                    : n.read
                                        ? Colors.grey
                                        : const Color(0xFF38BDF8),
                                size: 18,
                              ),
                              title: Text(
                                n.title,
                                style: TextStyle(
                                  fontSize: 12.5,
                                  fontWeight: n.read
                                      ? FontWeight.normal
                                      : FontWeight.bold,
                                ),
                              ),
                              subtitle: Text(
                                n.body,
                                style: const TextStyle(fontSize: 11.5),
                              ),
                              trailing: Text(
                                hhmm,
                                style: const TextStyle(
                                  fontFamily: 'monospace',
                                  fontSize: 10.5,
                                  color: Colors.grey,
                                ),
                              ),
                            );
                          },
                        ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
