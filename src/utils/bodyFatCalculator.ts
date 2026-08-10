// ─────────────────────────────────────────────
// Body Fat Calculator – US Navy Method (pure logic)
// ─────────────────────────────────────────────

export type BodyFatCategory = 'Essential Fat' | 'Athletes' | 'Fitness' | 'Average' | 'Obese';

export interface BodyFatResult {
  bodyFatPercentage: number;
  category: BodyFatCategory;
  color: string;
  leanMassKg: number | null;
  fatMassKg: number | null;
  healthTip: string;
}

/**
 * US Navy body fat formula — all inputs in cm.
 *
 *   Male:   495 / (1.0324 − 0.19077 × log₁₀(waist − neck) + 0.15456 × log₁₀(height)) − 450
 *   Female: 495 / (1.29579 − 0.35004 × log₁₀(waist + hip − neck) + 0.22100 × log₁₀(height)) − 450
 *
 * Returns an error string if the subtraction results in ≤ 0 (invalid measurement).
 */
export const calculateBodyFat = (
  gender: 'male' | 'female',
  heightCm: number,
  neckCm: number,
  waistCm: number,
  hipCm: number,
  weightKg?: number,
): BodyFatResult | string => {
  let bodyFat: number;

  if (gender === 'male') {
    const diff = waistCm - neckCm;
    if (diff <= 0) return 'Waist circumference must be greater than neck circumference.';
    bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(diff) + 0.15456 * Math.log10(heightCm)) - 450;
  } else {
    const diff = waistCm + hipCm - neckCm;
    if (diff <= 0) return 'Waist + Hip circumference must be greater than neck circumference.';
    bodyFat = 495 / (1.29579 - 0.35004 * Math.log10(diff) + 0.221 * Math.log10(heightCm)) - 450;
  }

  const rounded = parseFloat(bodyFat.toFixed(1));
  const { category, color, healthTip } = categorise(gender, rounded);

  let leanMassKg: number | null = null;
  let fatMassKg: number | null = null;
  if (weightKg && weightKg > 0) {
    fatMassKg = parseFloat(((rounded / 100) * weightKg).toFixed(1));
    leanMassKg = parseFloat((weightKg - fatMassKg).toFixed(1));
  }

  return { bodyFatPercentage: rounded, category, color, leanMassKg, fatMassKg, healthTip };
};

// Category thresholds differ by gender
const categorise = (
  gender: 'male' | 'female',
  bf: number,
): { category: BodyFatCategory; color: string; healthTip: string } => {
  if (gender === 'male') {
    if (bf < 6) return { category: 'Essential Fat', color: '#2196F3', healthTip: 'Minimum fat needed for basic health and organ protection. Sustained low levels may impair hormone function.' };
    if (bf < 14) return { category: 'Athletes', color: '#4CAF50', healthTip: 'Excellent body composition typically seen in competitive athletes.' };
    if (bf < 18) return { category: 'Fitness', color: '#8BC34A', healthTip: 'Healthy fitness range with low cardiovascular risk.' };
    if (bf < 25) return { category: 'Average', color: '#FF9800', healthTip: 'Acceptable range — incorporating strength training and balanced nutrition can help improve body composition.' };
    return { category: 'Obese', color: '#F44336', healthTip: 'Elevated body fat increases risk of heart disease, diabetes, and joint problems. Consult a healthcare professional.' };
  }
  // Female thresholds are higher
  if (bf < 14) return { category: 'Essential Fat', color: '#2196F3', healthTip: 'Minimum fat needed for basic health, hormonal balance, and reproductive function.' };
  if (bf < 21) return { category: 'Athletes', color: '#4CAF50', healthTip: 'Excellent body composition typically seen in competitive female athletes.' };
  if (bf < 25) return { category: 'Fitness', color: '#8BC34A', healthTip: 'Healthy fitness range with low cardiovascular risk.' };
  if (bf < 32) return { category: 'Average', color: '#FF9800', healthTip: 'Acceptable range — regular exercise and balanced nutrition can help improve body composition.' };
  return { category: 'Obese', color: '#F44336', healthTip: 'Elevated body fat increases risk of chronic diseases. Consult a healthcare professional.' };
};
