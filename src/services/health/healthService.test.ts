/**
 * Unit tests for HealthService
 * Tests: pedometer path, Google Fit path, getStepsBestSource fallback logic
 */
import { healthService } from './healthService';

// ─── Mock expo-sensors Pedometer ─────────────────────────────────────────────
const mockIsAvailable = jest.fn().mockResolvedValue(true);
const mockRequestPermissions = jest.fn().mockResolvedValue({ status: 'granted' });
const mockGetStepCount = jest.fn().mockResolvedValue({ steps: 5000 });
const mockWatchStepCount = jest.fn().mockReturnValue({ remove: jest.fn() });

jest.mock('expo-sensors', () => ({
  Pedometer: {
    isAvailableAsync: mockIsAvailable,
    requestPermissionsAsync: mockRequestPermissions,
    getStepCountAsync: mockGetStepCount,
    watchStepCount: mockWatchStepCount,
  },
}));

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('HealthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    healthService.unsubscribe();
  });

  // ─── getTodaySteps ──────────────────────────────────────────────────────────

  describe('getTodaySteps()', () => {
    it('should return steps from pedometer when available', async () => {
      // Arrange
      mockIsAvailable.mockResolvedValue(true);
      mockGetStepCount.mockResolvedValue({ steps: 7500 });

      // Act
      const result = await healthService.getTodaySteps();

      // Assert
      expect(result.steps).toBe(7500);
      expect(result.source).toBe('pedometer');
    });

    it('should return 0 when pedometer is not available', async () => {
      // Arrange
      mockIsAvailable.mockResolvedValue(false);

      // Act
      const result = await healthService.getTodaySteps();

      // Assert
      expect(result.steps).toBe(0);
      expect(result.source).toBe('pedometer');
    });

    it('should handle errors gracefully and return 0', async () => {
      // Arrange
      mockIsAvailable.mockRejectedValue(new Error('Sensor crash'));

      // Act
      const result = await healthService.getTodaySteps();

      // Assert
      expect(result.steps).toBe(0);
      expect(result.source).toBe('pedometer');
    });
  });

  // ─── subscribeToSteps ───────────────────────────────────────────────────────

  describe('subscribeToSteps()', () => {
    it('should call callback with step count on subscription', async () => {
      // Arrange
      const onStepUpdate = jest.fn();
      mockIsAvailable.mockResolvedValue(true);
      mockRequestPermissions.mockResolvedValue({ status: 'granted' });

      // Simulate pedometer firing immediately
      mockWatchStepCount.mockImplementation((cb: any) => {
        cb({ steps: 1234 });
        return { remove: jest.fn() };
      });

      // Act
      await healthService.subscribeToSteps(onStepUpdate);

      // Assert
      expect(onStepUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ steps: 1234, source: 'pedometer' })
      );
    });

    it('should return null and use mock when pedometer is unavailable', async () => {
      // Arrange
      mockIsAvailable.mockResolvedValue(false);
      const onStepUpdate = jest.fn();

      // Act
      const sub = await healthService.subscribeToSteps(onStepUpdate);

      // Assert
      expect(sub).toBeNull();
    });

    it('should return null when permission denied', async () => {
      // Arrange
      mockIsAvailable.mockResolvedValue(true);
      mockRequestPermissions.mockResolvedValue({ status: 'denied' });
      const onStepUpdate = jest.fn();

      // Act
      const sub = await healthService.subscribeToSteps(onStepUpdate);

      // Assert
      expect(sub).toBeNull();
    });
  });

  // ─── getStepsBestSource ─────────────────────────────────────────────────────

  describe('getStepsBestSource()', () => {
    it('should fallback to pedometer when Google Fit is not installed', async () => {
      // Arrange
      mockIsAvailable.mockResolvedValue(true);
      mockGetStepCount.mockResolvedValue({ steps: 8200 });

      // Act — Google Fit module is not mocked so it falls through to pedometer
      const result = await healthService.getStepsBestSource();

      // Assert
      expect(result.steps).toBe(8200);
      expect(result.source).toBe('pedometer');
    });
  });
});

// ─── foodStore tests ─────────────────────────────────────────────────────────

describe('OpenFoodFactsService (unit)', () => {
  it('should return null for a bad barcode', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ status: 0, product: null }),
    }) as any;

    const { OpenFoodFactsService } = require('../openFoodFacts');
    const result = await OpenFoodFactsService.getProductByBarcode('00000000000');
    expect(result).toBeNull();
  });

  it('should parse product correctly', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        status: 1,
        product: {
          product_name: 'Test Oats',
          brands: 'TestBrand',
          image_url: 'http://example.com/img.jpg',
          nutriments: {
            'energy-kcal_serving': 300,
            proteins_serving: 10,
            carbohydrates_serving: 50,
            fat_serving: 5,
          },
        },
      }),
    }) as any;

    const { OpenFoodFactsService } = require('../openFoodFacts');
    const result = await OpenFoodFactsService.getProductByBarcode('1234567890123');

    expect(result).not.toBeNull();
    expect(result?.name).toBe('Test Oats');
    expect(result?.nutrition.calories).toBe(300);
    expect(result?.nutrition.protein).toBe(10);
  });
});
