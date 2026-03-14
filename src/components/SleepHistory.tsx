'use client';

import { SleepRecord } from '@/types/sleep';
import { formatDuration, getQualityLabel } from '@/lib/sleepUtils';

interface Props {
  records: SleepRecord[];
  onEdit: (record: SleepRecord) => void;
  onDelete: (id: string) => void;
}

export default function SleepHistory({ records, onEdit, onDelete }: Props) {
  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));

  if (sorted.length === 0) {
    return (
      <div className="glass-card p-8 text-center text-gray-400 animate-fade-in">
        <div className="text-4xl mb-3">🌙</div>
        <p>まだ睡眠記録がありません</p>
        <p className="text-sm mt-1">上のフォームから記録を始めましょう</p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return `${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]})`;
  };

  const getDurationColor = (minutes: number) => {
    if (minutes >= 420) return 'text-green-400';
    if (minutes >= 360) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-3 mt-6 animate-fade-in">
      <h3 className="text-lg font-bold text-gray-300 px-1">睡眠履歴</h3>
      {sorted.map((record, i) => (
        <div
          key={record.id}
          className="glass-card p-4 animate-slide-up"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm text-gray-400">{formatDate(record.date)}</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-xl font-bold ${getDurationColor(record.duration)}`}>
                  {formatDuration(record.duration)}
                </span>
                <span className="text-sm text-gray-500">
                  {record.bedtime} → {record.wakeTime}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(s => (
                    <span
                      key={s}
                      className={`text-sm ${s <= record.quality ? 'text-yellow-400' : 'text-gray-600'}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-xs text-gray-500">{getQualityLabel(record.quality)}</span>
              </div>
              {record.memo && (
                <p className="text-xs text-gray-500 mt-2 line-clamp-1">{record.memo}</p>
              )}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => onEdit(record)}
                className="p-2 rounded-lg hover:bg-purple-600/20 text-gray-400 hover:text-purple-400 transition-colors"
                title="編集"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => {
                  if (confirm('この記録を削除しますか？')) onDelete(record.id);
                }}
                className="p-2 rounded-lg hover:bg-red-600/20 text-gray-400 hover:text-red-400 transition-colors"
                title="削除"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          {/* Factor badges */}
          <div className="flex flex-wrap gap-1 mt-2">
            {record.factors.caffeine && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-900/40 text-amber-400">☕カフェイン</span>}
            {record.factors.exercise && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-900/40 text-green-400">🏃運動</span>}
            {record.factors.stress && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-900/40 text-red-400">😰ストレス</span>}
            {record.factors.screenTime && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-400">📱スクリーン</span>}
            {record.factors.alcohol && <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-900/40 text-orange-400">🍺飲酒</span>}
            {record.factors.nap && <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900/40 text-purple-400">😴昼寝</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
