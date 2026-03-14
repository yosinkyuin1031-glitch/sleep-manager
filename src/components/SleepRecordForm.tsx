'use client';

import { useState } from 'react';
import { SleepRecord, SleepFactors } from '@/types/sleep';
import { calculateDuration, formatDuration, generateId, getQualityLabel } from '@/lib/sleepUtils';

interface Props {
  onSave: (record: SleepRecord) => void;
  editRecord?: SleepRecord | null;
  onCancelEdit?: () => void;
}

const factorLabels: { key: keyof SleepFactors; label: string; icon: string }[] = [
  { key: 'caffeine', label: 'カフェイン', icon: '☕' },
  { key: 'exercise', label: '運動', icon: '🏃' },
  { key: 'stress', label: 'ストレス', icon: '😰' },
  { key: 'screenTime', label: 'スクリーン', icon: '📱' },
  { key: 'alcohol', label: '飲酒', icon: '🍺' },
  { key: 'nap', label: '昼寝', icon: '😴' },
];

export default function SleepRecordForm({ onSave, editRecord, onCancelEdit }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(editRecord?.date || today);
  const [bedtime, setBedtime] = useState(editRecord?.bedtime || '23:00');
  const [wakeTime, setWakeTime] = useState(editRecord?.wakeTime || '07:00');
  const [quality, setQuality] = useState(editRecord?.quality || 3);
  const [factors, setFactors] = useState<SleepFactors>(
    editRecord?.factors || {
      caffeine: false,
      exercise: false,
      stress: false,
      screenTime: false,
      alcohol: false,
      nap: false,
    }
  );
  const [memo, setMemo] = useState(editRecord?.memo || '');
  const [saved, setSaved] = useState(false);

  const duration = calculateDuration(bedtime, wakeTime);

  const toggleFactor = (key: keyof SleepFactors) => {
    setFactors(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const record: SleepRecord = {
      id: editRecord?.id || generateId(),
      date,
      bedtime,
      wakeTime,
      duration,
      quality,
      factors,
      memo,
      createdAt: editRecord?.createdAt || new Date().toISOString(),
    };
    onSave(record);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (!editRecord) {
      setQuality(3);
      setFactors({
        caffeine: false,
        exercise: false,
        stress: false,
        screenTime: false,
        alcohol: false,
        nap: false,
      });
      setMemo('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      {/* Date */}
      <div className="glass-card p-4">
        <label className="block text-sm text-gray-400 mb-2">日付</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          max={today}
        />
      </div>

      {/* Bedtime & Wake time */}
      <div className="glass-card p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">就寝時間</label>
            <input
              type="time"
              value={bedtime}
              onChange={e => setBedtime(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">起床時間</label>
            <input
              type="time"
              value={wakeTime}
              onChange={e => setWakeTime(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-3 text-center">
          <span className="text-2xl font-bold" style={{ color: duration >= 420 ? '#22c55e' : duration >= 360 ? '#f59e0b' : '#ef4444' }}>
            {formatDuration(duration)}
          </span>
          <span className="text-sm text-gray-400 ml-2">の睡眠</span>
        </div>
      </div>

      {/* Quality */}
      <div className="glass-card p-4">
        <label className="block text-sm text-gray-400 mb-3">睡眠の質</label>
        <div className="flex justify-between items-center gap-2">
          {[1, 2, 3, 4, 5].map(q => (
            <button
              key={q}
              type="button"
              onClick={() => setQuality(q)}
              className={`flex-1 py-3 rounded-xl text-center transition-all duration-200 ${
                quality === q
                  ? 'bg-purple-600 text-white scale-105 shadow-lg shadow-purple-600/30'
                  : 'bg-[#252240] text-gray-400 hover:bg-[#2d2a50]'
              }`}
            >
              <div className="text-lg font-bold">{q}</div>
              <div className="text-[10px] mt-1">{getQualityLabel(q)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Factors */}
      <div className="glass-card p-4">
        <label className="block text-sm text-gray-400 mb-3">睡眠に影響した要因</label>
        <div className="grid grid-cols-3 gap-2">
          {factorLabels.map(({ key, label, icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleFactor(key)}
              className={`py-3 px-2 rounded-xl text-center transition-all duration-200 ${
                factors[key]
                  ? 'bg-purple-600/30 border-purple-500 border text-purple-300'
                  : 'bg-[#252240] border border-transparent text-gray-400 hover:bg-[#2d2a50]'
              }`}
            >
              <div className="text-xl">{icon}</div>
              <div className="text-xs mt-1">{label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Memo */}
      <div className="glass-card p-4">
        <label className="block text-sm text-gray-400 mb-2">メモ</label>
        <textarea
          value={memo}
          onChange={e => setMemo(e.target.value)}
          placeholder="今日の睡眠について..."
          rows={3}
          className="resize-none"
        />
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        {editRecord && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="flex-1 py-3 rounded-xl bg-gray-700 text-gray-300 font-bold transition-all hover:bg-gray-600"
          >
            キャンセル
          </button>
        )}
        <button
          type="submit"
          className={`flex-1 py-3 rounded-xl font-bold text-white transition-all duration-300 ${
            saved
              ? 'bg-green-600 scale-95'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95'
          }`}
        >
          {saved ? '保存しました ✓' : editRecord ? '更新する' : '記録する'}
        </button>
      </div>
    </form>
  );
}
