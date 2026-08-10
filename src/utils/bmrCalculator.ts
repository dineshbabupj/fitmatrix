// ─────────────────────────────────────────────
// BMR Calculator – Mifflin-St Jeor (pure logic)
// ─────────────────────────────────────────────

export interface BmrResult {
  bmr: number;
  sedentary: number;
  lightlyActive: number;
  moderatelyActive: number;
  veryActive: number;
  extraActive: number;
  healthTip: string;
}

/**
 * Mifflin-St Jeor Formula (metric inputs):
 *   Male:   10 × weight(kg) + 6.25 × height(cm) − 5 × age + 5
 *   Female: 10 × weight(kg) + 6.25 × height(cm) − 5 × age − 161
 */
export const calculateBmr = (
  gender: 'male' | 'female',
  weightKg: number,
  heightCm: number,
  age: number,
): BmrResult => {
  const base =
    gender === 'male'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const bmr = Math.round(base);

  return {
    bmr,
    sedentary: Math.round(bmr * 1.2),
    lightlyActive: Math.round(bmr * 1.375),
    moderatelyActive: Math.round(bmr * 1.55),
    veryActive: Math.round(bmr * 1.725),
    extraActive: Math.round(bmr * 1.9),
    healthTip:
      'Your BMR represents the calories your body burns at complete rest. Multiply by your activity factor to estimate daily maintenance calories.',
  };
};

/**
 * Helper: convert imperial inputs to metric and delegate
 */
export const calculateBmrImperial = (
  gender: 'male' | 'female',
  weightLbs: number,
  totalInches: number,
  age: number,
): BmrResult => {
  const weightKg = weightLbs * 0.453592;
  const heightCm = totalInches * 2.54;
  return calculateBmr(gender, weightKg, heightCm, age);
};
