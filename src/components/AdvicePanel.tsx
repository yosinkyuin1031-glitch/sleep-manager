'use client';

import { SleepRecord, SleepGoal } from '@/types/sleep';
import { generateAdvice, calculateStats, getScoreLabel } from '@/lib/sleepUtils';

interface Props {
  records: SleepRecord[];
  goals: SleepGoal;
}

const tipIcons: Record<string, string> = {
  '睡眠時間': '⏰',
  'カフェイン': '☕',
  'スクリーン': '📱',
  'ストレス': '🧘',
  '飲酒': '🍺',
  '運動': '🏃',
  '睡眠負債': '💤',
  '就寝時間': '🌙',
  '一貫性': '📅',
  '品質': '✨',
  '素晴らしい': '🎉',
  '記録': '📝',
};

function getAdviceIcon(text: string): string {
  for (const [keyword, icon] of Object.entries(tipIcons)) {
    if (text.includes(keyword)) return icon;
  }
  return '💡';
}

export default function AdvicePanel({ records, goals }: Props) {
  const advice = generateAdvice(records, goals);
  const stats = calculateStats(records, goals);
  const { label: scoreLabel, color: scoreColor } = getScoreLabel(stats.sleepScore);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary card */}
      {records.length > 0 && (
        <div className="glass-card p-6 text-center">
          <h3 className="text-sm text-gray-400 mb-2">あなたの睡眠評価</h3>
          <div className="text-3xl font-bold mb-1" style={{ color: scoreColor }}>
            {scoreLabel}
          </div>
          <p className="text-sm text-gray-500">
            直近{Math.min(records.length, 7)}日間のデータに基づく分析
          </p>
        </div>
      )}

      {/* Advice cards */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-300 px-1">パーソナルアドバイス</h3>
        {advice.map((text, i) => (
          <div
            key={i}
            className="glass-card p-4 animate-slide-up"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex gap-3">
              <div className="text-2xl flex-shrink-0 mt-1">
                {getAdviceIcon(text)}
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sleep hygiene tips */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-300 px-1">睡眠衛生の基本</h3>
        {sleepHygieneTips.map((tip, i) => (
          <div
            key={i}
            className="glass-card p-4 animate-slide-up"
            style={{ animationDelay: `${(advice.length + i) * 100}ms` }}
          >
            <div className="flex gap-3">
              <div className="text-2xl flex-shrink-0">{tip.icon}</div>
              <div>
                <h4 className="text-sm font-bold text-purple-300 mb-1">{tip.title}</h4>
                <p className="text-xs text-gray-400 leading-relaxed">{tip.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const sleepHygieneTips = [
  {
    icon: '🕐',
    title: '一定の就寝・起床時間を守る',
    description: '体内時計を整えるために、平日も休日も同じ時間に寝起きしましょう。30分以上のずれは体内リズムを乱します。',
  },
  {
    icon: '🌡️',
    title: '快適な寝室環境を整える',
    description: '室温18〜22℃、湿度50〜60%が理想的です。遮光カーテンで暗くし、静かな環境を作りましょう。',
  },
  {
    icon: '📵',
    title: '就寝30分前にデバイスをオフ',
    description: 'ブルーライトはメラトニン（睡眠ホルモン）の分泌を抑制します。代わりに読書やストレッチを取り入れましょう。',
  },
  {
    icon: '☕',
    title: '午後2時以降のカフェインを避ける',
    description: 'カフェインの半減期は約5〜6時間です。午後のコーヒーは就寝時にもまだ体内に残っている可能性があります。',
  },
  {
    icon: '🏋️',
    title: '日中に適度な運動をする',
    description: '週3回以上の有酸素運動は深い睡眠を促進します。ただし就寝3時間前までに終わらせましょう。',
  },
  {
    icon: '🍽️',
    title: '就寝前の重い食事を避ける',
    description: '就寝2〜3時間前までに夕食を済ませましょう。どうしても空腹なら、温かいミルクやバナナが最適です。',
  },
  {
    icon: '☀️',
    title: '朝の光を浴びる',
    description: '起床後15分以内に自然光を浴びると体内時計がリセットされ、夜の入眠がスムーズになります。',
  },
  {
    icon: '🧘',
    title: 'リラックスルーティンを作る',
    description: '就寝前の深呼吸、瞑想、軽いストレッチは副交感神経を活性化し、入眠を促進します。',
  },
];
