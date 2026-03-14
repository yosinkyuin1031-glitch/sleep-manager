export interface SleepRecord {
  id: string;
  date: string; // YYYY-MM-DD
  bedtime: string; // HH:MM
  wakeTime: string; // HH:MM
  duration: number; // minutes
  quality: number; // 1-5
  factors: SleepFactors;
  memo: string;
  createdAt: string;
}

export interface SleepFactors {
  caffeine: boolean;
  exercise: boolean;
  stress: boolean;
  screenTime: boolean;
  alcohol: boolean;
  nap: boolean;
}

export interface SleepGoal {
  targetBedtime: string; // HH:MM
  targetWakeTime: string; // HH:MM
  targetDuration: number; // hours
  idealDuration: number; // hours (for sleep debt calculation)
}

export interface SleepStats {
  avgDuration: number;
  avgQuality: number;
  avgBedtime: string;
  avgWakeTime: string;
  sleepDebt: number;
  consistency: number;
  sleepScore: number;
}

export type TabType = 'record' | 'dashboard' | 'advice' | 'goals';
