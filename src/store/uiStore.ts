import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'dark' | 'light' | 'system';

export interface UIStoreState {
  themeMode: ThemeMode;
  isLoading: boolean;
  globalError: string | null;
  activeModal: string | null;

  // Actions
  setThemeMode: (mode: ThemeMode) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setActiveModal: (modalName: string | null) => void;
}

export const useUIStore = create<UIStoreState>()(
  persist(
    (set) => ({
      themeMode: 'dark',
      isLoading: false,
      globalError: null,
      activeModal: null,

      setThemeMode: (themeMode) => set({ themeMode }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (globalError) => set({ globalError }),
      clearError: () => set({ globalError: null }),
      setActiveModal: (activeModal) => set({ activeModal }),
    }),
    {
      name: 'fitmetrics-ui-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ themeMode: state.themeMode }), // Persist only theme preference
    }
  )
);
