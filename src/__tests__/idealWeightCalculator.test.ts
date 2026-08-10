import { calculateIdealWeight } from '../utils/idealWeightCalculator';

describe('Ideal Body Weight Clinical Formulas (Devine, Robinson, Miller, Hamwi)', () => {
  // ─── Male Tests ──────────────────────────────────────────────────────
  test('Male Ideal Weight (175cm metric)', () => {
    const res = calculateIdealWeight('male', 175, 'metric');
    expect(res.devine).toBeGreaterThan(60);
    expect(res.robinson).toBeGreaterThan(60);
    expect(res.miller).toBeGreaterThan(60);
    expect(res.hamwi).toBeGreaterThan(60);
  });

  test('Female Ideal Weight (165cm metric)', () => {
    const res = calculateIdealWeight('female', 165, 'metric');
    expect(res.devine).toBeGreaterThan(45);
    expect(res.robinson).toBeGreaterThan(45);
    expect(res.miller).toBeGreaterThan(45);
    expect(res.hamwi).toBeGreaterThan(45);
  });

  // ─── Known Reference Values ───────────────────────────────────────────
  test('Male 177.8cm (5ft10in) — Devine formula ~73 kg', () => {
    const res = calculateIdealWeight('male', 177.8, 'metric');
    // Devine Male: 50 + 2.3 * (70 - 60) = 50 + 23 = 73 kg
    expect(res.devine).toBeGreaterThan(65);
    expect(res.devine).toBeLessThan(85);
  });

  test('Female 165.1cm (5ft5in) — Hamwi formula ~56.5 kg', () => {
    const res = calculateIdealWeight('female', 165.1, 'metric');
    // Hamwi Female: 45.5 + 2.2 * (65 - 60) = 45.5 + 11 = 56.5 kg
    expect(res.hamwi).toBeGreaterThan(50);
    expect(res.hamwi).toBeLessThan(65);
  });

  // ─── All 4 Formulas Positive ──────────────────────────────────────────
  test('All 4 formulas return positive values for valid male input', () => {
    const res = calculateIdealWeight('male', 175, 'metric');
    expect(res.devine).toBeGreaterThan(0);
    expect(res.robinson).toBeGreaterThan(0);
    expect(res.miller).toBeGreaterThan(0);
    expect(res.hamwi).toBeGreaterThan(0);
  });

  test('All 4 formulas return positive values for valid female input', () => {
    const res = calculateIdealWeight('female', 165, 'metric');
    expect(res.devine).toBeGreaterThan(0);
    expect(res.robinson).toBeGreaterThan(0);
    expect(res.miller).toBeGreaterThan(0);
    expect(res.hamwi).toBeGreaterThan(0);
  });

  // ─── Imperial Unit Output ─────────────────────────────────────────────
  test('Imperial Output: male 175cm in lbs — all values > 100 lbs', () => {
    const res = calculateIdealWeight('male', 175, 'imperial');
    expect(res.unit).toBe('lbs');
    expect(res.devine).toBeGreaterThan(100); // ~161 lbs
    expect(res.hamwi).toBeGreaterThan(100);
  });

  test('Metric Output: unit is kg', () => {
    const res = calculateIdealWeight('male', 175, 'metric');
    expect(res.unit).toBe('kg');
  });

  // ─── Shorter Height Fallback ──────────────────────────────────────────
  test('Height < 5 feet (150cm) — should not crash, returns fallback', () => {
    const res = calculateIdealWeight('male', 150, 'metric');
    expect(res.devine).toBeGreaterThan(0);
  });

  // ─── Taller > Shorter ─────────────────────────────────────────────────
  test('Taller person should have higher ideal weight than shorter person', () => {
    const tall = calculateIdealWeight('male', 185, 'metric');
    const short = calculateIdealWeight('male', 165, 'metric');
    expect(tall.devine).toBeGreaterThan(short.devine);
    expect(tall.hamwi).toBeGreaterThan(short.hamwi);
  });

  // ─── Range Fields ─────────────────────────────────────────────────────
  test('Result has minRange and maxRange fields', () => {
    const res = calculateIdealWeight('male', 175, 'metric');
    expect(res).toHaveProperty('minRange');
    expect(res).toHaveProperty('maxRange');
    expect(res.maxRange).toBeGreaterThanOrEqual(res.minRange);
  });

  // ─── Structure Test ───────────────────────────────────────────────────
  test('Result has all 4 formula keys plus average, unit, healthTip', () => {
    const res = calculateIdealWeight('male', 175, 'metric');
    expect(res).toHaveProperty('devine');
    expect(res).toHaveProperty('robinson');
    expect(res).toHaveProperty('miller');
    expect(res).toHaveProperty('hamwi');
    expect(res).toHaveProperty('average');
    expect(res).toHaveProperty('unit');
    expect(res).toHaveProperty('healthTip');
  });
});
