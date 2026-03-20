import '@/global.css';
import { SmartWattProvider } from '@/lib/context';
import { StatsProvider } from '@/lib/statsContext';

import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { registerForPushNotificationsAsync } from '@/lib/notifications';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  useEffect(() => {
    registerForPushNotificationsAsync();

    const receivedSub = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('Tapped notification data:', data);

      if (data?.eventId) {
        router.push('/history');
      }
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);

  

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <SmartWattProvider>
          <StatsProvider>
          <Stack>
            <Stack.Screen name='(tabs)' options={{headerShown: false}}/>
            <Stack.Screen name='history' />
          </Stack>
          </StatsProvider>
          </SmartWattProvider>
        <PortalHost />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
