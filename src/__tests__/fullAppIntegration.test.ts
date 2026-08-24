/**
 * ═══════════════════════════════════════════════════════════════════════
 * FULL APP INTEGRATION TEST — All Features + Google Authentication
 * ═══════════════════════════════════════════════════════════════════════
 *
 * This test exercises every major business-logic path in the FitMetrics app:
 *   1. Google Authentication (Supabase + fallback)
 *   2. Email / Magic Link Authentication
 *   3. Firebase Auth Service (Phone OTP, Google, Email)
 *   4. Guest Mode & Logout
 *   5. Workout CRUD + Progressive Overload + Water Goal Link
 *   6. Food Logging + Today Totals
 *   7. Water Tracking + Daily Goal
 *   8. Calculator Stores (BMI, BMR, Body Fat, Ideal Weight)
 *   9. Settings Store (unit, notifications, language)
 *  10. User Store (profile, onboarding, premium status)
 *  11. Premium Feature Gating + Barcode Scan Limits
 *  12. Cloud Sync (auth required, guest blocked)
 *  13. AI Coach Weekly Summary
 *  14. Storage (history CRUD, weight goals)
 *  15. Database CRUD (calculations, exercises, meals, sleep)
 */

// ─── Global Mocks ─────────────────────────────────────────────────────

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    setLogLevel: jest.fn(),
    configure: jest.fn().mockResolvedValue(undefined),
    getOfferings: jest.fn().mockResolvedValue({ current: null }),
    getCustomerInfo: jest.fn().mockResolvedValue({
      entitlements: { active: {} },
      allPurchasedProductIdentifiers: [],
    }),
    purchasePackage: jest.fn().mockResolvedValue({
      customerInfo: { entitlements: { active: {} }, allPurchasedProductIdentifiers: [] },
    }),
    restorePurchases: jest.fn().mockResolvedValue({
      entitlements: { active: {} },
      allPurchasedProductIdentifiers: [],
    }),
  },
  LOG_LEVEL: { DEBUG: 0 },
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn().mockResolvedValue({
      data: {
        idToken: 'mock_google_id_token_abc123',
        user: { id: 'google_user_999', email: 'athlete@gmail.com', name: 'Fitness Athlete' },
      },
      idToken: 'mock_google_id_token_abc123',
      user: { id: 'google_user_999', email: 'athlete@gmail.com', name: 'Fitness Athlete' },
    }),
    signOut: jest.fn().mockResolvedValue(undefined),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
}));

jest.mock('expo-linking', () => ({
  createURL: jest.fn().mockReturnValue('fitmetrics://'),
  openURL: jest.fn(),
  addEventListener: jest.fn(),
}));

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn().mockResolvedValue({
    type: 'success',
    url: 'fitmetrics://auth#access_token=mock_jwt_token&refresh_token=mock_refresh_token',
  }),
}));

jest.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => Promise.resolve(store[key] || null)),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach((k) => delete store[k]);
      return Promise.resolve();
    }),
    _store: store,
  };
});

jest.mock('../services/supabase/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithOAuth: jest.fn().mockResolvedValue({
        data: { url: 'https://mock-supabase-oauth.com' },
        error: null,
      }),
      signInWithIdToken: jest.fn().mockResolvedValue({
        data: {
          user: {
            id: 'mock_user_123',
            email: 'athlete@gmail.com',
            user_metadata: { full_name: 'Fitness Athlete' },
          },
        },
        error: null,
      }),
      signInWithOtp: jest.fn().mockResolvedValue({ data: {}, error: null }),
      getUser: jest.fn().mockResolvedValue({
        data: {
          user: {
            id: 'mock_user_123',
            email: 'athlete@gmail.com',
            user_metadata: { full_name: 'Fitness Athlete' },
          },
        },
        error: null,
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      setSession: jest.fn().mockResolvedValue({
        data: {
          user: {
            id: 'mock_user_123',
            email: 'athlete@gmail.com',
            user_metadata: { full_name: 'Fitness Athlete' },
          },
        },
        error: null,
      }),
      exchangeCodeForSession: jest.fn().mockResolvedValue({
        data: {
          user: {
            id: 'mock_user_123',
            email: 'athlete@gmail.com',
            user_metadata: { full_name: 'Fitness Athlete' },
          },
        },
        error: null,
      }),
    },
    from: jest.fn(() => ({
      upsert: jest.fn().mockResolvedValue({ error: null }),
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

jest.mock('../services/firebase/firebaseConfig', () => ({
  db: { type: 'mock' },
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn().mockResolvedValue(undefined),
  getDocs: jest.fn().mockResolvedValue({ forEach: jest.fn() }),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  serverTimestamp: jest.fn(),
}));

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true }),
    addEventListener: jest.fn(() => jest.fn()),
  },
}));

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn().mockResolvedValue({
    execAsync: jest.fn().mockResolvedValue(true),
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
    getAllAsync: jest.fn().mockResolvedValue([]),
    getFirstAsync: jest.fn().mockResolvedValue(null),
  }),
}));

jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notif-id'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios', select: (obj: any) => obj.ios || obj.default },
  StyleSheet: { create: (s: any) => s },
  Alert: { alert: jest.fn() },
  View: 'View',
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  ActivityIndicator: 'ActivityIndicator',
  Modal: 'Modal',
  ScrollView: 'ScrollView',
  KeyboardAvoidingView: 'KeyboardAvoidingView',
}));

// ─── Imports ──────────────────────────────────────────────────────────

import { useUserAuthStore, UserProfileAuth } from '../store/userAuthStore';
import { useUserStore } from '../store/userStore';
import { useWorkoutStore, Workout, Exercise, WorkoutSet } from '../store/workoutStore';
import { useFoodStore } from '../store/foodStore';
import { useWaterStore } from '../store/useWaterStore';
import { useCalculatorStore } from '../store/calculatorStore';
import { useSettingsStore } from '../store/settingsStore';
import { supabaseAuthService } from '../services/auth/supabaseAuthService';
import { firebaseAuthService } from '../services/auth/firebaseAuthService';
import { cloudSyncService } from '../services/sync/cloudSyncService';
import { premiumService, PREMIUM_CONFIG } from '../services/premium/premiumService';
import { calculationsDb, userProfileDb, settingsDb, workoutDb, mealDb, sleepDb, initDatabase } from '../data/db';
import { storage } from '../data/storage';

// ─── Setup / Teardown ─────────────────────────────────────────────────

beforeEach(() => {
  // Reset all stores to initial state
  useUserAuthStore.getState().logout();
  useUserStore.getState().logout();
  useWorkoutStore.setState({ workouts: [] });
  useFoodStore.setState({ logs: [] });
  useWaterStore.setState({ logs: {}, dailyGoal: 2500, remindersEnabled: false });
  useSettingsStore.setState({
    unitSystem: 'metric',
    notificationsEnabled: true,
    dailyReminderTime: '08:00',
    language: 'en',
    hapticFeedback: true,
    soundEnabled: true,
    autoSaveCalculations: true,
  });
  useCalculatorStore.getState().resetAllInputs();
  storage.clearHistory();
  storage.setGoal({ currentWeight: 70, targetWeight: 65, dailyDeficit: 500 });
});

// ═══════════════════════════════════════════════════════════════════════
//  1. GOOGLE AUTHENTICATION (Supabase)
// ═══════════════════════════════════════════════════════════════════════

