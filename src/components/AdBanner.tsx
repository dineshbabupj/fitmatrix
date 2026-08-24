import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ADMOB_UNITS, USE_PRODUCTION_ADS } from '../services/admob/adMobConfig';
import { theme } from '../theme/theme';
import { useUserStore } from '../store/userStore';
import { revenueCatService } from '../services/iap/revenueCatService';

let BannerAd: any;
let BannerAdSize: any;
let TestIds: any;

try {
  const admob = require('react-native-google-mobile-ads');
  BannerAd = admob.BannerAd;
  BannerAdSize = admob.BannerAdSize;
  TestIds = admob.TestIds;
} catch {
  // Expo Go fallback
}

export const AdBanner: React.FC = () => {
  const isPremium = useUserStore((state) => state.isPremium);
  const [adsRemoved, setAdsRemoved] = useState<boolean>(isPremium);
  const [adFailed, setAdFailed] = useState<boolean>(false);

  useEffect(() => {
    revenueCatService.hasAdsRemoved().then((removed) => {
      setAdsRemoved(removed || isPremium);
    });
  }, [isPremium]);

  // Completely hide banner for Pro / Ad-Free users
  if (adsRemoved || isPremium) {
    return null;
  }

  const adUnitId = USE_PRODUCTION_ADS && ADMOB_UNITS.banner
    ? ADMOB_UNITS.banner
    : (TestIds?.BANNER || 'ca-app-pub-3940256099942544/6300978111');

  if (BannerAd && BannerAdSize && !adFailed && Platform.OS !== 'web') {
    return (
      <View style={styles.adWrapper}>
        <View style={styles.badgeRow}>
          <View style={styles.adBadge}>
            <Text style={styles.adBadgeText}>Ad</Text>
          </View>
          <Text style={styles.adTitle}>Sponsored</Text>
        </View>
        <BannerAd
          unitId={adUnitId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER || BannerAdSize.BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
          onAdFailedToLoad={(error: any) => {
            console.log('[AdBanner] Failed to load AdMob banner:', error);
            setAdFailed(true);
          }}
        />
      </View>
    );
  }

  // Fallback visual sponsor banner for Expo Go or when offline
  return (
    <View style={styles.container}>
      <View style={styles.badgeRow}>
        <View style={styles.adBadge}>
          <Text style={styles.adBadgeText}>Ad</Text>
        </View>
        <Text style={styles.adTitle}>Sponsor — FitMetrics Health Partner</Text>
      </View>

      <View style={styles.bannerContent}>
        <Ionicons name="fitness-outline" size={24} color={theme.colors.dark.primary} />
        <View style={styles.bannerTextGroup}>
          <Text style={styles.bannerHeading}>Track Your Workouts with Precision</Text>
          <Text style={styles.bannerSub}>
            {USE_PRODUCTION_ADS ? 'Google AdMob' : 'Google AdMob Test Unit'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  adWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.spacing.sm,
    backgroundColor: theme.colors.dark.surface,
    paddingVertical: 8,
    borderRadius: theme.shapes.medium,
  },
  container: {
    backgroundColor: theme.colors.dark.surface,
    borderWidth: 1,
    borderColor: theme.colors.dark.surfaceVariant,
    borderRadius: theme.shapes.large,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  adBadge: {
    backgroundColor: '#FFB74D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adBadgeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '800',
  },
  adTitle: {
    fontSize: 11,
    color: theme.colors.dark.onSurfaceVariant,
    fontWeight: '600',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.dark.surfaceVariant,
    padding: theme.spacing.md,
    borderRadius: theme.shapes.medium,
    gap: 12,
  },
  bannerTextGroup: {
    flex: 1,
  },
  bannerHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.dark.onSurface,
  },
  bannerSub: {
    fontSize: 10,
    color: theme.colors.dark.outline,
    marginTop: 2,
  },
});
