// FitMetrics Analytics Service
export const analyticsService = {
  logScreenView: (screenName: string) => {
    console.log(`[Analytics] Screen View: ${screenName}`);
  },

  logCalculationPerformed: (type: 'BMI' | 'BMR' | 'Body Fat' | 'Ideal Weight', unitSystem: string) => {
    console.log(`[Analytics] Event: calculation_performed`, { type, unitSystem });
  },

  logGoalUpdated: (currentWeight: number, targetWeight: number) => {
    console.log(`[Analytics] Event: goal_updated`, { currentWeight, targetWeight });
  },

  logAuthEvent: (method: 'anonymous' | 'google' | 'apple', success: boolean) => {
    console.log(`[Analytics] Event: auth_event`, { method, success });
  },
};
