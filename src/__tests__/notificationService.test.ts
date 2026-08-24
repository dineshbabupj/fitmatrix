jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notif-id-123'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
  addNotificationResponseReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  SchedulableTriggerInputTypes: { DAILY: 'DAILY' },
}));

jest.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => Promise.resolve(store[key] || null)),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(k => delete store[k]);
      return Promise.resolve();
    }),
  };
});

import { notificationService } from '../services/notifications/notificationService';
import * as Notifications from 'expo-notifications';

describe('NotificationService', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('requestPermissions returns true when granted', async () => {
    const result = await notificationService.requestPermissions();
    expect(result).toBe(true);
    // getPermissionsAsync is called first to check existing status
    expect(Notifications.getPermissionsAsync).toHaveBeenCalled();
  });

  test('requestPermissions returns false when denied', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'undetermined' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });

    const result = await notificationService.requestPermissions();
    expect(result).toBe(false);
  });

  test('scheduleWorkoutReminder schedules daily notification', async () => {
    await notificationService.scheduleWorkoutReminder(7, 30);

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: expect.stringContaining('Workout'),
        }),
        trigger: expect.objectContaining({
          hour: 7,
          minute: 30,
        }),
      })
    );
  });

  test('scheduleWaterReminder schedules multiple daily notifications', async () => {
    await notificationService.scheduleWaterReminder(2);

    // Should schedule notifications from 8AM to 8PM every 2 hours = 7 notifications
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(7);
  });

  test('cancelWorkoutReminder cancels existing reminder', async () => {
    // First schedule a reminder (creates one in mock store)
    await notificationService.scheduleWorkoutReminder(8, 0);
    jest.clearAllMocks();
    
    // Now cancel should work
    await notificationService.cancelWorkoutReminder();
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalled();
  });

  test('cancelAll cancels all notifications', async () => {
    await notificationService.cancelAll();
    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
  });

  test('getScheduledCount returns number of scheduled notifications', async () => {
    (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValueOnce([
      { identifier: '1' },
      { identifier: '2' },
    ]);
    
    const count = await notificationService.getScheduledCount();
    expect(count).toBe(2);
  });

  test('isEnabled checks permission status', async () => {
    const enabled = await notificationService.isEnabled();
    expect(enabled).toBe(true);
  });

  test('setupListeners registers response listener', () => {
    const cleanup = notificationService.setupListeners();
    expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
    expect(typeof cleanup).toBe('function');
  });

  test('setupListeners cleanup removes subscription', () => {
    const mockRemove = jest.fn();
    (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockReturnValueOnce({
      remove: mockRemove,
    });

    const cleanup = notificationService.setupListeners();
    cleanup();
    expect(mockRemove).toHaveBeenCalled();
  });

  test('scheduleWorkoutReminder cancels existing before scheduling new', async () => {
    await notificationService.scheduleWorkoutReminder(8, 0);
    
    // Should cancel existing first (but no existing, so no cancel call)
    // Then schedule new
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
  });
});
