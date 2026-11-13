import 'package:flutter/material.dart';

class DocumentationPage extends StatefulWidget {
  const DocumentationPage({super.key});

  @override
  State<DocumentationPage> createState() => _DocumentationPageState();
}

class _DocumentationPageState extends State<DocumentationPage> {
  String _query = '';
  int _selectedCategory = 0;

  static const _categories = [
    'All Topics',
    'Charts & Precision',
    'Rule Studio & AI',
    'Scanner & Risk',
    'Shortcuts & Data',
  ];

  static const _sections = [
    _DocEntry(
      category: 1,
      icon: Icons.candlestick_chart,
      title: '1. Dual Chart Engines (Bot Chart & TradingView Live)',
      body:
          'Switch between the GPU-accelerated Bot Chart (supporting EMA, SMA, Bollinger Bands, VWAP, Supertrend, Ichimoku, RSI, MACD, drawing tools, SL/TP lines, and Single/Split/Quad Grid layouts) and the embedded TradingView Live feed bridge from the top bar.',
    ),
    _DocEntry(
      category: 1,
      icon: Icons.precision_manufacturing,
      title: '2. Dynamic Decimal Precision (Up to 10 Decimals)',
      body:
          'Price axes, OHLCV readouts, watchlists, and position ledgers automatically inspect live market decimals and sub-dollar magnitudes so Forex pairs, Indices, and micro-cap crypto tokens render at full accuracy without rounding.',
    ),
    _DocEntry(
      category: 2,
      icon: Icons.tune,
      title: '3. Split-Pane Algorithmic Rule Studio',
      body:
          'Create, edit, enable/pause, and test strategies inline in Rule Studio. Configure symbol, timeframe, Risk %, Stop-Loss/Take-Profit ATR multipliers, AND/OR rule combinators, and inspect compiled JSON definitions or trigger live evaluations.',
    ),
    _DocEntry(
      category: 2,
      icon: Icons.auto_awesome,
      title: '4. AI Strategy Generator & AI Copilot',
      body:
          'Use the AI Strategy Generator (sparkle button in Rule Studio) to synthesize quantitative rules from natural-language descriptions, or open the AI Copilot drawer from the top bar to ask questions about market structure, risk, and active setups.',
    ),
    _DocEntry(
      category: 3,
      icon: Icons.radar,
      title: '5. Robotic Market Scanner & Historical Backtester',
      body:
          'The Market Scanner evaluates EMA 20/50 alignment, RSI(14), and ATR(14) volatility across Forex, Crypto, Indices, and Commodities, with one-click chart jump and quick-order execution. Use the Backtester tab to replay strategy rules over historical candles.',
    ),
    _DocEntry(
      category: 3,
      icon: Icons.shield_outlined,
      title: '6. Audit Radar, Risk Console & Emergency Kill Switch',
      body:
          'Every strategy evaluation is logged to Audit Radar with Near-Miss and Fully-Met scores. If daily drawdown approaches your configured limit, engage the Emergency Kill Switch in the top bar or Risk Simulator to halt automated execution immediately.',
    ),
    _DocEntry(
      category: 4,
      icon: Icons.cloud_sync,
      title: '7. Market Data Providers & 60s Rate-Limit Guard',
      body:
          'Keyless Live market data works out-of-the-box with automatic deterministic fallback when offline. Connect OANDA v20 (Practice/Live) or TwelveData API keys in Settings, and monitor the draggable sync badge on the chart.',
    ),
    _DocEntry(
      category: 4,
      icon: Icons.keyboard,
      title: '8. Keyboard Shortcuts & Workspace Persistence',
      body:
          'Press Ctrl+K (or click the symbol pill) to open Symbol Search. Your selected symbol, timeframe, theme (Dark/Light), timezone, drawings, strategies, and positions are automatically saved locally.',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final q = _query.trim().toLowerCase();
    final filtered = _sections.where((s) {
      if (_selectedCategory != 0 && s.category != _selectedCategory) {
        return false;
      }
      if (q.isEmpty) return true;
      return s.title.toLowerCase().contains(q) ||
          s.body.toLowerCase().contains(q);
    }).toList();

    return Column(
      children: [
        Container(
          padding: const EdgeInsets.fromLTRB(18, 14, 18, 10),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            border: Border(
              bottom: BorderSide(color: Theme.of(context).dividerColor),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.menu_book_outlined,
                      size: 20, color: Color(0xFF38BDF8)),
                  const SizedBox(width: 8),
                  const Text(
                    'Trading Platform — Desktop User Manual',
                    style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
                  ),
                  const Spacer(),
                  SizedBox(
                    width: 260,
                    child: TextField(
                      onChanged: (v) => setState(() => _query = v),
                      decoration: const InputDecoration(
                        hintText: 'Search documentation...',
                        prefixIcon: Icon(Icons.search, size: 17),
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: List.generate(_categories.length, (i) {
                  return ChoiceChip(
                    label: Text(_categories[i],
                        style: const TextStyle(fontSize: 11.5)),
                    selected: _selectedCategory == i,
                    visualDensity: VisualDensity.compact,
                    onSelected: (_) => setState(() => _selectedCategory = i),
                  );
                }),
              ),
            ],
          ),
        ),
        Expanded(
          child: filtered.isEmpty
              ? const Center(
                  child: Text(
                    'No documentation topics match your search.',
                    style: TextStyle(color: Colors.grey),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: filtered.length,
                  itemBuilder: (_, i) {
                    final item = filtered[i];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 10),
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 34,
                              height: 34,
                              decoration: BoxDecoration(
                                color: const Color(0xFF38BDF8)
                                    .withValues(alpha: 0.14),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Icon(item.icon,
                                  size: 18, color: const Color(0xFF38BDF8)),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.title,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    item.body,
                                    style: const TextStyle(
                                      height: 1.45,
                                      fontSize: 13,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }
}

class _DocEntry {
  final int category;
  final IconData icon;
  final String title;
  final String body;

  const _DocEntry({
    required this.category,
    required this.icon,
    required this.title,
    required this.body,
  });
}
