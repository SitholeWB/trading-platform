import 'dart:convert';
import 'dart:io';
import 'dart:math' as math;
import 'package:http/http.dart' as http;
import 'package:http/io_client.dart';
import '../models/trading_models.dart';
import 'indicator_engine.dart';
import 'localization_service.dart';
import 'storage_service.dart';
import 'strategy_scanner.dart';
import 'symbol_catalog.dart';

class AiProviderSpec {
  final String id;
  final String label;
  final String defaultModel;
  final String defaultEndpoint;
  final bool requiresKey;
  final bool supportsCustomEndpoint;

  const AiProviderSpec({
    required this.id,
    required this.label,
    required this.defaultModel,
    required this.defaultEndpoint,
    required this.requiresKey,
    this.supportsCustomEndpoint = false,
  });
}

class StrategyCompileResult {
  final StrategyDefinition strategy;
  final String providerUsed;
  final bool usedBuiltInFallback;
  final String? note;

  const StrategyCompileResult({
    required this.strategy,
    required this.providerUsed,
    this.usedBuiltInFallback = false,
    this.note,
  });
}

class CopilotReply {
  final String content;
  final String providerUsed;
  final List<CopilotAction> actions;

  const CopilotReply({
    required this.content,
    required this.providerUsed,
    this.actions = const [],
  });
}

class AiCopilotService {
  static const List<AiProviderSpec> providers = [
    AiProviderSpec(
      id: 'BuiltIn',
      label: 'Built-in Quant',
      defaultModel: 'quant-engine-v2',
      defaultEndpoint: '',
      requiresKey: false,
    ),
    AiProviderSpec(
      id: 'OpenAI',
      label: 'OpenAI',
      defaultModel: 'gpt-4o-mini',
      defaultEndpoint: 'https://api.openai.com/v1',
      requiresKey: true,
    ),
    AiProviderSpec(
      id: 'Anthropic',
      label: 'Anthropic Claude',
      defaultModel: 'claude-3-5-sonnet-latest',
      defaultEndpoint: 'https://api.anthropic.com/v1',
      requiresKey: true,
    ),
    AiProviderSpec(
      id: 'Gemini',
      label: 'Google Gemini',
      defaultModel: 'gemini-3.5-flash',
      defaultEndpoint: 'https://generativelanguage.googleapis.com/v1beta',
      requiresKey: true,
    ),
    AiProviderSpec(
      id: 'Groq',
      label: 'Groq',
      defaultModel: 'llama-3.3-70b-versatile',
      defaultEndpoint: 'https://api.groq.com/openai/v1',
      requiresKey: true,
    ),
    AiProviderSpec(
      id: 'DeepSeek',
      label: 'DeepSeek',
      defaultModel: 'deepseek-chat',
      defaultEndpoint: 'https://api.deepseek.com/v1',
      requiresKey: true,
    ),
    AiProviderSpec(
      id: 'OpenRouter',
      label: 'OpenRouter',
      defaultModel: 'openai/gpt-4o-mini',
      defaultEndpoint: 'https://openrouter.ai/api/v1',
      requiresKey: true,
    ),
    AiProviderSpec(
      id: 'Ollama',
      label: 'Local Ollama',
      defaultModel: 'llama3.2',
      defaultEndpoint: 'http://localhost:11434',
      requiresKey: false,
      supportsCustomEndpoint: true,
    ),
    AiProviderSpec(
      id: 'Custom',
      label: 'Custom OpenAI-Compatible',
      defaultModel: 'local-model',
      defaultEndpoint: 'http://localhost:1234/v1',
      requiresKey: false,
      supportsCustomEndpoint: true,
    ),
  ];

  static AiProviderSpec specFor(String id) {
    return providers.firstWhere(
      (p) => p.id == id,
      orElse: () => providers.first,
    );
  }

  final StorageService storage;
  AiCopilotService(this.storage);

  Future<CopilotReply> ask({
    required String prompt,
    required String symbol,
    required Timeframe timeframe,
    required List<Candle> candles,
    List<ChatMessage> history = const [],
    String? extraContext,
    String languageCode = 'en',
  }) async {
    final baseDiag = _buildTraderContext(symbol, timeframe, candles);
    final langInstr = AppL10n.languagePromptInstruction(languageCode);
    final parts = <String>[
      baseDiag,
      if (langInstr.isNotEmpty) 'LANGUAGE REQUIREMENT:\n$langInstr',
      if (extraContext != null && extraContext.trim().isNotEmpty)
        'SECTION DOCUMENTATION:\n${extraContext.trim()}',
    ];
    final diag = parts.join('\n\n');
    final provider = storage.aiProvider;
    final spec = specFor(provider);
    final model = storage.aiModel.trim().isNotEmpty
        ? storage.aiModel.trim()
        : spec.defaultModel;
    final key = storage.aiApiKey.trim();

    String? rawText;
    String? errorNote;

    if (provider != 'BuiltIn') {
      if (spec.requiresKey && key.isEmpty) {
        errorNote =
            'No API key configured for ${spec.label}. Showing built-in Quant analysis instead.';
      } else {
        try {
          rawText = await _callActiveProvider(
            prompt: prompt,
            context: diag,
            history: history,
          );
        } catch (e) {
          errorNote =
              '${spec.label} request failed ($e). Falling back to Built-in Quant Engine.';
        }
      }
    }

    if (rawText != null && rawText.trim().isNotEmpty) {
      final parsed = _extractCopilotActions(rawText, symbol, timeframe, candles);
      return CopilotReply(
        content: parsed.cleanedText,
        providerUsed: '${spec.label} ($model)',
        actions: parsed.actions,
      );
    }

    final fallback = _builtInQuantReply(
      prompt,
      symbol,
      timeframe,
      candles,
      diag,
      extraContext: extraContext,
    );
    final finalText = errorNote != null ? '> _${errorNote}_\n\n$fallback' : fallback;
    return CopilotReply(
      content: finalText,
      providerUsed: 'Built-in Quant',
      actions: _builtInSuggestedActions(prompt, symbol, timeframe, candles),
    );
  }

  Future<String?> _callActiveProvider({
    required String prompt,
    required String context,
    List<ChatMessage> history = const [],
  }) async {
    final provider = storage.aiProvider;
    final spec = specFor(provider);
    final model = storage.aiModel.trim().isNotEmpty
        ? storage.aiModel.trim()
        : spec.defaultModel;
    final key = storage.aiApiKey.trim();
    return switch (provider) {
      'Anthropic' => _callAnthropic(
          prompt: prompt,
          context: context,
          model: model,
          apiKey: key,
          history: history,
        ),
      'Gemini' => _callGemini(
          prompt: prompt,
          context: context,
          model: model,
          apiKey: key,
          history: history,
        ),
      'Ollama' => _callOllama(
          prompt: prompt,
          context: context,
          model: model,
          endpoint: storage.aiEndpoint.trim().isNotEmpty
              ? storage.aiEndpoint.trim()
              : spec.defaultEndpoint,
          history: history,
        ),
      _ => _callOpenAiCompatible(
          prompt: prompt,
          context: context,
          model: model,
          apiKey: key,
          baseUrl: provider == 'Custom'
              ? (storage.aiEndpoint.trim().isNotEmpty
                  ? storage.aiEndpoint.trim()
                  : spec.defaultEndpoint)
              : spec.defaultEndpoint,
          history: history,
        ),
    };
  }

