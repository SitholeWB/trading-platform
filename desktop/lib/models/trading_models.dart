import 'dart:ui';

enum Timeframe {
  m1('M1', '1m', 60),
  m5('M5', '5m', 300),
  m15('M15', '15m', 900),
  m30('M30', '30m', 1800),
  h1('H1', '1h', 3600),
  h4('H4', '4h', 14400),
  d1('D1', '1d', 86400),
  w1('W1', '1wk', 604800);

  final String code;
  final String label;
  final int seconds;
  const Timeframe(this.code, this.label, this.seconds);

  static Timeframe fromCode(String code) {
    return Timeframe.values.firstWhere(
      (e) => e.code.toUpperCase() == code.toUpperCase(),
      orElse: () => Timeframe.m5,
    );
  }
}

enum ChartType {
  candlestick('Candles', 'Candle'),
  bar('OHLC Bars', 'Bars'),
  line('Line', 'Line'),
  area('Area', 'Area'),
  baseline('Baseline', 'Base'),
  heikinAshi('Heikin Ashi', 'HA');

  final String label;
  final String shortLabel;
  const ChartType(this.label, this.shortLabel);
}

enum ChartEngineMode { native, tradingview }

enum ChartLayoutMode { single, splitV, splitH, grid4 }

enum DrawingTool {
  cursor('Cursor'),
  trendline('Trendline'),
  hline('Horizontal Line'),
  ray('Ray'),
  fibonacci('Fib Retracement'),
  rectangle('Rectangle'),
  text('Text Note');

  final String label;
  const DrawingTool(this.label);
}

enum AssetCategory {
  all('All'),
  indices('Indices'),
  commodities('Commodities'),
  forex('Forex'),
  crypto('Crypto'),
  stocks('Stocks');

  final String label;
  const AssetCategory(this.label);
}

class SymbolSpec {
  final String symbol;
  final String name;
  final AssetCategory category;
  final String yahooTicker;
  final String tradingViewTicker;
  final double defaultBaseline;

  const SymbolSpec({
    required this.symbol,
    required this.name,
    required this.category,
    required this.yahooTicker,
    required this.tradingViewTicker,
    required this.defaultBaseline,
  });
}

class Candle {
  final DateTime timestamp;
  final double open;
  final double high;
  final double low;
  final double close;
  final double volume;
  final bool isComplete;

  const Candle({
    required this.timestamp,
    required this.open,
    required this.high,
    required this.low,
    required this.close,
    this.volume = 0,
    this.isComplete = true,
  });

  int get timeSeconds => timestamp.toUtc().millisecondsSinceEpoch ~/ 1000;

  Map<String, dynamic> toJson() => {
        'timestamp': timestamp.toUtc().toIso8601String(),
        'open': open,
        'high': high,
        'low': low,
        'close': close,
        'volume': volume,
        'isComplete': isComplete,
      };

  factory Candle.fromJson(Map<String, dynamic> json) => Candle(
        timestamp: DateTime.parse(json['timestamp'] as String).toUtc(),
        open: (json['open'] as num).toDouble(),
        high: (json['high'] as num).toDouble(),
        low: (json['low'] as num).toDouble(),
        close: (json['close'] as num).toDouble(),
        volume: (json['volume'] as num?)?.toDouble() ?? 0,
        isComplete: json['isComplete'] as bool? ?? true,
      );
}

class MarketQuote {
  final String symbol;
  final double price;
  final double changePct;
  final double changeAbs;
  final int decimals;
  final DateTime updatedAt;

  const MarketQuote({
    required this.symbol,
    required this.price,
    required this.changePct,
    required this.changeAbs,
    required this.decimals,
    required this.updatedAt,
  });

  bool get isPositive => changePct >= 0;
}

class AccountSummary {
  final double balance;
  final double equity;
  final double unrealizedPnl;
  final double dailyRealizedPnl;
  final double currentDrawdownPercent;
  final String currency;

  const AccountSummary({
    required this.balance,
    required this.equity,
    required this.unrealizedPnl,
    required this.dailyRealizedPnl,
    required this.currentDrawdownPercent,
    this.currency = 'USD',
  });

