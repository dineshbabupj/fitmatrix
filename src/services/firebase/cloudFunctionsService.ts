export interface HealthTipNotification {
  id: string;
  title: string;
  body: string;
  category: 'nutrition' | 'fitness' | 'recovery' | 'hydration';
  timestamp: number;
}

export const cloudFunctionsService = {
  /**
   * Fetch daily health tip push notification payload
   */
  fetchDailyHealthTip: async (): Promise<HealthTipNotification> => {
    const tips: HealthTipNotification[] = [
      {
        id: 'tip_1',
        title: 'Hydration Tip 💧',
        body: 'Drinking 500ml of water right after waking up boosts your metabolism by up to 30%!',
        category: 'hydration',
        timestamp: Date.now(),
      },
      {
        id: 'tip_2',
        title: 'Fitness Insight 🏃‍♂️',
        body: 'A 15-minute brisk walk after meals helps regulate blood glucose levels.',
        category: 'fitness',
        timestamp: Date.now(),
      },
      {
        id: 'tip_3',
        title: 'Nutrition Goal 🥗',
        body: 'Aim for at least 1.6g of protein per kg of body weight for optimal lean muscle maintenance.',
        category: 'nutrition',
        timestamp: Date.now(),
      },
    ];

    const randomIndex = Math.floor(Math.random() * tips.length);
    return tips[randomIndex];
  },

  /**
   * Register push notification token for daily tips
   */
  registerPushNotificationToken: async (token: string, userId: string): Promise<boolean> => {
    console.log(`[Cloud Functions] Registered push token ${token} for user ${userId}`);
    return true;
  },
};
