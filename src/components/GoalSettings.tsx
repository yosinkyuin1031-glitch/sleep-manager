'use client';

import { useState } from 'react';
import { SleepGoal, SleepRecord } from '@/types/sleep';
import { calculateSleepDebt, formatDuration } from '@/lib/sleepUtils';

interface Props {
  goals: SleepGoal;
  records: SleepRecord[];
  onSave: (goals: SleepGoal) => void;
}

export default function GoalSettings({ goals, records, onSave }: Props) {
  const [localGoals, setLocalGoals] = useState<SleepGoal>(goals);
  const [saved, setSaved] = useState(false);

  const sleepDebt = calculateSleepDebt(records, localGoals.idealDuration);
  const debtHours = sleepDebt / 60;

  const handleSave = () => {
    onSave(localGoals);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const getDebtColor = () => {
    if (debtHours <= 1) return '#22c55e';
    if (debtHours <= 3) return '#f59e0b';
    return '#ef4444';
  };

  const getDebtMessage = () => {
    if (records.length === 0) return '記録を開始すると睡眠負債が計算されます';
    if (debtHours <= 0.5) return '素晴らしい！睡眠負債はほぼありません';
    if (debtHours <= 2) return '軽度の睡眠負債があります。少し早めに寝ましょう';
    if (debtHours <= 5) return '睡眠負債が溜まっています。週末に少し多く寝ましょう';
    return '深刻な睡眠負債です。生活リズムの見直しをおすすめします';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Sleep Debt Card */}
      <div className="glass-card p-6">
        <h3 className="text-sm text-gray-400 mb-3 text-center">直近7日間の睡眠負債</h3>
        <div className="text-center">
          <span className="text-4xl font-bold" style={{ color: getDebtColor() }}>
            {records.length > 0 ? formatDuration(Math.round(sleepDebt)) : '--'}
          </span>
        </div>
        <p className="text-xs text-gray-500 text-center mt-3">{getDebtMessage()}</p>

        {records.length > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>0h</span>
              <span>{Math.max(10, Math.ceil(debtHours + 2))}h</span>
            </div>
            <div className="h-3 bg-[#252240] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (debtHours / Math.max(10, debtHours + 2)) * 100)}%`,
                  background: `linear-gradient(to right, ${getDebtColor()}, ${getDebtColor()}aa)`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Goal Settings */}
      <div className="glass-card p-4">
        <h3 className="text-lg font-bold text-gray-300 mb-4">目標設定</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">目標就寝時間</label>
            <input
              type="time"
              value={localGoals.targetBedtime}
              onChange={e => setLocalGoals(prev => ({ ...prev, targetBedtime: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">目標起床時間</label>
            <input
              type="time"
              value={localGoals.targetWakeTime}
              onChange={e => setLocalGoals(prev => ({ ...prev, targetWakeTime: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              目標睡眠時間: <span className="text-purple-400 font-bold">{localGoals.targetDuration}時間</span>
            </label>
            <input
              type="range"
              min={5}
              max={10}
              step={0.5}
              value={localGoals.targetDuration}
              onChange={e => setLocalGoals(prev => ({ ...prev, targetDuration: parseFloat(e.target.value) }))}
              className="w-full accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-600">
              <span>5h</span>
              <span>10h</span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              理想の睡眠時間（負債計算用）: <span className="text-purple-400 font-bold">{localGoals.idealDuration}時間</span>
            </label>
            <input
              type="range"
              min={6}
              max={9}
              step={0.5}
              value={localGoals.idealDuration}
              onChange={e => setLocalGoals(prev => ({ ...prev, idealDuration: parseFloat(e.target.value) }))}
              className="w-full accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-600">
              <span>6h</span>
              <span>9h</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              ※ 成人の推奨睡眠時間は7〜9時間です
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className={`w-full mt-6 py-3 rounded-xl font-bold text-white transition-all duration-300 ${
            saved
              ? 'bg-green-600 scale-95'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95'
          }`}
        >
          {saved ? '保存しました ✓' : '目標を保存'}
        </button>
      </div>

      {/* Age-based recommendations */}
      <div className="glass-card p-4">
        <h3 className="text-sm text-gray-400 mb-3">年齢別 推奨睡眠時間</h3>
        <div className="space-y-2">
          {ageRecommendations.map((rec, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-[#2d2a45] last:border-0">
              <span className="text-sm text-gray-400">{rec.age}</span>
              <span className="text-sm font-medium text-purple-300">{rec.hours}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const ageRecommendations = [
  { age: '新生児（0〜3ヶ月）', hours: '14〜17時間' },
  { age: '乳児（4〜11ヶ月）', hours: '12〜15時間' },
  { age: '幼児（1〜2歳）', hours: '11〜14時間' },
  { age: '未就学児（3〜5歳）', hours: '10〜13時間' },
  { age: '学童（6〜13歳）', hours: '9〜11時間' },
  { age: '中高生（14〜17歳）', hours: '8〜10時間' },
  { age: '成人（18〜64歳）', hours: '7〜9時間' },
  { age: '高齢者（65歳以上）', hours: '7〜8時間' },
];
