export interface BmiResult {
  bmi: number;
  category: 'Underweight' | 'Normal' | 'Overweight' | 'Obese';
  color: string;
}

export function calculateBmi(heightCm: number, weightKg: number): BmiResult | null {
  if (heightCm <= 0 || weightKg <= 0) return null;
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);

  let category: 'Underweight' | 'Normal' | 'Overweight' | 'Obese' = 'Normal';
  let color = '#4CAF50';

  if (bmi < 18.5) {
    category = 'Underweight';
    color = '#2196F3';
  } else if (bmi < 25) {
    category = 'Normal';
    color = '#4CAF50';
  } else if (bmi < 30) {
    category = 'Overweight';
    color = '#FF9800';
  } else {
    category = 'Obese';
    color = '#F44336';
  }

  return { bmi: parseFloat(bmi.toFixed(2)), category, color };
}

export function calculateBmr(
  gender: 'male' | 'female',
  age: number,
  heightCm: number,
  weightKg: number
): number | null {
  if (age <= 0 || heightCm <= 0 || weightKg <= 0) return null;
  if (gender === 'male') {
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);
  } else {
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 161);
  }
}

export interface BodyFatResult {
  bodyFatPercentage: number;
  category: 'Essential Fat' | 'Athletes' | 'Fitness' | 'Average' | 'Obese';
  color: string;
}

export function calculateBodyFat(
  gender: 'male' | 'female',
  heightCm: number,
  neckCm: number,
  waistCm: number,
  hipCm?: number
): BodyFatResult | null {
  if (heightCm <= 0 || neckCm <= 0 || waistCm <= 0) return null;

  let bodyFat = 0;
  if (gender === 'male') {
    const diff = waistCm - neckCm;
    if (diff <= 0) return null;
    bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(diff) + 0.15456 * Math.log10(heightCm)) - 450;
  } else {
    if (!hipCm || hipCm <= 0) return null;
    const diff = waistCm + hipCm - neckCm;
    if (diff <= 0) return null;
    bodyFat = 495 / (1.29579 - 0.35004 * Math.log10(diff) + 0.22100 * Math.log10(heightCm)) - 450;
  }

  const rounded = parseFloat(bodyFat.toFixed(1));
  let category: 'Essential Fat' | 'Athletes' | 'Fitness' | 'Average' | 'Obese' = 'Average';
  let color = '#FF9800';

  if (rounded < 6) {
    category = 'Essential Fat';
    color = '#2196F3';
  } else if (rounded < 14) {
    category = 'Athletes';
    color = '#4CAF50';
  } else if (rounded < 18) {
    category = 'Fitness';
    color = '#8BC34A';
  } else if (rounded < 25) {
    category = 'Average';
    color = '#FF9800';
  } else {
    category = 'Obese';
    color = '#F44336';
  }

  return { bodyFatPercentage: rounded, category, color };
}

export interface IdealWeightResult {
  idealWeight: number;
  minWeight: number;
  maxWeight: number;
}

export function calculateIdealWeight(
  gender: 'male' | 'female',
  heightCm: number
): IdealWeightResult | null {
  if (heightCm <= 0) return null;
  const baseWeight = gender === 'male' ? 50 : 45.5;
  const idealWeight = baseWeight + 0.91 * (heightCm - 152.4);

  const rounded = parseFloat(idealWeight.toFixed(1));
  return {
    idealWeight: rounded,
    minWeight: parseFloat((rounded * 0.9).toFixed(1)),
    maxWeight: parseFloat((rounded * 1.1).toFixed(1)),
  };
}
