import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  Linking,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { geminiApiService, WeekPlan, SpoonacularMeal } from '../../../src/services/api/geminiApiService';
import { theme } from '../../../src/theme/theme';

const STORAGE_KEY = '@fitmetrics_cached_meal_plan';
const SETTINGS_KEY = '@fitmetrics_meal_plan_settings';

const DIET_OPTIONS = [
  { label: 'Any Diet', value: 'any' },
  { label: 'Vegetarian', value: 'vegetarian' },
  { label: 'Vegan', value: 'vegan' },
  { label: 'Gluten Free', value: 'gluten free' },
  { label: 'Ketogenic', value: 'ketogenic' },
  { label: 'Paleo', value: 'paleo' },
];

export default function MealPlannerScreen() {
  const [calories, setCalories] = useState('2000');
  const [diet, setDiet] = useState('any');
  const [loading, setLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState<WeekPlan | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>('monday');
  
  // Recipe detail modal
  const [selectedMeal, setSelectedMeal] = useState<SpoonacularMeal | null>(null);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipeInstructions, setRecipeInstructions] = useState<string>('');

  useEffect(() => {
    loadCachedPlan();
  }, []);

  const loadCachedPlan = async () => {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      const settings = await AsyncStorage.getItem(SETTINGS_KEY);
      if (cached) {
        setMealPlan(JSON.parse(cached));
      }
      if (settings) {
        const { calories: cachedCal, diet: cachedDiet } = JSON.parse(settings);
        setCalories(cachedCal || '2000');
        setDiet(cachedDiet || 'any');
      }
    } catch (e) {
      console.warn('Failed to load cached meal plan settings', e);
    }
  };

  const handleGenerate = async () => {
    const calNum = parseInt(calories, 10);
    if (isNaN(calNum) || calNum < 1000 || calNum > 6000) {
      Alert.alert('Invalid Calories', 'Please enter a target calorie count between 1000 and 6000.');
      return;
    }

    setLoading(true);
    try {
      const plan = await geminiApiService.generateMealPlan(calNum, diet);
      if (plan) {
        setMealPlan(plan);
        // Cache plan and settings
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ calories, diet }));
        
        // Default to first day in the plan response
        const days = Object.keys(plan);
        if (days.length > 0) {
          setSelectedDay(days[0]);
        }
      } else {
        Alert.alert('Generation Failed', 'Could not generate a meal plan. Please check your internet connection or Gemini API key.');
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred during meal plan generation.');
    } finally {
      setLoading(false);
    }
  };

  const handleMealPress = async (meal: SpoonacularMeal) => {
    setSelectedMeal(meal);
    setRecipeLoading(true);
    setRecipeInstructions('Recipe instructions are not available in the AI preview. Tap "Search Recipe Online" below to find a matching recipe.');
    setRecipeLoading(false);
  };

  const formatDayName = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  const currentDayPlan = mealPlan ? mealPlan[selectedDay] : null;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'AI Meal Planner' }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Setup Card */}
        <View style={styles.setupCard}>
          <Text style={styles.cardTitle}>Configure Daily Plan</Text>
          <Text style={styles.cardSubtitle}>Generate personalized recipes matching your nutrition goals</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Daily Calorie Target</Text>
            <View style={styles.calInputContainer}>
              <TextInput
                style={styles.calInput}
                value={calories}
                onChangeText={setCalories}
                keyboardType="numeric"
                placeholder="2000"
                placeholderTextColor={theme.colors.dark.outline}
              />
              <Text style={styles.calUnit}>kcal</Text>
            </View>
          </View>

          <Text style={styles.inputLabel}>Dietary Filter</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dietList}>
            {DIET_OPTIONS.map((option) => {
              const active = diet === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.dietChip, active && styles.dietChipActive]}
                  onPress={() => setDiet(option.value)}
                >
                  <Text style={[styles.dietChipText, active && styles.dietChipTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate} disabled={loading} activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color={theme.colors.dark.onPrimary} />
            ) : (
              <>
                <Ionicons name="sparkles" size={18} color={theme.colors.dark.onPrimary} />
                <Text style={styles.generateBtnText}>Generate 7-Day Plan</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Meal Plan Results */}
        {mealPlan ? (
          <View style={styles.resultsContainer}>
            {/* Days Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysTabRow}>
              {Object.keys(mealPlan).map((day) => {
                const active = selectedDay === day;
                return (
                  <TouchableOpacity
                    key={day}
                    style={[styles.dayTab, active && styles.dayTabActive]}
                    onPress={() => setSelectedDay(day)}
                  >
                    <Text style={[styles.dayTabText, active && styles.dayTabTextActive]}>
                      {day.substring(0, 3).toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Nutrients Banner */}
            {currentDayPlan && (
              <View style={styles.nutrientsBanner}>
                <View style={styles.nutrientStat}>
                  <Text style={styles.nutrientValue}>{currentDayPlan.nutrients.calories}</Text>
                  <Text style={styles.nutrientLabel}>Calories (kcal)</Text>
                </View>
                <View style={styles.nutrientStat}>
                  <Text style={styles.nutrientValue}>{currentDayPlan.nutrients.protein}g</Text>
                  <Text style={styles.nutrientLabel}>Protein</Text>
                </View>
                <View style={styles.nutrientStat}>
                  <Text style={styles.nutrientValue}>{currentDayPlan.nutrients.carbohydrates}g</Text>
                  <Text style={styles.nutrientLabel}>Carbs</Text>
                </View>
                <View style={styles.nutrientStat}>
                  <Text style={styles.nutrientValue}>{currentDayPlan.nutrients.fat}g</Text>
                  <Text style={styles.nutrientLabel}>Fats</Text>
                </View>
              </View>
            )}

            {/* Meals List */}
            {currentDayPlan && currentDayPlan.meals.map((meal, idx) => (
              <TouchableOpacity
                key={meal.id}
                style={styles.mealCard}
                onPress={() => handleMealPress(meal)}
                activeOpacity={0.9}
              >
                <Image source={{ uri: meal.image }} style={styles.mealImage} />
                <View style={styles.mealDetails}>
                  <Text style={styles.mealTag}>
                    {idx === 0 ? 'Breakfast' : idx === 1 ? 'Lunch' : 'Dinner'}
                  </Text>
                  <Text style={styles.mealTitle} numberOfLines={2}>{meal.title}</Text>
                  <View style={styles.mealMeta}>
                    <Ionicons name="time-outline" size={14} color={theme.colors.dark.onSurfaceVariant} />
                    <Text style={styles.mealMetaText}>{meal.readyInMinutes} mins</Text>
                    <Ionicons name="people-outline" size={14} color={theme.colors.dark.onSurfaceVariant} style={{ marginLeft: 12 }} />
                    <Text style={styles.mealMetaText}>{meal.servings} servings</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.dark.outline} style={styles.arrow} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={60} color={theme.colors.dark.surfaceVariant} />
            <Text style={styles.emptyTitle}>No Meal Plan Generated</Text>
            <Text style={styles.emptySubtitle}>
              Configure your daily calorie limit and dietary needs above to create your custom meal plan.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Recipe Detail Modal */}
      <Modal visible={selectedMeal !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedMeal(null)}>
              <Ionicons name="close" size={24} color={theme.colors.dark.onSurface} />
            </TouchableOpacity>

            {selectedMeal && (
              <ScrollView contentContainerStyle={styles.modalScroll}>
                <Image source={{ uri: selectedMeal.image }} style={styles.modalImage} />
                <Text style={styles.modalTitle}>{selectedMeal.title}</Text>
                
                <View style={styles.modalMetaRow}>
                  <View style={styles.modalMetaItem}>
                    <Ionicons name="time" size={18} color={theme.colors.dark.primary} />
                    <Text style={styles.modalMetaVal}>{selectedMeal.readyInMinutes} m</Text>
                    <Text style={styles.modalMetaLbl}>Time</Text>
                  </View>
                  <View style={styles.modalMetaItem}>
                    <Ionicons name="people" size={18} color={theme.colors.dark.primary} />
                    <Text style={styles.modalMetaVal}>{selectedMeal.servings}</Text>
                    <Text style={styles.modalMetaLbl}>Servings</Text>
                  </View>
                </View>

                <Text style={styles.modalSectionTitle}>Instructions</Text>
                {recipeLoading ? (
                  <ActivityIndicator color={theme.colors.dark.primary} style={{ marginVertical: 30 }} />
                ) : (
                  <Text style={styles.modalBody}>{recipeInstructions}</Text>
                )}

                <TouchableOpacity
                  style={styles.sourceBtn}
                  onPress={() => Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(selectedMeal.title + ' recipe')}`)}
                >
                  <Ionicons name="search-outline" size={16} color={theme.colors.dark.onPrimary} />
                  <Text style={styles.sourceBtnText}>Search Recipe Online</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark.background,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  setupCard: {
    backgroundColor: theme.colors.dark.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.shapes.large,
    marginBottom: theme.spacing.lg,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.dark.onSurface,
  },
  cardSubtitle: {
    fontSize: 12,
    color: theme.colors.dark.onSurfaceVariant,
    marginTop: 2,
    marginBottom: theme.spacing.md,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.dark.primary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  calInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.dark.surfaceVariant,
    borderRadius: theme.shapes.medium,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  calInput: {
    flex: 1,
    color: theme.colors.dark.onSurface,
    fontSize: 15,
    paddingVertical: 10,
    fontWeight: '600',
  },
  calUnit: {
    color: theme.colors.dark.onSurfaceVariant,
    fontSize: 14,
    fontWeight: '700',
  },
  dietList: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  dietChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.dark.surfaceVariant,
    marginRight: 8,
  },
  dietChipActive: {
    backgroundColor: theme.colors.dark.primary,
  },
  dietChipText: {
    color: theme.colors.dark.onSurfaceVariant,
    fontSize: 13,
    fontWeight: '600',
  },
  dietChipTextActive: {
    color: theme.colors.dark.onPrimary,
    fontWeight: '700',
  },
  generateBtn: {
    backgroundColor: theme.colors.dark.primary,
    paddingVertical: 12,
    borderRadius: theme.shapes.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: theme.spacing.xs,
  },
  generateBtnText: {
    color: theme.colors.dark.onPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  resultsContainer: {
    gap: 12,
  },
  daysTabRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xs,
  },
  dayTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.dark.surface,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  dayTabActive: {
    backgroundColor: theme.colors.dark.primary,
    borderColor: theme.colors.dark.primary,
  },
  dayTabText: {
    color: theme.colors.dark.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '800',
  },
  dayTabTextActive: {
    color: theme.colors.dark.onPrimary,
  },
  nutrientsBanner: {
    flexDirection: 'row',
    backgroundColor: theme.colors.dark.surface,
    borderRadius: theme.shapes.medium,
    padding: theme.spacing.md,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  nutrientStat: {
    alignItems: 'center',
    flex: 1,
  },
  nutrientValue: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.dark.onSurface,
  },
  nutrientLabel: {
    fontSize: 10,
    color: theme.colors.dark.onSurfaceVariant,
    marginTop: 2,
  },
  mealCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.dark.surface,
    borderRadius: theme.shapes.medium,
    padding: theme.spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  mealImage: {
    width: 70,
    height: 70,
    borderRadius: theme.shapes.small,
    marginRight: theme.spacing.md,
  },
  mealDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  mealTag: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.dark.primary,
    textTransform: 'uppercase',
  },
  mealTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.dark.onSurface,
    marginTop: 2,
  },
  mealMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  mealMetaText: {
    fontSize: 11,
    color: theme.colors.dark.onSurfaceVariant,
    marginLeft: 4,
  },
  arrow: {
    marginLeft: 8,
  },
  emptyContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.dark.onSurface,
  },
  emptySubtitle: {
    fontSize: 13,
    color: theme.colors.dark.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.dark.surface,
    borderTopLeftRadius: theme.shapes.large * 1.5,
    borderTopRightRadius: theme.shapes.large * 1.5,
    maxHeight: '90%',
    padding: theme.spacing.lg,
  },
  modalCloseBtn: {
    alignSelf: 'flex-end',
    padding: 4,
    marginBottom: 8,
  },
  modalScroll: {
    paddingBottom: theme.spacing.xl,
  },
  modalImage: {
    width: '100%',
    height: 180,
    borderRadius: theme.shapes.large,
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.dark.onSurface,
    marginBottom: theme.spacing.md,
  },
  modalMetaRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.dark.surfaceVariant,
    borderRadius: theme.shapes.medium,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  modalMetaItem: {
    flex: 1,
    alignItems: 'center',
  },
  modalMetaVal: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.dark.onSurface,
    marginTop: 4,
  },
  modalMetaLbl: {
    fontSize: 10,
    color: theme.colors.dark.onSurfaceVariant,
    marginTop: 2,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.dark.primary,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalBody: {
    fontSize: 13,
    color: theme.colors.dark.onSurface,
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  sourceBtn: {
    backgroundColor: theme.colors.dark.primary,
    paddingVertical: 12,
    borderRadius: theme.shapes.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: theme.spacing.sm,
  },
  sourceBtnText: {
    color: theme.colors.dark.onPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
});
