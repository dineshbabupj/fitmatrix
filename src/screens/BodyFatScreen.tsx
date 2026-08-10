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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InputCard } from '../components/InputCard';
import { storage } from '../data/storage';
import { calculationsDb } from '../data/db';
import { theme } from '../theme/theme';
import { validateBodyFatInputs, BodyFatInputParams } from '../utils/validation';
import { calculateBodyFat, BodyFatResult } from '../utils/bodyFatCalculator';
import { adMobManager } from '../services/admob/adMobManager';
import { AdBanner } from '../components/AdBanner';

export const BodyFatScreen = () => {
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [gender, setGender] = useState<'male' | 'female' | ''>('male');

  const [heightStr, setHeightStr] = useState('');
  const [neckStr, setNeckStr] = useState('');
  const [waistStr, setWaistStr] = useState('');
  const [hipStr, setHipStr] = useState('');
  const [weightStr, setWeightStr] = useState(''); // Optional for mass breakdown

  const [result, setResult] = useState<BodyFatResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  const handleCalculate = async () => {
    setGeneralError('');

    const params: BodyFatInputParams = {
      gender,
      unitSystem,
      heightStr,
      neckStr,
      waistStr,
      hipStr,
    };

    const validation = validateBodyFatInputs(params);

    if (!validation.isValid || !validation.data) {
      setErrors(validation.errors);
      setResult(null);
      return;
    }

    setErrors({});

    const optionalWeightKg = parseFloat(weightStr)
      ? unitSystem === 'imperial'
        ? parseFloat(weightStr) * 0.453592
        : parseFloat(weightStr)
      : undefined;

    const calcRes = calculateBodyFat(
      validation.data.gender,
      validation.data.heightCm,
      validation.data.neckCm,
      validation.data.waistCm,
      validation.data.hipCm,
      optionalWeightKg,
    );

    if (typeof calcRes === 'string') {
      setGeneralError(calcRes);
      setResult(null);
      return;
    }

    setResult(calcRes);

    const inputsJson = JSON.stringify({
      gender: validation.data.gender,
      unitSystem: validation.data.unitSystem,
      heightCm: validation.data.heightCm,
      neckCm: validation.data.neckCm,
      waistCm: validation.data.waistCm,
      hipCm: validation.data.hipCm,
    });

    try {
      await calculationsDb.add({
        type: 'Body Fat',
        inputs_json: inputsJson,
        result: `${calcRes.bodyFatPercentage}%`,
        category: calcRes.category,
        date: Date.now(),
      });
    } catch (e) {
      console.warn('Failed to persist Body Fat calculation:', e);
    }

    storage.addHistory('Body Fat', `Body Fat: ${calcRes.bodyFatPercentage}% (${calcRes.category})`);

    // Register calculation for AdMob Interstitial triggering & frequency capping
    adMobManager.registerCalculation();
  };

  const handleCopyResult = () => {
    if (result) {
      Clipboard.setString(`Body Fat: ${result.bodyFatPercentage}% - ${result.category}`);
      Alert.alert('Copied to Clipboard', `Body Fat result copied: ${result.bodyFatPercentage}%`);
    }
  };

  const unitSuffix = unitSystem === 'metric' ? 'cm' : 'in';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Info Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.heading}>Body Fat Percentage</Text>
          <Text style={styles.subheading}>US Navy tape measure method</Text>
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
            setGeneralError('');
          }}
        >
          <Text style={[styles.toggleText, unitSystem === 'metric' && styles.toggleTextActive]}>
            Metric (cm)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, unitSystem === 'imperial' && styles.toggleBtnActive]}
          onPress={() => {
            setUnitSystem('imperial');
            setErrors({});
            setGeneralError('');
          }}
        >
          <Text style={[styles.toggleText, unitSystem === 'imperial' && styles.toggleTextActive]}>
            Imperial (inches)
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

      {/* Inputs */}
      <InputCard
        label={`Height (${unitSuffix}) *`}
        value={heightStr}
        onChangeText={(val) => {
          setHeightStr(val);
          setErrors((prev) => ({ ...prev, height: '' }));
        }}
        placeholder={unitSystem === 'metric' ? 'e.g. 175' : 'e.g. 69'}
        suffix={unitSuffix}
        error={errors.height}
      />

      <InputCard
        label={`Neck Circumference (${unitSuffix}) *`}
        value={neckStr}
        onChangeText={(val) => {
          setNeckStr(val);
          setErrors((prev) => ({ ...prev, neck: '' }));
        }}
        placeholder={unitSystem === 'metric' ? 'e.g. 38' : 'e.g. 15'}
        suffix={unitSuffix}
        error={errors.neck}
      />

      <InputCard
        label={`Waist Circumference (${unitSuffix}) *`}
        value={waistStr}
        onChangeText={(val) => {
          setWaistStr(val);
          setErrors((prev) => ({ ...prev, waist: '' }));
        }}
        placeholder={unitSystem === 'metric' ? 'e.g. 85' : 'e.g. 33.5'}
        suffix={unitSuffix}
        error={errors.waist}
      />

      {gender === 'female' && (
        <InputCard
          label={`Hip Circumference (${unitSuffix}) *`}
          value={hipStr}
          onChangeText={(val) => {
            setHipStr(val);
            setErrors((prev) => ({ ...prev, hip: '' }));
          }}
          placeholder={unitSystem === 'metric' ? 'e.g. 95' : 'e.g. 37.5'}
          suffix={unitSuffix}
          error={errors.hip}
        />
      )}

      <InputCard
        label={`Optional Weight (${unitSystem === 'metric' ? 'kg' : 'lbs'})`}
        value={weightStr}
        onChangeText={setWeightStr}
        placeholder="Enter weight to see fat/lean mass"
        suffix={unitSystem === 'metric' ? 'kg' : 'lbs'}
      />

      {generalError ? <Text style={styles.generalErrorText}>{generalError}</Text> : null}

      {/* Calculate Button */}
      <TouchableOpacity style={styles.calculateBtn} onPress={handleCalculate} activeOpacity={0.8}>
        <Ionicons name="calculator-outline" size={20} color={theme.colors.dark.onPrimary} />
        <Text style={styles.calculateBtnText}>Calculate Body Fat</Text>
      </TouchableOpacity>

      {/* Result Display */}
      {result && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>Body Fat Percentage</Text>
            <TouchableOpacity onPress={handleCopyResult}>
              <Ionicons name="copy-outline" size={20} color={theme.colors.dark.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.bfValueContainer}>
            <Text style={[styles.bfNumber, { color: result.color }]}>
              {result.bodyFatPercentage}%
            </Text>
          </View>

          <View style={[styles.categoryBadge, { backgroundColor: result.color + '22' }]}>
            <Text style={[styles.categoryText, { color: result.color }]}>{result.category}</Text>
          </View>

          {result.fatMassKg !== null && result.leanMassKg !== null && (
            <View style={styles.massBox}>
              <Text style={styles.massItem}>
                Fat Mass: <Text style={styles.boldMass}>{result.fatMassKg} kg</Text>
              </Text>
              <Text style={styles.massItem}>
                Lean Mass: <Text style={styles.boldMass}>{result.leanMassKg} kg</Text>
              </Text>
            </View>
          )}

          <Text style={styles.tipText}>{result.healthTip}</Text>
        </View>
      )}

      {/* Formula Info Modal */}
      <Modal visible={showFormulaModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>US Navy Body Fat Formulas</Text>

            <Text style={styles.formulaHeading}>Men:</Text>
            <Text style={styles.formulaCode}>
              495 / (1.0324 - 0.19077 × log10(waist-neck) + 0.15456 × log10(height)) - 450
            </Text>

            <Text style={styles.formulaHeading}>Women:</Text>
            <Text style={styles.formulaCode}>
              495 / (1.29579 - 0.35004 × log10(waist+hip-neck) + 0.221 × log10(height)) - 450
            </Text>

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
  errorText: {
    color: theme.colors.dark.error,
    fontSize: 12,
    marginTop: 4,
  },
  generalErrorText: {
    color: theme.colors.dark.error,
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 8,
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
  bfValueContainer: {
    marginBottom: theme.spacing.xs,
  },
  bfNumber: {
    fontSize: 48,
    fontWeight: '800',
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
  massBox: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: theme.colors.dark.surfaceVariant,
    padding: theme.spacing.md,
    borderRadius: theme.shapes.medium,
    marginBottom: theme.spacing.md,
  },
  massItem: {
    fontSize: 13,
    color: theme.colors.dark.onSurfaceVariant,
  },
  boldMass: {
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
    fontSize: 11,
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
