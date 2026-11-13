import 'package:flutter_test/flutter_test.dart';
import 'package:trading_platform/models/trading_models.dart';
import 'package:trading_platform/services/indicator_engine.dart';
import 'package:trading_platform/services/market_data_service.dart';

void main() {
  test('Dynamic decimal precision supports 6 to 10+ decimals without capping', () {
    expect(
      IndicatorEngine.getSymbolDigits('PEPEUSDT', samplePrice: 0.00001085),
      greaterThanOrEqualTo(8),
    );
    expect(
      IndicatorEngine.getSymbolDigits('EURUSD', samplePrice: 1.085241),
      equals(6),
    );
    expect(
      IndicatorEngine.getSymbolDigits('US500', samplePrice: 5782.40),
      equals(2),
    );
  });

  test('Synthesized H4 candles align strictly to 4-hour UTC boundaries', () {
    final candles = MarketDataService.synthesizeCandles(
      'EURUSD',
      Timeframe.h4,
      count: 20,
    );
    expect(candles.length, equals(20));
    for (final c in candles) {
      expect(c.timestamp.toUtc().hour % 4, equals(0));
      expect(c.timestamp.toUtc().minute, equals(0));
    }
  });
}
