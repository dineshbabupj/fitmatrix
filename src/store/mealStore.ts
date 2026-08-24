import { create } from 'zustand';
import { mealDb, MealLog } from '../data/db';

export interface DailyNutritionSummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
}

export interface MealStoreState {
  todayDate: string;
  meals: MealLog[];
  isLoading: boolean;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;

  // Actions
  loadTodayMeals: () => Promise<void>;
  addMeal: (meal: Omit<MealLog, 'id' | 'created_at'>) => Promise<MealLog>;
  deleteMeal: (id: string) => Promise<void>;
  setTargets: (calories: number, protein: number, carbs: number, fats: number) => void;
  getNutritionSummary: () => DailyNutritionSummary;
}

const getTodayString = (): string => new Date().toISOString().split('T')[0];

export const useMealStore = create<MealStoreState>((set, get) => ({
  todayDate: getTodayString(),
  meals: [],
  isLoading: false,
  targetCalories: 2000,
  targetProtein: 150,
  targetCarbs: 200,
  targetFats: 65,

  loadTodayMeals: async () => {
    set({ isLoading: true });
    try {
      const today = getTodayString();
      const logs = await mealDb.getByDate(today);
      set({ todayDate: today, meals: logs });
    } catch (e) {
      console.warn('[mealStore] Failed to load today meals:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  addMeal: async (mealData) => {
    const record = await mealDb.addMeal(mealData);
    set((state) => ({
      meals: [...state.meals, record],
    }));
    return record;
  },

  deleteMeal: async (id) => {
    await mealDb.deleteMeal(id);
    set((state) => ({
      meals: state.meals.filter((m) => m.id !== id),
    }));
  },

  setTargets: (calories, protein, carbs, fats) => {
    set({
      targetCalories: calories,
      targetProtein: protein,
      targetCarbs: carbs,
      targetFats: fats,
    });
  },

  getNutritionSummary: () => {
    const { meals, todayDate, targetCalories, targetProtein, targetCarbs, targetFats } = get();
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;

    meals.forEach((m) => {
      totalCalories += m.calories;
      totalProtein += m.protein_g;
      totalCarbs += m.carbs_g;
      totalFats += m.fats_g;
    });

    return {
      date: todayDate,
      totalCalories: Math.round(totalCalories),
      totalProtein: Math.round(totalProtein),
      totalCarbs: Math.round(totalCarbs),
      totalFats: Math.round(totalFats),
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFats,
    };
  },
}));
