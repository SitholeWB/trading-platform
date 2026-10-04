import { playAlertChime } from './audioAlert';

/**
 * Cross-Platform Desktop & Web Notification System
 * Compatible with Linux (GNOME/Ubuntu notify), Windows Action Center, macOS Notification Center,
 * and standard web browser desktop notifications.
 */

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('[DesktopNotification] Failed to request permission:', err);
    return Notification.permission;
  }
}

export interface SendNotificationOptions {
  title: string;
  body: string;
  tag?: string;
  icon?: string;
  playSound?: boolean;
  onClick?: () => void;
}

export async function sendDesktopNotification(options: SendNotificationOptions): Promise<boolean> {
  const { title, body, tag, icon, playSound = true, onClick } = options;

  if (playSound) {
    try {
      playAlertChime();
    } catch {
      // Audio chime error suppressed
    }
  }

  if (!isNotificationSupported()) {
    console.warn('[DesktopNotification] Notifications not supported in this environment');
    return false;
  }

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await requestNotificationPermission();
  }

  if (permission !== 'granted') {
    console.info('[DesktopNotification] Notification permission not granted:', permission);
    return false;
  }

  try {
    const notification = new Notification(title, {
      body,
      tag: tag || 'trading-platform-strategy-alert',
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      requireInteraction: true, // Keep notification active until user interacts
      silent: false,
    });

    notification.onclick = (event) => {
      event.preventDefault();
      try {
        window.focus();
      } catch {}
      if (onClick) {
        onClick();
      }
      notification.close();
    };

    return true;
  } catch (err) {
    console.warn('[DesktopNotification] Error displaying system notification:', err);
    return false;
  }
}
