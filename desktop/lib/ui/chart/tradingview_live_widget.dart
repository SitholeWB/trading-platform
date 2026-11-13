import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:webview_cef/webview_cef.dart';

import '../../models/trading_models.dart';
import '../../services/symbol_catalog.dart';
import 'cef_bootstrap.dart';

/// Embedded TradingView Advanced Chart powered by Chromium Embedded Framework (webview_cef).
/// Serves an isolated local HTML page over 127.0.0.1 so TradingView's embed-widget-advanced-chart.js
/// loads inline with full interactivity, indicators, drawing tools, and dark/light theme parity.
class TradingViewLiveWidget extends StatefulWidget {
  const TradingViewLiveWidget({
    super.key,
    required this.symbol,
    required this.timeframe,
    required this.chartType,
    required this.timezone,
    this.isDark = true,
  });

  final String symbol;
  final Timeframe timeframe;
  final ChartType chartType;
  final String timezone;
  final bool isDark;

  @override
  State<TradingViewLiveWidget> createState() => _TradingViewLiveWidgetState();
}

class _TradingViewLiveWidgetState extends State<TradingViewLiveWidget> {
  WebViewController? _controller;
  HttpServer? _localServer;
  int? _port;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initWebView();
  }

  @override
  void didUpdateWidget(covariant TradingViewLiveWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.symbol != widget.symbol ||
        oldWidget.timeframe != widget.timeframe ||
        oldWidget.chartType != widget.chartType ||
        oldWidget.timezone != widget.timezone ||
        oldWidget.isDark != widget.isDark) {
      _reloadWidget();
    }
  }

  Future<void> _initWebView() async {
    try {
      await CefBootstrap.ensureInitialized();
      _localServer = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
      _port = _localServer!.port;
      _localServer!.listen((HttpRequest request) {
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
                'Loading TradingView Live Chart...',
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
            if (mounted) setState(() => _loading = false);
          },
        ),
      );

      await controller.initialize(_widgetUrl());
      if (mounted) {
        setState(() => _loading = false);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }

  String _widgetUrl() {
    final ts = DateTime.now().millisecondsSinceEpoch;
    return 'http://127.0.0.1:$_port/?v=$ts';
  }

  void _reloadWidget() {
    final c = _controller;
    if (c != null && _port != null && c.value) {
      setState(() => _loading = true);
      c.loadUrl(_widgetUrl());
    }
  }

  String _mapSymbolToTradingView(String symbol) {
    final spec = SymbolCatalog.find(symbol);
    if (spec.tradingViewTicker.isNotEmpty) return spec.tradingViewTicker;
    final clean = symbol
        .trim()
        .toUpperCase()
        .replaceAll('/', '')
        .replaceAll('_', '')
        .replaceAll('=X', '');
    if (clean.contains(':')) return clean;
    if (clean.length == 6) return 'OANDA:$clean';
    return clean;
  }

  String _mapTimeframe(Timeframe tf) {
    switch (tf) {
      case Timeframe.m1:
        return '1';
      case Timeframe.m5:
        return '5';
      case Timeframe.m15:
        return '15';
      case Timeframe.m30:
        return '30';
      case Timeframe.h1:
        return '60';
      case Timeframe.h4:
        return '240';
      case Timeframe.d1:
        return 'D';
      case Timeframe.w1:
        return 'W';
    }
  }

  String _mapChartStyle(ChartType ct) {
    switch (ct) {
      case ChartType.bar:
        return '0';
      case ChartType.candlestick:
        return '1';
      case ChartType.line:
        return '2';
      case ChartType.area:
        return '3';
      case ChartType.heikinAshi:
        return '8';
      case ChartType.baseline:
        return '10';
    }
  }

  String _buildHtmlPage() {
    final tvSymbol = _mapSymbolToTradingView(widget.symbol);
    final tvInterval = _mapTimeframe(widget.timeframe);
    final tvStyle = _mapChartStyle(widget.chartType);
    final theme = widget.isDark ? 'dark' : 'light';
    final bgColor =
        widget.isDark ? 'rgba(9, 13, 22, 1)' : 'rgba(248, 250, 252, 1)';
    final gridColor =
        widget.isDark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(203, 213, 225, 0.5)';

    final config = {
      'autosize': true,
      'symbol': tvSymbol,
      'interval': tvInterval,
      'timezone': widget.timezone.isEmpty ? 'Etc/UTC' : widget.timezone,
      'theme': theme,
      'style': tvStyle,
      'locale': 'en',
      'backgroundColor': bgColor,
      'gridColor': gridColor,
      'allow_symbol_change': true,
      'hide_side_toolbar': false,
      'withdateranges': true,
      'save_image': true,
      'calendar': false,
      'studies': ['STD;EMA'],
      'support_host': 'https://www.tradingview.com',
    };

    final jsonConfig = jsonEncode(config);

    return '''
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: ${widget.isDark ? '#090d16' : '#f8fafc'};
    }
    .tradingview-widget-container {
      width: 100%;
      height: 100%;
    }
    .tradingview-widget-container__widget {
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <div class="tradingview-widget-container">
    <div class="tradingview-widget-container__widget"></div>
    <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js" async>
      $jsonConfig
    </script>
  </div>
  <script>
    (function () {
      function stripIframeTitles() {
        document.querySelectorAll('iframe[title]').forEach(function (el) {
          el.removeAttribute('title');
        });
      }
      stripIframeTitles();
      new MutationObserver(stripIframeTitles).observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['title']
      });
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
    final tvSymbol = _mapSymbolToTradingView(widget.symbol);
    if (_error != null) {
      return Center(
        child: Container(
          constraints: const BoxConstraints(maxWidth: 460),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: const Color(0xFF0F172A),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.white12),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.warning_amber_rounded,
                  color: Color(0xFFF59E0B), size: 36),
              const SizedBox(height: 10),
              Text(
                'TradingView Embedded Engine Unavailable',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 6),
              Text(
                _error!,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 11, color: Colors.white60),
              ),
              const SizedBox(height: 14),
              FilledButton.icon(
                onPressed: () => Process.run(
                  'xdg-open',
                  [
                    'https://www.tradingview.com/chart/?symbol=${Uri.encodeComponent(tvSymbol)}'
                  ],
                ),
                icon: const Icon(Icons.open_in_new, size: 16),
                label: Text('Open $tvSymbol in Browser'),
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
                  Text('Connecting TradingView...',
                      style: TextStyle(fontSize: 11, color: Colors.white70)),
                ],
              ),
            ),
          ),
      ],
    );
  }
}