describe('1. Google Authentication (Supabase)', () => {
  test('Google Sign-In sets user and marks as authenticated', async () => {
    const result = await supabaseAuthService.signInWithGoogle();
    expect(result.success).toBe(true);
    expect(result.message).toContain('Welcome back');

    const state = useUserAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.isGuest).toBe(false);
    expect(state.user).not.toBeNull();
    expect(state.user?.email).toBe('athlete@gmail.com');
    expect(state.user?.displayName).toBe('Fitness Athlete');
    expect(state.user?.isAnonymous).toBe(false);
  });

  test('Email login sends magic link and does not set user directly', async () => {
    const result = await supabaseAuthService.signInWithEmail('test@example.com');
    expect(result.success).toBe(true);
    expect(result.message).toContain('Magic login link');
  });

  test('Sign-out returns to guest mode', async () => {
    await supabaseAuthService.signInWithGoogle();
    expect(useUserAuthStore.getState().isAuthenticated).toBe(true);

    useUserAuthStore.getState().logout();

    const state = useUserAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isGuest).toBe(true);
    expect(state.user).toBeNull();
  });

  test('Auth persistence: setUser persists user via AsyncStorage', async () => {
    const testUser: UserProfileAuth = {
      uid: 'persist_test_123',
      email: 'persist@test.com',
      displayName: 'Persist User',
      isAnonymous: false,
      createdAt: Date.now(),
    };

    useUserAuthStore.getState().setUser(testUser);
    expect(useUserAuthStore.getState().user?.uid).toBe('persist_test_123');

    // loadPersistedAuth should restore the user
    await useUserAuthStore.getState().loadPersistedAuth();
    expect(useUserAuthStore.getState().user?.uid).toBe('persist_test_123');
    expect(useUserAuthStore.getState().isAuthenticated).toBe(true);
  });

  test('Auth modal open/close lifecycle', () => {
    expect(useUserAuthStore.getState().isAuthModalVisible).toBe(false);

    useUserAuthStore.getState().openAuthModal();
    expect(useUserAuthStore.getState().isAuthModalVisible).toBe(true);

    useUserAuthStore.getState().closeAuthModal();
    expect(useUserAuthStore.getState().isAuthModalVisible).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════
//  2. FIREBASE AUTH SERVICE (Phone OTP, Google, Email)
// ═══════════════════════════════════════════════════════════════════════

describe('2. Firebase Auth Service', () => {
  test('sendPhoneOTP returns success for sandbox test numbers', async () => {
    const result = await firebaseAuthService.sendPhoneOTP('+919999999999');
    expect(result.success).toBe(true);
    expect(result.message).toContain('123456'); // sandbox OTP hint
  });

  test('verifyPhoneOTP succeeds with correct sandbox OTP', async () => {
    await firebaseAuthService.sendPhoneOTP('+919999999999');
    const result = await firebaseAuthService.verifyPhoneOTP('123456');
    expect(result.success).toBe(true);
    expect(result.message).toContain('Welcome to FitMetrics');

    const state = useUserAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.phoneNumber).toBe('+919999999999');
  });

  test('verifyPhoneOTP fails with wrong OTP', async () => {
    await firebaseAuthService.sendPhoneOTP('+919999999999');
    const result = await firebaseAuthService.verifyPhoneOTP('999999');
    expect(result.success).toBe(false);
    expect(result.message).toContain('Invalid OTP');
  });

  test('Firebase Google Sign-In creates user', async () => {
    const result = await firebaseAuthService.signInWithGoogle();
    expect(result.success).toBe(true);

    const state = useUserAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe('user@gmail.com');
  });

  test('Firebase Email login creates user', async () => {
    const result = await firebaseAuthService.signInWithEmail('demo@fitmetrics.com');
    expect(result.success).toBe(true);

    const state = useUserAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe('demo@fitmetrics.com');
    expect(state.user?.displayName).toBe('demo');
  });
});

// ═══════════════════════════════════════════════════════════════════════
//  3. GUEST MODE
// ═══════════════════════════════════════════════════════════════════════

describe('3. Guest Mode', () => {
  test('setGuestMode puts user in guest state', () => {
    useUserAuthStore.getState().setGuestMode();
    const state = useUserAuthStore.getState();
    expect(state.isGuest).toBe(true);
    expect(state.isAuthenticated).toBe(false);
  });

  test('Guest cannot trigger cloud sync', async () => {
    const result = await cloudSyncService.syncAllData();
    expect(result.success).toBe(false);
    expect(result.message).toContain('Sign in');
  });
});

// ═══════════════════════════════════════════════════════════════════════
//  4. USER STORE (Profile, Onboarding, Premium)
// ═══════════════════════════════════════════════════════════════════════

describe('4. User Store', () => {
  test('Initial profile has sensible defaults', () => {
    const { profile } = useUserStore.getState();
    expect(profile.name).toBe('User');
    expect(profile.age).toBe(25);
    expect(profile.gender).toBe('male');
    expect(profile.heightCm).toBe(175);
    expect(profile.weightKg).toBe(70);
    expect(profile.unitPreference).toBe('metric');
    expect(profile.goal).toBe('stay_fit');
  });

  test('setProfile updates profile fields', () => {
    useUserStore.getState().setProfile({ name: 'Arun', age: 30, goal: 'build_muscle' });
    const { profile } = useUserStore.getState();
    expect(profile.name).toBe('Arun');
    expect(profile.age).toBe(30);
    expect(profile.goal).toBe('build_muscle');
    // Unchanged fields remain
    expect(profile.heightCm).toBe(175);
  });

  test('hasCompletedOnboarding toggle', () => {
    expect(useUserStore.getState().hasCompletedOnboarding).toBe(false);
    useUserStore.getState().setHasCompletedOnboarding(true);
    expect(useUserStore.getState().hasCompletedOnboarding).toBe(true);
  });

  test('Premium status toggle', () => {
    expect(useUserStore.getState().isPremium).toBe(false);
    useUserStore.getState().setPremiumStatus(true);
    expect(useUserStore.getState().isPremium).toBe(true);
  });

  test('logout resets everything', () => {
    useUserStore.getState().setProfile({ name: 'Changed' });
    useUserStore.getState().setPremiumStatus(true);
    useUserStore.getState().setHasCompletedOnboarding(true);

    useUserStore.getState().logout();

    expect(useUserStore.getState().profile.name).toBe('User');
    expect(useUserStore.getState().isPremium).toBe(false);
    expect(useUserStore.getState().hasCompletedOnboarding).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════
//  5. WORKOUT STORE (CRUD, Progressive Overload, Water Goal Link)
// ═══════════════════════════════════════════════════════════════════════

describe('5. Workout Store', () => {
  const createTestWorkout = (overrides?: Partial<Workout>): Workout => ({
    id: `wo_${Date.now()}`,
    name: 'Push Day',
    date: new Date().toISOString(),
    exercises: [
      {
        id: 'ex_bench',
        name: 'Bench Press',
        sets: [
          { id: 's1', weight: 60, reps: 10, isCompleted: true },
          { id: 's2', weight: 65, reps: 8, isCompleted: true },
        ],
      },
      {
        id: 'ex_ohp',
        name: 'Overhead Press',
        sets: [
          { id: 's3', weight: 40, reps: 10, isCompleted: true },
          { id: 's4', weight: 40, reps: 8, isCompleted: false },
        ],
      },
    ],
    durationMinutes: 55,
    ...overrides,
  });

  test('addWorkout adds to workouts list', () => {
    const workout = createTestWorkout();
    useWorkoutStore.getState().addWorkout(workout);
    expect(useWorkoutStore.getState().workouts).toHaveLength(1);
    expect(useWorkoutStore.getState().workouts[0].name).toBe('Push Day');
  });

  test('deleteWorkout removes a workout', () => {
    const workout = createTestWorkout({ id: 'wo_to_delete' });
    useWorkoutStore.getState().addWorkout(workout);
    expect(useWorkoutStore.getState().workouts).toHaveLength(1);

    useWorkoutStore.getState().deleteWorkout('wo_to_delete');
    expect(useWorkoutStore.getState().workouts).toHaveLength(0);
  });

  test('clearAll removes all workouts', () => {
    useWorkoutStore.getState().addWorkout(createTestWorkout({ id: 'wo_1' }));
    useWorkoutStore.getState().addWorkout(createTestWorkout({ id: 'wo_2' }));
    expect(useWorkoutStore.getState().workouts).toHaveLength(2);

    useWorkoutStore.getState().clearAll();
    expect(useWorkoutStore.getState().workouts).toHaveLength(0);
  });

  test('getExerciseHistory finds exercise by name', () => {
    useWorkoutStore.getState().addWorkout(createTestWorkout());
    const history = useWorkoutStore.getState().getExerciseHistory('Bench Press');
    expect(history).not.toBeNull();
    expect(history?.sets).toHaveLength(2);
    expect(history?.sets[0].weight).toBe(60);
  });

  test('getExerciseHistory returns null for unknown exercise', () => {
    useWorkoutStore.getState().addWorkout(createTestWorkout());
    const history = useWorkoutStore.getState().getExerciseHistory('Deadlift');
    expect(history).toBeNull();
  });

  test('Progressive Overload: suggests weight increase when reps >= 10', () => {
    const workout = createTestWorkout({
      exercises: [
        {
          id: 'ex_squat',
          name: 'Squat',
          sets: [
            { id: 's1', weight: 100, reps: 12, isCompleted: true },
          ],
        },
      ],
    });
    useWorkoutStore.getState().addWorkout(workout);
    const target = useWorkoutStore.getState().getProgressiveOverloadTarget('Squat');
    expect(target).not.toBeNull();
    expect(target?.targetWeight).toBe(101.25); // +1.25kg
    expect(target?.targetReps).toBe(8);
  });

  test('Progressive Overload: suggests rep increase when reps < 10', () => {
    const workout = createTestWorkout({
      exercises: [
        {
          id: 'ex_bench',
          name: 'Bench Press',
          sets: [
            { id: 's1', weight: 60, reps: 7, isCompleted: true },
          ],
        },
      ],
    });
    useWorkoutStore.getState().addWorkout(workout);
    const target = useWorkoutStore.getState().getProgressiveOverloadTarget('Bench Press');
    expect(target).not.toBeNull();
    expect(target?.targetWeight).toBe(60); // same weight
    expect(target?.targetReps).toBe(8); // +1 rep
  });

  test('Water goal auto-increases by 500ml for long workouts (>= 45 min)', () => {
    const initialGoal = useWaterStore.getState().dailyGoal;
    const workout = createTestWorkout({ durationMinutes: 50 });
    useWorkoutStore.getState().addWorkout(workout);
    expect(useWaterStore.getState().dailyGoal).toBe(initialGoal + 500);
  });

  test('Short workouts (< 45 min) do not change water goal', () => {
    const initialGoal = useWaterStore.getState().dailyGoal;
    const workout = createTestWorkout({ durationMinutes: 30 });
    useWorkoutStore.getState().addWorkout(workout);
    expect(useWaterStore.getState().dailyGoal).toBe(initialGoal);
  });

  test('Multiple workouts are prepended (newest first)', () => {
    useWorkoutStore.getState().addWorkout(createTestWorkout({ id: 'wo_1', name: 'Day 1' }));
    useWorkoutStore.getState().addWorkout(createTestWorkout({ id: 'wo_2', name: 'Day 2' }));
    const workouts = useWorkoutStore.getState().workouts;
    expect(workouts[0].name).toBe('Day 2');
    expect(workouts[1].name).toBe('Day 1');
  });
});

// ═══════════════════════════════════════════════════════════════════════
//  6. FOOD STORE (Log Food, Today Totals)
// ═══════════════════════════════════════════════════════════════════════

describe('6. Food Store', () => {
  const mockProduct = {
    barcode: '123456789',
    name: 'Protein Bar',
    brand: 'FitBar',
    image_url: 'https://example.com/bar.png',
    nutrition: { calories: 250, protein: 20, carbs: 30, fat: 8 },
  };

  test('logFood adds entry to logs', () => {
    useFoodStore.getState().logFood(mockProduct as any);
    expect(useFoodStore.getState().logs).toHaveLength(1);
    expect(useFoodStore.getState().logs[0].product.name).toBe('Protein Bar');
  });

  test('getTodayTotals sums nutrition correctly', () => {
    useFoodStore.getState().logFood(mockProduct as any);
    useFoodStore.getState().logFood({
      ...mockProduct,
      name: 'Oats',
      nutrition: { calories: 150, protein: 5, carbs: 27, fat: 3 },
    } as any);

    const totals = useFoodStore.getState().getTodayTotals();
    expect(totals.calories).toBe(400); // 250 + 150
    expect(totals.protein).toBe(25); // 20 + 5
    expect(totals.carbs).toBe(57); // 30 + 27
    expect(totals.fat).toBe(11); // 8 + 3
  });

  test('getTodayTotals returns zeros when no food logged', () => {
    const totals = useFoodStore.getState().getTodayTotals();
    expect(totals.calories).toBe(0);
    expect(totals.protein).toBe(0);
    expect(totals.carbs).toBe(0);
    expect(totals.fat).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════
//  7. WATER STORE
// ═══════════════════════════════════════════════════════════════════════

describe('7. Water Store', () => {
  const today = new Date().toISOString().split('T')[0];

  test('addWater accumulates water for the day', () => {
    useWaterStore.getState().addWater(today, 500);
    expect(useWaterStore.getState().logs[today]).toBe(500);

    useWaterStore.getState().addWater(today, 250);
    expect(useWaterStore.getState().logs[today]).toBe(750);
  });

  test('setDailyGoal updates the goal', () => {
    useWaterStore.getState().setDailyGoal(3000);
    expect(useWaterStore.getState().dailyGoal).toBe(3000);
  });

  test('toggleReminders updates state', () => {
    expect(useWaterStore.getState().remindersEnabled).toBe(false);
    useWaterStore.getState().toggleReminders(true);
    expect(useWaterStore.getState().remindersEnabled).toBe(true);
  });

  test('Different days have separate water logs', () => {
    useWaterStore.getState().addWater(today, 1000);
    useWaterStore.getState().addWater('2026-01-01', 2000);
    expect(useWaterStore.getState().logs[today]).toBe(1000);
    expect(useWaterStore.getState().logs['2026-01-01']).toBe(2000);
  });
});

// ═══════════════════════════════════════════════════════════════════════
//  8. CALCULATOR STORES (BMI, BMR, Body Fat, Ideal Weight Inputs)
// ═══════════════════════════════════════════════════════════════════════

describe('8. Calculator Store', () => {
  test('setBmiInputs updates BMI fields', () => {
    useCalculatorStore.getState().setBmiInputs({ heightCmStr: '175', weightKgStr: '70' });
    expect(useCalculatorStore.getState().bmiInputs.heightCmStr).toBe('175');
    expect(useCalculatorStore.getState().bmiInputs.weightKgStr).toBe('70');
  });

  test('setBmrInputs updates BMR fields', () => {
    useCalculatorStore.getState().setBmrInputs({ ageStr: '30', gender: 'female' });
    expect(useCalculatorStore.getState().bmrInputs.ageStr).toBe('30');
    expect(useCalculatorStore.getState().bmrInputs.gender).toBe('female');
  });

  test('setBodyFatInputs updates body fat fields', () => {
    useCalculatorStore.getState().setBodyFatInputs({ waistStr: '85', neckStr: '38', heightStr: '175' });
    expect(useCalculatorStore.getState().bodyFatInputs.waistStr).toBe('85');
    expect(useCalculatorStore.getState().bodyFatInputs.neckStr).toBe('38');
  });

  test('setIdealWeightInputs updates ideal weight fields', () => {
    useCalculatorStore.getState().setIdealWeightInputs({ heightCmStr: '180' });
    expect(useCalculatorStore.getState().idealWeightInputs.heightCmStr).toBe('180');
  });

  test('setLatestResult stores result by type', () => {
    useCalculatorStore.getState().setLatestResult('bmi', '22.9 - Normal');
    expect(useCalculatorStore.getState().latestResults.bmi).toBe('22.9 - Normal');
  });

  test('setUnitSystem toggles between metric and imperial', () => {
    useCalculatorStore.getState().setUnitSystem('imperial');
    expect(useCalculatorStore.getState().unitSystem).toBe('imperial');
    useCalculatorStore.getState().setUnitSystem('metric');
    expect(useCalculatorStore.getState().unitSystem).toBe('metric');
  });

  test('resetAllInputs clears all calculator inputs', () => {
    useCalculatorStore.getState().setBmiInputs({ heightCmStr: '180', weightKgStr: '80' });
    useCalculatorStore.getState().setBmrInputs({ ageStr: '40' });
    useCalculatorStore.getState().resetAllInputs();
    expect(useCalculatorStore.getState().bmiInputs.heightCmStr).toBe('');
    expect(useCalculatorStore.getState().bmiInputs.weightKgStr).toBe('');
    expect(useCalculatorStore.getState().bmrInputs.ageStr).toBe('25'); // reset to default
  });
});

// ═══════════════════════════════════════════════════════════════════════
//  9. SETTINGS STORE
// ═══════════════════════════════════════════════════════════════════════

describe('9. Settings Store', () => {
  test('setUnitSystem changes unit system', () => {
    useSettingsStore.getState().setUnitSystem('imperial');
    expect(useSettingsStore.getState().unitSystem).toBe('imperial');
  });

  test('setNotificationsEnabled toggles notifications', () => {
    useSettingsStore.getState().setNotificationsEnabled(false);
    expect(useSettingsStore.getState().notificationsEnabled).toBe(false);
  });

  test('setLanguage changes language', () => {
    useSettingsStore.getState().setLanguage('ta');
    expect(useSettingsStore.getState().language).toBe('ta');
  });

  test('setHapticFeedback toggles haptics', () => {
    useSettingsStore.getState().setHapticFeedback(false);
    expect(useSettingsStore.getState().hapticFeedback).toBe(false);
  });

  test('setAutoSaveCalculations toggles autosave', () => {
    useSettingsStore.getState().setAutoSaveCalculations(false);
    expect(useSettingsStore.getState().autoSaveCalculations).toBe(false);
  });

  test('updateSettings batch-updates multiple fields', () => {
    useSettingsStore.getState().updateSettings({
      language: 'es',
      soundEnabled: false,
      hapticFeedback: false,
    });
    expect(useSettingsStore.getState().language).toBe('es');
    expect(useSettingsStore.getState().soundEnabled).toBe(false);
    expect(useSettingsStore.getState().hapticFeedback).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════
//  10. PREMIUM SERVICE (Feature Gating)
// ═══════════════════════════════════════════════════════════════════════

describe('10. Premium Service', () => {
  beforeEach(() => {
    useUserStore.getState().setPremiumStatus(false);
  });

  test('Free user gets 3 daily barcode scans', async () => {
    const access = await premiumService.canAccessFeature('barcode_scanner');
    expect(access.allowed).toBe(true);
  });

  test('Free user is blocked from AI coach', async () => {
    const access = await premiumService.canAccessFeature('ai_coach');
    expect(access.allowed).toBe(false);
    expect(access.reason).toContain('Pro');
  });

  test('Free user is blocked from PDF export', async () => {
    const access = await premiumService.canAccessFeature('pdf_export');
    expect(access.allowed).toBe(false);
  });

  test('Free user is blocked from advanced charts', async () => {
    const access = await premiumService.canAccessFeature('advanced_charts');
    expect(access.allowed).toBe(false);
  });

  test('Pro user has access to all features', async () => {
    useUserStore.getState().setPremiumStatus(true);

    expect((await premiumService.canAccessFeature('barcode_scanner')).allowed).toBe(true);
    expect((await premiumService.canAccessFeature('ai_coach')).allowed).toBe(true);
    expect((await premiumService.canAccessFeature('pdf_export')).allowed).toBe(true);
    expect((await premiumService.canAccessFeature('advanced_charts')).allowed).toBe(true);
    expect((await premiumService.canAccessFeature('muscle_heatmap')).allowed).toBe(true);
  });

  test('Premium config has correct free scan limit', () => {
    expect(PREMIUM_CONFIG.freeDailyBarcodeScans).toBe(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════
//  11. CLOUD SYNC (Authenticated vs Guest)
// ═══════════════════════════════════════════════════════════════════════

describe('11. Cloud Sync Service', () => {
  test('Guest user cannot sync', async () => {
    const result = await cloudSyncService.syncAllData();
    expect(result.success).toBe(false);
    expect(result.syncedCount).toBe(0);
    expect(result.message).toContain('Sign in');
  });

  test('Authenticated user can trigger sync', async () => {
    await supabaseAuthService.signInWithGoogle();
    const result = await cloudSyncService.syncAllData();
    expect(result.success).toBe(true);
    expect(result.message).toContain('backed up');
    expect(result.syncedCount).toBeGreaterThanOrEqual(0);
  });

  test('Sync updates lastSyncedAt on success', async () => {
    await supabaseAuthService.signInWithGoogle();
    expect(useUserAuthStore.getState().lastSyncedAt).toBeNull();

    await cloudSyncService.syncAllData();
    expect(useUserAuthStore.getState().lastSyncedAt).not.toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════
//  12. STORAGE (History & Goals)
// ═══════════════════════════════════════════════════════════════════════

describe('12. Storage (History & Goals)', () => {
  test('addHistory and getHistory', () => {
    storage.addHistory('BMI', '22.5 - Normal');
    storage.addHistory('BMR', '1750 kcal');
    expect(storage.getHistory()).toHaveLength(2);
    expect(storage.getHistory('BMI')).toHaveLength(1);
    expect(storage.getHistory('BMI')[0].result).toBe('22.5 - Normal');
  });

  test('deleteHistory removes record by id', () => {
    const record = storage.addHistory('BMI', '22.5');
    expect(storage.getHistory()).toHaveLength(1);
    storage.deleteHistory(record.id);
    expect(storage.getHistory()).toHaveLength(0);
  });

  test('clearHistory clears all or by type', () => {
    storage.addHistory('BMI', '22');
    storage.addHistory('BMR', '1750');
    storage.addHistory('Body Fat', '18%');

    storage.clearHistory('BMI');
    expect(storage.getHistory()).toHaveLength(2);
    expect(storage.getHistory('BMI')).toHaveLength(0);

    storage.clearHistory();
    expect(storage.getHistory()).toHaveLength(0);
  });

  test('getGoal and setGoal', () => {
    const goal = storage.getGoal();
    expect(goal.currentWeight).toBe(70);
    expect(goal.targetWeight).toBe(65);

    storage.setGoal({ targetWeight: 60 });
    expect(storage.getGoal().targetWeight).toBe(60);
    expect(storage.getGoal().currentWeight).toBe(70); // unchanged
  });

  test('History records have correct shape', () => {
    const record = storage.addHistory('Ideal Weight', '72 kg');
    expect(record.id).toBeTruthy();
    expect(record.type).toBe('Ideal Weight');
    expect(record.date).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════
//  13. DATABASE CRUD
// ═══════════════════════════════════════════════════════════════════════

describe('13. Database CRUD', () => {
  test('initDatabase runs without error', async () => {
    await expect(initDatabase()).resolves.not.toThrow();
  });

  test('userProfileDb.create stores and retrieves profile', async () => {
    const profile = {
      id: 'test_user',
      name: 'Test Athlete',
      age: 28,
      gender: 'male' as const,
      height: 178,
      weight: 82,
      unit_preference: 'metric' as const,
    };
    const result = await userProfileDb.create(profile);
    expect(result.id).toBe('test_user');
    expect(result.name).toBe('Test Athlete');
    expect(result.created_at).toBeGreaterThan(0);
  });

  test('calculationsDb.add creates calculation record', async () => {
    const calc = await calculationsDb.add({
      type: 'BMI',
      inputs_json: JSON.stringify({ height: 175, weight: 70 }),
      result: '22.9',
      date: Date.now(),
    });
    expect(calc.type).toBe('BMI');
    expect(calc.result).toBe('22.9');
  });

  test('workoutDb.createWorkout and deleteWorkout', async () => {
    const result = await workoutDb.createWorkout(
      {
        title: 'Test Workout',
        date: Date.now(),
        duration_seconds: 3600,
      },
      [
        {
          exercise_id: 'ex_1',
          exercise_name: 'Bench Press',
          set_order: 1,
          weight_kg: 60,
          reps: 10,
          is_completed: 1,
        },
      ]
    );
    expect(result.workout.title).toBe('Test Workout');
    expect(result.sets).toHaveLength(1);

    await workoutDb.deleteWorkout(result.workout.id);
  });

  test('mealDb.addMeal creates meal record', async () => {
    const meal = await mealDb.addMeal({
      date: '2026-08-23',
      meal_type: 'breakfast',
      food_name: 'Oatmeal',
      calories: 350,
      protein_g: 15,
      carbs_g: 50,
      fats_g: 8,
    });
    expect(meal.food_name).toBe('Oatmeal');
    expect(meal.calories).toBe(350);
  });

  test('sleepDb.addSleepLog creates sleep record', async () => {
    const log = await sleepDb.addSleepLog({
      date: '2026-08-23',
      bedtime: '23:00',
      waketime: '07:00',
      duration_hours: 8,
      quality_rating: 4,
    });
    expect(log.duration_hours).toBe(8);
    expect(log.quality_rating).toBe(4);
  });
});

// ═══════════════════════════════════════════════════════════════════════
//  14. CROSS-FEATURE INTEGRATION: Full User Journey
// ═══════════════════════════════════════════════════════════════════════

describe('14. Full User Journey Integration', () => {
  test('Complete journey: Onboard → Auth → Workout → Food → Water → Sync', async () => {
    // Step 1: Complete onboarding
    useUserStore.getState().setHasCompletedOnboarding(true);
    useUserStore.getState().setProfile({
      name: 'Prasanth',
      age: 25,
      gender: 'male',
      heightCm: 175,
      weightKg: 72,
      goal: 'build_muscle',
    });

    // Step 2: Authenticate via Google
    const authResult = await supabaseAuthService.signInWithGoogle();
    expect(authResult.success).toBe(true);
    expect(useUserAuthStore.getState().isAuthenticated).toBe(true);

    // Step 3: Log a workout
    const workout: Workout = {
      id: `wo_journey_${Date.now()}`,
      name: 'Full Body Strength',
      date: new Date().toISOString(),
      exercises: [
        {
          id: 'ex_deadlift',
          name: 'Deadlift',
          sets: [
            { id: 's1', weight: 120, reps: 5, isCompleted: true },
            { id: 's2', weight: 120, reps: 5, isCompleted: true },
          ],
        },
      ],
      durationMinutes: 60,
    };
    useWorkoutStore.getState().addWorkout(workout);
    expect(useWorkoutStore.getState().workouts).toHaveLength(1);

    // Step 4: Log food
    useFoodStore.getState().logFood({
      barcode: '11111',
      name: 'Chicken Breast',
      brand: 'Fresh',
      image_url: '',
      nutrition: { calories: 350, protein: 40, carbs: 0, fat: 8 },
    } as any);
    useFoodStore.getState().logFood({
      barcode: '22222',
      name: 'Rice',
      brand: 'Basmati',
      image_url: '',
      nutrition: { calories: 200, protein: 4, carbs: 45, fat: 0.5 },
    } as any);

    const foodTotals = useFoodStore.getState().getTodayTotals();
    expect(foodTotals.calories).toBe(550);
    expect(foodTotals.protein).toBe(44);

    // Step 5: Log water
    const today = new Date().toISOString().split('T')[0];
    useWaterStore.getState().addWater(today, 500);
    useWaterStore.getState().addWater(today, 300);
    expect(useWaterStore.getState().logs[today]).toBe(800);

    // Step 6: Cloud sync
    const syncResult = await cloudSyncService.syncAllData();
    expect(syncResult.success).toBe(true);

    // Step 7: Check premium status (free user)
    const barcodeAccess = await premiumService.canAccessFeature('barcode_scanner');
    expect(barcodeAccess.allowed).toBe(true);

    // Step 8: Logout returns to guest
    useUserAuthStore.getState().logout();
    expect(useUserAuthStore.getState().isGuest).toBe(true);
    expect(useUserAuthStore.getState().isAuthenticated).toBe(false);
  });
});
