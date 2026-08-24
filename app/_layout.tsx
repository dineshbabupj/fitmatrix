import React from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { theme } from '../src/theme/theme';
import { initDatabase } from '../src/data/db';
import { handleAuthDeepLink } from '../src/services/supabase/supabaseClient';
import { SyncStatusBanner } from '../src/components/SyncStatusBanner';
import { useUserStore } from '../src/store/userStore';
import { revenueCatService } from '../src/services/iap/revenueCatService';
import { adMobManager } from '../src/services/admob/adMobManager';
import { notificationService } from '../src/services/notifications/notificationService';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

const customDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: theme.colors.dark.primary,
    background: theme.colors.dark.background,
    card: theme.colors.dark.surface,
    text: theme.colors.dark.onSurface,
    border: theme.colors.dark.outline,
    notification: theme.colors.dark.primary,
  },
};

export default function RootLayout() {
  const [isDbReady, setIsDbReady] = React.useState(false);
  const hasCompletedOnboarding = useUserStore((state) => state.hasCompletedOnboarding);

  React.useEffect(() => {
    async function setup() {
      try {
        // Critical path: DB + auth only. Keeps startup fast.
        await initDatabase();
        const { loadPersistedAuth } = require('../src/store/userAuthStore').useUserAuthStore.getState();
        await loadPersistedAuth();
      } catch (e) {
        console.error('Failed to initialize app:', e);
      } finally {
        setIsDbReady(true);
      }

      // Deferred: heavy native SDKs that can ANR on first launch
      // (AdMob class verification + RevenueCat) run after the UI is visible.
      try {
        await revenueCatService.init();
      } catch (e) {
        console.warn('RevenueCat init deferred:', e);
      }
      try {
        await adMobManager.init();
      } catch (e) {
        console.warn('AdMob init deferred:', e);
      }

      // Request notification permissions and schedule reminders
      try {
        const granted = await notificationService.requestPermissions();
        if (granted) {
          await notificationService.scheduleWorkoutReminder();
          await notificationService.scheduleWaterReminder();
        }
      } catch (e) {
        console.warn('Notification setup deferred:', e);
      }
    }
    setup();
  }, []);

  // Handle deep links for auth callbacks (email magic link, Google OAuth)
  React.useEffect(() => {
    // Handle URL that opened the app
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('[RootLayout] Deep link URL:', url);
      handleAuthDeepLink(url);
    });

    // Check if app was opened from a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('[RootLayout] Initial deep link URL:', url);
        handleAuthDeepLink(url);
      }
    });

    return () => subscription.remove();
  }, []);

  React.useEffect(() => {
    if (isDbReady && !hasCompletedOnboarding) {
      router.replace('/onboarding');
    }
  }, [isDbReady, hasCompletedOnboarding]);

  if (!isDbReady) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.dark.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.dark.primary} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
    <ThemeProvider value={customDarkTheme}>
      <StatusBar style="light" backgroundColor="transparent" translucent={true} />
      <SyncStatusBanner />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.dark.background,
          },
          headerTintColor: theme.colors.dark.onSurface,
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: theme.colors.dark.background,
          },
        }}
      >
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        {/* Stack screens for individual calculators */}
        <Stack.Screen 
          name="calculators/bmi" 
          options={{ 
            title: 'BMI Calculator',
            headerRight: () => (
              <TouchableOpacity onPress={() => router.push('/history-modal')} style={{ paddingRight: 8 }}>
                <Ionicons name="time-outline" size={24} color={theme.colors.dark.primary} />
              </TouchableOpacity>
            ),
          }} 
        />
        <Stack.Screen 
          name="calculators/bmr" 
          options={{ 
            title: 'BMR Calculator',
            headerRight: () => (
              <TouchableOpacity onPress={() => router.push('/history-modal')} style={{ paddingRight: 8 }}>
                <Ionicons name="time-outline" size={24} color={theme.colors.dark.primary} />
              </TouchableOpacity>
            ),
          }} 
        />
        <Stack.Screen 
          name="calculators/body-fat" 
          options={{ 
            title: 'Body Fat Calculator',
            headerRight: () => (
              <TouchableOpacity onPress={() => router.push('/history-modal')} style={{ paddingRight: 8 }}>
                <Ionicons name="time-outline" size={24} color={theme.colors.dark.primary} />
              </TouchableOpacity>
            ),
          }} 
        />
        <Stack.Screen 
          name="calculators/ideal-weight" 
          options={{ 
            title: 'Ideal Weight Calculator',
            headerRight: () => (
              <TouchableOpacity onPress={() => router.push('/history-modal')} style={{ paddingRight: 8 }}>
                <Ionicons name="time-outline" size={24} color={theme.colors.dark.primary} />
              </TouchableOpacity>
            ),
          }} 
        />

        {/* Modal presentation for History Bottom Sheet */}
        <Stack.Screen
          name="history-modal"
          options={{
            presentation: 'modal',
            title: 'Calculation History',
            headerStyle: {
              backgroundColor: '#1E1E1E',
            },
            headerLeft: () => null,
            headerRight: () => (
              <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 8 }}>
                <Ionicons name="close" size={26} color={theme.colors.dark.onSurface} />
              </TouchableOpacity>
            ),
          }}
        />
        <Stack.Screen
          name="workouts/new"
          options={{
            presentation: 'modal',
            title: 'Log Workout',
            headerStyle: {
              backgroundColor: '#1E1E1E',
            },
            headerLeft: () => null,
            headerRight: () => (
              <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 8 }}>
                <Ionicons name="close" size={26} color={theme.colors.dark.onSurface} />
              </TouchableOpacity>
            ),
          }}
        />
        <Stack.Screen name="food/index" options={{ headerShown: false }} />
        <Stack.Screen name="food/scanner" options={{ headerShown: false }} />
        <Stack.Screen name="water/index" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
    </ErrorBoundary>
  );
}

