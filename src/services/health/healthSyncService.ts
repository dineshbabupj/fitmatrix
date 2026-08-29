import { Platform } from 'react-native';
import {
  initialize,
  requestPermission,
  readRecords,
  revokeAllPermissions,
} from 'react-native-health-connect';
import { TimeRangeFilter } from 'react-native-health-connect/lib/typescript/types/base.types';

export interface HealthData {
  steps: number;
  sleepHours: number;
  heartRate: number;
  caloriesBurned: number;
}

class HealthSyncService {
  private isInitialized = false;

  async init() {
    if (Platform.OS !== 'android') return false;
    
    try {
      const isInitialized = await initialize();
      this.isInitialized = isInitialized;
      return isInitialized;
    } catch (error) {
      console.error('Failed to initialize Health Connect:', error);
      return false;
    }
  }

  async requestPermissions() {
    if (!this.isInitialized) await this.init();
    if (Platform.OS !== 'android') return false;

    try {
      const permissions = await requestPermission([
        { accessType: 'read', recordType: 'Steps' },
        { accessType: 'read', recordType: 'SleepSession' },
        { accessType: 'read', recordType: 'HeartRate' },
        { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
      ]);
      return permissions.length > 0;
    } catch (error) {
      console.error('Failed to request permissions:', error);
      return false;
    }
  }

  async fetchTodayData(): Promise<HealthData> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.fetchDataForDate(today);
  }

  async fetchPast30Days(): Promise<{ date: string; data: HealthData }[]> {
    const results: { date: string; data: HealthData }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch 30 days (excluding today which is handled by fetchTodayData)
    for (let i = 1; i <= 30; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - i);
      const data = await this.fetchDataForDate(targetDate);
      results.push({ date: targetDate.toISOString().split('T')[0], data });
    }
    return results;
  }

  private async fetchDataForDate(targetDate: Date): Promise<HealthData> {
    if (!this.isInitialized) await this.init();

    
    const tomorrow = new Date(targetDate);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const timeRangeFilter: TimeRangeFilter = {
      operator: 'between',
      startTime: targetDate.toISOString(),
      endTime: tomorrow.toISOString(),
    };

    let steps = 0;
    let sleepHours = 0;
    let heartRate = 0;
    let caloriesBurned = 0;

    if (Platform.OS === 'android') {
      try {
        // Fetch Steps
        const stepsData = await readRecords('Steps', { timeRangeFilter });
        steps = stepsData.records.reduce((acc: number, curr: any) => acc + curr.count, 0);

        // Fetch Sleep
        const sleepData = await readRecords('SleepSession', { timeRangeFilter });
        const sleepMinutes = sleepData.records.reduce((acc: number, curr: any) => {
          const start = new Date(curr.startTime).getTime();
          const end = new Date(curr.endTime).getTime();
          return acc + (end - start) / 1000 / 60;
        }, 0);
        sleepHours = sleepMinutes / 60;

        // Fetch Heart Rate (Average)
        const hrData = await readRecords('HeartRate', { timeRangeFilter });
        let totalHr = 0;
        let hrCount = 0;
        hrData.records.forEach((record: any) => {
          record.samples.forEach((sample: any) => {
            totalHr += sample.beatsPerMinute;
            hrCount++;
          });
        });
        heartRate = hrCount > 0 ? Math.round(totalHr / hrCount) : 0;

        // Fetch Calories
        const caloriesData = await readRecords('ActiveCaloriesBurned', { timeRangeFilter });
        caloriesBurned = caloriesData.records.reduce((acc: number, curr: any) => acc + curr.energy.inKilocalories, 0);

      } catch (error) {
        console.error('Error reading health records:', error);
      }
    }

    return { steps, sleepHours, heartRate, caloriesBurned };
  }

  async disconnect() {
    if (Platform.OS === 'android') {
      try {
        await revokeAllPermissions();
      } catch (error) {
        console.error('Failed to revoke permissions:', error);
      }
    }
  }
}

export const healthSyncService = new HealthSyncService();
