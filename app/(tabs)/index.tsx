import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/theme/theme';
import { useUserStore } from '../../src/store/userStore';
import { useFoodStore } from '../../src/store/foodStore';
import { useWaterStore } from '../../src/store/waterStore';
import { healthService } from '../../src/services/health/healthService';
import { AdBanner } from '../../src/components/AdBanner';
import { PaywallModal } from '../../src/components/PaywallModal';

const AnimatedProgressBar = ({ progress, color }: { progress: number; color: string }) => {
  const [animatedWidth] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: 800,
      useNativeDriver: false, // width doesn't support native driver
    }).start();
  }, [progress]);

  return (
    <View style={styles.progressBarBg}>
      <Animated.View
        style={[
          styles.progressBarFill,
          {
            backgroundColor: color,
            width: animatedWidth.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
};

export default function HomeScreen() {
  const profile = useUserStore((state) => state.profile);
  const { getTodayTotals } = useFoodStore();
  const totals = getTodayTotals();
  const waterIntake = useWaterStore((state) => state.getTodayIntake());
  const waterGoal = useWaterStore((state) => state.dailyGoal);
  const isPremium = useUserStore((state) => state.isPremium);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [steps, setSteps] = useState(0);
  const [stepSource, setStepSource] = useState<string>('mock');

  // Live step count — Option 1 (pedometer) with Option 2 (Google Fit) fallback
  useEffect(() => {
    let mounted = true;

    const loadSteps = async () => {
      const data = await healthService.getStepsBestSource();
      if (mounted) {
        setSteps(data.steps);
        setStepSource(data.source);
      }
    };

    loadSteps();

    // Subscribe to live updates from pedometer
    healthService.subscribeToSteps((data) => {
      if (mounted) {
        setSteps(data.steps);
        setStepSource(data.source);
      }
    });

    return () => {
      mounted = false;
      healthService.unsubscribe();
    };
  }, []);

  // Basic goals based on profile
  const calorieGoal = profile.goal === 'lose_weight' ? 1800 : profile.goal === 'build_muscle' ? 2800 : 2200;
  const proteinGoal = profile.weightKg ? profile.weightKg * 2 : 150;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Ready to crush it,</Text>
            <Text style={styles.name}>{profile.name || 'Athlete'}!</Text>
          </View>
          <TouchableOpacity style={styles.profileBtn}>
            <Ionicons name="person-circle" size={40} color={theme.colors.dark.primary} />
          </TouchableOpacity>
        </View>

        {/* Today's Focus Card */}
        <View style={styles.focusCard}>
          <View style={styles.focusHeader}>
            <Text style={styles.focusTitle}>Today's Focus</Text>
            <View style={styles.focusBadge}>
              <Text style={styles.focusBadgeText}>Leg Day</Text>
            </View>
          </View>
          <Text style={styles.focusDesc}>Squats, Lunges, and Deadlifts are on the menu today.</Text>
          
          <TouchableOpacity style={styles.startWorkoutBtn} onPress={() => router.push('/workouts')}>
            <Ionicons name="play" size={20} color="#121212" />
            <Text style={styles.startWorkoutBtnText}>Start Workout</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Log Buttons */}
        <Text style={styles.sectionTitle}>Quick Log</Text>
        <View style={styles.quickLogGrid}>
          <TouchableOpacity style={styles.quickLogCard} onPress={() => router.push('/workouts')}>
            <View style={[styles.iconBox, { backgroundColor: '#FF525222' }]}>
              <Ionicons name="barbell" size={24} color="#FF5252" />
            </View>
            <Text style={styles.quickLogText}>Workout</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickLogCard} onPress={() => router.push('/food')}>
            <View style={[styles.iconBox, { backgroundColor: '#4CAF5022' }]}>
              <Ionicons name="restaurant" size={24} color="#4CAF50" />
            </View>
            <Text style={styles.quickLogText}>Food</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickLogCard} onPress={() => router.push('/water')}>
            <View style={[styles.iconBox, { backgroundColor: '#03A9F422' }]}>
              <Ionicons name="water" size={24} color="#03A9F4" />
            </View>
            <Text style={styles.quickLogText}>Water</Text>
          </TouchableOpacity>
        </View>

        {/* Daily Progress */}
        <Text style={styles.sectionTitle}>Daily Progress</Text>
        
        {/* Calories */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={styles.progressTitleRow}>
              <Ionicons name="flame" size={18} color="#FF9800" />
              <Text style={styles.progressTitle}>Calories</Text>
            </View>
            <Text style={styles.progressValues}>{totals.calories} / {calorieGoal} kcal</Text>
          </View>
          <AnimatedProgressBar progress={totals.calories / calorieGoal} color="#FF9800" />
        </View>

        {/* Protein */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={styles.progressTitleRow}>
              <Ionicons name="egg" size={18} color="#E91E63" />
              <Text style={styles.progressTitle}>Protein</Text>
            </View>
            <Text style={styles.progressValues}>{totals.protein} / {proteinGoal} g</Text>
          </View>
          <AnimatedProgressBar progress={totals.protein / proteinGoal} color="#E91E63" />
        </View>

        {/* Steps */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={styles.progressTitleRow}>
              <Ionicons name="footsteps" size={18} color="#4CAF50" />
              <Text style={styles.progressTitle}>Steps {stepSource === 'google_fit' ? '⌚' : stepSource === 'pedometer' ? '📱' : ''}</Text>
            </View>
            <Text style={styles.progressValues}>{steps.toLocaleString()} / 10,000</Text>
          </View>
          <AnimatedProgressBar progress={Math.min(steps / 10000, 1)} color="#4CAF50" />
        </View>

        {/* Water */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={styles.progressTitleRow}>
              <Ionicons name="water" size={18} color="#03A9F4" />
              <Text style={styles.progressTitle}>Water</Text>
            </View>
            <Text style={styles.progressValues}>{waterIntake} / {waterGoal} ml</Text>
          </View>
          <AnimatedProgressBar progress={Math.min(waterIntake / waterGoal, 1)} color="#03A9F4" />
        </View>

        {/* Ad Banner (hidden for Pro users) */}
        <AdBanner />

        {/* Pro Upsell Card (only for free users) */}
        {!isPremium && (
          <TouchableOpacity style={styles.proCard} onPress={() => setPaywallVisible(true)} activeOpacity={0.85}>
            <View style={styles.proCardInner}>
              <View style={styles.proIconBox}>
                <Ionicons name="sparkles" size={24} color="#FFD700" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.proTitle}>Upgrade to FitMetrics Pro</Text>
                <Text style={styles.proSubtitle}>Remove ads • AI Coach • Barcode Scanner • Heatmaps</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.dark.onSurfaceVariant} />
            </View>
          </TouchableOpacity>
        )}

        {/* Empty State Helper (To guide the user) */}
        <View style={styles.helperCard}>
          <Ionicons name="information-circle-outline" size={24} color={theme.colors.dark.outline} />
          <Text style={styles.helperText}>Tap the buttons above to log your first activity of the day.</Text>
        </View>

        {/* Paywall Modal */}
        <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />

        <View style={{ height: 80 }} />
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
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: theme.colors.dark.onSurfaceVariant,
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.dark.onSurface,
  },
  profileBtn: {
    padding: 4,
  },
  focusCard: {
    backgroundColor: theme.colors.dark.surface,
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: theme.colors.dark.outline + '40',
  },
  focusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  focusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.dark.onSurface,
  },
  focusBadge: {
    backgroundColor: theme.colors.dark.primary + '33',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  focusBadgeText: {
    color: theme.colors.dark.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  focusDesc: {
    fontSize: 14,
    color: theme.colors.dark.onSurfaceVariant,
    marginBottom: 24,
    lineHeight: 20,
  },
  startWorkoutBtn: {
    backgroundColor: theme.colors.dark.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  startWorkoutBtnText: {
    color: '#121212',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.dark.onSurface,
    marginBottom: 16,
  },
  quickLogGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  quickLogCard: {
    backgroundColor: theme.colors.dark.surface,
    width: '31%',
    aspectRatio: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.dark.outline + '40',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickLogText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.dark.onSurface,
  },
  progressCard: {
    backgroundColor: theme.colors.dark.surface,
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.dark.onSurface,
  },
  progressValues: {
    fontSize: 14,
    color: theme.colors.dark.onSurfaceVariant,
    fontWeight: '500',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: theme.colors.dark.surfaceVariant,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  helperCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.dark.surfaceVariant + '80',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 12,
  },
  helperText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.dark.onSurfaceVariant,
    lineHeight: 20,
  },
  proCard: {
    backgroundColor: theme.colors.dark.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#FFD700' + '60',
  },
  proCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  proIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFD70022',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFD700',
  },
  proSubtitle: {
    fontSize: 12,
    color: theme.colors.dark.onSurfaceVariant,
    marginTop: 2,
  },
});
