import { workoutDb, mealDb } from '../../data/db';
import { storage } from '../../data/storage';
import { useWaterStore } from '../../store/useWaterStore';

export interface OverloadSuggestion {
  exerciseId: string;
  exerciseName: string;
  currentWeightKg: number;
  suggestedWeightKg: number;
  reason: string;
}

export interface WeeklyAISummary {
  totalWorkouts: number;
  totalCaloriesBurned: number;
  totalMealsLogged: number;
  avgDailyCalories: number;
  proteinGoalHitCount: number; // Out of 7 days
  topExercise?: string;
  waterAdherencePercent: number;
  coachingAdvice: string;
  keyHighlight: string;
}

class AICoachService {
  /**
   * Analyze previous exercise sets to recommend Progressive Overload (+2.5kg or +5%)
   */
  public async getProgressiveOverload(
    exerciseName: string,
    currentWeight: number,
    completedReps: number
  ): Promise<OverloadSuggestion | null> {
    try {
      const recentWorkouts = await workoutDb.getAllWorkouts(10);
      let previousMaxWeight = currentWeight;
      let matchedCount = 0;

      for (const w of recentWorkouts) {
        const sets = await workoutDb.getWorkoutSets(w.id);
        const matchingSets = sets.filter(
          (s) => s.exercise_name.toLowerCase() === exerciseName.toLowerCase() && s.is_completed === 1
        );

        if (matchingSets.length > 0) {
          matchedCount += matchingSets.length;
          matchingSets.forEach((s) => {
            if (s.weight_kg > previousMaxWeight) {
              previousMaxWeight = s.weight_kg;
            }
          });
        }
      }

      // If user hit 8+ reps with high consistency, recommend +2.5kg increase
      if (completedReps >= 8 && matchedCount >= 2) {
        const suggested = Math.round((previousMaxWeight + 2.5) * 10) / 10;
        return {
          exerciseId: exerciseName,
          exerciseName,
          currentWeightKg: previousMaxWeight,
          suggestedWeightKg: suggested,
          reason: `Great performance! You hit ${completedReps} reps in recent sessions. Ready for +2.5kg.`,
        };
      }

      return null;
    } catch (e) {
      console.warn('[AICoachService] Overload suggestion error:', e);
      return null;
    }
  }

  /**
   * Generate 7-Day Weekly AI Summary Report
   */
  public async getWeeklySummary(): Promise<WeeklyAISummary> {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    let totalWorkouts = 0;
    let totalCaloriesBurned = 0;
    let totalMealsLogged = 0;
    let totalCaloriesEaten = 0;
    let proteinGoalHitCount = 0;
    let topExercise = '';
    const exerciseCountMap: Record<string, number> = {};

    try {
      const workouts = await workoutDb.getAllWorkouts(30);
      const weeklyWorkouts = workouts.filter((w) => w.date >= sevenDaysAgo);
      totalWorkouts = weeklyWorkouts.length;

      for (const w of weeklyWorkouts) {
        totalCaloriesBurned += w.calories_burned || 250;
        const sets = await workoutDb.getWorkoutSets(w.id);
        sets.forEach((s) => {
          if (s.exercise_name) {
            exerciseCountMap[s.exercise_name] = (exerciseCountMap[s.exercise_name] || 0) + 1;
          }
        });
      }

      // Determine top exercise by volume
      let maxExCount = 0;
      Object.entries(exerciseCountMap).forEach(([name, count]) => {
        if (count > maxExCount) {
          maxExCount = count;
          topExercise = name;
        }
      });

      // Loop through past 7 days for meal logs
      for (let i = 0; i < 7; i++) {
        const dateStr = new Date(now - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const meals = await mealDb.getByDate(dateStr);
        if (meals.length > 0) {
          totalMealsLogged += meals.length;
          let dayCals = 0;
          let dayProtein = 0;
          meals.forEach((m) => {
            dayCals += m.calories;
            dayProtein += m.protein_g;
          });
          totalCaloriesEaten += dayCals;
          if (dayProtein >= 100) proteinGoalHitCount += 1;
        }
      }

      const avgDailyCalories = Math.round(totalCaloriesEaten / 7);

      // Water adherence
      const waterLogs = useWaterStore.getState().logs;
      const dailyWaterGoal = useWaterStore.getState().dailyGoal || 2500;
      let waterDaysMet = 0;
      for (let i = 0; i < 7; i++) {
        const dateStr = new Date(now - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        if ((waterLogs[dateStr] || 0) >= dailyWaterGoal) {
          waterDaysMet += 1;
        }
      }
      const waterAdherencePercent = Math.round((waterDaysMet / 7) * 100);

      // User Goal
      const userGoal = storage.getGoal();
      let keyHighlight = 'Consistency is key to results.';
      let coachingAdvice = 'Log your workouts and nutrition daily to unlock adaptive AI insights.';

      if (totalWorkouts >= 4) {
        keyHighlight = `🔥 High Volume: ${totalWorkouts} sessions completed!`;
        coachingAdvice = `Solid workload this week! ${topExercise ? `Top movement: ${topExercise}.` : ''} Prioritize 8 hours of sleep and high protein for optimal recovery.`;
      } else if (totalWorkouts >= 2) {
        keyHighlight = `⚡ Balanced Week: ${totalWorkouts} gym sessions logged.`;
        coachingAdvice = `Great job staying active. For progressive overload, aim to add 1 additional set or 2.5kg to your main compound lifts next week.`;
      } else {
        keyHighlight = '💡 New week, fresh start!';
        coachingAdvice = 'Hit at least 3 strength workouts this week. Even a 30-minute session creates massive momentum.';
      }

      if (proteinGoalHitCount >= 5) {
        coachingAdvice += ` 🥩 Protein intake was on point (${proteinGoalHitCount}/7 days)!`;
      }

      return {
        totalWorkouts,
        totalCaloriesBurned: Math.round(totalCaloriesBurned),
        totalMealsLogged,
        avgDailyCalories,
        proteinGoalHitCount,
        topExercise: topExercise || undefined,
        waterAdherencePercent,
        coachingAdvice,
        keyHighlight,
      };
    } catch (e) {
      return {
        totalWorkouts: 0,
        totalCaloriesBurned: 0,
        totalMealsLogged: 0,
        avgDailyCalories: 0,
        proteinGoalHitCount: 0,
        waterAdherencePercent: 0,
        coachingAdvice: 'Log workouts, meals, and water to unlock your weekly AI coach summary.',
        keyHighlight: 'Start logging today!',
      };
    }
  }
}

export const aiCoachService = new AICoachService();
