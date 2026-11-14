import 'dart:math' as math;
import '../../services/localization_service.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import '../../models/trading_models.dart';
import '../../services/indicator_engine.dart';
import '../../services/market_hours_service.dart';
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
  final ValueChanged<DrawingItem>? onUpdateDrawing;
  final ValueChanged<String>? onDeleteDrawing;
  final VoidCallback onDrawingComplete;
  final List<Position> openPositions;
  final List<PriceAlert> activeAlerts;
  final int timezoneOffsetHours;
  final int secondsUntilSync;
  final bool isSyncing;
  final VoidCallback onManualSync;
  final bool showSyncBadge;
  final int? initialStartIndex;
  final int? initialVisibleCount;
  final void Function(int startIndex, int visibleCount)? onViewportChanged;

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
    this.onUpdateDrawing,
    this.onDeleteDrawing,
    required this.onDrawingComplete,
    required this.openPositions,
    required this.activeAlerts,
    required this.timezoneOffsetHours,
    required this.secondsUntilSync,
    required this.isSyncing,
    required this.onManualSync,
    this.showSyncBadge = true,
    this.initialStartIndex,
    this.initialVisibleCount,
    this.onViewportChanged,
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
  String? _selectedDrawingId;
  int? _draggingHandleIndex;
  (int, double)? _dragLastDataPoint;
  double _panAccum = 0;
  double _priceOffset = 0.0;
  double _priceScale = 1.0;
  bool _isScalingPriceAxis = false;
  bool _isHoveringPriceAxis = false;

  @override
  void initState() {
    super.initState();
    if (widget.initialVisibleCount != null && widget.initialVisibleCount! >= 15) {
      _visibleCount = widget.initialVisibleCount!;
    }
    if (widget.initialStartIndex != null && widget.initialStartIndex! >= 0) {
      _startIndex = widget.initialStartIndex!;
    } else if (widget.candles.isNotEmpty) {
      _startIndex = math.max(0, widget.candles.length - _visibleCount);
    }
    _clampViewport();
  }

  @override
  void didUpdateWidget(covariant NativeChartWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.symbol != widget.symbol ||
        oldWidget.timeframe != widget.timeframe) {
      _selectedDrawingId = null;
      _draggingHandleIndex = null;
      fitContent();
    } else if (_selectedDrawingId != null &&
        !widget.drawings.any((d) => d.id == _selectedDrawingId)) {
      _selectedDrawingId = null;
      _draggingHandleIndex = null;
    } else {
      _clampViewport();
    }
  }

  void fitContent() {
    setState(() {
      _visibleCount = math.min(110, math.max(20, widget.candles.length));
      _startIndex = math.max(0, widget.candles.length - _visibleCount);
      _priceOffset = 0.0;
      _priceScale = 1.0;
    });
    widget.onViewportChanged?.call(_startIndex, _visibleCount);
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

  (double minP, double maxP) _priceBounds(List<Candle> slice) {
    double minP = slice.map((c) => c.low).reduce(math.min);
    double maxP = slice.map((c) => c.high).reduce(math.max);
    for (final pos in widget.openPositions) {
      if (pos.symbol.toUpperCase() == widget.symbol.toUpperCase()) {
        minP = math.min(minP, pos.entryPrice);
        maxP = math.max(maxP, pos.entryPrice);
        if (pos.stopLossPrice != null) {
          minP = math.min(minP, pos.stopLossPrice!);
          maxP = math.max(maxP, pos.stopLossPrice!);
        }
        if (pos.takeProfitPrice != null) {
          minP = math.min(minP, pos.takeProfitPrice!);
          maxP = math.max(maxP, pos.takeProfitPrice!);
        }
      }
    }
    if ((maxP - minP).abs() < 1e-12) {
      maxP += minP * 0.01 + 1e-6;
      minP -= minP * 0.01 + 1e-6;
    }
    final pad = (maxP - minP) * 0.08;
    double lo = minP - pad;
    double hi = maxP + pad;
    if (_priceOffset != 0.0 || _priceScale != 1.0) {
      final mid = (lo + hi) * 0.5;
      final halfSpan = ((hi - lo) * 0.5) / _priceScale.clamp(0.15, 8.0);
      lo = (mid + _priceOffset) - halfSpan;
      hi = (mid + _priceOffset) + halfSpan;
    }
    return (lo, hi);
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

    final (minP, maxP) = _priceBounds(slice);

    final idx = ((pos.dx / chartW) * slice.length)
        .floor()
        .clamp(0, slice.length - 1);
    final price =
        minP + ((chartH - pos.dy.clamp(0, chartH)) / chartH) * (maxP - minP);
    return (slice[idx].timeSeconds, price);
  }

  Offset _dataToOffset(DrawingPoint pt, Size size) {
    final chartW = math.max(10.0, size.width - TradingChartPainter.rightAxisWidth);
    final chartH =
        math.max(10.0, size.height - TradingChartPainter.bottomAxisHeight);
    final safeStart =
        _startIndex.clamp(0, math.max(0, widget.candles.length - 1)).toInt();
    final safeEnd = (safeStart + _visibleCount)
        .clamp(safeStart + 1, widget.candles.length)
        .toInt();
    final slice = widget.candles.sublist(safeStart, safeEnd);
    if (slice.isEmpty) return Offset.zero;

    final (minP, maxP) = _priceBounds(slice);
    final stepX = chartW / math.max(1, slice.length);
    final barSeconds = widget.candles.length >= 2
        ? math.max(
            1,
            widget.candles[1].timeSeconds - widget.candles[0].timeSeconds,
          )
        : 60;

    double x;
    if (pt.timeSeconds <= widget.candles.first.timeSeconds) {
      final barsLeft =
          (widget.candles.first.timeSeconds - pt.timeSeconds) / barSeconds;
      x = (-safeStart - barsLeft + 0.5) * stepX;
    } else if (pt.timeSeconds >= widget.candles.last.timeSeconds) {
      final barsRight =
          (pt.timeSeconds - widget.candles.last.timeSeconds) / barSeconds;
      x = (widget.candles.length - 1 - safeStart + barsRight + 0.5) * stepX;
    } else {
      int lo = 0;
      int hi = widget.candles.length - 1;
      while (lo + 1 < hi) {
        final mid = (lo + hi) >> 1;
        if (widget.candles[mid].timeSeconds <= pt.timeSeconds) {
          lo = mid;
        } else {
          hi = mid;
        }
      }
      final tLo = widget.candles[lo].timeSeconds;
      final tHi = widget.candles[hi].timeSeconds;
      final frac = tHi > tLo ? (pt.timeSeconds - tLo) / (tHi - tLo) : 0.0;
      x = ((lo + frac) - safeStart + 0.5) * stepX;
    }
    final y = chartH - ((pt.price - minP) / (maxP - minP)) * chartH;
    return Offset(x, y);
  }

  double _distToSegment(Offset p, Offset a, Offset b) {
    final dx = b.dx - a.dx;
    final dy = b.dy - a.dy;
    final lenSq = dx * dx + dy * dy;
    if (lenSq < 1e-6) return (p - a).distance;
    final t = (((p.dx - a.dx) * dx + (p.dy - a.dy) * dy) / lenSq).clamp(0.0, 1.0);
    final proj = Offset(a.dx + t * dx, a.dy + t * dy);
    return (p - proj).distance;
  }

  ({String id, int handleIndex})? _hitTestDrawing(Offset pos, Size size) {
    if (widget.candles.isEmpty) return null;
    final chartW = math.max(10.0, size.width - TradingChartPainter.rightAxisWidth);
    const handleRadius = 12.0;
    const hitTolerance = 9.0;

    if (_selectedDrawingId != null) {
      for (final d in widget.drawings) {
        if (d.id != _selectedDrawingId || d.points.isEmpty) continue;
        if (d.tool == DrawingTool.hline) {
          final y = _dataToOffset(d.points.first, size).dy;
          if ((pos - Offset(chartW * 0.5, y)).distance <= handleRadius) {
            return (id: d.id, handleIndex: 0);
          }
        } else {
          for (int i = 0; i < d.points.length; i++) {
            final handlePos = _dataToOffset(d.points[i], size);
            if ((pos - handlePos).distance <= handleRadius) {
              return (id: d.id, handleIndex: i);
            }
          }
        }
      }
    }

    for (final d in widget.drawings.reversed) {
      if (d.points.isEmpty) continue;
      if (d.tool == DrawingTool.hline) {
        final y = _dataToOffset(d.points.first, size).dy;
        if ((pos.dy - y).abs() <= hitTolerance && pos.dx <= chartW) {
          return (id: d.id, handleIndex: -1);
        }
        continue;
      }
      if (d.tool == DrawingTool.text) {
        final p = _dataToOffset(d.points.first, size);
        final estW = math.max(90.0, (d.text?.length ?? 4) * 8.5 + 24);
        final rect = Rect.fromLTWH(p.dx - 8, p.dy - 8, estW, 30);
        if (rect.contains(pos)) {
          return (id: d.id, handleIndex: -1);
        }
        continue;
      }
      if (d.points.length < 2) continue;
      final p1 = _dataToOffset(d.points[0], size);
      final p2 = _dataToOffset(d.points[1], size);
      if (d.tool == DrawingTool.trendline) {
        if (_distToSegment(pos, p1, p2) <= hitTolerance) {
          return (id: d.id, handleIndex: -1);
        }
      } else if (d.tool == DrawingTool.ray) {
        final dx = p2.dx - p1.dx;
        final dy = p2.dy - p1.dy;
        final scale = chartW / math.max(1.0, dx.abs()) * 2;
        final far = Offset(p1.dx + dx * scale, p1.dy + dy * scale);
        if (_distToSegment(pos, p1, far) <= hitTolerance) {
          return (id: d.id, handleIndex: -1);
        }
      } else if (d.tool == DrawingTool.rectangle) {
        final rect = Rect.fromPoints(p1, p2).inflate(hitTolerance * 0.5);
        if (rect.contains(pos)) {
          return (id: d.id, handleIndex: -1);
        }
      } else if (d.tool == DrawingTool.fibonacci) {
        final leftX = math.min(p1.dx, p2.dx) - 8;
        final rightX = math.max(p1.dx, p2.dx) + 90;
        final topY = math.min(p1.dy, p2.dy) - hitTolerance;
        final bottomY = math.max(p1.dy, p2.dy) + hitTolerance;
        if (pos.dx >= leftX &&
            pos.dx <= rightX &&
            pos.dy >= topY &&
            pos.dy <= bottomY) {
          return (id: d.id, handleIndex: -1);
        }
      }
    }
    return null;
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
              return Stack(
                children: [
                  Listener(
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
                    widget.onViewportChanged?.call(_startIndex, _visibleCount);
                  }
                },
                child: MouseRegion(
                  cursor: _isHoveringPriceAxis || _isScalingPriceAxis
                      ? SystemMouseCursors.resizeUpDown
                      : widget.activeTool == DrawingTool.cursor
                          ? SystemMouseCursors.precise
                          : SystemMouseCursors.click,
                  onHover: (e) {
                    final chartW = math.max(
                        10.0, size.width - TradingChartPainter.rightAxisWidth);
                    final onAxis = e.localPosition.dx >= chartW;
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
                      _isHoveringPriceAxis = onAxis;
                      _crosshair = onAxis ? null : e.localPosition;
                      _hoveredIndex =
                          onAxis ? null : (safeStart + localIdx).toInt();
                    });
                  },
                  onExit: (_) => setState(() {
                    _isHoveringPriceAxis = false;
                    _crosshair = null;
                    _hoveredIndex = null;
                  }),
                  child: GestureDetector(
                    onDoubleTapDown: (details) {
                      final chartW = math.max(10.0,
                          size.width - TradingChartPainter.rightAxisWidth);
                      if (details.localPosition.dx >= chartW) {
                        setState(() {
                          _priceOffset = 0.0;
                          _priceScale = 1.0;
                        });
                      }
                    },
                    onTapDown: (details) async {
                      if (widget.activeTool == DrawingTool.cursor) {
                        final hit = _hitTestDrawing(details.localPosition, size);
                        setState(() => _selectedDrawingId = hit?.id);
                        return;
                      }
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
                      final chartW = math.max(10.0,
                          size.width - TradingChartPainter.rightAxisWidth);
                      if (widget.activeTool == DrawingTool.cursor &&
                          details.localPosition.dx >= chartW) {
                        setState(() => _isScalingPriceAxis = true);
                        return;
                      }
                      if (widget.activeTool == DrawingTool.cursor) {
                        final hit = _hitTestDrawing(details.localPosition, size);
                        if (hit != null && widget.onUpdateDrawing != null) {
                          setState(() {
                            _selectedDrawingId = hit.id;
                            _draggingHandleIndex = hit.handleIndex;
                            _dragLastDataPoint =
                                _offsetToData(details.localPosition, size);
                          });
                        } else {
                          setState(() {
                            _draggingHandleIndex = null;
                            _dragLastDataPoint = null;
                          });
                        }
                        return;
                      }
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
                      if (_selectedDrawingId != null &&
                          _draggingHandleIndex != null &&
                          widget.onUpdateDrawing != null) {
                        final pt = _offsetToData(details.localPosition, size);
                        if (pt == null) return;
                        final idx = widget.drawings
                            .indexWhere((d) => d.id == _selectedDrawingId);
                        if (idx == -1) return;
                        final current = widget.drawings[idx];
                        if (_draggingHandleIndex! >= 0 &&
                            _draggingHandleIndex! < current.points.length) {
                          final updatedPts = [...current.points];
                          updatedPts[_draggingHandleIndex!] = DrawingPoint(
                            timeSeconds: pt.$1,
                            price: pt.$2,
                          );
                          widget.onUpdateDrawing!(
                              current.copyWith(points: updatedPts));
                        } else if (_draggingHandleIndex == -1 &&
                            _dragLastDataPoint != null) {
                          final dt = pt.$1 - _dragLastDataPoint!.$1;
                          final dp = pt.$2 - _dragLastDataPoint!.$2;
                          final updatedPts = current.points
                              .map((p) => DrawingPoint(
                                    timeSeconds: p.timeSeconds + dt,
                                    price: p.price + dp,
                                  ))
                              .toList();
                          _dragLastDataPoint = pt;
                          widget.onUpdateDrawing!(
                              current.copyWith(points: updatedPts));
                        }
                        return;
                      }
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
                      if (_isScalingPriceAxis) {
                        setState(() {
                          _priceScale = (_priceScale *
                                  math.exp(-details.delta.dy * 0.008))
                              .clamp(0.15, 8.0);
                        });
                        return;
                      }
                      final chartW = math.max(
                          10.0, size.width - TradingChartPainter.rightAxisWidth);
                      final chartH = math.max(
                          10.0, size.height - TradingChartPainter.bottomAxisHeight);
                      final stepPx = chartW / math.max(1, _visibleCount);
                      _panAccum += details.delta.dx;
                      final barsShift = (_panAccum / stepPx).truncate();
                      bool changedViewport = false;
                      setState(() {
                        if (barsShift != 0) {
                          _panAccum -= barsShift * stepPx;
                          final maxStart = math.max(
                              0, widget.candles.length - _visibleCount);
                          _startIndex =
                              (_startIndex - barsShift).clamp(0, maxStart);
                          changedViewport = true;
                        }
                        if (details.delta.dy != 0) {
                          final safeStart = _startIndex
                              .clamp(0, math.max(0, widget.candles.length - 1))
                              .toInt();
                          final safeEnd = (safeStart + _visibleCount)
                              .clamp(safeStart + 1, widget.candles.length)
                              .toInt();
                          final slice =
                              widget.candles.sublist(safeStart, safeEnd);
                          if (slice.isNotEmpty) {
                            final (lo, hi) = _priceBounds(slice);
                            _priceOffset +=
                                (details.delta.dy / chartH) * (hi - lo);
                          }
                        }
                      });
                      if (changedViewport) {
                        widget.onViewportChanged
                            ?.call(_startIndex, _visibleCount);
                      }
                    },
                    onPanEnd: (_) {
                      _isScalingPriceAxis = false;
                      _draggingHandleIndex = null;
                      _dragLastDataPoint = null;
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
                            selectedDrawingId: _selectedDrawingId,
                            startIndex: _startIndex,
                            visibleCount: _visibleCount,
                            priceOffset: _priceOffset,
                            priceScale: _priceScale,
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
                            marketStatus:
                                MarketHoursService.getStatus(widget.symbol),
                          ),
                      ],
                    ),
                  ),
                ),
              ),
                  if (_priceOffset != 0.0 || _priceScale != 1.0)
                    Positioned(
                      bottom: 34,
                      right: 94,
                      child: Material(
                        color: const Color(0xFF0F172A).withValues(alpha: 0.9),
                        borderRadius: BorderRadius.circular(6),
                        child: InkWell(
                          onTap: () => setState(() {
                            _priceOffset = 0.0;
                            _priceScale = 1.0;
                          }),
                          borderRadius: BorderRadius.circular(6),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(
                                  color: Colors.white.withValues(alpha: 0.16)),
                            ),
                            child: const Text(
                              'Auto Scale',
                              style: TextStyle(
                                fontSize: 11,
                                color: Color(0xFF38BDF8),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  if (_selectedDrawingId != null &&
                      widget.drawings
                          .any((d) => d.id == _selectedDrawingId))
                    Positioned(
                      bottom: 34,
                      left: 12,
                      child: _buildDrawingInspector(
                        widget.drawings
                            .firstWhere((d) => d.id == _selectedDrawingId),
                      ),
                    ),
                ],
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

  Widget _buildDrawingInspector(DrawingItem d) {
    const palette = [
      0xFF38BDF8, // Cyan
      0xFFF59E0B, // Amber
      0xFF22C55E, // Green
      0xFFEF4444, // Red
      0xFFA855F7, // Purple
      0xFFE2E8F0, // White
    ];
    return Material(
      elevation: 6,
      color: const Color(0xFF0F172A).withValues(alpha: 0.94),
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.white.withValues(alpha: 0.14)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              d.tool.label,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: Colors.white70,
              ),
            ),
            const SizedBox(width: 8),
            for (final hex in palette)
              InkWell(
                onTap: () => widget.onUpdateDrawing
                    ?.call(d.copyWith(colorValue: hex)),
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  width: 16,
                  height: 16,
                  margin: const EdgeInsets.symmetric(horizontal: 2),
                  decoration: BoxDecoration(
                    color: Color(hex),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: d.colorValue == hex
                          ? Colors.white
                          : Colors.transparent,
                      width: 1.8,
                    ),
                  ),
                ),
              ),
            const SizedBox(width: 6),
            for (final w in [1.4, 2.2, 3.4])
              InkWell(
                onTap: () =>
                    widget.onUpdateDrawing?.call(d.copyWith(strokeWidth: w)),
                borderRadius: BorderRadius.circular(4),
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 5, vertical: 3),
                  decoration: BoxDecoration(
                    color: (d.strokeWidth - w).abs() < 0.2
                        ? Colors.white.withValues(alpha: 0.18)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    '${w.toStringAsFixed(0)}px',
                    style: const TextStyle(fontSize: 10, color: Colors.white),
                  ),
                ),
              ),
            const SizedBox(width: 4),
            InkWell(
              onTap: () => widget.onUpdateDrawing
                  ?.call(d.copyWith(isDashed: !d.isDashed)),
              borderRadius: BorderRadius.circular(4),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                decoration: BoxDecoration(
                  color: d.isDashed
                      ? Colors.white.withValues(alpha: 0.18)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  d.isDashed ? 'Dashed' : 'Solid',
                  style: const TextStyle(fontSize: 10, color: Colors.white),
                ),
              ),
            ),
            if (d.tool == DrawingTool.text) ...[
              const SizedBox(width: 4),
              IconButton(
                icon: const Icon(Icons.edit, size: 15, color: Colors.white70),
                tooltip: 'Edit Text',
                constraints: const BoxConstraints(),
                padding: const EdgeInsets.all(4),
                onPressed: () async {
                  final edited =
                      await _promptText(context, initialText: d.text ?? '');
                  if (edited != null && edited.isNotEmpty) {
                    widget.onUpdateDrawing?.call(d.copyWith(text: edited));
                  }
                },
              ),
            ],
            const SizedBox(width: 4),
            IconButton(
              icon: const Icon(Icons.delete_outline,
                  size: 16, color: Color(0xFFEF4444)),
              tooltip: 'Delete Drawing',
              constraints: const BoxConstraints(),
              padding: const EdgeInsets.all(4),
              onPressed: () {
                widget.onDeleteDrawing?.call(d.id);
                setState(() => _selectedDrawingId = null);
              },
            ),
            IconButton(
              icon: const Icon(Icons.close, size: 15, color: Colors.white54),
              tooltip: 'Deselect',
              constraints: const BoxConstraints(),
              padding: const EdgeInsets.all(4),
              onPressed: () => setState(() => _selectedDrawingId = null),
            ),
          ],
        ),
      ),
    );
  }

  Future<String?> _promptText(
    BuildContext context, {
    String initialText = '',
  }) async {
    final ctrl = TextEditingController(text: initialText);
    return showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(AppL10n.tr('chart.addAnnotation', 'Add Chart Annotation')),
        content: TextField(
          controller: ctrl,
          autofocus: true,
          decoration: InputDecoration(
              hintText: AppL10n.tr('chart.enterNote', 'Enter chart note...')),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(AppL10n.tr('common.cancel', 'Cancel')),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, ctrl.text.trim()),
            child: Text(initialText.isEmpty
                ? AppL10n.tr('common.add', 'Add')
                : AppL10n.tr('common.save', 'Save')),
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
