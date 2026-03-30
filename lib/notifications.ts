import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { addDays, subDays, isFuture } from 'date-fns';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications only work on physical devices');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'ReNotify Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366F1',
    });
  }

  return token;
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  triggerDate: Date
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: triggerDate,
  });
}

export async function scheduleRemindersForDate(
  label: string,
  expiryDate: Date
): Promise<string[]> {
  const scheduledIds: string[] = [];
  const intervals = [30, 7, 1, 0];

  for (const days of intervals) {
    const triggerDate = days === 0 ? expiryDate : subDays(expiryDate, days);
    if (!isFuture(triggerDate)) continue;

    const title = days === 0
      ? `${label} expires today!`
      : `${label} expires in ${days} day${days > 1 ? 's' : ''}`;

    const body = days === 0
      ? 'Take action now to renew or service.'
      : `Reminder: ${label} is due soon.`;

    try {
      const id = await scheduleLocalNotification(title, body, triggerDate);
      scheduledIds.push(id);
    } catch (e) {
      console.error(`Failed to schedule ${days}d reminder:`, e);
    }
  }

  return scheduledIds;
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
