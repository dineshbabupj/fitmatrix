import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { aiCoachService, WeeklyAISummary } from '../services/ai/aiCoachService';
import { useUserStore } from '../store/userStore';
import { revenueCatService } from '../services/iap/revenueCatService';
import { PaywallModal } from './PaywallModal';

export const WeeklyAISummaryCard: React.FC = () => {
  const [summary, setSummary] = useState<WeeklyAISummary | null>(null);
  const [loading, setLoading] = useState(true);
  const isPremium = useUserStore((state) => state.isPremium);
  const [paywallVisible, setPaywallVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, [isPremium]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await aiCoachService.getWeeklySummary();
      setSummary(res);
    } catch (e) {
      console.warn('[WeeklyAISummaryCard] Error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Ionicons name="sparkles" size={20} color={theme.colors.dark.primary} />
        <Text style={styles.title}>Weekly AI Coach Insights</Text>
        {!isPremium ? (
          <TouchableOpacity style={styles.proBadge} onPress={() => setPaywallVisible(true)} activeOpacity={0.8}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.proBadgeText}>PRO</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.proActiveBadge}>
            <Text style={styles.proActiveBadgeText}>PRO ACTIVE</Text>
          </View>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="small" color={theme.colors.dark.primary} style={{ marginVertical: 20 }} />
      ) : summary ? (
        <View style={styles.body}>
          {summary.keyHighlight ? (
            <View style={styles.highlightPill}>
              <Text style={styles.highlightText}>{summary.keyHighlight}</Text>
            </View>
          ) : null}

          <Text style={styles.adviceText}>"{summary.coachingAdvice}"</Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{summary.totalWorkouts}</Text>
              <Text style={styles.statLbl}>Workouts</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{summary.totalCaloriesBurned}</Text>
              <Text style={styles.statLbl}>kcal Burned</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{summary.proteinGoalHitCount}/7</Text>
              <Text style={styles.statLbl}>Protein Days</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{summary.waterAdherencePercent}%</Text>
              <Text style={styles.statLbl}>Hydration</Text>
            </View>
          </View>

          {summary.topExercise && (
            <View style={styles.topExRow}>
              <Ionicons name="barbell-outline" size={14} color={theme.colors.dark.primary} />
              <Text style={styles.topExText}>Top Movement: <Text style={{ fontWeight: '700', color: theme.colors.dark.onSurface }}>{summary.topExercise}</Text></Text>
            </View>
          )}
        </View>
      ) : null}

      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        onSuccess={() => {
          revenueCatService.hasProAccess().then((pro) => {
            useUserStore.getState().setPremiumStatus(pro);
          });
          setPaywallVisible(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.dark.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.shapes.large,
    marginVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.dark.surfaceVariant,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.dark.onSurface,
    flex: 1,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#382E12',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  proBadgeText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '800',
  },
  proActiveBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderWidth: 1,
    borderColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  proActiveBadgeText: {
    color: '#4CAF50',
    fontSize: 9,
    fontWeight: '800',
  },
  body: {
    gap: 12,
  },
  highlightPill: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.dark.primaryContainer + '40',
    borderWidth: 1,
    borderColor: theme.colors.dark.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  highlightText: {
    color: theme.colors.dark.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  adviceText: {
    fontSize: 13,
    color: theme.colors.dark.onSurfaceVariant,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.dark.background,
    padding: theme.spacing.md,
    borderRadius: theme.shapes.medium,
  },
  statBox: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.dark.primary,
  },
  statLbl: {
    fontSize: 10,
    color: theme.colors.dark.onSurfaceVariant,
    marginTop: 2,
  },
  topExRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  topExText: {
    fontSize: 12,
    color: theme.colors.dark.onSurfaceVariant,
  },
});
