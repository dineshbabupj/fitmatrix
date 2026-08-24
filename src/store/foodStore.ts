import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FoodProduct } from '../services/openFoodFacts';

export interface FoodLogEntry {
  id: string;
  date: string; // ISO string
  product: FoodProduct;
  timestamp: number;
}

export interface FoodStoreState {
  logs: FoodLogEntry[];
  
  // Actions
  logFood: (product: FoodProduct) => void;
  getTodayTotals: () => { calories: number; protein: number; carbs: number; fat: number };
}

const getTodayString = () => new Date().toISOString().split('T')[0];

export const useFoodStore = create<FoodStoreState>()(
  persist(
    (set, get) => ({
      logs: [],

      logFood: (product) => {
        const today = getTodayString();
        const newLog: FoodLogEntry = {
          id: Date.now().toString(),
          date: today,
          product,
          timestamp: Date.now(),
        };
        
        set((state) => ({
          logs: [...state.logs, newLog],
        }));
      },

      getTodayTotals: () => {
        const today = getTodayString();
        const todayLogs = get().logs.filter(log => log.date === today);
        
        return todayLogs.reduce((acc, log) => {
          return {
            calories: acc.calories + log.product.nutrition.calories,
            protein: acc.protein + log.product.nutrition.protein,
            carbs: acc.carbs + log.product.nutrition.carbs,
            fat: acc.fat + log.product.nutrition.fat,
          };
        }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
      },
    }),
    {
      name: 'fitmetrics-food-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
