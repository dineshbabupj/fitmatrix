import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const NOTIFICATION_KEYS = {
  workoutReminder: 'fitmetrics_workout_reminder_id',
  waterReminder: 'fitmetrics_water_reminder_id',
  permissionsGranted: 'fitmetrics_notif_permissions',
};

class NotificationService {

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      const granted = finalStatus === 'granted';
      await AsyncStorage.setItem(NOTIFICATION_KEYS.permissionsGranted, granted.toString());
      return granted;
    } catch (e) {
      console.warn('[NotificationService] Permission request error:', e);
      return false;
    }
  }

  /**
   * Schedule daily workout reminder at the specified hour
   * Default: 7:00 AM
   */
  async scheduleWorkoutReminder(hour: number = 7, minute: number = 0): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      // Cancel existing workout reminder
      await this.cancelWorkoutReminder();

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🏋️ Time to Workout!',
          body: 'Your body achieves what your mind believes. Start your session now!',
          sound: true,
        },
        trigger: {
          hour,
          minute,
          repeats: true,
        } as any,
      });

      await AsyncStorage.setItem(NOTIFICATION_KEYS.workoutReminder, id);
      console.log('[NotificationService] Workout reminder scheduled:', id);
    } catch (e) {
      console.warn('[NotificationService] Schedule workout reminder error:', e);
    }
  }

  /**
   * Cancel workout reminder
   */
  async cancelWorkoutReminder(): Promise<void> {
    try {
      const existingId = await AsyncStorage.getItem(NOTIFICATION_KEYS.workoutReminder);
      if (existingId) {
        await Notifications.cancelScheduledNotificationAsync(existingId);
        await AsyncStorage.removeItem(NOTIFICATION_KEYS.workoutReminder);
      }
    } catch (e) {
      console.warn('[NotificationService] Cancel workout reminder error:', e);
    }
  }

  /**
   * Schedule water reminder every N hours
   * Default: every 2 hours from 8AM to 8PM
   */
  async scheduleWaterReminder(intervalHours: number = 2): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      // Cancel existing water reminders
      await this.cancelWaterReminder();

      const ids: string[] = [];
      const startHour = 8;
      const endHour = 20;

      for (let hour = startHour; hour <= endHour; hour += intervalHours) {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: '💧 Hydration Check!',
            body: 'Stay hydrated! Drink a glass of water to keep your body performing at its best.',
            sound: true,
          },
          trigger: {
            hour,
            minute: 0,
            repeats: true,
          } as any,
        });
        ids.push(id);
      }

      await AsyncStorage.setItem(NOTIFICATION_KEYS.waterReminder, JSON.stringify(ids));
      console.log('[NotificationService] Water reminders scheduled:', ids.length, 'notifications');
    } catch (e) {
      console.warn('[NotificationService] Schedule water reminder error:', e);
    }
  }

  /**
   * Cancel water reminders
   */
  async cancelWaterReminder(): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem(NOTIFICATION_KEYS.waterReminder);
      if (existing) {
        const ids: string[] = JSON.parse(existing);
        for (const id of ids) {
          await Notifications.cancelScheduledNotificationAsync(id);
        }
        await AsyncStorage.removeItem(NOTIFICATION_KEYS.waterReminder);
      }
    } catch (e) {
      console.warn('[NotificationService] Cancel water reminder error:', e);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAll(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem(NOTIFICATION_KEYS.workoutReminder);
      await AsyncStorage.removeItem(NOTIFICATION_KEYS.waterReminder);
      console.log('[NotificationService] All notifications cancelled.');
    } catch (e) {
      console.warn('[NotificationService] Cancel all error:', e);
    }
  }

  /**
   * Get count of currently scheduled notifications
   */
  async getScheduledCount(): Promise<number> {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      return scheduled.length;
    } catch {
      return 0;
    }
  }

  /**
   * Check if notifications are enabled
   */
  async isEnabled(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }

  /**
   * Set up notification listeners for handling taps
   * Returns subscription cleanup function
   */
  setupListeners(
    onNotificationResponse?: (response: Notifications.NotificationResponse) => void
  ) {
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('[NotificationService] User tapped notification:', response.notification.request.content);
        onNotificationResponse?.(response);
      }
    );

    return () => {
      responseSubscription.remove();
    };
  }
}

export const notificationService = new NotificationService();
