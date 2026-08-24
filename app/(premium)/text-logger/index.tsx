import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { geminiApiService, ParsedIngredient } from '../../../src/services/api/geminiApiService';
import { useMealStore } from '../../../src/store/mealStore';
import { theme } from '../../../src/theme/theme';

const MEAL_TYPES = [
  { label: 'Breakfast', value: 'breakfast' },
  { label: 'Lunch', value: 'lunch' },
  { label: 'Dinner', value: 'dinner' },
  { label: 'Snack', value: 'snack' },
];

export default function TextLoggerScreen() {
  const [inputText, setInputText] = useState('');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [loading, setLoading] = useState(false);
  const [logging, setLogging] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedIngredient[] | null>(null);

  const addMeal = useMealStore((state) => state.addMeal);

  const handleParse = async () => {
    const clean = inputText.trim();
    if (!clean) {
      Alert.alert('Empty Input', 'Please enter some ingredients first.');
      return;
    }

    setLoading(true);
    setParsedItems(null);
    try {
      const result = await geminiApiService.parseIngredients(clean);
      if (result && result.length > 0) {
        setParsedItems(result);
      } else {
        Alert.alert('Parser Error', 'Could not parse ingredients. Make sure you entered valid food items with weights or sizes (e.g. "1 apple", "100g chicken").');
      }
    } catch (e) {
      Alert.alert('Error', 'An unexpected error occurred during parsing.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogMeals = async () => {
    if (!parsedItems || parsedItems.length === 0) return;

    setLogging(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      
      for (const item of parsedItems) {
        await addMeal({
          date: todayStr,
          meal_type: mealType,
          food_name: `${item.amount} ${item.unit} ${item.name}`,
          calories: item.calories,
          protein_g: item.protein,
          carbs_g: item.carbs,
          fats_g: item.fat,
        });
      }

      Alert.alert('🎉 Logged Successfully', 'All parsed ingredients have been added to your diary.', [
        {
          text: 'Go to Diary',
          onPress: () => {
            router.replace('/food');
          },
        },
        {
          text: 'Log More',
          style: 'cancel',
          onPress: () => {
            setInputText('');
            setParsedItems(null);
          },
        },
      ]);
    } catch (e) {
      Alert.alert('Logging Failed', 'Could not save items to database.');
    } finally {
      setLogging(false);
    }
  };

  // Calculate totals
  const totals = parsedItems
    ? parsedItems.reduce(
        (acc, item) => {
          acc.calories += item.calories;
          acc.protein += item.protein;
          acc.carbs += item.carbs;
          acc.fat += item.fat;
          return acc;
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      )
    : null;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Text Macro Logger' }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Input Card */}
        <View style={styles.inputCard}>
          <Text style={styles.cardTitle}>Natural Language Macro Logger</Text>
          <Text style={styles.cardSubtitle}>
            Paste or type ingredients list. Describe items with quantities or weights.
          </Text>

          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={6}
            placeholder={`Example:\n1 large banana\n2 cups skim milk\n50 grams rolled oats`}
            placeholderTextColor={theme.colors.dark.outline}
            value={inputText}
            onChangeText={setInputText}
          />

          <Text style={styles.sectionLabel}>Select Meal Type</Text>
          <View style={styles.mealSelectorRow}>
            {MEAL_TYPES.map((type) => {
              const active = mealType === type.value;
              return (
                <TouchableOpacity
                  key={type.value}
                  style={[styles.mealBtn, active && styles.mealBtnActive]}
                  onPress={() => setMealType(type.value as any)}
                >
                  <Text style={[styles.mealBtnText, active && styles.mealBtnTextActive]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.parseBtn} onPress={handleParse} disabled={loading} activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color={theme.colors.dark.onPrimary} />
            ) : (
              <>
                <Ionicons name="flash-sharp" size={16} color={theme.colors.dark.onPrimary} />
                <Text style={styles.parseBtnText}>Parse & Calculate Macros</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Parsed Outputs */}
        {parsedItems && totals && (
          <View style={styles.resultsContainer}>
            {/* Totals Summary Banner */}
            <View style={styles.totalsCard}>
              <Text style={styles.totalsTitle}>Aggregated Macros Summary</Text>
              <View style={styles.totalsRow}>
                <View style={styles.totalStat}>
                  <Text style={styles.totalVal}>{totals.calories}</Text>
                  <Text style={styles.totalLbl}>kcal</Text>
                </View>
                <View style={styles.totalStat}>
                  <Text style={styles.totalVal}>{totals.protein}g</Text>
                  <Text style={styles.totalLbl}>Protein</Text>
                </View>
                <View style={styles.totalStat}>
                  <Text style={styles.totalVal}>{totals.carbs}g</Text>
                  <Text style={styles.totalLbl}>Carbs</Text>
                </View>
                <View style={styles.totalStat}>
                  <Text style={styles.totalVal}>{totals.fat}g</Text>
                  <Text style={styles.totalLbl}>Fats</Text>
                </View>
              </View>
            </View>

            {/* Individual Items List */}
            <Text style={styles.sectionLabel}>Parsed Ingredients Breakdown</Text>
            {parsedItems.map((item, idx) => (
              <View key={idx} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Ionicons name="basket-outline" size={18} color={theme.colors.dark.primary} />
                  <Text style={styles.itemName}>
                    {item.amount} {item.unit} {item.name}
                  </Text>
                </View>
                
                <View style={styles.itemMacros}>
                  <Text style={styles.itemMacroText}>🔥 {item.calories} kcal</Text>
                  <Text style={styles.itemMacroText}>🥩 P: {item.protein}g</Text>
                  <Text style={styles.itemMacroText}>🌾 C: {item.carbs}g</Text>
                  <Text style={styles.itemMacroText}>🥑 F: {item.fat}g</Text>
                </View>
              </View>
            ))}

            {/* Save Button */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleLogMeals} disabled={logging} activeOpacity={0.8}>
              {logging ? (
                <ActivityIndicator color={theme.colors.dark.onPrimary} />
              ) : (
                <>
                  <Ionicons name="journal-outline" size={18} color={theme.colors.dark.onPrimary} />
                  <Text style={styles.saveBtnText}>Log to Today's Diary</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  inputCard: {
    backgroundColor: theme.colors.dark.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.shapes.large,
    marginBottom: theme.spacing.lg,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.dark.onSurface,
  },
  cardSubtitle: {
    fontSize: 12,
    color: theme.colors.dark.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 16,
    marginBottom: theme.spacing.md,
  },
  textInput: {
    backgroundColor: theme.colors.dark.surfaceVariant,
    borderRadius: theme.shapes.medium,
    padding: theme.spacing.md,
    color: theme.colors.dark.onSurface,
    fontSize: 14,
    height: 140,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: theme.spacing.md,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.dark.primary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mealSelectorRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: theme.spacing.lg,
  },
  mealBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.dark.surfaceVariant,
    alignItems: 'center',
  },
  mealBtnActive: {
    backgroundColor: theme.colors.dark.primary,
  },
  mealBtnText: {
    fontSize: 11,
    color: theme.colors.dark.onSurfaceVariant,
    fontWeight: '700',
  },
  mealBtnTextActive: {
    color: theme.colors.dark.onPrimary,
    fontWeight: '800',
  },
  parseBtn: {
    backgroundColor: theme.colors.dark.primary,
    paddingVertical: 12,
    borderRadius: theme.shapes.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  parseBtnText: {
    color: theme.colors.dark.onPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  resultsContainer: {
    gap: 12,
  },
  totalsCard: {
    backgroundColor: theme.colors.dark.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.shapes.large,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  totalsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.dark.onSurface,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalStat: {
    alignItems: 'center',
    flex: 1,
  },
  totalVal: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.dark.primary,
  },
  totalLbl: {
    fontSize: 10,
    color: theme.colors.dark.onSurfaceVariant,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemCard: {
    backgroundColor: theme.colors.dark.surface,
    padding: theme.spacing.md,
    borderRadius: theme.shapes.medium,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.dark.onSurface,
    textTransform: 'capitalize',
  },
  itemMacros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 26,
  },
  itemMacroText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.dark.onSurfaceVariant,
  },
  saveBtn: {
    backgroundColor: theme.colors.dark.primary,
    paddingVertical: 14,
    borderRadius: theme.shapes.large,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: theme.spacing.sm,
  },
  saveBtnText: {
    color: theme.colors.dark.onPrimary,
    fontWeight: '800',
    fontSize: 15,
  },
});
