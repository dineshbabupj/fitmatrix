/**
 * FitMetrics Health Service
 * Unified bridge for:
 *   - Option 1: expo-sensors Pedometer (Phone built-in step counter)
 *   - Option 2: Google Fit API via react-native-google-fit (background sync)
 *
 * Falls back gracefully in Expo Go (no native support).
 */
import { Platform } from 'react-native';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface StepData {
  steps: number;
  source: 'pedometer' | 'google_fit' | 'mock';
}

export interface HealthServiceSubscription {
  remove: () => void;
}

// ─── Pedometer (Option 1 — expo-sensors) ────────────────────────────────────

let Pedometer: any = null;
try {
  Pedometer = require('expo-sensors').Pedometer;
} catch {
  console.warn('[HealthService] expo-sensors not available');
}

// ─── Google Fit (Option 2 — react-native-google-fit) ────────────────────────
// NOTE: react-native-google-fit needs to be installed separately with EAS build.
// We lazy-load it so the app doesn't crash in Expo Go.

let GoogleFit: any = null;
let Scopes: any = null;
try {
  const gf = require('react-native-google-fit');
  GoogleFit = gf.default;
  Scopes = gf.Scopes;
} catch {
  // Not installed yet — will be added at EAS build time
}

// ─── Health Service Class ────────────────────────────────────────────────────

class HealthService {
  private subscription: HealthServiceSubscription | null = null;

  /**
   * Option 1: Subscribe to live step count from phone's built-in pedometer.
   * Fires callback every time step count changes.
   * Requires ACTIVITY_RECOGNITION permission on Android.
   */
  async subscribeToSteps(
    onStepUpdate: (data: StepData) => void
  ): Promise<HealthServiceSubscription | null> {
    // Clear any existing subscription
    this.unsubscribe();

    if (!Pedometer) {
      console.warn('[HealthService] Pedometer not available (Expo Go). Using mock data.');
      onStepUpdate({ steps: 0, source: 'mock' });
      return null;
    }

    try {
      const isAvailable = await Pedometer.isAvailableAsync();
      if (!isAvailable) {
        console.warn('[HealthService] Pedometer not available on this device.');
        return null;
      }

      // Check permission
      const { status } = await Pedometer.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('[HealthService] Pedometer permission denied.');
        return null;
      }

      // Subscribe to live updates
      this.subscription = Pedometer.watchStepCount((result: { steps: number }) => {
        onStepUpdate({ steps: result.steps, source: 'pedometer' });
      });

      return this.subscription;
    } catch (error) {
      console.error('[HealthService] Pedometer subscription error:', error);
      return null;
    }
  }

  /**
   * Get today's total step count via Pedometer (since midnight).
   */
  async getTodaySteps(): Promise<StepData> {
    if (!Pedometer) {
      return { steps: 0, source: 'mock' };
    }

    try {
      const isAvailable = await Pedometer.isAvailableAsync();
      if (!isAvailable) return { steps: 0, source: 'pedometer' };

      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();

      const result = await Pedometer.getStepCountAsync(start, end);
      return { steps: result.steps, source: 'pedometer' };
    } catch (error) {
      console.error('[HealthService] getTodaySteps error:', error);
      return { steps: 0, source: 'pedometer' };
    }
  }

  /**
   * Option 2: Authorize and fetch steps from Google Fit.
   * This pulls data synced from Wear OS, Mi Band, Fitbit, etc.
   * Requires react-native-google-fit package + EAS build.
   */
  async getStepsFromGoogleFit(): Promise<StepData> {
    if (!GoogleFit || Platform.OS !== 'android') {
      console.warn('[HealthService] Google Fit not available.');
      return { steps: 0, source: 'google_fit' };
    }

    try {
      // Authorize
      const authResult = await GoogleFit.authorize({
        scopes: [Scopes.FITNESS_ACTIVITY_READ],
      });

      if (!authResult.success) {
        console.warn('[HealthService] Google Fit authorization failed.');
        return { steps: 0, source: 'google_fit' };
      }

      // Fetch today's steps
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);

      const options = {
        startDate: startOfDay.toISOString(),
        endDate: today.toISOString(),
        bucketUnit: 'DAY',
        bucketInterval: 1,
      };

      const result = await GoogleFit.getDailyStepCountSamples(options);
      
      // Find estimated steps (combines all sources)
      const estimatedSource = result.find(
        (s: any) => s.source === 'com.google.android.gms:estimated_steps'
      );
      
      const steps = estimatedSource?.steps?.[0]?.value ?? 0;
      return { steps, source: 'google_fit' };
    } catch (error) {
      console.error('[HealthService] Google Fit fetch error:', error);
      return { steps: 0, source: 'google_fit' };
    }
  }

  /**
   * Smart fetch: Try Google Fit first (richer data from gadgets),
   * fallback to phone pedometer.
   */
  async getStepsBestSource(): Promise<StepData> {
    // Try Google Fit first (has gadget data)
    if (GoogleFit && Platform.OS === 'android') {
      const fitData = await this.getStepsFromGoogleFit();
      if (fitData.steps > 0) return fitData;
    }

    // Fallback to device pedometer
    return this.getTodaySteps();
  }

  /**
   * Unsubscribe from live step updates.
   */
  unsubscribe() {
    this.subscription?.remove();
    this.subscription = null;
  }
}

export const healthService = new HealthService();