  static const Set<String> _validIndicators = {
    'EMA_CROSS',
    'SMA_CROSS',
    'EMA_TREND',
    'RSI_OS',
    'RSI_OB',
    'MACD_CROSS',
    'BB_BREAK',
    'SUPERTREND',
    'VWAP_CROSS',
    'ICHIMOKU_BULL',
    'ADX_TREND',
    'SESSION_UTC',
    'DONCHIAN_BREAK',
    'ENGULFING',
    'PIN_BAR',
    'VOLUME_SPIKE',
    'ATR_VOLATILITY',
  };

  static const Set<String> _validConditions = {
    'CrossAbove',
    'CrossBelow',
    'LessThan',
    'GreaterThan',
  };

  Future<StrategyCompileResult> compileStrategyFromText(
    String plainText, {
    String defaultSymbol = 'EURUSD',
    Timeframe defaultTimeframe = Timeframe.h1,
  }) async {
    final provider = storage.aiProvider;
    final spec = specFor(provider);
    final model = storage.aiModel.trim().isNotEmpty
        ? storage.aiModel.trim()
        : spec.defaultModel;
    final key = storage.aiApiKey.trim();

    const schemaContext = '''
You are an institutional quantitative strategy compiler. Convert the trader's plain-English strategy description into ONE strict JSON object (no markdown prose, no explanation outside JSON).
Use nested `rootRuleGroup` whenever the trader expresses combined conditions like "(A AND B) AND (C OR D)".
Schema:
{
  "name": "Short strategy name",
  "description": "1-sentence summary",
  "timeframe": "M1|M5|M15|M30|H1|H4|D1",
  "scanUniverse": "SINGLE|MAJORS|FOREX|METALS|CRYPTO|INDICES|STOCKS|CUSTOM",
  "scanSymbols": ["EURUSD"],
  "directionMode": "LongOnly|ShortOnly|Both",
  "htfTimeframe": "H4",
  "htfIndicator": "EMA_TREND|SUPERTREND|ICHIMOKU_BULL",
  "htfPeriod": 200,
  "riskPercent": 1.0,
  "stopLossAtrMult": 1.5,
  "takeProfitAtrMult": 3.0,
  "breakEvenR": 1.0,
  "trailingAtrMult": 1.5,
  "maxHoldBars": 0,
  "cooldownBarsAfterSl": 3,
  "spreadBps": 1.0,
  "rootRuleGroup": {
    "combinator": "AND",
    "rules": [
      {"indicator": "EMA_TREND", "condition": "GreaterThan", "period": 200, "threshold": 0}
    ],
    "groups": [
      {
        "combinator": "OR",
        "rules": [
          {"indicator": "RSI_OS", "condition": "LessThan", "period": 14, "threshold": 35},
          {"indicator": "ENGULFING", "condition": "GreaterThan", "period": 1, "threshold": 0}
        ]
      }
    ]
  },
  "exitRules": []
}
Supported indicators & meanings:
- EMA_CROSS (fast EMA(period) vs slow EMA(2*period); CrossAbove/CrossBelow/GreaterThan/LessThan)
- SMA_CROSS (fast SMA(period) vs slow SMA(2*period))
- EMA_TREND (Price vs EMA(period), e.g. period=200, GreaterThan=bullish, LessThan=bearish)
- RSI_OS (RSI(period) < threshold, default 30; CrossAbove for bounce out of oversold)
- RSI_OB (RSI(period) > threshold, default 70; CrossBelow for drop out of overbought)
- MACD_CROSS (MACD 12/26/9 vs signal; CrossAbove/CrossBelow/GreaterThan/LessThan)
- BB_BREAK (Bollinger Bands(period, threshold=stdDev e.g. 2.0); GreaterThan=upper break, LessThan=lower break)
- SUPERTREND (Supertrend(period=10, threshold=3.0); CrossAbove/GreaterThan=bull, CrossBelow/LessThan=bear)
- VWAP_CROSS (Price vs VWAP; CrossAbove/GreaterThan=above, CrossBelow/LessThan=below)
- ICHIMOKU_BULL (Ichimoku cloud; GreaterThan=bullish above cloud, LessThan=bearish below cloud)
- ADX_TREND (ADX(period=14) >= threshold e.g. 20 or 25; neutral trend strength filter)
- SESSION_UTC (UTC hour window: threshold=startHour 0..23, period=endHour 0..23, e.g. London 7..16, NY 13..21)
- DONCHIAN_BREAK (N-bar High/Low structure breakout; period=20, GreaterThan=break above N-bar high, LessThan=break below N-bar low)
- ENGULFING (Candlestick engulfing; GreaterThan=bullish engulfing, LessThan=bearish engulfing)
- PIN_BAR (Rejection pin bar; threshold=wick/body ratio e.g. 2.0, GreaterThan=bullish pin, LessThan=bearish pin)
- VOLUME_SPIKE (Volume >= threshold * SMA(period) volume, e.g. period=20, threshold=1.5; neutral filter)
- ATR_VOLATILITY (ATR/Price % filter; GreaterThan >= threshold% e.g. 0.15, LessThan <= threshold%; neutral filter)
Return ONLY valid JSON.''';

    String? errorNote;
    if (provider == 'BuiltIn') {
      errorNote =
          'Built-in keyword compiler used (no external AI provider selected). It cannot understand complex nested AND/OR logic—select Gemini, OpenAI, Anthropic, or Ollama in Settings for full AI compilation.';
    } else if (spec.requiresKey && key.isEmpty) {
      errorNote =
          'No API key configured for ${spec.label}. Fell back to Built-in keyword compiler (limited nested logic). Add your API key in Settings.';
    } else {
      try {
        final raw = await _callActiveProvider(
          prompt: 'Compile this trading strategy into JSON:\n$plainText',
          context: schemaContext,
        );
        if (raw != null && raw.trim().isNotEmpty) {
          final parsed = _parseCompiledStrategyJson(
            raw,
            plainText: plainText,
            defaultSymbol: defaultSymbol,
            defaultTimeframe: defaultTimeframe,
          );
          if (parsed != null) {
            return StrategyCompileResult(
              strategy: parsed,
              providerUsed: '${spec.label} ($model)',
              usedBuiltInFallback: false,
            );
          }
          errorNote =
              '${spec.label} returned unparseable JSON; fell back to Built-in keyword compiler.';
        }
      } catch (e) {
        errorNote =
            '${spec.label} request failed ($e); fell back to Built-in keyword compiler.';
      }
    }

    return StrategyCompileResult(
      strategy: _compileStrategyLocally(
        plainText,
        defaultSymbol: defaultSymbol,
        defaultTimeframe: defaultTimeframe,
      ),
      providerUsed: 'Built-in Keyword Compiler',
      usedBuiltInFallback: true,
      note: errorNote,
    );
  }

  List<StrategyRule> _parseRuleList(List<dynamic>? rawList) {
    final rules = <StrategyRule>[];
    for (final item in rawList ?? const []) {
      if (item is! Map) continue;
      final m = Map<String, dynamic>.from(item);
      final ind = (m['indicator'] as String? ?? '').toUpperCase().trim();
      if (!_validIndicators.contains(ind)) continue;
      final cond = (m['condition'] as String? ?? 'GreaterThan').trim();
      final safeCond = _validConditions.contains(cond) ? cond : 'GreaterThan';
      final period = ((m['period'] as num?)?.toInt() ?? 14).clamp(1, 200);
      final threshold = (m['threshold'] as num?)?.toDouble() ?? 0.0;
      rules.add(StrategyRule(
        indicator: ind,
        condition: safeCond,
        period: period,
        threshold: threshold,
      ));
    }
    return rules;
  }

