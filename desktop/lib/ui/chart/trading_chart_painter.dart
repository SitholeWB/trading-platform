import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../models/trading_models.dart';
import '../../services/indicator_engine.dart';

class TradingChartPainter extends CustomPainter {
  final String symbol;
  final List<Candle> candles;
  final ChartType chartType;
  final IndicatorSettings indicators;
  final List<Position> openPositions;
  final List<PriceAlert> activeAlerts;
  final List<DrawingItem> drawings;
  final DrawingItem? draftDrawing;
  final String? selectedDrawingId;
  final int startIndex;
  final int visibleCount;
  final Offset? crosshairPos;
  final int timezoneOffsetHours;
  final bool isDark;

  TradingChartPainter({
    required this.symbol,
    required this.candles,
    required this.chartType,
    required this.indicators,
    required this.openPositions,
    required this.activeAlerts,
    required this.drawings,
    this.draftDrawing,
    this.selectedDrawingId,
    required this.startIndex,
    required this.visibleCount,
    this.crosshairPos,
    required this.timezoneOffsetHours,
    required this.isDark,
  });

  static const double rightAxisWidth = 86.0;
  static const double bottomAxisHeight = 26.0;

  @override
  void paint(Canvas canvas, Size size) {
    final chartW = math.max(10.0, size.width - rightAxisWidth);
    final chartH = math.max(10.0, size.height - bottomAxisHeight);

    final bgColor = isDark ? const Color(0xFF090E1A) : const Color(0xFFF8FAFC);
    final gridColor = isDark
        ? const Color(0xFF1E293B).withValues(alpha: 0.45)
        : const Color(0xFFE2E8F0);
    final axisTextColor =
        isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569);

    canvas.drawRect(
      Rect.fromLTWH(0, 0, size.width, size.height),
      Paint()..color = bgColor,
    );

    if (candles.isEmpty) return;

    final displayCandles = chartType == ChartType.heikinAshi
        ? IndicatorEngine.calculateHeikinAshi(candles, symbol)
        : candles;

    final safeStart =
        startIndex.clamp(0, math.max(0, displayCandles.length - 1)).toInt();
    final safeEnd = (safeStart + visibleCount)
        .clamp(safeStart + 1, displayCandles.length)
        .toInt();
    final slice = displayCandles.sublist(safeStart, safeEnd);
    if (slice.isEmpty) return;

    double minP = double.infinity;
    double maxP = -double.infinity;
    double maxVol = 0;

    for (final c in slice) {
      if (c.low < minP) minP = c.low;
      if (c.high > maxP) maxP = c.high;
      if (c.volume > maxVol) maxVol = c.volume;
    }

