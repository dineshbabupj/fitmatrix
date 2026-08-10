import { AD_CONFIG, ADMOB_UNITS, USE_PRODUCTION_ADS } from './adMobConfig';
import { Alert } from 'react-native';

class AdMobManager {
  private calculationCount: number = 0;
  private interstitialTimestamps: number[] = [];
  private isPremiumUnlocked: boolean = false;

  /**
   * Check if frequency capping allows showing an interstitial ad (Max 5 per hour)
   */
  public canShowInterstitial(): boolean {
    const now = Date.now();
    // Filter timestamps within the last 1 hour
    this.interstitialTimestamps = this.interstitialTimestamps.filter(
      (ts) => now - ts < AD_CONFIG.oneHourInMs
    );

    return this.interstitialTimestamps.length < AD_CONFIG.maxInterstitialsPerHour;
  }

  /**
   * Called on every valid calculation performed in FitMetrics
   */
  public registerCalculation(): void {
    this.calculationCount += 1;
    console.log(`[AdMobManager] Calculation count: ${this.calculationCount}`);

    // Every 3 calculations, trigger Interstitial Ad if cap permits
    if (this.calculationCount % AD_CONFIG.interstitialFrequency === 0) {
      if (this.canShowInterstitial()) {
        this.showInterstitialAd();
      } else {
        console.log('[AdMobManager] Frequency cap reached (Max 5 per hour). Skipping interstitial.');
      }
    }
  }

  /**
   * Display Interstitial Ad
   */
  public showInterstitialAd(): void {
    const now = Date.now();
    this.interstitialTimestamps.push(now);
    console.log(`[AdMobManager] Presenting Interstitial Ad (Unit: ${ADMOB_UNITS.interstitial})`);

    // AdMob Compliance Alert / Simulation
    const title = USE_PRODUCTION_ADS ? 'Google AdMob Ad' : 'AdMob Interstitial Ad [Test Mode]';
    Alert.alert(
      title,
      'FitMetrics sponsor message. Tap Close to continue.',
      [{ text: 'Close Ad', style: 'default' }],
      { cancelable: true }
    );
  }

  /**
   * Present Rewarded Ad to unlock premium charts / analytics
   */
  public showRewardedAd(onSuccess: () => void): void {
    Alert.alert(
      'Watch Rewarded Video Ad',
      'Watch a 15-second sponsor video to unlock Premium Advanced Analytics?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Watch Video & Unlock',
          onPress: () => {
            this.isPremiumUnlocked = true;
            console.log('[AdMobManager] Rewarded Ad completed. Unlocking premium chart.');
            Alert.alert('Reward Unlocked! 🎉', 'Premium Analytics features unlocked for this session.');
            onSuccess();
          },
        },
      ]
    );
  }

  public isPremiumFeatureUnlocked(): boolean {
    return this.isPremiumUnlocked;
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
