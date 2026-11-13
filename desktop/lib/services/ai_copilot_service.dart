import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/trading_models.dart';
import 'indicator_engine.dart';
import 'storage_service.dart';
import 'strategy_scanner.dart';
import 'symbol_catalog.dart';

class AiCopilotService {
  final StorageService storage;
  AiCopilotService(this.storage);

  Future<String> ask({
    required String prompt,
    required String symbol,
    required Timeframe timeframe,
    required List<Candle> candles,
  }) async {
    final diag = _buildLocalDiagnostics(symbol, timeframe, candles);

    if (storage.aiProvider == 'OpenAI' && storage.aiApiKey.isNotEmpty) {
      try {
        final resp = await http
            .post(
              Uri.parse('https://api.openai.com/v1/chat/completions'),
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ${storage.aiApiKey}',
              },
              body: jsonEncode({
                'model': 'gpt-4o-mini',
                'messages': [
                  {
                    'role': 'system',
                    'content':
                        'You are an institutional quantitative trading analyst. Context:\n$diag',
                  },
                  {'role': 'user', 'content': prompt},
                ],
                'max_tokens': 450,
              }),
            )
            .timeout(const Duration(seconds: 15));
        if (resp.statusCode == 200) {
          final data = jsonDecode(resp.body) as Map<String, dynamic>;
          final choices = data['choices'] as List<dynamic>;
          if (choices.isNotEmpty) {
            return choices.first['message']['content'] as String;
          }
        }
      } catch (_) {}
    }

    if (storage.aiProvider == 'Ollama') {
      try {
        final resp = await http
            .post(
              Uri.parse('${storage.aiEndpoint}/api/generate'),
              headers: {'Content-Type': 'application/json'},
              body: jsonEncode({
                'model': 'llama3.2',
                'prompt': 'Market context:\n$diag\n\nUser question: $prompt',
                'stream': false,
              }),
            )
            .timeout(const Duration(seconds: 15));
        if (resp.statusCode == 200) {
          final data = jsonDecode(resp.body) as Map<String, dynamic>;
          final text = data['response'] as String?;
          if (text != null && text.isNotEmpty) return text;
        }
      } catch (_) {}
    }

    return _builtInQuantReply(prompt, symbol, timeframe, candles, diag);
  }

  String _buildLocalDiagnostics(
    String symbol,
    Timeframe tf,
    List<Candle> candles,
  ) {
    final spec = SymbolCatalog.find(symbol);
    final hit = StrategyScanner.analyzeCandles(spec, tf, candles);
    final priceStr = IndicatorEngine.formatPrice(hit.price, symbol);
    final atrStr = IndicatorEngine.formatPrice(hit.atr, symbol);
    return 'Symbol: $symbol (${spec.name}) | Timeframe: ${tf.code}\n'
        'Price: $priceStr (${hit.changePct >= 0 ? '+' : ''}${hit.changePct.toStringAsFixed(2)}%)\n'
        'Trend: ${hit.trend} | RSI(14): ${hit.rsi.toStringAsFixed(1)} | ATR(14): $atrStr\n'
        'Quant Score: ${hit.score.toStringAsFixed(0)}/100 (${hit.signal})';
  }

  String _builtInQuantReply(
    String prompt,
    String symbol,
    Timeframe tf,
    List<Candle> candles,
    String diag,
  ) {
    final spec = SymbolCatalog.find(symbol);
    final hit = StrategyScanner.analyzeCandles(spec, tf, candles);
    final slDist = hit.atr * 1.5;
    final tpDist = hit.atr * 3.0;
    final isBull = hit.score >= 50;
    final sl = isBull ? hit.price - slDist : hit.price + slDist;
    final tp = isBull ? hit.price + tpDist : hit.price - tpDist;

    return '''**Quant Diagnostics — $symbol (${tf.code})**
$diag

**Actionable Structure:**
- **Bias**: ${hit.signal} (${hit.trend} regime)
- **Suggested Risk Envelope (1.5x / 3.0x ATR)**:
  - Stop Loss: `${IndicatorEngine.formatPrice(sl, symbol)}`
  - Take Profit: `${IndicatorEngine.formatPrice(tp, symbol)}`
- **Note**: Configure an OpenAI or local Ollama endpoint in **Settings** for free-form LLM reasoning.''';
  }
}
