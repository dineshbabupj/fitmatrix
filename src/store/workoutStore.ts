import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { workoutDb } from '../data/db';

export interface WorkoutSet {
  id: string;
  weight: number;
  reps: number;
  isCompleted: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  sets: WorkoutSet[];
  restTime?: number; // In seconds
}

export interface Workout {
  id: string;
  sqliteId?: string; // SQLite record ID for sync
  name: string;
  date: string; // ISO string
  exercises: Exercise[];
  durationMinutes: number;
}

export interface WorkoutStoreState {
  workouts: Workout[];
  
  // Actions
  addWorkout: (workout: Workout) => void;
  deleteWorkout: (id: string) => void;
  clearAll: () => void;
  getExerciseHistory: (exerciseName: string) => Exercise | null;
  getProgressiveOverloadTarget: (exerciseName: string) => { targetWeight: number; targetReps: number } | null;
}

export const useWorkoutStore = create<WorkoutStoreState>()(
  persist(
    (set, get) => ({
      workouts: [],
      
      addWorkout: (workout) => {
        set((state) => ({
          workouts: [workout, ...state.workouts], // Prepend new workout
        }));

        // Ecosystem link: If workout > 45 min, increase water goal by +500ml
        if (workout.durationMinutes >= 45) {
          try {
            const { useWaterStore } = require('./useWaterStore');
            const waterStore = useWaterStore.getState();
            waterStore.setDailyGoal(waterStore.dailyGoal + 500);
          } catch {}
        }

        // Async sync to SQLite for offline relational queries
        try {
          const setsList: { exercise_id: string; exercise_name: string; set_order: number; weight_kg: number; reps: number; is_completed: number }[] = [];
          workout.exercises.forEach((ex) => {
            ex.sets.forEach((s, idx) => {
              setsList.push({
                exercise_id: ex.id,
                exercise_name: ex.name,
                set_order: idx + 1,
                weight_kg: s.weight,
                reps: s.reps,
                is_completed: s.isCompleted ? 1 : 0,
              });
            });
          });

          workoutDb.createWorkout(
            {
              title: workout.name,
              date: new Date(workout.date).getTime(),
              duration_seconds: workout.durationMinutes * 60,
            },
            setsList
          ).then((result) => {
            // Store the SQLite-generated ID back on the zustand workout
            // so deleteWorkout can target the correct SQLite record
            set((state) => ({
              workouts: state.workouts.map((w) =>
                w.id === workout.id ? { ...w, sqliteId: result.workout.id } : w
              ),
            }));
          }).catch((e) => console.warn('[workoutStore] SQLite save warning:', e));
        } catch (err) {
          console.warn('[workoutStore] SQLite error:', err);
        }
      },

      deleteWorkout: (id) => {
        const workout = get().workouts.find((w) => w.id === id);
        set((state) => ({
          workouts: state.workouts.filter((w) => w.id !== id),
        }));
        // Use the SQLite-generated ID if available, otherwise fall back to zustand ID
        const sqliteId = workout?.sqliteId || id;
        workoutDb.deleteWorkout(sqliteId).catch((e) => console.warn('[workoutStore] Delete SQLite warning:', e));
      },

      clearAll: () => set({ workouts: [] }),

      getExerciseHistory: (exerciseName: string) => {
        const { workouts } = get();
        for (const workout of workouts) {
          const found = workout.exercises.find(
            (ex) => ex.name.toLowerCase() === exerciseName.toLowerCase()
          );
          if (found) {
            return found;
          }
        }
        return null;
      },

      getProgressiveOverloadTarget: (exerciseName: string) => {
        const history = get().getExerciseHistory(exerciseName);
        if (!history || history.sets.length === 0) return null;
        
        // Find max weight lifted last time
        let maxWeight = 0;
        let repsAtMaxWeight = 0;
        
        history.sets.forEach(set => {
          if (set.weight > maxWeight) {
            maxWeight = set.weight;
            repsAtMaxWeight = set.reps;
          } else if (set.weight === maxWeight && set.reps > repsAtMaxWeight) {
            repsAtMaxWeight = set.reps;
          }
        });

        if (maxWeight === 0) return null;

        // Progressive Overload Logic: Try to add 1 rep or 1.25kg
        // If they did > 10 reps, suggest increasing weight. Otherwise suggest +1 rep.
        if (repsAtMaxWeight >= 10) {
          return { targetWeight: maxWeight + 1.25, targetReps: 8 };
        } else {
          return { targetWeight: maxWeight, targetReps: repsAtMaxWeight + 1 };
        }
      },
    }),
    {
      name: 'fitmetrics-workout-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
