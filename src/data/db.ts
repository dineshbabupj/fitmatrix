import * as SQLite from 'expo-sqlite';

// Data Interfaces
export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  height: number; // in cm
  weight: number; // in kg
  unit_preference: 'metric' | 'imperial';
  created_at: number;
  updated_at: number;
}

export interface UserSettings {
  id: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications_enabled: number; // 0 or 1
  updated_at: number;
}

export interface CalculationRecord {
  id: string;
  type: 'BMI' | 'BMR' | 'Body Fat' | 'Ideal Weight' | 'MACRO';
  inputs_json: string;
  result: string;
  category?: string;
  date: number;
  user_id?: string;
  created_at: number;
  updated_at?: number;
  sync_status?: 'synced' | 'pending' | 'failed';
  synced_at?: number;
}

export interface Exercise {
  id: string;
  name: string;
  category: string;
  equipment?: string;
  description?: string;
  muscle_group?: string;
  gif_url?: string;
  workout_type?: 'Home' | 'Gym' | 'Both';
  is_custom?: number;
  created_at: number;
}

export interface Workout {
  id: string;
  title: string;
  date: number;
  duration_seconds: number;
  notes?: string;
  calories_burned?: number;
  created_at: number;
}

export interface WorkoutSet {
  id: string;
  workout_id: string;
  exercise_id: string;
  exercise_name: string;
  set_order: number;
  weight_kg: number;
  reps: number;
  rir?: number;
  is_completed: number;
  created_at: number;
}

export interface MealLog {
  id: string;
  date: string; // YYYY-MM-DD
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  barcode?: string;
  created_at: number;
}

export interface SleepLog {
  id: string;
  date: string; // YYYY-MM-DD
  bedtime: string; // HH:mm
  waketime: string; // HH:mm
  duration_hours: number;
  quality_rating: number; // 1 to 5
  notes?: string;
  created_at: number;
}

export interface MigrationRecord {
  version: number;
  name: string;
  applied_at: number;
}

// Database Singleton Instance
let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('fitmetrics.db');
    await dbInstance.execAsync('PRAGMA foreign_keys = ON;');
  }
  return dbInstance;
};

// ----------------------------------------------------
// Database Initialization & Migration Engine
// ----------------------------------------------------

export const migrations: { version: number; name: string; sql: string }[] = [
  {
    version: 1,
    name: 'v1_initial_schema',
    sql: `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_profiles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        age INTEGER NOT NULL CHECK(age > 0 AND age < 150),
        gender TEXT NOT NULL CHECK(gender IN ('male', 'female')),
        height REAL NOT NULL CHECK(height > 0),
        weight REAL NOT NULL CHECK(weight > 0),
        unit_preference TEXT NOT NULL DEFAULT 'metric' CHECK(unit_preference IN ('metric', 'imperial')),
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY DEFAULT 'default',
        theme TEXT NOT NULL DEFAULT 'dark' CHECK(theme IN ('light', 'dark', 'system')),
        language TEXT NOT NULL DEFAULT 'en',
        notifications_enabled INTEGER NOT NULL DEFAULT 1 CHECK(notifications_enabled IN (0, 1)),
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS calculations (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK(type IN ('BMI', 'BMR', 'Body Fat', 'Ideal Weight', 'MACRO')),
        inputs_json TEXT NOT NULL,
        result TEXT NOT NULL,
        category TEXT,
        date INTEGER NOT NULL,
        user_id TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_calculations_type_date ON calculations(type, date DESC);
      CREATE INDEX IF NOT EXISTS idx_calculations_user_id ON calculations(user_id);
    `,
  },
  {
    version: 2,
    name: 'v2_offline_sync_columns',
    sql: `
      ALTER TABLE calculations ADD COLUMN updated_at INTEGER DEFAULT (strftime('%s','now') * 1000);
      ALTER TABLE calculations ADD COLUMN sync_status TEXT DEFAULT 'pending' CHECK(sync_status IN ('synced', 'pending', 'failed'));
      ALTER TABLE calculations ADD COLUMN synced_at INTEGER;
      CREATE INDEX IF NOT EXISTS idx_calculations_sync_status ON calculations(sync_status);
    `,
  },
  {
    version: 3,
    name: 'v3_workout_engine',
    sql: `
      CREATE TABLE IF NOT EXISTS exercises (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        equipment TEXT,
        description TEXT,
        muscle_group TEXT,
        is_custom INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS workouts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        date INTEGER NOT NULL,
        duration_seconds INTEGER DEFAULT 0,
        notes TEXT,
        calories_burned REAL DEFAULT 0,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS workout_sets (
        id TEXT PRIMARY KEY,
        workout_id TEXT NOT NULL,
        exercise_id TEXT NOT NULL,
        exercise_name TEXT NOT NULL,
        set_order INTEGER NOT NULL,
        weight_kg REAL NOT NULL DEFAULT 0,
        reps INTEGER NOT NULL DEFAULT 0,
        rir INTEGER DEFAULT 0,
        is_completed INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date DESC);
      CREATE INDEX IF NOT EXISTS idx_workout_sets_workout ON workout_sets(workout_id);
      CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise ON workout_sets(exercise_id);
      CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category);
    `,
  },
  {
    version: 4,
    name: 'v4_daily_meals',
    sql: `
      CREATE TABLE IF NOT EXISTS daily_meals (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        meal_type TEXT NOT NULL CHECK(meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
        food_name TEXT NOT NULL,
        calories REAL NOT NULL DEFAULT 0,
        protein_g REAL NOT NULL DEFAULT 0,
        carbs_g REAL NOT NULL DEFAULT 0,
        fats_g REAL NOT NULL DEFAULT 0,
        barcode TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_daily_meals_date ON daily_meals(date);
    `,
  },
  {
    version: 5,
    name: 'v5_sleep_logs',
    sql: `
      CREATE TABLE IF NOT EXISTS sleep_logs (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        bedtime TEXT NOT NULL,
        waketime TEXT NOT NULL,
        duration_hours REAL NOT NULL DEFAULT 0,
        quality_rating INTEGER NOT NULL DEFAULT 3,
        notes TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_sleep_logs_date ON sleep_logs(date);
    `,
  },
];

