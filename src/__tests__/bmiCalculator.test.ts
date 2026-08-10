import { computeBmi, calculateBmiMetric, calculateBmiImperial } from '../utils/bmiCalculator';

describe('BMI Calculator Formulas & Category Assignment', () => {
  // ─── Known Value Tests ───────────────────────────────────────────────
  test('computeBmi with metric values (50kg, 160cm) should produce 19.5', () => {
    const result = computeBmi({ gender: 'male', age: 25, unitSystem: 'metric', heightCm: 160, weightKg: 50 });
    expect(result.bmi).toBe(19.5);
    expect(result.category).toBe('Normal');
  });

  test('calculateBmiMetric formula (70kg, 175cm)', () => {
    const res = calculateBmiMetric(70, 175);
    expect(res.bmi).toBe(22.9);
    expect(res.category).toBe('Normal');
  });

  test('calculateBmiImperial (160 lbs, 70 inches)', () => {
    const res = calculateBmiImperial(160, 70);
    expect(res.bmi).toBe(23.0);
    expect(res.category).toBe('Normal');
  });

  // ─── Category Threshold Tests ────────────────────────────────────────
  test('BMI Category: Underweight (< 18.5)', () => {
    const result = computeBmi({ gender: 'female', age: 22, unitSystem: 'metric', heightCm: 175, weightKg: 45 });
    expect(result.bmi).toBeLessThan(18.5);
    expect(result.category).toBe('Underweight');
  });

  test('BMI Category: Normal Weight (18.5 - 24.9)', () => {
    const result = computeBmi({ gender: 'male', age: 30, unitSystem: 'metric', heightCm: 180, weightKg: 72 });
    expect(result.bmi).toBeGreaterThanOrEqual(18.5);
    expect(result.bmi).toBeLessThanOrEqual(24.9);
    expect(result.category).toBe('Normal');
  });

  test('BMI Category: Overweight (25 - 29.9)', () => {
    const result = computeBmi({ gender: 'male', age: 28, unitSystem: 'metric', heightCm: 170, weightKg: 78 });
    expect(result.bmi).toBeGreaterThanOrEqual(25);
    expect(result.bmi).toBeLessThanOrEqual(29.9);
    expect(result.category).toBe('Overweight');
  });

  test('BMI Category: Obese (>= 30)', () => {
    const result = computeBmi({ gender: 'female', age: 35, unitSystem: 'metric', heightCm: 160, weightKg: 90 });
    expect(result.bmi).toBeGreaterThanOrEqual(30);
    expect(result.category).toBe('Obese');
  });

  // ─── Boundary / Edge Case Tests ──────────────────────────────────────
  test('Minimum valid weight (2kg / 160cm) — extremely underweight', () => {
    const res = calculateBmiMetric(2, 160);
    expect(res.bmi).toBeGreaterThan(0);
    expect(res.category).toBe('Underweight');
  });

  test('Result must have healthTip and color', () => {
    const res = calculateBmiMetric(70, 175);
    expect(res.healthTip).toBeTruthy();
    expect(res.color).toMatch(/^#/); // hex color
  });

  test('BMI is consistent: doubling weight doubles BMI', () => {
    const res1 = calculateBmiMetric(70, 175);
    const res2 = calculateBmiMetric(140, 175);
    expect(res2.bmi).toBeCloseTo(res1.bmi * 2, 0);
  });

  test('BMI result is rounded to 1 decimal place', () => {
    const res = calculateBmiMetric(73, 177);
    const decimalPart = res.bmi.toString().split('.')[1];
    expect(decimalPart === undefined || decimalPart.length <= 1).toBe(true);
  });
});
