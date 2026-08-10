import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/theme/theme';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useUserStore } from '../../src/store/userStore';
import { PaywallModal } from '../../src/components/PaywallModal';

export default function SettingsTab() {
  const {
    unitSystem,
    setUnitSystem,
    notificationsEnabled,
    setNotificationsEnabled,
    autoSaveCalculations,
    setAutoSaveCalculations,
  } = useSettingsStore();

  const { isPremium, setPremiumStatus } = useUserStore();
  const [paywallVisible, setPaywallVisible] = useState(false);

  const handlePurchaseSuccess = () => {
    setPremiumStatus(true);
    setPaywallVisible(false);
    Alert.alert('🎉 Premium Unlocked', 'Thank you for upgrading to FitMetrics Premium! All features & charts are now unlocked.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Settings</Text>
      {/* Premium Upgrade / Status Card */}
      <View style={[styles.card, isPremium ? styles.premiumCardActive : styles.premiumCard]}>
        <View style={styles.premiumHeader}>
          <Ionicons
            name={isPremium ? 'star' : 'star-outline'}
            size={28}
            color={isPremium ? '#FFD700' : theme.colors.dark.primary}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.premiumTitle}>
              {isPremium ? 'FitMetrics Premium Active' : 'Upgrade to Premium'}
            </Text>
            <Text style={styles.premiumSubtitle}>
              {isPremium
                ? 'Ads removed • Unlimited cloud sync • Advanced trends'
                : 'Remove all ads, unlock PDF exports & advanced trend analytics'}
            </Text>
          </View>
        </View>

        {!isPremium ? (
          <TouchableOpacity
            style={styles.upgradeBtn}
            onPress={() => setPaywallVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.upgradeBtnText}>View Premium Plans</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.badgeRow}>
            <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
            <Text style={styles.activeBadgeText}>All Features Unlocked</Text>
          </View>
        )}
      </View>

      {/* Unit System Preferences */}
      <Text style={styles.sectionHeader}>Unit Preferences</Text>
      <View style={styles.card}>
        <Text style={styles.settingLabel}>Default Unit System</Text>
        <Text style={styles.settingDesc}>Applies to all health calculators by default</Text>

        <View style={styles.unitToggleRow}>
          <TouchableOpacity
            style={[styles.unitBtn, unitSystem === 'metric' && styles.unitBtnActive]}
            onPress={() => setUnitSystem('metric')}
          >
            <Ionicons
              name="scale-outline"
              size={18}
              color={unitSystem === 'metric' ? theme.colors.dark.onPrimary : theme.colors.dark.onSurfaceVariant}
            />
            <Text style={[styles.unitBtnText, unitSystem === 'metric' && styles.unitBtnTextActive]}>
              Metric (cm, kg)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.unitBtn, unitSystem === 'imperial' && styles.unitBtnActive]}
            onPress={() => setUnitSystem('imperial')}
          >
            <Ionicons
              name="body-outline"
              size={18}
              color={unitSystem === 'imperial' ? theme.colors.dark.onPrimary : theme.colors.dark.onSurfaceVariant}
            />
            <Text style={[styles.unitBtnText, unitSystem === 'imperial' && styles.unitBtnTextActive]}>
              Imperial (ft/in, lbs)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* App Behavior & Preferences */}
      <Text style={styles.sectionHeader}>App Settings</Text>
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>Daily Health Notifications</Text>
            <Text style={styles.settingDesc}>Receive daily health tips & reminder prompts</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#333', true: theme.colors.dark.primary }}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>Auto-Save Calculations</Text>
            <Text style={styles.settingDesc}>Save valid calculation results to history</Text>
          </View>
          <Switch
            value={autoSaveCalculations}
            onValueChange={setAutoSaveCalculations}
            trackColor={{ false: '#333', true: theme.colors.dark.primary }}
          />
        </View>
      </View>

      {/* App Info & About */}
      <Text style={styles.sectionHeader}>About</Text>
      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Ionicons name="information-circle-outline" size={20} color={theme.colors.dark.primary} />
          <Text style={styles.infoText}>FitMetrics Version 1.0.0 (Build 100)</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#4CAF50" />
          <Text style={styles.infoText}>Medical Disclaimer: Estimates for reference only.</Text>
        </View>
      </View>

      {/* Paywall Modal */}
      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        onSuccess={handlePurchaseSuccess}
      />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.hero,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.dark.onSurface,
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.dark.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: theme.colors.dark.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.shapes.large,
    marginBottom: theme.spacing.xs,
  },
  premiumCard: {
    borderColor: theme.colors.dark.primary,
    borderWidth: 1,
  },
  premiumCardActive: {
    borderColor: '#FFD700',
    borderWidth: 1.5,
    backgroundColor: '#2A2415',
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: theme.spacing.md,
  },
  premiumTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.dark.onSurface,
  },
  premiumSubtitle: {
    fontSize: 12,
    color: theme.colors.dark.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 16,
  },
  upgradeBtn: {
    backgroundColor: theme.colors.dark.primary,
    paddingVertical: 12,
    borderRadius: theme.shapes.medium,
    alignItems: 'center',
  },
  upgradeBtnText: {
    color: theme.colors.dark.onPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  activeBadgeText: {
    color: '#4CAF50',
    fontWeight: '700',
    fontSize: 13,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.dark.onSurface,
  },
  settingDesc: {
    fontSize: 12,
    color: theme.colors.dark.onSurfaceVariant,
    marginTop: 2,
  },
  unitToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: theme.spacing.md,
  },
  unitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: theme.shapes.medium,
    backgroundColor: theme.colors.dark.surfaceVariant,
  },
  unitBtnActive: {
    backgroundColor: theme.colors.dark.primary,
  },
  unitBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.dark.onSurfaceVariant,
  },
  unitBtnTextActive: {
    color: theme.colors.dark.onPrimary,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.dark.surfaceVariant,
    marginVertical: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
  },
  infoText: {
    fontSize: 13,
    color: theme.colors.dark.onSurfaceVariant,
  },
});
