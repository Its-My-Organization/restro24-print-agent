import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Foreground Service for Android
 * 
 * Keeps the app alive in the background by showing a persistent notification.
 * This is essential for the print agent to continue polling even when the app
 * is in the background or the screen is off.
 */

const NOTIFICATION_CHANNEL_ID = 'restro-print-agent-channel';
const NOTIFICATION_ID = 1;

/**
 * Configure notification channel for Android
 */
async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
      name: 'Print Agent Service',
      description: 'Keeps the print agent running in the background',
      importance: Notifications.AndroidImportance.LOW, // Low priority - doesn't make sound
      enableVibrate: false,
      showBadge: false,
    });
  }
}

/**
 * Start foreground service (shows persistent notification)
 */
export async function startForegroundService() {
  await setupNotificationChannel();

  await Notifications.scheduleNotificationAsync({
    identifier: String(NOTIFICATION_ID),
    content: {
      title: 'Print Agent Running',
      body: 'Polling for print jobs...',
      data: { type: 'foreground-service' },
      ...(Platform.OS === 'android' && {
        android: {
          channelId: NOTIFICATION_CHANNEL_ID,
          ongoing: true, // Can't be dismissed
          autoCancel: false,
          priority: Notifications.AndroidNotificationPriority.LOW,
        },
      }),
    },
    trigger: null, // Show immediately and keep showing
  });
}

/**
 * Stop foreground service (dismiss notification)
 */
export async function stopForegroundService() {
  await Notifications.dismissNotificationAsync(String(NOTIFICATION_ID));
}

/**
 * Update notification with current status
 */
export async function updateForegroundServiceStatus(
  status: 'running' | 'stopped',
  lastJobTime?: string,
) {
  await setupNotificationChannel();

  const body = status === 'running'
    ? lastJobTime
      ? `Last job: ${lastJobTime}`
      : 'Polling for print jobs...'
    : 'Agent stopped';

  await Notifications.scheduleNotificationAsync({
    identifier: String(NOTIFICATION_ID),
    content: {
      title: 'Print Agent',
      body,
      data: { type: 'foreground-service' },
      ...(Platform.OS === 'android' && {
        android: {
          channelId: NOTIFICATION_CHANNEL_ID,
          ongoing: status === 'running',
          autoCancel: false,
          priority: Notifications.AndroidNotificationPriority.LOW,
        },
      }),
    },
    trigger: null,
  });
}

