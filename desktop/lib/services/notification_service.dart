import 'dart:io';
import 'package:dbus/dbus.dart';
import 'package:flutter/foundation.dart';

class AppNotificationItem {
  final String id;
  final String title;
  final String body;
  final DateTime timestamp;
  final bool urgent;
  final bool read;

  const AppNotificationItem({
    required this.id,
    required this.title,
    required this.body,
    required this.timestamp,
    this.urgent = false,
    this.read = false,
  });

  AppNotificationItem copyWith({bool? read}) => AppNotificationItem(
        id: id,
        title: title,
        body: body,
        timestamp: timestamp,
        urgent: urgent,
        read: read ?? this.read,
      );
}

class NotificationService extends ChangeNotifier {
  static const String desktopAppId = 'com.tradingplatform.desktop';
  static const List<String> launcherUris = [
    'application://$desktopAppId.desktop',
    'application://trading-platform_trading-platform.desktop',
  ];

  final List<AppNotificationItem> _history = [];

  List<AppNotificationItem> get history => List.unmodifiable(_history);

  int get unreadCount => _history.where((n) => !n.read).length;

  Future<void> sendDesktopNotification({
    required String title,
    required String body,
    bool urgent = false,
  }) async {
    _history.insert(
      0,
      AppNotificationItem(
        id: 'notif_${DateTime.now().microsecondsSinceEpoch}',
        title: title,
        body: body,
        timestamp: DateTime.now().toUtc(),
        urgent: urgent,
      ),
    );
    if (_history.length > 60) {
      _history.removeRange(60, _history.length);
    }
    notifyListeners();

    if (!Platform.isLinux) return;
    await updateLauncherBadge(unreadCount);

    try {
      final client = DBusClient.session();
      final object = DBusRemoteObject(
        client,
        name: 'org.freedesktop.Notifications',
        path: DBusObjectPath('/org/freedesktop/Notifications'),
      );
      await object.callMethod(
        'org.freedesktop.Notifications',
        'Notify',
        [
          const DBusString('Trading Platform'),
          const DBusUint32(0),
          const DBusString(desktopAppId),
          DBusString(title),
          DBusString(body),
          DBusArray.string(const []),
          DBusDict.stringVariant({
            'urgency': DBusByte(urgent ? 2 : 1),
            'desktop-entry': const DBusString(desktopAppId),
          }),
          const DBusInt32(5000),
        ],
        replySignature: DBusSignature('u'),
      );
      await client.close();
    } catch (_) {
      // ignore D-Bus errors in headless environments
    }
  }

  /// Emits com.canonical.Unity.LauncherEntry Update signal on the session bus
  /// so Linux docks (GNOME Ubuntu Dock, Plank, Dash-to-Dock, KDE) render the
  /// numeric badge directly on the app's launch icon.
  Future<void> updateLauncherBadge(int count) async {
    if (!Platform.isLinux) return;
    try {
      final client = DBusClient.session();
      for (final uri in launcherUris) {
        await client.emitSignal(
          path: DBusObjectPath(
              '/com/canonical/unity/launcherentry/trading_platform'),
          interface: 'com.canonical.Unity.LauncherEntry',
          name: 'Update',
          values: [
            DBusString(uri),
            DBusDict.stringVariant({
              'count': DBusInt64(count),
              'count-visible': DBusBoolean(count > 0),
            }),
          ],
        );
      }
      await client.close();
    } catch (_) {
      // ignore D-Bus errors in headless environments
    }
  }

  Future<void> markAllRead() async {
    bool changed = false;
    for (int i = 0; i < _history.length; i++) {
      if (!_history[i].read) {
        _history[i] = _history[i].copyWith(read: true);
        changed = true;
      }
    }
    if (changed) {
      notifyListeners();
      await updateLauncherBadge(0);
    }
  }

  Future<void> clearAll() async {
    _history.clear();
    notifyListeners();
    await updateLauncherBadge(0);
  }
}
