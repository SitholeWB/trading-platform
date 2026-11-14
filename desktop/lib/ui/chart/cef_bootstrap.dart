import 'package:webview_cef/webview_cef.dart';

/// Ensures [WebviewManager.initialize] is invoked at most once per process.
/// Calling `WebviewManager().initialize()` a second time resets its internal
/// completer and can hang subsequent WebView controllers.
class CefBootstrap {
  static Future<void>? _initFuture;

  static Future<void> ensureInitialized() {
    if (WebviewManager().value) return Future<void>.value();
    _initFuture ??= WebviewManager().initialize();
    return _initFuture!;
  }
}
