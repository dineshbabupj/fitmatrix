import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { REVENUECAT_KEYS, ENTITLEMENT_IDS } from './iapConfig';

export interface CustomerInfoState {
  activeEntitlements: string[];
  allPurchasedProductIds: string[];
  latestPurchaseDate: number | null;
}

class RevenueCatService {
  private isInitialized: boolean = false;

  /**
   * Initialize RevenueCat SDK
   * Call this once in your app's root component (e.g., App.tsx or _layout.tsx)
   */
  public async init(userId?: string): Promise<void> {
    if (this.isInitialized || Platform.OS === 'web') return;

    try {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);

      const apiKey = REVENUECAT_KEYS.apiKey;
      if (!apiKey) {
        console.warn('[RevenueCatService] No API key found. Skipping initialization.');
        return;
      }

      if (userId) {
        await Purchases.configure({ apiKey, appUserID: userId });
      } else {
        await Purchases.configure({ apiKey });
      }

      this.isInitialized = true;
      console.log('[RevenueCatService] Initialized successfully.');
    } catch (e) {
      console.warn('[RevenueCatService] Init skipped on non-native platform:', e);
    }
  }

  /**
   * Link RevenueCat to the authenticated user.
   * Call this after user signs in so purchases are tied to their account.
   */
  public async logIn(userId: string): Promise<void> {
    if (!this.isInitialized || Platform.OS === 'web') return;
    try {
      await Purchases.logIn(userId);
      console.log('[RevenueCatService] Logged in as user:', userId);
    } catch (e) {
      console.warn('[RevenueCatService] logIn failed:', e);
    }
  }

  /**
   * Unlink RevenueCat from current user.
   * Call this on logout to reset identity.
   */
  public async logOut(): Promise<void> {
    if (!this.isInitialized || Platform.OS === 'web') return;
    try {
      await Purchases.logOut();
      console.log('[RevenueCatService] Logged out.');
    } catch (e) {
      console.warn('[RevenueCatService] logOut failed:', e);
    }
  }

  /**
   * Fetch available offerings from RevenueCat dashboard
   */
  public async getOfferings(): Promise<PurchasesOffering | null> {
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current ?? null;
    } catch (error) {
      console.error('[RevenueCatService] Failed to fetch offerings:', error);
      return null;
    }
  }

  /**
   * Purchase a specific package from an offering
   */
  public async purchasePackage(
    pkg: PurchasesPackage
  ): Promise<{ success: boolean; customerInfo: CustomerInfoState }> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const info = this.mapCustomerInfo(customerInfo);
      console.log('[RevenueCatService] Purchase successful:', info);
      return { success: true, customerInfo: info };
    } catch (error: any) {
      if (error.userCancelled) {
        console.log('[RevenueCatService] User cancelled purchase.');
        return { success: false, customerInfo: this.getEmptyInfo() };
      }
      throw error;
    }
  }

  /**
   * Restore previous purchases (required by Apple & Google guidelines)
   */
  public async restorePurchases(): Promise<CustomerInfoState> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      const info = this.mapCustomerInfo(customerInfo);
      console.log('[RevenueCatService] Restored purchases:', info);
      return info;
    } catch (error) {
      console.error('[RevenueCatService] Restore failed:', error);
      throw error;
    }
  }

  /**
   * Check if a specific entitlement is currently active
   */
  public async isEntitlementActive(entitlementId: string): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return entitlementId in customerInfo.entitlements.active;
    } catch {
      return false;
    }
  }

  /**
   * Check if user has Pro access
   */
  public async hasProAccess(): Promise<boolean> {
    return this.isEntitlementActive(ENTITLEMENT_IDS.proAccess);
  }

  /**
   * Check if ads are removed
   */
  public async hasAdsRemoved(): Promise<boolean> {
    const pro = await this.isEntitlementActive(ENTITLEMENT_IDS.proAccess);
    const adsRemoved = await this.isEntitlementActive(ENTITLEMENT_IDS.adsRemoved);
    return pro || adsRemoved;
  }

  /**
   * Get current customer info
   */
  public async getCustomerInfo(): Promise<CustomerInfoState> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return this.mapCustomerInfo(customerInfo);
    } catch {
      return this.getEmptyInfo();
    }
  }

  private mapCustomerInfo(info: CustomerInfo): CustomerInfoState {
    return {
      activeEntitlements: Object.keys(info.entitlements.active),
      allPurchasedProductIds: info.allPurchasedProductIdentifiers,
      latestPurchaseDate: info.latestExpirationDate
        ? new Date(info.latestExpirationDate).getTime()
        : null,
    };
  }

  private getEmptyInfo(): CustomerInfoState {
    return {
      activeEntitlements: [],
      allPurchasedProductIds: [],
      latestPurchaseDate: null,
    };
  }
}

export const revenueCatService = new RevenueCatService();
