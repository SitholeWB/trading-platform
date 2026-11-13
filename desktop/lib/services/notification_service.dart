import 'dart:io';
import 'package:dbus/dbus.dart';

class NotificationService {
  Future<void> sendDesktopNotification({
    required String title,
    required String body,
    bool urgent = false,
  }) async {
    if (!Platform.isLinux) return;
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
          const DBusString(''),
          DBusString(title),
          DBusString(body),
          DBusArray.string(const []),
          DBusDict.stringVariant({
            'urgency': DBusByte(urgent ? 2 : 1),
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
}
