import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:webview_cef/webview_cef.dart';

import '../../models/trading_models.dart';
import 'cef_bootstrap.dart';

/// Embedded Dukascopy Live Chart powered by Chromium Embedded Framework (webview_cef).
/// Uses an in-process local loopback proxy on 127.0.0.1 that forwards requests to
/// `https://freeserv.dukascopy.com` with the required `Referer: https://www.dukascopy.com/`
/// header and strips `frame-ancestors` CSP restrictions so the SWFX live chart loads
/// reliably inline.
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
  static const String _browserUa =
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36';

  WebViewController? _controller;
  HttpServer? _proxyServer;
  HttpClient? _httpClient;
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

  Future<void> _startProxy() async {
    _httpClient = HttpClient()
      ..userAgent = _browserUa
      ..autoUncompress = true;

    _proxyServer = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
    _port = _proxyServer!.port;
    _proxyServer!.listen(_handleProxyRequest);
  }

  Future<void> _handleProxyRequest(HttpRequest req) async {
    final client = _httpClient;
    if (client == null || _port == null) {
      req.response
        ..statusCode = HttpStatus.serviceUnavailable
        ..close();
      return;
    }

    try {
      final pathAndQuery = req.uri.hasQuery
          ? '${req.uri.path}?${req.uri.query}'
          : req.uri.path;
      final upstreamUri = Uri.parse('https://freeserv.dukascopy.com$pathAndQuery');

      final upstreamReq = await client.openUrl(req.method, upstreamUri);
      upstreamReq.headers.set('User-Agent', _browserUa);
      upstreamReq.headers.set('Referer', 'https://www.dukascopy.com/');
      upstreamReq.headers.set('Origin', 'https://www.dukascopy.com');
      upstreamReq.headers.set('Accept', req.headers.value('accept') ?? '*/*');
      upstreamReq.headers.set('Accept-Language', 'en-US,en;q=0.9');

      if (req.method == 'POST' || req.method == 'PUT') {
        final bodyBytes = await req.fold<List<int>>(
          <int>[],
          (prev, chunk) => prev..addAll(chunk),
        );
        upstreamReq.add(bodyBytes);
      }

      final upstreamRes = await upstreamReq.close();
      final bytes = await upstreamRes.fold<List<int>>(
        <int>[],
        (prev, chunk) => prev..addAll(chunk),
      );

      req.response.statusCode = upstreamRes.statusCode;
      final contentType = upstreamRes.headers.contentType;
      if (contentType != null) {
        req.response.headers.contentType = contentType;
      }

      final mime = contentType?.mimeType.toLowerCase() ?? '';
      final isText = mime.contains('html') ||
          mime.contains('javascript') ||
          mime.contains('json') ||
          mime.contains('css') ||
          mime.startsWith('text/');

      if (isText) {
        var text = utf8.decode(bytes, allowMalformed: true);
        text = text.replaceAll(
          'https://freeserv.dukascopy.com/',
          'http://127.0.0.1:$_port/',
        );
        req.response.add(utf8.encode(text));
      } else {
        req.response.add(bytes);
      }
      await req.response.close();
    } catch (e) {
      try {
        req.response
          ..statusCode = HttpStatus.badGateway
          ..write('Proxy error: $e')
          ..close();
      } catch (_) {}
    }
  }

  Future<void> _initWebView() async {
    try {
      await CefBootstrap.ensureInitialized();
      await _startProxy();

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
      Future<void>.delayed(const Duration(seconds: 6), () {
        if (mounted && _loading) setState(() => _loading = false);
      });
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
    final instrument = _mapSymbolToDukascopy(widget.symbol);
    final interval = _mapTimeframe(widget.timeframe);
    final chartType = _mapChartType(widget.chartType);
    final theme = widget.isDark ? 'dark' : 'light';

    return 'http://127.0.0.1:$_port/2.0/?path=chart/index'
        '&showUI=true'
        '&showTabs=true'
        '&showToolbar=true'
        '&toolbar=true'
        '&allowPan=true'
        '&allowInstrumentChange=true'
        '&instrument=$instrument'
        '&period=$interval'
        '&chartType=$chartType'
        '&theme=$theme'
        '&studies=ema'
        '&width=100%25'
        '&height=100%25';
  }

  void _reloadWidget() {
    final c = _controller;
    if (c != null && _port != null && c.value) {
      setState(() => _loading = true);
      c.loadUrl(_widgetUrl());
      Future<void>.delayed(const Duration(seconds: 6), () {
        if (mounted && _loading) setState(() => _loading = false);
      });
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

  @override
  void dispose() {
    _controller?.dispose();
    _proxyServer?.close(force: true);
    _httpClient?.close(force: true);
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
