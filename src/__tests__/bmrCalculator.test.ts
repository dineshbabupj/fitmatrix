import { calculateBmr, calculateBmrImperial } from '../utils/bmrCalculator';

describe('BMR Mifflin-St Jeor Calculator Formulas', () => {
  // ─── Known Value Tests ───────────────────────────────────────────────
  test('Male BMR calculation: 25yo, 175cm, 70kg', () => {
    // Male: 10(70) + 6.25(175) - 5(25) + 5 = 1673.75 -> 1674
    const res = calculateBmr('male', 70, 175, 25);
    expect(res.bmr).toBe(1674);
  });

  test('Female BMR calculation: 25yo, 165cm, 60kg', () => {
    // Female: 10(60) + 6.25(165) - 5(25) - 161 = 1345.25 -> 1345
    const res = calculateBmr('female', 60, 165, 25);
    expect(res.bmr).toBe(1345);
  });

  // ─── Male vs Female Comparison ───────────────────────────────────────
  test('Male BMR > Female BMR (same age, height, weight)', () => {
    const male = calculateBmr('male', 70, 175, 30);
    const female = calculateBmr('female', 70, 175, 30);
    // Male formula adds +5, Female subtracts -161, difference = 166
    expect(male.bmr - female.bmr).toBe(166);
  });

  // ─── Age Effect Tests ────────────────────────────────────────────────
  test('Different Age: 50yo Male vs 20yo Male — older should have lower BMR', () => {
    const young = calculateBmr('male', 70, 175, 20);
    const older = calculateBmr('male', 70, 175, 50);
    expect(young.bmr).toBeGreaterThan(older.bmr);
    // BMR decreases by 5 kcal per year: 5 * 30 = 150 difference
    expect(young.bmr - older.bmr).toBe(150);
  });

  test('Age 10 vs Age 80 — significant BMR difference', () => {
    const young = calculateBmr('male', 70, 175, 10);
    const elderly = calculateBmr('male', 70, 175, 80);
    expect(young.bmr - elderly.bmr).toBe(350); // 5 * 70 years = 350
  });

  // ─── Activity Multiplier Tests ───────────────────────────────────────
  test('All 5 activity levels are calculated correctly', () => {
    const res = calculateBmr('male', 70, 175, 25);
    expect(res.sedentary).toBe(Math.round(res.bmr * 1.2));
    expect(res.lightlyActive).toBe(Math.round(res.bmr * 1.375));
    expect(res.moderatelyActive).toBe(Math.round(res.bmr * 1.55));
    expect(res.veryActive).toBe(Math.round(res.bmr * 1.725));
    expect(res.extraActive).toBe(Math.round(res.bmr * 1.9));
  });

  test('Activity levels are in ascending order', () => {
    const res = calculateBmr('female', 60, 165, 25);
    expect(res.sedentary).toBeLessThan(res.lightlyActive);
    expect(res.lightlyActive).toBeLessThan(res.moderatelyActive);
    expect(res.moderatelyActive).toBeLessThan(res.veryActive);
    expect(res.veryActive).toBeLessThan(res.extraActive);
  });

  // ─── Imperial Conversion Test ────────────────────────────────────────
  test('Imperial BMR calculation (154 lbs, 69 inches, 25yo male)', () => {
    const res = calculateBmrImperial('male', 154, 69, 25);
    expect(res.bmr).toBeGreaterThan(1500);
    expect(res.bmr).toBeLessThan(1800);
  });

  // ─── Return Structure Test ───────────────────────────────────────────
  test('Result must include healthTip string', () => {
    const res = calculateBmr('male', 70, 175, 25);
    expect(typeof res.healthTip).toBe('string');
    expect(res.healthTip.length).toBeGreaterThan(10);
  });
});
