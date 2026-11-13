import 'dart:math' as math;
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import '../../models/trading_models.dart';
import '../../services/indicator_engine.dart';
import 'draggable_sync_badge.dart';
import 'trading_chart_painter.dart';

class NativeChartWidget extends StatefulWidget {
  final String symbol;
  final Timeframe timeframe;
  final List<Candle> candles;
  final ChartType chartType;
  final IndicatorSettings indicators;
  final DrawingTool activeTool;
  final List<DrawingItem> drawings;
  final ValueChanged<DrawingItem> onAddDrawing;
  final VoidCallback onDrawingComplete;
  final List<Position> openPositions;
  final List<PriceAlert> activeAlerts;
  final int timezoneOffsetHours;
  final int secondsUntilSync;
  final bool isSyncing;
  final VoidCallback onManualSync;
  final bool showSyncBadge;

  const NativeChartWidget({
    super.key,
    required this.symbol,
    required this.timeframe,
    required this.candles,
    required this.chartType,
    required this.indicators,
    required this.activeTool,
    required this.drawings,
    required this.onAddDrawing,
    required this.onDrawingComplete,
    required this.openPositions,
    required this.activeAlerts,
    required this.timezoneOffsetHours,
    required this.secondsUntilSync,
    required this.isSyncing,
    required this.onManualSync,
    this.showSyncBadge = true,
  });

  @override
  State<NativeChartWidget> createState() => NativeChartWidgetState();
}

class NativeChartWidgetState extends State<NativeChartWidget> {
  int _visibleCount = 90;
  int _startIndex = 0;
  Offset? _crosshair;
  int? _hoveredIndex;
  DrawingItem? _draftDrawing;
  double _panAccum = 0;

