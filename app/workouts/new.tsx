import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/theme/theme';
import { useWorkoutStore, Workout, Exercise, WorkoutSet } from '../../src/store/workoutStore';
import { RestTimer } from '../../src/components/RestTimer';

const DEFAULT_SUGGESTIONS = ['Push-ups', 'Squats', 'Bench Press', 'Deadlift', 'Pull-ups', 'Overhead Press'];

export default function NewWorkoutScreen() {
  const { addWorkout, getExerciseHistory } = useWorkoutStore();
  const [workoutName, setWorkoutName] = useState('New Workout');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);

  const REST_TIME_OPTIONS = [30, 60, 90, 120, 180];

  const handleCycleRestTime = (exerciseId: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        const currentRest = ex.restTime || 60;
        const currentIndex = REST_TIME_OPTIONS.indexOf(currentRest);
        const nextIndex = (currentIndex + 1) % REST_TIME_OPTIONS.length;
        return { ...ex, restTime: REST_TIME_OPTIONS[nextIndex] };
      }
      return ex;
    }));
  };

  const handleAddExercise = (name: string) => {
    if (!name.trim()) return;
    
    const cleanName = name.trim();
    const history = getExerciseHistory(cleanName);
    
    // Auto-fill logic
    const initialSets = history && history.sets.length > 0 
      ? history.sets.map(s => ({ ...s, id: Date.now().toString() + Math.random().toString(), isCompleted: false })) 
      : [createEmptySet()];

    const newExercise: Exercise = {
      id: Date.now().toString() + Math.random().toString(),
      name: cleanName,
      sets: initialSets,
      restTime: history?.restTime || 60,
    };
    
    setExercises([...exercises, newExercise]);
    setNewExerciseName('');
  };

  const createEmptySet = (): WorkoutSet => ({
    id: Date.now().toString() + Math.random().toString(),
    weight: 0,
    reps: 0,
    isCompleted: false,
  });

  const handleAddSet = (exerciseId: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        // Copy last set's weight/reps if available
        const lastSet = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [...ex.sets, {
            ...createEmptySet(),
            weight: lastSet ? lastSet.weight : 0,
            reps: lastSet ? lastSet.reps : 0,
          }],
        };
      }
      return ex;
    }));
  };

  const handleRemoveSet = (exerciseId: string, setId: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        return { ...ex, sets: ex.sets.filter(s => s.id !== setId) };
      }
      return ex;
    }).filter(ex => ex.sets.length > 0)); // Remove exercise if no sets left
  };

  const handleUpdateSet = (exerciseId: string, setId: string, field: 'weight' | 'reps', value: string) => {
    const numValue = parseFloat(value) || 0;
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: numValue } : s)
        };
      }
      return ex;
    }));
  };

  const handleToggleComplete = (exerciseId: string, setId: string, currentState: boolean) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(s => s.id === setId ? { ...s, isCompleted: !currentState } : s)
        };
      }
      return ex;
    }));
    
    // Show timer if we just completed a set
    if (!currentState) {
      const exercise = exercises.find(e => e.id === exerciseId);
      setTimerSeconds(exercise?.restTime || 60);
    }
  };

  const handleFinishWorkout = () => {
    if (exercises.length === 0) {
      Alert.alert('Empty Workout', 'Please add at least one exercise.');
      return;
    }

    const newWorkout: Workout = {
      id: Date.now().toString(),
      name: workoutName,
      date: new Date().toISOString(),
      exercises,
      durationMinutes: 45, // Hardcoded for now
    };

    addWorkout(newWorkout);
    router.back();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TextInput
            style={styles.workoutNameInput}
            value={workoutName}
            onChangeText={setWorkoutName}
            placeholder="Workout Name"
            placeholderTextColor={theme.colors.dark.outline}
          />
        </View>

        {exercises.map((exercise, index) => {
          const history = getExerciseHistory(exercise.name);
          const historyText = history && history.sets.length > 0 
            ? `Last time: ${history.sets.length} sets, max ${Math.max(...history.sets.map(s => s.weight))}kg` 
            : null;

          return (
          <View key={exercise.id} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.exerciseName}>{index + 1}. {exercise.name}</Text>
                {historyText && <Text style={styles.historyText}>{historyText}</Text>}
              </View>
              <TouchableOpacity 
                style={styles.restTimeChip} 
                onPress={() => handleCycleRestTime(exercise.id)}
              >
                <Ionicons name="timer-outline" size={14} color={theme.colors.dark.primary} />
                <Text style={styles.restTimeText}>{exercise.restTime || 60}s</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.setHeaderRow}>
              <Text style={styles.setHeaderText}>Set</Text>
              <Text style={[styles.setHeaderText, { flex: 1, textAlign: 'center' }]}>kg</Text>
              <Text style={[styles.setHeaderText, { flex: 1, textAlign: 'center' }]}>Reps</Text>
              <View style={{ width: 40 }} />
            </View>

            {exercise.sets.map((set, setIndex) => (
              <View key={set.id} style={[styles.setRow, set.isCompleted && styles.setRowCompleted]}>
                <View style={styles.setNumberBox}>
                  <Text style={styles.setNumberText}>{setIndex + 1}</Text>
                </View>
                
                <TextInput
                  style={[styles.setInput, set.isCompleted && styles.setInputCompleted]}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={theme.colors.dark.outline}
                  value={set.weight ? set.weight.toString() : ''}
                  onChangeText={(val) => handleUpdateSet(exercise.id, set.id, 'weight', val)}
                  editable={!set.isCompleted}
                />
                
                <TextInput
                  style={[styles.setInput, set.isCompleted && styles.setInputCompleted]}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={theme.colors.dark.outline}
                  value={set.reps ? set.reps.toString() : ''}
                  onChangeText={(val) => handleUpdateSet(exercise.id, set.id, 'reps', val)}
                  editable={!set.isCompleted}
                />
                
                <TouchableOpacity 
                  style={[styles.checkButton, set.isCompleted && styles.checkButtonCompleted]}
                  onPress={() => handleToggleComplete(exercise.id, set.id, set.isCompleted)}
                >
                  <Ionicons name="checkmark" size={20} color={set.isCompleted ? theme.colors.dark.onPrimary : theme.colors.dark.outline} />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.removeSetButton}
                  onPress={() => handleRemoveSet(exercise.id, set.id)}
                >
                  <Ionicons name="close" size={20} color={theme.colors.dark.error} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity 
              style={styles.addSetButton}
              onPress={() => handleAddSet(exercise.id)}
            >
              <Ionicons name="add" size={16} color={theme.colors.dark.primary} />
              <Text style={styles.addSetText}>Add Set</Text>
            </TouchableOpacity>
          </View>
        )})}

        <View style={styles.addExerciseSection}>
          <Text style={styles.sectionTitle}>Add Exercise</Text>
          <View style={styles.addExerciseInputRow}>
            <TextInput
              style={styles.exerciseInput}
              value={newExerciseName}
              onChangeText={setNewExerciseName}
              placeholder="e.g. Incline Dumbbell Press"
              placeholderTextColor={theme.colors.dark.outline}
              onSubmitEditing={() => handleAddExercise(newExerciseName)}
            />
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => handleAddExercise(newExerciseName)}
            >
              <Ionicons name="add" size={24} color={theme.colors.dark.onPrimary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.suggestionsTitle}>Suggestions:</Text>
          <View style={styles.suggestionsContainer}>
            {DEFAULT_SUGGESTIONS.map(sug => (
              <TouchableOpacity 
                key={sug} 
                style={styles.suggestionBadge}
                onPress={() => handleAddExercise(sug)}
              >
                <Text style={styles.suggestionText}>{sug}</Text>
                <Ionicons name="add" size={14} color={theme.colors.dark.primary} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.finishButton} onPress={handleFinishWorkout}>
          <Text style={styles.finishButtonText}>Finish Workout</Text>
        </TouchableOpacity>
      </View>

      {timerSeconds !== null && (
        <RestTimer initialSeconds={timerSeconds} onClose={() => setTimerSeconds(null)} />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  workoutNameInput: {
    ...theme.typography.headline,
    color: theme.colors.dark.onSurface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.dark.surfaceVariant,
    paddingVertical: theme.spacing.sm,
  },
  exerciseCard: {
    backgroundColor: theme.colors.dark.surface,
    borderRadius: theme.shapes.large,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  restTimeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.dark.surfaceVariant,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.shapes.small,
    gap: 4,
  },
  restTimeText: {
    ...theme.typography.caption,
    color: theme.colors.dark.primary,
    fontWeight: 'bold',
  },
  exerciseName: {
    ...theme.typography.title,
    color: theme.colors.dark.primary,
  },
  historyText: {
    ...theme.typography.caption,
    color: theme.colors.dark.outline,
    marginTop: 2,
  },
  setHeaderRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  setHeaderText: {
    ...theme.typography.caption,
    color: theme.colors.dark.outline,
    width: 30, // For 'Set' column
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  setNumberBox: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumberText: {
    ...theme.typography.body,
    color: theme.colors.dark.onSurfaceVariant,
    fontWeight: 'bold',
  },
  setInput: {
    flex: 1,
    backgroundColor: theme.colors.dark.background,
    borderRadius: theme.shapes.medium,
    color: theme.colors.dark.onSurface,
    padding: theme.spacing.sm,
    marginHorizontal: theme.spacing.xs,
    textAlign: 'center',
    fontSize: 16,
  },
  setInputCompleted: {
    backgroundColor: theme.colors.dark.background,
    color: theme.colors.dark.outline,
    opacity: 0.6,
  },
  setRowCompleted: {
    opacity: 0.8,
  },
  checkButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.dark.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  checkButtonCompleted: {
    backgroundColor: theme.colors.dark.primary,
  },
  removeSetButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.dark.surfaceVariant,
    borderRadius: theme.shapes.medium,
  },
  addSetText: {
    ...theme.typography.button,
    fontSize: 14,
    color: theme.colors.dark.primary,
    marginLeft: 4,
  },
  addExerciseSection: {
    marginTop: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.title,
    color: theme.colors.dark.onSurface,
    marginBottom: theme.spacing.md,
  },
  addExerciseInputRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  exerciseInput: {
    flex: 1,
    backgroundColor: theme.colors.dark.surface,
    borderRadius: theme.shapes.large,
    padding: theme.spacing.md,
    color: theme.colors.dark.onSurface,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: theme.colors.dark.primary,
    width: 56,
    borderRadius: theme.shapes.large,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionsTitle: {
    ...theme.typography.caption,
    color: theme.colors.dark.outline,
    marginBottom: theme.spacing.sm,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  suggestionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.dark.surfaceVariant,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.shapes.full,
    borderWidth: 1,
    borderColor: theme.colors.dark.outline,
  },
  suggestionText: {
    ...theme.typography.body,
    fontSize: 14,
    color: theme.colors.dark.onSurface,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.dark.surface,
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.dark.surfaceVariant,
  },
  finishButton: {
    backgroundColor: theme.colors.dark.primary,
    padding: theme.spacing.md,
    borderRadius: theme.shapes.full,
    alignItems: 'center',
  },
  finishButtonText: {
    ...theme.typography.button,
    color: theme.colors.dark.onPrimary,
  },
});
