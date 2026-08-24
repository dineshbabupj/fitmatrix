import { Platform } from 'react-native';
import { AD_CONFIG, ADMOB_UNITS } from './adMobConfig';
import { revenueCatService } from '../iap/revenueCatService';

let MobileAds: any;
let InterstitialAd: any;
let RewardedAd: any;
let AdEventType: any;
let RewardedAdEventType: any;

try {
  const admobModule = require('react-native-google-mobile-ads');
  MobileAds = admobModule.default;
  InterstitialAd = admobModule.InterstitialAd;
  RewardedAd = admobModule.RewardedAd;
  AdEventType = admobModule.AdEventType;
  RewardedAdEventType = admobModule.RewardedAdEventType;
} catch {
  console.warn('[AdMobManager] react-native-google-mobile-ads not available (Expo Go mode).');
}

class AdMobManager {
  private calculationCount: number = 0;
  private interstitialTimestamps: number[] = [];
  private isInitialized: boolean = false;
  private interstitialAd: any = null;
  private premiumFeatureUnlocked: boolean = false;

  public isPremiumFeatureUnlocked(): boolean {
    return this.premiumFeatureUnlocked;
  }

  public setPremiumFeatureUnlocked(unlocked: boolean): void {
    this.premiumFeatureUnlocked = unlocked;
  }

  /**
   * Initialize the Mobile Ads SDK
   */
  public async init(): Promise<void> {
    if (this.isInitialized || !MobileAds) return;

    try {
      await MobileAds().initialize();
      this.isInitialized = true;
      this.preloadInterstitial();
      console.log('[AdMobManager] Initialized successfully.');
    } catch (error) {
      console.warn('[AdMobManager] Init failed:', error);
    }
  }

  /**
   * Preload the next interstitial ad for instant display
   */
  private preloadInterstitial(): void {
    if (!InterstitialAd || !ADMOB_UNITS.interstitial) return;

    this.interstitialAd = InterstitialAd.createForAdRequest(ADMOB_UNITS.interstitial);

    this.interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
      console.log('[AdMobManager] Interstitial preloaded.');
    });

    this.interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
      // Preload the next one after the current one closes
      this.preloadInterstitial();
    });

    this.interstitialAd.load();
  }

  /**
   * Check if frequency capping allows showing an interstitial
   */
  public canShowInterstitial(): boolean {
    const now = Date.now();
    this.interstitialTimestamps = this.interstitialTimestamps.filter(
      (ts) => now - ts < AD_CONFIG.oneHourInMs
    );
    return this.interstitialTimestamps.length < AD_CONFIG.maxInterstitialsPerHour;
  }

  /**
   * Called on every valid calculation. Shows interstitial per frequency config.
   */
  public async registerCalculation(): Promise<void> {
    // Skip ads entirely for premium users
    const adsRemoved = await revenueCatService.hasAdsRemoved();
    if (adsRemoved) return;

    this.calculationCount += 1;

    if (this.calculationCount % AD_CONFIG.interstitialFrequency === 0) {
      if (this.canShowInterstitial()) {
        this.showInterstitialAd();
      }
    }
  }

  /**
   * Display preloaded interstitial ad
   */
  public showInterstitialAd(): void {
    if (this.interstitialAd?.loaded) {
      this.interstitialTimestamps.push(Date.now());
      this.interstitialAd.show();
    }
    // In production: silently skip if ad not loaded (no ugly Alert fallback)
  }

  /**
   * Show rewarded ad to unlock premium feature for this session
   */
  public showRewardedAd(onSuccess: () => void): void {
    if (!RewardedAd || !ADMOB_UNITS.rewarded) {
      // Ads not available (Expo Go or ad load failure) — do NOT auto-reward
      // User must watch an ad to unlock premium features
      console.warn('[AdMobManager] Rewarded ads not available. User must watch ad to unlock premium.');
      return;
    }

    const rewarded = RewardedAd.createForAdRequest(ADMOB_UNITS.rewarded);
    rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      this.premiumFeatureUnlocked = true;
      console.log('[AdMobManager] Reward earned — premium feature unlocked for this session.');
      onSuccess();
    });
    rewarded.addAdEventListener(AdEventType.LOADED, () => rewarded.show());
    rewarded.load();
  }

  public getCalculationCount(): number {
    return this.calculationCount;
  }

  public getHourlyAdCount(): number {
    const now = Date.now();
    return this.interstitialTimestamps.filter((ts) => now - ts < AD_CONFIG.oneHourInMs).length;
  }
}

export const adMobManager = new AdMobManager();
