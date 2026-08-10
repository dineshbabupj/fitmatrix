export interface ValidationResult<T> {
  isValid: boolean;
  errors: Record<string, string>;
  data?: T;
}

// ─────────────────────────────────────────────
// BMI Validation
// ─────────────────────────────────────────────

export interface BmiInputParams {
  gender: 'male' | 'female' | '';
  ageStr: string;
  unitSystem: 'metric' | 'imperial';
  heightCmStr: string;
  weightKgStr: string;
  heightFtStr: string;
  heightInStr: string;
  weightLbsStr: string;
}

export interface ValidatedBmiData {
  gender: 'male' | 'female';
  age: number;
  unitSystem: 'metric' | 'imperial';
  weightKg?: number;
  heightCm?: number;
  weightLbs?: number;
  totalInches?: number;
}

export const validateBmiInputs = (params: BmiInputParams): ValidationResult<ValidatedBmiData> => {
  const errors: Record<string, string> = {};

  if (!params.gender) {
    errors.gender = 'Please select a gender (Male or Female).';
  }

  const age = parseInt(params.ageStr, 10);
  if (!params.ageStr || isNaN(age)) {
    errors.age = 'Please enter a valid age.';
  } else if (age < 1 || age > 120) {
    errors.age = 'Age must be between 1 and 120 years.';
  }

  let weightKg: number | undefined;
  let heightCm: number | undefined;
  let weightLbs: number | undefined;
  let totalInches: number | undefined;

  if (params.unitSystem === 'metric') {
    const h = parseFloat(params.heightCmStr);
    if (!params.heightCmStr || isNaN(h)) {
      errors.height = 'Please enter your height in cm.';
    } else if (h < 50 || h > 300) {
      errors.height = 'Height must be between 50 cm and 300 cm.';
    } else {
      heightCm = h;
    }

    const w = parseFloat(params.weightKgStr);
    if (!params.weightKgStr || isNaN(w)) {
      errors.weight = 'Please enter your weight in kg.';
    } else if (w < 2 || w > 500) {
      errors.weight = 'Weight must be between 2 kg and 500 kg.';
    } else {
      weightKg = w;
    }
  } else {
    const ft = parseFloat(params.heightFtStr) || 0;
    const inc = parseFloat(params.heightInStr) || 0;
    const totInches = ft * 12 + inc;

    if (!params.heightFtStr && !params.heightInStr) {
      errors.height = 'Please enter your height in feet and inches.';
    } else if (totInches < 20 || totInches > 120) {
      errors.height = 'Total height must be between 20 inches (1ft 8in) and 120 inches (10ft).';
    } else {
      totalInches = totInches;
    }

    const lbs = parseFloat(params.weightLbsStr);
    if (!params.weightLbsStr || isNaN(lbs)) {
      errors.weight = 'Please enter your weight in lbs.';
    } else if (lbs < 5 || lbs > 1100) {
      errors.weight = 'Weight must be between 5 lbs and 1100 lbs.';
    } else {
      weightLbs = lbs;
    }
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
    data: isValid
      ? {
          gender: params.gender as 'male' | 'female',
          age,
          unitSystem: params.unitSystem,
          weightKg,
          heightCm,
          weightLbs,
          totalInches,
        }
      : undefined,
  };
};

// ─────────────────────────────────────────────
// BMR Validation (same height/weight/age/gender as BMI)
// ─────────────────────────────────────────────

export type BmrInputParams = BmiInputParams;
export type ValidatedBmrData = ValidatedBmiData;

export const validateBmrInputs = (params: BmrInputParams): ValidationResult<ValidatedBmrData> => {
  return validateBmiInputs(params);
};

// ─────────────────────────────────────────────
// Body Fat Validation (US Navy method)
// ─────────────────────────────────────────────

export interface BodyFatInputParams {
  gender: 'male' | 'female' | '';
  unitSystem: 'metric' | 'imperial';
  heightStr: string;
  neckStr: string;
  waistStr: string;
  hipStr: string;
}

export interface ValidatedBodyFatData {
  gender: 'male' | 'female';
  unitSystem: 'metric' | 'imperial';
  heightCm: number;
  neckCm: number;
  waistCm: number;
  hipCm: number;
}

