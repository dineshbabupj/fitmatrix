import {
  validateBmiInputs,
  validateBmrInputs,
  validateBodyFatInputs,
  validateIdealWeightInputs,
  BmiInputParams,
  IdealWeightInputParams,
} from '../utils/validation';

describe('Input Validation & Boundary Testing', () => {
  const defaultBmiParams: BmiInputParams = {
    gender: 'male', ageStr: '25', unitSystem: 'metric',
    heightCmStr: '175', weightKgStr: '70',
    heightFtStr: '', heightInStr: '', weightLbsStr: '',
  };

  const defaultIdealParams: IdealWeightInputParams = {
    gender: 'male', unitSystem: 'imperial',
    heightCmStr: '', heightFtStr: '5', heightInStr: '10',
  };

  // ──────────────────────────────────────────────────────────────────────
  describe('BMI Validation', () => {
    test('Valid Metric Inputs', () => {
      const res = validateBmiInputs(defaultBmiParams);
      expect(res.isValid).toBe(true);
      expect(res.data?.heightCm).toBe(175);
      expect(res.data?.weightKg).toBe(70);
    });

    test('Boundary: Height = 50 cm (minimum valid)', () => {
      const res = validateBmiInputs({ ...defaultBmiParams, heightCmStr: '50' });
      expect(res.isValid).toBe(true);
    });

    test('Boundary: Height = 300 cm (maximum valid)', () => {
      const res = validateBmiInputs({ ...defaultBmiParams, heightCmStr: '300' });
      expect(res.isValid).toBe(true);
    });

    test('Boundary: Height = 49 cm (below minimum — should fail)', () => {
      const res = validateBmiInputs({ ...defaultBmiParams, heightCmStr: '49' });
      expect(res.isValid).toBe(false);
      expect(res.errors.height).toContain('between 50 cm and 300 cm');
    });

    test('Boundary: Height = 301 cm (above maximum — should fail)', () => {
      const res = validateBmiInputs({ ...defaultBmiParams, heightCmStr: '301' });
      expect(res.isValid).toBe(false);
      expect(res.errors.height).toContain('between 50 cm and 300 cm');
    });

    test('Boundary: Height = 0 (zero — should fail)', () => {
      const res = validateBmiInputs({ ...defaultBmiParams, heightCmStr: '0' });
      expect(res.isValid).toBe(false);
    });

    test('Boundary: Height = -100 (negative — should fail)', () => {
      const res = validateBmiInputs({ ...defaultBmiParams, heightCmStr: '-100' });
      expect(res.isValid).toBe(false);
    });

    test('Boundary: Weight = 2 kg (minimum valid)', () => {
      const res = validateBmiInputs({ ...defaultBmiParams, weightKgStr: '2' });
      expect(res.isValid).toBe(true);
    });

    test('Boundary: Weight = 1 kg (below minimum — should fail)', () => {
      const res = validateBmiInputs({ ...defaultBmiParams, weightKgStr: '1' });
      expect(res.isValid).toBe(false);
      expect(res.errors.weight).toContain('between 2 kg and 500 kg');
    });

    test('Boundary: Weight = 0 (zero — should fail)', () => {
      const res = validateBmiInputs({ ...defaultBmiParams, weightKgStr: '0' });
      expect(res.isValid).toBe(false);
    });

    test('Boundary: Weight = -50 (negative — should fail)', () => {
      const res = validateBmiInputs({ ...defaultBmiParams, weightKgStr: '-50' });
      expect(res.isValid).toBe(false);
    });

    test('Boundary: Weight = 501 kg (extremely large — should fail)', () => {
      const res = validateBmiInputs({ ...defaultBmiParams, weightKgStr: '501' });
      expect(res.isValid).toBe(false);
    });

    test('Null/Empty: Gender empty string — should fail with message', () => {
      const res = validateBmiInputs({ ...defaultBmiParams, gender: '' });
      expect(res.isValid).toBe(false);
      expect(res.errors.gender).toBe('Please select a gender (Male or Female).');
    });

    test('Null/Empty: Age empty string — should fail', () => {
      const res = validateBmiInputs({ ...defaultBmiParams, ageStr: '' });
      expect(res.isValid).toBe(false);
      expect(res.errors.age).toBe('Please enter a valid age.');
    });

    test('Null/Empty: Height empty string — should fail', () => {
      const res = validateBmiInputs({ ...defaultBmiParams, heightCmStr: '' });
      expect(res.isValid).toBe(false);
      expect(res.errors.height).toBe('Please enter your height in cm.');
    });

    test('Null/Empty: Weight empty string — should fail', () => {
      const res = validateBmiInputs({ ...defaultBmiParams, weightKgStr: '' });
      expect(res.isValid).toBe(false);
      expect(res.errors.weight).toBe('Please enter your weight in kg.');
    });

    test('Type Check: Non-numeric height (abc) — should fail', () => {
      const res = validateBmiInputs({ ...defaultBmiParams, heightCmStr: 'abc' });
      expect(res.isValid).toBe(false);
    });

    test('Type Check: Non-numeric weight (xyz) — should fail', () => {
      const res = validateBmiInputs({ ...defaultBmiParams, weightKgStr: 'xyz' });
      expect(res.isValid).toBe(false);
    });

    test('Type Check: Special characters (!!@#) — should fail', () => {
      const res = validateBmiInputs({ ...defaultBmiParams, heightCmStr: '!!@#' });
      expect(res.isValid).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  describe('BMR Validation', () => {
    test('Boundary: Age = 1 (minimum valid)', () => {
      const res = validateBmrInputs({ ...defaultBmiParams, ageStr: '1' });
      expect(res.isValid).toBe(true);
    });

    test('Boundary: Age = 120 (maximum valid)', () => {
      const res = validateBmrInputs({ ...defaultBmiParams, ageStr: '120' });
      expect(res.isValid).toBe(true);
    });

    test('Boundary: Age = 0 — should fail', () => {
      const res = validateBmrInputs({ ...defaultBmiParams, ageStr: '0' });
      expect(res.isValid).toBe(false);
      expect(res.errors.age).toContain('between 1 and 120 years');
    });

    test('Boundary: Age = 121 — should fail', () => {
      const res = validateBmrInputs({ ...defaultBmiParams, ageStr: '121' });
      expect(res.isValid).toBe(false);
      expect(res.errors.age).toContain('between 1 and 120 years');
    });

    test('Boundary: Age = -5 (negative) — should fail', () => {
      const res = validateBmrInputs({ ...defaultBmiParams, ageStr: '-5' });
      expect(res.isValid).toBe(false);
    });

    test('Boundary: Age = 999 (extremely large) — should fail', () => {
      const res = validateBmrInputs({ ...defaultBmiParams, ageStr: '999' });
      expect(res.isValid).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  describe('Body Fat Validation', () => {
    test('Valid male inputs — should pass', () => {
      const res = validateBodyFatInputs({
        gender: 'male', unitSystem: 'metric',
        heightStr: '175', neckStr: '38', waistStr: '85', hipStr: '',
      });
      expect(res.isValid).toBe(true);
    });

    test('Female missing hip measurement — should fail', () => {
      const res = validateBodyFatInputs({
        gender: 'female', unitSystem: 'metric',
        heightStr: '165', neckStr: '34', waistStr: '75', hipStr: '',
      });
      expect(res.isValid).toBe(false);
      expect(res.errors.hip).toBe('Hip circumference is required for females. Enter value in cm.');
    });

    test('Valid female inputs with hip — should pass', () => {
      const res = validateBodyFatInputs({
        gender: 'female', unitSystem: 'metric',
        heightStr: '165', neckStr: '34', waistStr: '75', hipStr: '95',
      });
      expect(res.isValid).toBe(true);
    });

    test('Empty neck measurement — should fail', () => {
      const res = validateBodyFatInputs({
        gender: 'male', unitSystem: 'metric',
        heightStr: '175', neckStr: '', waistStr: '85', hipStr: '',
      });
      expect(res.isValid).toBe(false);
    });

    test('Empty waist measurement — should fail', () => {
      const res = validateBodyFatInputs({
        gender: 'male', unitSystem: 'metric',
        heightStr: '175', neckStr: '38', waistStr: '', hipStr: '',
      });
      expect(res.isValid).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  describe('Ideal Weight Validation', () => {
    test('Valid Imperial Feet & Inches', () => {
      const res = validateIdealWeightInputs(defaultIdealParams);
      expect(res.isValid).toBe(true);
      expect(res.data?.heightCm).toBeCloseTo(177.8, 1);
    });

    test('Valid Metric cm input', () => {
      const res = validateIdealWeightInputs({
        gender: 'female', unitSystem: 'metric',
        heightCmStr: '165', heightFtStr: '', heightInStr: '',
      });
      expect(res.isValid).toBe(true);
    });

    test('Empty height — should fail', () => {
      const res = validateIdealWeightInputs({
        gender: 'male', unitSystem: 'metric',
        heightCmStr: '', heightFtStr: '', heightInStr: '',
      });
      expect(res.isValid).toBe(false);
    });
  });
});
