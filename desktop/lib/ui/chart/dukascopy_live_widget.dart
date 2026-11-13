import 'dart:async';
import 'dart:convert';
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
  String? _lastConsoleError;
  Timer? _loadTimeoutTimer;
  int _loadGeneration = 0;

  @override
  void initState() {
    super.initState();
    _initWebView();
  }

  @override
  void didUpdateWidget(covariant DukascopyLiveWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.customUrl != widget.customUrl ||
        oldWidget.isDark != widget.isDark) {
      _reloadWithResolvedUrl();
    }
  }

  String _applyThemeParam(String rawUrl) {
    final themeValue = widget.isDark ? 'DARK' : 'LIGHT';
    final uri = Uri.tryParse(rawUrl);
    if (uri == null) return rawUrl;

    final params = Map<String, String>.from(uri.queryParameters);
    final existingInit = params['init'];
    if (existingInit != null && existingInit.trim().startsWith('{')) {
      try {
        final decoded = jsonDecode(existingInit);
        if (decoded is Map<String, dynamic>) {
          decoded['theme'] = themeValue;
          params['init'] = jsonEncode(decoded);
          return uri.replace(queryParameters: params).toString();
        }
      } catch (_) {
        // Fall through to overwrite init param if malformed.
      }
    }
    params['init'] = jsonEncode({'theme': themeValue});
    return uri.replace(queryParameters: params).toString();
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

  Future<String?> _preflightCheck(String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null || !uri.hasScheme) {
      return 'Invalid chart URL: $url';
    }
    try {
      var res = await http.head(uri).timeout(const Duration(seconds: 5));
      if (res.statusCode == 405) {
        res = await http.get(uri).timeout(const Duration(seconds: 5));
      }
      if (res.statusCode >= 400) {
        return 'Server returned HTTP ${res.statusCode} for ${uri.host}.';
      }
      return null;
    } on TimeoutException {
      return 'Timed out connecting to ${uri.host}.';
    } catch (e) {
      return 'Unable to reach ${uri.host}: $e';
    }
  }

  void _startLoadTimeout(int gen) {
    _loadTimeoutTimer?.cancel();
    _loadTimeoutTimer = Timer(const Duration(seconds: 12), () {
      if (!mounted || gen != _loadGeneration || !_loading) return;
      setState(() {
        _loading = false;
        _error = _lastConsoleError != null
            ? 'Timed out loading Dukascopy chart ($_lastConsoleError).'
            : 'Timed out loading Dukascopy chart after 12s.';
      });
    });
  }

  Future<void> _verifyChartRendered(int gen) async {
    await Future<void>.delayed(const Duration(milliseconds: 1500));
    if (!mounted || gen != _loadGeneration || _error != null) return;
    final c = _controller;
    if (c == null || !c.value) return;
    try {
      final raw = await c.evaluateJavascript('''
        (() => {
          const hasApp = !!document.querySelector('app-chart');
          const hasCanvas = document.querySelectorAll('canvas').length > 0;
          const bodyLen = (document.body && document.body.innerText || '').trim().length;
          return JSON.stringify({ hasApp, hasCanvas, bodyLen });
        })()
      ''');
      if (!mounted || gen != _loadGeneration) return;
      if (raw is String && raw.isNotEmpty) {
        final decoded = jsonDecode(raw);
        if (decoded is Map<String, dynamic>) {
          final hasApp = decoded['hasApp'] == true;
          final hasCanvas = decoded['hasCanvas'] == true;
          final bodyLen = (decoded['bodyLen'] as num?)?.toInt() ?? 0;
          if (!hasApp && !hasCanvas && bodyLen == 0) {
            setState(() {
              _error = _lastConsoleError != null
                  ? 'Dukascopy chart rendered blank ($_lastConsoleError).'
                  : 'Dukascopy chart rendered blank (no chart canvas found).';
            });
          }
        }
      }
    } catch (_) {
      // evaluateJavascript is best-effort; ignore if page is still navigating.
    }
  }

  Future<void> _reloadWithResolvedUrl() async {
    final gen = ++_loadGeneration;
    _lastConsoleError = null;
    if (mounted) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }
    final url = _applyThemeParam(await _resolveChartUrl());
    if (!mounted || gen != _loadGeneration) return;
    _activeUrl = url;

    final preflightErr = await _preflightCheck(url);
    if (!mounted || gen != _loadGeneration) return;
    if (preflightErr != null) {
      _loadTimeoutTimer?.cancel();
      setState(() {
        _error = preflightErr;
        _loading = false;
      });
      return;
    }

    final c = _controller;
    if (c != null && c.value) {
      _startLoadTimeout(gen);
      await c.loadUrl(url);
    }
  }

  Future<void> _retry() async {
    _cachedDiscoveredUrl = null;
    final c = _controller;
    if (c == null || !c.value) {
      await _initWebView();
    } else {
      await _reloadWithResolvedUrl();
    }
  }

  Future<void> _initWebView() async {
    final gen = ++_loadGeneration;
    _lastConsoleError = null;
    if (mounted) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }
    try {
      await CefBootstrap.ensureInitialized();
      final url = _applyThemeParam(await _resolveChartUrl());
      if (!mounted || gen != _loadGeneration) return;
      _activeUrl = url;

      final preflightErr = await _preflightCheck(url);
      if (!mounted || gen != _loadGeneration) return;
      if (preflightErr != null) {
        setState(() {
          _error = preflightErr;
          _loading = false;
        });
        return;
      }

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
          onLoadStart: (_, navUrl) {
            if (!mounted) return;
            if (navUrl.startsWith('chrome-error://')) {
              _loadTimeoutTimer?.cancel();
              setState(() {
                _loading = false;
                _error = 'Chromium failed to load Dukascopy chart ($navUrl).';
              });
            }
          },
          onConsoleMessage: (level, message, _, _) {
            if (_loading && level >= 4 && message.trim().isNotEmpty) {
              _lastConsoleError = message.trim();
            }
          },
          onLoadEnd: (_, navUrl) {
            if (!mounted) return;
            _loadTimeoutTimer?.cancel();
            if (navUrl.startsWith('chrome-error://')) {
              setState(() {
                _loading = false;
                _error = 'Failed to load Dukascopy chart ($navUrl).';
              });
              return;
            }
            setState(() => _loading = false);
            _verifyChartRendered(_loadGeneration);
          },
        ),
      );

      _startLoadTimeout(gen);
      await controller.initialize(_activeUrl);
    } catch (e) {
      _loadTimeoutTimer?.cancel();
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
    _loadTimeoutTimer?.cancel();
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
              Wrap(
                spacing: 8,
                runSpacing: 8,
                alignment: WrapAlignment.center,
                children: [
                  FilledButton.icon(
                    onPressed: _retry,
                    icon: const Icon(Icons.refresh, size: 16),
                    label: const Text('Retry'),
                  ),
                  if (_controller != null)
                    OutlinedButton.icon(
                      onPressed: () => _controller?.openDevTools(),
                      icon: const Icon(Icons.bug_report_outlined, size: 16),
                      label: const Text('DevTools'),
                    ),
                  OutlinedButton.icon(
                    onPressed: () => Process.run('xdg-open', [_activeUrl]),
                    icon: const Icon(Icons.open_in_new, size: 16),
                    label: const Text('Open in Browser'),
                  ),
                ],
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
