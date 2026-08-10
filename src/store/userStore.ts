import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  heightCm: number;
  weightKg: number;
  unitPreference: 'metric' | 'imperial';
}

export interface AuthState {
  isLoggedIn: boolean;
  userId: string | null;
  token: string | null;
}

export interface UserStoreState {
  profile: UserProfile;
  auth: AuthState;
  hasCompletedOnboarding: boolean;
  isPremium: boolean;
  
  // Actions
  setProfile: (profileUpdates: Partial<UserProfile>) => void;
  setAuth: (authUpdates: Partial<AuthState>) => void;
  setHasCompletedOnboarding: (completed: boolean) => void;
  setPremiumStatus: (isPremium: boolean) => void;
  logout: () => void;
}

const initialProfile: UserProfile = {
  id: 'guest_user',
  name: 'User',
  age: 25,
  gender: 'male',
  heightCm: 175,
  weightKg: 70,
  unitPreference: 'metric',
};

const initialAuth: AuthState = {
  isLoggedIn: false,
  userId: 'guest_user',
  token: null,
};

export const useUserStore = create<UserStoreState>()(
  persist(
    (set) => ({
      profile: initialProfile,
      auth: initialAuth,
      hasCompletedOnboarding: false,
      isPremium: false,

      setProfile: (profileUpdates) =>
        set((state) => ({
          profile: { ...state.profile, ...profileUpdates },
        })),

      setAuth: (authUpdates) =>
        set((state) => ({
          auth: { ...state.auth, ...authUpdates },
        })),

      setHasCompletedOnboarding: (hasCompletedOnboarding) => set({ hasCompletedOnboarding }),

      setPremiumStatus: (isPremium) => set({ isPremium }),

      logout: () =>
        set({
          profile: initialProfile,
          auth: initialAuth,
          hasCompletedOnboarding: false,
          isPremium: false,
        }),
    }),
    {
      name: 'fitmetrics-user-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