  StrategyRuleGroup _parseRuleGroupMap(Map<String, dynamic> m) {
    final comb = (m['combinator'] as String? ?? 'AND').toUpperCase() == 'OR'
        ? 'OR'
        : 'AND';
    final rules = _parseRuleList(m['rules'] as List<dynamic>?);
    final childGroups = <StrategyRuleGroup>[];
    for (final g in m['groups'] as List<dynamic>? ?? const []) {
      if (g is Map) {
        final parsed = _parseRuleGroupMap(Map<String, dynamic>.from(g));
        if (!parsed.isEmpty) childGroups.add(parsed);
      }
    }
    return StrategyRuleGroup(
      combinator: comb,
      rules: rules,
      groups: childGroups,
    );
  }

  StrategyDefinition? _parseCompiledStrategyJson(
    String raw, {
    required String plainText,
    required String defaultSymbol,
    required Timeframe defaultTimeframe,
  }) {
    var cleaned = raw.trim();
    final fence = RegExp(r'```(?:json)?\s*([\s\S]*?)```', caseSensitive: false)
        .firstMatch(cleaned);
    if (fence != null) {
      cleaned = fence.group(1)!.trim();
    } else {
      final start = cleaned.indexOf('{');
      final end = cleaned.lastIndexOf('}');
      if (start >= 0 && end > start) {
        cleaned = cleaned.substring(start, end + 1);
      }
    }
    try {
      final map = jsonDecode(cleaned) as Map<String, dynamic>;
      StrategyRuleGroup? rootGroup;
      if (map['rootRuleGroup'] is Map) {
        final parsed = _parseRuleGroupMap(
            Map<String, dynamic>.from(map['rootRuleGroup'] as Map));
        if (!parsed.isEmpty) rootGroup = parsed;
      }
      final flatRules = _parseRuleList(map['rules'] as List<dynamic>?);
      if (rootGroup == null && flatRules.isEmpty) return null;
      rootGroup ??= StrategyRuleGroup(
        combinator: (map['combinator'] as String? ?? 'AND').toUpperCase() == 'OR'
            ? 'OR'
            : 'AND',
        rules: flatRules,
      );
      final exitRules = _parseRuleList(map['exitRules'] as List<dynamic>?);

      final universe =
          (map['scanUniverse'] as String? ?? 'SINGLE').toUpperCase().trim();
      final symbols = (map['scanSymbols'] as List<dynamic>? ?? const [])
          .map((e) => e.toString().trim().toUpperCase())
          .where((s) => s.isNotEmpty)
          .toList();
      final resolvedList = SymbolCatalog.resolveUniverse(
        universe,
        fallbackSymbol: symbols.isNotEmpty ? symbols.first : defaultSymbol,
        customSymbols: symbols,
      );
      final tfCode =
          (map['timeframe'] as String? ?? defaultTimeframe.code).toUpperCase();
      final htfRaw = (map['htfTimeframe'] as String? ?? '').toUpperCase().trim();
      final dirRaw = (map['directionMode'] as String? ?? 'LongOnly').trim();
      final safeDir = (dirRaw == 'Both' ||
              dirRaw == 'ShortOnly' ||
              dirRaw == 'LongOnly')
          ? dirRaw
          : 'LongOnly';
      final htfInd = (map['htfIndicator'] as String? ?? 'EMA_TREND')
          .toUpperCase()
          .trim();

      return StrategyDefinition(
        id: 'strat_${DateTime.now().millisecondsSinceEpoch}',
        name: (map['name'] as String?)?.trim().isNotEmpty == true
            ? (map['name'] as String).trim()
            : 'AI Compiled Strategy',
        symbol: resolvedList.first,
        timeframe: Timeframe.fromCode(tfCode),
        isEnabled: true,
        autoTrade: false,
        combinator: rootGroup.combinator,
        riskPercent: ((map['riskPercent'] as num?)?.toDouble() ?? 1.0)
            .clamp(0.25, 5.0),
        stopLossAtrMult:
            ((map['stopLossAtrMult'] as num?)?.toDouble() ?? 1.5)
                .clamp(0.5, 4.0),
        takeProfitAtrMult:
            ((map['takeProfitAtrMult'] as num?)?.toDouble() ?? 3.0)
                .clamp(1.0, 8.0),
        entryRules: rootGroup.flattenRules(),
        rootRuleGroup: rootGroup,
        exitRules: exitRules,
        directionMode: safeDir,
        htfTimeframe: htfRaw.isNotEmpty ? Timeframe.fromCode(htfRaw) : null,
        htfIndicator: _validIndicators.contains(htfInd) ? htfInd : 'EMA_TREND',
        htfPeriod: ((map['htfPeriod'] as num?)?.toInt() ?? 200).clamp(5, 200),
        breakEvenR:
            ((map['breakEvenR'] as num?)?.toDouble() ?? 0.0).clamp(0.0, 5.0),
        trailingAtrMult:
            ((map['trailingAtrMult'] as num?)?.toDouble() ?? 0.0)
                .clamp(0.0, 6.0),
        maxHoldBars:
            ((map['maxHoldBars'] as num?)?.toInt() ?? 0).clamp(0, 500),
        cooldownBarsAfterSl:
            ((map['cooldownBarsAfterSl'] as num?)?.toInt() ?? 0).clamp(0, 100),
        spreadBps:
            ((map['spreadBps'] as num?)?.toDouble() ?? 1.0).clamp(0.0, 25.0),
        description: (map['description'] as String?)?.trim().isNotEmpty == true
            ? (map['description'] as String).trim()
            : plainText.trim(),
        scanUniverse: universe,
        scanSymbols: symbols,
      );
    } catch (_) {
      return null;
    }
  }

