import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/trading_models.dart';
import '../services/ai_copilot_service.dart';
import '../services/indicator_engine.dart';
import '../services/market_data_service.dart';
import '../services/notification_service.dart';
import '../services/storage_service.dart';
import '../services/strategy_scanner.dart';
import '../services/symbol_catalog.dart';
import 'dialogs/about_dialog.dart';
import 'dialogs/ai_copilot_drawer.dart';
import 'dialogs/alerts_dialog.dart';
import 'dialogs/broker_settings_dialog.dart';
import 'dialogs/feedback_dialog.dart';
import 'dialogs/language_dialog.dart';
import 'dialogs/shortcuts_dialog.dart';
import 'dialogs/symbol_search_dialog.dart';
import 'dialogs/timezone_dialog.dart';
import 'pages/audit_radar_page.dart';
import 'pages/dashboard_page.dart';
import 'pages/documentation_page.dart';
import 'pages/journal_page.dart';
import 'pages/live_chart_page.dart';
import 'pages/market_scanner_page.dart';
import 'pages/positions_page.dart';
import 'pages/simulator_page.dart';
import 'pages/strategy_studio_page.dart';

enum AppPage {
  dashboard('Dashboard', Icons.dashboard_outlined),
  scanner('Market Scanner', Icons.radar),
  strategies('Strategies', Icons.bolt),
  radar('Audit Radar', Icons.track_changes),
  positions('Positions', Icons.work_outline),
  journal('Journal', Icons.edit_note),
  sandbox('Simulator', Icons.science_outlined),
  chart('Live Chart', Icons.candlestick_chart),
  docs('Documentation', Icons.menu_book_outlined);

  final String title;
  final IconData icon;
  const AppPage(this.title, this.icon);
}

class AppShell extends StatefulWidget {
  final StorageService storage;
  final MarketDataService marketData;
  final NotificationService notifications;
  final AiCopilotService copilot;
  final VoidCallback onThemeChanged;

  const AppShell({
    super.key,
    required this.storage,
    required this.marketData,
    required this.notifications,
    required this.copilot,
    required this.onThemeChanged,
  });

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  AppPage _activePage = AppPage.dashboard;
  List<Candle> _candles = [];
  Map<String, MarketQuote> _watchlistQuotes = {};
  bool _isSyncing = false;
  int _secondsUntilSync = 60;
  bool _isCopilotOpen = false;
  bool _isCopilotExpanded = false;
  String _timezoneIana = 'Etc/UTC';
  String _languageCode = 'en';
  Timer? _tickTimer;

  void _openTimezoneDialog() {
    showDialog<void>(
      context: context,
      builder: (_) => TimezoneSelectorDialog(
        currentTimezone: _timezoneIana,
        onSelect: (iana) {
          final match = kFinancialTimezones.firstWhere(
            (t) => t.iana == iana,
            orElse: () => kFinancialTimezones.first,
          );
          setState(() {
            _timezoneIana = iana;
            widget.storage.timezoneOffsetHours = (match.offsetMinutes / 60).round();
            widget.storage.timezoneLabel = match.city.split(' ').first;
          });
          widget.storage.save();
        },
      ),
    );
  }

  void _openLanguageDialog() {
    showDialog<void>(
      context: context,
      builder: (_) => LanguageSelectorDialog(
        currentLanguage: _languageCode,
        onSelect: (code) => setState(() => _languageCode = code),
      ),
    );
  }

  void _openShortcutsDialog() {
    showDialog<void>(
      context: context,
      builder: (_) => const ShortcutsDialog(),
    );
  }