    for (final pos in openPositions) {
      if (pos.symbol.toUpperCase() == symbol.toUpperCase()) {
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
    minP -= pad;
    maxP += pad;

    double priceToY(double p) =>
        chartH - ((p - minP) / (maxP - minP)) * chartH;
    double yToPrice(double y) =>
        minP + ((chartH - y) / chartH) * (maxP - minP);

    final stepX = chartW / math.max(1, slice.length);
    double indexToX(int localIdx) => (localIdx + 0.5) * stepX;

    final extraPrices = slice
        .take(25)
        .expand((c) => [c.open, c.high, c.low, c.close])
        .toList();

    // 1. Horizontal grid + dynamic price axis labels
    const rows = 6;
    final gridPaint = Paint()
      ..color = gridColor
      ..strokeWidth = 1;

    for (int i = 0; i <= rows; i++) {
      final y = (chartH / rows) * i;
      canvas.drawLine(Offset(0, y), Offset(chartW, y), gridPaint);
      final priceVal = yToPrice(y);
      final label = IndicatorEngine.formatPrice(
        priceVal,
        symbol,
        extraPrices: extraPrices,
      );
      _drawText(
        canvas,
        label,
        Offset(chartW + 6, y - 6),
        TextStyle(
          color: axisTextColor,
          fontSize: 10,
          fontFamily: 'monospace',
        ),
      );
    }

    // 2. Vertical grid + timezone-adjusted timestamps
    final vStep = math.max(1, (slice.length / 6).floor());
    for (int i = 0; i < slice.length; i += vStep) {
      final x = indexToX(i);
      canvas.drawLine(Offset(x, 0), Offset(x, chartH), gridPaint);
      final dt = slice[i]
          .timestamp
          .toUtc()
          .add(Duration(hours: timezoneOffsetHours));
      final hh = dt.hour.toString().padLeft(2, '0');
      final mm = dt.minute.toString().padLeft(2, '0');
      final dd = '${dt.month}/${dt.day}';
      _drawText(
        canvas,
        '$dd $hh:$mm',
        Offset((x - 24).clamp(2.0, chartW - 60), chartH + 6),
        TextStyle(
          color: axisTextColor,
          fontSize: 9.5,
          fontFamily: 'monospace',
        ),
      );
    }

    canvas.save();
    canvas.clipRect(Rect.fromLTWH(0, 0, chartW, chartH));

    // 3. Volume Histogram (bottom 18%)
    if (indicators.volume && maxVol > 0) {
      final volH = chartH * 0.18;
      final barW = math.max(1.5, stepX * 0.65);
      for (int i = 0; i < slice.length; i++) {
        final c = slice[i];
        final h = (c.volume / maxVol) * volH;
        final x = indexToX(i) - barW / 2;
        final isUp = c.close >= c.open;
        canvas.drawRect(
          Rect.fromLTWH(x, chartH - h, barW, h),
          Paint()
            ..color = (isUp
                    ? const Color(0xFF10B981)
                    : const Color(0xFFEF4444))
                .withValues(alpha: 0.22),
        );
      }
    }

    // 4. Main Price Series
    final bodyW = math.max(2.0, stepX * 0.68);
    const upColor = Color(0xFF10B981);
    const downColor = Color(0xFFEF4444);

    if (chartType == ChartType.candlestick ||
        chartType == ChartType.heikinAshi) {
      for (int i = 0; i < slice.length; i++) {
        final c = slice[i];
        final x = indexToX(i);
        final isUp = c.close >= c.open;
        final color = isUp ? upColor : downColor;
        final yH = priceToY(c.high);
        final yL = priceToY(c.low);
        final yO = priceToY(c.open);
        final yC = priceToY(c.close);

        canvas.drawLine(
          Offset(x, yH),
          Offset(x, yL),
          Paint()
            ..color = color
            ..strokeWidth = 1.2,
        );
        final top = math.min(yO, yC);
        final height = math.max(1.5, (yO - yC).abs());
        canvas.drawRect(
          Rect.fromLTWH(x - bodyW / 2, top, bodyW, height),
          Paint()..color = color,
        );
      }
    } else if (chartType == ChartType.bar) {
      final tickW = math.max(2.0, bodyW * 0.5);
      for (int i = 0; i < slice.length; i++) {
        final c = slice[i];
        final x = indexToX(i);
        final color = c.close >= c.open ? upColor : downColor;
        final paint = Paint()
          ..color = color
          ..strokeWidth = 1.5;
        canvas.drawLine(
            Offset(x, priceToY(c.high)), Offset(x, priceToY(c.low)), paint);
        canvas.drawLine(Offset(x - tickW, priceToY(c.open)),
            Offset(x, priceToY(c.open)), paint);
        canvas.drawLine(Offset(x, priceToY(c.close)),
            Offset(x + tickW, priceToY(c.close)), paint);
      }
    } else {
      final path = Path();
      final fillPath = Path();
      for (int i = 0; i < slice.length; i++) {
        final x = indexToX(i);
        final y = priceToY(slice[i].close);
        if (i == 0) {
          path.moveTo(x, y);
          fillPath.moveTo(x, chartH);
          fillPath.lineTo(x, y);
        } else {
          path.lineTo(x, y);
          fillPath.lineTo(x, y);
        }
      }
      fillPath.lineTo(indexToX(slice.length - 1), chartH);
      fillPath.close();

      if (chartType == ChartType.area || chartType == ChartType.baseline) {
        canvas.drawPath(
          fillPath,
          Paint()
            ..shader = LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                const Color(0xFF38BDF8).withValues(alpha: 0.32),
                const Color(0xFF38BDF8).withValues(alpha: 0.02),
              ],
            ).createShader(Rect.fromLTWH(0, 0, chartW, chartH)),
        );
      }
      canvas.drawPath(
        path,
        Paint()
          ..color = chartType == ChartType.baseline
              ? const Color(0xFF10B981)
              : const Color(0xFF38BDF8)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2.0,
      );
    }