  StrategyDefinition _compileStrategyLocally(
    String plainText, {
    required String defaultSymbol,
    required Timeframe defaultTimeframe,
  }) {
    final lower = plainText.toLowerCase();
    String universe = 'SINGLE';
    if (lower.contains('major')) {
      universe = 'MAJORS';
    } else if (lower.contains('forex') || lower.contains('fx')) {
      universe = 'FOREX';
    } else if (lower.contains('crypto') || lower.contains('btc')) {
      universe = 'CRYPTO';
    } else if (lower.contains('gold') ||
        lower.contains('metal') ||
        lower.contains('oil')) {
      universe = 'METALS';
    } else if (lower.contains('index') || lower.contains('indices')) {
      universe = 'INDICES';
    } else if (lower.contains('stock') || lower.contains('equit')) {
      universe = 'STOCKS';
    }

    Timeframe tf = defaultTimeframe;
    for (final candidate in Timeframe.values) {
      if (RegExp('\\b${candidate.code.toLowerCase()}\\b').hasMatch(lower)) {
        tf = candidate;
        break;
      }
    }

    final rules = <StrategyRule>[];
    if (lower.contains('200 ema') ||
        lower.contains('ema 200') ||
        lower.contains('ema(200)')) {
      rules.add(StrategyRule(
        indicator: 'EMA_TREND',
        condition: lower.contains('below') ||
                lower.contains('short') ||
                lower.contains('sell')
            ? 'LessThan'
            : 'GreaterThan',
        period: 200,
      ));
    }
    if (lower.contains('ema cross') || lower.contains('ema')) {
      if (!rules.any((r) => r.indicator == 'EMA_TREND')) {
        rules.add(StrategyRule(
          indicator: 'EMA_CROSS',
          condition: lower.contains('short') || lower.contains('sell')
              ? 'CrossBelow'
              : 'CrossAbove',
          period: 20,
        ));
      }
    }
    if (lower.contains('rsi')) {
      if (lower.contains('overbought') ||
          lower.contains('70') ||
          lower.contains('sell')) {
        rules.add(const StrategyRule(
          indicator: 'RSI_OB',
          condition: 'GreaterThan',
          period: 14,
          threshold: 70,
        ));
      } else {
        rules.add(const StrategyRule(
          indicator: 'RSI_OS',
          condition: 'LessThan',
          period: 14,
          threshold: 35,
        ));
      }
    }
    if (lower.contains('macd')) {
      rules.add(StrategyRule(
        indicator: 'MACD_CROSS',
        condition: lower.contains('bear') || lower.contains('sell')
            ? 'CrossBelow'
            : 'CrossAbove',
        period: 12,
      ));
    }
    if (lower.contains('supertrend')) {
      rules.add(StrategyRule(
        indicator: 'SUPERTREND',
        condition: lower.contains('sell') ? 'LessThan' : 'GreaterThan',
        period: 10,
        threshold: 3.0,
      ));
    }
    if (lower.contains('adx')) {
      rules.add(const StrategyRule(
        indicator: 'ADX_TREND',
        condition: 'GreaterThan',
        period: 14,
        threshold: 22,
      ));
    }
    if (lower.contains('london')) {
      rules.add(const StrategyRule(
        indicator: 'SESSION_UTC',
        condition: 'GreaterThan',
        period: 16,
        threshold: 7,
      ));
    } else if (lower.contains('new york') || lower.contains('ny session')) {
      rules.add(const StrategyRule(
        indicator: 'SESSION_UTC',
        condition: 'GreaterThan',
        period: 21,
        threshold: 13,
      ));
    }
    if (lower.contains('donchian') || lower.contains('breakout')) {
      rules.add(StrategyRule(
        indicator: 'DONCHIAN_BREAK',
        condition: lower.contains('short') || lower.contains('sell')
            ? 'LessThan'
            : 'GreaterThan',
        period: 20,
      ));
    }
    if (lower.contains('engulf')) {
      rules.add(StrategyRule(
        indicator: 'ENGULFING',
        condition: lower.contains('bear') || lower.contains('sell')
            ? 'LessThan'
            : 'GreaterThan',
        period: 1,
      ));
    }
    if (lower.contains('pin bar') || lower.contains('pinbar')) {
      rules.add(StrategyRule(
        indicator: 'PIN_BAR',
        condition: lower.contains('bear') || lower.contains('sell')
            ? 'LessThan'
            : 'GreaterThan',
        period: 1,
        threshold: 2.0,
      ));
    }
    if (lower.contains('volume')) {
      rules.add(const StrategyRule(
        indicator: 'VOLUME_SPIKE',
        condition: 'GreaterThan',
        period: 20,
        threshold: 1.5,
      ));
    }
    if (rules.isEmpty) {
      rules.addAll(const [
        StrategyRule(indicator: 'EMA_CROSS', condition: 'CrossAbove', period: 20),
        StrategyRule(indicator: 'RSI_OS', condition: 'LessThan', period: 14, threshold: 40),
      ]);
    }
    final resolved =
        SymbolCatalog.resolveUniverse(universe, fallbackSymbol: defaultSymbol);
    final dirMode = lower.contains('both') || lower.contains('bidirectional')
        ? 'Both'
        : (lower.contains('short only') ? 'ShortOnly' : 'LongOnly');
    final htfTf = lower.contains('h4 trend') || lower.contains('h4 filter')
        ? Timeframe.h4
        : (lower.contains('d1 trend') || lower.contains('daily trend')
            ? Timeframe.d1
            : null);
    final comb = lower.contains(' or ') ? 'OR' : 'AND';
    return StrategyDefinition(
      id: 'strat_${DateTime.now().millisecondsSinceEpoch}',
      name: 'Plain-Text Strategy (${tf.code})',
      symbol: resolved.first,
      timeframe: tf,
      isEnabled: true,
      autoTrade: false,
      combinator: comb,
      entryRules: rules,
      rootRuleGroup: StrategyRuleGroup(combinator: comb, rules: rules),
      directionMode: dirMode,
      htfTimeframe: htfTf,
      breakEvenR: lower.contains('break even') || lower.contains('breakeven')
          ? 1.0
          : 0.0,
      trailingAtrMult: lower.contains('trail') ? 1.5 : 0.0,
      description: plainText.trim(),
      scanUniverse: universe,
    );
  }

  Future<String> validateScanHit({
    required StrategyDefinition strategy,
    required StrategyScanHit hit,
    required List<Candle> candles,
  }) async {
    final provider = storage.aiProvider;
    final spec = specFor(provider);
    final key = storage.aiApiKey.trim();

    final recent = candles.length > 25
        ? candles.sublist(candles.length - 25)
        : candles;
    final atrPts = IndicatorEngine.calculateATR(candles, 14, hit.spec.symbol);
    final atr = atrPts.isNotEmpty ? atrPts.last.value : 0.0;
    final digits =
        IndicatorEngine.getSymbolDigits(hit.spec.symbol, samplePrice: hit.price);
    final barsCompact = recent
        .map((c) =>
            '${c.timestamp.toUtc().toIso8601String().substring(11, 16)}:${c.close.toStringAsFixed(digits)}')
        .join(', ');

    final context = '''
Strategy: ${strategy.name} (${strategy.combinator}, TF ${strategy.timeframe.code})
Description: ${strategy.description}
Triggered Symbol: ${hit.spec.symbol} | Signal: ${hit.signal} | Score: ${hit.matchScore.toStringAsFixed(0)}%
Current Price: ${hit.price.toStringAsFixed(digits)} | ATR(14): ${atr.toStringAsFixed(digits)}
Rule Breakdown: ${hit.ruleBreakdown.join(' | ')}
Recent ${recent.length} closes (UTC): $barsCompact
''';

    if (provider != 'BuiltIn' && (!spec.requiresKey || key.isNotEmpty)) {
      try {
        final raw = await _callActiveProvider(
          prompt:
              'Give a concise 2nd-opinion validation of this triggered scanner hit: setup quality (1-10), key invalidation level, and suggested SL/TP using ATR.',
          context: context,
        );
        if (raw != null && raw.trim().isNotEmpty) {
          return raw.trim();
        }
      } catch (_) {}
    }

    final slDist = atr * strategy.stopLossAtrMult;
    final tpDist = atr * strategy.takeProfitAtrMult;
    final isBuy = hit.signal == 'Buy';
    final sl = isBuy ? hit.price - slDist : hit.price + slDist;
    final tp = isBuy ? hit.price + tpDist : hit.price - tpDist;
    return '**Built-in Quant Second Opinion — ${hit.spec.symbol} (${hit.signal})**\n'
        '- **Score:** ${hit.matchScore.toStringAsFixed(0)}% (`${hit.ruleBreakdown.join(' · ')}`)\n'
        '- **Suggested SL (${strategy.stopLossAtrMult}x ATR):** `${sl.toStringAsFixed(digits)}`\n'
        '- **Suggested TP (${strategy.takeProfitAtrMult}x ATR):** `${tp.toStringAsFixed(digits)}`';
  }

