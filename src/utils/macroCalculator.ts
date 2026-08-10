// ─────────────────────────────────────────────
// Macro Nutrient Calculator (Pure Logic)
// ─────────────────────────────────────────────

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very' | 'extra';
export type FitnessGoal = 'lose' | 'maintain' | 'gain';

export interface MacroResult {
  tdee: number;
  targetCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  proteinCalories: number;
  carbsCalories: number;
  fatCalories: number;
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
  healthTip: string;
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  extra: 1.9,
};

const MACRO_SPLITS: Record<FitnessGoal, { protein: number; carbs: number; fat: number; calorieMult: number }> = {
  lose: { protein: 0.4, carbs: 0.35, fat: 0.25, calorieMult: 0.8 },      // 20% deficit
  maintain: { protein: 0.3, carbs: 0.4, fat: 0.3, calorieMult: 1.0 },    // Maintenance
  gain: { protein: 0.3, carbs: 0.5, fat: 0.2, calorieMult: 1.15 },      // 15% surplus
};

export const calculateMacros = (
  gender: 'male' | 'female',
  weightKg: number,
  heightCm: number,
  age: number,
  activityLevel: ActivityLevel,
  goal: FitnessGoal
): MacroResult => {
  // 1. Calculate base BMR (Mifflin-St Jeor)
  const bmrBase =
    gender === 'male'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  // 2. Calculate Total Daily Energy Expenditure (TDEE)
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.2;
  const tdee = Math.round(bmrBase * multiplier);

  // 3. Calculate target daily calories based on goal
  const split = MACRO_SPLITS[goal] || MACRO_SPLITS.maintain;
  const targetCalories = Math.round(tdee * split.calorieMult);

  // 4. Calculate macro calories and grams
  const proteinCalories = Math.round(targetCalories * split.protein);
  const carbsCalories = Math.round(targetCalories * split.carbs);
  const fatCalories = Math.round(targetCalories * split.fat);

  const proteinGrams = Math.round(proteinCalories / 4); // 4 kcal per gram protein
  const carbsGrams = Math.round(carbsCalories / 4);     // 4 kcal per gram carbs
  const fatGrams = Math.round(fatCalories / 9);         // 9 kcal per gram fat

  let healthTip = 'Maintain consistency with your macro targets for optimal fitness results.';
  if (goal === 'lose') {
    healthTip = 'A moderate 20% calorie deficit promotes sustainable fat loss while preserving lean muscle mass.';
  } else if (goal === 'gain') {
    healthTip = 'A 15% surplus fuels muscle hypertrophy. Pair with progressive strength training for best results.';
  }

  return {
    tdee,
    targetCalories,
    proteinGrams,
    carbsGrams,
    fatGrams,
    proteinCalories,
    carbsCalories,
    fatCalories,
    proteinPercent: Math.round(split.protein * 100),
    carbsPercent: Math.round(split.carbs * 100),
    fatPercent: Math.round(split.fat * 100),
    healthTip,
  };
};

export const calculateMacrosImperial = (
  gender: 'male' | 'female',
  weightLbs: number,
  totalInches: number,
  age: number,
  activityLevel: ActivityLevel,
  goal: FitnessGoal
): MacroResult => {
  const weightKg = weightLbs * 0.453592;
  const heightCm = totalInches * 2.54;
  return calculateMacros(gender, weightKg, heightCm, age, activityLevel, goal);
};
