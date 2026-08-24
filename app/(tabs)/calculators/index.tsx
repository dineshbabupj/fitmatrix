import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../src/theme/theme';

export default function CalculatorsHubScreen() {
  const premiumFeatures = [
    {
      id: 'meal-planner',
      title: 'AI Meal Planner',
      subtitle: 'Personalized Nutrition Plans',
      description: 'Generates customized 7-day meal plans matching calorie limits and dietary options.',
      icon: 'restaurant-outline' as const,
      route: '/meal-planner' as const,
      color: '#4CAF50',
      tag: 'Pro AI',
    },
    {
      id: 'symptom-checker',
      title: 'AI Symptom Checker',
      subtitle: 'Symptom Triage Coach',
      description: 'Provides symptom risk evaluation via Gemini AI or step-by-step triage offline matrix.',
      icon: 'medkit-outline' as const,
      route: '/symptom-checker' as const,
      color: '#FB8C00',
      tag: 'Pro AI',
    },
    {
      id: 'text-logger',
      title: 'Text Macro Logger',
      subtitle: 'Natural Language Logger',
      description: 'Parses raw multi-line grocery lists or ingredients directly into estimated nutrition macros.',
      icon: 'journal-outline' as const,
      route: '/text-logger' as const,
      color: '#00BCD4',
      tag: 'Pro Tool',
    },
    {
      id: 'safety-scanner',
      title: 'Allergen & Safety Scanner',
      subtitle: 'Barcode Risk Detector',
      description: 'Scans grocery barcodes to check for food safety warnings, artificial additives, and allergens.',
      icon: 'scan-outline' as const,
      route: '/safety-scanner' as const,
      color: '#E53935',
      tag: 'Pro Scanner',
    },
    {
      id: 'alternative-advisor',
      title: 'Supermarket Alternatives',
      subtitle: 'Nutri-Score Substitutes',
      description: 'Queries similar products in the same food category to suggest healthier substitutes.',
      icon: 'swap-horizontal-outline' as const,
      route: '/alternative-advisor' as const,
      color: '#9C27B0',
      tag: 'Pro Guide',
    },
  ];

  const calculators = [
    {
      id: 'bmi',
      title: 'BMI Calculator',
      subtitle: 'Body Mass Index & Health Categories',
      description: 'Calculates ratio of weight to height and classifies into Underweight, Normal, Overweight, or Obese.',
      icon: 'body-outline' as const,
      route: '/calculators/bmi' as const,
      color: '#4CAF50',
      tag: 'Most Popular',
    },
    {
      id: 'bmr',
      title: 'BMR Calculator',
      subtitle: 'Basal Metabolic Rate & TDEE',
      description: 'Estimates daily calories burned at complete rest and computes TDEE based on activity levels.',
      icon: 'flame-outline' as const,
      route: '/calculators/bmr' as const,
      color: '#FF9800',
      tag: 'Nutrition',
    },
    {
      id: 'body-fat',
      title: 'Body Fat Calculator',
      subtitle: 'US Navy Body Fat Percentage',
      description: 'Estimates body fat percentage based on waist, neck, and hip measurements.',
      icon: 'fitness-outline' as const,
      route: '/calculators/body-fat' as const,
      color: '#00BCD4',
      tag: 'Composition',
    },
    {
      id: 'ideal-weight',
      title: 'Ideal Weight Calculator',
      subtitle: 'Target Weight Range Formulations',
      description: 'Computes recommended body weight using Devine, Miller, Robinson, and Hamwi formulas.',
      icon: 'ribbon-outline' as const,
      route: '/calculators/ideal-weight' as const,
      color: '#9C27B0',
      tag: 'Target',
    },
    {
      id: 'macro',
      title: 'Macro Calculator',
      subtitle: 'Protein, Carbs & Fat Breakdown',
      description: 'Calculates exact daily macronutrient target grams based on fitness goals & activity.',
      icon: 'nutrition-outline' as const,
      route: '/calculators/macro' as const,
      color: '#E91E63',
      tag: 'New Feature',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>AI Health Assistant (Pro)</Text>
        <Text style={styles.headerSubtitle}>Unlock advanced fitness features & daily automation:</Text>

        {premiumFeatures.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={() => router.push(item.route)}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconWrapper, { backgroundColor: item.color + '22' }]}>
                <Ionicons name={item.icon} size={28} color={item.color} />
              </View>
              <View style={styles.titleWrapper}>
                <View style={styles.titleRow}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <View style={[styles.tag, { backgroundColor: item.color + '33' }]}>
                    <Text style={[styles.tagText, { color: item.color }]}>{item.tag}</Text>
                  </View>
                </View>
                <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
              </View>
            </View>

            <Text style={styles.cardDesc}>{item.description}</Text>

            <View style={styles.cardFooter}>
              <Text style={[styles.actionText, { color: item.color }]}>Unlock Feature</Text>
              <Ionicons name="chevron-forward" size={18} color={item.color} />
            </View>
          </TouchableOpacity>
        ))}

        <Text style={[styles.pageTitle, { marginTop: theme.spacing.lg }]}>Standard Calculators</Text>
        <Text style={styles.headerSubtitle}>Basic diagnostic health calculators:</Text>

        {calculators.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={() => router.push(item.route)}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconWrapper, { backgroundColor: item.color + '22' }]}>
                <Ionicons name={item.icon} size={28} color={item.color} />
              </View>
              <View style={styles.titleWrapper}>
                <View style={styles.titleRow}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <View style={[styles.tag, { backgroundColor: item.color + '33' }]}>
                    <Text style={[styles.tagText, { color: item.color }]}>{item.tag}</Text>
                  </View>
                </View>
                <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
              </View>
            </View>

            <Text style={styles.cardDesc}>{item.description}</Text>

            <View style={styles.cardFooter}>
              <Text style={[styles.actionText, { color: item.color }]}>Open Calculator</Text>
              <Ionicons name="chevron-forward" size={18} color={item.color} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.hero,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.dark.onSurface,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.dark.onSurfaceVariant,
    marginBottom: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.dark.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.shapes.large,
    marginBottom: theme.spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: 12,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleWrapper: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.dark.onSurface,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: 13,
    color: theme.colors.dark.onSurfaceVariant,
    marginTop: 2,
  },
  cardDesc: {
    fontSize: 13,
    color: theme.colors.dark.onSurfaceVariant,
    lineHeight: 18,
    marginBottom: theme.spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: theme.colors.dark.surfaceVariant,
    paddingTop: theme.spacing.md,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