  @override
  void didUpdateWidget(covariant NativeChartWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.symbol != widget.symbol ||
        oldWidget.timeframe != widget.timeframe) {
      fitContent();
    } else {
      _clampViewport();
    }
  }

  void fitContent() {
    setState(() {
      _visibleCount = math.min(110, math.max(20, widget.candles.length));
      _startIndex = math.max(0, widget.candles.length - _visibleCount);
    });
  }

  void _clampViewport() {
    if (widget.candles.isEmpty) {
      _startIndex = 0;
      return;
    }
    _visibleCount = _visibleCount.clamp(15, math.max(15, widget.candles.length));
    final maxStart = math.max(0, widget.candles.length - _visibleCount);
    _startIndex = _startIndex.clamp(0, maxStart);
  }

  (int timeSec, double price)? _offsetToData(Offset pos, Size size) {
    if (widget.candles.isEmpty) return null;
    final chartW = math.max(10.0, size.width - TradingChartPainter.rightAxisWidth);
    final chartH =
        math.max(10.0, size.height - TradingChartPainter.bottomAxisHeight);

    final safeStart =
        _startIndex.clamp(0, math.max(0, widget.candles.length - 1)).toInt();
    final safeEnd = (safeStart + _visibleCount)
        .clamp(safeStart + 1, widget.candles.length)
        .toInt();
    final slice = widget.candles.sublist(safeStart, safeEnd);
    if (slice.isEmpty) return null;

    double minP = slice.map((c) => c.low).reduce(math.min);
    double maxP = slice.map((c) => c.high).reduce(math.max);
    final pad = (maxP - minP) * 0.08;
    minP -= pad;
    maxP += pad;

    final idx = ((pos.dx / chartW) * slice.length)
        .floor()
        .clamp(0, slice.length - 1);
    final price =
        minP + ((chartH - pos.dy.clamp(0, chartH)) / chartH) * (maxP - minP);
    return (slice[idx].timeSeconds, price);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final displayCandle = (_hoveredIndex != null &&
            _hoveredIndex! >= 0 &&
            _hoveredIndex! < widget.candles.length)
        ? widget.candles[_hoveredIndex!]
        : (widget.candles.isNotEmpty ? widget.candles.last : null);

    return Column(
      children: [
        Expanded(
          child: LayoutBuilder(
            builder: (context, constraints) {
              final size = Size(constraints.maxWidth, constraints.maxHeight);
              return Listener(
                onPointerSignal: (event) {
                  if (event is PointerScrollEvent && widget.candles.isNotEmpty) {
                    setState(() {
                      final delta = event.scrollDelta.dy > 0 ? 10 : -10;
                      final oldCount = _visibleCount;
                      _visibleCount = (_visibleCount + delta)
                          .clamp(15, math.max(20, widget.candles.length));
                      _startIndex = (_startIndex + (oldCount - _visibleCount))
                          .clamp(0, math.max(0, widget.candles.length - _visibleCount));
                    });
                  }
                },
                child: MouseRegion(
                  cursor: widget.activeTool == DrawingTool.cursor
                      ? SystemMouseCursors.precise
                      : SystemMouseCursors.click,
                  onHover: (e) {
                    final chartW = math.max(
                        10.0, size.width - TradingChartPainter.rightAxisWidth);
                    final safeStart = _startIndex
                        .clamp(0, math.max(0, widget.candles.length - 1))
                        .toInt();
                    final safeEnd = (safeStart + _visibleCount)
                        .clamp(safeStart + 1, widget.candles.length)
                        .toInt();
                    final sliceLen = math.max(1, safeEnd - safeStart);
                    final localIdx = ((e.localPosition.dx / chartW) * sliceLen)
                        .floor()
                        .clamp(0, sliceLen - 1);
                    setState(() {
                      _crosshair = e.localPosition;
                      _hoveredIndex = (safeStart + localIdx).toInt();
                    });
                  },
                  onExit: (_) => setState(() {
                    _crosshair = null;
                    _hoveredIndex = null;
                  }),
                  child: GestureDetector(
                    onTapDown: (details) async {
                      if (widget.activeTool == DrawingTool.hline) {
                        final pt = _offsetToData(details.localPosition, size);
                        if (pt == null) return;
                        widget.onAddDrawing(DrawingItem(
                          id: 'drw_${DateTime.now().millisecondsSinceEpoch}',
                          tool: DrawingTool.hline,
                          points: [DrawingPoint(timeSeconds: pt.$1, price: pt.$2)],
                          colorValue: 0xFFF59E0B,
                        ));
                        widget.onDrawingComplete();
                      } else if (widget.activeTool == DrawingTool.text) {
                        final pt = _offsetToData(details.localPosition, size);
                        if (pt == null) return;
                        final note = await _promptText(context);
                        if (note != null && note.isNotEmpty) {
                          widget.onAddDrawing(DrawingItem(
                            id: 'drw_${DateTime.now().millisecondsSinceEpoch}',
                            tool: DrawingTool.text,
                            points: [DrawingPoint(timeSeconds: pt.$1, price: pt.$2)],
                            colorValue: 0xFF38BDF8,
                            text: note,
                          ));
                        }
                        widget.onDrawingComplete();
                      }
                    },
                    onPanStart: (details) {
                      if (widget.activeTool != DrawingTool.cursor &&
                          widget.activeTool != DrawingTool.hline &&
                          widget.activeTool != DrawingTool.text) {
                        final pt = _offsetToData(details.localPosition, size);
                        if (pt != null) {
                          setState(() {
                            _draftDrawing = DrawingItem(
                              id: 'draft',
                              tool: widget.activeTool,
                              points: [
                                DrawingPoint(timeSeconds: pt.$1, price: pt.$2),
                                DrawingPoint(timeSeconds: pt.$1, price: pt.$2),
                              ],
                            );
                          });
                        }
                      }
                    },
                    onPanUpdate: (details) {
                      if (_draftDrawing != null) {
                        final pt = _offsetToData(details.localPosition, size);
                        if (pt != null) {
                          setState(() {
                            _draftDrawing = DrawingItem(
                              id: 'draft',
                              tool: _draftDrawing!.tool,
                              points: [
                                _draftDrawing!.points.first,
                                DrawingPoint(timeSeconds: pt.$1, price: pt.$2),
                              ],
                            );
                          });
                        }
                        return;
                      }
                      if (widget.candles.isEmpty) return;
                      final chartW = math.max(
                          10.0, size.width - TradingChartPainter.rightAxisWidth);
                      final stepPx = chartW / math.max(1, _visibleCount);
                      _panAccum += details.delta.dx;
                      final barsShift = (_panAccum / stepPx).truncate();
                      if (barsShift != 0) {
                        _panAccum -= barsShift * stepPx;
                        setState(() {
                          final maxStart = math.max(
                              0, widget.candles.length - _visibleCount);
                          _startIndex =
                              (_startIndex - barsShift).clamp(0, maxStart);
                        });
                      }
                    },
                    onPanEnd: (_) {
                      if (_draftDrawing != null) {
                        widget.onAddDrawing(DrawingItem(
                          id: 'drw_${DateTime.now().millisecondsSinceEpoch}',
                          tool: _draftDrawing!.tool,
                          points: _draftDrawing!.points,
                        ));
                        setState(() => _draftDrawing = null);
                        widget.onDrawingComplete();
                      }
                    },
                    child: Stack(
                      children: [
                        CustomPaint(
                          size: Size.infinite,
                          painter: TradingChartPainter(
                            symbol: widget.symbol,
                            candles: widget.candles,
                            chartType: widget.chartType,
                            indicators: widget.indicators,
                            openPositions: widget.openPositions,
                            activeAlerts: widget.activeAlerts,
                            drawings: widget.drawings,
                            draftDrawing: _draftDrawing,
                            startIndex: _startIndex,
                            visibleCount: _visibleCount,
                            crosshairPos: _crosshair,
                            timezoneOffsetHours: widget.timezoneOffsetHours,
                            isDark: isDark,
                          ),
                        ),
                        if (displayCandle != null)
                          Positioned(
                            top: 8,
                            left: 10,
                            child: _OhlcvHud(
                              symbol: widget.symbol,
                              timeframe: widget.timeframe,
                              candle: displayCandle,
                              timezoneOffsetHours: widget.timezoneOffsetHours,
                            ),
                          ),
                        if (widget.showSyncBadge)
                          DraggableSyncBadge(
                            secondsUntilSync: widget.secondsUntilSync,
                            isSyncing: widget.isSyncing,
                            onManualSync: widget.onManualSync,
                          ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        if (widget.indicators.rsi)
          SizedBox(
            height: 92,
            child: Column(
              children: [
                Container(
                  height: 20,
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  color: const Color(0xFF0B1120),
                  child: Row(
                    children: [
                      Text(
                        'RSI (${widget.indicators.rsiPeriod})',
                        style: const TextStyle(
                          fontSize: 10,
                          fontFamily: 'monospace',
                          fontWeight: FontWeight.bold,
                          color: Color(0xFFF59E0B),
                        ),
                      ),
                      const Spacer(),
                      const Text(
                        'OB: 70 | OS: 30',
                        style: TextStyle(
                          fontSize: 10,
                          fontFamily: 'monospace',
                          color: Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: CustomPaint(
                    size: Size.infinite,
                    painter: OscillatorSubPanePainter(
                      candles: widget.candles,
                      startIndex: _startIndex,
                      visibleCount: _visibleCount,
                      isRsi: true,
                      rsiPeriod: widget.indicators.rsiPeriod,
                      isDark: isDark,
                    ),
                  ),
                ),
              ],
            ),
          ),
        if (widget.indicators.macd)
          SizedBox(
            height: 92,
            child: Column(
              children: [
                Container(
                  height: 20,
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  color: const Color(0xFF0B1120),
                  child: Row(
                    children: [
                      Text(
                        'MACD (${widget.indicators.macdFast},${widget.indicators.macdSlow},${widget.indicators.macdSignal})',
                        style: const TextStyle(
                          fontSize: 10,
                          fontFamily: 'monospace',
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF06B6D4),
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: CustomPaint(
                    size: Size.infinite,
                    painter: OscillatorSubPanePainter(
                      candles: widget.candles,
                      startIndex: _startIndex,
                      visibleCount: _visibleCount,
                      isRsi: false,
                      macdFast: widget.indicators.macdFast,
                      macdSlow: widget.indicators.macdSlow,
                      macdSignal: widget.indicators.macdSignal,
                      isDark: isDark,
                    ),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Future<String?> _promptText(BuildContext context) async {
    final ctrl = TextEditingController();
    return showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add Chart Annotation'),
        content: TextField(
          controller: ctrl,
          autofocus: true,
          decoration: const InputDecoration(hintText: 'Enter chart note...'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, ctrl.text.trim()),
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }
}

class _OhlcvHud extends StatelessWidget {
  final String symbol;
  final Timeframe timeframe;
  final Candle candle;
  final int timezoneOffsetHours;

  const _OhlcvHud({
    required this.symbol,
    required this.timeframe,
    required this.candle,
    required this.timezoneOffsetHours,
  });

  @override
  Widget build(BuildContext context) {
    final isUp = candle.close >= candle.open;
    final cColor = isUp ? const Color(0xFF10B981) : const Color(0xFFEF4444);
    final dt =
        candle.timestamp.toUtc().add(Duration(hours: timezoneOffsetHours));
    final timeStr =
        '${dt.year}-${dt.month.toString().padLeft(2, '0')}-${dt.day.toString().padLeft(2, '0')} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A).withValues(alpha: 0.85),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFF1E293B)),
      ),
      child: DefaultTextStyle(
        style: const TextStyle(
          fontSize: 11,
          fontFamily: 'monospace',
          color: Color(0xFF94A3B8),
        ),
        child: Wrap(
          spacing: 10,
          children: [
            Text('$symbol · ${timeframe.code}',
                style: const TextStyle(
                    fontWeight: FontWeight.bold, color: Colors.white)),
            Text(timeStr, style: const TextStyle(color: Color(0xFF38BDF8))),
            Text(
                'O: ${IndicatorEngine.formatPrice(candle.open, symbol)}',
                style: const TextStyle(color: Color(0xFFE2E8F0))),
            Text(
                'H: ${IndicatorEngine.formatPrice(candle.high, symbol)}',
                style: const TextStyle(color: Color(0xFFE2E8F0))),
            Text(
                'L: ${IndicatorEngine.formatPrice(candle.low, symbol)}',
                style: const TextStyle(color: Color(0xFFE2E8F0))),
            Text(
                'C: ${IndicatorEngine.formatPrice(candle.close, symbol)}',
                style: TextStyle(color: cColor, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }
}
