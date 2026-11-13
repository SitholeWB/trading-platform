import 'package:flutter/material.dart';
import '../../models/trading_models.dart';
import '../../services/indicator_engine.dart';

class AlertsDialog extends StatefulWidget {
  final String symbol;
  final double currentPrice;
  final List<PriceAlert> alerts;
  final ValueChanged<PriceAlert> onAddAlert;
  final ValueChanged<String> onDeleteAlert;

  const AlertsDialog({
    super.key,
    required this.symbol,
    required this.currentPrice,
    required this.alerts,
    required this.onAddAlert,
    required this.onDeleteAlert,
  });

  @override
  State<AlertsDialog> createState() => _AlertsDialogState();
}

class _AlertsDialogState extends State<AlertsDialog> {
  late final TextEditingController _priceCtrl;
  final _labelCtrl = TextEditingController();
  String _condition = 'Above';

  @override
  void initState() {
    super.initState();
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
    return Dialog(
      child: SizedBox(
        width: 480,
        height: 440,
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
                    'Price Alerts (${widget.symbol})',
                    style: const TextStyle(
                        fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.close, size: 18),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  DropdownButton<String>(
                    value: _condition,
                    items: const [
                      DropdownMenuItem(value: 'Above', child: Text('Above')),
                      DropdownMenuItem(value: 'Below', child: Text('Below')),
                    ],
                    onChanged: (v) {
                      if (v != null) setState(() => _condition = v);
                    },
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: _priceCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Target Price',
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: _labelCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Note (Optional)',
                        border: OutlineInputBorder(),
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
                        symbol: widget.symbol,
                        targetPrice: p,
                        condition: _condition,
                        label: _labelCtrl.text.trim(),
                        createdAt: DateTime.now().toUtc(),
                      ));
                      setState(() {});
                    },
                    child: const Text('Add'),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Divider(),
              Expanded(
                child: widget.alerts.isEmpty
                    ? const Center(child: Text('No alerts configured yet.'))
                    : ListView.builder(
                        itemCount: widget.alerts.length,
                        itemBuilder: (ctx, i) {
                          final a = widget.alerts[i];
                          return ListTile(
                            dense: true,
                            leading: Icon(
                              a.triggered
                                  ? Icons.check_circle
                                  : Icons.notifications_none,
                              color: a.triggered
                                  ? Colors.green
                                  : const Color(0xFFF59E0B),
                            ),
                            title: Text(
                              '${a.symbol} ${a.condition} ${IndicatorEngine.formatPrice(a.targetPrice, a.symbol)}',
                              style: const TextStyle(
                                  fontFamily: 'monospace',
                                  fontWeight: FontWeight.bold),
                            ),
                            subtitle: a.label.isNotEmpty ? Text(a.label) : null,
                            trailing: IconButton(
                              icon: const Icon(Icons.delete_outline, size: 18),
                              onPressed: () {
                                widget.onDeleteAlert(a.id);
                                setState(() {});
                              },
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
