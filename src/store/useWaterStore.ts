import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WaterStoreState {
  logs: { [dateString: string]: number }; // e.g., '2026-08-13': 1250 (ml)
  dailyGoal: number; // default 2500 ml
  remindersEnabled: boolean;
  
  // Actions
  addWater: (dateString: string, amountMl: number) => void;
  setDailyGoal: (goal: number) => void;
  toggleReminders: (enabled: boolean) => void;
}

export const useWaterStore = create<WaterStoreState>()(
  persist(
    (set) => ({
      logs: {},
      dailyGoal: 2500,
      remindersEnabled: false,

      addWater: (dateString, amountMl) =>
        set((state) => {
          const currentAmount = state.logs[dateString] || 0;
          return {
            logs: {
              ...state.logs,
              [dateString]: currentAmount + amountMl,
            },
          };
        }),

      setDailyGoal: (goal) => set({ dailyGoal: goal }),

      toggleReminders: (enabled) => set({ remindersEnabled: enabled }),
    }),
    {
      name: 'fitmetrics-water-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