  AccountSummary copyWith({
    double? balance,
    double? equity,
    double? unrealizedPnl,
    double? dailyRealizedPnl,
    double? currentDrawdownPercent,
  }) =>
      AccountSummary(
        balance: balance ?? this.balance,
        equity: equity ?? this.equity,
        unrealizedPnl: unrealizedPnl ?? this.unrealizedPnl,
        dailyRealizedPnl: dailyRealizedPnl ?? this.dailyRealizedPnl,
        currentDrawdownPercent:
            currentDrawdownPercent ?? this.currentDrawdownPercent,
        currency: currency,
      );

  Map<String, dynamic> toJson() => {
        'balance': balance,
        'equity': equity,
        'unrealizedPnl': unrealizedPnl,
        'dailyRealizedPnl': dailyRealizedPnl,
        'currentDrawdownPercent': currentDrawdownPercent,
        'currency': currency,
      };

  factory AccountSummary.fromJson(Map<String, dynamic> json) => AccountSummary(
        balance: (json['balance'] as num?)?.toDouble() ?? 100000.0,
        equity: (json['equity'] as num?)?.toDouble() ?? 100000.0,
        unrealizedPnl: (json['unrealizedPnl'] as num?)?.toDouble() ?? 0.0,
        dailyRealizedPnl: (json['dailyRealizedPnl'] as num?)?.toDouble() ?? 0.0,
        currentDrawdownPercent:
            (json['currentDrawdownPercent'] as num?)?.toDouble() ?? 0.0,
        currency: json['currency'] as String? ?? 'USD',
      );
}

class RiskProfile {
  final double maxDailyDrawdownPercent;
  final double maxRiskPerTradePercent;
  final int maxOpenPositions;
  final bool isKillSwitchEngaged;
  final String? killSwitchReason;

  const RiskProfile({
    this.maxDailyDrawdownPercent = 5.0,
    this.maxRiskPerTradePercent = 1.0,
    this.maxOpenPositions = 10,
    this.isKillSwitchEngaged = false,
    this.killSwitchReason,
  });

  RiskProfile copyWith({
    double? maxDailyDrawdownPercent,
    double? maxRiskPerTradePercent,
    int? maxOpenPositions,
    bool? isKillSwitchEngaged,
    String? killSwitchReason,
  }) =>
      RiskProfile(
        maxDailyDrawdownPercent:
            maxDailyDrawdownPercent ?? this.maxDailyDrawdownPercent,
        maxRiskPerTradePercent:
            maxRiskPerTradePercent ?? this.maxRiskPerTradePercent,
        maxOpenPositions: maxOpenPositions ?? this.maxOpenPositions,
        isKillSwitchEngaged: isKillSwitchEngaged ?? this.isKillSwitchEngaged,
        killSwitchReason: killSwitchReason ?? this.killSwitchReason,
      );

  Map<String, dynamic> toJson() => {
        'maxDailyDrawdownPercent': maxDailyDrawdownPercent,
        'maxRiskPerTradePercent': maxRiskPerTradePercent,
        'maxOpenPositions': maxOpenPositions,
        'isKillSwitchEngaged': isKillSwitchEngaged,
        'killSwitchReason': killSwitchReason,
      };

  factory RiskProfile.fromJson(Map<String, dynamic> json) => RiskProfile(
        maxDailyDrawdownPercent:
            (json['maxDailyDrawdownPercent'] as num?)?.toDouble() ?? 5.0,
        maxRiskPerTradePercent:
            (json['maxRiskPerTradePercent'] as num?)?.toDouble() ?? 1.0,
        maxOpenPositions: json['maxOpenPositions'] as int? ?? 10,
        isKillSwitchEngaged: json['isKillSwitchEngaged'] as bool? ?? false,
        killSwitchReason: json['killSwitchReason'] as String?,
      );
}

class Position {
  final int ticket;
  final String symbol;
  final String orderType; // 'Buy' or 'Sell'
  final double lots;
  final double entryPrice;
  final double currentPrice;
  final double? stopLossPrice;
  final double? takeProfitPrice;
  final double unrealizedPnl;
  final double realizedPnl;
  final String status; // 'Open' or 'Closed'
  final DateTime openedAt;
  final DateTime? closedAt;
  final String strategyName;
  final String note;
  final String setupTag;
  final int? rating;

