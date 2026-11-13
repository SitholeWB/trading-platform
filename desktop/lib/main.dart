import 'package:flutter/material.dart';
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
