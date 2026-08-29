import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { geminiService, SymptomReport } from '../../../src/services/api/geminiService';
import { theme } from '../../../src/theme/theme';

const DISCLAIMER_ACCEPTED_KEY = 'symptom_checker_disclaimer_v1';

type Mode = 'chat' | 'wizard';

export default function SymptomCheckerScreen() {
  const [mode, setMode] = useState<Mode>('chat');
  const [symptomText, setSymptomText] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<SymptomReport | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  // Wizard state
  const [wizardStep, setWizardStep] = useState(1);
  const [primarySymptom, setPrimarySymptom] = useState('headache');
  const [duration, setDuration] = useState('less_24h');
  const [severeSigns, setSevereSigns] = useState<string[]>([]);

  // Show disclaimer popup on first visit
  useEffect(() => {
    AsyncStorage.getItem(DISCLAIMER_ACCEPTED_KEY).then((val) => {
      if (!val) setShowDisclaimer(true);
    });
  }, []);

  const handleAcceptDisclaimer = async () => {
    await AsyncStorage.setItem(DISCLAIMER_ACCEPTED_KEY, 'accepted');
    setShowDisclaimer(false);
  };

  const handleAiConsult = async () => {
    if (!symptomText.trim()) {
      Alert.alert('Empty Input', 'Please describe your symptoms before consulting.');
      return;
    }

    setLoading(true);
    setReport(null);
    try {
      const res = await geminiService.analyzeSymptoms(symptomText);
      setReport(res);
    } catch (e) {
      Alert.alert('Analysis Failed', 'Could not parse symptoms.');
    } finally {
      setLoading(false);
    }
  };

  const handleWizardSubmit = () => {
    setLoading(true);
    setReport(null);
    try {
      const res = geminiService.calculateTriageFromWizard({
        primarySymptom,
        duration,
        severeSigns,
      });
      setReport(res);
      setWizardStep(4); // Move to results step
    } catch (e) {
      Alert.alert('Calculation Error', 'Could not compute triage advice.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSevereSign = (sign: string) => {
    if (sign === 'none') {
      setSevereSigns(['none']);
      return;
    }
    
    let updated = severeSigns.filter(s => s !== 'none');
    if (updated.includes(sign)) {
      updated = updated.filter(s => s !== sign);
    } else {
      updated.push(sign);
    }
    setSevereSigns(updated);
  };

  const resetWizard = () => {
    setWizardStep(1);
    setPrimarySymptom('headache');
    setDuration('less_24h');
    setSevereSigns([]);
    setReport(null);
  };

  const getRiskColor = (level: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (level) {
      case 'HIGH': return '#E53935';
      case 'MEDIUM': return '#FB8C00';
      case 'LOW': return '#4CAF50';
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'AI Symptom Checker' }} />

      {/* ⚠️ FIRST-TIME DISCLAIMER POPUP — required by Google Play Health policy */}
      <Modal visible={showDisclaimer} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => {}}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconRow}>
              <Ionicons name="medical" size={36} color="#FFA000" />
            </View>
            <Text style={styles.modalTitle}>Medical Disclaimer</Text>
            <Text style={styles.modalBody}>
              <Text style={styles.modalBold}>FitMetrics does not provide medical advice.</Text>
              {'\n\n'}The AI Symptom Checker is designed for{' '}
              <Text style={styles.modalBold}>general wellness guidance only</Text> and is{' '}
              <Text style={styles.modalBold}>NOT a substitute</Text> for professional medical advice,
              diagnosis, or treatment.{'\n\n'}
              Always consult a qualified healthcare professional for any health concerns.
            </Text>
            <TouchableOpacity style={styles.modalAcceptBtn} onPress={handleAcceptDisclaimer} activeOpacity={0.85}>
              <Ionicons name="checkmark-circle" size={20} color="#121212" />
              <Text style={styles.modalAcceptText}>I Understand — Continue</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* ⚠️ PERSISTENT MEDICAL DISCLAIMER BANNER */}
      <View style={styles.disclaimerBanner}>
        <Ionicons name="warning-outline" size={18} color="#FFA000" />
        <Text style={styles.disclaimerText}>
          <Text style={styles.disclaimerBold}>Not a substitute for medical advice.</Text>
          {' '}Always consult a qualified healthcare professional for medical advice, diagnosis, or treatment.
        </Text>
      </View>

      {/* Mode Selector */}
      <View style={styles.modeTabs}>
        <TouchableOpacity
          style={[styles.modeTab, mode === 'chat' && styles.modeTabActive]}
          onPress={() => {
            setMode('chat');
            setReport(null);
          }}
        >
          <Ionicons name="chatbubble-ellipses" size={16} color={mode === 'chat' ? theme.colors.dark.onPrimary : theme.colors.dark.onSurfaceVariant} />
          <Text style={[styles.modeTabText, mode === 'chat' && styles.modeTabTextActive]}>Consult AI Coach</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.modeTab, mode === 'wizard' && styles.modeTabActive]}
          onPress={() => {
            setMode('wizard');
            resetWizard();
          }}
        >
          <Ionicons name="git-network" size={16} color={mode === 'wizard' ? theme.colors.dark.onPrimary : theme.colors.dark.onSurfaceVariant} />
          <Text style={[styles.modeTabText, mode === 'wizard' && styles.modeTabTextActive]}>Triage Wizard</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {mode === 'chat' ? (
          /* CHAT MODE UI */
          <View style={styles.chatContainer}>
            <View style={styles.promptCard}>
              <Text style={styles.cardTitle}>Describe Your Symptoms</Text>
              <Text style={styles.cardSubtitle}>
                Type naturally. Mention pain locations, fever levels, duration, and triggers.
              </Text>
              
              <TextInput
                style={styles.textInput}
                multiline
                numberOfLines={5}
                placeholder="Example: I have had a dull headache for 2 days, and today I woke up with mild nausea and sensitivity to light..."
                placeholderTextColor={theme.colors.dark.outline}
                value={symptomText}
                onChangeText={setSymptomText}
              />

              <TouchableOpacity style={styles.actionBtn} onPress={handleAiConsult} disabled={loading} activeOpacity={0.8}>
                {loading ? (
                  <ActivityIndicator color={theme.colors.dark.onPrimary} />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={18} color={theme.colors.dark.onPrimary} />
                    <Text style={styles.actionBtnText}>Consult AI Coach</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* WIZARD MODE UI */
          <View style={styles.wizardContainer}>
            {wizardStep === 1 && (
              <View style={styles.wizardCard}>
                <Text style={styles.stepIndicator}>Step 1 of 3</Text>
                <Text style={styles.wizardQuestion}>What is your primary symptom?</Text>
                
                {[
                  { label: 'Headache', value: 'headache', icon: 'skull-outline' },
                  { label: 'Fever', value: 'fever', icon: 'thermometer-outline' },
                  { label: 'Cough / Sore Throat', value: 'cough', icon: 'alert-circle-outline' },
                  { label: 'Stomach Pain / Cramps', value: 'stomach_pain', icon: 'medical-outline' },
                  { label: 'Fatigue / Body Soreness', value: 'fatigue', icon: 'body-outline' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[styles.wizardOption, primarySymptom === item.value && styles.wizardOptionActive]}
                    onPress={() => setPrimarySymptom(item.value)}
                  >
                    <Ionicons name={item.icon as any} size={20} color={primarySymptom === item.value ? theme.colors.dark.primary : theme.colors.dark.outline} />
                    <Text style={[styles.wizardOptionText, primarySymptom === item.value && styles.wizardOptionTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity style={styles.nextBtn} onPress={() => setWizardStep(2)}>
                  <Text style={styles.nextBtnText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={16} color={theme.colors.dark.onPrimary} />
                </TouchableOpacity>
              </View>
            )}

            {wizardStep === 2 && (
              <View style={styles.wizardCard}>
                <Text style={styles.stepIndicator}>Step 2 of 3</Text>
                <Text style={styles.wizardQuestion}>How long has this symptom been active?</Text>
                
                {[
                  { label: 'Less than 24 hours', value: 'less_24h' },
                  { label: 'Between 1 to 3 days', value: '1_3_days' },
                  { label: 'More than 3 days', value: 'more_3_days' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[styles.wizardOption, duration === item.value && styles.wizardOptionActive]}
                    onPress={() => setDuration(item.value)}
                  >
                    <Ionicons
                      name={duration === item.value ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={duration === item.value ? theme.colors.dark.primary : theme.colors.dark.outline}
                    />
                    <Text style={[styles.wizardOptionText, duration === item.value && styles.wizardOptionTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}

                <View style={styles.navigationRow}>
                  <TouchableOpacity style={styles.backBtn} onPress={() => setWizardStep(1)}>
                    <Ionicons name="arrow-back" size={16} color={theme.colors.dark.onSurface} />
                    <Text style={styles.backBtnText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.nextBtn} onPress={() => setWizardStep(3)}>
                    <Text style={styles.nextBtnText}>Continue</Text>
                    <Ionicons name="arrow-forward" size={16} color={theme.colors.dark.onPrimary} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {wizardStep === 3 && (
              <View style={styles.wizardCard}>
                <Text style={styles.stepIndicator}>Step 3 of 3</Text>
                <Text style={styles.wizardQuestion}>Are you experiencing any warning signs?</Text>
                <Text style={styles.wizardSubtitle}>Check all that apply, or select "None of these".</Text>
                
                {[
                  { label: 'Difficulty breathing / Shortness of breath', value: 'shortness_of_breath' },
                  { label: 'Chest pain or chest pressure', value: 'chest_pain' },
                  { label: 'Confusion or sudden dizziness', value: 'confusion' },
                  { label: 'Very high fever (over 103°F)', value: 'high_fever' },
                  { label: 'None of these warning signs', value: 'none' },
                ].map((item) => {
                  const active = severeSigns.includes(item.value);
                  return (
                    <TouchableOpacity
                      key={item.value}
                      style={[styles.wizardOption, active && styles.wizardOptionActive]}
                      onPress={() => toggleSevereSign(item.value)}
                    >
                      <Ionicons
                        name={active ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={active ? theme.colors.dark.primary : theme.colors.dark.outline}
                      />
                      <Text style={[styles.wizardOptionText, active && styles.wizardOptionTextActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                <View style={styles.navigationRow}>
                  <TouchableOpacity style={styles.backBtn} onPress={() => setWizardStep(2)}>
                    <Ionicons name="arrow-back" size={16} color={theme.colors.dark.onSurface} />
                    <Text style={styles.backBtnText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.nextBtn} onPress={handleWizardSubmit} disabled={loading}>
                    {loading ? (
                      <ActivityIndicator color={theme.colors.dark.onPrimary} />
                    ) : (
                      <>
                        <Text style={styles.nextBtnText}>Get Advice</Text>
                        <Ionicons name="checkmark" size={16} color={theme.colors.dark.onPrimary} />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Diagnostic Report Display */}
        {report && (mode === 'chat' || wizardStep === 4) && (
          <View style={styles.reportContainer}>
            {/* Risk Badge */}
            <View style={[styles.riskHeader, { backgroundColor: getRiskColor(report.riskLevel) + '15', borderColor: getRiskColor(report.riskLevel) }]}>
              <Ionicons
                name={report.riskLevel === 'HIGH' ? 'alert-circle' : report.riskLevel === 'MEDIUM' ? 'warning' : 'checkmark-done-circle'}
                size={28}
                color={getRiskColor(report.riskLevel)}
              />
              <View>
                <Text style={[styles.riskTitle, { color: getRiskColor(report.riskLevel) }]}>
                  {report.riskLevel} RISK TRIAGE
                </Text>
                <Text style={styles.riskSubtitle}>
                  {report.isAiPowered ? 'Powered by AI consultation engine' : 'Offline diagnostic matrix fallback'}
                </Text>
              </View>
            </View>

            {/* Content Details */}
            <View style={styles.reportCard}>
              <Text style={styles.reportLabel}>Possible Conditions Considered</Text>
              <View style={styles.conditionsRow}>
                {report.possibleConditions.map((cond, idx) => (
                  <View key={idx} style={styles.conditionTag}>
                    <Text style={styles.conditionTagText}>{cond}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.reportLabel}>Clinical Summary</Text>
              <Text style={styles.reportText}>{report.summary}</Text>

              <View style={styles.divider} />

              <Text style={styles.reportLabel}>Recommendations</Text>
              <Text style={styles.recommendationText}>{report.recommendations}</Text>

              <View style={styles.disclaimerBox}>
                <Ionicons name="information-circle-outline" size={16} color={theme.colors.dark.outline} />
                <Text style={styles.disclaimerText}>
                  Disclaimer: This tool is for informational triage purposes only. It is not a substitute for professional medical diagnosis, advice, or treatment.
                </Text>
              </View>

              {mode === 'wizard' && (
                <TouchableOpacity style={styles.restartBtn} onPress={resetWizard}>
                  <Ionicons name="refresh" size={16} color={theme.colors.dark.outline} />
                  <Text style={styles.restartBtnText}>Restart Wizard</Text>
                </TouchableOpacity>
              )}
            </View>
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
  modeTabs: {
    flexDirection: 'row',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.dark.surface,
    borderBottomWidth: 1,
    borderColor: '#2A2A2A',
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: theme.shapes.medium,
  },
  modeTabActive: {
    backgroundColor: theme.colors.dark.primary,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.dark.onSurfaceVariant,
  },
  modeTabTextActive: {
    color: theme.colors.dark.onPrimary,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  chatContainer: {
    marginBottom: theme.spacing.md,
  },
  promptCard: {
    backgroundColor: theme.colors.dark.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.shapes.large,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.dark.onSurface,
  },
  cardSubtitle: {
    fontSize: 12,
    color: theme.colors.dark.onSurfaceVariant,
    marginTop: 2,
    marginBottom: theme.spacing.md,
    lineHeight: 16,
  },
  textInput: {
    backgroundColor: theme.colors.dark.surfaceVariant,
    borderRadius: theme.shapes.medium,
    padding: theme.spacing.md,
    color: theme.colors.dark.onSurface,
    fontSize: 14,
    height: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: theme.spacing.md,
  },
  actionBtn: {
    backgroundColor: theme.colors.dark.primary,
    paddingVertical: 12,
    borderRadius: theme.shapes.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnText: {
    color: theme.colors.dark.onPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  wizardContainer: {
    marginBottom: theme.spacing.md,
  },
  wizardCard: {
    backgroundColor: theme.colors.dark.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.shapes.large,
  },
  stepIndicator: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.dark.primary,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  wizardQuestion: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.dark.onSurface,
    marginBottom: theme.spacing.md,
  },
  wizardSubtitle: {
    fontSize: 12,
    color: theme.colors.dark.onSurfaceVariant,
    marginTop: -8,
    marginBottom: theme.spacing.md,
  },
  wizardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.dark.surfaceVariant,
    padding: theme.spacing.md,
    borderRadius: theme.shapes.medium,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  wizardOptionActive: {
    borderColor: theme.colors.dark.primary,
    backgroundColor: theme.colors.dark.primaryContainer + '22',
  },
  wizardOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.dark.onSurfaceVariant,
  },
  wizardOptionTextActive: {
    color: theme.colors.dark.onSurface,
    fontWeight: '700',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.dark.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: theme.shapes.medium,
    alignSelf: 'flex-end',
    marginTop: theme.spacing.md,
  },
  nextBtnText: {
    color: theme.colors.dark.onPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  backBtnText: {
    color: theme.colors.dark.onSurface,
    fontSize: 14,
    fontWeight: '600',
  },
  reportContainer: {
    marginTop: theme.spacing.lg,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: theme.spacing.md,
    borderRadius: theme.shapes.medium,
    borderWidth: 1.5,
    marginBottom: theme.spacing.md,
  },
  riskTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  riskSubtitle: {
    fontSize: 11,
    color: theme.colors.dark.onSurfaceVariant,
    marginTop: 2,
  },
  reportCard: {
    backgroundColor: theme.colors.dark.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.shapes.large,
  },
  reportLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.dark.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  conditionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: theme.spacing.md,
  },
  conditionTag: {
    backgroundColor: theme.colors.dark.surfaceVariant,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  conditionTagText: {
    color: theme.colors.dark.onSurface,
    fontSize: 12,
    fontWeight: '600',
  },
  reportText: {
    fontSize: 13,
    color: theme.colors.dark.onSurface,
    lineHeight: 18,
    marginBottom: theme.spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.dark.surfaceVariant,
    marginVertical: theme.spacing.md,
  },
  recommendationText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.dark.onSurface,
    lineHeight: 19,
    marginBottom: theme.spacing.lg,
  },
  disclaimerBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: theme.colors.dark.surfaceVariant,
    padding: theme.spacing.md,
    borderRadius: theme.shapes.medium,
    marginTop: theme.spacing.sm,
  },
  disclaimerBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#2D2200',
    borderLeftWidth: 3,
    borderLeftColor: '#FFA000',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 0,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11.5,
    color: '#FFD54F',
    lineHeight: 16,
  },
  disclaimerBold: {
    fontWeight: '700',
    color: '#FFA000',
  },
  restartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: theme.shapes.medium,
    marginTop: theme.spacing.lg,
  },
  restartBtnText: {
    color: theme.colors.dark.onSurfaceVariant,
    fontSize: 13,
    fontWeight: '600',
  },
  // ── Disclaimer Modal ──────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#FFA00044',
    alignItems: 'center',
  },
  modalIconRow: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2D2200',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFA000',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalBody: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalBold: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalAcceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFA000',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
  },
  modalAcceptText: {
    color: '#121212',
    fontSize: 15,
    fontWeight: '700',
  },
});
