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
import { calculateBmr, calculateBmrImperial, BmrResult } from '../utils/bmrCalculator';
import { adMobManager } from '../services/admob/adMobManager';
import { AdBanner } from '../components/AdBanner';

export const BmrScreen = () => {
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [gender, setGender] = useState<'male' | 'female' | ''>('male');
  const [ageStr, setAgeStr] = useState('25');

  // Metric inputs
  const [heightCmStr, setHeightCmStr] = useState('');
  const [weightKgStr, setWeightKgStr] = useState('');

  // Imperial inputs
  const [heightFtStr, setHeightFtStr] = useState('');
  const [heightInStr, setHeightInStr] = useState('');
  const [weightLbsStr, setWeightLbsStr] = useState('');

  const [result, setResult] = useState<BmrResult | null>(null);
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

    let bmrRes: BmrResult;
    if (validation.data.unitSystem === 'imperial' && validation.data.weightLbs && validation.data.totalInches) {
      bmrRes = calculateBmrImperial(
        validation.data.gender,
        validation.data.weightLbs,
        validation.data.totalInches,
        validation.data.age,
      );
    } else {
      bmrRes = calculateBmr(
        validation.data.gender,
        validation.data.heightCm!,
        validation.data.weightKg!,
        validation.data.age,
      );
    }

    setResult(bmrRes);

    const inputsJson = JSON.stringify({
      gender: validation.data.gender,
      age: validation.data.age,
      unitSystem: validation.data.unitSystem,
      heightCm: validation.data.heightCm,
      weightKg: validation.data.weightKg,
      totalInches: validation.data.totalInches,
      weightLbs: validation.data.weightLbs,
    });

    try {
      await calculationsDb.add({
        type: 'BMR',
        inputs_json: inputsJson,
        result: `${bmrRes.bmr} kcal/day`,
        category: 'Maintenance: ' + bmrRes.sedentary + ' kcal',
        date: Date.now(),
      });
    } catch (e) {
      console.warn('Failed to persist BMR calculation:', e);
    }

    // Sync with storage history
    storage.addHistory('BMR', `BMR: ${bmrRes.bmr} kcal/day`);

    // Register calculation for AdMob Interstitial triggering & frequency capping
    adMobManager.registerCalculation();
  };

  const handleCopyResult = () => {
    if (result) {
      Clipboard.setString(`BMR: ${result.bmr} kcal/day`);
      Alert.alert('Copied to Clipboard', `BMR result copied: ${result.bmr} kcal/day`);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Info Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.heading}>Basal Metabolic Rate (BMR)</Text>
          <Text style={styles.subheading}>Mifflin-St Jeor daily calorie expenditure</Text>
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
      <TouchableOpacity style={styles.calculateBtn} onPress={handleCalculate} activeOpacity={0.8}>
        <Ionicons name="calculator-outline" size={20} color={theme.colors.dark.onPrimary} />
        <Text style={styles.calculateBtnText}>Calculate BMR</Text>
      </TouchableOpacity>

      {/* Result Display */}
      {result && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>Your Basal Metabolic Rate</Text>
            <TouchableOpacity onPress={handleCopyResult}>
              <Ionicons name="copy-outline" size={20} color={theme.colors.dark.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.bmrValueContainer}>
            <Text style={styles.bmrNumber}>{result.bmr}</Text>
            <Text style={styles.bmrUnit}>kcal/day</Text>
          </View>

          <View style={styles.activityBox}>
            <Text style={styles.activityHeader}>Estimated Daily Maintenance Calories:</Text>
            <Text style={styles.activityItem}>
              • Sedentary (little/no exercise): <Text style={styles.boldCal}>{result.sedentary} kcal</Text>
            </Text>
            <Text style={styles.activityItem}>
              • Lightly Active (1-3 days/wk): <Text style={styles.boldCal}>{result.lightlyActive} kcal</Text>
            </Text>
            <Text style={styles.activityItem}>
              • Moderately Active (3-5 days/wk): <Text style={styles.boldCal}>{result.moderatelyActive} kcal</Text>
            </Text>
            <Text style={styles.activityItem}>
              • Very Active (6-7 days/wk): <Text style={styles.boldCal}>{result.veryActive} kcal</Text>
            </Text>
            <Text style={styles.activityItem}>
              • Extra Active (physical job/2x day): <Text style={styles.boldCal}>{result.extraActive} kcal</Text>
            </Text>
          </View>

          <Text style={styles.tipText}>{result.healthTip}</Text>
        </View>
      )}

      {/* Formula Info Modal */}
      <Modal visible={showFormulaModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>BMR Mifflin-St Jeor Formula</Text>

            <Text style={styles.formulaHeading}>Male:</Text>
            <Text style={styles.formulaCode}>10 × W(kg) + 6.25 × H(cm) - 5 × Age + 5</Text>

            <Text style={styles.formulaHeading}>Female:</Text>
            <Text style={styles.formulaCode}>10 × W(kg) + 6.25 × H(cm) - 5 × Age - 161</Text>

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
  bmrValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: theme.spacing.lg,
  },
  bmrNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: theme.colors.dark.primary,
  },
  bmrUnit: {
    fontSize: 16,
    color: theme.colors.dark.onSurfaceVariant,
  },
  activityBox: {
    backgroundColor: theme.colors.dark.surfaceVariant,
    borderRadius: theme.shapes.medium,
    padding: theme.spacing.md,
    width: '100%',
    marginBottom: theme.spacing.lg,
    gap: 6,
  },
  activityHeader: {
    color: theme.colors.dark.primary,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4,
  },
  activityItem: {
    color: theme.colors.dark.onSurfaceVariant,
    fontSize: 13,
  },
  boldCal: {
    fontWeight: '700',
    color: theme.colors.dark.onSurface,
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
