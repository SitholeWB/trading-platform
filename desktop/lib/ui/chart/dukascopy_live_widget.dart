import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:webview_cef/webview_cef.dart';

import '../../models/trading_models.dart';
import 'cef_bootstrap.dart';

/// Embedded Dukascopy Live Chart powered by Chromium Embedded Framework (webview_cef).
/// Loads `https://chart.dukascopy.com/` directly (HTTP 200, `frame-ancestors *`).
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
  WebViewController? _controller;
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

  Future<void> _initWebView() async {
    try {
      await CefBootstrap.ensureInitialized();

      final controller = WebviewManager().createWebView(
        loading: const Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(strokeWidth: 2),
              SizedBox(height: 12),
              Text(
                'Loading Dukascopy Online Charts...',
                style: TextStyle(fontSize: 12, color: Colors.white70),
              ),
            ],
          ),
        ),
      );
      _controller = controller;
      controller.setWebviewListener(
        WebviewEventsListener(
          onLoadStart: (_, url) {
            stderr.writeln('[DukascopyLive] onLoadStart: $url');
          },
          onUrlChanged: (url) {
            stderr.writeln('[DukascopyLive] onUrlChanged: $url');
          },
          onConsoleMessage: (level, message, source, line) {
            stderr.writeln('[DukascopyLive] console($level): $message ($source:$line)');
          },
          onLoadEnd: (_, url) {
            stderr.writeln('[DukascopyLive] onLoadEnd: $url');
            if (mounted) setState(() => _loading = false);
          },
        ),
      );

      stderr.writeln('[DukascopyLive] initializing: ${_widgetUrl()}');
      await controller.initialize(_widgetUrl());
      stderr.writeln('[DukascopyLive] initialized ok');
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
    return 'https://chart.dukascopy.com/';
  }

  void _reloadWidget() {
    final c = _controller;
    if (c != null && c.value) {
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

  @override
  void dispose() {
    _controller?.dispose();
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
                onPressed: () => Process.run('xdg-open', [_widgetUrl()]),
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
                  Text('Connecting Dukascopy Charts...',
                      style: TextStyle(fontSize: 11, color: Colors.white70)),
                ],
              ),
            ),
          ),
      ],
    );
  }
}