export const initDatabase = async (): Promise<void> => {
  const db = await getDatabase();

  // Ensure migrations table exists
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at INTEGER NOT NULL
    );
  `);

  // Fetch current applied migrations
  const appliedRows = await db.getAllAsync<MigrationRecord>(
    'SELECT * FROM schema_migrations ORDER BY version ASC;'
  );
  const appliedVersions = new Set(appliedRows.map((r) => r.version));

  // Run unapplied migrations sequentially
  for (const migration of migrations) {
    if (!appliedVersions.has(migration.version)) {
      await db.execAsync(migration.sql);
      await db.runAsync(
        'INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?);',
        [migration.version, migration.name, Date.now()]
      );
    }
  }
};

// ----------------------------------------------------
// CRUD Operations: User Profiles
// ----------------------------------------------------

export const userProfileDb = {
  create: async (profile: Omit<UserProfile, 'created_at' | 'updated_at'>): Promise<UserProfile> => {
    const db = await getDatabase();
    const now = Date.now();
    const record: UserProfile = { ...profile, created_at: now, updated_at: now };
    await db.runAsync(
      `INSERT OR REPLACE INTO user_profiles (id, name, age, gender, height, weight, unit_preference, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        record.id,
        record.name,
        record.age,
        record.gender,
        record.height,
        record.weight,
        record.unit_preference,
        record.created_at,
        record.updated_at,
      ]
    );
    return record;
  },

  getById: async (id: string): Promise<UserProfile | null> => {
    const db = await getDatabase();
    return await db.getFirstAsync<UserProfile>(
      'SELECT * FROM user_profiles WHERE id = ?;',
      [id]
    );
  },

  getAll: async (): Promise<UserProfile[]> => {
    const db = await getDatabase();
    return await db.getAllAsync<UserProfile>('SELECT * FROM user_profiles ORDER BY created_at DESC;');
  },

  update: async (id: string, updates: Partial<Omit<UserProfile, 'id' | 'created_at'>>): Promise<void> => {
    const db = await getDatabase();
    const current = await userProfileDb.getById(id);
    if (!current) throw new Error(`UserProfile ${id} not found`);

    const updated = { ...current, ...updates, updated_at: Date.now() };
    await db.runAsync(
      `UPDATE user_profiles SET name=?, age=?, gender=?, height=?, weight=?, unit_preference=?, updated_at=? WHERE id=?;`,
      [
        updated.name,
        updated.age,
        updated.gender,
        updated.height,
        updated.weight,
        updated.unit_preference,
        updated.updated_at,
        id,
      ]
    );
  },

  delete: async (id: string): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM user_profiles WHERE id = ?;', [id]);
  },
};

