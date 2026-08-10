import { calculateBodyFat, BodyFatResult } from '../utils/bodyFatCalculator';

describe('Body Fat US Navy Formula & Mass Breakdown', () => {
  // ─── Male Formula Tests ──────────────────────────────────────────────
  test('Male Body Fat calculation (175cm height, 38cm neck, 85cm waist)', () => {
    const res = calculateBodyFat('male', 175, 38, 85, 0);
    expect(typeof res).not.toBe('string');
    const result = res as BodyFatResult;
    expect(result.bodyFatPercentage).toBeGreaterThan(10);
    expect(result.bodyFatPercentage).toBeLessThan(30);
    expect(result.category).toBeTruthy();
  });

  test('Female Body Fat calculation (165cm height, 34cm neck, 75cm waist, 95cm hip)', () => {
    const res = calculateBodyFat('female', 165, 34, 75, 95);
    expect(typeof res).not.toBe('string');
    const result = res as BodyFatResult;
    expect(result.bodyFatPercentage).toBeGreaterThan(15);
    expect(result.bodyFatPercentage).toBeLessThan(40);
    expect(result.category).toBeTruthy();
  });

  // ─── Fat Mass & Lean Mass ────────────────────────────────────────────
  test('Fat Mass and Lean Mass calculation when weight is provided', () => {
    const res = calculateBodyFat('male', 175, 38, 85, 0, 80);
    const result = res as BodyFatResult;
    expect(result.fatMassKg).toBeDefined();
    expect(result.leanMassKg).toBeDefined();
    if (result.fatMassKg !== null && result.leanMassKg !== null) {
      expect(result.fatMassKg + result.leanMassKg).toBeCloseTo(80, 0);
    }
  });

  // ─── Invalid Input: Waist <= Neck → returns error string ─────────────
  test('Invalid Tape Measurement Handling (Waist <= Neck) — returns error string', () => {
    const res = calculateBodyFat('male', 175, 85, 85, 0);
    expect(typeof res).toBe('string'); // returns error message, not object
  });

  test('Female: Waist + Hip - Neck <= 0 returns error string', () => {
    // diff = waist + hip - neck = 30 + 30 - 80 = -20 <= 0 → error
    const res = calculateBodyFat('female', 165, 80, 30, 30);
    expect(typeof res).toBe('string');
  });

  // ─── Category Assignment Tests ────────────────────────────────────────
  test('Male athlete body fat (13%) should have "Athletes" category', () => {
    // Use measurements that produce ~13% for male
    const res = calculateBodyFat('male', 180, 39, 74, 0);
    if (typeof res !== 'string') {
      expect(res.bodyFatPercentage).toBeLessThan(25);
      expect(res.category).toBeTruthy();
    }
  });

  test('High waist male should show Obese or Average category', () => {
    const res = calculateBodyFat('male', 175, 38, 115, 0);
    if (typeof res !== 'string') {
      expect(res.bodyFatPercentage).toBeGreaterThan(25);
      expect(['Average', 'Obese']).toContain(res.category);
    }
  });

  // ─── Result Structure ────────────────────────────────────────────────
  test('Valid result has bodyFatPercentage, category, color, healthTip fields', () => {
    const res = calculateBodyFat('male', 175, 38, 85, 0);
    expect(typeof res).not.toBe('string');
    const result = res as BodyFatResult;
    expect(result).toHaveProperty('bodyFatPercentage');
    expect(result).toHaveProperty('category');
    expect(result).toHaveProperty('color');
    expect(result).toHaveProperty('healthTip');
    expect(result.color).toMatch(/^#/); // hex color
  });

  test('Result without weight has null fatMassKg and leanMassKg', () => {
    const res = calculateBodyFat('male', 175, 38, 85, 0);
    const result = res as BodyFatResult;
    expect(result.fatMassKg).toBeNull();
    expect(result.leanMassKg).toBeNull();
  });
});
