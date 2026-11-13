import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import '../../models/trading_models.dart';
import '../../services/indicator_engine.dart';
import '../../services/symbol_catalog.dart';
import '../chart/native_chart_widget.dart';
import '../chart/tradingview_live_widget.dart';

class LiveChartPage extends StatefulWidget {
  final String symbol;
  final Timeframe timeframe;
  final List<Candle> candles;
  final ChartEngineMode chartEngine;
  final ChartType chartType;
  final ValueChanged<String> onSelectSymbol;
  final ValueChanged<Timeframe> onSelectTimeframe;
  final ValueChanged<ChartType> onChartTypeChanged;
  final VoidCallback onOpenSymbolSearch;
  final VoidCallback onOpenAlerts;
  final Map<String, MarketQuote> watchlistQuotes;
  final bool isWatchlistCollapsed;
  final VoidCallback onToggleWatchlist;
  final List<Position> positions;
  final List<PriceAlert> alerts;
  final List<DrawingItem> drawings;
  final ValueChanged<DrawingItem> onAddDrawing;
  final VoidCallback onClearDrawings;
  final Future<void> Function(
    String side,
    String symbol,
    double lots,
    double price, {
    double? sl,
    double? tp,
  }) onPlaceOrder;
  final int timezoneOffsetHours;
  final String timezoneIana;
  final String providerName;
  final int secondsUntilSync;
  final bool isSyncing;
  final VoidCallback onManualSync;
  final VoidCallback? onLoadOlderHistory;

  const LiveChartPage({
    super.key,
    required this.symbol,
    required this.timeframe,
    required this.candles,
    required this.chartEngine,
    required this.chartType,
    required this.onSelectSymbol,
    required this.onSelectTimeframe,
    required this.onChartTypeChanged,
    required this.onOpenSymbolSearch,
    required this.onOpenAlerts,
    required this.watchlistQuotes,
    required this.isWatchlistCollapsed,
    required this.onToggleWatchlist,
    required this.positions,
    required this.alerts,
    required this.drawings,
    required this.onAddDrawing,
    required this.onClearDrawings,
    required this.onPlaceOrder,
    required this.timezoneOffsetHours,
    this.timezoneIana = 'Etc/UTC',
    this.providerName = 'KeylessPublic',
    required this.secondsUntilSync,
    required this.isSyncing,
    required this.onManualSync,
    this.onLoadOlderHistory,
  });

  @override
  State<LiveChartPage> createState() => _LiveChartPageState();
}

class _LiveChartPageState extends State<LiveChartPage> {
  final GlobalKey<NativeChartWidgetState> _chartKey = GlobalKey();
  final GlobalKey _chartRepaintKey = GlobalKey();
  AssetCategory _watchlistCat = AssetCategory.all;
  ChartLayoutMode _layoutMode = ChartLayoutMode.single;
  DrawingTool _activeTool = DrawingTool.cursor;
  IndicatorSettings _indicators = const IndicatorSettings();
  bool _showOrderDock = false;
  bool _showDrawings = true;
  double _orderLots = 0.10;
  final TextEditingController _slCtrl = TextEditingController();
  final TextEditingController _tpCtrl = TextEditingController();

  @override
  void dispose() {
    _slCtrl.dispose();
    _tpCtrl.dispose();
    super.dispose();
  }