    // 5. Technical Indicator Overlays
    final timeToLocalIdx = <int, int>{
      for (int i = 0; i < slice.length; i++) slice[i].timeSeconds: i,
    };

    void drawOverlayLine(List<TimeValuePoint> pts, Color color,
        {double width = 1.4}) {
      final path = Path();
      bool started = false;
      for (final pt in pts) {
        final idx = timeToLocalIdx[pt.timeSeconds];
        if (idx == null) continue;
        final x = indexToX(idx);
        final y = priceToY(pt.value);
        if (!started) {
          path.moveTo(x, y);
          started = true;
        } else {
          path.lineTo(x, y);
        }
      }
      if (started) {
        canvas.drawPath(
          path,
          Paint()
            ..color = color
            ..style = PaintingStyle.stroke
            ..strokeWidth = width,
        );
      }
    }

    if (indicators.ema20) {
      drawOverlayLine(
        IndicatorEngine.calculateEMA(candles, 20, symbol),
        const Color(0xFF06B6D4),
      );
    }
    if (indicators.ema50) {
      drawOverlayLine(
        IndicatorEngine.calculateEMA(candles, 50, symbol),
        const Color(0xFFF97316),
      );
    }
    if (indicators.ema200) {
      drawOverlayLine(
        IndicatorEngine.calculateEMA(candles, 200, symbol),
        const Color(0xFFE11D48),
      );
    }
    if (indicators.sma20) {
      drawOverlayLine(
        IndicatorEngine.calculateSMA(candles, 20, symbol),
        const Color(0xFFFACC15),
      );
    }
    if (indicators.vwap) {
      drawOverlayLine(
        IndicatorEngine.calculateVWAP(candles, symbol),
        const Color(0xFFEC4899),
      );
    }
    if (indicators.bollinger) {
      final bb = IndicatorEngine.calculateBollingerBands(
        candles,
        indicators.bbPeriod,
        indicators.bbStdDev,
        symbol,
      );
      drawOverlayLine(
        bb.map((b) => TimeValuePoint(b.timeSeconds, b.upper)).toList(),
        const Color(0xFFA855F7).withValues(alpha: 0.75),
        width: 1.1,
      );
      drawOverlayLine(
        bb.map((b) => TimeValuePoint(b.timeSeconds, b.middle)).toList(),
        const Color(0xFFA855F7),
        width: 1.3,
      );
      drawOverlayLine(
        bb.map((b) => TimeValuePoint(b.timeSeconds, b.lower)).toList(),
        const Color(0xFFA855F7).withValues(alpha: 0.75),
        width: 1.1,
      );
    }
    if (indicators.supertrend) {
      final st = IndicatorEngine.calculateSupertrend(candles, 10, 3.0, symbol);
      for (int i = 1; i < st.length; i++) {
        final i1 = timeToLocalIdx[st[i - 1].timeSeconds];
        final i2 = timeToLocalIdx[st[i].timeSeconds];
        if (i1 == null || i2 == null) continue;
        canvas.drawLine(
          Offset(indexToX(i1), priceToY(st[i - 1].value)),
          Offset(indexToX(i2), priceToY(st[i].value)),
          Paint()
            ..color = st[i].direction == 1 ? upColor : downColor
            ..strokeWidth = 1.8,
        );
      }
    }
    if (indicators.ichimoku) {
      final ichi = IndicatorEngine.calculateIchimoku(candles, symbol);
      drawOverlayLine(
        ichi
            .where((p) => p.tenkan != null)
            .map((p) => TimeValuePoint(p.timeSeconds, p.tenkan!))
            .toList(),
        const Color(0xFF38BDF8),
        width: 1.1,
      );
      drawOverlayLine(
        ichi
            .where((p) => p.kijun != null)
            .map((p) => TimeValuePoint(p.timeSeconds, p.kijun!))
            .toList(),
        const Color(0xFFF43F5E),
        width: 1.1,
      );
    }

