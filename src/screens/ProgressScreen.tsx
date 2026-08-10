import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { InputCard } from '../components/InputCard';
import { ProgressCharts } from '../components/ProgressCharts';
import { storage } from '../data/storage';
import { calculationsDb, CalculationRecord } from '../data/db';
import { theme } from '../theme/theme';

export const ProgressScreen = () => {
  const goal = storage.getGoal();

  const [records, setRecords] = useState<CalculationRecord[]>([]);
  const [currentWeight, setCurrentWeight] = useState(goal.currentWeight.toString());
  const [targetWeight, setTargetWeight] = useState(goal.targetWeight.toString());
  const [dailyDeficit, setDailyDeficit] = useState(goal.dailyDeficit.toString());

  // Load calculations from SQLite whenever screen gains focus
  const loadData = useCallback(async () => {
    try {
      const dbRecords = await calculationsDb.getAll();
      setRecords(dbRecords);
    } catch (e) {
      console.warn('Failed to load calculations from SQLite for ProgressScreen:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Progress & Analytics</Text>

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
});
