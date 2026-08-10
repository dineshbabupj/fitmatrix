// formatters.test.ts - Unit Conversion & Formatting Utilities
// ─────────────────────────────────────────────────────────────────────────

// ─── Inline Utility Functions (matching app's utility logic) ──────────────

const cmToInches = (cm: number): number => parseFloat((cm / 2.54).toFixed(2));
const inchesToCm = (inches: number): number => parseFloat((inches * 2.54).toFixed(2));
const kgToLbs = (kg: number): number => parseFloat((kg * 2.20462).toFixed(2));
const lbsToKg = (lbs: number): number => parseFloat((lbs / 2.20462).toFixed(2));
const roundTo1 = (n: number): number => Math.round(n * 10) / 10;
const roundTo2 = (n: number): number => Math.round(n * 100) / 100;

const formatDate = (timestamp: number): string => {
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatBmi = (bmi: number): string => `BMI: ${roundTo1(bmi)} kg/m²`;

// ─────────────────────────────────────────────────────────────────────────

describe('Unit Conversion & Formatting Utilities', () => {

  // ── Metric to Imperial ──────────────────────────────────────────────────
  describe('Height Conversion', () => {
    test('175 cm → 68.90 inches', () => {
      expect(cmToInches(175)).toBeCloseTo(68.9, 1);
    });

    test('160 cm → 62.99 inches', () => {
      expect(cmToInches(160)).toBeCloseTo(62.99, 1);
    });

    test('70 inches → 177.8 cm', () => {
      expect(inchesToCm(70)).toBeCloseTo(177.8, 0);
    });

    test('60 inches → 152.4 cm', () => {
      expect(inchesToCm(60)).toBeCloseTo(152.4, 1);
    });

    test('Round-trip: cm → inches → cm should be same', () => {
      const original = 175;
      const converted = inchesToCm(cmToInches(original));
      expect(converted).toBeCloseTo(original, 0);
    });

    test('0 cm → 0 inches', () => {
      expect(cmToInches(0)).toBe(0);
    });
  });

  // ── Weight Conversion ────────────────────────────────────────────────────
  describe('Weight Conversion', () => {
    test('70 kg → 154.32 lbs', () => {
      expect(kgToLbs(70)).toBeCloseTo(154.32, 0);
    });

    test('100 kg → 220.46 lbs', () => {
      expect(kgToLbs(100)).toBeCloseTo(220.46, 0);
    });

    test('160 lbs → 72.57 kg', () => {
      expect(lbsToKg(160)).toBeCloseTo(72.57, 0);
    });

    test('220 lbs → 99.79 kg', () => {
      expect(lbsToKg(220)).toBeCloseTo(99.79, 0);
    });

    test('Round-trip: kg → lbs → kg should be approximately same', () => {
      const original = 70;
      const converted = lbsToKg(kgToLbs(original));
      expect(converted).toBeCloseTo(original, 1);
    });

    test('0 kg → 0 lbs', () => {
      expect(kgToLbs(0)).toBe(0);
    });
  });

  // ── Rounding Utilities ───────────────────────────────────────────────────
  describe('Number Rounding', () => {
    test('roundTo1: 22.857 → 22.9', () => {
      expect(roundTo1(22.857)).toBe(22.9);
    });

    test('roundTo1: 18.499 → 18.5', () => {
      expect(roundTo1(18.499)).toBe(18.5);
    });

    test('roundTo2: 22.856 → 22.86', () => {
      expect(roundTo2(22.856)).toBe(22.86);
    });

    test('roundTo1 of integer should remain integer-like', () => {
      expect(roundTo1(25)).toBe(25);
    });
  });

  // ── Date Formatting ──────────────────────────────────────────────────────
  describe('Date Formatting', () => {
    test('formatDate returns non-empty string', () => {
      const formatted = formatDate(Date.now());
      expect(formatted.length).toBeGreaterThan(4);
    });

    test('formatDate includes year (4 digits)', () => {
      const formatted = formatDate(new Date('2024-06-15').getTime());
      expect(formatted).toContain('2024');
    });

    test('formatDate includes day number', () => {
      const formatted = formatDate(new Date('2024-06-15').getTime());
      expect(formatted).toContain('15');
    });

    test('formatDate includes month abbreviation', () => {
      const formatted = formatDate(new Date('2024-06-15').getTime());
      expect(formatted).toMatch(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/);
    });
  });

  // ── BMI String Formatting ────────────────────────────────────────────────
  describe('BMI String Formatting', () => {
    test('formatBmi produces correct label string', () => {
      expect(formatBmi(22.9)).toBe('BMI: 22.9 kg/m²');
    });

    test('formatBmi rounds correctly', () => {
      expect(formatBmi(19.53)).toBe('BMI: 19.5 kg/m²');
    });

    test('formatBmi of integer value', () => {
      expect(formatBmi(25)).toBe('BMI: 25 kg/m²');
    });
  });
});