  const Position({
    required this.ticket,
    required this.symbol,
    required this.orderType,
    required this.lots,
    required this.entryPrice,
    required this.currentPrice,
    this.stopLossPrice,
    this.takeProfitPrice,
    this.unrealizedPnl = 0,
    this.realizedPnl = 0,
    this.status = 'Open',
    required this.openedAt,
    this.closedAt,
    this.strategyName = 'Manual',
    this.note = '',
    this.setupTag = '',
    this.rating,
  });

  bool get isBuy => orderType.toLowerCase() == 'buy';
  bool get isOpen => status.toLowerCase() == 'open';

  Position copyWith({
    double? currentPrice,
    double? stopLossPrice,
    double? takeProfitPrice,
    double? unrealizedPnl,
    double? realizedPnl,
    String? status,
    DateTime? closedAt,
    String? note,
    String? setupTag,
    int? rating,
  }) =>
      Position(
        ticket: ticket,
        symbol: symbol,
        orderType: orderType,
        lots: lots,
        entryPrice: entryPrice,
        currentPrice: currentPrice ?? this.currentPrice,
        stopLossPrice: stopLossPrice ?? this.stopLossPrice,
        takeProfitPrice: takeProfitPrice ?? this.takeProfitPrice,
        unrealizedPnl: unrealizedPnl ?? this.unrealizedPnl,
        realizedPnl: realizedPnl ?? this.realizedPnl,
        status: status ?? this.status,
        openedAt: openedAt,
        closedAt: closedAt ?? this.closedAt,
        strategyName: strategyName,
        note: note ?? this.note,
        setupTag: setupTag ?? this.setupTag,
        rating: rating ?? this.rating,
      );

  Map<String, dynamic> toJson() => {
        'ticket': ticket,
        'symbol': symbol,
        'orderType': orderType,
        'lots': lots,
        'entryPrice': entryPrice,
        'currentPrice': currentPrice,
        'stopLossPrice': stopLossPrice,
        'takeProfitPrice': takeProfitPrice,
        'unrealizedPnl': unrealizedPnl,
        'realizedPnl': realizedPnl,
        'status': status,
        'openedAt': openedAt.toUtc().toIso8601String(),
        'closedAt': closedAt?.toUtc().toIso8601String(),
        'strategyName': strategyName,
        'note': note,
        'setupTag': setupTag,
        'rating': rating,
      };

  factory Position.fromJson(Map<String, dynamic> json) => Position(
        ticket: json['ticket'] as int,
        symbol: json['symbol'] as String,
        orderType: json['orderType'] as String,
        lots: (json['lots'] as num).toDouble(),
        entryPrice: (json['entryPrice'] as num).toDouble(),
        currentPrice: (json['currentPrice'] as num).toDouble(),
        stopLossPrice: (json['stopLossPrice'] as num?)?.toDouble(),
        takeProfitPrice: (json['takeProfitPrice'] as num?)?.toDouble(),
        unrealizedPnl: (json['unrealizedPnl'] as num?)?.toDouble() ?? 0,
        realizedPnl: (json['realizedPnl'] as num?)?.toDouble() ?? 0,
        status: json['status'] as String? ?? 'Open',
        openedAt: DateTime.parse(json['openedAt'] as String).toUtc(),
        closedAt: json['closedAt'] != null
            ? DateTime.parse(json['closedAt'] as String).toUtc()
            : null,
        strategyName: json['strategyName'] as String? ?? 'Manual',
        note: json['note'] as String? ?? '',
        setupTag: json['setupTag'] as String? ?? '',
        rating: json['rating'] as int?,
      );
}

class StrategyRule {
  final String indicator; // EMA_CROSS, RSI_OS, RSI_OB, MACD_CROSS, BB_BREAK
  final String condition; // CrossAbove, CrossBelow, LessThan, GreaterThan
  final double threshold;
  final int period;

  const StrategyRule({
    required this.indicator,
    required this.condition,
    this.threshold = 0,
    this.period = 14,
  });

  Map<String, dynamic> toJson() => {
        'indicator': indicator,
        'condition': condition,
        'threshold': threshold,
        'period': period,
      };

  factory StrategyRule.fromJson(Map<String, dynamic> json) => StrategyRule(
        indicator: json['indicator'] as String,
        condition: json['condition'] as String,
        threshold: (json['threshold'] as num?)?.toDouble() ?? 0,
        period: json['period'] as int? ?? 14,
      );
}

