import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_cef/webview_cef.dart';

import '../../models/trading_models.dart';
import '../../services/indicator_engine.dart';
import 'cef_bootstrap.dart';

/// Embedded TradingView Lightweight Charts (Apache-2.0 open-source) powered by webview_cef.
/// Serves bundled local JS over 127.0.0.1 with zero external network dependency,
/// live incremental updates, dark/light theme sync, and localStorage-persisted drawings.
class LightweightChartWidget extends StatefulWidget {
  const LightweightChartWidget({
    super.key,
    required this.symbol,
    required this.timeframe,
    required this.chartType,
    required this.candles,
    this.positions = const [],
    this.alerts = const [],
    this.timezoneOffsetHours = 0,
    this.isDark = true,
  });

  final String symbol;
  final Timeframe timeframe;
  final ChartType chartType;
  final List<Candle> candles;
  final List<Position> positions;
  final List<PriceAlert> alerts;
  final int timezoneOffsetHours;
  final bool isDark;

  @override
  State<LightweightChartWidget> createState() => _LightweightChartWidgetState();
}

class _LightweightChartWidgetState extends State<LightweightChartWidget> {
  static String? _cachedBundleJs;

  WebViewController? _controller;
  HttpServer? _localServer;
  int? _port;
  bool _loading = true;
  bool _pageReady = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initWebView();
  }

  @override
  void didUpdateWidget(covariant LightweightChartWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    final fitView = oldWidget.symbol != widget.symbol ||
        oldWidget.timeframe != widget.timeframe;
    final changed = fitView ||
        oldWidget.chartType != widget.chartType ||
        oldWidget.isDark != widget.isDark ||
        oldWidget.timezoneOffsetHours != widget.timezoneOffsetHours ||
        oldWidget.candles != widget.candles ||
        oldWidget.positions != widget.positions ||
        oldWidget.alerts != widget.alerts;

    if (changed) {
      _pushUpdateToJs(fitView: fitView);
    }
  }

  Future<void> _initWebView() async {
    try {
      await CefBootstrap.ensureInitialized();
      _cachedBundleJs ??= await rootBundle
          .loadString('assets/js/lightweight-charts.standalone.production.js');

      _localServer = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
      _port = _localServer!.port;
      _localServer!.listen((HttpRequest request) {
        final path = request.uri.path;
        if (path == '/lightweight-charts.js') {
          request.response
            ..statusCode = HttpStatus.ok
            ..headers.contentType =
                ContentType('application', 'javascript', charset: 'utf-8')
            ..write(_cachedBundleJs)
            ..close();
          return;
        }
        request.response
          ..statusCode = HttpStatus.ok
          ..headers.contentType = ContentType.html
          ..write(_buildHtmlPage())
          ..close();
      });

      final controller = WebviewManager().createWebView(
        loading: const Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(strokeWidth: 2),
              SizedBox(height: 12),
              Text(
                'Loading Lightweight Chart...',
                style: TextStyle(fontSize: 12, color: Colors.white70),
              ),
            ],
          ),
        ),
      );
      _controller = controller;
      controller.setWebviewListener(
        WebviewEventsListener(
          onLoadEnd: (_, _) {
            _pageReady = true;
            if (mounted) setState(() => _loading = false);
            _pushUpdateToJs(fitView: true);
          },
        ),
      );

      final ts = DateTime.now().millisecondsSinceEpoch;
      await controller.initialize('http://127.0.0.1:$_port/?v=$ts');
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }

  Map<String, dynamic> _buildPayload() {
    final offsetSec = widget.timezoneOffsetHours * 3600;
    final byTime = <int, Candle>{};
    for (final c in widget.candles) {
      byTime[c.timeSeconds + offsetSec] = c;
    }
    final sortedTimes = byTime.keys.toList()..sort();

    final candleData = <Map<String, dynamic>>[];
    final volumeData = <Map<String, dynamic>>[];

    if (widget.chartType == ChartType.heikinAshi && sortedTimes.isNotEmpty) {
      double prevOpen = byTime[sortedTimes.first]!.open;
      double prevClose = byTime[sortedTimes.first]!.close;
      for (final t in sortedTimes) {
        final c = byTime[t]!;
        final haClose = (c.open + c.high + c.low + c.close) / 4.0;
        final haOpen = (prevOpen + prevClose) / 2.0;
        final haHigh = math.max(c.high, math.max(haOpen, haClose));
        final haLow = math.min(c.low, math.min(haOpen, haClose));
        prevOpen = haOpen;
        prevClose = haClose;
        candleData.add({
          'time': t,
          'open': haOpen,
          'high': haHigh,
          'low': haLow,
          'close': haClose,
        });
        volumeData.add({
          'time': t,
          'value': c.volume,
          'color': haClose >= haOpen
              ? 'rgba(16, 185, 129, 0.35)'
              : 'rgba(239, 68, 68, 0.35)',
        });
      }
    } else {
      for (final t in sortedTimes) {
        final c = byTime[t]!;
        candleData.add({
          'time': t,
          'open': c.open,
          'high': c.high,
          'low': c.low,
          'close': c.close,
        });
        volumeData.add({
          'time': t,
          'value': c.volume,
          'color': c.close >= c.open
              ? 'rgba(16, 185, 129, 0.35)'
              : 'rgba(239, 68, 68, 0.35)',
        });
      }
    }

    final samplePrice =
        widget.candles.isNotEmpty ? widget.candles.last.close : null;
    final decimals =
        IndicatorEngine.getSymbolDigits(widget.symbol, samplePrice: samplePrice);

    final lines = <Map<String, dynamic>>[];
    for (final p in widget.positions) {
      if (p.status == 'Open' && p.symbol == widget.symbol) {
        lines.add({
          'price': p.entryPrice,
          'color': p.orderType == 'Buy' ? '#10b981' : '#ef4444',
          'title': '${p.orderType.toUpperCase()} ${p.lots.toStringAsFixed(2)}',
          'style': 0,
        });
        if (p.stopLossPrice != null) {
          lines.add({
            'price': p.stopLossPrice!,
            'color': '#ef4444',
            'title': 'SL',
            'style': 2,
          });
        }
        if (p.takeProfitPrice != null) {
          lines.add({
            'price': p.takeProfitPrice!,
            'color': '#10b981',
            'title': 'TP',
            'style': 2,
          });
        }
      }
    }
    for (final a in widget.alerts) {
      if (a.symbol == widget.symbol && !a.triggered) {
        lines.add({
          'price': a.targetPrice,
          'color': '#f59e0b',
          'title': 'ALERT',
          'style': 1,
        });
      }
    }

    return {
      'symbol': widget.symbol,
      'timeframe': widget.timeframe.code,
      'chartType': widget.chartType.name,
      'isDark': widget.isDark,
      'decimals': decimals,
      'candles': candleData,
      'volumes': volumeData,
      'priceLines': lines,
    };
  }

  void _pushUpdateToJs({required bool fitView}) {
    final c = _controller;
    if (c == null || !_pageReady || !c.value) return;
    final payloadJson = jsonEncode(_buildPayload());
    c.executeJavaScript(
      'window.__updateChart && window.__updateChart($payloadJson, $fitView);',
    );
  }

  String _buildHtmlPage() {
    final initialPayload = jsonEncode(_buildPayload());
    return '''
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    html, body {
      margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: ${widget.isDark ? '#090d16' : '#f8fafc'};
    }
    #root { position: relative; width: 100%; height: 100%; }
    #chart { width: 100%; height: 100%; }
    #overlay {
      position: absolute; inset: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 3;
    }
    #overlay.drawing-active { pointer-events: auto; cursor: crosshair; }
    #toolbar {
      position: absolute; top: 10px; left: 10px; z-index: 5;
      display: flex; gap: 4px; padding: 4px; border-radius: 8px;
      background: rgba(15, 23, 42, 0.78); border: 1px solid rgba(255,255,255,0.12);
      backdrop-filter: blur(6px);
    }
    body.light #toolbar {
      background: rgba(255, 255, 255, 0.88); border-color: rgba(15, 23, 42, 0.14);
    }
    .tool-btn {
      border: 0; background: transparent; color: #cbd5e1;
      font-size: 11px; font-weight: 600; padding: 5px 8px; border-radius: 6px;
      cursor: pointer; display: flex; align-items: center; gap: 4px;
    }
    body.light .tool-btn { color: #334155; }
    .tool-btn:hover { background: rgba(148, 163, 184, 0.18); }
    .tool-btn.active { background: #0ea5e9; color: #ffffff; }
    #legend {
      position: absolute; top: 12px; left: 265px; z-index: 4;
      font-size: 12px; font-weight: 600; pointer-events: none;
      color: #94a3b8; font-family: monospace;
    }
  </style>
</head>
<body class="${widget.isDark ? 'dark' : 'light'}">
  <div id="root">
    <div id="chart"></div>
    <svg id="overlay"></svg>
    <div id="toolbar">
      <button class="tool-btn active" data-tool="cursor" title="Cursor / Pan">Cursor</button>
      <button class="tool-btn" data-tool="hline" title="Horizontal Line">H-Line</button>
      <button class="tool-btn" data-tool="trend" title="Trendline">Trend</button>
      <button class="tool-btn" data-tool="clear" title="Clear Drawings">Clear</button>
    </div>
    <div id="legend"></div>
  </div>
  <script src="/lightweight-charts.js"></script>
  <script>
    (function () {
      const container = document.getElementById('chart');
      const overlay = document.getElementById('overlay');
      const legend = document.getElementById('legend');
      const buttons = document.querySelectorAll('.tool-btn');

      const chart = LightweightCharts.createChart(container, {
        width: container.clientWidth,
        height: container.clientHeight,
        crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
        timeScale: { timeVisible: true, secondsVisible: false, borderVisible: false },
        rightPriceScale: { borderVisible: false },
      });

      const volumeSeries = chart.addHistogramSeries({
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      });
      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.84, bottom: 0 },
      });

      let mainSeries = null;
      let currentChartType = null;
      let currentSymbol = '';
      let currentDecimals = 5;
      let activePriceLines = [];
      let activeTool = 'cursor';
      let pendingPoint = null;
      let drawings = [];
      let lastCandles = [];

      function storageKey(sym) { return 'lw_drawings_' + sym; }
      function loadDrawings(sym) {
        try {
          const raw = localStorage.getItem(storageKey(sym));
          drawings = raw ? JSON.parse(raw) : [];
        } catch (_) { drawings = []; }
      }
      function saveDrawings(sym) {
        try { localStorage.setItem(storageKey(sym), JSON.stringify(drawings)); } catch (_) {}
      }

      function renderDrawings() {
        while (overlay.firstChild) overlay.removeChild(overlay.firstChild);
        if (!mainSeries) return;
        const w = overlay.clientWidth;
        const ts = chart.timeScale();
        for (const d of drawings) {
          if (d.type === 'hline') {
            const y = mainSeries.priceToCoordinate(d.price);
            if (y == null) continue;
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', 0); line.setAttribute('x2', w);
            line.setAttribute('y1', y); line.setAttribute('y2', y);
            line.setAttribute('stroke', '#38bdf8');
            line.setAttribute('stroke-width', '1.5');
            line.setAttribute('stroke-dasharray', '5 4');
            overlay.appendChild(line);
          } else if (d.type === 'trend') {
            const x1 = ts.timeToCoordinate(d.t1);
            const y1 = mainSeries.priceToCoordinate(d.p1);
            const x2 = ts.timeToCoordinate(d.t2);
            const y2 = mainSeries.priceToCoordinate(d.p2);
            if (x1 == null || y1 == null || x2 == null || y2 == null) continue;
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1); line.setAttribute('y1', y1);
            line.setAttribute('x2', x2); line.setAttribute('y2', y2);
            line.setAttribute('stroke', '#38bdf8');
            line.setAttribute('stroke-width', '1.75');
            overlay.appendChild(line);
          }
        }
      }

      chart.timeScale().subscribeVisibleLogicalRangeChange(renderDrawings);
      new ResizeObserver(() => {
        chart.applyOptions({ width: container.clientWidth, height: container.clientHeight });
        renderDrawings();
      }).observe(container);

      chart.subscribeCrosshairMove((param) => {
        if (!mainSeries || !param || !param.seriesData) return;
        const d = param.seriesData.get(mainSeries);
        if (!d) return;
        const fmt = (v) => v != null ? Number(v).toFixed(currentDecimals) : '';
        if (d.open != null) {
          legend.textContent = currentSymbol + '  O ' + fmt(d.open) + '  H ' + fmt(d.high) + '  L ' + fmt(d.low) + '  C ' + fmt(d.close);
        } else if (d.value != null) {
          legend.textContent = currentSymbol + '  ' + fmt(d.value);
        }
      });

      buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
          const tool = btn.getAttribute('data-tool');
          if (tool === 'clear') {
            drawings = [];
            pendingPoint = null;
            saveDrawings(currentSymbol);
            renderDrawings();
            return;
          }
          activeTool = tool;
          pendingPoint = null;
          buttons.forEach((b) => b.classList.toggle('active', b.getAttribute('data-tool') === tool));
          overlay.classList.toggle('drawing-active', tool !== 'cursor');
        });
      });

      overlay.addEventListener('click', (ev) => {
        if (!mainSeries || activeTool === 'cursor') return;
        const rect = overlay.getBoundingClientRect();
        const x = ev.clientX - rect.left;
        const y = ev.clientY - rect.top;
        const price = mainSeries.coordinateToPrice(y);
        const time = chart.timeScale().coordinateToTime(x);
        if (price == null) return;

        if (activeTool === 'hline') {
          drawings.push({ type: 'hline', price });
          saveDrawings(currentSymbol);
          renderDrawings();
        } else if (activeTool === 'trend' && time != null) {
          if (!pendingPoint) {
            pendingPoint = { t: time, p: price };
          } else {
            drawings.push({ type: 'trend', t1: pendingPoint.t, p1: pendingPoint.p, t2: time, p2: price });
            pendingPoint = null;
            saveDrawings(currentSymbol);
            renderDrawings();
          }
        }
      });

      function createSeriesForType(type, decimals) {
        if (mainSeries) {
          chart.removeSeries(mainSeries);
          mainSeries = null;
        }
        const priceFormat = {
          type: 'price',
          precision: decimals,
          minMove: Math.pow(10, -decimals),
        };
        if (type === 'bar') {
          mainSeries = chart.addBarSeries({
            upColor: '#10b981', downColor: '#ef4444', priceFormat,
          });
        } else if (type === 'line') {
          mainSeries = chart.addLineSeries({
            color: '#22d3ee', lineWidth: 2, priceFormat,
          });
        } else if (type === 'area') {
          mainSeries = chart.addAreaSeries({
            lineColor: '#22d3ee',
            topColor: 'rgba(34, 211, 238, 0.35)',
            bottomColor: 'rgba(34, 211, 238, 0.02)',
            lineWidth: 2,
            priceFormat,
          });
        } else if (type === 'baseline') {
          const mid = lastCandles.length ? lastCandles[Math.floor(lastCandles.length / 2)].close : 0;
          mainSeries = chart.addBaselineSeries({
            baseValue: { type: 'price', price: mid },
            topLineColor: '#10b981', topFillColor1: 'rgba(16,185,129,0.28)', topFillColor2: 'rgba(16,185,129,0.02)',
            bottomLineColor: '#ef4444', bottomFillColor1: 'rgba(239,68,68,0.02)', bottomFillColor2: 'rgba(239,68,68,0.28)',
            priceFormat,
          });
        } else {
          mainSeries = chart.addCandlestickSeries({
            upColor: '#10b981', downColor: '#ef4444',
            borderUpColor: '#10b981', borderDownColor: '#ef4444',
            wickUpColor: '#10b981', wickDownColor: '#ef4444',
            priceFormat,
          });
        }
        currentChartType = type;
      }

      window.__updateChart = function (payload, fitView) {
        const dark = !!payload.isDark;
        document.body.className = dark ? 'dark' : 'light';
        document.body.style.background = dark ? '#090d16' : '#f8fafc';

        chart.applyOptions({
          layout: {
            background: { type: 'solid', color: dark ? '#090d16' : '#f8fafc' },
            textColor: dark ? '#94a3b8' : '#334155',
          },
          grid: {
            vertLines: { color: dark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(203, 213, 225, 0.5)' },
            horzLines: { color: dark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(203, 213, 225, 0.5)' },
          },
        });

        const symChanged = currentSymbol !== payload.symbol;
        currentSymbol = payload.symbol;
        currentDecimals = payload.decimals || 5;
        lastCandles = payload.candles || [];
        if (symChanged) loadDrawings(currentSymbol);

        if (!mainSeries || currentChartType !== payload.chartType) {
          createSeriesForType(payload.chartType, currentDecimals);
        } else {
          mainSeries.applyOptions({
            priceFormat: {
              type: 'price',
              precision: currentDecimals,
              minMove: Math.pow(10, -currentDecimals),
            },
          });
        }

        const isSingleValue = payload.chartType === 'line' || payload.chartType === 'area' || payload.chartType === 'baseline';
        const seriesData = isSingleValue
          ? lastCandles.map((c) => ({ time: c.time, value: c.close }))
          : lastCandles;

        mainSeries.setData(seriesData);
        volumeSeries.setData(payload.volumes || []);

        for (const l of activePriceLines) {
          try { mainSeries.removePriceLine(l); } catch (_) {}
        }
        activePriceLines = [];
        for (const lineCfg of (payload.priceLines || [])) {
          activePriceLines.push(mainSeries.createPriceLine({
            price: lineCfg.price,
            color: lineCfg.color,
            lineWidth: 1,
            lineStyle: lineCfg.style || 0,
            axisLabelVisible: true,
            title: lineCfg.title || '',
          }));
        }

        if (lastCandles.length) {
          const last = lastCandles[lastCandles.length - 1];
          legend.textContent = currentSymbol + ' (' + payload.timeframe + ')  ' + Number(last.close).toFixed(currentDecimals);
        } else {
          legend.textContent = currentSymbol + ' (' + payload.timeframe + ')';
        }

        if (fitView) chart.timeScale().fitContent();
        renderDrawings();
      };

      window.__updateChart($initialPayload, true);
    })();
  </script>
</body>
</html>
''';
  }

  @override
  void dispose() {
    _controller?.dispose();
    _localServer?.close(force: true);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return Center(
        child: Container(
          constraints: const BoxConstraints(maxWidth: 420),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: const Color(0xFF0F172A),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.white12),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.warning_amber_rounded,
                  color: Color(0xFFF59E0B), size: 32),
              const SizedBox(height: 8),
              Text(
                'Lightweight Chart Unavailable',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 6),
              Text(
                _error!,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 11, color: Colors.white60),
              ),
            ],
          ),
        ),
      );
    }

    final controller = _controller;
    if (controller == null) {
      return const Center(child: CircularProgressIndicator(strokeWidth: 2));
    }

    return Stack(
      children: [
        Positioned.fill(
          child: ValueListenableBuilder<bool>(
            valueListenable: controller,
            builder: (_, ready, _) {
              if (!ready) return controller.loadingWidget;
              return controller.webviewWidget;
            },
          ),
        ),
        if (_loading)
          Positioned(
            top: 8,
            right: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: Colors.black87,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.white12),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(
                    width: 12,
                    height: 12,
                    child: CircularProgressIndicator(strokeWidth: 1.8),
                  ),
                  SizedBox(width: 8),
                  Text('Loading Lightweight Chart...',
                      style: TextStyle(fontSize: 11, color: Colors.white70)),
                ],
              ),
            ),
          ),
      ],
    );
  }
}
