import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:webview_cef/webview_cef.dart';

import '../../models/trading_models.dart';

/// Embedded Dukascopy Live Chart powered by Chromium Embedded Framework (webview_cef).
/// Serves a local HTML page over 127.0.0.1 embedding Dukascopy's SWFX live chart applet
/// synced one-way with the active symbol, timeframe, and theme.
class DukascopyLiveWidget extends StatefulWidget {
  const DukascopyLiveWidget({
    super.key,
    required this.symbol,
    required this.timeframe,
    required this.chartType,
    this.isDark = true,
  });

  final String symbol;
  final Timeframe timeframe;
  final ChartType chartType;
  final bool isDark;

  @override
  State<DukascopyLiveWidget> createState() => _DukascopyLiveWidgetState();
}

class _DukascopyLiveWidgetState extends State<DukascopyLiveWidget> {
  static bool _cefInitialized = false;
  static Future<void>? _cefInitFuture;

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
  void didUpdateWidget(covariant DukascopyLiveWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.symbol != widget.symbol ||
        oldWidget.timeframe != widget.timeframe ||
        oldWidget.chartType != widget.chartType ||
        oldWidget.isDark != widget.isDark) {
      _reloadWidget();
    }
  }

  Future<void> _ensureCefInitialized() async {
    if (_cefInitialized) return;
    _cefInitFuture ??= WebviewManager().initialize().then((_) {
      _cefInitialized = true;
    });
    await _cefInitFuture;
  }

  Future<void> _initWebView() async {
    try {
      await _ensureCefInitialized();
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
                'Loading Dukascopy Live Chart...',
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

  String _mapSymbolToDukascopy(String symbol) {
    final clean = symbol
        .trim()
        .toUpperCase()
        .replaceAll('/', '')
        .replaceAll('_', '')
        .replaceAll('=X', '');

    switch (clean) {
      case 'XAUUSD':
        return 'XAU/USD';
      case 'XAGUSD':
        return 'XAG/USD';
      case 'BTCUSD':
        return 'BTC/USD';
      case 'ETHUSD':
        return 'ETH/USD';
      case 'SOLUSD':
        return 'SOL/USD';
      case 'US500':
      case 'SPX':
        return 'USA500.IDX/USD';
      case 'NAS100':
      case 'US100':
      case 'NDX':
        return 'USATECH.IDX/USD';
      case 'US30':
      case 'DJI':
        return 'USA30.IDX/USD';
      case 'GER40':
      case 'DE40':
      case 'DAX':
        return 'DEU.IDX/EUR';
      case 'UK100':
      case 'FTSE':
        return 'GBR.IDX/GBP';
      case 'JP225':
        return 'JPN.IDX/JPY';
      case 'USOIL':
      case 'WTI':
        return 'LIGHT.CMD/USD';
      case 'UKOIL':
      case 'BRENT':
        return 'BRENT.CMD/USD';
      case 'NATGAS':
        return 'GAS.CMD/USD';
    }

    if (clean.length == 6) {
      return '${clean.substring(0, 3)}/${clean.substring(3, 6)}';
    }
    return clean;
  }

  String _mapTimeframe(Timeframe tf) {
    switch (tf) {
      case Timeframe.m1:
        return '1MIN';
      case Timeframe.m5:
        return '5MIN';
      case Timeframe.m15:
        return '15MIN';
      case Timeframe.m30:
        return '30MIN';
      case Timeframe.h1:
        return '1HOUR';
      case Timeframe.h4:
        return '4HOUR';
      case Timeframe.d1:
        return '1DAY';
      case Timeframe.w1:
        return '1WEEK';
    }
  }

  String _mapChartType(ChartType ct) {
    switch (ct) {
      case ChartType.line:
      case ChartType.area:
      case ChartType.baseline:
        return 'line';
      case ChartType.bar:
        return 'ohlc';
      case ChartType.candlestick:
      case ChartType.heikinAshi:
        return 'candle';
    }
  }

  String _buildHtmlPage() {
    final instrument = _mapSymbolToDukascopy(widget.symbol);
    final interval = _mapTimeframe(widget.timeframe);
    final chartType = _mapChartType(widget.chartType);

    final appletConfig = {
      'type': 'chart',
      'params': {
        'showUI': true,
        'showTabs': true,
        'showToolbar': true,
        'toolbar': true,
        'allowPan': true,
        'allowInstrumentChange': true,
        'instrument': instrument,
        'period': interval,
        'chartType': chartType,
        'theme': widget.isDark ? 'dark' : 'light',
        'studies': ['ema'],
        'width': '100%',
        'height': '100%',
        'adv': 'popup',
      },
    };

    final jsonConfig = jsonEncode(appletConfig);

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
  </style>
</head>
<body>
  <script type="text/javascript">
    DukascopyApplet = $jsonConfig;
  </script>
  <script type="text/javascript" src="https://freeserv-static.dukascopy.com/2.0/core.js"></script>
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
                'Dukascopy Embedded Engine Unavailable',
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
                  ['https://www.dukascopy.com/swiss/english/marketwatch/charts/'],
                ),
                icon: const Icon(Icons.open_in_new, size: 16),
                label: const Text('Open Dukascopy Live Charts in Browser'),
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
                  Text('Connecting Dukascopy SWFX...',
                      style: TextStyle(fontSize: 11, color: Colors.white70)),
                ],
              ),
            ),
          ),
      ],
    );
  }
}