class StrategyDefinition {
  final String id;
  final String name;
  final String symbol;
  final Timeframe timeframe;
  final bool isEnabled;
  final bool autoTrade;
  final String combinator;
  final double riskPercent;
  final double stopLossAtrMult;
  final double takeProfitAtrMult;
  final List<StrategyRule> entryRules;
  final String description;

  const StrategyDefinition({
    required this.id,
    required this.name,
    required this.symbol,
    required this.timeframe,
    this.isEnabled = true,
    this.autoTrade = true,
    this.combinator = 'AND',
    this.riskPercent = 1.0,
    this.stopLossAtrMult = 1.5,
    this.takeProfitAtrMult = 3.0,
    this.entryRules = const [],
    this.description = '',
  });

  StrategyDefinition copyWith({
    String? name,
    String? symbol,
    Timeframe? timeframe,
    bool? isEnabled,
    bool? autoTrade,
    String? combinator,
    double? riskPercent,
    double? stopLossAtrMult,
    double? takeProfitAtrMult,
    List<StrategyRule>? entryRules,
    String? description,
  }) =>
      StrategyDefinition(
        id: id,
        name: name ?? this.name,
        symbol: symbol ?? this.symbol,
        timeframe: timeframe ?? this.timeframe,
        isEnabled: isEnabled ?? this.isEnabled,
        autoTrade: autoTrade ?? this.autoTrade,
        combinator: combinator ?? this.combinator,
        riskPercent: riskPercent ?? this.riskPercent,
        stopLossAtrMult: stopLossAtrMult ?? this.stopLossAtrMult,
        takeProfitAtrMult: takeProfitAtrMult ?? this.takeProfitAtrMult,
        entryRules: entryRules ?? this.entryRules,
        description: description ?? this.description,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'symbol': symbol,
        'timeframe': timeframe.code,
        'isEnabled': isEnabled,
        'autoTrade': autoTrade,
        'combinator': combinator,
        'riskPercent': riskPercent,
        'stopLossAtrMult': stopLossAtrMult,
        'takeProfitAtrMult': takeProfitAtrMult,
        'entryRules': entryRules.map((e) => e.toJson()).toList(),
        'description': description,
      };

  factory StrategyDefinition.fromJson(Map<String, dynamic> json) =>
      StrategyDefinition(
        id: json['id'] as String,
        name: json['name'] as String,
        symbol: json['symbol'] as String,
        timeframe: Timeframe.fromCode(json['timeframe'] as String? ?? 'M5'),
        isEnabled: json['isEnabled'] as bool? ?? true,
        autoTrade: json['autoTrade'] as bool? ?? true,
        combinator: json['combinator'] as String? ?? 'AND',
        riskPercent: (json['riskPercent'] as num?)?.toDouble() ?? 1.0,
        stopLossAtrMult: (json['stopLossAtrMult'] as num?)?.toDouble() ?? 1.5,
        takeProfitAtrMult:
            (json['takeProfitAtrMult'] as num?)?.toDouble() ?? 3.0,
        entryRules: (json['entryRules'] as List<dynamic>? ?? [])
            .map((e) => StrategyRule.fromJson(e as Map<String, dynamic>))
            .toList(),
        description: json['description'] as String? ?? '',
      );
}

class SignalAuditLog {
  final String id;
  final DateTime timestamp;
  final String symbol;
  final Timeframe timeframe;
  final String strategyName;
  final String outcome; // 'Executed', 'NearMiss', 'Rejected'
  final String direction; // 'Buy', 'Sell', 'Neutral'
  final double matchScore; // 0..100
  final double price;
  final String reason;