// ----------------------------------------------------
// CRUD Operations: Settings
// ----------------------------------------------------

export const settingsDb = {
  get: async (): Promise<UserSettings> => {
    const db = await getDatabase();
    const row = await db.getFirstAsync<UserSettings>('SELECT * FROM settings WHERE id = "default";');
    if (row) return row;

    // Default settings fallback
    const defaultSettings: UserSettings = {
      id: 'default',
      theme: 'dark',
      language: 'en',
      notifications_enabled: 1,
      updated_at: Date.now(),
    };
    await db.runAsync(
      `INSERT OR IGNORE INTO settings (id, theme, language, notifications_enabled, updated_at) VALUES (?, ?, ?, ?, ?);`,
      [
        defaultSettings.id,
        defaultSettings.theme,
        defaultSettings.language,
        defaultSettings.notifications_enabled,
        defaultSettings.updated_at,
      ]
    );
    return defaultSettings;
  },

  update: async (updates: Partial<Omit<UserSettings, 'id'>>): Promise<UserSettings> => {
    const db = await getDatabase();
    const current = await settingsDb.get();
    const updated: UserSettings = { ...current, ...updates, updated_at: Date.now() };
    await db.runAsync(
      `INSERT OR REPLACE INTO settings (id, theme, language, notifications_enabled, updated_at) VALUES (?, ?, ?, ?, ?);`,
      [
        updated.id,
        updated.theme,
        updated.language,
        updated.notifications_enabled,
        updated.updated_at,
      ]
    );
    return updated;
  },
};

// ----------------------------------------------------
// CRUD Operations: Calculations
// ----------------------------------------------------

export const calculationsDb = {
  add: async (
    calc: Omit<CalculationRecord, 'id' | 'created_at'> & { id?: string }
  ): Promise<CalculationRecord> => {
    const db = await getDatabase();
    const now = Date.now();
    const record: CalculationRecord = {
      id: calc.id || now.toString(),
      type: calc.type,
      inputs_json: calc.inputs_json,
      result: calc.result,
      category: calc.category || undefined,
      date: calc.date || now,
      user_id: calc.user_id || undefined,
      created_at: now,
    };

    await db.runAsync(
      `INSERT INTO calculations (id, type, inputs_json, result, category, date, user_id, created_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending');`,
      [
        record.id,
        record.type,
        record.inputs_json,
        record.result,
        record.category || null,
        record.date,
        record.user_id || null,
        record.created_at,
      ]
    );

    // Notify syncEngine of new pending calculation for offline sync & status banner
    try {
      const { syncEngine } = require('../services/offline/syncEngine');
      if (syncEngine && typeof syncEngine.onCalculationAdded === 'function') {
        syncEngine.onCalculationAdded();
      }
    } catch {
      // Ignore in non-browser/test environments
    }

    return record;
  },

  getAll: async (type?: string, userId?: string): Promise<CalculationRecord[]> => {
    const db = await getDatabase();
    if (type && userId) {
      return await db.getAllAsync<CalculationRecord>(
        'SELECT * FROM calculations WHERE type = ? AND user_id = ? ORDER BY date DESC;',
        [type, userId]
      );
    } else if (type) {
      return await db.getAllAsync<CalculationRecord>(
        'SELECT * FROM calculations WHERE type = ? ORDER BY date DESC;',
        [type]
      );
    } else if (userId) {
      return await db.getAllAsync<CalculationRecord>(
        'SELECT * FROM calculations WHERE user_id = ? ORDER BY date DESC;',
        [userId]
      );
    }
    return await db.getAllAsync<CalculationRecord>(
      'SELECT * FROM calculations ORDER BY date DESC;'
    );
  },

  getById: async (id: string): Promise<CalculationRecord | null> => {
    const db = await getDatabase();
    return await db.getFirstAsync<CalculationRecord>(
      'SELECT * FROM calculations WHERE id = ?;',
      [id]
    );
  },

  getPendingSync: async (): Promise<CalculationRecord[]> => {
    const db = await getDatabase();
    return await db.getAllAsync<CalculationRecord>(
      'SELECT * FROM calculations WHERE sync_status = "pending" OR sync_status = "failed" ORDER BY date ASC;'
    );
  },

  updateSyncStatus: async (
    id: string,
    syncStatus: 'synced' | 'pending' | 'failed',
    syncedAt?: number
  ): Promise<void> => {
    const db = await getDatabase();
    const now = Date.now();
    await db.runAsync(
      'UPDATE calculations SET sync_status = ?, synced_at = ?, updated_at = ? WHERE id = ?;',
      [syncStatus, syncedAt || (syncStatus === 'synced' ? now : null), now, id]
    );
  },

  delete: async (id: string): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM calculations WHERE id = ?;', [id]);
  },

  clear: async (type?: string, userId?: string): Promise<void> => {
    const db = await getDatabase();
    if (type && userId) {
      await db.runAsync('DELETE FROM calculations WHERE type = ? AND user_id = ?;', [type, userId]);
    } else if (type) {
      await db.runAsync('DELETE FROM calculations WHERE type = ?;', [type]);
    } else if (userId) {
      await db.runAsync('DELETE FROM calculations WHERE user_id = ?;', [userId]);
    } else {
      await db.runAsync('DELETE FROM calculations;');
    }
  },
};