    // 6. Active Price Alerts & Open Positions SL/TP Lines
    for (final alert in activeAlerts) {
      if (alert.symbol.toUpperCase() == symbol.toUpperCase() &&
          !alert.triggered) {
        final y = priceToY(alert.targetPrice);
        _drawDashedLine(
            canvas, Offset(0, y), Offset(chartW, y), const Color(0xFFF59E0B));
      }
    }

    for (final pos in openPositions) {
      if (pos.symbol.toUpperCase() != symbol.toUpperCase()) continue;
      final ey = priceToY(pos.entryPrice);
      _drawDashedLine(
          canvas, Offset(0, ey), Offset(chartW, ey), const Color(0xFF38BDF8));
      if (pos.stopLossPrice != null) {
        final sy = priceToY(pos.stopLossPrice!);
        _drawDashedLine(canvas, Offset(0, sy), Offset(chartW, sy), downColor);
      }
      if (pos.takeProfitPrice != null) {
        final ty = priceToY(pos.takeProfitPrice!);
        _drawDashedLine(canvas, Offset(0, ty), Offset(chartW, ty), upColor);
      }
    }

    // 7. User Drawings
    final barSeconds = displayCandles.length >= 2
        ? math.max(
            1,
            displayCandles[1].timeSeconds - displayCandles[0].timeSeconds,
          )
        : 60;
    double timeToX(int timeSeconds) {
      final local = timeToLocalIdx[timeSeconds];
      if (local != null) return indexToX(local);
      if (displayCandles.isEmpty) return 0;
      if (timeSeconds <= displayCandles.first.timeSeconds) {
        final barsLeft =
            (displayCandles.first.timeSeconds - timeSeconds) / barSeconds;
        return (-safeStart - barsLeft + 0.5) * stepX;
      }
      if (timeSeconds >= displayCandles.last.timeSeconds) {
        final barsRight =
            (timeSeconds - displayCandles.last.timeSeconds) / barSeconds;
        return (displayCandles.length - 1 - safeStart + barsRight + 0.5) *
            stepX;
      }
      int lo = 0;
      int hi = displayCandles.length - 1;
      while (lo + 1 < hi) {
        final mid = (lo + hi) >> 1;
        if (displayCandles[mid].timeSeconds <= timeSeconds) {
          lo = mid;
        } else {
          hi = mid;
        }
      }
      final tLo = displayCandles[lo].timeSeconds;
      final tHi = displayCandles[hi].timeSeconds;
      final frac = tHi > tLo ? (timeSeconds - tLo) / (tHi - tLo) : 0.0;
      return ((lo + frac) - safeStart + 0.5) * stepX;
    }

    final allDrawings = [...drawings, ?draftDrawing];
    for (final d in allDrawings) {
      _paintDrawing(
        canvas,
        d,
        chartW,
        chartH,
        timeToX,
        priceToY,
        extraPrices,
        isSelected: d.id == selectedDrawingId,
      );
    }

    canvas.restore();

    // 8. Live Last Price Tag on Right Axis
    final lastPrice = slice.last.close;
    final lastY = priceToY(lastPrice).clamp(8.0, chartH - 12.0);
    final isLastUp = slice.last.close >= slice.last.open;
    final tagColor = isLastUp ? upColor : downColor;

