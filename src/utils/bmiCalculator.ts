// ─────────────────────────────────────────────
// BMI Calculator – pure logic (no UI)
// ─────────────────────────────────────────────

import { ValidatedBmiData } from './validation';

export interface BmiResult {
  bmi: number;
  category: 'Underweight' | 'Normal' | 'Overweight' | 'Obese';
  color: string;
  healthTip: string;
}

// Alias for backward-compat with BmiScreen import
export type BmiResultData = BmiResult;

/**
 * Metric formula:  weight(kg) / height(m)²
 */
export const calculateBmiMetric = (weightKg: number, heightCm: number): BmiResult => {
  const heightM = heightCm / 100;
  const bmi = parseFloat((weightKg / (heightM * heightM)).toFixed(1));
  return categoriseBmi(bmi);
};

/**
 * Imperial formula:  weight(lbs) × 703 / height(in)²
 */
export const calculateBmiImperial = (weightLbs: number, totalInches: number): BmiResult => {
  const bmi = parseFloat(((weightLbs * 703) / (totalInches * totalInches)).toFixed(1));
  return categoriseBmi(bmi);
};

/**
 * Convenience: accepts ValidatedBmiData from the validation layer.
 * Used by BmiScreen.
 */
export const computeBmi = (data: ValidatedBmiData): BmiResult => {
  if (data.unitSystem === 'imperial' && data.weightLbs && data.totalInches) {
    return calculateBmiImperial(data.weightLbs, data.totalInches);
  }
  if (data.weightKg && data.heightCm) {
    return calculateBmiMetric(data.weightKg, data.heightCm);
  }
  // Fallback – should never happen after validation
  return { bmi: 0, category: 'Normal', color: '#4CAF50', healthTip: '' };
};

const categoriseBmi = (bmi: number): BmiResult => {
  if (bmi < 18.5) {
    return {
      bmi,
      category: 'Underweight',
      color: '#2196F3',
      healthTip:
        'Being underweight may indicate nutritional deficiency. Consider consulting a healthcare provider to ensure you are meeting your dietary needs.',
    };
  }
  if (bmi <= 24.9) {
    return {
      bmi,
      category: 'Normal',
      color: '#4CAF50',
      healthTip:
        'Your weight is within the healthy range. Maintain a balanced diet and regular physical activity to stay healthy.',
    };
  }
  if (bmi <= 29.9) {
    return {
      bmi,
      category: 'Overweight',
      color: '#FF9800',
      healthTip:
        'Carrying excess weight increases risk of heart disease and diabetes. Small lifestyle changes — more movement and balanced meals — can help.',
    };
  }
  return {
    bmi,
    category: 'Obese',
    color: '#F44336',
    healthTip:
      'Obesity significantly raises the risk of chronic diseases. Please consult a healthcare professional for a personalised plan.',
  };
};

