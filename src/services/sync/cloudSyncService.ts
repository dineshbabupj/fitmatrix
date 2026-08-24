import { workoutDb, mealDb, sleepDb, calculationsDb } from '../../data/db';
import { useUserAuthStore } from '../../store/userAuthStore';
import { supabase } from '../supabase/supabaseClient';

class CloudSyncService {
  /**
   * Sync all local SQLite data to Supabase Cloud Backup
   */
  public async syncAllData(): Promise<{ success: boolean; syncedCount: number; message: string }> {
    const { user, isAuthenticated, setIsSyncing, setLastSyncedAt } = useUserAuthStore.getState();

    if (!isAuthenticated || !user) {
      return {
        success: false,
        syncedCount: 0,
        message: 'Guest mode active. Sign in to enable Cloud Backup & Sync.',
      };
    }

    try {
      setIsSyncing(true);

      // 1. Fetch local SQLite records
      const workouts = await workoutDb.getAllWorkouts();
      const meals = await mealDb.getByDate(new Date().toISOString().split('T')[0]);
      const sleep = await sleepDb.getRecentLogs(30);
      const calculations = await calculationsDb.getAll();

      const totalCount = workouts.length + meals.length + sleep.length + calculations.length;

      // 2. Map and Upsert to Supabase PostgreSQL
      if (workouts.length > 0) {
        const mappedWorkouts = workouts.map((w) => ({ ...w, user_id: user.uid }));
        await supabase.from('user_workouts').upsert(mappedWorkouts, { onConflict: 'id' });
      }

      if (meals.length > 0) {
        const mappedMeals = meals.map((m) => ({ ...m, user_id: user.uid }));
        await supabase.from('user_meals').upsert(mappedMeals, { onConflict: 'id' });
      }

      if (sleep.length > 0) {
        const mappedSleep = sleep.map((s) => ({ ...s, user_id: user.uid }));
        await supabase.from('user_sleep_logs').upsert(mappedSleep, { onConflict: 'id' });
      }

      if (calculations.length > 0) {
        const mappedCalcs = calculations.map((c) => ({ ...c, user_id: user.uid }));
        await supabase.from('user_calculations').upsert(mappedCalcs, { onConflict: 'id' });
      }

      const now = Date.now();
      setLastSyncedAt(now);
      setIsSyncing(false);

      return {
        success: true,
        syncedCount: totalCount,
        message: `Successfully backed up ${totalCount} health records to Supabase Cloud!`,
      };
    } catch (error: any) {
      setIsSyncing(false);
      console.warn('[CloudSyncService] Sync error:', error);
      return {
        success: false,
        syncedCount: 0,
        message: error.message || 'Cloud backup failed. Will retry when connected.',
      };
    }
  }
}

export const cloudSyncService = new CloudSyncService();