    _drawDashedLine(
      canvas,
      Offset(0, lastY),
      Offset(chartW, lastY),
      tagColor.withValues(alpha: 0.6),
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(chartW + 2, lastY - 10, rightAxisWidth - 4, 20),
        const Radius.circular(4),
      ),
      Paint()..color = tagColor,
    );
    _drawText(
      canvas,
      IndicatorEngine.formatPrice(lastPrice, symbol, extraPrices: extraPrices),
      Offset(chartW + 6, lastY - 6),
      const TextStyle(
        color: Colors.white,
        fontSize: 10,
        fontWeight: FontWeight.bold,
        fontFamily: 'monospace',
      ),
    );

    // 9. Axis Separator Lines
    final borderPaint = Paint()
      ..color = isDark ? const Color(0xFF1E293B) : const Color(0xFFCBD5E1)
      ..strokeWidth = 1;
    canvas.drawLine(
        Offset(chartW, 0), Offset(chartW, size.height), borderPaint);
    canvas.drawLine(
        Offset(0, chartH), Offset(size.width, chartH), borderPaint);

    // 10. Crosshair
    if (crosshairPos != null &&
        crosshairPos!.dx >= 0 &&
        crosshairPos!.dx <= chartW &&
        crosshairPos!.dy >= 0 &&
        crosshairPos!.dy <= chartH) {
      final chPaint = Paint()
        ..color = const Color(0xFF94A3B8).withValues(alpha: 0.55)
        ..strokeWidth = 1;
      canvas.drawLine(
        Offset(crosshairPos!.dx, 0),
        Offset(crosshairPos!.dx, chartH),
        chPaint,
      );
      canvas.drawLine(
        Offset(0, crosshairPos!.dy),
        Offset(chartW, crosshairPos!.dy),
        chPaint,
      );

      final hoverPrice = yToPrice(crosshairPos!.dy);
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(
              chartW + 2, crosshairPos!.dy - 10, rightAxisWidth - 4, 20),
          const Radius.circular(4),
        ),
        Paint()..color = const Color(0xFF334155),
      );
      _drawText(
        canvas,
        IndicatorEngine.formatPrice(hoverPrice, symbol,
            extraPrices: extraPrices),
        Offset(chartW + 6, crosshairPos!.dy - 6),
        const TextStyle(
          color: Colors.white,
          fontSize: 10,
          fontFamily: 'monospace',
        ),
      );
    }
  }

  void _paintDrawing(
    Canvas canvas,
    DrawingItem d,
    double chartW,
    double chartH,
    double Function(int) timeToX,
    double Function(double) priceToY,
    List<double> extraPrices, {
    bool isSelected = false,
  }) {
    if (d.points.isEmpty) return;
    final paint = Paint()
      ..color = d.color
      ..strokeWidth = d.strokeWidth
      ..style = PaintingStyle.stroke;

    Offset toOffset(DrawingPoint pt) =>
        Offset(timeToX(pt.timeSeconds), priceToY(pt.price));

    void drawHandle(Offset center) {
      canvas.drawCircle(
        center,
        5.5,
        Paint()
          ..color = isDark ? const Color(0xFF0F172A) : Colors.white
          ..style = PaintingStyle.fill,
      );
      canvas.drawCircle(
        center,
        5.5,
        Paint()
          ..color = d.color
          ..strokeWidth = 2.0
          ..style = PaintingStyle.stroke,
      );
    }

    if (d.tool == DrawingTool.hline) {
      final y = priceToY(d.points.first.price);
      _drawStyledLine(canvas, Offset(0, y), Offset(chartW, y), paint,
          isDashed: d.isDashed);
      if (isSelected) {
        drawHandle(Offset(chartW * 0.5, y));
      }
      return;
    }

    if (d.tool == DrawingTool.text) {
      final p = toOffset(d.points.first);
      _drawText(
        canvas,
        d.text ?? 'Note',
        p,
        TextStyle(
          color: d.color,
          fontSize: 11 + (d.strokeWidth - 1.8).clamp(0, 4),
          fontWeight: FontWeight.bold,
        ),
      );
      if (isSelected) {
        drawHandle(p);
      }
      return;
    }

    if (d.points.length < 2) return;
    final p1 = toOffset(d.points[0]);
    final p2 = toOffset(d.points[1]);

    if (d.tool == DrawingTool.trendline) {
      _drawStyledLine(canvas, p1, p2, paint, isDashed: d.isDashed);
    } else if (d.tool == DrawingTool.ray) {
      final dx = p2.dx - p1.dx;
      final dy = p2.dy - p1.dy;
      if (dx.abs() >= 1e-3 || dy.abs() >= 1e-3) {
        final scale = chartW / math.max(1.0, dx.abs()) * 2;
        _drawStyledLine(
          canvas,
          p1,
          Offset(p1.dx + dx * scale, p1.dy + dy * scale),
          paint,
          isDashed: d.isDashed,
        );
      }
    } else if (d.tool == DrawingTool.rectangle) {
      final rect = Rect.fromPoints(p1, p2);
      canvas.drawRect(
        rect,
        Paint()..color = d.color.withValues(alpha: 0.14),
      );
      if (d.isDashed) {
        _drawStyledLine(canvas, rect.topLeft, rect.topRight, paint,
            isDashed: true);
        _drawStyledLine(canvas, rect.topRight, rect.bottomRight, paint,
            isDashed: true);
        _drawStyledLine(canvas, rect.bottomRight, rect.bottomLeft, paint,
            isDashed: true);
        _drawStyledLine(canvas, rect.bottomLeft, rect.topLeft, paint,
            isDashed: true);
      } else {
        canvas.drawRect(rect, paint);
      }
    } else if (d.tool == DrawingTool.fibonacci) {
      const levels = [0.0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0];
      final pr1 = d.points[0].price;
      final pr2 = d.points[1].price;
      final leftX = math.min(p1.dx, p2.dx);
      final rightX = math.max(p1.dx, p2.dx) + 80;
      if (rightX >= 0 && leftX <= chartW) {
        final labelX = math.max(4.0, leftX + 4);
        final fibPaint = Paint()
          ..color = d.color.withValues(alpha: 0.75)
          ..strokeWidth = math.max(1.0, d.strokeWidth * 0.7);
        for (final lvl in levels) {
          final price = pr1 + (pr2 - pr1) * lvl;
          final y = priceToY(price);
          _drawStyledLine(
            canvas,
            Offset(leftX, y),
            Offset(rightX, y),
            fibPaint,
            isDashed: d.isDashed,
          );
          _drawText(
            canvas,
            '${(lvl * 100).toStringAsFixed(1)}% (${IndicatorEngine.formatPrice(price, symbol, extraPrices: extraPrices)})',
            Offset(labelX, y - 12),
            TextStyle(color: d.color, fontSize: 9.5, fontFamily: 'monospace'),
          );
        }
      }
    }

    if (isSelected) {
      drawHandle(p1);
      drawHandle(p2);
    }
  }

  void _drawStyledLine(
    Canvas canvas,
    Offset p1,
    Offset p2,
    Paint paint, {
    required bool isDashed,
  }) {
    if (!isDashed) {
      canvas.drawLine(p1, p2, paint);
      return;
    }
    final dx = p2.dx - p1.dx;
    final dy = p2.dy - p1.dy;
    final totalLen = math.sqrt(dx * dx + dy * dy);
    if (totalLen < 1e-3) return;
    final ux = dx / totalLen;
    final uy = dy / totalLen;
    const dash = 6.0;
    const gap = 4.0;
    double dist = 0.0;
    while (dist < totalLen) {
      final next = math.min(dist + dash, totalLen);
      canvas.drawLine(
        Offset(p1.dx + ux * dist, p1.dy + uy * dist),
        Offset(p1.dx + ux * next, p1.dy + uy * next),
        paint,
      );
      dist += dash + gap;
    }
  }

  void _drawDashedLine(Canvas canvas, Offset p1, Offset p2, Color color) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 1.1;
    const dash = 5.0;
    const gap = 4.0;
    double x = p1.dx;
    while (x < p2.dx) {
      canvas.drawLine(
          Offset(x, p1.dy), Offset(math.min(x + dash, p2.dx), p2.dy), paint);
      x += dash + gap;
    }
  }

  void _drawText(Canvas canvas, String text, Offset pos, TextStyle style) {
    final tp = TextPainter(
      text: TextSpan(text: text, style: style),
      textDirection: TextDirection.ltr,
    )..layout();
    tp.paint(canvas, pos);
  }

  @override
  bool shouldRepaint(covariant TradingChartPainter oldDelegate) => true;
}

