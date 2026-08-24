// Mock react-native-purchases
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

// Mock Google Sign-in
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn().mockResolvedValue({
      data: {
        idToken: 'mock_google_id_token',
        user: { id: 'mock_123', email: 'user@gmail.com', name: 'Test Athlete' },
      },
      idToken: 'mock_google_id_token',
      user: { id: 'mock_123', email: 'user@gmail.com', name: 'Test Athlete' },
    }),
    signOut: jest.fn().mockResolvedValue(undefined),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
}));

import { useUserAuthStore } from '../store/userAuthStore';
import { supabaseAuthService } from '../services/auth/supabaseAuthService';
import { cloudSyncService } from '../services/sync/cloudSyncService';
import { premiumService, PREMIUM_CONFIG } from '../services/premium/premiumService';
import { useUserStore } from '../store/userStore';

// Mock WebBrowser, Linking and AsyncStorage
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

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
}));

// Mock Supabase
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
            email: 'user@gmail.com',
            user_metadata: { full_name: 'Test Athlete' },
          },
        },
        error: null,
      }),
      getUser: jest.fn().mockResolvedValue({
        data: {
          user: {
            id: 'mock_user_123',
            email: 'user@gmail.com',
            user_metadata: { full_name: 'Test Athlete' },
          },
        },
        error: null,
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
    from: jest.fn(() => ({
      upsert: jest.fn().mockResolvedValue({ error: null }),
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

describe('User Authentication & Cloud Sync System', () => {
  beforeEach(() => {
    useUserAuthStore.getState().logout();
  });

  test('Initial state defaults to Guest mode', () => {
    const state = useUserAuthStore.getState();
    expect(state.isGuest).toBe(true);
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  test('Google Sign-In logs in user successfully', async () => {
    const res = await supabaseAuthService.signInWithGoogle();
    expect(res.success).toBe(true);
    expect(res.message).toContain('Welcome back');

    const state = useUserAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe('user@gmail.com');
  });

  test('Sign Out returns user to Guest mode', async () => {
    await supabaseAuthService.signInWithGoogle();
    expect(useUserAuthStore.getState().isAuthenticated).toBe(true);

    useUserAuthStore.getState().logout();
    const state = useUserAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isGuest).toBe(true);
    expect(state.user).toBeNull();
  });

  test('Cloud Sync returns false when guest user attempts sync', async () => {
    const res = await cloudSyncService.syncAllData();
    expect(res.success).toBe(false);
    expect(res.message).toContain('Sign in');
  });
});

describe('Premium Feature Gating System', () => {
  beforeEach(() => {
    useUserStore.getState().setPremiumStatus(false);
  });

  test('Free user gets limited daily barcode scans', async () => {
    const access = await premiumService.canAccessFeature('barcode_scanner');
    expect(access.allowed).toBe(true);
  });

  test('Pro user has full access to all premium features', async () => {
    useUserStore.getState().setPremiumStatus(true);

    const barcodeAccess = await premiumService.canAccessFeature('barcode_scanner');
    expect(barcodeAccess.allowed).toBe(true);

    const aiAccess = await premiumService.canAccessFeature('ai_coach');
    expect(aiAccess.allowed).toBe(true);

    const pdfAccess = await premiumService.canAccessFeature('pdf_export');
    expect(pdfAccess.allowed).toBe(true);
  });
});
