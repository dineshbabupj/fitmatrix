// ─────────────────────────────────────────────
// Ideal Weight Calculator – Devine Formula + others (pure logic)
// ─────────────────────────────────────────────

export interface IdealWeightResult {
  devine: number;
  robinson: number;
  miller: number;
  hamwi: number;
  average: number;
  minRange: number;
  maxRange: number;
  unit: string;
  healthTip: string;
}

/**
 * All four classic ideal-weight formulas require height in inches
 * and differ by gender.
 *
 * Devine:   Male 50 + 2.3 × (in − 60)     Female 45.5 + 2.3 × (in − 60)
 * Robinson: Male 52 + 1.9 × (in − 60)     Female 49   + 1.7 × (in − 60)
 * Miller:   Male 56.2 + 1.41 × (in − 60)  Female 53.1 + 1.36 × (in − 60)
 * Hamwi:    Male 48 + 2.7 × (in − 60)     Female 45.5 + 2.2 × (in − 60)
 */
export const calculateIdealWeight = (
  gender: 'male' | 'female',
  heightCm: number,
  unitSystem: 'metric' | 'imperial',
): IdealWeightResult => {
  const inches = heightCm / 2.54;
  const over60 = Math.max(inches - 60, 0);

  let devine: number, robinson: number, miller: number, hamwi: number;

  if (gender === 'male') {
    devine = 50 + 2.3 * over60;
    robinson = 52 + 1.9 * over60;
    miller = 56.2 + 1.41 * over60;
    hamwi = 48 + 2.7 * over60;
  } else {
    devine = 45.5 + 2.3 * over60;
    robinson = 49 + 1.7 * over60;
    miller = 53.1 + 1.36 * over60;
    hamwi = 45.5 + 2.2 * over60;
  }

  const averageKg = (devine + robinson + miller + hamwi) / 4;
  const minKg = Math.min(devine, robinson, miller, hamwi);
  const maxKg = Math.max(devine, robinson, miller, hamwi);

  const toUnit = (kg: number): number =>
    parseFloat(
      (unitSystem === 'imperial' ? kg * 2.20462 : kg).toFixed(1),
    );

  const unit = unitSystem === 'imperial' ? 'lbs' : 'kg';

  return {
    devine: toUnit(devine),
    robinson: toUnit(robinson),
    miller: toUnit(miller),
    hamwi: toUnit(hamwi),
    average: toUnit(averageKg),
    minRange: toUnit(minKg * 0.9),
    maxRange: toUnit(maxKg * 1.1),
    unit,
    healthTip:
      'These are estimates from classic clinical formulas. Your personal ideal weight depends on body composition, muscle mass, and overall health.',
  };
};
