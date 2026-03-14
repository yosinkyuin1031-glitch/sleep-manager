import { SleepRecord, SleepGoal } from '@/types/sleep';

const RECORDS_KEY = 'sleep-app-records';
const GOALS_KEY = 'sleep-app-goals';

export function getRecords(): SleepRecord[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(RECORDS_KEY);
  return data ? JSON.parse(data) : [];
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
