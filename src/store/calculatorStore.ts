import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BmiInputs {
  gender: 'male' | 'female' | '';
  ageStr: string;
  heightCmStr: string;
  weightKgStr: string;
  heightFtStr: string;
  heightInStr: string;
  weightLbsStr: string;
}

export interface BmrInputs {
  gender: 'male' | 'female' | '';
  ageStr: string;
  heightCmStr: string;
  weightKgStr: string;
  heightFtStr: string;
  heightInStr: string;
  weightLbsStr: string;
}

export interface BodyFatInputs {
  gender: 'male' | 'female' | '';
  heightStr: string;
  neckStr: string;
  waistStr: string;
  hipStr: string;
  weightStr: string;
}

export interface IdealWeightInputs {
  gender: 'male' | 'female' | '';
  heightCmStr: string;
  heightFtStr: string;
  heightInStr: string;
}

export interface LatestResults {
  bmi?: string;
  bmr?: string;
  bodyFat?: string;
  idealWeight?: string;
}

export interface CalculatorStoreState {
  bmiInputs: BmiInputs;
  bmrInputs: BmrInputs;
  bodyFatInputs: BodyFatInputs;
  idealWeightInputs: IdealWeightInputs;
  latestResults: LatestResults;
  unitSystem: 'metric' | 'imperial';

  // Actions
  setBmiInputs: (inputs: Partial<BmiInputs>) => void;
  setBmrInputs: (inputs: Partial<BmrInputs>) => void;
  setBodyFatInputs: (inputs: Partial<BodyFatInputs>) => void;
  setIdealWeightInputs: (inputs: Partial<IdealWeightInputs>) => void;
  setLatestResult: (type: keyof LatestResults, value: string) => void;
  setUnitSystem: (unit: 'metric' | 'imperial') => void;
  resetAllInputs: () => void;
}

const initialBmiInputs: BmiInputs = {
  gender: 'male',
  ageStr: '25',
  heightCmStr: '',
  weightKgStr: '',
  heightFtStr: '',
  heightInStr: '',
  weightLbsStr: '',
};

const initialBmrInputs: BmrInputs = {
  gender: 'male',
  ageStr: '25',
  heightCmStr: '',
  weightKgStr: '',
  heightFtStr: '',
  heightInStr: '',
  weightLbsStr: '',
};

const initialBodyFatInputs: BodyFatInputs = {
  gender: 'male',
  heightStr: '',
  neckStr: '',
  waistStr: '',
  hipStr: '',
  weightStr: '',
};

const initialIdealWeightInputs: IdealWeightInputs = {
  gender: 'male',
  heightCmStr: '',
  heightFtStr: '',
  heightInStr: '',
};

export const useCalculatorStore = create<CalculatorStoreState>()(
  persist(
    (set) => ({
      bmiInputs: initialBmiInputs,
      bmrInputs: initialBmrInputs,
      bodyFatInputs: initialBodyFatInputs,
      idealWeightInputs: initialIdealWeightInputs,
      latestResults: {},
      unitSystem: 'metric',

      setBmiInputs: (inputs) =>
        set((state) => ({
          bmiInputs: { ...state.bmiInputs, ...inputs },
        })),

      setBmrInputs: (inputs) =>
        set((state) => ({
          bmrInputs: { ...state.bmrInputs, ...inputs },
        })),

      setBodyFatInputs: (inputs) =>
        set((state) => ({
          bodyFatInputs: { ...state.bodyFatInputs, ...inputs },
        })),

      setIdealWeightInputs: (inputs) =>
        set((state) => ({
          idealWeightInputs: { ...state.idealWeightInputs, ...inputs },
        })),

      setLatestResult: (type, value) =>
        set((state) => ({
          latestResults: { ...state.latestResults, [type]: value },
        })),

      setUnitSystem: (unitSystem) => set({ unitSystem }),

      resetAllInputs: () =>
        set({
          bmiInputs: initialBmiInputs,
          bmrInputs: initialBmrInputs,
          bodyFatInputs: initialBodyFatInputs,
          idealWeightInputs: initialIdealWeightInputs,
        }),
    }),
    {
      name: 'fitmetrics-calculator-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
