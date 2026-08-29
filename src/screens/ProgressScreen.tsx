import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { InputCard } from '../components/InputCard';
import { ProgressCharts } from '../components/ProgressCharts';
import { storage } from '../data/storage';
import { calculationsDb, CalculationRecord } from '../data/db';
import { theme } from '../theme/theme';
import { useWaterStore } from '../store/useWaterStore';
import { useMealStore } from '../store/mealStore';
import { MealTrackerModal } from '../components/MealTrackerModal';

import { WeeklyAISummaryCard } from '../components/WeeklyAISummaryCard';
import { WeatherWidget } from '../components/WeatherWidget';
import * as Notifications from 'expo-notifications';
import { Pedometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ProgressScreen = () => {
  const goal = storage.getGoal();

  const [records, setRecords] = useState<CalculationRecord[]>([]);
  const [currentWeight, setCurrentWeight] = useState(goal.currentWeight.toString());
  const [targetWeight, setTargetWeight] = useState(goal.targetWeight.toString());
  const [dailyDeficit, setDailyDeficit] = useState(goal.dailyDeficit.toString());

  // Meal Store & Modal
  const { loadTodayMeals, getNutritionSummary } = useMealStore();
  const [mealModalVisible, setMealModalVisible] = useState(false);
  const nutrition = getNutritionSummary();

  // Water Store
  const { logs, dailyGoal, addWater } = useWaterStore();
  const todayString = new Date().toISOString().split('T')[0];
  const waterToday = logs[todayString] || 0;
  const waterProgress = Math.min(waterToday / dailyGoal, 1);

  // Step Counter
  const [isPedometerAvailable, setIsPedometerAvailable] = useState('checking');
  const [pastStepCount, setPastStepCount] = useState(0);

  // Load calculations and meals from SQLite whenever screen gains focus
  const loadData = useCallback(async () => {
    try {
      const dbRecords = await calculationsDb.getAll();
      setRecords(dbRecords);
      await loadTodayMeals();
    } catch (e) {
      console.warn('Failed to load calculations from SQLite for ProgressScreen:', e);
    }
  }, [loadTodayMeals]);


  const [stepSubscription, setStepSubscription] = useState<any>(null);

  const checkPedometer = async () => {
    try {
      const { granted } = await Pedometer.requestPermissionsAsync();
      if (!granted) {
        setIsPedometerAvailable('false');
        return;
      }

      const isAvailable = await Pedometer.isAvailableAsync();
      setIsPedometerAvailable(String(isAvailable));

      const todayKey = `fitmetrics_steps_${new Date().toISOString().split('T')[0]}`;
      const savedStepsStr = await AsyncStorage.getItem(todayKey);
      const savedSteps = savedStepsStr ? parseInt(savedStepsStr, 10) : 0;
      setPastStepCount(savedSteps);

      if (isAvailable) {
        if (Platform.OS === 'ios') {
          const end = new Date();
          const start = new Date();
          start.setHours(0, 0, 0, 0);
          const pastStepCountResult = await Pedometer.getStepCountAsync(start, end);
          if (pastStepCountResult) {
            const currentSteps = pastStepCountResult.steps;
            setPastStepCount(currentSteps);
            await AsyncStorage.setItem(todayKey, currentSteps.toString());
          }
        } else {
          // Live step watcher for Android with AsyncStorage daily baseline update
          let liveSessionSteps = 0;
          const sub = Pedometer.watchStepCount((result) => {
            liveSessionSteps = result.steps;
            const updatedTotal = savedSteps + liveSessionSteps;
            setPastStepCount(updatedTotal);
            AsyncStorage.setItem(todayKey, updatedTotal.toString()).catch(() => {});
          });
          setStepSubscription(sub);
        }
      }
    } catch (error) {
      console.warn('Pedometer error:', error);
      setIsPedometerAvailable('false');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
      checkPedometer();
      
      return () => {
        if (stepSubscription) {
          stepSubscription.remove();
        }
      };
    }, [loadData])
  );

  const latestBmiRecord = records.find((r) => r.type === 'BMI');
  const latestBmrRecord = records.find((r) => r.type === 'BMR');
  const latestBfRecord = records.find((r) => r.type === 'Body Fat');

  const curr = parseFloat(currentWeight);
  const target = parseFloat(targetWeight);
  const deficit = parseFloat(dailyDeficit) || 500;

  let estimatedText = '';
  if (curr && target && deficit > 0) {
    const diff = Math.abs(curr - target);
    const estimatedDays = Math.round((diff * 7700) / deficit);
    const estimatedWeeks = Math.round(estimatedDays / 7);
    estimatedText = `Estimated ${estimatedWeeks} weeks (${estimatedDays} days) to reach ${target} kg`;
  }

  const handleSaveGoal = () => {
    if (curr > 0 && target > 0) {
      storage.setGoal({
        currentWeight: curr,
        targetWeight: target,
        dailyDeficit: deficit,
      });
    }
  };

  const scheduleWaterReminder = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "💦 Time to hydrate!",
        body: 'Drink a glass of water to reach your daily goal.',
      },
      trigger: { seconds: 7200, repeats: true },
    });
    alert('Water reminders enabled every 2 hours!');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Progress & Analytics</Text>

      {/* Weather Smart Suggestion */}
      <WeatherWidget />

      {/* Quick Stats Banner */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Latest BMI</Text>
          <Text style={styles.statVal}>{latestBmiRecord ? latestBmiRecord.result : '--'}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Latest BMR</Text>
          <Text style={styles.statVal}>{latestBmrRecord ? latestBmrRecord.result : '--'}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Body Fat</Text>
          <Text style={styles.statVal}>{latestBfRecord ? latestBfRecord.result : '--'}</Text>
        </View>
      </View>

      {/* Progress Charts Suite */}
      <ProgressCharts records={records} onRefresh={loadData} />

      {/* Today's Nutrition Section */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="restaurant-outline" size={20} color={theme.colors.dark.primary} />
          <Text style={styles.cardTitle}>Today's Nutrition</Text>
          <TouchableOpacity
            style={{ marginLeft: 'auto', backgroundColor: theme.colors.dark.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}
            onPress={() => setMealModalVisible(true)}
          >
            <Text style={{ color: theme.colors.dark.onPrimary, fontSize: 12, fontWeight: '700' }}>+ Log Meal</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.waterRow}>
          <Text style={styles.waterVal}>{nutrition.totalCalories} / {nutrition.targetCalories} kcal</Text>
          <Text style={styles.statLabel}>{nutrition.totalProtein}g P • {nutrition.totalCarbs}g C • {nutrition.totalFats}g F</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(
                  (nutrition.totalCalories / (nutrition.targetCalories || 2000)) * 100,
                  100
                )}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* Weekly AI Summary Report (🔒 Premium) */}
      <WeeklyAISummaryCard />


      {/* Water Tracker Section */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="water-outline" size={20} color={theme.colors.dark.primary} />
          <Text style={styles.cardTitle}>Water Intake Today</Text>
          <TouchableOpacity style={{marginLeft: 'auto'}} onPress={scheduleWaterReminder}>
             <Ionicons name="notifications-outline" size={20} color={theme.colors.dark.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
        <View style={styles.waterRow}>
          <Text style={styles.waterVal}>{waterToday} / {dailyGoal} ml</Text>
          <TouchableOpacity style={styles.waterAddBtn} onPress={() => addWater(todayString, 250)}>
            <Ionicons name="add" size={24} color={theme.colors.dark.background} />
            <Text style={styles.waterBtnText}>250ml</Text>
          </TouchableOpacity>
        </View>
        {/* Simple Progress Bar */}
        <View style={styles.progressBarBg}>
           <View style={[styles.progressBarFill, { width: `${waterProgress * 100}%` }]} />
        </View>
      </View>

      {/* Step Counter Section */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="walk-outline" size={20} color={theme.colors.dark.primary} />
          <Text style={styles.cardTitle}>Daily Steps</Text>
        </View>
        <View style={styles.waterRow}>
          <Text style={styles.waterVal}>
            {isPedometerAvailable === 'true' ? pastStepCount : 'Sensor Unavailable'}
          </Text>
          <Text style={styles.statLabel}>steps today</Text>
        </View>
      </View>

      {/* Goal Tracker Section */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="flag-outline" size={20} color={theme.colors.dark.primary} />
          <Text style={styles.cardTitle}>Weight Goal Tracker</Text>
        </View>

        <InputCard
          label="Current Weight (kg)"
          value={currentWeight}
          onChangeText={(val) => {
            setCurrentWeight(val);
            handleSaveGoal();
          }}
          suffix="kg"
        />
        <InputCard
          label="Target Weight (kg)"
          value={targetWeight}
          onChangeText={(val) => {
            setTargetWeight(val);
            handleSaveGoal();
          }}
          suffix="kg"
        />
        <InputCard
          label="Daily Calorie Deficit/Surplus (kcal)"
          value={dailyDeficit}
          onChangeText={(val) => {
            setDailyDeficit(val);
            handleSaveGoal();
          }}
          suffix="kcal"
        />

        {estimatedText ? (
          <View style={styles.estimateBox}>
            <Ionicons name="time-outline" size={18} color={theme.colors.dark.primary} />
            <Text style={styles.estimateText}>{estimatedText}</Text>
          </View>
        ) : null}
      </View>
      <MealTrackerModal
        visible={mealModalVisible}
        onClose={() => setMealModalVisible(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.hero,
    gap: theme.spacing.lg,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.dark.onSurface,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.dark.surface,
    borderRadius: theme.shapes.large,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  statLabel: {
    color: theme.colors.dark.onSurfaceVariant,
    fontSize: 11,
    marginBottom: 4,
    fontWeight: '600',
  },
  statVal: {
    color: theme.colors.dark.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  card: {
    backgroundColor: theme.colors.dark.surface,
    borderRadius: theme.shapes.large,
    padding: theme.spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.dark.onSurface,
  },
  estimateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.dark.surfaceVariant,
    padding: theme.spacing.md,
    borderRadius: theme.shapes.medium,
    marginTop: theme.spacing.md,
  },
  estimateText: {
    color: theme.colors.dark.primary,
    fontWeight: '700',
    fontSize: 13,
    flex: 1,
  },
  waterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  waterVal: {
    color: theme.colors.dark.onSurface,
    fontSize: 20,
    fontWeight: '800',
  },
  waterAddBtn: {
    backgroundColor: theme.colors.dark.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: theme.shapes.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  waterBtnText: {
    color: theme.colors.dark.background,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: theme.colors.dark.surfaceVariant,
    borderRadius: 4,
    width: '100%',
  },
  progressBarFill: {
    height: 8,
    backgroundColor: '#03A9F4', // Water blue
    borderRadius: 4,
  }
});