  String _systemInstruction(String context) => '''
You are an institutional quantitative trading copilot embedded inside a 100% Demo / Paper Trading Desktop Platform.
You can inspect the trader's live chart context, open positions, risk profile, and active strategies below.
Be concise, concrete, and directly actionable for the trader. Use exact prices, ATR levels, and position sizing math.

If you recommend a concrete trade setup, strategy draft, price alert, or closing a position, you MAY append one or more action blocks at the very end of your response using this exact syntax so the user gets 1-click execution buttons in the UI:
[[ACTION:{"type":"order","label":"Buy 0.10 EURUSD @ Market","side":"Buy","symbol":"EURUSD","lots":0.10,"sl":1.0800,"tp":1.0920}]]
[[ACTION:{"type":"alert","label":"Alert EURUSD >= 1.0900","symbol":"EURUSD","condition":"Above","price":1.0900}]]
[[ACTION:{"type":"strategy","label":"Create RSI + EMA Strategy","name":"AI Momentum","symbol":"EURUSD","timeframe":"M15","combinator":"AND","riskPercent":1.0,"slMult":1.5,"tpMult":3.0,"rules":[{"indicator":"EMA_CROSS","condition":"CrossAbove","period":20,"threshold":0},{"indicator":"RSI_OS","condition":"LessThan","period":14,"threshold":35}]}]]
[[ACTION:{"type":"close_position","label":"Close #12345","ticket":12345}]]
[[ACTION:{"type":"journal","label":"Save Note to Journal","title":"EURUSD Plan","symbol":"EURUSD","timeframe":"M15","tag":"AI Copilot","content":"Key observation..."}]]

Valid rule indicators: EMA_CROSS, SMA_CROSS, EMA_TREND, RSI_OS, RSI_OB, MACD_CROSS, BB_BREAK, SUPERTREND, VWAP_CROSS, ICHIMOKU_BULL, ADX_TREND, SESSION_UTC.
Valid rule conditions: CrossAbove, CrossBelow, LessThan, GreaterThan.

LIVE PLATFORM CONTEXT:
$context
''';

  HttpClient _buildHttpClient() {
    return HttpClient()
      ..connectionTimeout = const Duration(seconds: 15)
      ..connectionFactory = (targetUri, proxyHost, proxyPort) async {
        final host = proxyHost ?? targetUri.host;
        final port = proxyPort ?? targetUri.port;
        List<InternetAddress> v4 = const [];
        try {
          v4 = await InternetAddress.lookup(
            host,
            type: InternetAddressType.IPv4,
          ).timeout(const Duration(seconds: 5));
        } catch (_) {}
        final target = v4.isNotEmpty ? v4.first : host;
        final task = await Socket.startConnect(target, port);
        if (targetUri.scheme == 'https' && proxyHost == null) {
          return ConnectionTask.fromSocket(
            task.socket.then(
              (s) => SecureSocket.secure(s, host: targetUri.host),
            ),
            task.cancel,
          );
        }
        return task;
      };
  }

  Future<http.Response> _getJson(
    Uri uri, {
    required Map<String, String> headers,
    Duration timeout = const Duration(seconds: 15),
  }) async {
    final client = IOClient(_buildHttpClient());
    try {
      return await client.get(uri, headers: headers).timeout(timeout);
    } finally {
      client.close();
    }
  }

  Future<http.Response> _postJson(
    Uri uri, {
    required Map<String, String> headers,
    required Object body,
    Duration timeout = const Duration(seconds: 45),
  }) async {
    final client = IOClient(_buildHttpClient());
    try {
      return await client
          .post(uri, headers: headers, body: jsonEncode(body))
          .timeout(timeout);
    } finally {
      client.close();
    }
  }

  /// Dynamically fetches available model IDs from the selected provider's API.
  Future<List<String>> fetchAvailableModels({
    required String provider,
    required String apiKey,
    required String endpoint,
  }) async {
    if (provider == 'BuiltIn') return const [];
    final spec = specFor(provider);
    final key = apiKey.trim();
    if (spec.requiresKey && key.isEmpty) {
      throw Exception('Enter your ${spec.label} API key first.');
    }

    switch (provider) {
      case 'Gemini':
        final resp = await _getJson(
          Uri.parse('https://generativelanguage.googleapis.com/v1beta/models'),
          headers: {'x-goog-api-key': key},
        );
        if (resp.statusCode < 200 || resp.statusCode >= 300) {
          throw Exception(_extractHttpError(resp));
        }
        final data = jsonDecode(resp.body) as Map<String, dynamic>;
        final models = (data['models'] as List<dynamic>? ?? const [])
            .whereType<Map<String, dynamic>>()
            .where((m) {
              final methods =
                  (m['supportedGenerationMethods'] as List<dynamic>? ?? const [])
                      .cast<String>();
              return methods.contains('generateContent');
            })
            .map((m) => (m['name'] as String? ?? '').replaceFirst('models/', ''))
            .where((n) => n.isNotEmpty)
            .toList();
        return models;

      case 'Anthropic':
        final resp = await _getJson(
          Uri.parse('https://api.anthropic.com/v1/models'),
          headers: {
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
          },
        );
        if (resp.statusCode < 200 || resp.statusCode >= 300) {
          throw Exception(_extractHttpError(resp));
        }
        final data = jsonDecode(resp.body) as Map<String, dynamic>;
        return (data['data'] as List<dynamic>? ?? const [])
            .whereType<Map<String, dynamic>>()
            .map((m) => m['id'] as String? ?? '')
            .where((id) => id.isNotEmpty)
            .toList();

      case 'Ollama':
        final base = (endpoint.trim().isNotEmpty
                ? endpoint.trim()
                : spec.defaultEndpoint)
            .replaceAll(RegExp(r'/+$'), '');
        final resp = await _getJson(Uri.parse('$base/api/tags'), headers: {});
        if (resp.statusCode < 200 || resp.statusCode >= 300) {
          throw Exception(_extractHttpError(resp));
        }
        final data = jsonDecode(resp.body) as Map<String, dynamic>;
        return (data['models'] as List<dynamic>? ?? const [])
            .whereType<Map<String, dynamic>>()
            .map((m) => m['name'] as String? ?? '')
            .where((n) => n.isNotEmpty)
            .toList();

      default:
        final base = (provider == 'Custom' && endpoint.trim().isNotEmpty
                ? endpoint.trim()
                : spec.defaultEndpoint)
            .replaceAll(RegExp(r'/+$'), '');
        final resp = await _getJson(
          Uri.parse('$base/models'),
          headers: {
            if (key.isNotEmpty) 'Authorization': 'Bearer $key',
          },
        );
        if (resp.statusCode < 200 || resp.statusCode >= 300) {
          throw Exception(_extractHttpError(resp));
        }
        final data = jsonDecode(resp.body) as Map<String, dynamic>;
        final list = (data['data'] as List<dynamic>? ?? const [])
            .whereType<Map<String, dynamic>>()
            .map((m) => m['id'] as String? ?? '')
            .where((id) => id.isNotEmpty)
            .toList()
          ..sort();
        return list;
    }
  }

  Future<String> testProvider({
    required String provider,
    required String model,
    required String apiKey,
    required String endpoint,
  }) async {
    if (provider == 'BuiltIn') {
      return 'Built-in Quant Engine is always ready (local, 0ms).';
    }
    final spec = specFor(provider);
    final effModel = model.trim().isNotEmpty ? model.trim() : spec.defaultModel;
    final key = apiKey.trim();
    if (spec.requiresKey && key.isEmpty) {
      throw Exception('API key is required for ${spec.label}.');
    }

    final sw = Stopwatch()..start();
    final reply = switch (provider) {
      'Anthropic' => await _callAnthropic(
          prompt: 'Reply with: OK',
          context: 'Connection test.',
          model: effModel,
          apiKey: key,
          history: const [],
        ),
      'Gemini' => await _callGemini(
          prompt: 'Reply with: OK',
          context: 'Connection test.',
          model: effModel,
          apiKey: key,
          history: const [],
        ),
      'Ollama' => await _callOllama(
          prompt: 'Reply with: OK',
          context: 'Connection test.',
          model: effModel,
          endpoint: endpoint.trim().isNotEmpty
              ? endpoint.trim()
              : spec.defaultEndpoint,
          history: const [],
        ),
      _ => await _callOpenAiCompatible(
          prompt: 'Reply with: OK',
          context: 'Connection test.',
          model: effModel,
          apiKey: key,
          baseUrl: provider == 'Custom'
              ? (endpoint.trim().isNotEmpty
                  ? endpoint.trim()
                  : spec.defaultEndpoint)
              : spec.defaultEndpoint,
          history: const [],
        ),
    };
    sw.stop();
    final text = (reply ?? '').trim();
    return '${spec.label} ($effModel) connected in ${sw.elapsedMilliseconds}ms'
        '${text.isNotEmpty ? ' — "${text.split('\n').first}"' : ''}';
  }

