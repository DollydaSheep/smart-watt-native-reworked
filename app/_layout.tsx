import '@/global.css';
import { SmartWattProvider } from '@/lib/context';
import { StatsProvider } from '@/lib/statsContext';

import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

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
