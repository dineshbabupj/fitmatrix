import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { workoutDb } from '../data/db';
import { revenueCatService } from '../services/iap/revenueCatService';
import { PaywallModal } from './PaywallModal';

export interface MuscleStatus {
  name: string;
  category: string;
  hoursAgo: number | null;
  status: 'fatigued' | 'recovering' | 'ready';
}

export const MuscleHeatmap: React.FC = () => {
  const [muscles, setMuscles] = useState<MuscleStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPro, setIsPro] = useState<boolean>(false);
  const [paywallVisible, setPaywallVisible] = useState<boolean>(false);

  useEffect(() => {
    loadHeatmapData();
  }, []);

  const loadHeatmapData = async () => {
    setLoading(true);
    try {
      const hasPro = await revenueCatService.hasProAccess();
      setIsPro(hasPro);

      const now = Date.now();
      const recentWorkouts = await workoutDb.getAllWorkouts(20);
      
      const muscleLastTrained: Record<string, number> = {};

      for (const w of recentWorkouts) {
        const sets = await workoutDb.getWorkoutSets(w.id);
        sets.forEach((s) => {
          const cat = s.exercise_name.toLowerCase();
          let group = 'General';
          if (cat.includes('bench') || cat.includes('chest') || cat.includes('push-up')) group = 'Chest';
          else if (cat.includes('squat') || cat.includes('leg') || cat.includes('lunge')) group = 'Legs';
          else if (cat.includes('deadlift') || cat.includes('pull-up') || cat.includes('row')) group = 'Back';
          else if (cat.includes('press') || cat.includes('deltoid') || cat.includes('shoulder')) group = 'Shoulders';
          else if (cat.includes('curl') || cat.includes('tricep') || cat.includes('bicep')) group = 'Arms';
          else if (cat.includes('crunch') || cat.includes('plank') || cat.includes('ab')) group = 'Core';

          if (!muscleLastTrained[group] || w.date > muscleLastTrained[group]) {
            muscleLastTrained[group] = w.date;
          }
        });
      }

      const groups = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];
      const statusList: MuscleStatus[] = groups.map((grp) => {
        const lastTime = muscleLastTrained[grp];
        if (!lastTime) {
          return { name: grp, category: grp, hoursAgo: null, status: 'ready' };
        }
        const diffHours = (now - lastTime) / (1000 * 60 * 60);
        if (diffHours < 24) return { name: grp, category: grp, hoursAgo: Math.round(diffHours), status: 'fatigued' };
        if (diffHours < 48) return { name: grp, category: grp, hoursAgo: Math.round(diffHours), status: 'recovering' };
        return { name: grp, category: grp, hoursAgo: Math.round(diffHours), status: 'ready' };
      });

      setMuscles(statusList);
    } catch (e) {
      console.warn('[MuscleHeatmap] Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: MuscleStatus['status']) => {
    switch (status) {
      case 'fatigued': return '#F44336'; // Red
      case 'recovering': return '#FF9800'; // Orange
      case 'ready': return '#4CAF50'; // Green
    }
  };

  const getStatusText = (status: MuscleStatus['status']) => {
    switch (status) {
      case 'fatigued': return 'Fatigued (<24h)';
      case 'recovering': return 'Recovering (24-48h)';
      case 'ready': return 'Ready to Train';
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Ionicons name="body-outline" size={20} color={theme.colors.dark.primary} />
        <Text style={styles.title}>Muscle Recovery Heatmap</Text>
        {!isPro && (
          <TouchableOpacity style={styles.proBadge} onPress={() => setPaywallVisible(true)}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.proBadgeText}>PRO</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="small" color={theme.colors.dark.primary} style={{ marginVertical: 20 }} />
      ) : (
        <View style={styles.gridContainer}>
          {muscles.map((m) => {
            const color = getStatusColor(m.status);
            return (
              <TouchableOpacity
                key={m.name}
                style={[styles.muscleBox, { borderColor: color }]}
                onPress={() => {
                  if (!isPro) setPaywallVisible(true);
                }}
              >
                <View style={[styles.indicatorDot, { backgroundColor: color }]} />
                <Text style={styles.muscleName}>{m.name}</Text>
                <Text style={[styles.statusLabel, { color }]}>{getStatusText(m.status)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.dark.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.shapes.large,
    marginVertical: theme.spacing.sm,
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
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  proBadgeText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '800',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  muscleBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.dark.background,
    borderRadius: theme.shapes.medium,
    padding: theme.spacing.md,
    borderWidth: 1.5,
    position: 'relative',
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 10,
    right: 10,
  },
  muscleName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.dark.onSurface,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
});
