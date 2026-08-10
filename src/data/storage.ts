export interface HistoryRecord {
  id: string;
  type: 'BMI' | 'BMR' | 'Body Fat' | 'Ideal Weight' | 'MACRO';
  result: string;
  date: number;
}

export interface WeightGoal {
  currentWeight: number;
  targetWeight: number;
  dailyDeficit: number;
}

// In-memory mock storage (can be expanded to AsyncStorage or SQLite)
let historyRecords: HistoryRecord[] = [];
let userGoal: WeightGoal = { currentWeight: 70, targetWeight: 65, dailyDeficit: 500 };

export const storage = {
  getHistory: (type?: string): HistoryRecord[] => {
    if (type) {
      return historyRecords.filter((r) => r.type === type);
    }
    return historyRecords;
  },

  addHistory: (type: 'BMI' | 'BMR' | 'Body Fat' | 'Ideal Weight' | 'MACRO', result: string): HistoryRecord => {
    const record: HistoryRecord = {
      id: Date.now().toString(),
      type,
      result,
      date: Date.now(),
    };
    historyRecords.unshift(record);
    return record;
  },

  deleteHistory: (id: string) => {
    historyRecords = historyRecords.filter((r) => r.id !== id);
  },

  clearHistory: (type?: string) => {
    if (type) {
      historyRecords = historyRecords.filter((r) => r.type !== type);
    } else {
      historyRecords = [];
    }
  },

  getGoal: (): WeightGoal => userGoal,

  setGoal: (goal: Partial<WeightGoal>) => {
    userGoal = { ...userGoal, ...goal };
  },
};