  const SignalAuditLog({
    required this.id,
    required this.timestamp,
    required this.symbol,
    required this.timeframe,
    required this.strategyName,
    required this.outcome,
    required this.direction,
    required this.matchScore,
    required this.price,
    required this.reason,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'timestamp': timestamp.toUtc().toIso8601String(),
        'symbol': symbol,
        'timeframe': timeframe.code,
        'strategyName': strategyName,
        'outcome': outcome,
        'direction': direction,
        'matchScore': matchScore,
        'price': price,
        'reason': reason,
      };

  factory SignalAuditLog.fromJson(Map<String, dynamic> json) => SignalAuditLog(
        id: json['id'] as String,
        timestamp: DateTime.parse(json['timestamp'] as String).toUtc(),
        symbol: json['symbol'] as String,
        timeframe: Timeframe.fromCode(json['timeframe'] as String? ?? 'M5'),
        strategyName: json['strategyName'] as String,
        outcome: json['outcome'] as String,
        direction: json['direction'] as String,
        matchScore: (json['matchScore'] as num).toDouble(),
        price: (json['price'] as num).toDouble(),
        reason: json['reason'] as String,
      );
}

class PriceAlert {
  final String id;
  final String symbol;
  final double targetPrice;
  final String condition; // 'Above' or 'Below'
  final String label;
  final bool triggered;
  final DateTime createdAt;

  const PriceAlert({
    required this.id,
    required this.symbol,
    required this.targetPrice,
    required this.condition,
    this.label = '',
    this.triggered = false,
    required this.createdAt,
  });

  PriceAlert copyWith({bool? triggered}) => PriceAlert(
        id: id,
        symbol: symbol,
        targetPrice: targetPrice,
        condition: condition,
        label: label,
        triggered: triggered ?? this.triggered,
        createdAt: createdAt,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'symbol': symbol,
        'targetPrice': targetPrice,
        'condition': condition,
        'label': label,
        'triggered': triggered,
        'createdAt': createdAt.toUtc().toIso8601String(),
      };

  factory PriceAlert.fromJson(Map<String, dynamic> json) => PriceAlert(
        id: json['id'] as String,
        symbol: json['symbol'] as String,
        targetPrice: (json['targetPrice'] as num).toDouble(),
        condition: json['condition'] as String,
        label: json['label'] as String? ?? '',
        triggered: json['triggered'] as bool? ?? false,
        createdAt: DateTime.parse(json['createdAt'] as String).toUtc(),
      );
}

class DrawingPoint {
  final int timeSeconds;
  final double price;
  const DrawingPoint({required this.timeSeconds, required this.price});

  Map<String, dynamic> toJson() => {
        'timeSeconds': timeSeconds,
        'price': price,
      };

  factory DrawingPoint.fromJson(Map<String, dynamic> json) => DrawingPoint(
        timeSeconds: json['timeSeconds'] as int,
        price: (json['price'] as num).toDouble(),
      );
}

class DrawingItem {
  final String id;
  final DrawingTool tool;
  final List<DrawingPoint> points;
  final int colorValue;
  final String? text;

  const DrawingItem({
    required this.id,
    required this.tool,
    required this.points,
    this.colorValue = 0xFF38BDF8,
    this.text,
  });

  Color get color => Color(colorValue);

  Map<String, dynamic> toJson() => {
        'id': id,
        'tool': tool.name,
        'points': points.map((p) => p.toJson()).toList(),
        'colorValue': colorValue,
        'text': text,
      };

  factory DrawingItem.fromJson(Map<String, dynamic> json) => DrawingItem(
        id: json['id'] as String,
        tool: DrawingTool.values.firstWhere(
          (e) => e.name == json['tool'],
          orElse: () => DrawingTool.trendline,
        ),
        points: (json['points'] as List<dynamic>)
            .map((p) => DrawingPoint.fromJson(p as Map<String, dynamic>))
            .toList(),
        colorValue: json['colorValue'] as int? ?? 0xFF38BDF8,
        text: json['text'] as String?,
      );
}

class IndicatorSettings {
  final bool ema20;
  final bool ema50;
  final bool ema200;
  final bool sma20;
  final bool bollinger;
  final bool vwap;
  final bool supertrend;
  final bool ichimoku;
  final bool volume;
  final bool rsi;
  final bool macd;
  final int rsiPeriod;
  final int macdFast;
  final int macdSlow;
  final int macdSignal;
  final int bbPeriod;
  final double bbStdDev;

  const IndicatorSettings({
    this.ema20 = true,
    this.ema50 = true,
    this.ema200 = false,
    this.sma20 = false,
    this.bollinger = false,
    this.vwap = false,
    this.supertrend = false,
    this.ichimoku = false,
    this.volume = true,
    this.rsi = false,
    this.macd = false,
    this.rsiPeriod = 14,
    this.macdFast = 12,
    this.macdSlow = 26,
    this.macdSignal = 9,
    this.bbPeriod = 20,
    this.bbStdDev = 2.0,
  });

