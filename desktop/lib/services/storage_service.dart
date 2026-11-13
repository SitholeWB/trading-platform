import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import '../models/trading_models.dart';

class StorageService {
  late File _stateFile;

  String activeProvider = 'KeylessPublic'; // KeylessPublic | Oanda | TwelveData | Demo
  String oandaApiKey = '';
  String oandaAccountId = '';
  bool oandaIsPractice = true;
  String twelveDataApiKey = '';
  String aiProvider = 'BuiltIn'; // BuiltIn | OpenAI | Gemini | Ollama
  String aiApiKey = '';
  String aiEndpoint = 'http://localhost:11434';

  String selectedSymbol = 'EURUSD';
  Timeframe selectedTimeframe = Timeframe.m5;
  ChartEngineMode chartEngine = ChartEngineMode.native;
  ChartType chartType = ChartType.candlestick;
  ThemeMode themeMode = ThemeMode.dark;
  int timezoneOffsetHours = 2;
  String timezoneLabel = 'SAST (UTC+2)';
  String languageCode = 'en';

  bool isNavCollapsed = false;
  bool isWatchlistCollapsed = false;
  bool desktopNotificationsEnabled = true;
  bool audioChimesEnabled = true;

  String feedbackAuthor = '';
  String feedbackContact = '';
  int feedbackLastSentMs = 0;

  AccountSummary account = const AccountSummary(
    balance: 100000.0,
    equity: 100000.0,
    unrealizedPnl: 0.0,
    dailyRealizedPnl: 0.0,
    currentDrawdownPercent: 0.0,
  );
  RiskProfile risk = const RiskProfile();
  List<StrategyDefinition> strategies = [];
  List<Position> positions = [];
  List<SignalAuditLog> auditLogs = [];
  List<PriceAlert> alerts = [];
  Map<String, List<DrawingItem>> drawingsBySymbol = {};

  Future<void> init() async {
    final dir = await getApplicationSupportDirectory();
    if (!await dir.exists()) {
      await dir.create(recursive: true);
    }
    _stateFile = File('${dir.path}/trading_platform_state.json');
    if (await _stateFile.exists()) {
      try {
        final raw = await _stateFile.readAsString();
        final data = jsonDecode(raw) as Map<String, dynamic>;
        activeProvider = data['activeProvider'] as String? ?? 'KeylessPublic';
        oandaApiKey = data['oandaApiKey'] as String? ?? '';
        oandaAccountId = data['oandaAccountId'] as String? ?? '';
        oandaIsPractice = data['oandaIsPractice'] as bool? ?? true;
        twelveDataApiKey = data['twelveDataApiKey'] as String? ?? '';
        aiProvider = data['aiProvider'] as String? ?? 'BuiltIn';
        aiApiKey = data['aiApiKey'] as String? ?? '';
        aiEndpoint = data['aiEndpoint'] as String? ?? 'http://localhost:11434';
        selectedSymbol = data['selectedSymbol'] as String? ?? 'EURUSD';
        selectedTimeframe =
            Timeframe.fromCode(data['selectedTimeframe'] as String? ?? 'M5');
        final ceName = data['chartEngine'] as String? ?? 'native';
        chartEngine = ChartEngineMode.values.firstWhere(
          (e) => e.name == ceName,
          orElse: () => ChartEngineMode.native,
        );
        final ctName = data['chartType'] as String? ?? 'candlestick';
        chartType = ChartType.values.firstWhere(
          (e) => e.name == ctName,
          orElse: () => ChartType.candlestick,
        );
        final tm = data['themeMode'] as String? ?? 'dark';
        themeMode = tm == 'light'
            ? ThemeMode.light
            : tm == 'system'
                ? ThemeMode.system
                : ThemeMode.dark;
        timezoneOffsetHours = data['timezoneOffsetHours'] as int? ?? 2;
        timezoneLabel = data['timezoneLabel'] as String? ?? 'SAST (UTC+2)';
        languageCode = data['languageCode'] as String? ?? 'en';
        isNavCollapsed = data['isNavCollapsed'] as bool? ?? false;
        isWatchlistCollapsed = data['isWatchlistCollapsed'] as bool? ?? false;
        desktopNotificationsEnabled =
            data['desktopNotificationsEnabled'] as bool? ?? true;
        audioChimesEnabled = data['audioChimesEnabled'] as bool? ?? true;
        feedbackAuthor = data['feedbackAuthor'] as String? ?? '';
        feedbackContact = data['feedbackContact'] as String? ?? '';
        feedbackLastSentMs = data['feedbackLastSentMs'] as int? ?? 0;

        if (data['account'] is Map<String, dynamic>) {
          account = AccountSummary.fromJson(
              data['account'] as Map<String, dynamic>);
        }
        if (data['risk'] is Map<String, dynamic>) {
          risk = RiskProfile.fromJson(data['risk'] as Map<String, dynamic>);
        }
        if (data['strategies'] is List) {
          strategies = (data['strategies'] as List)
              .map((e) =>
                  StrategyDefinition.fromJson(e as Map<String, dynamic>))
              .toList();
        }
        if (data['positions'] is List) {
          positions = (data['positions'] as List)
              .map((e) => Position.fromJson(e as Map<String, dynamic>))
              .toList();
        }
        if (data['auditLogs'] is List) {
          auditLogs = (data['auditLogs'] as List)
              .map((e) => SignalAuditLog.fromJson(e as Map<String, dynamic>))
              .toList();
        }
        if (data['alerts'] is List) {
          alerts = (data['alerts'] as List)
              .map((e) => PriceAlert.fromJson(e as Map<String, dynamic>))
              .toList();
        }
        if (data['drawingsBySymbol'] is Map) {
          drawingsBySymbol =
              (data['drawingsBySymbol'] as Map<String, dynamic>).map(
            (k, v) => MapEntry(
              k,
              (v as List)
                  .map((d) => DrawingItem.fromJson(d as Map<String, dynamic>))
                  .toList(),
            ),
          );
        }
      } catch (_) {
        _seedDefaults();
      }
    } else {
      _seedDefaults();
      await save();
    }

    if (strategies.isEmpty) {
      _seedDefaults();
      await save();
    }
  }

