export interface SleepRecord {
  id: string;
  date: string; // YYYY-MM-DD
  bedtime: string; // HH:MM
  wakeTime: string; // HH:MM
  duration: number; // minutes
  quality: number; // 1-5
  factors: SleepFactors;
  // New fields
  sleepLatency: SleepLatency;
  nightWakings: NightWakings;
  wakeFeeling: WakeFeeling;
  napMinutes: number; // 0 = no nap
  bodyScore: number; // 1-5
  emotionTags: EmotionTag[];
  memo: string;
  createdAt: string;
}

export type SleepLatency = 'under5' | '5to15' | '15to30' | 'over30';
export type NightWakings = '0' | '1' | '2' | '3plus';
export type WakeFeeling = 'refreshed' | 'okay' | 'sluggish' | 'very_sluggish';
export type EmotionTag = 'relaxed' | 'irritated' | 'anxious' | 'energetic' | 'fatigued' | 'happy' | 'depressed';

export const SLEEP_LATENCY_LABELS: Record<SleepLatency, string> = {
  under5: '5分未満',
  '5to15': '5〜15分',
  '15to30': '15〜30分',
  over30: '30分以上',
};

export const NIGHT_WAKINGS_LABELS: Record<NightWakings, string> = {
  '0': '0回',
  '1': '1回',
  '2': '2回',
  '3plus': '3回以上',
};

export const WAKE_FEELING_LABELS: Record<WakeFeeling, string> = {
  refreshed: 'すっきり',
  okay: 'まあまあ',
  sluggish: 'だるい',
  very_sluggish: 'とてもだるい',
};

export const WAKE_FEELING_ICONS: Record<WakeFeeling, string> = {
  refreshed: '\u2600\uFE0F',
  okay: '\u26C5',
  sluggish: '\u2601\uFE0F',
  very_sluggish: '\uD83C\uDF27\uFE0F',
};

export const EMOTION_TAG_LABELS: Record<EmotionTag, string> = {
  relaxed: 'リラックス',
  irritated: 'イライラ',
  anxious: '不安',
  energetic: '元気',
  fatigued: '疲労感',
  happy: '幸福感',
  depressed: '気分低下',
};

export const EMOTION_TAG_ICONS: Record<EmotionTag, string> = {
  relaxed: '\uD83D\uDE0C',
  irritated: '\uD83D\uDE24',
  anxious: '\uD83D\uDE1F',
  energetic: '\uD83D\uDCAA',
  fatigued: '\uD83E\uDEE0',
  happy: '\uD83D\uDE04',
  depressed: '\uD83D\uDE1E',
};

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
  scoreBreakdown: ScoreBreakdown;
}

export interface ScoreBreakdown {
  durationScore: number; // max 30
  qualityScore: number; // max 25
  consistencyScore: number; // max 20
  latencyScore: number; // max 15
  lifestyleScore: number; // max 10
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: string;
  endDate: string;
  completed: boolean;
}

export interface ReminderSettings {
  enabled: boolean;
  time: string; // HH:MM
}

export type TabType = 'record' | 'dashboard' | 'advice' | 'goals' | 'calendar';
