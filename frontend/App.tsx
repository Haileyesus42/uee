import { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import NetInfo from '@react-native-community/netinfo';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';
import { useFonts, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { AuthProvider } from './src/auth/AuthProvider';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useMotivationNotification } from './src/hooks/useMotivationNotification';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
  });
}

// The Matriculation (UEE) exam is always on 4 June. Local copy so the
// motivation hook can pass days-remaining to the backend without importing
// from HomeScreen (which would couple App root to a leaf screen module).
function daysUntilMatriculation(now: Date = new Date()): number {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisYear = new Date(startOfToday.getFullYear(), 5, 4);
  const target =
    thisYear < startOfToday ? new Date(startOfToday.getFullYear() + 1, 5, 4) : thisYear;
  return Math.round((target.getTime() - startOfToday.getTime()) / 86_400_000);
}

SplashScreen.preventAutoHideAsync();

// React Query's online/offline pause-and-resume logic (and its default retry
// backoff) only works if it actually knows the device's connectivity state.
// Its built-in onlineManager defaults to always-online and only listens for
// browser `window` online/offline events, which don't exist in React Native —
// so without this, every query/mutation behaves as if the network were always
// up, including firing straight into a dead connection. NetInfo is the actual
// signal; this is the one-line bridge between the two.
onlineManager.setEventListener((setOnline) => {
  const unsubscribe = NetInfo.addEventListener((state) => {
    setOnline(state.isConnected === true && state.isInternetReachable !== false);
  });
  return unsubscribe;
});

export default function App() {
  const [queryClient] = useState(makeQueryClient);
  const [fontsLoaded] = useFonts({
    Manrope_700Bold,
    Manrope_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Fires one Android system notification per app cold-start with a
  // personalized message from /me/motivation. Called unconditionally (before
  // the fontsLoaded early return) so the hook order stays stable.
  // If the user isn't authenticated yet on cold start, the fetch 401s and
  // the hook silently does nothing — the notification will fire on the next
  // session once they're signed in.
  useMotivationNotification(daysUntilMatriculation());

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <RootNavigator />
            </AuthProvider>
          </QueryClientProvider>
          <StatusBar style="auto" />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}