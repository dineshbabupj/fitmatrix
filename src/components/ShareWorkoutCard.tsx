import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

interface ShareWorkoutCardProps {
  title: string;
  durationMins: number;
  totalSets: number;
  totalVolumeKg: number;
}

export const ShareWorkoutCard: React.FC<ShareWorkoutCardProps> = ({
  title,
  durationMins,
  totalSets,
  totalVolumeKg,
}) => {
  const handleShare = async () => {
    try {
      const message = `🔥 I just crushed "${title}" on FitMetrics Pro!\n⏱️ Duration: ${durationMins} mins\n💪 Sets: ${totalSets} | Volume: ${totalVolumeKg}kg\n\nTrack your health & workouts with FitMetrics!`;
      await Share.share({ message });
    } catch (e) {
      console.warn('[ShareWorkoutCard] Error sharing:', e);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.badgeRow}>
        <Ionicons name="flame" size={24} color="#FF9800" />
        <Text style={styles.appName}>FitMetrics Pro Workout</Text>
      </View>

      <Text style={styles.title}>{title}</Text>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{durationMins} min</Text>
          <Text style={styles.statLbl}>Duration</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{totalSets}</Text>
          <Text style={styles.statLbl}>Total Sets</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{totalVolumeKg} kg</Text>
          <Text style={styles.statLbl}>Volume</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
        <Ionicons name="share-social-outline" size={18} color={theme.colors.dark.onPrimary} />
        <Text style={styles.shareBtnText}>Share to Socials</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: theme.shapes.large,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.dark.primary,
    marginVertical: theme.spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: theme.spacing.xs,
  },
  appName: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.dark.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.dark.onSurface,
    marginBottom: theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.dark.background,
    padding: theme.spacing.md,
    borderRadius: theme.shapes.medium,
    marginBottom: theme.spacing.md,
  },
  statBox: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.dark.onSurface,
  },
  statLbl: {
    fontSize: 11,
    color: theme.colors.dark.onSurfaceVariant,
    marginTop: 2,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.dark.primary,
    paddingVertical: 12,
    borderRadius: theme.shapes.medium,
  },
  shareBtnText: {
    color: theme.colors.dark.onPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
});
