import { SleepRecord, SleepGoal, SleepStats } from '@/types/sleep';

export function calculateDuration(bedtime: string, wakeTime: string): number {
  const [bh, bm] = bedtime.split(':').map(Number);
  const [wh, wm] = wakeTime.split(':').map(Number);
  let bedMinutes = bh * 60 + bm;
  let wakeMinutes = wh * 60 + wm;
  if (wakeMinutes <= bedMinutes) {
    wakeMinutes += 24 * 60;
  }
  return wakeMinutes - bedMinutes;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}時間${m > 0 ? `${m}分` : ''}`;
}

export function formatDurationShort(minutes: number): string {
  const h = (minutes / 60).toFixed(1);
  return `${h}h`;
}

export function calculateSleepScore(
  records: SleepRecord[],
  goals: SleepGoal
): number {
  if (records.length === 0) return 0;

  const recent = records.slice(-7);

  // Duration score (0-35): How close to ideal duration
  const avgDuration = recent.reduce((sum, r) => sum + r.duration, 0) / recent.length;
  const idealMinutes = goals.idealDuration * 60;
  const durationDiff = Math.abs(avgDuration - idealMinutes);
  const durationScore = Math.max(0, 35 - (durationDiff / idealMinutes) * 35);

  // Quality score (0-30): Average quality rating
  const avgQuality = recent.reduce((sum, r) => sum + r.quality, 0) / recent.length;
  const qualityScore = (avgQuality / 5) * 30;

  // Consistency score (0-20): Bedtime consistency (lower stddev = better)
  const bedtimeMinutes = recent.map(r => {
    const [h, m] = r.bedtime.split(':').map(Number);
    return h < 12 ? h * 60 + m + 24 * 60 : h * 60 + m;
  });
  const avgBedtime = bedtimeMinutes.reduce((a, b) => a + b, 0) / bedtimeMinutes.length;
  const variance = bedtimeMinutes.reduce((sum, t) => sum + Math.pow(t - avgBedtime, 2), 0) / bedtimeMinutes.length;
  const stddev = Math.sqrt(variance);
  const consistencyScore = Math.max(0, 20 - (stddev / 30) * 20);

  // Factors score (0-15): Fewer negative factors = better
  const factorCount = recent.reduce((sum, r) => {
    let count = 0;
    if (r.factors.caffeine) count++;
    if (r.factors.alcohol) count++;
    if (r.factors.stress) count++;
    if (r.factors.screenTime) count++;
    return sum + count;
  }, 0);
  const avgFactors = factorCount / recent.length;
  const factorsScore = Math.max(0, 15 - avgFactors * 3.75);

  return Math.round(durationScore + qualityScore + consistencyScore + factorsScore);
}

export function calculateSleepDebt(
  records: SleepRecord[],
  idealHours: number
): number {
  const last7 = records.slice(-7);
  if (last7.length === 0) return 0;
  const idealMinutes = idealHours * 60;
  const totalDebt = last7.reduce((debt, r) => {
    const diff = idealMinutes - r.duration;
    return debt + (diff > 0 ? diff : 0);
  }, 0);
  return totalDebt;
}

export function calculateStats(
  records: SleepRecord[],
  goals: SleepGoal
): SleepStats {
  if (records.length === 0) {
    return {
      avgDuration: 0,
      avgQuality: 0,
      avgBedtime: '--:--',
      avgWakeTime: '--:--',
      sleepDebt: 0,
      consistency: 0,
      sleepScore: 0,
    };
  }

  const recent = records.slice(-7);
  const avgDuration = recent.reduce((sum, r) => sum + r.duration, 0) / recent.length;
  const avgQuality = recent.reduce((sum, r) => sum + r.quality, 0) / recent.length;

  const bedtimeMinutes = recent.map(r => {
    const [h, m] = r.bedtime.split(':').map(Number);
    return h < 12 ? h * 60 + m + 24 * 60 : h * 60 + m;
  });
  const avgBedMin = bedtimeMinutes.reduce((a, b) => a + b, 0) / bedtimeMinutes.length;
  const normalizedBed = avgBedMin >= 24 * 60 ? avgBedMin - 24 * 60 : avgBedMin;
  const avgBedH = Math.floor(normalizedBed / 60);
  const avgBedM = Math.round(normalizedBed % 60);

  const wakeMinutes = recent.map(r => {
    const [h, m] = r.wakeTime.split(':').map(Number);
    return h * 60 + m;
  });
  const avgWakeMin = wakeMinutes.reduce((a, b) => a + b, 0) / wakeMinutes.length;
  const avgWakeH = Math.floor(avgWakeMin / 60);
  const avgWakeM = Math.round(avgWakeMin % 60);

  const variance = bedtimeMinutes.reduce((sum, t) => sum + Math.pow(t - avgBedMin, 2), 0) / bedtimeMinutes.length;
  const stddev = Math.sqrt(variance);
  const consistency = Math.max(0, Math.min(100, 100 - stddev));

  return {
    avgDuration,
    avgQuality: Math.round(avgQuality * 10) / 10,
    avgBedtime: `${String(avgBedH).padStart(2, '0')}:${String(avgBedM).padStart(2, '0')}`,
    avgWakeTime: `${String(avgWakeH).padStart(2, '0')}:${String(avgWakeM).padStart(2, '0')}`,
    sleepDebt: calculateSleepDebt(records, goals.idealDuration),
    consistency: Math.round(consistency),
    sleepScore: calculateSleepScore(records, goals),
  };
}

export function generateAdvice(records: SleepRecord[], goals: SleepGoal): string[] {
  if (records.length === 0) {
    return ['睡眠記録をつけ始めましょう！データが集まるとパーソナライズされたアドバイスが表示されます。'];
  }

  const advice: string[] = [];
  const recent = records.slice(-7);
  const stats = calculateStats(records, goals);

  // Duration advice
  const avgHours = stats.avgDuration / 60;
  if (avgHours < 6) {
    advice.push('睡眠時間が6時間未満です。慢性的な睡眠不足は免疫力低下や集中力の低下を引き起こします。少しずつ就寝時間を早めてみましょう。');
  } else if (avgHours < 7) {
    advice.push('睡眠時間がやや不足しています。理想的には7〜8時間の睡眠を目指しましょう。就寝時間を30分早めることから始めてみてください。');
  } else if (avgHours > 9) {
    advice.push('睡眠時間が長すぎる可能性があります。過度な睡眠は倦怠感の原因になることがあります。起床時間を一定にしてみましょう。');
  }

  // Quality advice
  if (stats.avgQuality < 3) {
    advice.push('睡眠の質が低めです。寝室の環境（温度18-22℃、暗さ、静かさ）を見直してみましょう。');
  }

  // Consistency advice
  if (stats.consistency < 70) {
    advice.push('就寝時間のバラつきが大きいです。体内時計を整えるために、平日も休日も同じ時間に寝起きすることを心がけましょう。');
  }

  // Factor-based advice
  const caffeineCount = recent.filter(r => r.factors.caffeine).length;
  if (caffeineCount >= 3) {
    advice.push('カフェインの摂取頻度が高いです。午後2時以降のカフェインは睡眠に影響します。午後はカフェインレスに切り替えてみましょう。');
  }

  const screenCount = recent.filter(r => r.factors.screenTime).length;
  if (screenCount >= 4) {
    advice.push('就寝前のスクリーン使用が多いです。ブルーライトは睡眠ホルモン（メラトニン）の分泌を抑制します。就寝30分前にはデバイスを手放しましょう。');
  }

  const stressCount = recent.filter(r => r.factors.stress).length;
  if (stressCount >= 3) {
    advice.push('ストレスを感じている日が多いようです。就寝前に5分間の深呼吸や瞑想を取り入れると、リラックスして入眠しやすくなります。');
  }

  const alcoholCount = recent.filter(r => r.factors.alcohol).length;
  if (alcoholCount >= 2) {
    advice.push('飲酒の頻度が高めです。アルコールは入眠を早めますが、睡眠の後半で覚醒を増やし、全体的な睡眠の質を下げます。');
  }

  const exerciseCount = recent.filter(r => r.factors.exercise).length;
  if (exerciseCount < 2 && recent.length >= 5) {
    advice.push('運動の頻度が低いようです。週に3回以上の適度な運動は睡眠の質を向上させます。日中に30分のウォーキングから始めてみましょう。');
  }

  // Sleep debt advice
  if (stats.sleepDebt > 300) {
    advice.push(`睡眠負債が${formatDuration(stats.sleepDebt)}あります。週末に少し長く寝ることで徐々に返済できますが、一度に取り戻そうとせず、毎日15-30分ずつ増やしましょう。`);
  }

  // Bedtime advice
  const bedtimeMinutes = recent.map(r => {
    const [h, m] = r.bedtime.split(':').map(Number);
    return h < 12 ? h * 60 + m + 24 * 60 : h * 60 + m;
  });
  const avgBedtime = bedtimeMinutes.reduce((a, b) => a + b, 0) / bedtimeMinutes.length;
  if (avgBedtime > 24 * 60 + 60) { // After 1 AM
    advice.push('平均就寝時間が深夜1時を過ぎています。成長ホルモンは22時〜2時に多く分泌されるため、できれば23時までに就寝することをおすすめします。');
  }

  if (advice.length === 0) {
    advice.push('素晴らしい睡眠習慣を維持しています！この調子で続けましょう。規則正しい生活リズムが健康の基本です。');
  }

  return advice;
}

export function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 85) return { label: '優秀', color: '#22c55e' };
  if (score >= 70) return { label: '良好', color: '#3b82f6' };
  if (score >= 55) return { label: '普通', color: '#f59e0b' };
  if (score >= 40) return { label: '注意', color: '#f97316' };
  return { label: '要改善', color: '#ef4444' };
}

export function getQualityLabel(quality: number): string {
  const labels = ['', 'とても悪い', '悪い', '普通', '良い', 'とても良い'];
  return labels[quality] || '';
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
