import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/theme/theme';
import { storage } from '../../src/data/storage';

export default function HomeScreen() {
  const history = storage.getHistory();
  const goal = storage.getGoal();

  const calculatorLinks = [
    {
      title: 'BMI Calculator',
      subtitle: 'Body Mass Index',
      icon: 'body-outline' as const,
      route: '/calculators/bmi' as const,
      color: '#4CAF50',
    },
    {
      title: 'BMR Calculator',
      subtitle: 'Basal Metabolic Rate',
      icon: 'flame-outline' as const,
      route: '/calculators/bmr' as const,
      color: '#FF9800',
    },
    {
      title: 'Body Fat',
      subtitle: 'Fat Percentage',
      icon: 'fitness-outline' as const,
      route: '/calculators/body-fat' as const,
      color: '#00BCD4',
    },
    {
      title: 'Ideal Weight',
      subtitle: 'Target Weight Range',
      icon: 'ribbon-outline' as const,
      route: '/calculators/ideal-weight' as const,
      color: '#9C27B0',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Welcome Banner */}
        <View style={styles.heroCard}>
          <View>
            <Text style={styles.heroTitle}>FitMetrics Dashboard</Text>
            <Text style={styles.heroSubtitle}>Track your vital metrics & body composition</Text>
          </View>
          <TouchableOpacity
            style={styles.historyBtn}
            onPress={() => router.push('/history-modal')}
          >
            <Ionicons name="time-outline" size={20} color={theme.colors.dark.primary} />
            <Text style={styles.historyBtnText}>History</Text>
          </TouchableOpacity>
        </View>

        {/* Goal Summary */}
        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Ionicons name="trophy-outline" size={22} color={theme.colors.dark.primary} />
            <Text style={styles.goalTitle}>Weight Goal Tracker</Text>
          </View>
          <View style={styles.goalStats}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Current</Text>
              <Text style={styles.statValue}>{goal.currentWeight} kg</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Target</Text>
              <Text style={styles.statValue}>{goal.targetWeight} kg</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Deficit</Text>
              <Text style={styles.statValue}>{goal.dailyDeficit} kcal/d</Text>
            </View>
          </View>
        </View>

        {/* Section Title */}
        <Text style={styles.sectionTitle}>Health Calculators</Text>

        {/* Calculator Grid */}
        <View style={styles.grid}>
          {calculatorLinks.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.calcCard}
              onPress={() => router.push(item.route)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconContainer, { backgroundColor: item.color + '22' }]}>
                <Ionicons name={item.icon} size={28} color={item.color} />
              </View>
              <Text style={styles.calcTitle}>{item.title}</Text>
              <Text style={styles.calcSubtitle}>{item.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activity */}
        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>Recent Logs</Text>
          <TouchableOpacity onPress={() => router.push('/history-modal')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {history.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={32} color={theme.colors.dark.outline} />
            <Text style={styles.emptyText}>No calculation logs yet. Try a calculator above!</Text>
          </View>
        ) : (
          history.slice(0, 3).map((item) => (
            <View key={item.id} style={styles.logCard}>
              <View style={styles.logLeft}>
                <Text style={styles.logType}>{item.type}</Text>
                <Text style={styles.logResult}>{item.result}</Text>
              </View>
              <Text style={styles.logDate}>{new Date(item.date).toLocaleDateString()}</Text>
            </View>
          ))
        )}
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
  heroCard: {
    backgroundColor: theme.colors.dark.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.shapes.large,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.dark.onSurface,
  },
  heroSubtitle: {
    fontSize: 13,
    color: theme.colors.dark.onSurfaceVariant,
    marginTop: 2,
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.dark.surfaceVariant,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  historyBtnText: {
    color: theme.colors.dark.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  goalCard: {
    backgroundColor: theme.colors.dark.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.shapes.large,
    marginBottom: theme.spacing.xl,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.dark.onSurface,
  },
  goalStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.dark.surfaceVariant,
    padding: theme.spacing.md,
    borderRadius: theme.shapes.medium,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.dark.onSurfaceVariant,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.dark.primary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: theme.colors.dark.outline + '44',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.dark.onSurface,
    marginBottom: theme.spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  calcCard: {
    width: '47.5%',
    backgroundColor: theme.colors.dark.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.shapes.large,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  calcTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.dark.onSurface,
  },
  calcSubtitle: {
    fontSize: 12,
    color: theme.colors.dark.onSurfaceVariant,
    marginTop: 2,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  seeAllText: {
    color: theme.colors.dark.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: theme.colors.dark.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.shapes.large,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    color: theme.colors.dark.onSurfaceVariant,
    fontSize: 13,
    textAlign: 'center',
  },
  logCard: {
    backgroundColor: theme.colors.dark.surface,
    padding: theme.spacing.md,
    borderRadius: theme.shapes.medium,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  logLeft: {
    gap: 2,
  },
  logType: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.dark.onSurface,
  },
  logResult: {
    fontSize: 12,
    color: theme.colors.dark.primary,
  },
  logDate: {
    fontSize: 12,
    color: theme.colors.dark.onSurfaceVariant,
  },
});
