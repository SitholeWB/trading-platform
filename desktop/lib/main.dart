import 'package:flutter/material.dart';
import 'package:screen_retriever/screen_retriever.dart';
import 'package:window_manager/window_manager.dart';
import 'package:yaru/yaru.dart';
import 'services/ai_copilot_service.dart';
import 'services/market_data_service.dart';
import 'services/notification_service.dart';
import 'services/storage_service.dart';
import 'ui/app_shell.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final storage = StorageService();
  await storage.init();

  await _restoreWindowBounds(storage);

  final marketData = MarketDataService(storage);
  final notifications = NotificationService();
  final copilot = AiCopilotService(storage);

  runApp(TradingPlatformApp(
    storage: storage,
    marketData: marketData,
    notifications: notifications,
    copilot: copilot,
  ));
}

Future<void> _restoreWindowBounds(StorageService storage) async {
  try {
    await windowManager.ensureInitialized();
    const defaultSize = Size(1360, 860);
    Size targetSize = defaultSize;
    if (storage.windowWidth != null &&
        storage.windowHeight != null &&
        storage.windowWidth! >= 800 &&
        storage.windowHeight! >= 560) {
      targetSize = Size(storage.windowWidth!, storage.windowHeight!);
    }

    await windowManager.waitUntilReadyToShow(
      WindowOptions(size: targetSize, minimumSize: const Size(860, 560)),
      () async {
        if (storage.windowX != null && storage.windowY != null) {
          final displays = await screenRetriever.getAllDisplays();
          final x = storage.windowX!;
          final y = storage.windowY!;
          final visibleOnAnyDisplay = displays.any((d) {
            final pos = d.visiblePosition ?? Offset.zero;
            final sz = d.visibleSize ?? d.size;
            return x >= pos.dx - 80 &&
                x < pos.dx + sz.width - 120 &&
                y >= pos.dy - 40 &&
                y < pos.dy + sz.height - 100;
          });
          if (visibleOnAnyDisplay) {
            await windowManager.setPosition(Offset(x, y));
          } else {
            await windowManager.center();
          }
        }
        if (storage.isWindowMaximized) {
          await windowManager.maximize();
        }
        await windowManager.show();
        await windowManager.focus();
      },
    );
  } catch (_) {
    // Graceful fallback if window_manager is unavailable
  }
}

class TradingPlatformApp extends StatefulWidget {
  final StorageService storage;
  final MarketDataService marketData;
  final NotificationService notifications;
  final AiCopilotService copilot;

  const TradingPlatformApp({
    super.key,
    required this.storage,
    required this.marketData,
    required this.notifications,
    required this.copilot,
  });

  @override
  State<TradingPlatformApp> createState() => _TradingPlatformAppState();
}

class _TradingPlatformAppState extends State<TradingPlatformApp> {
  @override
  Widget build(BuildContext context) {
    return YaruTheme(
      builder: (context, yaru, child) {
        return MaterialApp(
          title: 'Trading Platform — Algorithmic Workstation',
          debugShowCheckedModeBanner: false,
          theme: yaru.theme,
          darkTheme: yaru.darkTheme,
          themeMode: widget.storage.themeMode,
          home: AppShell(
            storage: widget.storage,
            marketData: widget.marketData,
            notifications: widget.notifications,
            copilot: widget.copilot,
            onThemeChanged: () => setState(() {}),
          ),
        );
      },
    );
  }
}
