import { Platform } from 'react-native';

export const REVENUECAT_KEYS = {
  apiKey: Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || 'appl_FitMetricsDemoIosKey2026',
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || 'goog_FitMetricsDemoAndroidKey2026',
    default: 'goog_FitMetricsDemoAndroidKey2026',
  }),
};

export const IAP_PRODUCT_IDS = {
  removeAds: 'remove_ads',
  premiumMonthly: 'premium_monthly',
  premiumYearly: 'premium_yearly',
};

export const ENTITLEMENT_IDS = {
  proAccess: 'pro_access',
  adsRemoved: 'ads_removed',
};

export interface IAPProduct {
  id: string;
  type: 'non_consumable' | 'subscription';
  title: string;
  price: string;
  priceAmount: number;
  period?: string;
  savingsBadge?: string;
  description: string;
}

export const PRODUCT_DETAILS: Record<string, IAPProduct> = {
  [IAP_PRODUCT_IDS.removeAds]: {
    id: IAP_PRODUCT_IDS.removeAds,
    type: 'non_consumable',
    title: 'Remove All Ads',
    price: '$4.99',
    priceAmount: 4.99,
    description: 'Lifetime ad-free experience across all screens.',
  },
  [IAP_PRODUCT_IDS.premiumMonthly]: {
    id: IAP_PRODUCT_IDS.premiumMonthly,
    type: 'subscription',
    title: 'FitMetrics Pro (Monthly)',
    price: '$2.99',
    priceAmount: 2.99,
    period: '/month',
    description: 'Unlock advanced trend charts, PDF export, & custom themes.',
  },
  [IAP_PRODUCT_IDS.premiumYearly]: {
    id: IAP_PRODUCT_IDS.premiumYearly,
    type: 'subscription',
    title: 'FitMetrics Pro (Yearly)',
    price: '$19.99',
    priceAmount: 19.99,
    period: '/year',
    savingsBadge: 'SAVE 44%',
    description: 'Best Value! Full access to all pro features for a whole year.',
  },
};