export const validateBodyFatInputs = (params: BodyFatInputParams): ValidationResult<ValidatedBodyFatData> => {
  const errors: Record<string, string> = {};
  const unit = params.unitSystem === 'metric' ? 'cm' : 'inches';

  if (!params.gender) {
    errors.gender = 'Please select a gender (Male or Female).';
  }

  // Height
  const h = parseFloat(params.heightStr);
  if (!params.heightStr || isNaN(h)) {
    errors.height = `Please enter your height in ${unit}.`;
  } else if (params.unitSystem === 'metric' && (h < 50 || h > 300)) {
    errors.height = 'Height must be between 50 cm and 300 cm.';
  } else if (params.unitSystem === 'imperial' && (h < 20 || h > 120)) {
    errors.height = 'Height must be between 20 and 120 inches.';
  }

  // Neck
  const n = parseFloat(params.neckStr);
  if (!params.neckStr || isNaN(n)) {
    errors.neck = `Please enter your neck circumference in ${unit}.`;
  } else if (n <= 0 || n > 100) {
    errors.neck = `Neck circumference must be a valid positive value (up to 100 ${unit}).`;
  }

  // Waist
  const w = parseFloat(params.waistStr);
  if (!params.waistStr || isNaN(w)) {
    errors.waist = `Please enter your waist circumference in ${unit}.`;
  } else if (w <= 0 || w > 300) {
    errors.waist = `Waist circumference must be a valid positive value (up to 300 ${unit}).`;
  }

  // Hip (required for females)
  let hp = parseFloat(params.hipStr) || 0;
  if (params.gender === 'female') {
    if (!params.hipStr || isNaN(parseFloat(params.hipStr))) {
      errors.hip = `Hip circumference is required for females. Enter value in ${unit}.`;
    } else if (hp <= 0 || hp > 300) {
      errors.hip = `Hip circumference must be a valid positive value (up to 300 ${unit}).`;
    }
  }

  const isValid = Object.keys(errors).length === 0;

  if (!isValid) return { isValid, errors };

  // Convert imperial to cm for calculation
  const factor = params.unitSystem === 'imperial' ? 2.54 : 1;
  return {
    isValid: true,
    errors: {},
    data: {
      gender: params.gender as 'male' | 'female',
      unitSystem: params.unitSystem,
      heightCm: h * factor,
      neckCm: n * factor,
      waistCm: w * factor,
      hipCm: hp * factor,
    },
  };
};

// ─────────────────────────────────────────────
// Ideal Weight Validation
// ─────────────────────────────────────────────

export interface IdealWeightInputParams {
  gender: 'male' | 'female' | '';
  unitSystem: 'metric' | 'imperial';
  heightCmStr: string;
  heightFtStr: string;
  heightInStr: string;
}

export interface ValidatedIdealWeightData {
  gender: 'male' | 'female';
  unitSystem: 'metric' | 'imperial';
  heightCm: number;
}

export const validateIdealWeightInputs = (params: IdealWeightInputParams): ValidationResult<ValidatedIdealWeightData> => {
  const errors: Record<string, string> = {};

  if (!params.gender) {
    errors.gender = 'Please select a gender (Male or Female).';
  }

  let heightCm = 0;
  if (params.unitSystem === 'metric') {
    const h = parseFloat(params.heightCmStr);
    if (!params.heightCmStr || isNaN(h)) {
      errors.height = 'Please enter your height in cm.';
    } else if (h < 50 || h > 300) {
      errors.height = 'Height must be between 50 cm and 300 cm.';
    } else {
      heightCm = h;
    }
  } else {
    const ft = parseFloat(params.heightFtStr) || 0;
    const inc = parseFloat(params.heightInStr) || 0;
    const totInches = ft * 12 + inc;

    if (!params.heightFtStr && !params.heightInStr) {
      errors.height = 'Please enter your height in feet and inches.';
    } else if (totInches < 20 || totInches > 120) {
      errors.height = 'Total height must be between 20 inches (1ft 8in) and 120 inches (10ft).';
    } else {
      heightCm = totInches * 2.54;
    }
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
    data: isValid
      ? {
          gender: params.gender as 'male' | 'female',
          unitSystem: params.unitSystem,
          heightCm,
        }
      : undefined,
  };
};

