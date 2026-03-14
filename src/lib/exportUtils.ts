import { SleepRecord, SLEEP_LATENCY_LABELS, NIGHT_WAKINGS_LABELS, WAKE_FEELING_LABELS, EMOTION_TAG_LABELS } from '@/types/sleep';
import { formatDuration, getQualityLabel } from './sleepUtils';

export function exportToCSV(records: SleepRecord[]): string {
  const headers = [
    '日付', '就寝時間', '起床時間', '睡眠時間', '睡眠品質', '品質ラベル',
    '入眠潜時', '中途覚醒', '起床時の気分', '昼寝（分）', '体調スコア',
    '感情タグ', 'カフェイン', '運動', 'ストレス', 'スクリーン', '飲酒', '昼寝有無', 'メモ',
  ];

  const rows = records
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(r => [
      r.date,
      r.bedtime,
      r.wakeTime,
      formatDuration(r.duration),
      r.quality,
      getQualityLabel(r.quality),
      SLEEP_LATENCY_LABELS[r.sleepLatency],
      NIGHT_WAKINGS_LABELS[r.nightWakings],
      WAKE_FEELING_LABELS[r.wakeFeeling],
      r.napMinutes,
      r.bodyScore,
      r.emotionTags.map(t => EMOTION_TAG_LABELS[t]).join('/'),
      r.factors.caffeine ? 'あり' : '',
      r.factors.exercise ? 'あり' : '',
      r.factors.stress ? 'あり' : '',
      r.factors.screenTime ? 'あり' : '',
      r.factors.alcohol ? 'あり' : '',
      r.factors.nap ? 'あり' : '',
      `"${(r.memo || '').replace(/"/g, '""')}"`,
    ]);

  const bom = '\uFEFF';
  return bom + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function downloadCSV(records: SleepRecord[]): void {
  const csv = exportToCSV(records);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const today = new Date().toISOString().split('T')[0];
  link.download = `sleep-data-${today}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
