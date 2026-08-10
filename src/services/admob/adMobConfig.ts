import { Platform } from 'react-native';

// Toggle between test ads and production ads
export const USE_PRODUCTION_ADS = true;

// Google Official AdMob Test Ad Unit IDs (for development)
export const ADMOB_TEST_UNITS = {
  banner: Platform.select({
    ios: 'ca-app-pub-3940256099942544/2934735716',
    android: 'ca-app-pub-3940256099942544/6300978111',
    default: 'ca-app-pub-3940256099942544/6300978111',
  }),
  interstitial: Platform.select({
    ios: 'ca-app-pub-3940256099942544/4411468910',
    android: 'ca-app-pub-3940256099942544/1033173712',
    default: 'ca-app-pub-3940256099942544/1033173712',
  }),
  rewarded: Platform.select({
    ios: 'ca-app-pub-3940256099942544/1712485313',
    android: 'ca-app-pub-3940256099942544/5224354917',
    default: 'ca-app-pub-3940256099942544/5224354917',
  }),
  native: Platform.select({
    ios: 'ca-app-pub-3940256099942544/3986624511',
    android: 'ca-app-pub-3940256099942544/2247696110',
    default: 'ca-app-pub-3940256099942544/2247696110',
  }),
};

// Production AdMob Ad Unit IDs provided by User
export const ADMOB_PROD_UNITS = {
  banner: 'ca-app-pub-4795933061687216/2085128193',
  interstitial: 'ca-app-pub-4795933061687216/6215944892',
};

// Active Ad Unit IDs based on environment
export const ADMOB_UNITS = {
  banner: USE_PRODUCTION_ADS ? ADMOB_PROD_UNITS.banner : ADMOB_TEST_UNITS.banner,
  interstitial: USE_PRODUCTION_ADS ? ADMOB_PROD_UNITS.interstitial : ADMOB_TEST_UNITS.interstitial,
};

export const AD_CONFIG = {
  interstitialFrequency: 3, // Show interstitial every 3 calculations
  maxInterstitialsPerHour: 5, // Frequency capping: max 5 interstitials per hour
  oneHourInMs: 60 * 60 * 1000,
  nativeAdInterval: 5, // Show native ad every 5 history items
};
