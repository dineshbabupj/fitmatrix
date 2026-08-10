import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Clipboard,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InputCard } from '../components/InputCard';
import { storage } from '../data/storage';
import { calculationsDb } from '../data/db';
import { theme } from '../theme/theme';
import { validateBmrInputs, BmrInputParams } from '../utils/validation';
import {
  calculateMacros,
  calculateMacrosImperial,
  MacroResult,
  ActivityLevel,
  FitnessGoal,
} from '../utils/macroCalculator';
import { adMobManager } from '../services/admob/adMobManager';
import { AdBanner } from '../components/AdBanner';

export const MacroScreen = () => {
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [gender, setGender] = useState<'male' | 'female' | ''>('male');
  const [ageStr, setAgeStr] = useState('25');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [goal, setGoal] = useState<FitnessGoal>('lose');

  // Metric inputs
  const [heightCmStr, setHeightCmStr] = useState('');
  const [weightKgStr, setWeightKgStr] = useState('');

  // Imperial inputs
  const [heightFtStr, setHeightFtStr] = useState('');
  const [heightInStr, setHeightInStr] = useState('');
  const [weightLbsStr, setWeightLbsStr] = useState('');

  const [result, setResult] = useState<MacroResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  const handleCalculate = async () => {
    const params: BmrInputParams = {
      gender,
      ageStr,
      unitSystem,
      heightCmStr,
      weightKgStr,
      heightFtStr,
      heightInStr,
      weightLbsStr,
    };

    const validation = validateBmrInputs(params);

    if (!validation.isValid || !validation.data) {
      setErrors(validation.errors);
      setResult(null);
      return;
    }

    setErrors({});

    let macroRes: MacroResult;
    if (validation.data.unitSystem === 'imperial' && validation.data.weightLbs && validation.data.totalInches) {
      macroRes = calculateMacrosImperial(
        validation.data.gender,
        validation.data.weightLbs,
        validation.data.totalInches,
        validation.data.age,
        activityLevel,
        goal
      );
    } else {
      macroRes = calculateMacros(
        validation.data.gender,
        validation.data.weightKg!,
        validation.data.heightCm!,
        validation.data.age,
        activityLevel,
        goal
      );
    }

    setResult(macroRes);

    const inputsJson = JSON.stringify({
      gender: validation.data.gender,
      age: validation.data.age,
      unitSystem: validation.data.unitSystem,
      heightCm: validation.data.heightCm,
      weightKg: validation.data.weightKg,
      activityLevel,
      goal,
    });

    try {
      await calculationsDb.add({
        type: 'MACRO',
        inputs_json: inputsJson,
        result: `${macroRes.targetCalories} kcal/day`,
        category: `Goal: ${goal.toUpperCase()} (P:${macroRes.proteinGrams}g, C:${macroRes.carbsGrams}g, F:${macroRes.fatGrams}g)`,
        date: Date.now(),
      });
    } catch (e) {
      console.warn('Failed to persist Macro calculation:', e);
    }

    storage.addHistory('MACRO', `Macro Target: ${macroRes.targetCalories} kcal (P: ${macroRes.proteinGrams}g, C: ${macroRes.carbsGrams}g, F: ${macroRes.fatGrams}g)`);

    adMobManager.registerCalculation();
  };

  const handleCopyResult = () => {
    if (result) {
      const summary = `FitMetrics Macro Target: ${result.targetCalories} kcal/day | Protein: ${result.proteinGrams}g | Carbs: ${result.carbsGrams}g | Fat: ${result.fatGrams}g`;
      Clipboard.setString(summary);
      Alert.alert('Copied to Clipboard', summary);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.heading}>Macronutrient Calculator</Text>
          <Text style={styles.subheading}>Daily Calorie & Protein, Carbs, Fat Targets</Text>
        </View>
        <TouchableOpacity style={styles.infoIconBtn} onPress={() => setShowFormulaModal(true)}>
          <Ionicons name="information-circle-outline" size={24} color={theme.colors.dark.primary} />
        </TouchableOpacity>
      </View>

      {/* Unit System Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleBtn, unitSystem === 'metric' && styles.toggleBtnActive]}
          onPress={() => {
            setUnitSystem('metric');
            setErrors({});
          }}
        >
          <Text style={[styles.toggleText, unitSystem === 'metric' && styles.toggleTextActive]}>
            Metric (cm / kg)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, unitSystem === 'imperial' && styles.toggleBtnActive]}
          onPress={() => {
            setUnitSystem('imperial');
            setErrors({});
          }}
        >
          <Text style={[styles.toggleText, unitSystem === 'imperial' && styles.toggleTextActive]}>
            Imperial (ft, in / lbs)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Fitness Goal Selection */}
      <View style={styles.sectionCard}>
        <Text style={styles.fieldLabel}>Fitness Goal *</Text>
        <View style={styles.goalRow}>
          <TouchableOpacity
            style={[styles.goalChip, goal === 'lose' && styles.goalChipActive]}
            onPress={() => setGoal('lose')}
          >
            <Ionicons name="trending-down-outline" size={16} color={goal === 'lose' ? theme.colors.dark.onPrimary : theme.colors.dark.onSurfaceVariant} />
            <Text style={[styles.goalChipText, goal === 'lose' && styles.goalChipTextActive]}>Weight Loss</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.goalChip, goal === 'maintain' && styles.goalChipActive]}
            onPress={() => setGoal('maintain')}
          >
            <Ionicons name="remove-outline" size={16} color={goal === 'maintain' ? theme.colors.dark.onPrimary : theme.colors.dark.onSurfaceVariant} />
            <Text style={[styles.goalChipText, goal === 'maintain' && styles.goalChipTextActive]}>Maintain</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.goalChip, goal === 'gain' && styles.goalChipActive]}
            onPress={() => setGoal('gain')}
          >
            <Ionicons name="trending-up-outline" size={16} color={goal === 'gain' ? theme.colors.dark.onPrimary : theme.colors.dark.onSurfaceVariant} />
            <Text style={[styles.goalChipText, goal === 'gain' && styles.goalChipTextActive]}>Muscle Gain</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Activity Level Selection */}
      <View style={styles.sectionCard}>
        <Text style={styles.fieldLabel}>Daily Activity Level *</Text>
        <View style={styles.activityPickerGroup}>
          {[
            { id: 'sedentary', label: 'Sedentary (Little/no exercise)' },
            { id: 'light', label: 'Lightly Active (1-3 days/wk)' },
            { id: 'moderate', label: 'Moderately Active (3-5 days/wk)' },
            { id: 'very', label: 'Very Active (6-7 days/wk)' },
            { id: 'extra', label: 'Extra Active (Hard exercise/job)' },
          ].map((act) => (
            <TouchableOpacity
              key={act.id}
              style={[styles.activityOption, activityLevel === act.id && styles.activityOptionActive]}
              onPress={() => setActivityLevel(act.id as ActivityLevel)}
            >
              <Ionicons
                name={activityLevel === act.id ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={activityLevel === act.id ? theme.colors.dark.primary : theme.colors.dark.outline}
              />
              <Text style={[styles.activityOptionText, activityLevel === act.id && styles.activityOptionTextActive]}>
                {act.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Gender Selection */}
      <View style={styles.sectionCard}>
        <Text style={styles.fieldLabel}>Gender *</Text>
        <View style={styles.genderRow}>
          <TouchableOpacity
            style={[styles.genderChip, gender === 'male' && styles.genderChipActive]}
            onPress={() => {
              setGender('male');
              setErrors((prev) => ({ ...prev, gender: '' }));
            }}
          >
            <Ionicons
              name="male"
              size={18}
              color={gender === 'male' ? theme.colors.dark.onPrimary : theme.colors.dark.onSurfaceVariant}
            />
            <Text style={[styles.genderChipText, gender === 'male' && styles.genderChipTextActive]}>
              Male
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.genderChip, gender === 'female' && styles.genderChipActive]}
            onPress={() => {
              setGender('female');
              setErrors((prev) => ({ ...prev, gender: '' }));
            }}
          >
            <Ionicons
              name="female"
              size={18}
              color={gender === 'female' ? theme.colors.dark.onPrimary : theme.colors.dark.onSurfaceVariant}
            />
            <Text style={[styles.genderChipText, gender === 'female' && styles.genderChipTextActive]}>
              Female
            </Text>
          </TouchableOpacity>
        </View>
        {errors.gender ? <Text style={styles.errorText}>{errors.gender}</Text> : null}
      </View>

      {/* Age Input */}
      <View style={styles.sectionCard}>
        <Text style={styles.fieldLabel}>Age (Years) *</Text>
        <TextInput
          style={[styles.textInput, errors.age ? styles.textInputError : undefined]}
          placeholder="e.g. 25"
          placeholderTextColor={theme.colors.dark.outline}
          keyboardType="numeric"
          value={ageStr}
          onChangeText={(val) => {
            setAgeStr(val);
            setErrors((prev) => ({ ...prev, age: '' }));
          }}
        />
        {errors.age ? <Text style={styles.errorText}>{errors.age}</Text> : null}
      </View>

      {/* Inputs per Unit System */}
      {unitSystem === 'metric' ? (
        <>
          <InputCard
            label="Height (cm) *"
            value={heightCmStr}
            onChangeText={(val) => {
              setHeightCmStr(val);
              setErrors((prev) => ({ ...prev, height: '' }));
            }}
            placeholder="e.g. 175"
            suffix="cm"
            error={errors.height}
          />

          <InputCard
            label="Weight (kg) *"
            value={weightKgStr}
            onChangeText={(val) => {
              setWeightKgStr(val);
              setErrors((prev) => ({ ...prev, weight: '' }));
            }}
            placeholder="e.g. 70"
            suffix="kg"
            error={errors.weight}
          />
        </>
      ) : (
        <>
          <View style={styles.sectionCard}>
            <Text style={styles.fieldLabel}>Height (Feet & Inches) *</Text>
            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <TextInput
                  style={[styles.textInput, errors.height ? styles.textInputError : undefined]}
                  placeholder="Feet (e.g. 5)"
                  placeholderTextColor={theme.colors.dark.outline}
                  keyboardType="numeric"
                  value={heightFtStr}
                  onChangeText={(val) => {
                    setHeightFtStr(val);
                    setErrors((prev) => ({ ...prev, height: '' }));
                  }}
                />
              </View>
              <View style={styles.halfInput}>
                <TextInput
                  style={[styles.textInput, errors.height ? styles.textInputError : undefined]}
                  placeholder="Inches (e.g. 10)"
                  placeholderTextColor={theme.colors.dark.outline}
                  keyboardType="numeric"
                  value={heightInStr}
                  onChangeText={(val) => {
                    setHeightInStr(val);
                    setErrors((prev) => ({ ...prev, height: '' }));
                  }}
                />
              </View>
            </View>
            {errors.height ? <Text style={styles.errorText}>{errors.height}</Text> : null}
          </View>

          <InputCard
            label="Weight (lbs) *"
            value={weightLbsStr}
            onChangeText={(val) => {
              setWeightLbsStr(val);
              setErrors((prev) => ({ ...prev, weight: '' }));
            }}
            placeholder="e.g. 160"
            suffix="lbs"
            error={errors.weight}
          />
        </>
      )}

      {/* Calculate Button */}
      <TouchableOpacity style={styles.calculateBtn} onPress={handleCalculate} activeOpacity={0.8}>
        <Ionicons name="calculator-outline" size={20} color={theme.colors.dark.onPrimary} />
        <Text style={styles.calculateBtnText}>Calculate Macros</Text>
      </TouchableOpacity>

      {/* Result Display */}
      {result && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>Your Daily Macro Target</Text>
            <TouchableOpacity onPress={handleCopyResult}>
              <Ionicons name="copy-outline" size={20} color={theme.colors.dark.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.valueContainer}>
            <Text style={styles.numberValue}>{result.targetCalories}</Text>
            <Text style={styles.unitText}>kcal/day</Text>
          </View>

          {/* Macro Breakdown Grid */}
          <View style={styles.macroGrid}>
            <View style={[styles.macroCard, { borderColor: '#E53935' }]}>
              <Text style={styles.macroTitle}>Protein ({result.proteinPercent}%)</Text>
              <Text style={[styles.macroGrams, { color: '#E53935' }]}>{result.proteinGrams}g</Text>
              <Text style={styles.macroCals}>{result.proteinCalories} kcal</Text>
            </View>

            <View style={[styles.macroCard, { borderColor: '#4CAF50' }]}>
              <Text style={styles.macroTitle}>Carbs ({result.carbsPercent}%)</Text>
              <Text style={[styles.macroGrams, { color: '#4CAF50' }]}>{result.carbsGrams}g</Text>
              <Text style={styles.macroCals}>{result.carbsCalories} kcal</Text>
            </View>

            <View style={[styles.macroCard, { borderColor: '#FFB74D' }]}>
              <Text style={styles.macroTitle}>Fats ({result.fatPercent}%)</Text>
              <Text style={[styles.macroGrams, { color: '#FFB74D' }]}>{result.fatGrams}g</Text>
              <Text style={styles.macroCals}>{result.fatCalories} kcal</Text>
            </View>
          </View>

          <Text style={styles.tipText}>{result.healthTip}</Text>
        </View>
      )}

      {/* Formula Info Modal */}
      <Modal visible={showFormulaModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Macronutrient Formula</Text>
            <Text style={styles.modalSub}>
              1. BMR calculated via Mifflin-St Jeor Formula.{'\n'}
              2. TDEE = BMR × Activity Multiplier.{'\n'}
              3. Target Calories = TDEE adjusted for Goal (Deficit / Surplus).{'\n'}
              4. Grams calculated at 4 kcal/g for Protein & Carbs, and 9 kcal/g for Fat.
            </Text>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowFormulaModal(false)}>
              <Text style={styles.modalCloseText}>Got It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* AdBanner */}
      <AdBanner />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.hero,
  },
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.dark.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.shapes.large,
    marginBottom: theme.spacing.lg,
  },
  headerTextGroup: {
    flex: 1,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.dark.onSurface,
  },
  subheading: {
    fontSize: 12,
    color: theme.colors.dark.onSurfaceVariant,
    marginTop: 2,
  },
  infoIconBtn: {
    padding: 4,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.dark.surfaceVariant,
    borderRadius: theme.shapes.medium,
    padding: 4,
    marginBottom: theme.spacing.lg,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: theme.shapes.small,
  },
  toggleBtnActive: {
    backgroundColor: theme.colors.dark.primaryContainer,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.dark.onSurfaceVariant,
  },
  toggleTextActive: {
    color: theme.colors.dark.onPrimaryContainer,
  },
  sectionCard: {
    backgroundColor: theme.colors.dark.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.shapes.large,
    marginBottom: theme.spacing.md,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.dark.onSurface,
    marginBottom: theme.spacing.sm,
  },
  goalRow: {
    flexDirection: 'row',
    gap: 8,
  },
  goalChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: theme.shapes.medium,
    backgroundColor: theme.colors.dark.surfaceVariant,
    gap: 4,
  },
  goalChipActive: {
    backgroundColor: theme.colors.dark.primary,
  },
  goalChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.dark.onSurfaceVariant,
  },
  goalChipTextActive: {
    color: theme.colors.dark.onPrimary,
  },
  activityPickerGroup: {
    gap: 8,
  },
  activityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  activityOptionActive: {},
  activityOptionText: {
    fontSize: 13,
    color: theme.colors.dark.onSurfaceVariant,
  },
  activityOptionTextActive: {
    color: theme.colors.dark.onSurface,
    fontWeight: '600',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.colors.dark.surfaceVariant,
    gap: 6,
  },
  genderChipActive: {
    backgroundColor: theme.colors.dark.primary,
  },
  genderChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.dark.onSurfaceVariant,
  },
  genderChipTextActive: {
    color: theme.colors.dark.onPrimary,
  },
  textInput: {
    backgroundColor: theme.colors.dark.surfaceVariant,
    color: theme.colors.dark.onSurface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.shapes.medium,
    fontSize: 15,
  },
  textInputError: {
    borderWidth: 1,
    borderColor: theme.colors.dark.error,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  errorText: {
    color: theme.colors.dark.error,
    fontSize: 12,
    marginTop: 4,
  },
  calculateBtn: {
    backgroundColor: theme.colors.dark.primary,
    paddingVertical: 14,
    borderRadius: theme.shapes.large,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    minHeight: 50,
  },
  calculateBtnText: {
    color: theme.colors.dark.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  resultCard: {
    backgroundColor: theme.colors.dark.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.shapes.large,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  resultHeader: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.dark.onSurface,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: theme.spacing.lg,
  },
  numberValue: {
    fontSize: 44,
    fontWeight: '800',
    color: theme.colors.dark.primary,
  },
  unitText: {
    fontSize: 16,
    color: theme.colors.dark.onSurfaceVariant,
  },
  macroGrid: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: theme.spacing.lg,
  },
  macroCard: {
    flex: 1,
    backgroundColor: theme.colors.dark.surfaceVariant,
    borderRadius: theme.shapes.medium,
    padding: theme.spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
  },
  macroTitle: {
    fontSize: 11,
    color: theme.colors.dark.onSurfaceVariant,
    fontWeight: '600',
    marginBottom: 4,
  },
  macroGrams: {
    fontSize: 18,
    fontWeight: '800',
  },
  macroCals: {
    fontSize: 10,
    color: theme.colors.dark.outline,
    marginTop: 2,
  },
  tipText: {
    fontSize: 13,
    color: theme.colors.dark.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  modalContent: {
    backgroundColor: theme.colors.dark.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.shapes.large,
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.dark.onSurface,
    marginBottom: theme.spacing.md,
  },
  modalSub: {
    fontSize: 13,
    color: theme.colors.dark.onSurfaceVariant,
    lineHeight: 20,
  },
  modalCloseBtn: {
    backgroundColor: theme.colors.dark.primary,
    paddingVertical: 10,
    borderRadius: theme.shapes.medium,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  modalCloseText: {
    color: theme.colors.dark.onPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
});
