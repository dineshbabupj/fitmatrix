import { calculateMacros, calculateMacrosImperial } from '../utils/macroCalculator';

describe('Macro Calculator Utility', () => {
  it('calculates macros correctly for a male in maintenance', () => {
    // 70kg, 175cm, 25 years, moderate activity, maintain
    const result = calculateMacros('male', 70, 175, 25, 'moderate', 'maintain');
    
    expect(result.tdee).toBeGreaterThan(2000);
    expect(result.targetCalories).toEqual(result.tdee);
    expect(result.proteinPercent).toEqual(30);
    expect(result.carbsPercent).toEqual(40);
    expect(result.fatPercent).toEqual(30);
    expect(result.proteinGrams).toBeGreaterThan(0);
    expect(result.carbsGrams).toBeGreaterThan(0);
    expect(result.fatGrams).toBeGreaterThan(0);
  });

  it('calculates weight loss calorie deficit (20%)', () => {
    const maintainResult = calculateMacros('female', 60, 165, 30, 'light', 'maintain');
    const loseResult = calculateMacros('female', 60, 165, 30, 'light', 'lose');

    expect(loseResult.targetCalories).toBeLessThan(maintainResult.targetCalories);
    expect(loseResult.proteinPercent).toEqual(40);
  });

  it('calculates muscle gain calorie surplus (15%)', () => {
    const maintainResult = calculateMacros('male', 80, 180, 22, 'very', 'maintain');
    const gainResult = calculateMacros('male', 80, 180, 22, 'very', 'gain');

    expect(gainResult.targetCalories).toBeGreaterThan(maintainResult.targetCalories);
    expect(gainResult.carbsPercent).toEqual(50);
  });

  it('handles imperial units correctly', () => {
    // 154 lbs (~70kg), 69 inches (~175cm), 25 years
    const metric = calculateMacros('male', 70, 175, 25, 'moderate', 'maintain');
    const imperial = calculateMacrosImperial('male', 154, 69, 25, 'moderate', 'maintain');

    expect(Math.abs(metric.targetCalories - imperial.targetCalories)).toBeLessThan(50);
  });
});
