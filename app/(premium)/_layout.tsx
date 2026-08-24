import React, { useState, useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../src/store/userStore';
import { PaywallModal } from '../../src/components/PaywallModal';
import { theme } from '../../src/theme/theme';

export default function PremiumLayout() {
  const { isPremium, setPremiumStatus } = useUserStore();
  const [paywallVisible, setPaywallVisible] = useState(false);

  useEffect(() => {
    if (!isPremium) {
      setPaywallVisible(true);
    }
  }, [isPremium]);

  if (!isPremium) {
    return (
      <View style={styles.container}>
        <Ionicons name="lock-closed" size={64} color={theme.colors.dark.primary} style={styles.icon} />
        <Text style={styles.title}>Premium Feature Locked</Text>
        <Text style={styles.subtitle}>
          This is a Pro feature. Upgrade to unlock AI Meal Planner, Symptom Checker, Text Macro Logger, Safety Scanner, and Alternative Advisor!
        </Text>
        <TouchableOpacity style={styles.btn} onPress={() => setPaywallVisible(true)}>
          <Text style={styles.btnText}>Unlock Pro Access</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>

        <PaywallModal
          visible={paywallVisible}
          onClose={() => setPaywallVisible(false)}
          onSuccess={() => {
            setPremiumStatus(true);
          }}
        />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.dark.surface,
        },
        headerTintColor: theme.colors.dark.onSurface,
        headerTitleStyle: {
          fontWeight: '700',
        },
        headerShadowVisible: false,
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.dark.onSurface,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.dark.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  btn: {
    backgroundColor: theme.colors.dark.primary,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: theme.shapes.large,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  btnText: {
    color: theme.colors.dark.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  backBtn: {
    paddingVertical: 10,
  },
  backBtnText: {
    color: theme.colors.dark.outline,
    fontSize: 14,
    fontWeight: '600',
  },
});