  List<ChatMessage> _recentHistory(List<ChatMessage> history) {
    final filtered = history
        .where((m) => m.role == 'user' || m.role == 'assistant')
        .toList();
    // Drop leading assistant welcome message so conversations always start with user
    while (filtered.isNotEmpty && filtered.first.role != 'user') {
      filtered.removeAt(0);
    }
    if (filtered.length <= 8) return filtered;
    return filtered.sublist(filtered.length - 8);
  }

  String _extractHttpError(http.Response resp) {
    try {
      final body = jsonDecode(resp.body);
      if (body is Map<String, dynamic>) {
        final err = body['error'];
        if (err is Map<String, dynamic> && err['message'] != null) {
          return 'HTTP ${resp.statusCode}: ${err['message']}';
        }
        if (body['message'] != null) {
          return 'HTTP ${resp.statusCode}: ${body['message']}';
        }
      }
    } catch (_) {}
    final snippet = resp.body.trim();
    if (snippet.isNotEmpty) {
      return 'HTTP ${resp.statusCode}: ${snippet.substring(0, math.min(140, snippet.length))}';
    }
    return 'HTTP ${resp.statusCode}';
  }

  Future<String?> _callOpenAiCompatible({
    required String prompt,
    required String context,
    required String model,
    required String apiKey,
    required String baseUrl,
    required List<ChatMessage> history,
  }) async {
    final cleanBase = baseUrl.replaceAll(RegExp(r'/+$'), '');
    final uri = Uri.parse(
      cleanBase.endsWith('/chat/completions')
          ? cleanBase
          : '$cleanBase/chat/completions',
    );
    final recent = _recentHistory(history);
    final messages = <Map<String, String>>[
      {'role': 'system', 'content': _systemInstruction(context)},
      ...recent.map((m) => {'role': m.role, 'content': m.content}),
      {'role': 'user', 'content': prompt},
    ];
    final headers = <String, String>{
      'Content-Type': 'application/json',
      if (apiKey.isNotEmpty) 'Authorization': 'Bearer $apiKey',
    };
    final resp = await _postJson(
      uri,
      headers: headers,
      body: {
        'model': model,
        'messages': messages,
        'max_tokens': 2048,
        'temperature': 0.3,
      },
    );

    if (resp.statusCode < 200 || resp.statusCode >= 300) {
      throw Exception(_extractHttpError(resp));
    }
    final data = jsonDecode(resp.body) as Map<String, dynamic>;
    final choices = data['choices'] as List<dynamic>?;
    if (choices == null || choices.isEmpty) return null;
    final msg = choices.first['message'] as Map<String, dynamic>?;
    return msg?['content'] as String?;
  }

  Future<String?> _callAnthropic({
    required String prompt,
    required String context,
    required String model,
    required String apiKey,
    required List<ChatMessage> history,
  }) async {
    final recent = _recentHistory(history);
    final messages = <Map<String, String>>[
      ...recent.map((m) => {'role': m.role, 'content': m.content}),
      {'role': 'user', 'content': prompt},
    ];
    final resp = await _postJson(
      Uri.parse('https://api.anthropic.com/v1/messages'),
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: {
        'model': model,
        'max_tokens': 2048,
        'system': _systemInstruction(context),
        'messages': messages,
      },
    );

    if (resp.statusCode < 200 || resp.statusCode >= 300) {
      throw Exception(_extractHttpError(resp));
    }
    final data = jsonDecode(resp.body) as Map<String, dynamic>;
    final content = data['content'] as List<dynamic>?;
    if (content == null || content.isEmpty) return null;
    return content.first['text'] as String?;
  }

  Future<String?> _callGemini({
    required String prompt,
    required String context,
    required String model,
    required String apiKey,
    required List<ChatMessage> history,
  }) async {
    try {
      return await _callGeminiOnce(
        prompt: prompt,
        context: context,
        model: model,
        apiKey: apiKey,
        history: history,
        timeout: const Duration(seconds: 25),
      );
    } catch (e) {
      final msg = e.toString();
      final shouldFallback = msg.contains('TimeoutException') ||
          msg.contains('HTTP 404') ||
          msg.contains('NOT_FOUND');
      if (!shouldFallback) rethrow;

      final liveModels = await fetchAvailableModels(
        provider: 'Gemini',
        apiKey: apiKey,
        endpoint: '',
      );
      final preferred = [
        'gemini-3.5-flash',
        'gemini-flash-latest',
        'gemini-3-flash-preview',
        ...liveModels.where((m) => m.contains('flash') && !m.contains('tts') && !m.contains('image')),
      ];
      final fallbackModel = preferred.firstWhere(
        (m) => m != model && liveModels.contains(m),
        orElse: () => liveModels.firstWhere((m) => m != model, orElse: () => ''),
      );
      if (fallbackModel.isEmpty) rethrow;
      return _callGeminiOnce(
        prompt: prompt,
        context: context,
        model: fallbackModel,
        apiKey: apiKey,
        history: history,
        timeout: const Duration(seconds: 30),
      );
    }
  }

  Future<String?> _callGeminiOnce({
    required String prompt,
    required String context,
    required String model,
    required String apiKey,
    required List<ChatMessage> history,
    Duration timeout = const Duration(seconds: 30),
  }) async {
    final uri = Uri.parse(
      'https://generativelanguage.googleapis.com/v1beta/models/$model:generateContent',
    );
    final recent = _recentHistory(history);
    final contents = <Map<String, dynamic>>[
      ...recent.map((m) => {
            'role': m.role == 'assistant' ? 'model' : 'user',
            'parts': [
              {'text': m.content}
            ],
          }),
      {
        'role': 'user',
        'parts': [
          {'text': prompt}
        ],
      },
    ];
    final genConfig = <String, dynamic>{
      'maxOutputTokens': 2048,
      'temperature': 0.3,
      if (model.contains('2.5-flash')) 'thinkingConfig': {'thinkingBudget': 0},
    };
    final resp = await _postJson(
      uri,
      timeout: timeout,
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: {
        'systemInstruction': {
          'parts': [
            {'text': _systemInstruction(context)}
          ],
        },
        'contents': contents,
        'generationConfig': genConfig,
      },
    );

    if (resp.statusCode < 200 || resp.statusCode >= 300) {
      throw Exception(_extractHttpError(resp));
    }
    final data = jsonDecode(resp.body) as Map<String, dynamic>;
    final candidates = data['candidates'] as List<dynamic>?;
    if (candidates == null || candidates.isEmpty) return null;
    final parts = candidates.first['content']?['parts'] as List<dynamic>?;
    if (parts == null || parts.isEmpty) return null;
    final textParts = parts
        .whereType<Map<String, dynamic>>()
        .where((p) => p['thought'] != true && p['text'] is String)
        .map((p) => p['text'] as String)
        .toList();
    return textParts.isNotEmpty
        ? textParts.join('\n').trim()
        : parts.first['text'] as String?;
  }