// ----------------------------------------------------
// CRUD Operations: Exercises
// ----------------------------------------------------

export const exerciseDb = {
  saveBatch: async (exercises: Exercise[]): Promise<void> => {
    const db = await getDatabase();
    for (const ex of exercises) {
      await db.runAsync(
        `INSERT OR REPLACE INTO exercises (id, name, category, equipment, description, muscle_group, is_custom, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          ex.id,
          ex.name,
          ex.category,
          ex.equipment || null,
          ex.description || null,
          ex.muscle_group || null,
          ex.is_custom || 0,
          ex.created_at || Date.now(),
        ]
      );
    }
  },

  getAll: async (category?: string): Promise<Exercise[]> => {
    const db = await getDatabase();
    if (category) {
      return await db.getAllAsync<Exercise>(
        'SELECT * FROM exercises WHERE category = ? ORDER BY name ASC;',
        [category]
      );
    }
    return await db.getAllAsync<Exercise>('SELECT * FROM exercises ORDER BY name ASC;');
  },

  search: async (query: string): Promise<Exercise[]> => {
    const db = await getDatabase();
    const pattern = `%${query}%`;
    return await db.getAllAsync<Exercise>(
      'SELECT * FROM exercises WHERE name LIKE ? OR category LIKE ? OR muscle_group LIKE ? ORDER BY name ASC;',
      [pattern, pattern, pattern]
    );
  },
};

// ----------------------------------------------------
// CRUD Operations: Workouts & Sets
// ----------------------------------------------------

export const workoutDb = {
  createWorkout: async (
    workout: Omit<Workout, 'id' | 'created_at'>,
    sets: Omit<WorkoutSet, 'id' | 'workout_id' | 'created_at'>[]
  ): Promise<{ workout: Workout; sets: WorkoutSet[] }> => {
    const db = await getDatabase();
    const now = Date.now();
    const workoutId = `wo_${now}_${Math.random().toString(36).substr(2, 5)}`;

    const record: Workout = {
      id: workoutId,
      title: workout.title,
      date: workout.date || now,
      duration_seconds: workout.duration_seconds || 0,
      notes: workout.notes || undefined,
      calories_burned: workout.calories_burned || 0,
      created_at: now,
    };

    await db.runAsync(
      `INSERT INTO workouts (id, title, date, duration_seconds, notes, calories_burned, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        record.id,
        record.title,
        record.date,
        record.duration_seconds,
        record.notes || null,
        record.calories_burned || 0,
        record.created_at,
      ]
    );

    const createdSets: WorkoutSet[] = [];
    for (let i = 0; i < sets.length; i++) {
      const s = sets[i];
      const setId = `ws_${now}_${i}`;
      const setRecord: WorkoutSet = {
        id: setId,
        workout_id: workoutId,
        exercise_id: s.exercise_id,
        exercise_name: s.exercise_name,
        set_order: s.set_order || i + 1,
        weight_kg: s.weight_kg,
        reps: s.reps,
        rir: s.rir || 0,
        is_completed: s.is_completed || 1,
        created_at: now,
      };

      await db.runAsync(
        `INSERT INTO workout_sets (id, workout_id, exercise_id, exercise_name, set_order, weight_kg, reps, rir, is_completed, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          setRecord.id,
          setRecord.workout_id,
          setRecord.exercise_id,
          setRecord.exercise_name,
          setRecord.set_order,
          setRecord.weight_kg,
          setRecord.reps,
          setRecord.rir || 0,
          setRecord.is_completed,
          setRecord.created_at,
        ]
      );
      createdSets.push(setRecord);
    }

    return { workout: record, sets: createdSets };
  },

  getAllWorkouts: async (limit: number = 30): Promise<Workout[]> => {
    const db = await getDatabase();
    return await db.getAllAsync<Workout>(
      'SELECT * FROM workouts ORDER BY date DESC LIMIT ?;',
      [limit]
    );
  },

  getWorkoutSets: async (workoutId: string): Promise<WorkoutSet[]> => {
    const db = await getDatabase();
    return await db.getAllAsync<WorkoutSet>(
      'SELECT * FROM workout_sets WHERE workout_id = ? ORDER BY set_order ASC;',
      [workoutId]
    );
  },

  deleteWorkout: async (id: string): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM workout_sets WHERE workout_id = ?;', [id]);
    await db.runAsync('DELETE FROM workouts WHERE id = ?;', [id]);
  },
};

// ----------------------------------------------------
// CRUD Operations: Daily Meals
// ----------------------------------------------------

export const mealDb = {
  addMeal: async (
    meal: Omit<MealLog, 'id' | 'created_at'>
  ): Promise<MealLog> => {
    const db = await getDatabase();
    const now = Date.now();
    const id = `meal_${now}_${Math.random().toString(36).substr(2, 5)}`;
    const record: MealLog = {
      id,
      date: meal.date,
      meal_type: meal.meal_type,
      food_name: meal.food_name,
      calories: meal.calories,
      protein_g: meal.protein_g,
      carbs_g: meal.carbs_g,
      fats_g: meal.fats_g,
      barcode: meal.barcode || undefined,
      created_at: now,
    };

    await db.runAsync(
      `INSERT INTO daily_meals (id, date, meal_type, food_name, calories, protein_g, carbs_g, fats_g, barcode, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        record.id,
        record.date,
        record.meal_type,
        record.food_name,
        record.calories,
        record.protein_g,
        record.carbs_g,
        record.fats_g,
        record.barcode || null,
        record.created_at,
      ]
    );

    return record;
  },

  getByDate: async (dateStr: string): Promise<MealLog[]> => {
    const db = await getDatabase();
    return await db.getAllAsync<MealLog>(
      'SELECT * FROM daily_meals WHERE date = ? ORDER BY created_at ASC;',
      [dateStr]
    );
  },

  deleteMeal: async (id: string): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM daily_meals WHERE id = ?;', [id]);
  },
};

// ----------------------------------------------------
// CRUD Operations: Sleep Logs
// ----------------------------------------------------

export const sleepDb = {
  addSleepLog: async (
    log: Omit<SleepLog, 'id' | 'created_at'>
  ): Promise<SleepLog> => {
    const db = await getDatabase();
    const now = Date.now();
    const id = `sleep_${now}_${Math.random().toString(36).substr(2, 5)}`;
    const record: SleepLog = {
      id,
      date: log.date,
      bedtime: log.bedtime,
      waketime: log.waketime,
      duration_hours: log.duration_hours,
      quality_rating: log.quality_rating,
      notes: log.notes || undefined,
      created_at: now,
    };

    await db.runAsync(
      `INSERT INTO sleep_logs (id, date, bedtime, waketime, duration_hours, quality_rating, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        record.id,
        record.date,
        record.bedtime,
        record.waketime,
        record.duration_hours,
        record.quality_rating,
        record.notes || null,
        record.created_at,
      ]
    );

    return record;
  },

  getByDate: async (dateStr: string): Promise<SleepLog | null> => {
    const db = await getDatabase();
    return await db.getFirstAsync<SleepLog>(
      'SELECT * FROM sleep_logs WHERE date = ? ORDER BY created_at DESC;',
      [dateStr]
    );
  },

  getRecentLogs: async (limit: number = 7): Promise<SleepLog[]> => {
    const db = await getDatabase();
    return await db.getAllAsync<SleepLog>(
      'SELECT * FROM sleep_logs ORDER BY date DESC LIMIT ?;',
      [limit]
    );
  },
};



