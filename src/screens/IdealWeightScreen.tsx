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
import { validateIdealWeightInputs, IdealWeightInputParams } from '../utils/validation';
import { calculateIdealWeight, IdealWeightResult } from '../utils/idealWeightCalculator';
import { adMobManager } from '../services/admob/adMobManager';
import { AdBanner } from '../components/AdBanner';

export const IdealWeightScreen = () => {
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [gender, setGender] = useState<'male' | 'female' | ''>('male');

  // Metric (cm) / Imperial (ft/in)
  const [heightCmStr, setHeightCmStr] = useState('');
  const [heightFtStr, setHeightFtStr] = useState('');
  const [heightInStr, setHeightInStr] = useState('');

  const [result, setResult] = useState<IdealWeightResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  const handleCalculate = async () => {
    const params: IdealWeightInputParams = {
      gender,
      unitSystem,
      heightCmStr,
      heightFtStr,
      heightInStr,
    };

    const validation = validateIdealWeightInputs(params);

    if (!validation.isValid || !validation.data) {
      setErrors(validation.errors);
      setResult(null);
      return;
    }

    setErrors({});

    const calcRes = calculateIdealWeight(
      validation.data.gender,
      validation.data.heightCm,
      validation.data.unitSystem,
    );

    setResult(calcRes);

    const inputsJson = JSON.stringify({
      gender: validation.data.gender,
      unitSystem: validation.data.unitSystem,
      heightCm: validation.data.heightCm,
    });

    try {
      await calculationsDb.add({
        type: 'Ideal Weight',
        inputs_json: inputsJson,
        result: `${calcRes.devine} ${calcRes.unit}`,
        category: `Range: ${calcRes.minRange} - ${calcRes.maxRange} ${calcRes.unit}`,
        date: Date.now(),
      });
    } catch (e) {
      console.warn('Failed to persist Ideal Weight calculation:', e);
    }

    storage.addHistory(
      'Ideal Weight',
      `Ideal Weight: ${calcRes.devine} ${calcRes.unit} (${calcRes.minRange}-${calcRes.maxRange} ${calcRes.unit})`,
    );

    // Register calculation for AdMob Interstitial triggering & frequency capping
    adMobManager.registerCalculation();
  };

  const handleCopyResult = () => {
    if (result) {
      Clipboard.setString(
        `Ideal Weight (Devine): ${result.devine} ${result.unit} (Range: ${result.minRange} - ${result.maxRange} ${result.unit})`,
      );
      Alert.alert('Copied to Clipboard', `Ideal weight copied: ${result.devine} ${result.unit}`);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Info Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.heading}>Ideal Body Weight</Text>
          <Text style={styles.subheading}>Calculated via Devine, Robinson & Miller formulas</Text>
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

      {/* Height Input */}
      {unitSystem === 'metric' ? (
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
      ) : (
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
      )}

      {/* Calculate Button */}
      <TouchableOpacity style={styles.calculateBtn} onPress={handleCalculate} activeOpacity={0.8}>
        <Ionicons name="calculator-outline" size={20} color={theme.colors.dark.onPrimary} />
        <Text style={styles.calculateBtnText}>Calculate Ideal Weight</Text>
      </TouchableOpacity>

      {/* Result Display */}
      {result && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>Your Ideal Body Weight</Text>
            <TouchableOpacity onPress={handleCopyResult}>
              <Ionicons name="copy-outline" size={20} color={theme.colors.dark.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.weightValueContainer}>
            <Text style={styles.weightNumber}>{result.devine}</Text>
            <Text style={styles.weightUnit}>{result.unit}</Text>
          </View>

          <View style={styles.rangeBadge}>
            <Text style={styles.rangeBadgeText}>
              Healthy Target Range: {result.minRange} - {result.maxRange} {result.unit}
            </Text>
          </View>

          {/* Breakdown by Formula */}
          <View style={styles.formulasBox}>
            <Text style={styles.formulasHeader}>Breakdown by Clinical Formula:</Text>
            <Text style={styles.formulaItem}>
              • Devine Formula (Standard): <Text style={styles.boldVal}>{result.devine} {result.unit}</Text>
            </Text>
            <Text style={styles.formulaItem}>
              • Robinson Formula: <Text style={styles.boldVal}>{result.robinson} {result.unit}</Text>
            </Text>
            <Text style={styles.formulaItem}>
              • Miller Formula: <Text style={styles.boldVal}>{result.miller} {result.unit}</Text>
            </Text>
            <Text style={styles.formulaItem}>
              • Hamwi Formula: <Text style={styles.boldVal}>{result.hamwi} {result.unit}</Text>
            </Text>
          </View>

          <Text style={styles.tipText}>{result.healthTip}</Text>
        </View>
      )}

      {/* Formula Info Modal */}
      <Modal visible={showFormulaModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ideal Weight Formulas</Text>

            <Text style={styles.formulaHeading}>Devine Formula (1974):</Text>
            <Text style={styles.formulaCode}>
              Male: 50 kg + 2.3 kg per inch over 5 feet{'\n'}
              Female: 45.5 kg + 2.3 kg per inch over 5 feet
            </Text>

            <Text style={styles.formulaHeading}>Robinson Formula (1983):</Text>
            <Text style={styles.formulaCode}>
              Male: 52 kg + 1.9 kg per inch over 5 feet{'\n'}
              Female: 49 kg + 1.7 kg per inch over 5 feet
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
  weightValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: theme.spacing.xs,
  },
  weightNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: theme.colors.dark.primary,
  },
  weightUnit: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.dark.onSurfaceVariant,
  },
  rangeBadge: {
    backgroundColor: theme.colors.dark.primaryContainer,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: theme.spacing.lg,
  },
  rangeBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.dark.onPrimaryContainer,
  },
  formulasBox: {
    backgroundColor: theme.colors.dark.surfaceVariant,
    borderRadius: theme.shapes.medium,
    padding: theme.spacing.md,
    width: '100%',
    marginBottom: theme.spacing.lg,
    gap: 6,
  },
  formulasHeader: {
    color: theme.colors.dark.primary,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4,
  },
  formulaItem: {
    color: theme.colors.dark.onSurfaceVariant,
    fontSize: 13,
  },
  boldVal: {
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
    fontSize: 12,
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
