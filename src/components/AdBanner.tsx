import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ADMOB_UNITS, USE_PRODUCTION_ADS } from '../services/admob/adMobConfig';
import { theme } from '../theme/theme';

export const AdBanner: React.FC = () => {
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
            {USE_PRODUCTION_ADS ? 'Google AdMob' : 'Google AdMob Test Unit'} • {ADMOB_UNITS.banner?.slice(0, 25)}...
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
