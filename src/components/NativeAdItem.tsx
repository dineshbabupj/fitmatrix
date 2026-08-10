import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

export const NativeAdItem: React.FC = () => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.adBadge}>
          <Text style={styles.adBadgeText}>Ad</Text>
        </View>
        <Text style={styles.sponsorName}>Sponsored Result</Text>
      </View>

      <View style={styles.body}>
        <Ionicons name="nutrition-outline" size={32} color={theme.colors.dark.secondary} />
        <View style={styles.info}>
          <Text style={styles.title}>Personalized Nutrition & Meal Plans</Text>
          <Text style={styles.desc}>Achieve your weight goals 2x faster with tailored macros.</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.8}>
        <Text style={styles.ctaText}>Learn More</Text>
        <Ionicons name="open-outline" size={14} color={theme.colors.dark.onPrimary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.dark.surface,
    borderRadius: theme.shapes.large,
    padding: theme.spacing.lg,
    marginVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.dark.secondaryContainer,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: theme.spacing.sm,
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
  sponsorName: {
    fontSize: 11,
    color: theme.colors.dark.onSurfaceVariant,
    fontWeight: '600',
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.dark.onSurface,
  },
  desc: {
    fontSize: 12,
    color: theme.colors.dark.onSurfaceVariant,
    marginTop: 2,
  },
  ctaBtn: {
    backgroundColor: theme.colors.dark.secondary,
    paddingVertical: 8,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  ctaText: {
    color: theme.colors.dark.onPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
});
