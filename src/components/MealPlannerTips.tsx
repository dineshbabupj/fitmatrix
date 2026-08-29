import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface Tip {
  title: string;
  content: string;
}

interface Category {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  tips: Tip[];
}

const TIPS_DATA: Category[] = [
  {
    id: 'planning',
    title: 'Planning Basics',
    icon: 'clipboard-outline',
    color: '#4CAF50',
    tips: [
      {
        title: 'Keep It Simple',
        content: 'Use a short rotation of 8–10 meals you already like and cycle through them — choosing is fast and stress-free.',
      },
      {
        title: 'Limit New Recipes',
        content: 'Only 1 new or complicated recipe per week. Familiar meals reduce stress and save prep time.',
      },
      {
        title: 'Weekday Simple, Weekend Fun',
        content: 'Keep weekday meals quick and easy. Save involved cooking and new recipes for weekends.',
      },
    ],
  },
  {
    id: 'time-saving',
    title: 'Time-Saving & Workflow',
    icon: 'flash-outline',
    color: '#FF9800',
    tips: [
      {
        title: 'Batch-Cook Proteins',
        content: 'Cook 2–3 proteins at once (e.g., grilled chicken, ground beef) and mix-and-match across meals. The single biggest time saver!',
      },
      {
        title: 'Prep While Enjoying',
        content: 'Do prep (cutting veggies, cooking proteins) while watching a show or listening to a podcast. Makes it fun instead of a chore.',
      },
      {
        title: 'Use Kitchen Shortcuts',
        content: 'Air fryer: chicken done in 15 min. Rice cooker: push 2 buttons. Small appliances = huge time savings.',
      },
    ],
  },
  {
    id: 'portioning',
    title: 'Portioning & Freezing',
    icon: 'snow-outline',
    color: '#00BCD4',
    tips: [
      {
        title: 'Embrace Leftovers',
        content: 'Plan recipes that yield 4–5 servings. Eat twice + use as next-day lunch. Less cooking, more eating!',
      },
      {
        title: 'Freeze Extras',
        content: "Freeze meals you won't eat this week and keep a running inventory list in your phone notes.",
      },
      {
        title: 'Stock Your Freezer',
        content: 'Buckle down for 1–2 weeks, cook batches of different recipes, and freeze 4–5 portions each. Then cut prep to 1–2 recipes per week.',
      },
    ],
  },
  {
    id: 'decision',
    title: 'Decision Tools',
    icon: 'bulb-outline',
    color: '#9C27B0',
    tips: [
      {
        title: 'Short Go-To Meal List',
        content: 'Keep a note with ~10 dinners you already know how to cook. Each week, pick 5 from it. Done in 15 minutes.',
      },
      {
        title: 'Organize Your Grocery List',
        content: 'Group your list by store section (produce, dairy, meat). Cuts shopping time significantly. Use curbside pickup to save even more.',
      },
      {
        title: 'Use Meal-Planning Tools',
        content: "Tools that auto-generate meal plans (like this app!) remove mental load. You don't have to browse recipes — just follow the plan.",
      },
    ],
  },
  {
    id: 'fitness',
    title: 'Fitness Goals',
    icon: 'barbell-outline',
    color: '#E91E63',
    tips: [
      {
        title: 'Pre-Log Calories',
        content: 'Pre-log your planned meals at the start of the day. Meal prep makes hitting calorie targets far easier when food is already measured.',
      },
      {
        title: 'Stable Macro Meals',
        content: 'Build meals around: lean protein + brown rice or quinoa + veggies. Consistent macros, cheap calories, easy to track.',
      },
      {
        title: 'Simple Portioning',
        content: "You don't need fancy containers. Keep a big batch in one container and weigh out a portion each morning.",
      },
    ],
  },
  {
    id: 'safety',
    title: 'Food Safety & Quality',
    icon: 'shield-checkmark-outline',
    color: '#3F51B5',
    tips: [
      {
        title: 'Cool Before Sealing',
        content: 'Let hot food stop steaming before putting a lid on it, then refrigerate. Prevents bacterial growth and keeps food from getting soggy.',
      },
      {
        title: 'Fight Meal Boredom',
        content: 'Swap sauces across the same base meal. Try roasting vs sautéeing vegetables. Deglaze the pan for a quick sauce — same ingredients, new taste.',
      },
      {
        title: 'Variety Through Seasoning',
        content: 'Same chicken breast can be teriyaki Monday, lemon herb Wednesday, and curry Friday. Seasonings = free variety.',
      },
    ],
  },
];

export const MealPlannerTips: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="bulb" size={24} color={theme.colors.dark.primary} />
        <View style={styles.headerTextWrapper}>
          <Text style={styles.title}>Meal Prep Secrets</Text>
          <Text style={styles.subtitle}>Curated tips from fitness communities</Text>
        </View>
      </View>

      <View style={styles.list}>
        {TIPS_DATA.map((category) => {
          const isExpanded = expandedId === category.id;

          return (
            <View key={category.id} style={styles.card}>
              <TouchableOpacity
                style={styles.cardHeader}
                activeOpacity={0.7}
                onPress={() => toggleExpand(category.id)}
              >
                <View style={[styles.iconBox, { backgroundColor: category.color + '22' }]}>
                  <Ionicons name={category.icon} size={20} color={category.color} />
                </View>
                <Text style={styles.cardTitle}>{category.title}</Text>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.colors.dark.onSurfaceVariant}
                />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.cardBody}>
                  {category.tips.map((tip, idx) => (
                    <View key={idx} style={styles.tipItem}>
                      <View style={styles.tipIcon}>
                        <Ionicons name="star" size={12} color={category.color} />
                      </View>
                      <View style={styles.tipTextContent}>
                        <Text style={styles.tipTitle}>{tip.title}</Text>
                        <Text style={styles.tipContent}>{tip.content}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.sm,
  },
  headerTextWrapper: {
    marginLeft: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.dark.onSurface,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.dark.onSurfaceVariant,
    marginTop: 2,
  },
  list: {
    paddingBottom: theme.spacing.xl,
  },
  card: {
    backgroundColor: theme.colors.dark.surface,
    borderRadius: theme.shapes.large,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.dark.onSurface,
  },
  cardBody: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    paddingTop: theme.spacing.xs,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  tipIcon: {
    marginTop: 2,
    marginRight: 10,
  },
  tipTextContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.dark.onSurface,
    marginBottom: 4,
  },
  tipContent: {
    fontSize: 13,
    color: theme.colors.dark.onSurfaceVariant,
    lineHeight: 18,
  },
});
