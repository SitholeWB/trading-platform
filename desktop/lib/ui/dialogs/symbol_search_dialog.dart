import 'package:flutter/material.dart';
import '../../models/trading_models.dart';
import '../../services/symbol_catalog.dart';

class SymbolSearchDialog extends StatefulWidget {
  final String selectedSymbol;
  const SymbolSearchDialog({super.key, required this.selectedSymbol});

  @override
  State<SymbolSearchDialog> createState() => _SymbolSearchDialogState();
}

class _SymbolSearchDialogState extends State<SymbolSearchDialog> {
  String _query = '';
  AssetCategory _category = AssetCategory.all;

  @override
  Widget build(BuildContext context) {
    final filtered = SymbolCatalog.allSymbols.where((s) {
      final matchesCat =
          _category == AssetCategory.all || s.category == _category;
      final q = _query.trim().toUpperCase();
      final matchesQ = q.isEmpty ||
          s.symbol.toUpperCase().contains(q) ||
          s.name.toUpperCase().contains(q);
      return matchesCat && matchesQ;
    }).toList();

    return Dialog(
      child: SizedBox(
        width: 580,
        height: 520,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.search, size: 20),
                  const SizedBox(width: 8),
                  const Text(
                    'Symbol Catalog (45+ Markets)',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.close, size: 18),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              TextField(
                autofocus: true,
                onChanged: (v) => setState(() => _query = v),
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.search, size: 18),
                  hintText: 'Search symbol or instrument (e.g. EURUSD, XAUUSD, PEPEUSDT, NVDA)...',
                  border: OutlineInputBorder(),
                  isDense: true,
                ),
              ),
              const SizedBox(height: 10),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: AssetCategory.values.map((cat) {
                    final active = _category == cat;
                    return Padding(
                      padding: const EdgeInsets.only(right: 6),
                      child: ChoiceChip(
                        label: Text(cat.label),
                        selected: active,
                        onSelected: (_) => setState(() => _category = cat),
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 10),
              Expanded(
                child: ListView.separated(
                  itemCount: filtered.length,
                  separatorBuilder: (_, _) => const Divider(height: 1),
                  itemBuilder: (ctx, i) {
                    final item = filtered[i];
                    final isSel = item.symbol == widget.selectedSymbol;
                    return ListTile(
                      dense: true,
                      selected: isSel,
                      leading: Chip(
                        label: Text(
                          item.category.label.toUpperCase(),
                          style: const TextStyle(fontSize: 10),
                        ),
                      ),
                      title: Text(
                        item.symbol,
                        style: const TextStyle(
                          fontFamily: 'monospace',
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      subtitle: Text(item.name),
                      trailing: Text(
                        item.tradingViewTicker,
                        style: const TextStyle(
                          fontSize: 11,
                          fontFamily: 'monospace',
                          color: Colors.grey,
                        ),
                      ),
                      onTap: () => Navigator.pop(context, item.symbol),
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
