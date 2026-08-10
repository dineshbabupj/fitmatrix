import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { Workout } from '../store/workoutStore';

interface WorkoutCardProps {
  workout: Workout;
  onPress?: () => void;
  onDelete?: () => void;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({ workout, onPress, onDelete }) => {
  const date = new Date(workout.date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const totalSets = workout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const totalVolume = workout.exercises.reduce(
    (acc, ex) => acc + ex.sets.reduce((setAcc, set) => setAcc + (set.weight * set.reps), 0),
    0
  );

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} disabled={!onPress}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{workout.name}</Text>
          <Text style={styles.date}>{date}</Text>
        </View>
        {onDelete && (
          <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={20} color={theme.colors.dark.error} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Ionicons name="barbell-outline" size={16} color={theme.colors.dark.primary} />
          <Text style={styles.statText}>{workout.exercises.length} Exercises</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="repeat-outline" size={16} color={theme.colors.dark.primary} />
          <Text style={styles.statText}>{totalSets} Sets</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="analytics-outline" size={16} color={theme.colors.dark.primary} />
          <Text style={styles.statText}>{totalVolume} kg</Text>
        </View>
      </View>

      <View style={styles.exercisesList}>
        {workout.exercises.slice(0, 3).map((ex) => (
          <Text key={ex.id} style={styles.exerciseText} numberOfLines={1}>
            {ex.sets.length}x {ex.name}
          </Text>
        ))}
        {workout.exercises.length > 3 && (
          <Text style={styles.moreText}>+ {workout.exercises.length - 3} more</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.dark.surface,
    borderRadius: theme.shapes.large,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.dark.onSurface,
    marginBottom: 4,
  },
  date: {
    ...theme.typography.caption,
    color: theme.colors.dark.outline,
  },
  deleteButton: {
    padding: theme.spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.dark.surfaceVariant,
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    ...theme.typography.caption,
    color: theme.colors.dark.onSurfaceVariant,
    fontWeight: '500',
  },
  exercisesList: {
    gap: 4,
  },
  exerciseText: {
    ...theme.typography.body,
    fontSize: 14,
    color: theme.colors.dark.onSurface,
  },
  moreText: {
    ...theme.typography.caption,
    color: theme.colors.dark.primary,
    marginTop: 4,
  },
});