class OscillatorSubPanePainter extends CustomPainter {
  final List<Candle> candles;
  final int startIndex;
  final int visibleCount;
  final bool isRsi;
  final int rsiPeriod;
  final int macdFast;
  final int macdSlow;
  final int macdSignal;
  final bool isDark;

  OscillatorSubPanePainter({
    required this.candles,
    required this.startIndex,
    required this.visibleCount,
    required this.isRsi,
    this.rsiPeriod = 14,
    this.macdFast = 12,
    this.macdSlow = 26,
    this.macdSignal = 9,
    required this.isDark,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final chartW = math.max(10.0, size.width - TradingChartPainter.rightAxisWidth);
    final h = size.height;
    canvas.drawRect(
      Rect.fromLTWH(0, 0, size.width, h),
      Paint()
        ..color = isDark ? const Color(0xFF070B14) : const Color(0xFFF1F5F9),
    );
    if (candles.isEmpty) return;

    final safeStart =
        startIndex.clamp(0, math.max(0, candles.length - 1)).toInt();
    final safeEnd =
        (safeStart + visibleCount).clamp(safeStart + 1, candles.length).toInt();
    final slice = candles.sublist(safeStart, safeEnd);
    final stepX = chartW / math.max(1, slice.length);
    final timeToIdx = {
      for (int i = 0; i < slice.length; i++) slice[i].timeSeconds: i,
    };

    if (isRsi) {
      final pts = IndicatorEngine.calculateRSI(candles, rsiPeriod);
      double yFor(double v) => h - (v.clamp(0, 100) / 100.0) * h;

      for (final lvl in [30.0, 50.0, 70.0]) {
        final y = yFor(lvl);
        canvas.drawLine(
          Offset(0, y),
          Offset(chartW, y),
          Paint()
            ..color = const Color(0xFF334155).withValues(alpha: 0.6)
            ..strokeWidth = 1,
        );
      }

      final path = Path();
      bool started = false;
      for (final p in pts) {
        final idx = timeToIdx[p.timeSeconds];
        if (idx == null) continue;
        final x = (idx + 0.5) * stepX;
        final y = yFor(p.value);
        if (!started) {
          path.moveTo(x, y);
          started = true;
        } else {
          path.lineTo(x, y);
        }
      }
      if (started) {
        canvas.drawPath(
          path,
          Paint()
            ..color = const Color(0xFFF59E0B)
            ..style = PaintingStyle.stroke
            ..strokeWidth = 1.6,
        );
      }
    } else {
      final pts =
          IndicatorEngine.calculateMACD(candles, macdFast, macdSlow, macdSignal);
      final visPts = pts.where((p) => timeToIdx.containsKey(p.timeSeconds)).toList();
      if (visPts.isEmpty) return;
      double minV = 0;
      double maxV = 0;
      for (final p in visPts) {
        minV = math.min(minV, math.min(p.macd, math.min(p.signal, p.histogram)));
        maxV = math.max(maxV, math.max(p.macd, math.max(p.signal, p.histogram)));
      }
      if ((maxV - minV).abs() < 1e-9) {
        maxV += 1;
        minV -= 1;
      }
      double yFor(double v) => h - ((v - minV) / (maxV - minV)) * h;
      final zeroY = yFor(0);

      final barW = math.max(1.5, stepX * 0.55);
      final macdPath = Path();
      final sigPath = Path();
      bool started = false;

      for (final p in visPts) {
        final idx = timeToIdx[p.timeSeconds]!;
        final x = (idx + 0.5) * stepX;
        final hy = yFor(p.histogram);
        canvas.drawRect(
          Rect.fromLTRB(
            x - barW / 2,
            math.min(zeroY, hy),
            x + barW / 2,
            math.max(zeroY, hy),
          ),
          Paint()
            ..color = (p.histogram >= 0
                    ? const Color(0xFF10B981)
                    : const Color(0xFFEF4444))
                .withValues(alpha: 0.55),
        );

        final my = yFor(p.macd);
        final sy = yFor(p.signal);
        if (!started) {
          macdPath.moveTo(x, my);
          sigPath.moveTo(x, sy);
          started = true;
        } else {
          macdPath.lineTo(x, my);
          sigPath.lineTo(x, sy);
        }
      }

      canvas.drawPath(
        macdPath,
        Paint()
          ..color = const Color(0xFF06B6D4)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.4,
      );
      canvas.drawPath(
        sigPath,
        Paint()
          ..color = const Color(0xFFF97316)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.4,
      );
    }
  }

  @override
  bool shouldRepaint(covariant OscillatorSubPanePainter oldDelegate) => true;
}
