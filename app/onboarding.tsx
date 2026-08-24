import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../src/theme/theme';
import { useUserStore } from '../src/store/userStore';

type Step = 'GOAL' | 'PROFILE' | 'FIRST_WIN';

export default function OnboardingScreen() {
  const [step, setStep] = useState<Step>('GOAL');
  
  // Local state for profile step
  const [age, setAge] = useState('25');
  const [weight, setWeight] = useState('70');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  
  const { setProfile, setHasCompletedOnboarding } = useUserStore();

  const handleGoalSelect = (goal: 'lose_weight' | 'build_muscle' | 'stay_fit') => {
    setProfile({ goal });
    setStep('PROFILE');
  };

  const handleProfileSubmit = () => {
    setProfile({
      age: parseInt(age) || 25,
      weightKg: parseInt(weight) || 70,
      gender,
    });
    setStep('FIRST_WIN');
  };

  const handleFinish = () => {
    setHasCompletedOnboarding(true);
    router.replace('/(tabs)');
  };

  if (step === 'GOAL') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>What's your main goal?</Text>
          <Text style={styles.subtitle}>We'll personalize FitMetrics for you.</Text>
          
          <View style={styles.optionsContainer}>
            <TouchableOpacity style={styles.goalCard} onPress={() => handleGoalSelect('lose_weight')} activeOpacity={0.8}>
              <View style={[styles.iconBox, { backgroundColor: '#FF525222' }]}>
                <Ionicons name="flame" size={32} color="#FF5252" />
              </View>
              <View style={styles.goalTextContainer}>
                <Text style={styles.goalTitle}>Lose Weight</Text>
                <Text style={styles.goalSub}>Burn fat and get lean</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.goalCard} onPress={() => handleGoalSelect('build_muscle')} activeOpacity={0.8}>
              <View style={[styles.iconBox, { backgroundColor: '#2196F322' }]}>
                <Ionicons name="barbell" size={32} color="#2196F3" />
              </View>
              <View style={styles.goalTextContainer}>
                <Text style={styles.goalTitle}>Build Muscle</Text>
                <Text style={styles.goalSub}>Gain strength and size</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.goalCard} onPress={() => handleGoalSelect('stay_fit')} activeOpacity={0.8}>
              <View style={[styles.iconBox, { backgroundColor: '#4CAF5022' }]}>
                <Ionicons name="heart" size={32} color="#4CAF50" />
              </View>
              <View style={styles.goalTextContainer}>
                <Text style={styles.goalTitle}>Stay Fit</Text>
                <Text style={styles.goalSub}>Maintain a healthy lifestyle</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'PROFILE') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.content}
        >
          <TouchableOpacity onPress={() => setStep('GOAL')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.dark.onSurface} />
          </TouchableOpacity>
          
          <Text style={styles.title}>Quick Profile</Text>
          <Text style={styles.subtitle}>Just the basics to calculate your needs.</Text>
          
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>

            <View style={styles.genderContainer}>
              <TouchableOpacity 
                style={[styles.genderButton, gender === 'male' && styles.genderActive]} 
                onPress={() => setGender('male')}
              >
                <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>Male</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.genderButton, gender === 'female' && styles.genderActive]} 
                onPress={() => setGender('female')}
              >
                <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>Female</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleProfileSubmit}>
            <Text style={styles.primaryButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // FIRST WIN STEP
  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
        <View style={styles.successCircle}>
          <Ionicons name="checkmark" size={60} color="#4CAF50" />
        </View>
        <Text style={[styles.title, { textAlign: 'center', marginTop: 24 }]}>You're all set!</Text>
        <Text style={[styles.subtitle, { textAlign: 'center', marginBottom: 40 }]}>
          Based on your profile, your daily calorie goal is ~2200 kcal.
        </Text>

        <View style={styles.firstWinCard}>
          <Text style={styles.firstWinTitle}>Let's log your first workout!</Text>
          <Text style={styles.firstWinSub}>Experience how easy it is to track.</Text>
          
          <TouchableOpacity style={styles.logButton} onPress={handleFinish}>
            <Ionicons name="play" size={20} color="#121212" />
            <Text style={styles.logButtonText}>Start Quick Workout</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.skipLink} onPress={handleFinish}>
          <Text style={styles.skipLinkText}>Skip to dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 24,
    left: 24,
    zIndex: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.dark.onSurface,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.dark.onSurfaceVariant,
    marginBottom: 40,
  },
  optionsContainer: {
    gap: 16,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.dark.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.dark.outline,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  goalTextContainer: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.dark.onSurface,
    marginBottom: 4,
  },
  goalSub: {
    fontSize: 14,
    color: theme.colors.dark.onSurfaceVariant,
  },
  formContainer: {
    gap: 20,
    marginBottom: 40,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.dark.onSurfaceVariant,
  },
  input: {
    backgroundColor: theme.colors.dark.surface,
    borderWidth: 1,
    borderColor: theme.colors.dark.outline,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: theme.colors.dark.onSurface,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  genderButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.dark.outline,
    alignItems: 'center',
  },
  genderActive: {
    backgroundColor: theme.colors.dark.primary,
    borderColor: theme.colors.dark.primary,
  },
  genderText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.dark.onSurface,
  },
  genderTextActive: {
    color: '#fff',
  },
  primaryButton: {
    backgroundColor: theme.colors.dark.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 30,
    gap: 8,
  },
  primaryButtonText: {
    color: '#121212',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF5022',
    justifyContent: 'center',
    alignItems: 'center',
  },
  firstWinCard: {
    backgroundColor: theme.colors.dark.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.dark.primary + '55',
  },
  firstWinTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.dark.onSurface,
    marginBottom: 8,
    textAlign: 'center',
  },
  firstWinSub: {
    fontSize: 14,
    color: theme.colors.dark.onSurfaceVariant,
    marginBottom: 24,
    textAlign: 'center',
  },
  logButton: {
    backgroundColor: theme.colors.dark.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    gap: 8,
    width: '100%',
  },
  logButtonText: {
    color: '#121212',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipLink: {
    marginTop: 24,
    padding: 12,
  },
  skipLinkText: {
    color: theme.colors.dark.onSurfaceVariant,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