  IndicatorSettings copyWith({
    bool? ema20,
    bool? ema50,
    bool? ema200,
    bool? sma20,
    bool? bollinger,
    bool? vwap,
    bool? supertrend,
    bool? ichimoku,
    bool? volume,
    bool? rsi,
    bool? macd,
    int? rsiPeriod,
    int? macdFast,
    int? macdSlow,
    int? macdSignal,
    int? bbPeriod,
    double? bbStdDev,
  }) =>
      IndicatorSettings(
        ema20: ema20 ?? this.ema20,
        ema50: ema50 ?? this.ema50,
        ema200: ema200 ?? this.ema200,
        sma20: sma20 ?? this.sma20,
        bollinger: bollinger ?? this.bollinger,
        vwap: vwap ?? this.vwap,
        supertrend: supertrend ?? this.supertrend,
        ichimoku: ichimoku ?? this.ichimoku,
        volume: volume ?? this.volume,
        rsi: rsi ?? this.rsi,
        macd: macd ?? this.macd,
        rsiPeriod: rsiPeriod ?? this.rsiPeriod,
        macdFast: macdFast ?? this.macdFast,
        macdSlow: macdSlow ?? this.macdSlow,
        macdSignal: macdSignal ?? this.macdSignal,
        bbPeriod: bbPeriod ?? this.bbPeriod,
        bbStdDev: bbStdDev ?? this.bbStdDev,
      );
}

class JournalEntry {
  final String id;
  final String title;
  final String content;
  final String symbol;
  final Timeframe timeframe;
  final String tag; // e.g. 'Pre-Market', 'Trade Review', 'Breakout', 'AI Copilot', 'Lesson'
  final String mood; // 'Disciplined', 'Focused', 'Uncertain', 'FOMO'
  final int? linkedTicket;
  final double? priceAtNote;
  final DateTime createdAt;
  final DateTime updatedAt;

  const JournalEntry({
    required this.id,
    required this.title,
    required this.content,
    this.symbol = '',
    this.timeframe = Timeframe.m15,
    this.tag = 'General',
    this.mood = 'Disciplined',
    this.linkedTicket,
    this.priceAtNote,
    required this.createdAt,
    required this.updatedAt,
  });

  JournalEntry copyWith({
    String? title,
    String? content,
    String? symbol,
    Timeframe? timeframe,
    String? tag,
    String? mood,
    int? linkedTicket,
    double? priceAtNote,
    DateTime? updatedAt,
  }) =>
      JournalEntry(
        id: id,
        title: title ?? this.title,
        content: content ?? this.content,
        symbol: symbol ?? this.symbol,
        timeframe: timeframe ?? this.timeframe,
        tag: tag ?? this.tag,
        mood: mood ?? this.mood,
        linkedTicket: linkedTicket ?? this.linkedTicket,
        priceAtNote: priceAtNote ?? this.priceAtNote,
        createdAt: createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'content': content,
        'symbol': symbol,
        'timeframe': timeframe.code,
        'tag': tag,
        'mood': mood,
        'linkedTicket': linkedTicket,
        'priceAtNote': priceAtNote,
        'createdAt': createdAt.toUtc().toIso8601String(),
        'updatedAt': updatedAt.toUtc().toIso8601String(),
      };

  factory JournalEntry.fromJson(Map<String, dynamic> json) => JournalEntry(
        id: json['id'] as String,
        title: json['title'] as String? ?? 'Untitled Note',
        content: json['content'] as String? ?? '',
        symbol: json['symbol'] as String? ?? '',
        timeframe: Timeframe.fromCode(json['timeframe'] as String? ?? 'M15'),
        tag: json['tag'] as String? ?? 'General',
        mood: json['mood'] as String? ?? 'Disciplined',
        linkedTicket: json['linkedTicket'] as int?,
        priceAtNote: (json['priceAtNote'] as num?)?.toDouble(),
        createdAt: DateTime.parse(json['createdAt'] as String).toUtc(),
        updatedAt: DateTime.parse(json['updatedAt'] as String).toUtc(),
      );
}

class CopilotAction {
  final String type; // 'order' | 'strategy' | 'alert' | 'close_position' | 'journal'
  final String label;
  final Map<String, dynamic> payload;

