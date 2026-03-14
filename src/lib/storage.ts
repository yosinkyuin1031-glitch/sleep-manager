import { SleepRecord, SleepGoal, WeeklyChallenge, ReminderSettings } from '@/types/sleep';

const RECORDS_KEY = 'sleep-app-records';
const GOALS_KEY = 'sleep-app-goals';
const CHALLENGE_KEY = 'sleep-app-challenge';
const REMINDER_KEY = 'sleep-app-reminder';
const STREAK_KEY = 'sleep-app-streak';

// Migrate old records that lack new fields
function migrateRecord(r: Record<string, unknown>): SleepRecord {
  return {
    id: (r.id as string) || '',
    date: (r.date as string) || '',
    bedtime: (r.bedtime as string) || '23:00',
    wakeTime: (r.wakeTime as string) || '07:00',
    duration: (r.duration as number) || 0,
    quality: (r.quality as number) || 3,
    factors: (r.factors as SleepRecord['factors']) || {
      caffeine: false,
      exercise: false,
      stress: false,
      screenTime: false,
      alcohol: false,
      nap: false,
    },
    sleepLatency: (r.sleepLatency as SleepRecord['sleepLatency']) || '5to15',
    nightWakings: (r.nightWakings as SleepRecord['nightWakings']) || '0',
    wakeFeeling: (r.wakeFeeling as SleepRecord['wakeFeeling']) || 'okay',
    napMinutes: (r.napMinutes as number) || 0,
    bodyScore: (r.bodyScore as number) || 3,
    emotionTags: (r.emotionTags as SleepRecord['emotionTags']) || [],
    memo: (r.memo as string) || '',
    createdAt: (r.createdAt as string) || new Date().toISOString(),
  };
}

export function getRecords(): SleepRecord[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(RECORDS_KEY);
  if (!data) return [];
  try {
    const parsed = JSON.parse(data) as Record<string, unknown>[];
    return parsed.map(migrateRecord);
  } catch {
    return [];
  }
}

export function saveRecord(record: SleepRecord): void {
  const records = getRecords();
  const existingIndex = records.findIndex(r => r.id === record.id);
  if (existingIndex >= 0) {
    records[existingIndex] = record;
  } else {
    records.push(record);
  }
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

export function deleteRecord(id: string): void {
  const records = getRecords().filter(r => r.id !== id);
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

export function getGoals(): SleepGoal {
  if (typeof window === 'undefined') {
    return defaultGoals();
  }
  const data = localStorage.getItem(GOALS_KEY);
  return data ? JSON.parse(data) : defaultGoals();
}

export function saveGoals(goals: SleepGoal): void {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

function defaultGoals(): SleepGoal {
  return {
    targetBedtime: '23:00',
    targetWakeTime: '07:00',
    targetDuration: 8,
    idealDuration: 7.5,
  };
}

// Weekly Challenge
export function getChallenge(): WeeklyChallenge | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(CHALLENGE_KEY);
  return data ? JSON.parse(data) : null;
}

export function saveChallenge(challenge: WeeklyChallenge): void {
  localStorage.setItem(CHALLENGE_KEY, JSON.stringify(challenge));
}

export function clearChallenge(): void {
  localStorage.removeItem(CHALLENGE_KEY);
}

// Reminder
export function getReminder(): ReminderSettings {
  if (typeof window === 'undefined') return { enabled: false, time: '22:30' };
  const data = localStorage.getItem(REMINDER_KEY);
  return data ? JSON.parse(data) : { enabled: false, time: '22:30' };
}

export function saveReminder(reminder: ReminderSettings): void {
  localStorage.setItem(REMINDER_KEY, JSON.stringify(reminder));
}

// Streak calculation
export function calculateStreak(records: SleepRecord[]): number {
  if (records.length === 0) return 0;
  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let checkDate = new Date(today);

  // Allow today or yesterday as the starting point
  const latestDate = new Date(sorted[0].date);
  latestDate.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 1) return 0;
  if (diffDays === 1) {
    checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - 1);
  }

  const dateSet = new Set(sorted.map(r => r.date));

  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (dateSet.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// Cache streak for display
export function getCachedStreak(): number {
  if (typeof window === 'undefined') return 0;
  const data = localStorage.getItem(STREAK_KEY);
  return data ? parseInt(data, 10) : 0;
}

export function cacheStreak(streak: number): void {
  localStorage.setItem(STREAK_KEY, String(streak));
}
