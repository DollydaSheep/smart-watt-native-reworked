import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync(userId?: string) {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('appliance-events', {
      name: 'Appliance Events',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    console.log('Missing EAS projectId');
    return null;
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
  const expoPushToken = tokenResponse.data;

  const { error } = await supabase
    .from('user_push_tokens')
    .upsert({
      user_id: userId ?? null,
      expo_push_token: expoPushToken,
      platform: Platform.OS,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'expo_push_token' });

  if (error) {
    console.error('Failed to save push token:', error);
    return null;
  }

  return expoPushToken;
}