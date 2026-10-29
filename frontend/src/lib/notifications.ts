import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Foreground handler — without this, notifications scheduled while the app
// is open are silently dropped on Android. shouldShowBanner=false because
// the user is already looking at the app (a heads-up popup would be rude);
// shouldShowList=true so it posts to the shade; sound off for the same
// reason (the notification isn't asking for attention, it's a nudge).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

let setupDone = false;
let hasNotifiedThisSession = false;

async function setupNotifications(): Promise<boolean> {
  if (setupDone) return true;
  setupDone = true;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    // Permission denied — user can enable later via Android Settings.
    // Nothing else to do here; the caller just skips the notification.
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('motivation', {
      name: 'Daily Motivation',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 100, 200, 100],
      lightColor: '#0B5E4B',
    });
  }

  return true;
}

/**
 * Show one motivation notification per app-opening session. The session
 * flag prevents duplicate posts even if this is called multiple times
 * (e.g. hook re-mount from hot reload or a navigation quirk).
 *
 * Fires 3 seconds after being called, so the notification lands after the
 * user has settled on the first screen — feels like a gentle reminder
 * rather than a modal that pops during cold start.
 */
export async function showMotivationNotification(payload: {
  title: string;
  message: string;
  type: string;
}): Promise<void> {
  if (hasNotifiedThisSession) return;
  hasNotifiedThisSession = true;

  try {
    const ready = await setupNotifications();
    if (!ready) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: payload.title,
        body: payload.message,
        data: { type: payload.type },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 3,
        channelId: 'motivation',
      },
    });
  } catch (err) {
    // Never let a notification failure break app startup.
    console.warn('[notifications] show failed', err);
  }
}

// Test helper — call from a dev menu to re-enable notifications without
// a full app restart.
export function __resetNotificationSessionForTests() {
  hasNotifiedThisSession = false;
  setupDone = false;
}