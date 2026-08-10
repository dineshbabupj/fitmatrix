import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
}

export const useWorkoutStore = create<WorkoutStoreState>()(
  persist(
    (set, get) => ({
      workouts: [],
      
      addWorkout: (workout) =>
        set((state) => ({
          workouts: [workout, ...state.workouts], // Prepend new workout
        })),

      deleteWorkout: (id) =>
        set((state) => ({
          workouts: state.workouts.filter((w) => w.id !== id),
        })),

      clearAll: () => set({ workouts: [] }),

      getExerciseHistory: (exerciseName: string) => {
        const { workouts } = get();
        // Workouts are assumed to be sorted by date descending (newest first)
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
    }),
    {
      name: 'fitmetrics-workout-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