  Future<String?> _callOllama({
    required String prompt,
    required String context,
    required String model,
    required String endpoint,
    required List<ChatMessage> history,
  }) async {
    final cleanBase = endpoint.replaceAll(RegExp(r'/+$'), '');
    final recent = _recentHistory(history);
    final messages = <Map<String, String>>[
      {'role': 'system', 'content': _systemInstruction(context)},
      ...recent.map((m) => {'role': m.role, 'content': m.content}),
      {'role': 'user', 'content': prompt},
    ];
    final resp = await _postJson(
      Uri.parse('$cleanBase/api/chat'),
      headers: {'Content-Type': 'application/json'},
      body: {
        'model': model,
        'messages': messages,
        'stream': false,
      },
    );

    if (resp.statusCode < 200 || resp.statusCode >= 300) {
      throw Exception(_extractHttpError(resp));
    }
    final data = jsonDecode(resp.body) as Map<String, dynamic>;
    final msg = data['message'] as Map<String, dynamic>?;
    return msg?['content'] as String?;
  }

  String _buildTraderContext(
    String symbol,
    Timeframe tf,
    List<Candle> candles,
  ) {
    final spec = SymbolCatalog.find(symbol);
    final hit = StrategyScanner.analyzeCandles(spec, tf, candles);
    final priceStr = IndicatorEngine.formatPrice(hit.price, symbol);
    final atrStr = IndicatorEngine.formatPrice(hit.atr, symbol);

    final ema20 = IndicatorEngine.calculateEMA(candles, 20, symbol);
    final ema50 = IndicatorEngine.calculateEMA(candles, 50, symbol);
    final macd = IndicatorEngine.calculateMACD(candles, 12, 26, 9);
    final st = IndicatorEngine.calculateSupertrend(candles, 10, 3.0, symbol);
    final bb = IndicatorEngine.calculateBollingerBands(candles, 20, 2.0, symbol);

    final e20Str = ema20.isNotEmpty
        ? IndicatorEngine.formatPrice(ema20.last.value, symbol)
        : 'n/a';
    final e50Str = ema50.isNotEmpty
        ? IndicatorEngine.formatPrice(ema50.last.value, symbol)
        : 'n/a';
    final macdStr = macd.isNotEmpty
        ? 'MACD=${macd.last.macd.toStringAsFixed(5)} Sig=${macd.last.signal.toStringAsFixed(5)}'
        : 'n/a';
    final stStr = st.isNotEmpty
        ? (st.last.direction == 1 ? 'Bullish' : 'Bearish')
        : 'n/a';
    final bbStr = bb.isNotEmpty
        ? '${IndicatorEngine.formatPrice(bb.last.lower, symbol)}..${IndicatorEngine.formatPrice(bb.last.upper, symbol)}'
        : 'n/a';

    final openPos =
        storage.positions.where((p) => p.status == 'Open').toList();
    final posSummary = openPos.isEmpty
        ? 'None'
        : openPos
            .take(8)
            .map((p) =>
                '#${p.ticket} ${p.orderType} ${p.lots} ${p.symbol} @ ${IndicatorEngine.formatPrice(p.entryPrice, p.symbol)} (PnL: ${p.unrealizedPnl >= 0 ? "+" : ""}\$${p.unrealizedPnl.toStringAsFixed(2)}, SL=${p.stopLossPrice ?? "none"}, TP=${p.takeProfitPrice ?? "none"}, Strat=${p.strategyName})')
            .join('\n  - ');

    final stratSummary = storage.strategies.isEmpty
        ? 'None'
        : storage.strategies
            .take(8)
            .map((s) =>
                '${s.name} [${s.symbol} ${s.timeframe.code}] enabled=${s.isEnabled} autoTrade=${s.autoTrade} logic=${s.combinator} rules=${s.entryRules.length}')
            .join('\n  - ');

    final notesSummary = storage.journalEntries.isEmpty
        ? 'None'
        : storage.journalEntries
            .take(6)
            .map((n) =>
                '[${n.symbol.isEmpty ? "General" : n.symbol} · ${n.tag} · ${n.mood}] ${n.title}: ${n.content.replaceAll('\n', ' ')}')
            .join('\n  - ');

    final annotatedTrades = storage.positions
        .where((p) => p.note.isNotEmpty || p.setupTag.isNotEmpty)
        .take(6)
        .map((p) =>
            '#${p.ticket} ${p.symbol} (${p.setupTag.isEmpty ? "untagged" : p.setupTag}, ${p.status}, PnL=${(p.isOpen ? p.unrealizedPnl : p.realizedPnl).toStringAsFixed(2)}): ${p.note}')
        .join('\n  - ');

    return '''
Active Chart: $symbol (${spec.name}) | Timeframe: ${tf.code} | Provider: ${storage.activeProvider}
Price: $priceStr (${hit.changePct >= 0 ? '+' : ''}${hit.changePct.toStringAsFixed(2)}%)
Indicators: Trend=${hit.trend} | RSI(14)=${hit.rsi.toStringAsFixed(1)} | ATR(14)=$atrStr | EMA20=$e20Str | EMA50=$e50Str | Supertrend=$stStr | $macdStr | BB=$bbStr
Quant Score: ${hit.score.toStringAsFixed(0)}/100 (${hit.signal})
Demo Account: Balance=\$${storage.account.balance.toStringAsFixed(2)} | Equity=\$${storage.account.equity.toStringAsFixed(2)} | Unrealized=\$${storage.account.unrealizedPnl.toStringAsFixed(2)} | Daily Realized=\$${storage.account.dailyRealizedPnl.toStringAsFixed(2)} | Drawdown=${storage.account.currentDrawdownPercent.toStringAsFixed(2)}%
Risk Guard: MaxDD=${storage.risk.maxDailyDrawdownPercent}% | MaxRisk/Trade=${storage.risk.maxRiskPerTradePercent}% | MaxPositions=${storage.risk.maxOpenPositions} | KillSwitch=${storage.risk.isKillSwitchEngaged}
Open Positions (${openPos.length}):
  - $posSummary
Configured Strategies (${storage.strategies.length}):
  - $stratSummary
Recent Journal Notes (${storage.journalEntries.length}):
  - $notesSummary
Annotated Trades:
  - ${annotatedTrades.isEmpty ? "None" : annotatedTrades}''';
  }

  ({String cleanedText, List<CopilotAction> actions}) _extractCopilotActions(
    String raw,
    String symbol,
    Timeframe tf,
    List<Candle> candles,
  ) {
    final actions = <CopilotAction>[];
    final regex = RegExp(r'\[\[ACTION:(\{.*?\})\]\]', dotAll: true);
    final cleaned = raw.replaceAllMapped(regex, (m) {
      try {
        final decoded = jsonDecode(m.group(1)!) as Map<String, dynamic>;
        final type = decoded['type'] as String? ?? '';
        final label = decoded['label'] as String? ?? 'Execute Action';
        if (type.isNotEmpty) {
          actions.add(CopilotAction(type: type, label: label, payload: decoded));
        }
      } catch (_) {}
      return '';
    }).trim();

    return (cleanedText: cleaned, actions: actions);
  }

