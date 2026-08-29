import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/theme/theme';
import { useUserStore } from '../../src/store/userStore';
import { useUserAuthStore } from '../../src/store/userAuthStore';
import { healthSyncService, HealthData } from '../../src/services/health/healthSyncService';
import { insertWearableLogs } from '../../src/services/supabase/supabaseClient';
import { PaywallModal } from '../../src/components/PaywallModal';
import { checkAndPromptReview } from '../../src/services/reviewService';

const TRIAL_DURATION_DAYS = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export default function IntegrationsScreen() {
  const { isPremium, wearableConnected, wearableTrialStartDate, setWearableConnected, setWearableTrialStartDate } = useUserStore();
  const user = useUserAuthStore((state) => state.user);
  
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [healthData, setHealthData] = useState<HealthData | null>(null);

  // Check trial status
  const isTrialActive = () => {
    if (isPremium) return true; // Premium has unlimited access
    if (!wearableTrialStartDate) return true; // Not started yet

    const start = new Date(wearableTrialStartDate).getTime();
    const now = Date.now();
    const daysElapsed = (now - start) / MS_PER_DAY;
    
    return daysElapsed <= TRIAL_DURATION_DAYS;
  };

  const checkAccessAndFetch = async () => {
    if (!wearableConnected) return;

    if (!isTrialActive()) {
      setWearableConnected(false);
      setPaywallVisible(true);
      return;
    }

    setLoading(true);
    const data = await healthSyncService.fetchTodayData();
    setHealthData(data);
    
    // Save today's data to Supabase if logged in
    if (user?.uid) {
      const todayString = new Date().toISOString().split('T')[0];
      insertWearableLogs(user.uid, [{ date: todayString, data }]);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    if (wearableConnected) {
      checkAccessAndFetch();
    }
  }, [wearableConnected, isPremium]);

  const handleConnect = async () => {
    if (!isTrialActive()) {
      setPaywallVisible(true);
      return;
    }

    setLoading(true);
    const granted = await healthSyncService.requestPermissions();
    if (granted) {
      setWearableConnected(true);
      if (!wearableTrialStartDate && !isPremium) {
        setWearableTrialStartDate(new Date().toISOString());
        Alert.alert('Trial Started', `Your 3-day free trial for Smartwatch Sync has started!`);
      }
      checkAccessAndFetch();
      
      // Trigger 30-day historical sync
      healthSyncService.fetchPast30Days().then((pastData) => {
        console.log(`Fetched ${pastData.length} days of historical data`);
        // Bulk insert pastData into Supabase wearable_daily_logs
        if (user?.uid) {
          insertWearableLogs(user.uid, pastData);
        }
        Alert.alert('Historical Sync Complete', `Successfully imported your past ${pastData.length} days of health data.`);
        
        // Trigger In-App Review after a successful first-time sync
        setTimeout(() => {
          checkAndPromptReview();
        }, 1500);

      }).catch(e => {
        console.error('Historical sync failed:', e);
      });
      
    } else {
      Alert.alert('Permission Denied', 'Please allow Health Connect permissions to sync your data.');
    }
    setLoading(false);
  };

  const handleDisconnect = async () => {
    await healthSyncService.disconnect();
    setWearableConnected(false);
    setHealthData(null);
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Smartwatch & Health Sync' }} />
      
      <View style={styles.header}>
        <Ionicons name="watch-outline" size={64} color={theme.colors.dark.primary} />
        <Text style={styles.title}>Health Connect</Text>
        <Text style={styles.subtitle}>Sync your steps, sleep, and heart rate directly from your smartwatch or fitness band.</Text>
      </View>

      {!isPremium && (
        <View style={styles.trialCard}>
          <View style={styles.trialHeader}>
            <Ionicons name="time-outline" size={24} color="#FFD700" />
            <Text style={styles.trialTitle}>Pro Feature Trial</Text>
          </View>
          {wearableTrialStartDate ? (
            <Text style={styles.trialText}>
              {isTrialActive() 
                ? 'Your 3-day free trial is active. Enjoy seamless health syncing!' 
                : 'Your trial has expired. Upgrade to Premium to continue using smartwatch sync.'}
            </Text>
          ) : (
            <Text style={styles.trialText}>
              Connect now to activate your 3-day free trial. Try before you buy!
            </Text>
          )}
        </View>
      )}

      {wearableConnected ? (
        <View style={styles.content}>
          <TouchableOpacity style={styles.disconnectBtn} onPress={handleDisconnect}>
            <Text style={styles.disconnectBtnText}>Disconnect</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Today's Activity</Text>
          
          <View style={styles.grid}>
            <View style={styles.statCard}>
              <Ionicons name="footsteps" size={28} color={theme.colors.dark.primary} />
              <Text style={styles.statValue}>{healthData?.steps || 0}</Text>
              <Text style={styles.statLabel}>Steps</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="bed" size={28} color="#9C27B0" />
              <Text style={styles.statValue}>{healthData?.sleepHours?.toFixed(1) || '0.0'}h</Text>
              <Text style={styles.statLabel}>Sleep</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="heart" size={28} color="#F44336" />
              <Text style={styles.statValue}>{healthData?.heartRate || 0}</Text>
              <Text style={styles.statLabel}>Avg HR</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="flame" size={28} color="#FF9800" />
              <Text style={styles.statValue}>{healthData?.caloriesBurned?.toFixed(0) || 0}</Text>
              <Text style={styles.statLabel}>kcal</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.syncBtn} onPress={checkAccessAndFetch} disabled={loading}>
            <Ionicons name="sync" size={20} color={theme.colors.dark.onPrimary} style={{ marginRight: 8 }} />
            <Text style={styles.syncBtnText}>{loading ? 'Syncing...' : 'Sync Now'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Why Connect Your Watch?</Text>
            
            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <Ionicons name="flame" size={20} color="#FF9800" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoItemTitle}>Eat More When You Move</Text>
                <Text style={styles.infoItemDesc}>Burn 300 calories running? We automatically add 300 calories to your daily eating allowance.</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <Ionicons name="calendar" size={20} color="#4CAF50" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoItemTitle}>30-Day Instant History</Text>
                <Text style={styles.infoItemDesc}>We instantly pull your past 30 days of fitness data to build your profile the second you connect.</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <Ionicons name="flash" size={20} color={theme.colors.dark.primary} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoItemTitle}>Automatic Background Sync</Text>
                <Text style={styles.infoItemDesc}>Just open FitMetrics and your latest steps, sleep, and heart rate are already there. No manual syncing needed.</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.connectBtn, (!isTrialActive() && !isPremium) && styles.connectBtnDisabled]} 
            onPress={handleConnect}
            disabled={loading}
          >
            <Text style={styles.connectBtnText}>{loading ? 'Connecting...' : 'Connect to Health Connect'}</Text>
          </TouchableOpacity>
          
          {(!isTrialActive() && !isPremium) && (
            <TouchableOpacity style={styles.upgradeBtn} onPress={() => setPaywallVisible(true)}>
              <Text style={styles.upgradeBtnText}>Upgrade to Premium to Unlock</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        onSuccess={() => {}}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark.background,
  },
  header: {
    alignItems: 'center',
    padding: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.dark.onBackground,
    marginTop: 15,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.dark.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
  },
  trialCard: {
    backgroundColor: '#332D15',
    marginHorizontal: 20,
    borderRadius: theme.shapes.large,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFD70033',
  },
  trialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  trialTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  trialText: {
    color: '#E0E0E0',
    fontSize: 14,
    lineHeight: 20,
  },
  content: {
    padding: 20,
  },
  connectBtn: {
    backgroundColor: theme.colors.dark.primary,
    paddingVertical: 16,
    borderRadius: theme.shapes.large,
    alignItems: 'center',
  },
  connectBtnDisabled: {
    backgroundColor: theme.colors.dark.surfaceVariant,
  },
  connectBtnText: {
    color: theme.colors.dark.onPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  disconnectBtn: {
    paddingVertical: 12,
    borderRadius: theme.shapes.medium,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.dark.error,
    marginBottom: 30,
  },
  disconnectBtnText: {
    color: theme.colors.dark.error,
    fontSize: 15,
    fontWeight: '600',
  },
  upgradeBtn: {
    marginTop: 15,
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: theme.shapes.large,
    alignItems: 'center',
  },
  upgradeBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.dark.onBackground,
    marginBottom: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: theme.colors.dark.surface,
    borderRadius: theme.shapes.large,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.dark.onSurface,
    marginTop: 10,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 13,
    color: theme.colors.dark.onSurfaceVariant,
  },
  syncBtn: {
    backgroundColor: theme.colors.dark.primary,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: theme.shapes.large,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  syncBtnText: {
    color: theme.colors.dark.onPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: theme.colors.dark.surface,
    borderRadius: theme.shapes.large,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.dark.outline + '40',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.dark.onSurface,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.dark.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.dark.onSurface,
    marginBottom: 4,
  },
  infoItemDesc: {
    fontSize: 13,
    color: theme.colors.dark.onSurfaceVariant,
    lineHeight: 18,
  },
});