  @override
  void initState() {
    super.initState();
    _loadInitialData();
    _tickTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      if (_secondsUntilSync <= 1) {
        _secondsUntilSync = 60;
        _refreshMarketData(force: true);
      } else {
        setState(() => _secondsUntilSync--);
      }
    });
  }

  @override
  void dispose() {
    _tickTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadInitialData() async {
    await _refreshMarketData(force: false);
    final quotes = await widget.marketData.fetchWatchlistQuotes(
      SymbolCatalog.allSymbols.take(16).map((s) => s.symbol).toList(),
    );
    if (!mounted) return;
    setState(() => _watchlistQuotes = quotes);
  }

  Future<void> _refreshMarketData({bool force = false}) async {
    if (_isSyncing) return;
    setState(() => _isSyncing = true);

    final res = await widget.marketData.fetchCandles(
      widget.storage.selectedSymbol,
      widget.storage.selectedTimeframe,
      forceRefresh: force,
    );

    if (!mounted) return;
    _candles = res.candles;
    _recalculatePositionsAndAlerts();
    if (force) {
      await _runAutonomousBotCycle();
    }

    if (!mounted) return;
    setState(() {
      _isSyncing = false;
      if (force) _secondsUntilSync = 60;
    });
  }

  Future<void> _runAutonomousBotCycle() async {
    if (widget.storage.risk.isKillSwitchEngaged) return;
    final enabled =
        widget.storage.strategies.where((s) => s.isEnabled).toList();
    if (enabled.isEmpty) return;

    for (final s in enabled) {
      final res = await widget.marketData.fetchCandles(
        s.symbol,
        s.timeframe,
      );
      if (res.candles.length < 30) continue;
      final log = StrategyScanner.evaluateStrategyOnCandles(s, res.candles);
      widget.storage.auditLogs = [log, ...widget.storage.auditLogs.take(149)];

      if (s.autoTrade &&
          log.outcome == 'Executed' &&
          (log.direction == 'Buy' || log.direction == 'Sell')) {
        final alreadyOpen = widget.storage.positions.any((p) =>
            p.status == 'Open' &&
            p.symbol.toUpperCase() == s.symbol.toUpperCase() &&
            p.strategyName == s.name);
        if (!alreadyOpen) {
          final lastC = res.candles.last;
          final atrPts =
              IndicatorEngine.calculateATR(res.candles, 14, s.symbol);
          final atr = atrPts.isNotEmpty
              ? atrPts.last.value
              : (lastC.close * 0.002);
          final safeAtr = atr > 0 ? atr : (lastC.close * 0.002);
          final isBuy = log.direction == 'Buy';
          final sl = IndicatorEngine.roundDynamic(
            isBuy
                ? lastC.close - safeAtr * s.stopLossAtrMult
                : lastC.close + safeAtr * s.stopLossAtrMult,
            s.symbol,
            lastC.close,
          );
          final tp = IndicatorEngine.roundDynamic(
            isBuy
                ? lastC.close + safeAtr * s.takeProfitAtrMult
                : lastC.close - safeAtr * s.takeProfitAtrMult,
            s.symbol,
            lastC.close,
          );
          final riskCap = widget.storage.risk.maxRiskPerTradePercent;
          final effRisk = s.riskPercent.clamp(0.1, riskCap > 0 ? riskCap : 5.0);
          final lots = (effRisk * 0.1).clamp(0.01, 5.0);

          await _placeOrder(
            log.direction,
            s.symbol,
            lots,
            lastC.close,
            sl: sl,
            tp: tp,
            strategyName: s.name,
          );
        }
      }
    }
    await widget.storage.save();
  }

  void _recalculatePositionsAndAlerts() {
    final currentPrice = _candles.isNotEmpty ? _candles.last.close : 0.0;
    if (currentPrice <= 0 && _watchlistQuotes.isEmpty) return;

    final lastCandle = _candles.isNotEmpty ? _candles.last : null;
    double totalUnrealized = 0;
    double newlyRealized = 0;
    final updatedPositions = <Position>[];

    for (final p in widget.storage.positions) {
      if (p.status != 'Open') {
        updatedPositions.add(p);
        continue;
      }

      final isSelectedSym = p.symbol.toUpperCase() ==
          widget.storage.selectedSymbol.toUpperCase();
      final quotePrice = _watchlistQuotes[p.symbol]?.price;
      final markPrice = isSelectedSym && currentPrice > 0
          ? currentPrice
          : (quotePrice != null && quotePrice > 0
              ? quotePrice
              : p.currentPrice);
      final barHigh = isSelectedSym && lastCandle != null
          ? lastCandle.high
          : markPrice;
      final barLow = isSelectedSym && lastCandle != null
          ? lastCandle.low
          : markPrice;

      String? hitReason;
      double exitPrice = markPrice;
      if (p.isBuy) {
        if (p.stopLossPrice != null && barLow <= p.stopLossPrice!) {
          exitPrice = p.stopLossPrice!;
          hitReason = 'Stop Loss';
        } else if (p.takeProfitPrice != null && barHigh >= p.takeProfitPrice!) {
          exitPrice = p.takeProfitPrice!;
          hitReason = 'Take Profit';
        }
      } else {
        if (p.stopLossPrice != null && barHigh >= p.stopLossPrice!) {
          exitPrice = p.stopLossPrice!;
          hitReason = 'Stop Loss';
        } else if (p.takeProfitPrice != null && barLow <= p.takeProfitPrice!) {
          exitPrice = p.takeProfitPrice!;
          hitReason = 'Take Profit';
        }
      }

      if (hitReason != null) {
        final pnl = StrategyScanner.calculatePositionPnl(p, exitPrice);
        newlyRealized += pnl;
        updatedPositions.add(p.copyWith(
          currentPrice: exitPrice,
          unrealizedPnl: 0,
          realizedPnl: pnl,
          status: 'Closed',
          closedAt: DateTime.now().toUtc(),
        ));
        if (widget.storage.desktopNotificationsEnabled) {
          widget.notifications.sendDesktopNotification(
            title: '$hitReason Hit · ${p.symbol}',
            body:
                '${p.orderType} ${p.lots.toStringAsFixed(2)} lots closed @ ${IndicatorEngine.formatPrice(exitPrice, p.symbol)} (${pnl >= 0 ? "+" : "-"}\$${pnl.abs().toStringAsFixed(2)})',
            urgent: true,
          );
        }
      } else {
        final pnl = StrategyScanner.calculatePositionPnl(p, markPrice);
        totalUnrealized += pnl;
        updatedPositions.add(
            p.copyWith(currentPrice: markPrice, unrealizedPnl: pnl));
      }
    }

    widget.storage.positions = updatedPositions;
    final newBalance = widget.storage.account.balance + newlyRealized;
    final newDailyRealized =
        widget.storage.account.dailyRealizedPnl + newlyRealized;
    final newEquity = newBalance + totalUnrealized;
    final dd = newBalance > 0
        ? ((newBalance - newEquity) / newBalance * 100).clamp(0.0, 100.0)
        : 0.0;
    widget.storage.account = widget.storage.account.copyWith(
      balance: newBalance,
      dailyRealizedPnl: newDailyRealized,
      equity: newEquity,
      unrealizedPnl: totalUnrealized,
      currentDrawdownPercent: dd,
    );

    if (!widget.storage.risk.isKillSwitchEngaged &&
        dd >= widget.storage.risk.maxDailyDrawdownPercent) {
      widget.storage.risk = widget.storage.risk.copyWith(
        isKillSwitchEngaged: true,
        killSwitchReason:
            'Auto-triggered: Daily drawdown ${dd.toStringAsFixed(2)}% reached limit ${widget.storage.risk.maxDailyDrawdownPercent.toStringAsFixed(1)}%',
      );
      if (widget.storage.desktopNotificationsEnabled) {
        widget.notifications.sendDesktopNotification(
          title: 'Emergency Kill Switch Engaged',
          body:
              'Daily drawdown (${dd.toStringAsFixed(2)}%) exceeded limit (${widget.storage.risk.maxDailyDrawdownPercent.toStringAsFixed(1)}%).',
          urgent: true,
        );
      }
    }

    // Check price alerts
    for (int i = 0; i < widget.storage.alerts.length; i++) {
      final a = widget.storage.alerts[i];
      if (a.triggered ||
          a.symbol.toUpperCase() !=
              widget.storage.selectedSymbol.toUpperCase()) {
        continue;
      }
      final hit = (a.condition == 'Above' && currentPrice >= a.targetPrice) ||
          (a.condition == 'Below' && currentPrice <= a.targetPrice);
      if (hit) {
        widget.storage.alerts[i] = a.copyWith(triggered: true);
        if (widget.storage.desktopNotificationsEnabled) {
          widget.notifications.sendDesktopNotification(
            title: 'Price Alert: ${a.symbol}',
            body:
                '${a.symbol} reached ${IndicatorEngine.formatPrice(currentPrice, a.symbol)}',
            urgent: true,
          );
        }
      }
    }
  }

  Future<void> _placeOrder(
    String side,
    String symbol,
    double lots,
    double price, {
    double? sl,
    double? tp,
    String strategyName = 'Manual',
  }) async {
    if (widget.storage.risk.isKillSwitchEngaged) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Order blocked: Emergency Kill Switch is engaged!'),
          ),
        );
      }
      return;
    }

    final openCount =
        widget.storage.positions.where((p) => p.status == 'Open').length;
    if (openCount >= widget.storage.risk.maxOpenPositions) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Order blocked: Max open positions (${widget.storage.risk.maxOpenPositions}) reached.',
            ),
          ),
        );
      }
      return;
    }

    final ticket = DateTime.now().millisecondsSinceEpoch % 1000000;
    final pos = Position(
      ticket: ticket,
      symbol: symbol,
      orderType: side,
      lots: lots,
      entryPrice: price,
      currentPrice: price,
      stopLossPrice: sl,
      takeProfitPrice: tp,
      openedAt: DateTime.now().toUtc(),
      strategyName: strategyName,
    );
    widget.storage.positions = [pos, ...widget.storage.positions];
    await widget.storage.save();
    if (!mounted) return;
    setState(() {});
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          '$side ${lots.toStringAsFixed(2)} $symbol @ ${IndicatorEngine.formatPrice(price, symbol)} ($strategyName)',
        ),
      ),
    );
  }

  Future<void> _closePosition(int ticket) async {
    final idx =
        widget.storage.positions.indexWhere((p) => p.ticket == ticket);
    if (idx < 0) return;
    final p = widget.storage.positions[idx];
    final pnl = StrategyScanner.calculatePositionPnl(p, p.currentPrice);
    widget.storage.positions[idx] = p.copyWith(
      status: 'Closed',
      realizedPnl: pnl,
      closedAt: DateTime.now().toUtc(),
    );
    final newBalance = widget.storage.account.balance + pnl;
    final newDaily = widget.storage.account.dailyRealizedPnl + pnl;
    widget.storage.account = widget.storage.account.copyWith(
      balance: newBalance,
      dailyRealizedPnl: newDaily,
      equity: newBalance,
    );
    _recalculatePositionsAndAlerts();
    await widget.storage.save();
    setState(() {});
  }

  Future<void> _executeCopilotAction(CopilotAction action) async {
    final p = action.payload;
    switch (action.type) {
      case 'order':
        final side = p['side'] as String? ?? 'Buy';
        final sym = p['symbol'] as String? ?? widget.storage.selectedSymbol;
        final lots = ((p['lots'] as num?)?.toDouble() ?? 0.10).clamp(0.01, 20.0);
        final sl = (p['sl'] as num?)?.toDouble();
        final tp = (p['tp'] as num?)?.toDouble();
        double price = _watchlistQuotes[sym]?.price ?? 0.0;
        if (sym.toUpperCase() == widget.storage.selectedSymbol.toUpperCase() &&
            _candles.isNotEmpty) {
          price = _candles.last.close;
        }
        if (price <= 0) {
          final res = await widget.marketData.fetchCandles(
            sym,
            widget.storage.selectedTimeframe,
            count: 20,
          );
          if (res.candles.isNotEmpty) {
            price = res.candles.last.close;
          } else {
            price = SymbolCatalog.find(sym).defaultBaseline;
          }
        }
        await _placeOrder(
          side,
          sym,
          lots,
          price,
          sl: sl,
          tp: tp,
          strategyName: 'AI Copilot',
        );
        break;

      case 'alert':
        final sym = p['symbol'] as String? ?? widget.storage.selectedSymbol;
        final cond = p['condition'] as String? ?? 'Above';
        final target = (p['price'] as num?)?.toDouble() ??
            (_candles.isNotEmpty ? _candles.last.close : 0.0);
        if (target > 0) {
          widget.storage.alerts.add(PriceAlert(
            id: 'alert_${DateTime.now().millisecondsSinceEpoch}',
            symbol: sym,
            condition: cond,
            targetPrice: target,
            createdAt: DateTime.now().toUtc(),
          ));
          await widget.storage.save();
          if (mounted) {
            setState(() {});
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  'Alert added: $sym $cond ${IndicatorEngine.formatPrice(target, sym)}',
                ),
              ),
            );
          }
        }
        break;

      case 'strategy':
        final sym = p['symbol'] as String? ?? widget.storage.selectedSymbol;
        final tfCode = p['timeframe'] as String? ?? widget.storage.selectedTimeframe.code;
        final tf = Timeframe.fromCode(tfCode);
        final rawRules = (p['rules'] as List<dynamic>?) ?? const [];
        final rules = rawRules
            .whereType<Map<String, dynamic>>()
            .map((r) => StrategyRule.fromJson(r))
            .toList();
        final strat = StrategyDefinition(
          id: 'strat_ai_${DateTime.now().millisecondsSinceEpoch}',
          name: p['name'] as String? ?? 'Copilot $sym ${tf.code}',
          description: 'Generated by AI Quant Copilot',
          symbol: sym,
          timeframe: tf,
          isEnabled: true,
          autoTrade: true,
          combinator: (p['combinator'] as String?) == 'OR' ? 'OR' : 'AND',
          riskPercent: ((p['riskPercent'] as num?)?.toDouble() ?? 1.0).clamp(0.25, 5.0),
          stopLossAtrMult: ((p['slMult'] as num?)?.toDouble() ?? 1.5).clamp(0.5, 4.0),
          takeProfitAtrMult: ((p['tpMult'] as num?)?.toDouble() ?? 3.0).clamp(1.0, 8.0),
          entryRules: rules.isNotEmpty
              ? rules
              : const [
                  StrategyRule(
                    indicator: 'RSI_OS',
                    condition: 'LessThan',
                    threshold: 35,
                    period: 14,
                  ),
                ],
        );
        widget.storage.strategies.add(strat);
        await widget.storage.save();
        if (mounted) {
          setState(() => _activePage = AppPage.strategies);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Saved strategy "${strat.name}"')),
          );
        }
        break;

      case 'close_position':
        final ticket = (p['ticket'] as num?)?.toInt();
        if (ticket != null) {
          await _closePosition(ticket);
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Closed position #$ticket')),
            );
          }
        }
        break;

      case 'journal':
        final now = DateTime.now().toUtc();
        final sym = p['symbol'] as String? ?? widget.storage.selectedSymbol;
        final tf = Timeframe.fromCode(
          p['timeframe'] as String? ?? widget.storage.selectedTimeframe.code,
        );
        final entry = JournalEntry(
          id: 'note_${now.millisecondsSinceEpoch}',
          title: p['title'] as String? ?? '$sym ${tf.code} · Copilot Note',
          content: p['content'] as String? ?? '',
          symbol: sym,
          timeframe: tf,
          tag: p['tag'] as String? ?? 'AI Copilot',
          priceAtNote: _candles.isNotEmpty ? _candles.last.close : null,
          createdAt: now,
          updatedAt: now,
        );
        await _saveJournalEntry(entry);
        break;
    }
  }

  Future<void> _saveJournalEntry(JournalEntry entry) async {
    final idx =
        widget.storage.journalEntries.indexWhere((e) => e.id == entry.id);
    if (idx >= 0) {
      widget.storage.journalEntries[idx] = entry;
    } else {
      widget.storage.journalEntries = [entry, ...widget.storage.journalEntries];
    }
    await widget.storage.save();
    if (!mounted) return;
    setState(() {});
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Saved journal note "${entry.title}"')),
    );
  }

  Future<void> _updatePositionNote(
    int ticket,
    String note,
    String setupTag,
    int? rating,
  ) async {
    final idx =
        widget.storage.positions.indexWhere((p) => p.ticket == ticket);
    if (idx < 0) return;
    widget.storage.positions[idx] = widget.storage.positions[idx].copyWith(
      note: note,
      setupTag: setupTag,
      rating: rating,
    );
    await widget.storage.save();
    if (mounted) setState(() {});
  }

  Future<void> _openSymbolSearch() async {
    final picked = await showDialog<String>(
      context: context,
      builder: (_) =>
          SymbolSearchDialog(selectedSymbol: widget.storage.selectedSymbol),
    );
    if (picked != null && picked != widget.storage.selectedSymbol) {
      widget.storage.selectedSymbol = picked;
      await widget.storage.save();
      await _refreshMarketData(force: false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentPrice = _candles.isNotEmpty
        ? _candles.last.close
        : SymbolCatalog.find(widget.storage.selectedSymbol).defaultBaseline;
    final openPositionsCount =
        widget.storage.positions.where((p) => p.status == 'Open').length;

    return CallbackShortcuts(
      bindings: {
        const SingleActivator(LogicalKeyboardKey.keyK, control: true):
            _openSymbolSearch,
        const SingleActivator(LogicalKeyboardKey.slash, control: true):
            _openShortcutsDialog,
      },
      child: Focus(
        autofocus: true,
        child: Scaffold(
      body: Stack(
        children: [
          Row(
            children: [
              _buildNavigationSidebar(context, openPositionsCount),
              Expanded(
                child: Column(
                  children: [
                    _buildTopHeader(context, openPositionsCount),
                    Expanded(
                      child: Row(
                        children: [
                          if (!(_isCopilotOpen && _isCopilotExpanded))
                            Expanded(child: _buildActivePage(currentPrice)),
                          if (_isCopilotOpen)
                            if (_isCopilotExpanded)
                              Expanded(
                                child: AiCopilotDrawer(
                                  copilot: widget.copilot,
                                  symbol: widget.storage.selectedSymbol,
                                  timeframe: widget.storage.selectedTimeframe,
                                  candles: _candles,
                                  isExpanded: true,
                                  onToggleExpand: () => setState(
                                      () => _isCopilotExpanded = false),
                                  onClose: () => setState(() {
                                    _isCopilotOpen = false;
                                    _isCopilotExpanded = false;
                                  }),
                                  onOpenSettings: () => showDialog(
                                    context: context,
                                    builder: (_) => BrokerSettingsDialog(
                                      storage: widget.storage,
                                      onSaved: () {
                                        widget.onThemeChanged();
                                        setState(() {});
                                      },
                                    ),
                                  ),
                                  onExecuteAction: _executeCopilotAction,
                                  onSaveToJournal: (title, content) async {
                                    final now = DateTime.now().toUtc();
                                    await _saveJournalEntry(JournalEntry(
                                      id: 'note_${now.millisecondsSinceEpoch}',
                                      title: title,
                                      content: content,
                                      symbol: widget.storage.selectedSymbol,
                                      timeframe:
                                          widget.storage.selectedTimeframe,
                                      tag: 'AI Copilot',
                                      priceAtNote: _candles.isNotEmpty
                                          ? _candles.last.close
                                          : null,
                                      createdAt: now,
                                      updatedAt: now,
                                    ));
                                  },
                                ),
                              )
                            else
                              AiCopilotDrawer(
                                copilot: widget.copilot,
                                symbol: widget.storage.selectedSymbol,
                                timeframe: widget.storage.selectedTimeframe,
                                candles: _candles,
                                isExpanded: false,
                                onToggleExpand: () =>
                                    setState(() => _isCopilotExpanded = true),
                                onClose: () =>
                                    setState(() => _isCopilotOpen = false),
                                onOpenSettings: () => showDialog(
                                  context: context,
                                  builder: (_) => BrokerSettingsDialog(
                                    storage: widget.storage,
                                    onSaved: () {
                                      widget.onThemeChanged();
                                      setState(() {});
                                    },
                                  ),
                                ),
                                onExecuteAction: _executeCopilotAction,
                                onSaveToJournal: (title, content) async {
                                  final now = DateTime.now().toUtc();
                                  await _saveJournalEntry(JournalEntry(
                                    id: 'note_${now.millisecondsSinceEpoch}',
                                    title: title,
                                    content: content,
                                    symbol: widget.storage.selectedSymbol,
                                    timeframe: widget.storage.selectedTimeframe,
                                    tag: 'AI Copilot',
                                    priceAtNote: _candles.isNotEmpty
                                        ? _candles.last.close
                                        : null,
                                    createdAt: now,
                                    updatedAt: now,
                                  ));
                                },
                              ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (!_isCopilotOpen)
            Positioned(
              right: 20,
              bottom: 20,
              child: FloatingActionButton.extended(
                onPressed: () => setState(() => _isCopilotOpen = true),
                icon: const Icon(Icons.auto_awesome),
                label: const Text('AI Copilot'),
              ),
            ),
        ],
      ),
        ),
      ),
    );
  }

  Widget _buildNavigationSidebar(BuildContext context, int openCount) {
    final collapsed = widget.storage.isNavCollapsed;
    final navPages = AppPage.values.where((p) => p != AppPage.docs).toList();

    return AnimatedContainer(
      duration: const Duration(milliseconds: 160),
      width: collapsed ? 64 : 210,
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border(
          right: BorderSide(color: Theme.of(context).dividerColor),
        ),
      ),
      child: Column(
        children: [
          Container(
            height: 54,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              border: Border(
                bottom: BorderSide(color: Theme.of(context).dividerColor),
              ),
            ),
            child: Row(
              children: [
                InkWell(
                  onTap: () => showDialog(
                    context: context,
                    builder: (_) => AboutPlatformDialog(
                      activeProvider: widget.storage.activeProvider,
                    ),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.asset('assets/icon.png', width: 32, height: 32),
                  ),
                ),
                if (!collapsed) ...[
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Text(
                      'Trading\nPlatform',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 12.5,
                        height: 1.15,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(8),
              children: navPages.map((page) {
                final active = _activePage == page;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Tooltip(
                    message: collapsed ? page.title : '',
                    child: ListTile(
                      dense: true,
                      selected: active,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      leading: Icon(page.icon, size: 19),
                      title: collapsed
                          ? null
                          : Text(page.title,
                              style: const TextStyle(fontSize: 12.5)),
                      trailing: !collapsed &&
                              page == AppPage.positions &&
                              openCount > 0
                          ? CircleAvatar(
                              radius: 10,
                              child: Text('$openCount',
                                  style: const TextStyle(fontSize: 10)),
                            )
                          : null,
                      onTap: () => setState(() => _activePage = page),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const Divider(height: 1),
          Padding(
            padding: const EdgeInsets.all(8),
            child: Column(
              children: [
                ListTile(
                  dense: true,
                  selected: _activePage == AppPage.docs,
                  leading: const Icon(Icons.menu_book_outlined, size: 18),
                  title: collapsed
                      ? null
                      : const Text('Docs', style: TextStyle(fontSize: 12.5)),
                  onTap: () => setState(() => _activePage = AppPage.docs),
                ),
                ListTile(
                  dense: true,
                  leading: const Icon(Icons.feedback_outlined, size: 18),
                  title: collapsed
                      ? null
                      : const Text('Feedback',
                          style: TextStyle(fontSize: 12.5)),
                  onTap: () => showDialog(
                    context: context,
                    builder: (_) => FeedbackDialog(
                      storage: widget.storage,
                      activeProvider: widget.storage.activeProvider,
                    ),
                  ),
                ),
                ListTile(
                  dense: true,
                  leading: const Icon(Icons.settings_outlined, size: 18),
                  title: collapsed
                      ? null
                      : const Text('Settings',
                          style: TextStyle(fontSize: 12.5)),
                  onTap: () => showDialog(
                    context: context,
                    builder: (_) => BrokerSettingsDialog(
                      storage: widget.storage,
                      onSaved: () {
                        widget.onThemeChanged();
                        _refreshMarketData(force: true);
                      },
                    ),
                  ),
                ),
                IconButton(
                  icon: Icon(
                    collapsed ? Icons.chevron_right : Icons.chevron_left,
                    size: 18,
                  ),
                  tooltip: collapsed ? 'Expand Sidebar' : 'Collapse Sidebar',
                  onPressed: () {
                    setState(() {
                      widget.storage.isNavCollapsed = !collapsed;
                    });
                    widget.storage.save();
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTopHeader(BuildContext context, int openCount) {
    final nowLocal = DateTime.now()
        .toUtc()
        .add(Duration(hours: widget.storage.timezoneOffsetHours));
    final clockStr =
        '${nowLocal.hour.toString().padLeft(2, '0')}:${nowLocal.minute.toString().padLeft(2, '0')}:${nowLocal.second.toString().padLeft(2, '0')}';

    return Container(
      height: 54,
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border(
          bottom: BorderSide(color: Theme.of(context).dividerColor),
        ),
      ),
      child: Row(
        children: [
          Text(
            _activePage.title,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14.5),
          ),
          const SizedBox(width: 16),

          // Prominent Chart Mode Toggle in Top Appbar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFF090E1A),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                  color: const Color(0xFF06B6D4).withValues(alpha: 0.55)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'CHART MODE:',
                  style: TextStyle(
                    fontSize: 9.5,
                    fontFamily: 'monospace',
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF22D3EE),
                  ),
                ),
                const SizedBox(width: 8),
                _engineBtn(
                  label: 'Bot Chart',
                  icon: Icons.memory,
                  active: widget.storage.chartEngine == ChartEngineMode.native,
                  onTap: () {
                    setState(() {
                      widget.storage.chartEngine = ChartEngineMode.native;
                      _activePage = AppPage.chart;
                    });
                    widget.storage.save();
                  },
                ),
                const SizedBox(width: 4),
                _engineBtn(
                  label: 'TradingView Live',
                  icon: Icons.public,
                  active:
                      widget.storage.chartEngine == ChartEngineMode.tradingview,
                  onTap: () {
                    setState(() {
                      widget.storage.chartEngine = ChartEngineMode.tradingview;
                      _activePage = AppPage.chart;
                    });
                    widget.storage.save();
                  },
                ),
              ],
            ),
          ),

          const Spacer(),

          // Essential Account Figures
          _accountStat(
              'EQUITY', '\$${widget.storage.account.equity.toStringAsFixed(2)}'),
          const SizedBox(width: 16),
          _accountStat(
              'BALANCE', '\$${widget.storage.account.balance.toStringAsFixed(2)}'),
          const SizedBox(width: 16),
          _accountStat(
            'DRAWDOWN',
            '${widget.storage.account.currentDrawdownPercent.toStringAsFixed(2)}%',
            color: widget.storage.account.currentDrawdownPercent > 3.5
                ? const Color(0xFFEF4444)
                : const Color(0xFF10B981),
          ),
          const SizedBox(width: 14),

          // Live Timezone Clock Button
          OutlinedButton.icon(
            onPressed: _openTimezoneDialog,
            icon: const Icon(Icons.access_time, size: 14),
            label: Text(
              '$clockStr (${widget.storage.timezoneLabel.split(' ').first})',
              style: const TextStyle(fontFamily: 'monospace', fontSize: 11.5),
            ),
          ),
          const SizedBox(width: 6),
          IconButton(
            tooltip: 'Language ($_languageCode)',
            icon: const Icon(Icons.translate, size: 17),
            onPressed: _openLanguageDialog,
          ),
          IconButton(
            tooltip: 'Keyboard Shortcuts (Ctrl+/)',
            icon: const Icon(Icons.keyboard_outlined, size: 17),
            onPressed: _openShortcutsDialog,
          ),

          if (openCount > 0 || widget.storage.risk.isKillSwitchEngaged) ...[
            const SizedBox(width: 10),
            FilledButton.icon(
              style: FilledButton.styleFrom(
                backgroundColor: widget.storage.risk.isKillSwitchEngaged
                    ? const Color(0xFFDC2626)
                    : const Color(0xFF7F1D1D),
              ),
              onPressed: () async {
                widget.storage.risk = widget.storage.risk.copyWith(
                  isKillSwitchEngaged: !widget.storage.risk.isKillSwitchEngaged,
                );
                await widget.storage.save();
                setState(() {});
              },
              icon: const Icon(Icons.dangerous, size: 15),
              label: Text(widget.storage.risk.isKillSwitchEngaged
                  ? 'HALTED'
                  : 'KILL SWITCH'),
            ),
          ],
        ],
      ),
    );
  }

  Widget _engineBtn({
    required String label,
    required IconData icon,
    required bool active,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(6),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: active ? const Color(0xFF2563EB) : Colors.transparent,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (active) ...[
              Container(
                width: 6,
                height: 6,
                decoration: const BoxDecoration(
                  color: Color(0xFF34D399),
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 5),
            ],
            Icon(icon,
                size: 13,
                color: active ? Colors.white : const Color(0xFF94A3B8)),
            const SizedBox(width: 5),
            Text(
              label,
              style: TextStyle(
                fontSize: 11.5,
                fontWeight: active ? FontWeight.bold : FontWeight.w500,
                color: active ? Colors.white : const Color(0xFF94A3B8),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _accountStat(String label, String value, {Color? color}) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 9, color: Colors.grey),
        ),
        Text(
          value,
          style: TextStyle(
            fontFamily: 'monospace',
            fontWeight: FontWeight.bold,
            fontSize: 12,
            color: color,
          ),
        ),
      ],
    );
  }

  Widget _buildActivePage(double currentPrice) {
    return switch (_activePage) {
      AppPage.dashboard => DashboardPage(
          account: widget.storage.account,
          risk: widget.storage.risk,
          strategies: widget.storage.strategies,
          positions: widget.storage.positions,
          auditLogs: widget.storage.auditLogs,
          selectedSymbol: widget.storage.selectedSymbol,
          currentPrice: currentPrice,
          candles: _candles,
          timeframe: widget.storage.selectedTimeframe,
          onSelectSymbol: (sym) async {
            widget.storage.selectedSymbol = sym;
            await widget.storage.save();
            await _refreshMarketData(force: false);
          },
          onSelectTimeframe: (tf) async {
            widget.storage.selectedTimeframe = tf;
            await widget.storage.save();
            await _refreshMarketData(force: false);
          },
          onOpenChart: () => setState(() => _activePage = AppPage.chart),
          onOpenScanner: () => setState(() => _activePage = AppPage.scanner),
          onOpenStrategies: () =>
              setState(() => _activePage = AppPage.strategies),
        ),
      AppPage.scanner => MarketScannerPage(
          marketData: widget.marketData,
          strategies: widget.storage.strategies,
          onOpenChart: (sym, tf) {
            widget.storage.selectedSymbol = sym;
            widget.storage.selectedTimeframe = tf;
            widget.storage.save();
            setState(() => _activePage = AppPage.chart);
            _refreshMarketData(force: false);
          },
          onQuickOrder: (side, sym, lots, price) =>
              _placeOrder(side, sym, lots, price),
        ),
      AppPage.strategies => StrategyStudioPage(
          strategies: widget.storage.strategies,
          marketData: widget.marketData,
          onSaveStrategy: (s) async {
            final idx =
                widget.storage.strategies.indexWhere((e) => e.id == s.id);
            if (idx >= 0) {
              widget.storage.strategies[idx] = s;
            } else {
              widget.storage.strategies.add(s);
            }
            await widget.storage.save();
            setState(() {});
          },
          onDeleteStrategy: (id) async {
            widget.storage.strategies.removeWhere((s) => s.id == id);
            await widget.storage.save();
            setState(() {});
          },
          onRunEvaluation: (s) async {
            final res = await widget.marketData.fetchCandles(
              s.symbol,
              s.timeframe,
            );
            final log = StrategyScanner.evaluateStrategyOnCandles(
              s,
              res.candles,
            );
            widget.storage.auditLogs = [log, ...widget.storage.auditLogs];
            await widget.storage.save();
            setState(() {});
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    '${s.name}: ${log.outcome} (${log.direction}, ${log.matchScore.toStringAsFixed(0)}%)',
                  ),
                ),
              );
            }
          },
        ),
      AppPage.radar => AuditRadarPage(
          logs: widget.storage.auditLogs,
          onEvaluateAll: () async {
            final enabled =
                widget.storage.strategies.where((s) => s.isEnabled).toList();
            for (final s in enabled) {
              final res = await widget.marketData.fetchCandles(
                s.symbol,
                s.timeframe,
              );
              final log = StrategyScanner.evaluateStrategyOnCandles(
                s,
                res.candles,
              );
              widget.storage.auditLogs = [log, ...widget.storage.auditLogs];
            }
            await widget.storage.save();
            setState(() {});
          },
          onOpenChart: (sym, tf) {
            widget.storage.selectedSymbol = sym;
            widget.storage.selectedTimeframe = tf;
            widget.storage.save();
            setState(() => _activePage = AppPage.chart);
            _refreshMarketData(force: false);
          },
        ),
      AppPage.positions => PositionsPage(
          positions: widget.storage.positions,
          account: widget.storage.account,
          risk: widget.storage.risk,
          onClosePosition: _closePosition,
          onCloseAllPositions: () async {
            final openTickets = widget.storage.positions
                .where((p) => p.status == 'Open')
                .map((p) => p.ticket)
                .toList();
            for (final t in openTickets) {
              await _closePosition(t);
            }
          },
          onUpdateSlTp: (ticket, sl, tp) async {
            final idx = widget.storage.positions
                .indexWhere((p) => p.ticket == ticket);
            if (idx >= 0) {
              widget.storage.positions[idx] =
                  widget.storage.positions[idx].copyWith(
                stopLossPrice: sl,
                takeProfitPrice: tp,
              );
              await widget.storage.save();
              setState(() {});
            }
          },
          onUpdatePositionNote: _updatePositionNote,
          onUpdateRisk: (updated) async {
            widget.storage.risk = updated;
            await widget.storage.save();
            setState(() {});
          },
          onResetDemoAccount: (startingBalance) async {
            await widget.storage.resetDemoAccount(startingBalance);
            if (!mounted) return;
            setState(() {});
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  'Demo account reset to \$${startingBalance.toStringAsFixed(0)}',
                ),
              ),
            );
          },
          onToggleKillSwitch: () async {
            widget.storage.risk = widget.storage.risk.copyWith(
              isKillSwitchEngaged: !widget.storage.risk.isKillSwitchEngaged,
            );
            await widget.storage.save();
            setState(() {});
          },
        ),
      AppPage.journal => JournalPage(
          entries: widget.storage.journalEntries,
          positions: widget.storage.positions,
          activeSymbol: widget.storage.selectedSymbol,
          activeTimeframe: widget.storage.selectedTimeframe,
          currentPrice: currentPrice,
          onSaveEntry: _saveJournalEntry,
          onDeleteEntry: (id) async {
            widget.storage.journalEntries.removeWhere((e) => e.id == id);
            await widget.storage.save();
            setState(() {});
          },
          onOpenChart: (sym, tf) {
            widget.storage.selectedSymbol = sym;
            widget.storage.selectedTimeframe = tf;
            widget.storage.save();
            setState(() => _activePage = AppPage.chart);
            _refreshMarketData(force: false);
          },
          onUpdatePositionNote: _updatePositionNote,
        ),
      AppPage.sandbox => SimulatorPage(
          selectedSymbol: widget.storage.selectedSymbol,
          currentPrice: currentPrice,
          onInjectCandle: (c) {
            setState(() {
              _candles = [..._candles, c];
              _recalculatePositionsAndAlerts();
            });
          },
        ),
      AppPage.chart => LiveChartPage(
          symbol: widget.storage.selectedSymbol,
          timeframe: widget.storage.selectedTimeframe,
          candles: _candles,
          chartEngine: widget.storage.chartEngine,
          chartType: widget.storage.chartType,
          onSelectSymbol: (sym) async {
            widget.storage.selectedSymbol = sym;
            await widget.storage.save();
            await _refreshMarketData(force: false);
          },
          onSelectTimeframe: (tf) async {
            widget.storage.selectedTimeframe = tf;
            await widget.storage.save();
            await _refreshMarketData(force: false);
          },
          onChartTypeChanged: (ct) async {
            setState(() => widget.storage.chartType = ct);
            await widget.storage.save();
          },
          onOpenSymbolSearch: _openSymbolSearch,
          onOpenAlerts: () => showDialog(
            context: context,
            builder: (_) => AlertsDialog(
              symbol: widget.storage.selectedSymbol,
              currentPrice: currentPrice,
              alerts: widget.storage.alerts,
              onAddAlert: (a) {
                widget.storage.alerts.add(a);
                widget.storage.save();
                setState(() {});
              },
              onDeleteAlert: (id) {
                widget.storage.alerts.removeWhere((a) => a.id == id);
                widget.storage.save();
                setState(() {});
              },
            ),
          ),
          onQuickNote: () async {
            final entry = await JournalPage.showEntryEditorDialog(
              context,
              defaultSymbol: widget.storage.selectedSymbol,
              defaultTimeframe: widget.storage.selectedTimeframe,
              defaultPrice: currentPrice > 0 ? currentPrice : null,
            );
            if (entry != null) {
              await _saveJournalEntry(entry);
            }
          },
          watchlistQuotes: _watchlistQuotes,
          isWatchlistCollapsed: widget.storage.isWatchlistCollapsed,
          onToggleWatchlist: () {
            setState(() {
              widget.storage.isWatchlistCollapsed =
                  !widget.storage.isWatchlistCollapsed;
            });
            widget.storage.save();
          },
          positions: widget.storage.positions,
          alerts: widget.storage.alerts,
          drawings:
              widget.storage.drawingsBySymbol[widget.storage.selectedSymbol] ??
                  const [],
          onAddDrawing: (d) {
            final sym = widget.storage.selectedSymbol;
            final list = [...(widget.storage.drawingsBySymbol[sym] ?? []), d];
            widget.storage.drawingsBySymbol[sym] = list.cast<DrawingItem>();
            widget.storage.save();
            setState(() {});
          },
          onClearDrawings: () {
            widget.storage.drawingsBySymbol[widget.storage.selectedSymbol] = [];
            widget.storage.save();
            setState(() {});
          },
          onPlaceOrder: _placeOrder,
          timezoneOffsetHours: widget.storage.timezoneOffsetHours,
          timezoneIana: _timezoneIana,
          providerName: widget.storage.activeProvider,
          secondsUntilSync: _secondsUntilSync,
          isSyncing: _isSyncing,
          onManualSync: () => _refreshMarketData(force: true),
          onLoadOlderHistory: () => _refreshMarketData(force: true),
        ),
      AppPage.docs => const DocumentationPage(),
    };
  }
}
