import 'package:flutter/material.dart';

class DocumentationPage extends StatelessWidget {
  const DocumentationPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: const [
        Text(
          'Trading Platform — Native Desktop User Manual',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        SizedBox(height: 12),
        _DocSection(
          title: '1. Dual Chart Engines (Bot Chart vs TradingView Live)',
          body:
              'Use the Chart Mode switcher in the top header bar to switch between the native GPU-accelerated Bot Chart (supporting custom indicators, drawing tools, SL/TP lines, and Split/Quad Grid layouts) and the TradingView Live feed bridge.',
        ),
        _DocSection(
          title: '2. Dynamic Decimal Precision (Up to 10 Decimals)',
          body:
              'Price axes, OHLCV readouts, watchlists, and position ledgers automatically inspect live market decimals and sub-dollar magnitudes so Forex pairs, Indices, and micro-cap crypto tokens render at full accuracy without rounding.',
        ),
        _DocSection(
          title: '3. Market Data Providers & 60s Rate-Limit Guard',
          body:
              'Keyless Live market data works out-of-the-box via Yahoo Finance with automatic deterministic fallback when offline. You can also connect OANDA v20 or TwelveData credentials in Settings.',
        ),
        _DocSection(
          title: '4. Robotic Market Scanner & Risk Guard',
          body:
              'The Market Scanner evaluates EMA 20/50 alignment, RSI(14), and ATR(14) volatility across multiple asset classes. If daily drawdown approaches your configured limit, use the Emergency Kill Switch to halt automated execution.',
        ),
      ],
    );
  }
}

class _DocSection extends StatelessWidget {
  final String title;
  final String body;
  const _DocSection({required this.title, required this.body});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title,
                style:
                    const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 6),
            Text(body, style: const TextStyle(height: 1.45)),
          ],
        ),
      ),
    );
  }
}
