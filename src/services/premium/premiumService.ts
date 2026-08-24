import AsyncStorage from '@react-native-async-storage/async-storage';
import { revenueCatService } from '../iap/revenueCatService';
import { useUserStore } from '../../store/userStore';

export type PremiumFeature =
  | 'barcode_scanner'
  | 'ai_coach'
  | 'advanced_charts'
  | 'pdf_export'
  | 'ad_free'
  | 'muscle_heatmap';

export interface PremiumConfig {
  freeDailyBarcodeScans: number;
}

export const PREMIUM_CONFIG: PremiumConfig = {
  freeDailyBarcodeScans: 3, // Free users get 3 free scans per day to experience the feature
};

class PremiumService {
  private scanStorageKeyPrefix = 'fitmetrics_daily_scans_';

  /**
   * Sync active subscription entitlements from RevenueCat to Zustand UserStore
   */
  public async syncEntitlements(): Promise<boolean> {
    try {
      const isPro = await revenueCatService.hasProAccess();
      useUserStore.getState().setPremiumStatus(isPro);
      return isPro;
    } catch (e) {
      console.warn('[PremiumService] Failed to sync entitlements:', e);
      return useUserStore.getState().isPremium;
    }
  }

  /**
   * Check if a specific feature is available for the current user
   */
  public async canAccessFeature(feature: PremiumFeature): Promise<{ allowed: boolean; reason?: string }> {
    const isPro = useUserStore.getState().isPremium || (await revenueCatService.hasProAccess());

    if (isPro) {
      return { allowed: true };
    }

    switch (feature) {
      case 'ad_free': {
        const adsRemoved = await revenueCatService.hasAdsRemoved();
        return {
          allowed: adsRemoved,
          reason: adsRemoved ? undefined : 'Remove ads with Pro or Lifetime Ad-Free pass.',
        };
      }

      case 'barcode_scanner': {
        const todayScans = await this.getTodayScanCount();
        if (todayScans < PREMIUM_CONFIG.freeDailyBarcodeScans) {
          return { allowed: true };
        }
        return {
          allowed: false,
          reason: `Daily free limit reached (${PREMIUM_CONFIG.freeDailyBarcodeScans}/${PREMIUM_CONFIG.freeDailyBarcodeScans}). Upgrade to Pro for unlimited barcode scanning.`,
        };
      }

      case 'ai_coach':
      case 'advanced_charts':
      case 'pdf_export':
      case 'muscle_heatmap':
      default:
        return {
          allowed: false,
          reason: 'This feature is exclusive to FitMetrics Pro members.',
        };
    }
  }

  /**
   * Track a barcode scan for free users
   */
  public async registerBarcodeScan(): Promise<number> {
    const isPro = useUserStore.getState().isPremium;
    if (isPro) return 0;

    const todayKey = this.getTodayStorageKey();
    const current = await this.getTodayScanCount();
    const updated = current + 1;
    await AsyncStorage.setItem(todayKey, updated.toString());
    return updated;
  }

  /**
   * Get remaining barcode scans today for free user
   */
  public async getRemainingScansToday(): Promise<number> {
    const isPro = useUserStore.getState().isPremium;
    if (isPro) return 999;

    const count = await this.getTodayScanCount();
    return Math.max(0, PREMIUM_CONFIG.freeDailyBarcodeScans - count);
  }

  private async getTodayScanCount(): Promise<number> {
    try {
      const todayKey = this.getTodayStorageKey();
      const val = await AsyncStorage.getItem(todayKey);
      return val ? parseInt(val, 10) : 0;
    } catch {
      return 0;
    }
  }

  private getTodayStorageKey(): string {
    const dateStr = new Date().toISOString().split('T')[0];
    return `${this.scanStorageKeyPrefix}${dateStr}`;
  }
}

export const premiumService = new PremiumService();
