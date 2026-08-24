import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfileAuth {
  uid: string;
  phoneNumber?: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  isAnonymous: boolean;
  createdAt: number;
}

interface UserAuthState {
  user: UserProfileAuth | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isAuthModalVisible: boolean;
  lastSyncedAt: number | null;
  isSyncing: boolean;

  // Actions
  setUser: (user: UserProfileAuth | null) => void;
  setGuestMode: () => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  setLastSyncedAt: (timestamp: number) => void;
  setIsSyncing: (syncing: boolean) => void;
  logout: () => Promise<void>;
  loadPersistedAuth: () => Promise<void>;
}

const AUTH_STORAGE_KEY = 'fitmetrics_user_auth_v1';

export const useUserAuthStore = create<UserAuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isGuest: true,
  isAuthModalVisible: false,
  lastSyncedAt: null,
  isSyncing: false,

  setUser: (user) => {
    const isAuthenticated = !!user && !user.isAnonymous;
    const newState = {
      user,
      isAuthenticated,
      isGuest: !isAuthenticated,
    };
    set(newState);
    if (user) {
      AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user)).catch(() => {});
    } else {
      AsyncStorage.removeItem(AUTH_STORAGE_KEY).catch(() => {});
    }
  },

  setGuestMode: () => {
    set({
      user: null,
      isAuthenticated: false,
      isGuest: true,
      isAuthModalVisible: false,
    });
  },

  openAuthModal: () => set({ isAuthModalVisible: true }),
  closeAuthModal: () => set({ isAuthModalVisible: false }),

  setLastSyncedAt: (timestamp) => set({ lastSyncedAt: timestamp }),
  setIsSyncing: (syncing) => set({ isSyncing: syncing }),

  logout: async () => {
    set({
      user: null,
      isAuthenticated: false,
      isGuest: true,
      lastSyncedAt: null,
      isAuthModalVisible: false,
    });
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    // Unlink RevenueCat from this user on logout
    try {
      const { revenueCatService } = require('../services/iap/revenueCatService');
      await revenueCatService.logOut();
    } catch {}
  },

  loadPersistedAuth: async () => {
    try {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const user: UserProfileAuth = JSON.parse(stored);
        set({
          user,
          isAuthenticated: !user.isAnonymous,
          isGuest: user.isAnonymous,
        });
      }
    } catch (e) {
      console.warn('[UserAuthStore] Failed to load persisted auth:', e);
    }
  },
}));
