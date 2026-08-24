import React, { useState, useEffect } from 'react';
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
import { useUserAuthStore } from '../../src/store/userAuthStore';
import { PaywallModal } from '../../src/components/PaywallModal';
import { AuthModal } from '../../src/components/AuthModal';
import { revenueCatService } from '../../src/services/iap/revenueCatService';
import { pdfExportService } from '../../src/services/export/pdfExportService';
import { cloudSyncService } from '../../src/services/sync/cloudSyncService';

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
  const { user, isAuthenticated, isGuest, openAuthModal, logout, lastSyncedAt, isSyncing } = useUserAuthStore();
  const [paywallVisible, setPaywallVisible] = useState(false);

  // Check real entitlement status on mount
  useEffect(() => {
    revenueCatService.hasProAccess().then((hasPro) => {
      if (hasPro !== isPremium) setPremiumStatus(hasPro);
    });
  }, []);

  const handlePurchaseSuccess = async () => {
    const hasPro = await revenueCatService.hasProAccess();
    setPremiumStatus(hasPro);
    setPaywallVisible(false);
    Alert.alert('🎉 Premium Unlocked', 'Thank you for upgrading to FitMetrics Pro! All features & charts are now unlocked.');
  };

  const handleManualSync = async () => {
    const res = await cloudSyncService.syncAllData();
    Alert.alert(res.success ? 'Cloud Backup Complete ☁️' : 'Sync Status', res.message);
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

      {/* Account & Cloud Sync Section */}
      <Text style={styles.sectionHeader}>Account & Cloud Backup</Text>
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>
              {isAuthenticated ? user?.displayName || user?.phoneNumber || user?.email : 'Guest User (Offline Mode)'}
            </Text>
            <Text style={styles.settingDesc}>
              {isAuthenticated
                ? `Phone/Email: ${user?.phoneNumber || user?.email || 'Verified'}`
                : 'Sign in with Mobile OTP to backup workouts & progress'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.authActionBtn}
            onPress={isAuthenticated ? logout : openAuthModal}
          >
            <Text style={styles.authActionText}>
              {isAuthenticated ? 'Sign Out' : 'Sign In / Register'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>Cloud Data Sync</Text>
            <Text style={styles.settingDesc}>
              {lastSyncedAt
                ? `Last backed up: ${new Date(lastSyncedAt).toLocaleTimeString()}`
                : 'Auto-syncs local SQLite data to Cloud'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.syncBtn}
            onPress={handleManualSync}
            disabled={isSyncing}
          >
            <Ionicons name={isSyncing ? 'sync-circle' : 'cloud-upload-outline'} size={18} color="#4CAF50" />
            <Text style={styles.syncBtnText}>{isSyncing ? 'Syncing...' : 'Sync Now'}</Text>
          </TouchableOpacity>
        </View>
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
      <Text style={styles.sectionHeader}>Export & Data</Text>
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.settingRow}
          onPress={async () => {
            const success = await pdfExportService.generateReport();
            if (!success) {
              setPaywallVisible(true);
            }
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>Export PDF Health Report 🔒</Text>
            <Text style={styles.settingDesc}>Generate a 30-day health summary for your Personal Trainer</Text>
          </View>
          <Ionicons name="document-text-outline" size={22} color={theme.colors.dark.primary} />
        </TouchableOpacity>
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

      {/* Paywall & Auth Modals */}
      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        onSuccess={handlePurchaseSuccess}
      />
      <AuthModal />
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
  authActionBtn: {
    backgroundColor: theme.colors.dark.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.shapes.medium,
  },
  authActionText: {
    color: theme.colors.dark.onPrimary,
    fontWeight: '700',
    fontSize: 12,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.shapes.medium,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  syncBtnText: {
    color: '#4CAF50',
    fontWeight: '700',
    fontSize: 12,
  },
});