  Future<void> _exportSnapshot() async {
    try {
      final boundary = _chartRepaintKey.currentContext?.findRenderObject()
          as RenderRepaintBoundary?;
      if (boundary == null) return;
      final image = await boundary.toImage(pixelRatio: 2.0);
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      if (byteData == null) return;
      final home = Platform.environment['HOME'] ?? '.';
      final dir = Directory('$home/Pictures');
      if (!dir.existsSync()) dir.createSync(recursive: true);
      final ts = DateTime.now().millisecondsSinceEpoch;
      final path = '${dir.path}/TradingPlatform_${widget.symbol}_$ts.png';
      await File(path).writeAsBytes(byteData.buffer.asUint8List());
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Chart snapshot saved to $path')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Snapshot failed: $e')),
        );
      }
    }
  }

  Future<void> _openIndicatorsModal() async {
    await showDialog<void>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setS) => AlertDialog(
          title: const Text('Technical Indicators'),
          content: SizedBox(
            width: 360,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _indSwitch('EMA 20', _indicators.ema20, (v) {
                    setState(() => _indicators = _indicators.copyWith(ema20: v));
                    setS(() {});
                  }),
                  _indSwitch('EMA 50', _indicators.ema50, (v) {
                    setState(() => _indicators = _indicators.copyWith(ema50: v));
                    setS(() {});
                  }),
                  _indSwitch('EMA 200', _indicators.ema200, (v) {
                    setState(
                        () => _indicators = _indicators.copyWith(ema200: v));
                    setS(() {});
                  }),
                  _indSwitch('SMA 20', _indicators.sma20, (v) {
                    setState(() => _indicators = _indicators.copyWith(sma20: v));
                    setS(() {});
                  }),
                  _indSwitch('Bollinger Bands (20, 2)', _indicators.bollinger,
                      (v) {
                    setState(
                        () => _indicators = _indicators.copyWith(bollinger: v));
                    setS(() {});
                  }),
                  _indSwitch('VWAP', _indicators.vwap, (v) {
                    setState(() => _indicators = _indicators.copyWith(vwap: v));
                    setS(() {});
                  }),
                  _indSwitch('Supertrend (10, 3)', _indicators.supertrend, (v) {
                    setState(() =>
                        _indicators = _indicators.copyWith(supertrend: v));
                    setS(() {});
                  }),
                  _indSwitch('Ichimoku Cloud', _indicators.ichimoku, (v) {
                    setState(
                        () => _indicators = _indicators.copyWith(ichimoku: v));
                    setS(() {});
                  }),
                  _indSwitch('Volume Histogram', _indicators.volume, (v) {
                    setState(
                        () => _indicators = _indicators.copyWith(volume: v));
                    setS(() {});
                  }),
                  const Divider(),
                  _indSwitch('RSI Oscillator (14)', _indicators.rsi, (v) {
                    setState(() => _indicators = _indicators.copyWith(rsi: v));
                    setS(() {});
                  }),
                  _indSwitch('MACD (12, 26, 9)', _indicators.macd, (v) {
                    setState(() => _indicators = _indicators.copyWith(macd: v));
                    setS(() {});
                  }),
                ],
              ),
            ),
          ),
          actions: [
            FilledButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Done'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _indSwitch(String title, bool value, ValueChanged<bool> onChanged) {
    return SwitchListTile(
      dense: true,
      contentPadding: EdgeInsets.zero,
      title: Text(title),
      value: value,
      onChanged: onChanged,
    );
  }

  @override
  Widget build(BuildContext context) {
    final currentPrice =
        widget.candles.isNotEmpty ? widget.candles.last.close : 0.0;
    final openPositions =
        widget.positions.where((p) => p.status == 'Open').toList();

    return Row(
      children: [
        // 1. Collapsible Watchlist Sidebar
        if (!widget.isWatchlistCollapsed)
          _buildWatchlistSidebar(context)
        else
          _buildCollapsedWatchlistRail(context),

        // 2. Main Chart Area
        Expanded(
          child: Column(
            children: [
              // Clean Chart Toolbar (no duplicated top appbar actions!)
              _buildChartToolbar(context, currentPrice),
              if (widget.chartEngine == ChartEngineMode.native)
                _buildActiveIndicatorsRow(context),
              ..._buildTriggeredAlertBanners(),
              Expanded(
                child: widget.chartEngine == ChartEngineMode.tradingview
                    ? _buildTradingViewBridge(context, currentPrice)
                    : Row(
                        children: [
                          _buildDrawingToolbar(context),
                          Expanded(
                            child: RepaintBoundary(
                              key: _chartRepaintKey,
                              child: Stack(
                                children: [
                                  _buildMultiChartGrid(openPositions),
                                  if (_showOrderDock && currentPrice > 0)
                                    Positioned(
                                      top: 48,
                                      left: 12,
                                      child: _buildQuickOrderDock(currentPrice),
                                    ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildWatchlistSidebar(BuildContext context) {
    final items = SymbolCatalog.allSymbols
        .where((s) =>
            _watchlistCat == AssetCategory.all || s.category == _watchlistCat)
        .toList();

    return Container(
      width: 248,
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border(
          right: BorderSide(color: Theme.of(context).dividerColor),
        ),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 10, 6, 6),
            child: Row(
              children: [
                const Text(
                  'WATCHLIST',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.8,
                  ),
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.search, size: 16),
                  tooltip: 'Browse All 45+ Symbols',
                  onPressed: widget.onOpenSymbolSearch,
                ),
                IconButton(
                  icon: const Icon(Icons.chevron_left, size: 18),
                  tooltip: 'Collapse Watchlist',
                  onPressed: widget.onToggleWatchlist,
                ),
              ],
            ),
          ),
          SizedBox(
            height: 30,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 8),
              children: AssetCategory.values.map((cat) {
                final sel = _watchlistCat == cat;
                return Padding(
                  padding: const EdgeInsets.only(right: 4),
                  child: ChoiceChip(
                    label: Text(cat.label, style: const TextStyle(fontSize: 10)),
                    selected: sel,
                    visualDensity: VisualDensity.compact,
                    onSelected: (_) => setState(() => _watchlistCat = cat),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 6),
          Expanded(
            child: ListView.builder(
              itemCount: items.length,
              itemBuilder: (ctx, i) {
                final item = items[i];
                final quote = widget.watchlistQuotes[item.symbol];
                final price = quote?.price ?? item.defaultBaseline;
                final pct = quote?.changePct ?? 0.0;
                final isUp = pct >= 0;
                final isSel = item.symbol == widget.symbol;
                return InkWell(
                  onTap: () => widget.onSelectSymbol(item.symbol),
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    color: isSel
                        ? const Color(0xFF2563EB).withValues(alpha: 0.16)
                        : null,
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.symbol,
                                style: TextStyle(
                                  fontFamily: 'monospace',
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                  color: isSel ? const Color(0xFF38BDF8) : null,
                                ),
                              ),
                              Text(
                                item.name,
                                style: const TextStyle(
                                    fontSize: 10.5, color: Colors.grey),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              IndicatorEngine.formatPrice(price, item.symbol),
                              style: const TextStyle(
                                fontFamily: 'monospace',
                                fontSize: 11.5,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              '${isUp ? '+' : ''}${pct.toStringAsFixed(2)}%',
                              style: TextStyle(
                                fontFamily: 'monospace',
                                fontSize: 10.5,
                                fontWeight: FontWeight.bold,
                                color: isUp
                                    ? const Color(0xFF10B981)
                                    : const Color(0xFFEF4444),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(
              border: Border(
                top: BorderSide(color: Theme.of(context).dividerColor),
              ),
              color: Theme.of(context).colorScheme.surfaceContainerLow,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      widget.isSyncing ? Icons.sync : Icons.shield_outlined,
                      size: 13,
                      color: const Color(0xFF10B981),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        widget.isSyncing
                            ? 'Refreshing live quotes...'
                            : 'Refresh prices in ${widget.secondsUntilSync}s',
                        style: const TextStyle(
                            fontSize: 10.5, fontWeight: FontWeight.w600),
                      ),
                    ),
                    InkWell(
                      onTap: widget.onManualSync,
                      child: const Text('Sync',
                          style: TextStyle(
                              fontSize: 10.5,
                              color: Color(0xFF38BDF8),
                              fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  'Feed: ${widget.providerName} · Rate-limit protected',
                  style: const TextStyle(fontSize: 10, color: Colors.grey),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCollapsedWatchlistRail(BuildContext context) {
    return Container(
      width: 38,
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border(
          right: BorderSide(color: Theme.of(context).dividerColor),
        ),
      ),
      child: Column(
        children: [
          const SizedBox(height: 8),
          IconButton(
            icon: const Icon(Icons.chevron_right, size: 18),
            tooltip: 'Expand Watchlist',
            onPressed: widget.onToggleWatchlist,
          ),
          const Spacer(),
          RotatedBox(
            quarterTurns: 3,
            child: InkWell(
              onTap: widget.onToggleWatchlist,
              child: const Text(
                'WATCHLIST',
                style: TextStyle(
                  fontSize: 10,
                  letterSpacing: 1.5,
                  color: Colors.grey,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const Spacer(),
        ],
      ),
    );
  }

  Widget _buildChartToolbar(BuildContext context, double currentPrice) {
    return Container(
      height: 42,
      padding: const EdgeInsets.symmetric(horizontal: 8),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border(
          bottom: BorderSide(color: Theme.of(context).dividerColor),
        ),
      ),
      child: Row(
        children: [
          // Symbol Picker
          OutlinedButton.icon(
            onPressed: widget.onOpenSymbolSearch,
            icon: const Icon(Icons.search, size: 15),
            label: Text(
              widget.symbol,
              style: const TextStyle(
                fontFamily: 'monospace',
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 8),

          // Timeframe Selector
          Expanded(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  ...Timeframe.values.map((tf) {
                    final sel = tf == widget.timeframe;
                    return Padding(
                      padding: const EdgeInsets.only(right: 2),
                      child: InkWell(
                        onTap: () => widget.onSelectTimeframe(tf),
                        borderRadius: BorderRadius.circular(6),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 5),
                          decoration: BoxDecoration(
                            color: sel
                                ? const Color(0xFF2563EB)
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            tf.code,
                            style: TextStyle(
                              fontSize: 11.5,
                              fontFamily: 'monospace',
                              fontWeight:
                                  sel ? FontWeight.bold : FontWeight.w500,
                              color: sel ? Colors.white : null,
                            ),
                          ),
                        ),
                      ),
                    );
                  }),
                  const SizedBox(width: 10),

                  // Chart Style Dropdown
                  DropdownButton<ChartType>(
                    value: widget.chartType,
                    underline: const SizedBox.shrink(),
                    isDense: true,
                    items: ChartType.values
                        .map((ct) => DropdownMenuItem(
                              value: ct,
                              child: Text(ct.shortLabel,
                                  style: const TextStyle(fontSize: 12)),
                            ))
                        .toList(),
                    onChanged: (v) {
                      if (v != null) widget.onChartTypeChanged(v);
                    },
                  ),
                  const SizedBox(width: 8),

                  // Indicators
                  OutlinedButton(
                    onPressed: _openIndicatorsModal,
                    child: const Text('fx Indicators',
                        style: TextStyle(fontSize: 11.5)),
                  ),
                  const SizedBox(width: 6),

                  // Alerts
                  OutlinedButton.icon(
                    onPressed: widget.onOpenAlerts,
                    icon: const Icon(Icons.notifications_none,
                        size: 14, color: Color(0xFFF59E0B)),
                    label: const Text('Alerts',
                        style: TextStyle(fontSize: 11.5)),
                  ),
                ],
              ),
            ),
          ),

          // Right-side layout & quick trade tools
          PopupMenuButton<ChartLayoutMode>(
            tooltip: 'Split / Multi-Chart Layout',
            icon: const Icon(Icons.view_quilt, size: 18),
            onSelected: (m) => setState(() => _layoutMode = m),
            itemBuilder: (_) => const [
              PopupMenuItem(
                  value: ChartLayoutMode.single, child: Text('[1] Single Chart')),
              PopupMenuItem(
                  value: ChartLayoutMode.splitV,
                  child: Text('[|] Dual Vertical')),
              PopupMenuItem(
                  value: ChartLayoutMode.splitH,
                  child: Text('[=] Dual Horizontal')),
              PopupMenuItem(
                  value: ChartLayoutMode.grid4, child: Text('[+] Quad 2x2 Grid')),
            ],
          ),
          FilledButton.tonalIcon(
            onPressed: () => setState(() => _showOrderDock = !_showOrderDock),
            icon: const Icon(Icons.bolt, size: 15),
            label: const Text('Trade', style: TextStyle(fontSize: 11.5)),
          ),
          const SizedBox(width: 4),
          if (widget.onLoadOlderHistory != null)
            IconButton(
              icon: const Icon(Icons.history, size: 18),
              tooltip: '+Bars (Load Older History)',
              onPressed: widget.onLoadOlderHistory,
            ),
          IconButton(
            icon: const Icon(Icons.camera_alt_outlined, size: 18),
            tooltip: 'Save Chart Snapshot (PNG)',
            onPressed: _exportSnapshot,
          ),
          IconButton(
            icon: const Icon(Icons.fit_screen, size: 18),
            tooltip: 'Reset Zoom / Fit Content',
            onPressed: () => _chartKey.currentState?.fitContent(),
          ),
        ],
      ),
    );
  }

  Widget _buildDrawingToolbar(BuildContext context) {
    final icons = <(DrawingTool, IconData)>[
      (DrawingTool.cursor, Icons.near_me),
      (DrawingTool.trendline, Icons.show_chart),
      (DrawingTool.hline, Icons.horizontal_rule),
      (DrawingTool.ray, Icons.trending_up),
      (DrawingTool.fibonacci, Icons.stacked_line_chart),
      (DrawingTool.rectangle, Icons.crop_square),
      (DrawingTool.text, Icons.text_fields),
    ];

    return Container(
      width: 42,
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border(
          right: BorderSide(color: Theme.of(context).dividerColor),
        ),
      ),
      child: Column(
        children: [
          const SizedBox(height: 6),
          ...icons.map((item) {
            final active = _activeTool == item.$1;
            return Tooltip(
              message: item.$1.label,
              child: IconButton(
                icon: Icon(
                  item.$2,
                  size: 18,
                  color: active ? const Color(0xFF38BDF8) : null,
                ),
                onPressed: () => setState(() => _activeTool = item.$1),
              ),
            );
          }),
          const Spacer(),
          Tooltip(
            message: _showDrawings ? 'Hide Drawings' : 'Show Drawings',
            child: IconButton(
              icon: Icon(
                _showDrawings ? Icons.visibility : Icons.visibility_off,
                size: 18,
                color: _showDrawings ? null : Colors.grey,
              ),
              onPressed: () => setState(() => _showDrawings = !_showDrawings),
            ),
          ),
          Tooltip(
            message: 'Clear Drawings (${widget.drawings.length})',
            child: IconButton(
              icon: const Icon(Icons.delete_outline,
                  size: 18, color: Colors.redAccent),
              onPressed: widget.onClearDrawings,
            ),
          ),
          const SizedBox(height: 6),
        ],
      ),
    );
  }

  Widget _buildActiveIndicatorsRow(BuildContext context) {
    final chips = <(String, VoidCallback)>[];
    if (_indicators.ema20) {
      chips.add(('EMA 20', () => setState(() => _indicators = _indicators.copyWith(ema20: false))));
    }
    if (_indicators.ema50) {
      chips.add(('EMA 50', () => setState(() => _indicators = _indicators.copyWith(ema50: false))));
    }
    if (_indicators.ema200) {
      chips.add(('EMA 200', () => setState(() => _indicators = _indicators.copyWith(ema200: false))));
    }
    if (_indicators.sma20) {
      chips.add(('SMA 20', () => setState(() => _indicators = _indicators.copyWith(sma20: false))));
    }
    if (_indicators.bollinger) {
      chips.add(('BB (20)', () => setState(() => _indicators = _indicators.copyWith(bollinger: false))));
    }
    if (_indicators.vwap) {
      chips.add(('VWAP', () => setState(() => _indicators = _indicators.copyWith(vwap: false))));
    }
    if (_indicators.supertrend) {
      chips.add(('Supertrend', () => setState(() => _indicators = _indicators.copyWith(supertrend: false))));
    }
    if (_indicators.ichimoku) {
      chips.add(('Ichimoku', () => setState(() => _indicators = _indicators.copyWith(ichimoku: false))));
    }
    if (_indicators.rsi) {
      chips.add(('RSI (14)', () => setState(() => _indicators = _indicators.copyWith(rsi: false))));
    }
    if (_indicators.macd) {
      chips.add(('MACD (12/26/9)', () => setState(() => _indicators = _indicators.copyWith(macd: false))));
    }

    if (chips.isEmpty) return const SizedBox.shrink();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerLowest,
        border: Border(bottom: BorderSide(color: Theme.of(context).dividerColor)),
      ),
      child: Wrap(
        spacing: 6,
        runSpacing: 4,
        children: chips
            .map(
              (c) => InputChip(
                label: Text(c.$1, style: const TextStyle(fontSize: 10.5)),
                deleteIcon: const Icon(Icons.close, size: 13),
                onDeleted: c.$2,
                visualDensity: VisualDensity.compact,
                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
            )
            .toList(),
      ),
    );
  }

  List<Widget> _buildTriggeredAlertBanners() {
    final triggered = widget.alerts
        .where((a) => a.triggered && a.symbol == widget.symbol)
        .toList();
    if (triggered.isEmpty) return const [];
    return [
      Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        color: const Color(0xFFF59E0B).withValues(alpha: 0.16),
        child: Row(
          children: [
            const Icon(Icons.notifications_active,
                size: 16, color: Color(0xFFF59E0B)),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'Alert triggered on ${widget.symbol}: ${triggered.first.condition} ${IndicatorEngine.formatPrice(triggered.first.targetPrice, widget.symbol)}',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFFFBBF24),
                ),
              ),
            ),
            TextButton(
              onPressed: widget.onOpenAlerts,
              child: const Text('Manage Alerts'),
            ),
          ],
        ),
      ),
    ];
  }

  Widget _buildMultiChartGrid(List<Position> openPositions) {
    Widget primaryPane() => NativeChartWidget(
          key: _chartKey,
          symbol: widget.symbol,
          timeframe: widget.timeframe,
          candles: widget.candles,
          chartType: widget.chartType,
          indicators: _indicators,
          activeTool: _activeTool,
          drawings: _showDrawings ? widget.drawings : const [],
          onAddDrawing: widget.onAddDrawing,
          onDrawingComplete: () =>
              setState(() => _activeTool = DrawingTool.cursor),
          openPositions: openPositions,
          activeAlerts: widget.alerts,
          timezoneOffsetHours: widget.timezoneOffsetHours,
          secondsUntilSync: widget.secondsUntilSync,
          isSyncing: widget.isSyncing,
          onManualSync: widget.onManualSync,
        );

    Widget secondaryPane(Timeframe tf) => NativeChartWidget(
          symbol: widget.symbol,
          timeframe: tf,
          candles: IndicatorEngine.aggregateAndAlignCandles(widget.candles, tf),
          chartType: widget.chartType,
          indicators: _indicators,
          activeTool: DrawingTool.cursor,
          drawings: const [],
          onAddDrawing: (_) {},
          onDrawingComplete: () {},
          openPositions: openPositions,
          activeAlerts: widget.alerts,
          timezoneOffsetHours: widget.timezoneOffsetHours,
          secondsUntilSync: widget.secondsUntilSync,
          isSyncing: widget.isSyncing,
          onManualSync: widget.onManualSync,
          showSyncBadge: false,
        );

    return switch (_layoutMode) {
      ChartLayoutMode.single => primaryPane(),
      ChartLayoutMode.splitV => Row(
          children: [
            Expanded(child: primaryPane()),
            const VerticalDivider(width: 2),
            Expanded(child: secondaryPane(Timeframe.h1)),
          ],
        ),
      ChartLayoutMode.splitH => Column(
          children: [
            Expanded(child: primaryPane()),
            const Divider(height: 2),
            Expanded(child: secondaryPane(Timeframe.h1)),
          ],
        ),
      ChartLayoutMode.grid4 => Column(
          children: [
            Expanded(
              child: Row(
                children: [
                  Expanded(child: primaryPane()),
                  const VerticalDivider(width: 2),
                  Expanded(child: secondaryPane(Timeframe.m15)),
                ],
              ),
            ),
            const Divider(height: 2),
            Expanded(
              child: Row(
                children: [
                  Expanded(child: secondaryPane(Timeframe.h1)),
                  const VerticalDivider(width: 2),
                  Expanded(child: secondaryPane(Timeframe.h4)),
                ],
              ),
            ),
          ],
        ),
    };
  }

  Widget _buildQuickOrderDock(double currentPrice) {
    return Container(
      width: 240,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A).withValues(alpha: 0.94),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF334155)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.45),
            blurRadius: 12,
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Text(
                '1-Click Trade · ${widget.symbol}',
                style: const TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const Spacer(),
              InkWell(
                onTap: () => setState(() => _showOrderDock = false),
                child: const Icon(Icons.close, size: 15, color: Colors.grey),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Lots:',
                  style: TextStyle(fontSize: 11, color: Colors.grey)),
              Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.remove_circle_outline, size: 16),
                    onPressed: () => setState(() =>
                        _orderLots = (_orderLots - 0.05).clamp(0.01, 50.0)),
                  ),
                  Text(
                    _orderLots.toStringAsFixed(2),
                    style: const TextStyle(
                      fontFamily: 'monospace',
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.add_circle_outline, size: 16),
                    onPressed: () => setState(() =>
                        _orderLots = (_orderLots + 0.05).clamp(0.01, 50.0)),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _slCtrl,
                  style: const TextStyle(fontSize: 11, color: Colors.white),
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(
                    labelText: 'SL',
                    labelStyle: TextStyle(fontSize: 10, color: Colors.white60),
                    isDense: true,
                    contentPadding:
                        EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                    border: OutlineInputBorder(),
                  ),
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: TextField(
                  controller: _tpCtrl,
                  style: const TextStyle(fontSize: 11, color: Colors.white),
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(
                    labelText: 'TP',
                    labelStyle: TextStyle(fontSize: 10, color: Colors.white60),
                    isDense: true,
                    contentPadding:
                        EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                    border: OutlineInputBorder(),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: FilledButton(
                  style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFFEF4444)),
                  onPressed: () => widget.onPlaceOrder(
                    'Sell',
                    widget.symbol,
                    _orderLots,
                    currentPrice,
                    sl: double.tryParse(_slCtrl.text.trim()),
                    tp: double.tryParse(_tpCtrl.text.trim()),
                  ),
                  child: const Text('SELL'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: FilledButton(
                  style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981)),
                  onPressed: () => widget.onPlaceOrder(
                    'Buy',
                    widget.symbol,
                    _orderLots,
                    currentPrice,
                    sl: double.tryParse(_slCtrl.text.trim()),
                    tp: double.tryParse(_tpCtrl.text.trim()),
                  ),
                  child: const Text('BUY'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTradingViewBridge(BuildContext context, double currentPrice) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Stack(
      children: [
        Positioned.fill(
          child: TradingViewLiveWidget(
            symbol: widget.symbol,
            timeframe: widget.timeframe,
            chartType: widget.chartType,
            timezone: widget.timezoneIana,
            isDark: isDark,
          ),
        ),
        if (_showOrderDock && currentPrice > 0)
          Positioned(
            top: 48,
            left: 56,
            child: _buildQuickOrderDock(currentPrice),
          ),
      ],
    );
  }
}
