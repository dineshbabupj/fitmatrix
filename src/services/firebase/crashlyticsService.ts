// FitMetrics Crashlytics & Error Reporting Service
export const crashlyticsService = {
  log: (message: string) => {
    console.log(`[Crashlytics Log] ${message}`);
  },

  recordError: (error: Error, reason?: string) => {
    console.error(`[Crashlytics Error] Reason: ${reason || 'Unhandled Exception'}`, error);
  },

  setUserContext: (userId: string, isAnonymous: boolean) => {
    console.log(`[Crashlytics User Context] User ID: ${userId}, Anonymous: ${isAnonymous}`);
  },
};
