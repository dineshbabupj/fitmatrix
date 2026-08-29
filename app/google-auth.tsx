import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { theme } from '../src/theme/theme';

export default function GoogleAuthRedirectScreen() {
  useEffect(() => {
    // The deep link is already being handled by RootLayout's Linking listener
    // which calls handleAuthDeepLink and updates the Supabase session.
    // We just need to wait a moment for the session to be processed,
    // then navigate back to the main app (profile tab where login usually happens).
    const timer = setTimeout(() => {
      router.replace('/(tabs)/settings');
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.dark.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