  List<CopilotAction> _builtInSuggestedActions(
    String prompt,
    String symbol,
    Timeframe tf,
    List<Candle> candles,
  ) {
    final spec = SymbolCatalog.find(symbol);
    final hit = StrategyScanner.analyzeCandles(spec, tf, candles);
    final atr = hit.atr > 0 ? hit.atr : hit.price * 0.002;
    final isBull = hit.score >= 50;
    final side = isBull ? 'Buy' : 'Sell';
    final sl = IndicatorEngine.roundDynamic(
      isBull ? hit.price - atr * 1.5 : hit.price + atr * 1.5,
      symbol,
      hit.price,
    );
    final tp = IndicatorEngine.roundDynamic(
      isBull ? hit.price + atr * 3.0 : hit.price - atr * 3.0,
      symbol,
      hit.price,
    );
    final riskDollars =
        storage.account.balance * (storage.risk.maxRiskPerTradePercent / 100.0);
    final pipMult = StrategyScanner.calculatePositionPnl(
      Position(
        ticket: 0,
        symbol: symbol,
        orderType: 'Buy',
        lots: 1.0,
        entryPrice: hit.price,
        currentPrice: hit.price,
        openedAt: DateTime.now().toUtc(),
      ),
      hit.price + atr * 1.5,
    );
    final rawLots = pipMult > 0 ? (riskDollars / pipMult) : 0.10;
    final lots = double.parse(rawLots.clamp(0.01, 5.0).toStringAsFixed(2));

    final actions = <CopilotAction>[
      CopilotAction(
        type: 'order',
        label: '$side $lots $symbol (SL/TP)',
        payload: {
          'type': 'order',
          'side': side,
          'symbol': symbol,
          'lots': lots,
          'sl': sl,
          'tp': tp,
        },
      ),
      CopilotAction(
        type: 'alert',
        label:
            'Alert $symbol ${isBull ? "Above" : "Below"} ${IndicatorEngine.formatPrice(tp, symbol)}',
        payload: {
          'type': 'alert',
          'symbol': symbol,
          'condition': isBull ? 'Above' : 'Below',
          'price': tp,
        },
      ),
    ];

    final lower = prompt.toLowerCase();
    if (lower.contains('strateg') || lower.contains('bot') || lower.contains('rule')) {
      actions.add(CopilotAction(
        type: 'strategy',
        label: 'Save $symbol ${tf.code} Bot Strategy',
        payload: {
          'type': 'strategy',
          'name': 'Copilot $symbol ${tf.code}',
          'symbol': symbol,
          'timeframe': tf.code,
          'combinator': 'AND',
          'riskPercent': storage.risk.maxRiskPerTradePercent,
          'slMult': 1.5,
          'tpMult': 3.0,
          'rules': [
            {
              'indicator': isBull ? 'SUPERTREND' : 'EMA_CROSS',
              'condition': isBull ? 'GreaterThan' : 'CrossBelow',
              'period': isBull ? 10 : 20,
              'threshold': isBull ? 3.0 : 0.0,
            },
            {
              'indicator': isBull ? 'RSI_OS' : 'RSI_OB',
              'condition': isBull ? 'LessThan' : 'GreaterThan',
              'period': 14,
              'threshold': isBull ? 42.0 : 58.0,
            },
          ],
        },
      ));
    }

    return actions;
  }

  String _builtInQuantReply(
    String prompt,
    String symbol,
    Timeframe tf,
    List<Candle> candles,
    String diag, {
    String? extraContext,
  }) {
    if (extraContext != null && extraContext.trim().isNotEmpty) {
      return '${extraContext.trim()}\n\n---\n> _Built-in Quant mode: showing the local section manual. Configure Gemini, OpenAI, Anthropic, or local Ollama in Settings for interactive Q&A._';
    }
    final spec = SymbolCatalog.find(symbol);
    final hit = StrategyScanner.analyzeCandles(spec, tf, candles);
    final atr = hit.atr > 0 ? hit.atr : hit.price * 0.002;
    final slDist = atr * 1.5;
    final tpDist = atr * 3.0;
    final isBull = hit.score >= 50;
    final sl = isBull ? hit.price - slDist : hit.price + slDist;
    final tp = isBull ? hit.price + tpDist : hit.price - tpDist;
    final lower = prompt.toLowerCase();

    final openPos = storage.positions.where((p) => p.status == 'Open').toList();
    if (lower.contains('position') || lower.contains('risk') || lower.contains('portfolio')) {
      final totalUnrealized =
          openPos.fold<double>(0.0, (s, p) => s + p.unrealizedPnl);
      return '''**Portfolio & Risk Review**
- **Account**: Balance `\$${storage.account.balance.toStringAsFixed(2)}` · Equity `\$${storage.account.equity.toStringAsFixed(2)}` · Open Positions: `${openPos.length}/${storage.risk.maxOpenPositions}`
- **Floating PnL**: `${totalUnrealized >= 0 ? "+" : "-"}\$${totalUnrealized.abs().toStringAsFixed(2)}` · Drawdown `${storage.account.currentDrawdownPercent.toStringAsFixed(2)}%` (Limit `${storage.risk.maxDailyDrawdownPercent}%`)
- **Active Risk Per Trade**: `${storage.risk.maxRiskPerTradePercent.toStringAsFixed(2)}%` (`\$${(storage.account.balance * storage.risk.maxRiskPerTradePercent / 100).toStringAsFixed(2)}` max risk)

${openPos.isEmpty ? '_No open positions currently exposed._' : openPos.map((p) => '- **${p.symbol}** ${p.orderType} `${p.lots}` lots (${p.strategyName}): `${p.unrealizedPnl >= 0 ? "+" : "-"}\$${p.unrealizedPnl.abs().toStringAsFixed(2)}`').join('\n')}''';
    }

    final riskAmt =
        storage.account.balance * (storage.risk.maxRiskPerTradePercent / 100.0);
    final riskPerLot = StrategyScanner.calculatePositionPnl(
      Position(
        ticket: 0,
        symbol: symbol,
        orderType: 'Buy',
        lots: 1.0,
        entryPrice: hit.price,
        currentPrice: hit.price,
        openedAt: DateTime.now().toUtc(),
      ),
      hit.price + slDist,
    ).abs();
    final recLots = riskPerLot > 0
        ? (riskAmt / riskPerLot).clamp(0.01, 5.0)
        : math.max(0.01, 0.10);

    return '''**Quant Diagnostics — $symbol (${tf.code})**
- **Price**: `${IndicatorEngine.formatPrice(hit.price, symbol)}` (${hit.changePct >= 0 ? '+' : ''}${hit.changePct.toStringAsFixed(2)}%)
- **Regime**: `${hit.trend}` · **RSI(14)**: `${hit.rsi.toStringAsFixed(1)}` · **Score**: `${hit.score.toStringAsFixed(0)}/100` (**${hit.signal}**)
- **ATR(14)**: `${IndicatorEngine.formatPrice(atr, symbol)}`

**Actionable Trade Plan (2.0R):**
- **Direction**: `${isBull ? 'BUY / Long' : 'SELL / Short'}`
- **Position Size** (${storage.risk.maxRiskPerTradePercent.toStringAsFixed(2)}% risk = `\$${riskAmt.toStringAsFixed(2)}`): `${recLots.toStringAsFixed(2)} lots`
- **Stop Loss (1.5x ATR)**: `${IndicatorEngine.formatPrice(sl, symbol)}`
- **Take Profit (3.0x ATR)**: `${IndicatorEngine.formatPrice(tp, symbol)}`

_Tip: Connect OpenAI, Claude, Gemini, Groq, DeepSeek, OpenRouter, or local Ollama in **Settings** for full conversational LLM reasoning with 1-click trade & strategy actions._''';
  }
}