  void _seedDefaults() {
    strategies = [
      const StrategyDefinition(
        id: 'strat-ema-momentum',
        name: 'Institutional EMA 20/50 Momentum',
        symbol: 'EURUSD',
        timeframe: Timeframe.m5,
        isEnabled: true,
        riskPercent: 1.0,
        stopLossAtrMult: 1.5,
        takeProfitAtrMult: 3.0,
        description:
            'Captures directional breakouts when EMA 20 crosses EMA 50 with RSI confirmation.',
        entryRules: [
          StrategyRule(
              indicator: 'EMA_CROSS', condition: 'CrossAbove', period: 20),
          StrategyRule(indicator: 'RSI', condition: 'LessThan', threshold: 68),
        ],
      ),
      const StrategyDefinition(
        id: 'strat-gold-vwap',
        name: 'Gold Mean-Reversion RSI + BB',
        symbol: 'XAUUSD',
        timeframe: Timeframe.m15,
        isEnabled: true,
        riskPercent: 0.75,
        stopLossAtrMult: 1.8,
        takeProfitAtrMult: 2.8,
        description:
            'Buys oversold dips near lower Bollinger Band on XAUUSD with strict ATR stops.',
        entryRules: [
          StrategyRule(indicator: 'RSI', condition: 'LessThan', threshold: 35),
          StrategyRule(
              indicator: 'BB_LOWER', condition: 'LessThan', period: 20),
        ],
      ),
      const StrategyDefinition(
        id: 'strat-btc-supertrend',
        name: 'BTC Trend Rider (Supertrend + MACD)',
        symbol: 'BTCUSDT',
        timeframe: Timeframe.h1,
        isEnabled: false,
        riskPercent: 0.5,
        stopLossAtrMult: 2.0,
        takeProfitAtrMult: 4.0,
        description:
            'Follows multi-hour crypto momentum aligned with MACD histogram expansion.',
        entryRules: [
          StrategyRule(
              indicator: 'MACD', condition: 'GreaterThan', threshold: 0),
        ],
      ),
    ];
  }

  Future<void> save() async {
    try {
      final payload = {
        'activeProvider': activeProvider,
        'oandaApiKey': oandaApiKey,
        'oandaAccountId': oandaAccountId,
        'oandaIsPractice': oandaIsPractice,
        'twelveDataApiKey': twelveDataApiKey,
        'aiProvider': aiProvider,
        'aiApiKey': aiApiKey,
        'aiEndpoint': aiEndpoint,
        'selectedSymbol': selectedSymbol,
        'selectedTimeframe': selectedTimeframe.code,
        'chartEngine': chartEngine.name,
        'chartType': chartType.name,
        'themeMode': themeMode.name,
        'timezoneOffsetHours': timezoneOffsetHours,
        'timezoneLabel': timezoneLabel,
        'languageCode': languageCode,
        'isNavCollapsed': isNavCollapsed,
        'isWatchlistCollapsed': isWatchlistCollapsed,
        'desktopNotificationsEnabled': desktopNotificationsEnabled,
        'audioChimesEnabled': audioChimesEnabled,
        'feedbackAuthor': feedbackAuthor,
        'feedbackContact': feedbackContact,
        'feedbackLastSentMs': feedbackLastSentMs,
        'account': account.toJson(),
        'risk': risk.toJson(),
        'strategies': strategies.map((e) => e.toJson()).toList(),
        'positions': positions.map((e) => e.toJson()).toList(),
        'auditLogs': auditLogs.take(150).map((e) => e.toJson()).toList(),
        'alerts': alerts.map((e) => e.toJson()).toList(),
        'drawingsBySymbol': drawingsBySymbol.map(
          (k, v) => MapEntry(k, v.map((d) => d.toJson()).toList()),
        ),
      };
      await _stateFile.writeAsString(jsonEncode(payload));
    } catch (_) {
      // ignore write errors
    }
  }

  /// Resets the paper/demo trading account to a fresh starting balance,
  /// clearing open & closed positions, execution logs, and resetting risk state.
  Future<void> resetDemoAccount(double startingBalance) async {
    account = AccountSummary(
      balance: startingBalance,
      equity: startingBalance,
      unrealizedPnl: 0.0,
      dailyRealizedPnl: 0.0,
      currentDrawdownPercent: 0.0,
      currency: account.currency,
    );
    positions = [];
    auditLogs = [];
    risk = risk.copyWith(
      isKillSwitchEngaged: false,
      killSwitchReason: '',
    );
    await save();
  }
}
