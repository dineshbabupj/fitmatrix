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
