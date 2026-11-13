import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:webview_cef/webview_cef.dart';

import '../../models/trading_models.dart';
import 'cef_bootstrap.dart';

/// Embedded Dukascopy Live Chart powered by Chromium Embedded Framework (webview_cef).
/// Resolves the live chart iframe URL from Dukascopy's official charts page at startup
/// (falling back to `https://chart.dukascopy.com/`), or uses a user-configured override.
class DukascopyLiveWidget extends StatefulWidget {
  const DukascopyLiveWidget({
    super.key,
    required this.symbol,
    required this.timeframe,
    required this.chartType,
    this.isDark = true,
    this.customUrl = '',
  });

  final String symbol;
  final Timeframe timeframe;
  final ChartType chartType;
  final bool isDark;
  final String customUrl;

  @override
  State<DukascopyLiveWidget> createState() => _DukascopyLiveWidgetState();
}

class _DukascopyLiveWidgetState extends State<DukascopyLiveWidget> {
  static const String _fallbackUrl = 'https://chart.dukascopy.com/';
  static const String _discoveryPage =
      'https://www.dukascopy.com/swiss/english/marketwatch/charts/';
  static String? _cachedDiscoveredUrl;

  WebViewController? _controller;
  String _activeUrl = _fallbackUrl;
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
    if (oldWidget.customUrl != widget.customUrl) {
      _reloadWithResolvedUrl();
    }
  }

  Future<String> _resolveChartUrl() async {
    final override = widget.customUrl.trim();
    if (override.isNotEmpty) return override;
    if (_cachedDiscoveredUrl != null) return _cachedDiscoveredUrl!;

    try {
      final res = await http
          .get(
            Uri.parse(_discoveryPage),
            headers: {
              'User-Agent':
                  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
            },
          )
          .timeout(const Duration(seconds: 4));

      if (res.statusCode == 200) {
        final match = RegExp(
          r'''<iframe[^>]+src=["'](https://[^"']*chart[^"']*)["']''',
          caseSensitive: false,
        ).firstMatch(res.body);
        final found = match?.group(1)?.trim();
        if (found != null && found.isNotEmpty) {
          _cachedDiscoveredUrl = found;
          return found;
        }
      }
    } catch (_) {
      // Fall back to default URL when discovery page is offline/timed out.
    }
    _cachedDiscoveredUrl = _fallbackUrl;
    return _fallbackUrl;
  }

  Future<void> _reloadWithResolvedUrl() async {
    final url = await _resolveChartUrl();
    _activeUrl = url;
    final c = _controller;
    if (c != null && c.value) {
      setState(() => _loading = true);
      c.loadUrl(url);
      Future<void>.delayed(const Duration(seconds: 6), () {
        if (mounted && _loading) setState(() => _loading = false);
      });
    }
  }

  Future<void> _initWebView() async {
    try {
      await CefBootstrap.ensureInitialized();
      _activeUrl = await _resolveChartUrl();

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
          onLoadEnd: (_, url) {
            if (mounted) setState(() => _loading = false);
          },
        ),
      );

      await controller.initialize(_activeUrl);
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
                onPressed: () => Process.run('xdg-open', [_activeUrl]),
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
