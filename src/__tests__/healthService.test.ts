/**
 * Unit tests for HealthService + OpenFoodFactsService
 * NOTE: Pedometer is lazy-required inside healthService, so we mock the module
 * and re-require the service in beforeEach to pick up fresh mocks.
 */

const mockIsAvailableAsync = jest.fn();
const mockRequestPermissionsAsync = jest.fn();
const mockGetStepCountAsync = jest.fn();
const mockWatchStepCount = jest.fn();

jest.mock('expo-sensors', () => ({
  Pedometer: {
    isAvailableAsync: mockIsAvailableAsync,
    requestPermissionsAsync: mockRequestPermissionsAsync,
    getStepCountAsync: mockGetStepCountAsync,
    watchStepCount: mockWatchStepCount,
  },
}));

import { OpenFoodFactsService } from '../services/openFoodFacts';

// We need a fresh import of healthService each time because Pedometer is lazy-required
let healthService: typeof import('../services/health/healthService').healthService;

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
  // Re-import to ensure mocks are applied
  const mod = require('../services/health/healthService');
  healthService = mod.healthService;
});

afterEach(() => {
  healthService?.unsubscribe();
});

// ─── HealthService Tests ──────────────────────────────────────────────────────

describe('HealthService — Pedometer (Option 1)', () => {
  it('returns steps from pedometer when available', async () => {
    mockIsAvailableAsync.mockResolvedValue(true);
    mockRequestPermissionsAsync.mockResolvedValue({ status: 'granted' });
    mockGetStepCountAsync.mockResolvedValue({ steps: 7500 });

    const result = await healthService.getTodaySteps();

    expect(result.steps).toBe(7500);
    expect(result.source).toBe('pedometer');
  });

  it('returns 0 when pedometer not available on device', async () => {
    mockIsAvailableAsync.mockResolvedValue(false);

    const result = await healthService.getTodaySteps();

    expect(result.steps).toBe(0);
  });

  it('handles sensor crash gracefully — returns 0', async () => {
    mockIsAvailableAsync.mockRejectedValue(new Error('Sensor crash'));

    const result = await healthService.getTodaySteps();

    expect(result.steps).toBe(0);
  });

  it('returns null subscription when permission denied', async () => {
    mockIsAvailableAsync.mockResolvedValue(true);
    mockRequestPermissionsAsync.mockResolvedValue({ status: 'denied' });

    const sub = await healthService.subscribeToSteps(jest.fn());

    expect(sub).toBeNull();
  });

  it('calls onStepUpdate callback with step count on subscribe', async () => {
    mockIsAvailableAsync.mockResolvedValue(true);
    mockRequestPermissionsAsync.mockResolvedValue({ status: 'granted' });
    mockWatchStepCount.mockImplementation((cb: any) => {
      cb({ steps: 3000 });
      return { remove: jest.fn() };
    });

    const onUpdate = jest.fn();
    await healthService.subscribeToSteps(onUpdate);

    expect(onUpdate).toHaveBeenCalledWith({ steps: 3000, source: 'pedometer' });
  });

  it('getStepsBestSource falls back to pedometer when Google Fit unavailable', async () => {
    mockIsAvailableAsync.mockResolvedValue(true);
    mockRequestPermissionsAsync.mockResolvedValue({ status: 'granted' });
    mockGetStepCountAsync.mockResolvedValue({ steps: 9100 });

    const result = await healthService.getStepsBestSource();

    expect(result.steps).toBe(9100);
    expect(result.source).toBe('pedometer');
  });
});

// ─── OpenFoodFactsService Tests ───────────────────────────────────────────────

describe('OpenFoodFactsService', () => {
  it('returns null for unknown barcode (status=0)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ status: 0, product: null }),
    }) as any;

    const result = await OpenFoodFactsService.getProductByBarcode('00000000000');
    expect(result).toBeNull();
  });

  it('parses product name and nutrition correctly', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        status: 1,
        product: {
          product_name: 'Test Protein Bar',
          brands: 'TestBrand',
          image_url: '',
          nutriments: {
            'energy-kcal_serving': 250,
            proteins_serving: 20,
            carbohydrates_serving: 30,
            fat_serving: 8,
          },
        },
      }),
    }) as any;

    const result = await OpenFoodFactsService.getProductByBarcode('12345');

    expect(result?.name).toBe('Test Protein Bar');
    expect(result?.nutrition.calories).toBe(250);
    expect(result?.nutrition.protein).toBe(20);
    expect(result?.nutrition.carbs).toBe(30);
    expect(result?.nutrition.fat).toBe(8);
  });

  it('falls back to per-100g when per-serving data is missing', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        status: 1,
        product: {
          product_name: 'Oats',
          brands: 'Brand',
          image_url: '',
          nutriments: {
            'energy-kcal_100g': 380,
            proteins_100g: 13,
            carbohydrates_100g: 68,
            fat_100g: 7,
          },
        },
      }),
    }) as any;

    const result = await OpenFoodFactsService.getProductByBarcode('99999');

    expect(result?.nutrition.calories).toBe(380);
    expect(result?.nutrition.protein).toBe(13);
  });

  it('handles network error gracefully — returns null', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as any;

    const result = await OpenFoodFactsService.getProductByBarcode('12345');

    expect(result).toBeNull();
  });
});
