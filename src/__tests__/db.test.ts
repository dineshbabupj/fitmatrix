// db.test.ts - Database Architecture, Migrations & CRUD Interface Tests

const mockDb = {
  execAsync: jest.fn(),
  getAllAsync: jest.fn(),
  getFirstAsync: jest.fn(),
  runAsync: jest.fn(),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() => Promise.resolve(mockDb)),
}));

import { migrations, initDatabase, calculationsDb, userProfileDb, settingsDb } from '../data/db';

describe('Database Architecture & Migrations', () => {
  // ── Migration Engine Tests ─────────────────────────────────────────────
  describe('Migration Engine', () => {
    test('Migrations array has exactly 2 migrations (v1 + v2)', () => {
      expect(migrations.length).toBe(2);
    });

    test('Migration v1 is initial schema', () => {
      const v1 = migrations.find(m => m.version === 1);
      expect(v1).toBeDefined();
      expect(v1?.name).toBe('v1_initial_schema');
    });

    test('Migration v2 is offline sync columns', () => {
      const v2 = migrations.find(m => m.version === 2);
      expect(v2).toBeDefined();
      expect(v2?.name).toBe('v2_offline_sync_columns');
    });

    test('Migrations are in ascending version order', () => {
      const versions = migrations.map(m => m.version);
      const sorted = [...versions].sort((a, b) => a - b);
      expect(versions).toEqual(sorted);
    });

    test('Migration v2 SQL contains sync_status, updated_at, and synced_at', () => {
      const v2 = migrations.find(m => m.version === 2);
      expect(v2?.sql).toContain('sync_status');
      expect(v2?.sql).toContain('updated_at');
      expect(v2?.sql).toContain('synced_at');
    });

    test('Migration v1 SQL creates calculations table', () => {
      const v1 = migrations.find(m => m.version === 1);
      expect(v1?.sql).toContain('CREATE TABLE IF NOT EXISTS calculations');
    });

    test('Migration v1 SQL creates user_profiles table', () => {
      const v1 = migrations.find(m => m.version === 1);
      expect(v1?.sql).toContain('CREATE TABLE IF NOT EXISTS user_profiles');
    });

    test('Migration v1 SQL creates settings table', () => {
      const v1 = migrations.find(m => m.version === 1);
      expect(v1?.sql).toContain('CREATE TABLE IF NOT EXISTS settings');
    });

    test('Migration v1 SQL creates schema_migrations table', () => {
      const v1 = migrations.find(m => m.version === 1);
      expect(v1?.sql).toContain('CREATE TABLE IF NOT EXISTS schema_migrations');
    });
  });

  // ── CRUD Interface Verification ────────────────────────────────────────
  describe('Database Interface: calculationsDb', () => {
    test('Has add() method', () => {
      expect(typeof calculationsDb.add).toBe('function');
    });

    test('Has getAll() method', () => {
      expect(typeof calculationsDb.getAll).toBe('function');
    });

    test('Has getById() method', () => {
      expect(typeof calculationsDb.getById).toBe('function');
    });

    test('Has delete() method', () => {
      expect(typeof calculationsDb.delete).toBe('function');
    });

    test('Has clear() method', () => {
      expect(typeof calculationsDb.clear).toBe('function');
    });

    test('Has getPendingSync() method for offline sync', () => {
      expect(typeof calculationsDb.getPendingSync).toBe('function');
    });

    test('Has updateSyncStatus() method for offline sync', () => {
      expect(typeof calculationsDb.updateSyncStatus).toBe('function');
    });
  });

  describe('Database Interface: userProfileDb', () => {
    test('Has create() method', () => {
      expect(typeof userProfileDb.create).toBe('function');
    });

    test('Has getById() method', () => {
      expect(typeof userProfileDb.getById).toBe('function');
    });

    test('Has getAll() method', () => {
      expect(typeof userProfileDb.getAll).toBe('function');
    });

    test('Has update() method', () => {
      expect(typeof userProfileDb.update).toBe('function');
    });

    test('Has delete() method', () => {
      expect(typeof userProfileDb.delete).toBe('function');
    });
  });

  describe('Database Interface: settingsDb', () => {
    test('Has get() method', () => {
      expect(typeof settingsDb.get).toBe('function');
    });

    test('Has update() method', () => {
      expect(typeof settingsDb.update).toBe('function');
    });
  });

  // ── Schema Validation ────────────────────────────────────────────────────
  describe('Schema Validation', () => {
    test('v1 SQL has CHECK constraint for valid calculation types', () => {
      const v1 = migrations.find(m => m.version === 1);
      expect(v1?.sql).toContain("CHECK(type IN ('BMI', 'BMR', 'Body Fat', 'Ideal Weight', 'MACRO'))");
    });

    test('v1 SQL has index on calculations type & date', () => {
      const v1 = migrations.find(m => m.version === 1);
      expect(v1?.sql).toContain('idx_calculations_type_date');
    });

    test('v2 SQL has index on sync_status', () => {
      const v2 = migrations.find(m => m.version === 2);
      expect(v2?.sql).toContain('idx_calculations_sync_status');
    });

    test('v1 SQL enforces user_profiles age CHECK > 0 and < 150', () => {
      const v1 = migrations.find(m => m.version === 1);
      expect(v1?.sql).toContain('age > 0 AND age < 150');
    });

    test('v2 sync_status CHECK allows synced, pending, failed', () => {
      const v2 = migrations.find(m => m.version === 2);
      expect(v2?.sql).toContain("CHECK(sync_status IN ('synced', 'pending', 'failed'))");
    });
  });

  // ── initDatabase Function ────────────────────────────────────────────────
  describe('initDatabase Function', () => {
    test('initDatabase is a function', () => {
      expect(typeof initDatabase).toBe('function');
    });

    test('initDatabase returns a Promise', () => {
      mockDb.getAllAsync.mockResolvedValueOnce([]);
      const result = initDatabase();
      expect(result).toBeInstanceOf(Promise);
    });
  });

  // ── CRUD Logic Execution ────────────────────────────────────────────
  describe('CRUD Logic Execution', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('userProfileDb', () => {
      it('creates a profile', async () => {
        const profile = { id: 'user1', name: 'Test', age: 25, gender: 'male' as const, height: 180, weight: 75, unit_preference: 'metric' as const };
        const result = await userProfileDb.create(profile);
        expect(mockDb.runAsync).toHaveBeenCalledWith(
          expect.stringContaining('INSERT OR REPLACE INTO user_profiles'),
          expect.any(Array)
        );
        expect(result.id).toBe('user1');
      });

      it('gets a profile by id', async () => {
        mockDb.getFirstAsync.mockResolvedValueOnce({ id: 'user1', name: 'Test' });
        const result = await userProfileDb.getById('user1');
        expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
          expect.stringContaining('SELECT * FROM user_profiles WHERE id = ?;'),
          ['user1']
        );
        expect(result?.name).toBe('Test');
      });

      it('gets all profiles', async () => {
        mockDb.getAllAsync.mockResolvedValueOnce([{ id: 'user1' }]);
        const result = await userProfileDb.getAll();
        expect(mockDb.getAllAsync).toHaveBeenCalledWith(
          expect.stringContaining('SELECT * FROM user_profiles ORDER BY created_at DESC;')
        );
        expect(result.length).toBe(1);
      });

      it('updates a profile', async () => {
        mockDb.getFirstAsync.mockResolvedValueOnce({ id: 'user1', name: 'Old' });
        await userProfileDb.update('user1', { name: 'New' });
        expect(mockDb.runAsync).toHaveBeenCalledWith(
          expect.stringContaining('UPDATE user_profiles SET'),
          expect.any(Array)
        );
      });

      it('deletes a profile', async () => {
        await userProfileDb.delete('user1');
        expect(mockDb.runAsync).toHaveBeenCalledWith(
          expect.stringContaining('DELETE FROM user_profiles WHERE id = ?;'),
          ['user1']
        );
      });
    });

    describe('settingsDb', () => {
      it('gets settings when they exist', async () => {
        mockDb.getFirstAsync.mockResolvedValueOnce({ id: 'default', theme: 'light' });
        const result = await settingsDb.get();
        expect(result.theme).toBe('light');
      });

      it('creates default settings when they do not exist', async () => {
        mockDb.getFirstAsync.mockResolvedValueOnce(null);
        const result = await settingsDb.get();
        expect(mockDb.runAsync).toHaveBeenCalledWith(
          expect.stringContaining('INSERT OR IGNORE INTO settings'),
          expect.any(Array)
        );
        expect(result.theme).toBe('dark');
      });

      it('updates settings', async () => {
        mockDb.getFirstAsync.mockResolvedValueOnce({ id: 'default', theme: 'dark' });
        await settingsDb.update({ theme: 'light' });
        expect(mockDb.runAsync).toHaveBeenCalledWith(
          expect.stringContaining('INSERT OR REPLACE INTO settings'),
          expect.any(Array)
        );
      });
    });

    describe('calculationsDb', () => {
      it('adds a calculation', async () => {
        const calc = { type: 'BMI' as const, inputs_json: '{}', result: '22', date: 123 };
        const result = await calculationsDb.add(calc);
        expect(mockDb.runAsync).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO calculations'),
          expect.any(Array)
        );
        expect(result.type).toBe('BMI');
      });

      it('gets all calculations', async () => {
        mockDb.getAllAsync.mockResolvedValueOnce([]);
        await calculationsDb.getAll();
        expect(mockDb.getAllAsync).toHaveBeenCalledWith(
          expect.stringContaining('SELECT * FROM calculations ORDER BY date DESC;')
        );
      });

      it('gets all calculations by type and user id', async () => {
        mockDb.getAllAsync.mockResolvedValueOnce([]);
        await calculationsDb.getAll('BMI', 'user1');
        expect(mockDb.getAllAsync).toHaveBeenCalledWith(
          expect.stringContaining('SELECT * FROM calculations WHERE type = ? AND user_id = ? ORDER BY date DESC;'),
          ['BMI', 'user1']
        );
      });

      it('gets all calculations by type', async () => {
        mockDb.getAllAsync.mockResolvedValueOnce([]);
        await calculationsDb.getAll('BMI');
        expect(mockDb.getAllAsync).toHaveBeenCalledWith(
          expect.stringContaining('SELECT * FROM calculations WHERE type = ? ORDER BY date DESC;'),
          ['BMI']
        );
      });
      
      it('gets all calculations by user id', async () => {
        mockDb.getAllAsync.mockResolvedValueOnce([]);
        await calculationsDb.getAll(undefined, 'user1');
        expect(mockDb.getAllAsync).toHaveBeenCalledWith(
          expect.stringContaining('SELECT * FROM calculations WHERE user_id = ? ORDER BY date DESC;'),
          ['user1']
        );
      });

      it('gets a calculation by id', async () => {
        mockDb.getFirstAsync.mockResolvedValueOnce({ id: 'calc1' });
        const result = await calculationsDb.getById('calc1');
        expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
          expect.stringContaining('SELECT * FROM calculations WHERE id = ?;'),
          ['calc1']
        );
        expect(result?.id).toBe('calc1');
      });

      it('gets pending sync calculations', async () => {
        mockDb.getAllAsync.mockResolvedValueOnce([]);
        await calculationsDb.getPendingSync();
        expect(mockDb.getAllAsync).toHaveBeenCalledWith(
          expect.stringContaining('SELECT * FROM calculations WHERE sync_status = "pending" OR sync_status = "failed" ORDER BY date ASC;')
        );
      });

      it('updates sync status', async () => {
        await calculationsDb.updateSyncStatus('calc1', 'synced');
        expect(mockDb.runAsync).toHaveBeenCalledWith(
          expect.stringContaining('UPDATE calculations SET sync_status = ?, synced_at = ?, updated_at = ? WHERE id = ?;'),
          expect.any(Array)
        );
      });

      it('deletes a calculation', async () => {
        await calculationsDb.delete('calc1');
        expect(mockDb.runAsync).toHaveBeenCalledWith(
          expect.stringContaining('DELETE FROM calculations WHERE id = ?;'),
          ['calc1']
        );
      });

      it('clears calculations completely', async () => {
        await calculationsDb.clear();
        expect(mockDb.runAsync).toHaveBeenCalledWith(
          expect.stringContaining('DELETE FROM calculations;')
        );
      });

      it('clears calculations by type', async () => {
        await calculationsDb.clear('BMI');
        expect(mockDb.runAsync).toHaveBeenCalledWith(
          expect.stringContaining('DELETE FROM calculations WHERE type = ?;'),
          ['BMI']
        );
      });

      it('clears calculations by user id', async () => {
        await calculationsDb.clear(undefined, 'user1');
        expect(mockDb.runAsync).toHaveBeenCalledWith(
          expect.stringContaining('DELETE FROM calculations WHERE user_id = ?;'),
          ['user1']
        );
      });

      it('clears calculations by type and user id', async () => {
        await calculationsDb.clear('BMI', 'user1');
        expect(mockDb.runAsync).toHaveBeenCalledWith(
          expect.stringContaining('DELETE FROM calculations WHERE type = ? AND user_id = ?;'),
          ['BMI', 'user1']
        );
      });
    });
    
    describe('initDatabase Logic', () => {
      it('initializes schema and runs migrations', async () => {
        mockDb.getAllAsync.mockResolvedValueOnce([{ version: 1 }]);
        await initDatabase();
        expect(mockDb.execAsync).toHaveBeenCalled();
        expect(mockDb.runAsync).toHaveBeenCalled();
      });
    });
  });
});
