import { calculateMacros } from '../macroCalculator';

describe('Macro Calculator', () => {
  it('should calculate maintenance calories correctly for male', () => {
    // 25 years, 175 cm, 70 kg, Male, Sedentary (1.2 multiplier)
    // BMR = (10 * 70) + (6.25 * 175) - (5 * 25) + 5 = 700 + 1093.75 - 125 + 5 = 1673.75
    // TDEE = 1673.75 * 1.2 = 2008.5
    const result = calculateMacros('male', 70, 175, 25, 'sedentary', 'maintain');
    
    expect(result.targetCalories).toBeCloseTo(2009, -1); 
  });

  it('should calculate deficit for weight loss', () => {
    const maintain = calculateMacros('male', 70, 175, 25, 'sedentary', 'maintain');
    const loss = calculateMacros('male', 70, 175, 25, 'sedentary', 'lose');
    
    // Weight loss is typically an 80% multiplier here
    expect(loss.targetCalories).toBeLessThan(maintain.targetCalories);
    expect(loss.targetCalories).toBeCloseTo(maintain.targetCalories * 0.8, -1);
  });

  it('should split macros correctly based on goal', () => {
    const result = calculateMacros('male', 70, 175, 25, 'sedentary', 'maintain');
    
    // Total calories should equal (protein * 4) + (carbs * 4) + (fat * 9)
    const calculatedTotal = (result.proteinGrams * 4) + (result.carbsGrams * 4) + (result.fatGrams * 9);
    
    // Allow for small rounding differences
    expect(Math.abs(result.targetCalories - calculatedTotal)).toBeLessThan(10);
  });
});