  const CopilotAction({
    required this.type,
    required this.label,
    required this.payload,
  });

  Map<String, dynamic> toJson() => {
        'type': type,
        'label': label,
        'payload': payload,
      };

  factory CopilotAction.fromJson(Map<String, dynamic> json) => CopilotAction(
        type: json['type'] as String? ?? '',
        label: json['label'] as String? ?? 'Execute',
        payload: (json['payload'] as Map<String, dynamic>?) ?? const {},
      );
}

class ChatMessage {
  final String role; // 'user' or 'assistant'
  final String content;
  final DateTime timestamp;
  final String? providerUsed;
  final List<CopilotAction> actions;

  const ChatMessage({
    required this.role,
    required this.content,
    required this.timestamp,
    this.providerUsed,
    this.actions = const [],
  });

  Map<String, dynamic> toJson() => {
        'role': role,
        'content': content,
        'timestamp': timestamp.toUtc().toIso8601String(),
        'providerUsed': providerUsed,
        'actions': actions.map((a) => a.toJson()).toList(),
      };

  factory ChatMessage.fromJson(Map<String, dynamic> json) => ChatMessage(
        role: json['role'] as String? ?? 'assistant',
        content: json['content'] as String? ?? '',
        timestamp: json['timestamp'] != null
            ? DateTime.parse(json['timestamp'] as String).toUtc()
            : DateTime.now().toUtc(),
        providerUsed: json['providerUsed'] as String?,
        actions: (json['actions'] as List<dynamic>? ?? const [])
            .whereType<Map<String, dynamic>>()
            .map(CopilotAction.fromJson)
            .toList(),
      );
}

class CopilotSession {
  final String id;
  final String title;
  final String symbol;
  final Timeframe timeframe;
  final List<ChatMessage> messages;
  final DateTime createdAt;
  final DateTime updatedAt;

  const CopilotSession({
    required this.id,
    required this.title,
    required this.symbol,
    required this.timeframe,
    required this.messages,
    required this.createdAt,
    required this.updatedAt,
  });

  CopilotSession copyWith({
    String? title,
    String? symbol,
    Timeframe? timeframe,
    List<ChatMessage>? messages,
    DateTime? updatedAt,
  }) =>
      CopilotSession(
        id: id,
        title: title ?? this.title,
        symbol: symbol ?? this.symbol,
        timeframe: timeframe ?? this.timeframe,
        messages: messages ?? this.messages,
        createdAt: createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'symbol': symbol,
        'timeframe': timeframe.code,
        'messages': messages.map((m) => m.toJson()).toList(),
        'createdAt': createdAt.toUtc().toIso8601String(),
        'updatedAt': updatedAt.toUtc().toIso8601String(),
      };

  factory CopilotSession.fromJson(Map<String, dynamic> json) => CopilotSession(
        id: json['id'] as String,
        title: json['title'] as String? ?? 'Copilot Session',
        symbol: json['symbol'] as String? ?? 'EURUSD',
        timeframe: Timeframe.fromCode(json['timeframe'] as String? ?? 'M15'),
        messages: (json['messages'] as List<dynamic>? ?? const [])
            .whereType<Map<String, dynamic>>()
            .map(ChatMessage.fromJson)
            .toList(),
        createdAt: json['createdAt'] != null
            ? DateTime.parse(json['createdAt'] as String).toUtc()
            : DateTime.now().toUtc(),
        updatedAt: json['updatedAt'] != null
            ? DateTime.parse(json['updatedAt'] as String).toUtc()
            : DateTime.now().toUtc(),
      );
}

class ScannerHit {
  final SymbolSpec spec;
  final Timeframe timeframe;
  final double price;
  final double changePct;
  final double rsi;
  final String trend; // 'Bullish', 'Bearish', 'Ranging'
  final String signal; // 'Strong Buy', 'Buy', 'Neutral', 'Sell', 'Strong Sell'
  final double score;
  final double atr;

  const ScannerHit({
    required this.spec,
    required this.timeframe,
    required this.price,
    required this.changePct,
    required this.rsi,
    required this.trend,
    required this.signal,
    required this.score,
    required this.atr,
  });
}
