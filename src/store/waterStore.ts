import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DailyWater {
  date: string; // ISO string for the date part only (e.g., '2023-10-27')
  intakeMl: number;
}

export interface WaterStoreState {
  dailyGoal: number; // in ml
  history: DailyWater[];
  
  // Actions
  addWater: (ml: number) => void;
  setDailyGoal: (ml: number) => void;
  getTodayIntake: () => number;
}

const getTodayString = () => new Date().toISOString().split('T')[0];

export const useWaterStore = create<WaterStoreState>()(
  persist(
    (set, get) => ({
      dailyGoal: 2500, // Default 2.5L
      history: [],

      addWater: (ml) => {
        const today = getTodayString();
        set((state) => {
          const todayEntryIndex = state.history.findIndex(entry => entry.date === today);
          
          if (todayEntryIndex >= 0) {
            // Update today's entry — create a new object to avoid in-place mutation
            const updatedHistory = [...state.history];
            updatedHistory[todayEntryIndex] = {
              ...updatedHistory[todayEntryIndex],
              intakeMl: updatedHistory[todayEntryIndex].intakeMl + ml,
            };
            return { history: updatedHistory };
          } else {
            // Create new entry for today
            return { history: [...state.history, { date: today, intakeMl: ml }] };
          }
        });
      },

      setDailyGoal: (ml) => set({ dailyGoal: ml }),

      getTodayIntake: () => {
        const today = getTodayString();
        const entry = get().history.find(e => e.date === today);
        return entry ? entry.intakeMl : 0;
      },
    }),
    {
      name: 'fitmetrics-water-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
