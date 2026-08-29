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
import { MealPlannerTips } from '../../../src/components/MealPlannerTips';
import { notificationService } from '../../../src/services/notifications/notificationService';

const STORAGE_KEY = '@fitmetrics_cached_meal_plan';
const SETTINGS_KEY = '@fitmetrics_meal_plan_settings';
const EATEN_KEY = '@fitmetrics_meal_plan_eaten';

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
  const [activeTab, setActiveTab] = useState<'plan' | 'tips'>('plan');
  const [completedMeals, setCompletedMeals] = useState<Record<string, boolean>>({});
  
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
      const eaten = await AsyncStorage.getItem(EATEN_KEY);
      const tdeeTarget = await AsyncStorage.getItem('@fitmetrics_tdee_target');
      
      if (cached) {
        setMealPlan(JSON.parse(cached));
      }
      if (settings) {
        const { calories: cachedCal, diet: cachedDiet } = JSON.parse(settings);
        setCalories(tdeeTarget || cachedCal || '2000');
        setDiet(cachedDiet || 'any');
      } else if (tdeeTarget) {
        setCalories(tdeeTarget);
      }
      
      if (eaten) {
        setCompletedMeals(JSON.parse(eaten));
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
        
        // Reset eaten meals
        setCompletedMeals({});
        await AsyncStorage.removeItem(EATEN_KEY);
        
        // Schedule Reminders
        await notificationService.scheduleMealReminders();
        
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

  const toggleMealEaten = async (mealId: number) => {
    const key = `${selectedDay}-${mealId}`;
    const newCompleted = {
      ...completedMeals,
      [key]: !completedMeals[key]
    };
    setCompletedMeals(newCompleted);
    await AsyncStorage.setItem(EATEN_KEY, JSON.stringify(newCompleted));
  };

  const formatDayName = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  const currentDayPlan = mealPlan ? mealPlan[selectedDay] : null;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'AI Meal Planner' }} />

      {/* Tab Switcher */}
      <View style={styles.tabSwitcher}>
        <TouchableOpacity
          style={[styles.mainTab, activeTab === 'plan' && styles.mainTabActive]}
          onPress={() => setActiveTab('plan')}
        >
          <Ionicons name="restaurant" size={16} color={activeTab === 'plan' ? theme.colors.dark.onPrimary : theme.colors.dark.onSurfaceVariant} />
          <Text style={[styles.mainTabText, activeTab === 'plan' && styles.mainTabTextActive]}>Meal Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mainTab, activeTab === 'tips' && styles.mainTabActive]}
          onPress={() => setActiveTab('tips')}
        >
          <Ionicons name="bulb" size={16} color={activeTab === 'tips' ? theme.colors.dark.onPrimary : theme.colors.dark.onSurfaceVariant} />
          <Text style={[styles.mainTabText, activeTab === 'tips' && styles.mainTabTextActive]}>Tips 💡</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'plan' ? (
          <>
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
            {currentDayPlan && (() => {
              const totalMeals = currentDayPlan.meals.length || 1;
              const eatenCount = currentDayPlan.meals.filter(m => completedMeals[`${selectedDay}-${m.id}`]).length;
              const consumedCals = Math.round((eatenCount / totalMeals) * currentDayPlan.nutrients.calories);
              const progressPct = eatenCount === 0 ? 0 : (eatenCount / totalMeals) * 100;
              
              return (
                <View>
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
                  
                  {/* Calorie Progress */}
                  <View style={styles.progressWrapper}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressTitle}>Consumed Today</Text>
                      <Text style={styles.progressValues}>
                        <Text style={{ color: theme.colors.dark.primary, fontWeight: '700' }}>{consumedCals}</Text> 
                        {' '}/ {currentDayPlan.nutrients.calories} kcal
                      </Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
                    </View>
                  </View>
                </View>
              );
            })()}

            {/* Meals List */}
            {currentDayPlan && currentDayPlan.meals.map((meal, idx) => {
              const isEaten = !!completedMeals[`${selectedDay}-${meal.id}`];
              return (
                <View key={meal.id} style={styles.mealCardWrapper}>
                  <TouchableOpacity
                    style={[styles.mealCard, isEaten && styles.mealCardEaten]}
                    onPress={() => handleMealPress(meal)}
                    activeOpacity={0.9}
                  >
                    <Image source={{ uri: meal.image }} style={[styles.mealImage, isEaten && styles.mealImageEaten]} />
                    <View style={styles.mealDetails}>
                      <Text style={[styles.mealTag, isEaten && styles.mealTagEaten]}>
                        {idx === 0 ? 'Breakfast' : idx === 1 ? 'Lunch' : 'Dinner'}
                      </Text>
                      <Text style={[styles.mealTitle, isEaten && styles.mealTitleEaten]} numberOfLines={2}>
                        {meal.title}
                      </Text>
                      <View style={styles.mealMeta}>
                        <Ionicons name="time-outline" size={14} color={isEaten ? theme.colors.dark.surfaceVariant : theme.colors.dark.onSurfaceVariant} />
                        <Text style={[styles.mealMetaText, isEaten && styles.mealMetaTextEaten]}>{meal.readyInMinutes} mins</Text>
                        <Ionicons name="people-outline" size={14} color={isEaten ? theme.colors.dark.surfaceVariant : theme.colors.dark.onSurfaceVariant} style={{ marginLeft: 12 }} />
                        <Text style={[styles.mealMetaText, isEaten && styles.mealMetaTextEaten]}>{meal.servings} servings</Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={[styles.checkboxBtn, isEaten && styles.checkboxBtnChecked]} 
                      onPress={() => toggleMealEaten(meal.id)}
                    >
                      <Ionicons name={isEaten ? "checkmark" : "ellipse-outline"} size={22} color={isEaten ? theme.colors.dark.onPrimary : theme.colors.dark.outline} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                </View>
              );
            })}
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
          </>
        ) : (
          <MealPlannerTips />
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
  tabSwitcher: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.dark.surface,
    borderRadius: theme.shapes.medium,
    padding: 4,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  mainTab: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.shapes.medium - 2,
    gap: 6,
  },
  mainTabActive: {
    backgroundColor: theme.colors.dark.primary,
  },
  mainTabText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.dark.onSurfaceVariant,
  },
  mainTabTextActive: {
    color: theme.colors.dark.onPrimary,
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
  progressWrapper: {
    backgroundColor: theme.colors.dark.surface,
    padding: theme.spacing.md,
    borderRadius: theme.shapes.medium,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.dark.onSurface,
  },
  progressValues: {
    fontSize: 13,
    color: theme.colors.dark.onSurfaceVariant,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: theme.colors.dark.surfaceVariant,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.dark.primary,
    borderRadius: 4,
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
  mealMetaTextEaten: {
    color: theme.colors.dark.surfaceVariant,
  },
  checkboxBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.dark.background,
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  checkboxBtnChecked: {
    backgroundColor: theme.colors.dark.primary,
    borderColor: theme.colors.dark.primary,
  },
  mealCardWrapper: {
    marginBottom: theme.spacing.sm,
  },
  mealCardEaten: {
    opacity: 0.6,
    borderColor: theme.colors.dark.primary + '44',
    backgroundColor: theme.colors.dark.surface + '88',
  },
  mealImageEaten: {
    opacity: 0.5,
  },
  mealTagEaten: {
    color: theme.colors.dark.primary + '99',
  },
  mealTitleEaten: {
    textDecorationLine: 'line-through',
    color: theme.colors.dark.onSurfaceVariant,
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
