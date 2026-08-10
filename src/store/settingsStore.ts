import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SettingsStoreState {
  unitSystem: 'metric' | 'imperial';
  notificationsEnabled: boolean;
  dailyReminderTime: string; // HH:mm format, e.g. "08:00"
  language: string; // e.g. "en", "es", "ta"
  hapticFeedback: boolean;
  soundEnabled: boolean;
  autoSaveCalculations: boolean;

  // Actions
  setUnitSystem: (unit: 'metric' | 'imperial') => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setDailyReminderTime: (time: string) => void;
  setLanguage: (lang: string) => void;
  setHapticFeedback: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setAutoSaveCalculations: (enabled: boolean) => void;
  updateSettings: (settings: Partial<Omit<SettingsStoreState, 'setUnitSystem' | 'setNotificationsEnabled' | 'setDailyReminderTime' | 'setLanguage' | 'setHapticFeedback' | 'setSoundEnabled' | 'setAutoSaveCalculations' | 'updateSettings'>>) => void;
}

export const useSettingsStore = create<SettingsStoreState>()(
  persist(
    (set) => ({
      unitSystem: 'metric',
      notificationsEnabled: true,
      dailyReminderTime: '08:00',
      language: 'en',
      hapticFeedback: true,
      soundEnabled: true,
      autoSaveCalculations: true,

      setUnitSystem: (unitSystem) => set({ unitSystem }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setDailyReminderTime: (dailyReminderTime) => set({ dailyReminderTime }),
      setLanguage: (language) => set({ language }),
      setHapticFeedback: (hapticFeedback) => set({ hapticFeedback }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setAutoSaveCalculations: (autoSaveCalculations) => set({ autoSaveCalculations }),
      updateSettings: (updates) => set((state) => ({ ...state, ...updates })),
    }),
    {
      name: 'fitmetrics-settings-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
