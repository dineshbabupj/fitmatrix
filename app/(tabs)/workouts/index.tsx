import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../src/theme/theme';
import { useWorkoutStore } from '../../../src/store/workoutStore';
import { WorkoutCard } from '../../../src/components/WorkoutCard';

export default function WorkoutsScreen() {
  const { workouts, deleteWorkout } = useWorkoutStore();

  return (
    <View style={styles.container}>
      {workouts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="barbell-outline" size={64} color={theme.colors.dark.outline} />
          <Text style={styles.emptyTitle}>No Workouts Yet</Text>
          <Text style={styles.emptySubtitle}>
            Log your first workout to start tracking your progress.
          </Text>
        </View>
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <WorkoutCard
              workout={item}
              onDelete={() => deleteWorkout(item.id)}
            />
          )}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/workouts/new')}
      >
        <Ionicons name="add" size={32} color={theme.colors.dark.onPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark.background,
  },
  listContainer: {
    padding: theme.spacing.lg,
    paddingBottom: 100, // Space for FAB
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    ...theme.typography.title,
    color: theme.colors.dark.onSurface,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    ...theme.typography.body,
    color: theme.colors.dark.outline,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    right: theme.spacing.xl,
    backgroundColor: theme.colors.dark.primary,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
