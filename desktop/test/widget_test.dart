import 'package:flutter_test/flutter_test.dart';
import 'package:trading_platform/models/trading_models.dart';
import 'package:trading_platform/services/indicator_engine.dart';
import 'package:trading_platform/services/market_data_service.dart';
import 'package:trading_platform/services/market_hours_service.dart';
import 'package:trading_platform/services/strategy_scanner.dart';

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

  test('StrategyScanner backtest evaluates rules over selected period', () {
    final candles = MarketDataService.synthesizeCandles(
      'EURUSD',
      Timeframe.m15,
      count: 160,
    );
    const strat = StrategyDefinition(
      id: 'test_strat',
      name: 'Test RSI',
      symbol: 'EURUSD',
      timeframe: Timeframe.m15,
      entryRules: [
        StrategyRule(
          indicator: 'RSI_OS',
          condition: 'LessThan',
          threshold: 45,
          period: 14,
        ),
      ],
    );
    final res = StrategyScanner.backtestStrategy(
      strat,
      candles,
      lookbackBars: 100,
    );
    expect(res.barsTested, equals(100));
    expect(res.latestRuleBreakdown, isNotEmpty);
  });

  test('MarketHoursService marks Crypto open 24/7 and Forex/Stocks closed on Saturday', () {
    final saturdayUtc = DateTime.utc(2026, 11, 14, 15, 0); // Saturday
    final mondayNyOpenUtc = DateTime.utc(2026, 11, 16, 15, 0); // Monday

    expect(MarketHoursService.getStatus('BTCUSDT', nowUtc: saturdayUtc).isOpen, isTrue);
    expect(MarketHoursService.getStatus('EURUSD', nowUtc: saturdayUtc).isOpen, isFalse);
    expect(MarketHoursService.getStatus('AAPL', nowUtc: saturdayUtc).isOpen, isFalse);

    expect(MarketHoursService.getStatus('EURUSD', nowUtc: mondayNyOpenUtc).isOpen, isTrue);
    expect(MarketHoursService.getStatus('AAPL', nowUtc: mondayNyOpenUtc).isOpen, isTrue);
  });
}
