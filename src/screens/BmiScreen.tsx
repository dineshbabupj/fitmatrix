import React, { useState, useEffect } from 'react';
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
import { validateBmiInputs, BmiInputParams } from '../utils/validation';
import { computeBmi, BmiResultData } from '../utils/bmiCalculator';
import { adMobManager } from '../services/admob/adMobManager';
import { AdBanner } from '../components/AdBanner';

import { useSettingsStore } from '../store/settingsStore';

export const BmiScreen = () => {
  const globalUnitSystem = useSettingsStore((state) => state.unitSystem);
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>(globalUnitSystem);

  useEffect(() => {
    setUnitSystem(globalUnitSystem);
  }, [globalUnitSystem]);
  const [gender, setGender] = useState<'male' | 'female' | ''>('male');
  const [ageStr, setAgeStr] = useState('25');

  // Metric inputs
  const [heightCmStr, setHeightCmStr] = useState('');
  const [weightKgStr, setWeightKgStr] = useState('');

  // Imperial inputs
  const [heightFtStr, setHeightFtStr] = useState('');
  const [heightInStr, setHeightInStr] = useState('');
  const [weightLbsStr, setWeightLbsStr] = useState('');

  const [result, setResult] = useState<BmiResultData | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleCalculate = async () => {
    const params: BmiInputParams = {
      gender,
      ageStr,
      unitSystem,
      heightCmStr,
      weightKgStr,
      heightFtStr,
      heightInStr,
      weightLbsStr,
    };

    const validation = validateBmiInputs(params);

    if (!validation.isValid || !validation.data) {
      setErrors(validation.errors);
      setResult(null);
      return;
    }

    // Clear previous errors
    setErrors({});

    // Compute BMI
    const computedResult = computeBmi(validation.data);
    setResult(computedResult);
    setIsSaved(true);

    // Prepare JSON inputs payload
    const inputsJson = JSON.stringify({
      gender: validation.data.gender,
      age: validation.data.age,
      unitSystem: validation.data.unitSystem,
      heightCm: validation.data.heightCm,
      weightKg: validation.data.weightKg,
      totalInches: validation.data.totalInches,
      weightLbs: validation.data.weightLbs,
    });

    // Save to SQLite Database
    try {
      await calculationsDb.add({
        type: 'BMI',
        inputs_json: inputsJson,
        result: `${computedResult.bmi} kg/m²`,
        category: computedResult.category,
        date: Date.now(),
      });
    } catch (e) {
      console.warn('Failed to persist to SQLite db:', e);
    }

    // Sync with storage history
    storage.addHistory('BMI', `BMI: ${computedResult.bmi} (${computedResult.category})`);

    // Register calculation for AdMob Interstitial triggering & frequency capping
    adMobManager.registerCalculation();
  };

  const handleCopyResult = () => {
    if (result) {
      Clipboard.setString(`BMI: ${result.bmi} kg/m² - ${result.category}`);
      Alert.alert('Copied', `Result copied to clipboard: ${result.bmi} (${result.category})`);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Info Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.heading}>Body Mass Index (BMI)</Text>
          <Text style={styles.subheading}>Calculate your body composition category</Text>
        </View>
        <TouchableOpacity
          style={styles.infoIconBtn}
          onPress={() => setShowFormulaModal(true)}
          accessibilityRole="button"
          accessibilityLabel="View BMI Formula information"
          accessibilityHint="Double tap to open popup explaining BMI formulas"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="information-circle-outline" size={24} color={theme.colors.dark.primary} />
        </TouchableOpacity>
      </View>

      {/* Unit Selector Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleBtn, unitSystem === 'metric' && styles.toggleBtnActive]}
          onPress={() => {
            setUnitSystem('metric');
            setErrors({});
          }}
          accessibilityRole="button"
          accessibilityState={{ selected: unitSystem === 'metric' }}
          accessibilityLabel="Metric unit system"
          accessibilityHint="Sets height to cm and weight to kg"
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
          accessibilityRole="button"
          accessibilityState={{ selected: unitSystem === 'imperial' }}
          accessibilityLabel="Imperial unit system"
          accessibilityHint="Sets height to feet/inches and weight to lbs"
        >
          <Text style={[styles.toggleText, unitSystem === 'imperial' && styles.toggleTextActive]}>
            Imperial (ft, in / lbs)
          </Text>
        </TouchableOpacity>
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
            accessibilityRole="radio"
            accessibilityState={{ selected: gender === 'male' }}
            accessibilityLabel="Male gender"
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
            accessibilityRole="radio"
            accessibilityState={{ selected: gender === 'female' }}
            accessibilityLabel="Female gender"
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
            placeholder="e.g. 175 (Range: 50-300 cm)"
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
            placeholder="e.g. 70 (Range: 2-500 kg)"
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
            placeholder="e.g. 160 (Range: 5-1100 lbs)"
            suffix="lbs"
            error={errors.weight}
          />
        </>
      )}

      {/* Calculate Button */}
      <TouchableOpacity
        style={styles.calculateBtn}
        onPress={handleCalculate}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Calculate BMI"
        accessibilityHint="Computes your Body Mass Index score and category"
      >
        <Ionicons name="calculator-outline" size={20} color={theme.colors.dark.onPrimary} />
        <Text style={styles.calculateBtnText}>Calculate BMI</Text>
      </TouchableOpacity>

      {/* Result Display */}
      {result && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>Your BMI Result</Text>
            <TouchableOpacity onPress={handleCopyResult}>
              <Ionicons name="copy-outline" size={20} color={theme.colors.dark.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.bmiValueContainer}>
            <Text style={[styles.bmiNumber, { color: result.color }]}>{result.bmi}</Text>
            <Text style={styles.bmiUnit}>kg/m²</Text>
          </View>

          <View style={[styles.categoryBadge, { backgroundColor: result.color + '22' }]}>
            <Text style={[styles.categoryText, { color: result.color }]}>{result.category}</Text>
          </View>

          <Text style={styles.tipText}>{result.healthTip}</Text>

          {/* Action Row: Save to History & Copy */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.saveHistoryBtn, isSaved && styles.saveHistoryBtnDone]}
              onPress={() => {
                if (result) {
                  storage.addHistory('BMI', `BMI: ${result.bmi} (${result.category})`);
                  setIsSaved(true);
                  Alert.alert('Saved', 'Calculation saved to History logs!');
                }
              }}
              accessibilityRole="button"
              accessibilityLabel="Save to History"
            >
              <Ionicons
                name={isSaved ? 'checkmark-circle' : 'bookmark-outline'}
                size={18}
                color={isSaved ? '#4CAF50' : theme.colors.dark.primary}
              />
              <Text style={[styles.saveHistoryText, isSaved && styles.saveHistoryTextDone]}>
                {isSaved ? 'Saved to History' : 'Save to History'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.copyBtn}
              onPress={handleCopyResult}
              accessibilityRole="button"
              accessibilityLabel="Copy Result"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="copy-outline" size={18} color={theme.colors.dark.onSurfaceVariant} />
              <Text style={styles.copyBtnText}>Copy</Text>
            </TouchableOpacity>
          </View>

          {/* Reference Scale */}
          <View style={styles.scaleContainer}>
            <Text style={styles.scaleTitle}>BMI Standard Ranges:</Text>
            <View style={styles.scaleItem}>
              <View style={[styles.scaleDot, { backgroundColor: '#2196F3' }]} />
              <Text style={styles.scaleText}>Underweight: &lt; 18.5</Text>
            </View>
            <View style={styles.scaleItem}>
              <View style={[styles.scaleDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.scaleText}>Normal weight: 18.5 - 24.9</Text>
            </View>
            <View style={styles.scaleItem}>
              <View style={[styles.scaleDot, { backgroundColor: '#FF9800' }]} />
              <Text style={styles.scaleText}>Overweight: 25.0 - 29.9</Text>
            </View>
            <View style={styles.scaleItem}>
              <View style={[styles.scaleDot, { backgroundColor: '#F44336' }]} />
              <Text style={styles.scaleText}>Obese: ≥ 30.0</Text>
            </View>
          </View>
        </View>
      )}

      {/* Formula Info Modal */}
      <Modal visible={showFormulaModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>BMI Calculation Formulas</Text>

            <Text style={styles.formulaHeading}>Metric Units:</Text>
            <Text style={styles.formulaCode}>BMI = Weight (kg) / [Height (m)]²</Text>

            <Text style={styles.formulaHeading}>Imperial Units:</Text>
            <Text style={styles.formulaCode}>BMI = 703 × Weight (lbs) / [Height (in)]²</Text>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowFormulaModal(false)}>
              <Text style={styles.modalCloseText}>Got It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* AdMob Policy-Compliant Banner Ad */}
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
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    minHeight: 48,
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
  bmiValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: theme.spacing.xs,
  },
  bmiNumber: {
    fontSize: 48,
    fontWeight: '800',
  },
  bmiUnit: {
    fontSize: 16,
    color: theme.colors.dark.onSurfaceVariant,
  },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: theme.spacing.md,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '700',
  },
  tipText: {
    fontSize: 13,
    color: theme.colors.dark.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: theme.spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    marginBottom: theme.spacing.lg,
  },
  saveHistoryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    minHeight: 48,
    borderRadius: theme.shapes.medium,
    backgroundColor: theme.colors.dark.primaryContainer + '44',
    borderWidth: 1,
    borderColor: theme.colors.dark.primary,
  },
  saveHistoryBtnDone: {
    backgroundColor: '#4CAF5022',
    borderColor: '#4CAF50',
  },
  saveHistoryText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.dark.primary,
  },
  saveHistoryTextDone: {
    color: '#4CAF50',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 48,
    borderRadius: theme.shapes.medium,
    backgroundColor: theme.colors.dark.surfaceVariant,
  },
  copyBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.dark.onSurfaceVariant,
  },
  scaleContainer: {
    width: '100%',
    backgroundColor: theme.colors.dark.surfaceVariant,
    padding: theme.spacing.md,
    borderRadius: theme.shapes.medium,
    gap: 6,
  },
  scaleTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.dark.onSurface,
    marginBottom: 2,
  },
  scaleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scaleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scaleText: {
    fontSize: 12,
    color: theme.colors.dark.onSurfaceVariant,
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
  formulaHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.dark.primary,
    marginTop: theme.spacing.sm,
  },
  formulaCode: {
    backgroundColor: theme.colors.dark.background,
    color: theme.colors.dark.onSurface,
    padding: theme.spacing.md,
    borderRadius: theme.shapes.small,
    fontSize: 13,
    fontFamily: 'monospace',
    marginTop: 4,
    marginBottom: theme.spacing.sm,
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
