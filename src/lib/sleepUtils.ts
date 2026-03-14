import { SleepRecord, SleepGoal, SleepStats, ScoreBreakdown } from '@/types/sleep';

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

// Improved sleep score based on sleep science
export function calculateSleepScore(
  records: SleepRecord[],
  goals: SleepGoal
): { score: number; breakdown: ScoreBreakdown } {
  if (records.length === 0) {
    return {
      score: 0,
      breakdown: { durationScore: 0, qualityScore: 0, consistencyScore: 0, latencyScore: 0, lifestyleScore: 0 },
    };
  }

  const recent = records.slice(-7);

  // 1. Duration adequacy (30%): difference from target
  const avgDuration = recent.reduce((sum, r) => sum + r.duration, 0) / recent.length;
  const idealMinutes = goals.idealDuration * 60;
  const durationDiff = Math.abs(avgDuration - idealMinutes);
  const durationScore = Math.max(0, 30 - (durationDiff / idealMinutes) * 30);

  // 2. Sleep quality (25%): subjective rating
  const avgQuality = recent.reduce((sum, r) => sum + r.quality, 0) / recent.length;
  const qualityScore = (avgQuality / 5) * 25;

  // 3. Consistency (20%): stddev of bedtime and wake time
  const bedtimeMinutes = recent.map(r => {
    const [h, m] = r.bedtime.split(':').map(Number);
    return h < 12 ? h * 60 + m + 24 * 60 : h * 60 + m;
  });
  const avgBed = bedtimeMinutes.reduce((a, b) => a + b, 0) / bedtimeMinutes.length;
  const bedVariance = bedtimeMinutes.reduce((sum, t) => sum + Math.pow(t - avgBed, 2), 0) / bedtimeMinutes.length;
  const bedStddev = Math.sqrt(bedVariance);

  const wakeMinutesArr = recent.map(r => {
    const [h, m] = r.wakeTime.split(':').map(Number);
    return h * 60 + m;
  });
  const avgWake = wakeMinutesArr.reduce((a, b) => a + b, 0) / wakeMinutesArr.length;
  const wakeVariance = wakeMinutesArr.reduce((sum, t) => sum + Math.pow(t - avgWake, 2), 0) / wakeMinutesArr.length;
  const wakeStddev = Math.sqrt(wakeVariance);

  const avgStddev = (bedStddev + wakeStddev) / 2;
  const consistencyScore = Math.max(0, 20 - (avgStddev / 60) * 20);

  // 4. Sleep latency efficiency (15%)
  const latencyScores: Record<string, number> = { under5: 15, '5to15': 12, '15to30': 7, over30: 2 };
  const avgLatency = recent.reduce((sum, r) => sum + (latencyScores[r.sleepLatency] || 12), 0) / recent.length;
  const latencyScore = avgLatency;

  // 5. Lifestyle factors (10%): caffeine, alcohol, screen, stress subtract; exercise adds
  const lifestylePoints = recent.reduce((sum, r) => {
    let points = 10;
    if (r.factors.caffeine) points -= 2;
    if (r.factors.alcohol) points -= 2.5;
    if (r.factors.screenTime) points -= 1.5;
    if (r.factors.stress) points -= 2;
    if (r.factors.exercise) points += 1.5;
    return sum + Math.max(0, Math.min(10, points));
  }, 0);
  const lifestyleScore = lifestylePoints / recent.length;

  const total = Math.round(durationScore + qualityScore + consistencyScore + latencyScore + lifestyleScore);
  return {
    score: Math.min(100, Math.max(0, total)),
    breakdown: {
      durationScore: Math.round(durationScore * 10) / 10,
      qualityScore: Math.round(qualityScore * 10) / 10,
      consistencyScore: Math.round(consistencyScore * 10) / 10,
      latencyScore: Math.round(latencyScore * 10) / 10,
      lifestyleScore: Math.round(lifestyleScore * 10) / 10,
    },
  };
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
  const emptyBreakdown: ScoreBreakdown = {
    durationScore: 0, qualityScore: 0, consistencyScore: 0, latencyScore: 0, lifestyleScore: 0,
  };
  if (records.length === 0) {
    return {
      avgDuration: 0,
      avgQuality: 0,
      avgBedtime: '--:--',
      avgWakeTime: '--:--',
      sleepDebt: 0,
      consistency: 0,
      sleepScore: 0,
      scoreBreakdown: emptyBreakdown,
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

  const { score, breakdown } = calculateSleepScore(records, goals);

  return {
    avgDuration,
    avgQuality: Math.round(avgQuality * 10) / 10,
    avgBedtime: `${String(avgBedH).padStart(2, '0')}:${String(avgBedM).padStart(2, '0')}`,
    avgWakeTime: `${String(avgWakeH).padStart(2, '0')}:${String(avgWakeM).padStart(2, '0')}`,
    sleepDebt: calculateSleepDebt(records, goals.idealDuration),
    consistency: Math.round(consistency),
    sleepScore: score,
    scoreBreakdown: breakdown,
  };
}

// Social jet lag: difference between weekday and weekend sleep midpoints
export function calculateSocialJetLag(records: SleepRecord[]): { weekdayMid: number; weekendMid: number; diff: number } | null {
  if (records.length < 5) return null;
  const recent = records.slice(-30);

  const weekday: number[] = [];
  const weekend: number[] = [];

  recent.forEach(r => {
    const d = new Date(r.date);
    const day = d.getDay();
    const [bh, bm] = r.bedtime.split(':').map(Number);
    let bedMin = bh * 60 + bm;
    if (bh < 12) bedMin += 24 * 60;
    const midpoint = bedMin + r.duration / 2;

    if (day === 0 || day === 6) {
      weekend.push(midpoint);
    } else {
      weekday.push(midpoint);
    }
  });

  if (weekday.length === 0 || weekend.length === 0) return null;

  const weekdayMid = weekday.reduce((a, b) => a + b, 0) / weekday.length;
  const weekendMid = weekend.reduce((a, b) => a + b, 0) / weekend.length;
  const diff = Math.abs(weekendMid - weekdayMid);

  return { weekdayMid, weekendMid, diff };
}

// Factor analysis: average quality with and without a factor
export function analyzeFactorImpact(records: SleepRecord[]): { factor: string; withAvg: number; withoutAvg: number; impact: number }[] {
  const factors: (keyof SleepRecord['factors'])[] = ['caffeine', 'exercise', 'stress', 'screenTime', 'alcohol', 'nap'];
  const labels: Record<string, string> = {
    caffeine: 'カフェイン',
    exercise: '運動',
    stress: 'ストレス',
    screenTime: 'スクリーン',
    alcohol: '飲酒',
    nap: '昼寝',
  };

  if (records.length < 3) return [];

  return factors.map(f => {
    const withFactor = records.filter(r => r.factors[f]);
    const withoutFactor = records.filter(r => !r.factors[f]);
    const withAvg = withFactor.length > 0
      ? withFactor.reduce((s, r) => s + r.quality, 0) / withFactor.length
      : 0;
    const withoutAvg = withoutFactor.length > 0
      ? withoutFactor.reduce((s, r) => s + r.quality, 0) / withoutFactor.length
      : 0;
    return {
      factor: labels[f],
      withAvg: Math.round(withAvg * 10) / 10,
      withoutAvg: Math.round(withoutAvg * 10) / 10,
      impact: Math.round((withAvg - withoutAvg) * 10) / 10,
    };
  }).filter(f => f.withAvg > 0 && f.withoutAvg > 0);
}

// Weekly / monthly report data
export function getWeeklyReport(records: SleepRecord[], goals: SleepGoal): {
  thisWeek: SleepRecord[];
  lastWeek: SleepRecord[];
  avgDurationChange: number;
  avgQualityChange: number;
  scoreChange: number;
} {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfLastWeek = new Date(startOfWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

  const thisWeek = records.filter(r => {
    const d = new Date(r.date);
    return d >= startOfWeek;
  });
  const lastWeek = records.filter(r => {
    const d = new Date(r.date);
    return d >= startOfLastWeek && d < startOfWeek;
  });

  const avgThis = thisWeek.length > 0 ? thisWeek.reduce((s, r) => s + r.duration, 0) / thisWeek.length : 0;
  const avgLast = lastWeek.length > 0 ? lastWeek.reduce((s, r) => s + r.duration, 0) / lastWeek.length : 0;
  const qualThis = thisWeek.length > 0 ? thisWeek.reduce((s, r) => s + r.quality, 0) / thisWeek.length : 0;
  const qualLast = lastWeek.length > 0 ? lastWeek.reduce((s, r) => s + r.quality, 0) / lastWeek.length : 0;

  const scoreThis = thisWeek.length > 0 ? calculateSleepScore(thisWeek, goals).score : 0;
  const scoreLast = lastWeek.length > 0 ? calculateSleepScore(lastWeek, goals).score : 0;

  return {
    thisWeek,
    lastWeek,
    avgDurationChange: Math.round(avgThis - avgLast),
    avgQualityChange: Math.round((qualThis - qualLast) * 10) / 10,
    scoreChange: scoreThis - scoreLast,
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

  // Sleep latency advice
  const latencyOver30 = recent.filter(r => r.sleepLatency === 'over30').length;
  if (latencyOver30 >= 3) {
    advice.push('寝つきが悪い日が多いようです。就寝前のリラクゼーション（深呼吸、ツボ押し）を試してみましょう。「百会（ひゃくえ）」のツボを優しく押すと入眠が促進されます。');
  }

  // Night wakings advice
  const wakings3plus = recent.filter(r => r.nightWakings === '3plus').length;
  if (wakings3plus >= 2) {
    advice.push('中途覚醒が多い日が続いています。就寝前の水分摂取を控え、寝室の温度を18〜20℃に保ちましょう。「神門（しんもん）」のツボ（手首の内側）を押すと自律神経が整います。');
  }

  // Wake feeling advice
  const sluggishDays = recent.filter(r => r.wakeFeeling === 'sluggish' || r.wakeFeeling === 'very_sluggish').length;
  if (sluggishDays >= 4) {
    advice.push('起床時にだるさを感じる日が多いです。起きたらすぐに日光を浴び、軽いストレッチをしましょう。背中の「膏肓（こうこう）」のツボを伸ばすと全身の血行が改善します。');
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
    advice.push('ストレスを感じている日が多いようです。就寝前に5分間の深呼吸や瞑想を取り入れると、リラックスして入眠しやすくなります。「合谷（ごうこく）」のツボ（親指と人差し指の間）を押すとストレス軽減に効果的です。');
  }

  const alcoholCount = recent.filter(r => r.factors.alcohol).length;
  if (alcoholCount >= 2) {
    advice.push('飲酒の頻度が高めです。アルコールは入眠を早めますが、睡眠の後半で覚醒を増やし、全体的な睡眠の質を下げます。');
  }

  const exerciseCount = recent.filter(r => r.factors.exercise).length;
  if (exerciseCount < 2 && recent.length >= 5) {
    advice.push('運動の頻度が低いようです。週に3回以上の適度な運動は睡眠の質を向上させます。日中に30分のウォーキングから始めてみましょう。');
  }

  // Body score advice
  const avgBodyScore = recent.reduce((s, r) => s + r.bodyScore, 0) / recent.length;
  if (avgBodyScore < 2.5) {
    advice.push('体調スコアが低めです。睡眠不足が体調に影響している可能性があります。整体で首・肩・腰の調整を受けると、身体の緊張がほぐれて睡眠の質が向上します。');
  }

  // Emotion-based advice
  const anxiousCount = recent.filter(r => r.emotionTags.includes('anxious')).length;
  if (anxiousCount >= 3) {
    advice.push('不安を感じている日が多いです。就寝前に「4-7-8呼吸法」（4秒吸って7秒止めて8秒吐く）を試してみてください。鍼灸の「内関（ないかん）」のツボは不安軽減に効果があります。');
  }

  // Sleep debt advice
  if (stats.sleepDebt > 300) {
    advice.push(`睡眠負債が${formatDuration(stats.sleepDebt)}あります。週末に少し長く寝ることで徐々に返済できますが、一度に取り戻そうとせず、毎日15-30分ずつ増やしましょう。`);
  }

  // Social jet lag
  const jetLag = calculateSocialJetLag(records);
  if (jetLag && jetLag.diff > 90) {
    advice.push(`平日と休日の睡眠中間点に${Math.round(jetLag.diff)}分の差があります（社会的時差ぼけ）。これは体内時計の乱れを引き起こします。休日も平日と同じ時間に起きることを心がけましょう。`);
  }

  // Bedtime advice
  const bedtimeMinutes = recent.map(r => {
    const [h, m] = r.bedtime.split(':').map(Number);
    return h < 12 ? h * 60 + m + 24 * 60 : h * 60 + m;
  });
  const avgBedtime = bedtimeMinutes.reduce((a, b) => a + b, 0) / bedtimeMinutes.length;
  if (avgBedtime > 24 * 60 + 60) {
    advice.push('平均就寝時間が深夜1時を過ぎています。成長ホルモンは22時〜2時に多く分泌されるため、できれば23時までに就寝することをおすすめします。');
  }

  if (advice.length === 0) {
    advice.push('素晴らしい睡眠習慣を維持しています！この調子で続けましょう。規則正しい生活リズムが健康の基本です。');
  }

  return advice;
}

// Personalized improvement plan
export function generateWeeklyPlan(records: SleepRecord[], goals: SleepGoal): string[] {
  if (records.length < 3) return [];
  const stats = calculateStats(records, goals);
  const plan: string[] = [];

  const { scoreBreakdown } = stats;

  // Find weakest area
  const areas = [
    { name: 'duration', score: scoreBreakdown.durationScore, max: 30 },
    { name: 'quality', score: scoreBreakdown.qualityScore, max: 25 },
    { name: 'consistency', score: scoreBreakdown.consistencyScore, max: 20 },
    { name: 'latency', score: scoreBreakdown.latencyScore, max: 15 },
    { name: 'lifestyle', score: scoreBreakdown.lifestyleScore, max: 10 },
  ];
  areas.sort((a, b) => (a.score / a.max) - (b.score / b.max));

  const weakest = areas[0];
  switch (weakest.name) {
    case 'duration':
      plan.push('今週の目標：就寝時間を15分早めて睡眠時間を確保しましょう');
      plan.push('毎日の就寝30分前にアラームを設定し、準備を始めましょう');
      break;
    case 'quality':
      plan.push('今週の目標：寝室環境を見直して睡眠の質を上げましょう');
      plan.push('室温を18-22℃に調整し、寝る前にラベンダーの香りを試してみてください');
      break;
    case 'consistency':
      plan.push('今週の目標：就寝・起床時間を毎日揃えましょう');
      plan.push('週末も平日と同じ時間（誤差30分以内）に起きることを意識しましょう');
      break;
    case 'latency':
      plan.push('今週の目標：寝つきを良くするルーティンを作りましょう');
      plan.push('就寝前のストレッチ5分→深呼吸3分の習慣を取り入れてみてください');
      break;
    case 'lifestyle':
      plan.push('今週の目標：睡眠に悪い習慣を1つ減らしましょう');
      plan.push('カフェインかアルコールの量を半分にすることから始めてみてください');
      break;
  }

  plan.push('就寝前に「安眠のツボ」を押す習慣をつけましょう（百会・安眠・神門）');

  return plan;
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

// Sleep debt history for chart
export function getSleepDebtHistory(records: SleepRecord[], idealHours: number): { date: string; debt: number }[] {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const idealMin = idealHours * 60;
  let cumulativeDebt = 0;
  return sorted.map(r => {
    const diff = idealMin - r.duration;
    cumulativeDebt = Math.max(0, cumulativeDebt + diff);
    const d = new Date(r.date);
    return {
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      debt: Math.round(cumulativeDebt / 60 * 10) / 10,
    };
  });
}
