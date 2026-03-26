'use client';

import { useState, useEffect, useMemo } from 'react';
import { SleepGoal, SleepRecord, WeeklyChallenge, ReminderSettings } from '@/types/sleep';
import { calculateSleepDebt, formatDuration, generateId } from '@/lib/sleepUtils';
import { getChallenge, saveChallenge, clearChallenge, getReminder, saveReminder, calculateStreak } from '@/lib/storage';

interface Props {
  goals: SleepGoal;
  records: SleepRecord[];
  onSave: (goals: SleepGoal) => void;
}

const challengeTemplates = [
  { title: '7時間以上睡眠を5日達成', description: '1週間で5日以上、7時間以上の睡眠を取る', targetValue: 5, unit: '日', check: (r: SleepRecord) => r.duration >= 420 },
  { title: '23時前就寝を5日達成', description: '1週間で5日以上、23時前に就寝する', targetValue: 5, unit: '日', check: (r: SleepRecord) => { const [h] = r.bedtime.split(':').map(Number); return h < 23 || h >= 12; } },
  { title: '睡眠品質4以上を4日達成', description: '1週間で4日以上、品質4以上の睡眠を取る', targetValue: 4, unit: '日', check: (r: SleepRecord) => r.quality >= 4 },
  { title: '毎日記録を7日連続', description: '7日連続で睡眠記録をつける', targetValue: 7, unit: '日', check: () => true },
];

export default function GoalSettings({ goals, records, onSave }: Props) {
  const [localGoals, setLocalGoals] = useState<SleepGoal>(goals);
  const [saved, setSaved] = useState(false);
  const [challenge, setChallenge] = useState<WeeklyChallenge | null>(null);
  const [reminder, setReminder] = useState<ReminderSettings>({ enabled: false, time: '22:30' });
  const [showChallengeSelector, setShowChallengeSelector] = useState(false);

  const sleepDebt = calculateSleepDebt(records, localGoals.idealDuration);
  const debtHours = sleepDebt / 60;
  const streak = useMemo(() => calculateStreak(records), [records]);

  useEffect(() => {
    const c = getChallenge();
    if (c) setChallenge(c);
    setReminder(getReminder());
  }, []);

  // Update challenge progress
  useEffect(() => {
    if (!challenge) return;
    const startDate = new Date(challenge.startDate);
    const endDate = new Date(challenge.endDate);
    const relevantRecords = records.filter(r => {
      const d = new Date(r.date);
      return d >= startDate && d <= endDate;
    });

    // Check if it's a streak-based challenge
    if (challenge.title.includes('毎日記録')) {
      const newValue = streak >= 7 ? 7 : Math.min(streak, 7);
      if (newValue !== challenge.currentValue) {
        const updated = { ...challenge, currentValue: newValue, completed: newValue >= challenge.targetValue };
        setChallenge(updated);
        saveChallenge(updated);
      }
    } else {
      const template = challengeTemplates.find(t => t.title === challenge.title);
      if (template) {
        const achieved = relevantRecords.filter(r => template.check(r)).length;
        if (achieved !== challenge.currentValue) {
          const updated = { ...challenge, currentValue: achieved, completed: achieved >= challenge.targetValue };
          setChallenge(updated);
          saveChallenge(updated);
        }
      }
    }
  }, [challenge, records, streak]);

  const handleSave = () => {
    onSave(localGoals);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleStartChallenge = (templateIndex: number) => {
    const template = challengeTemplates[templateIndex];
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + 7);

    const newChallenge: WeeklyChallenge = {
      id: generateId(),
      title: template.title,
      description: template.description,
      targetValue: template.targetValue,
      currentValue: 0,
      unit: template.unit,
      startDate: now.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      completed: false,
    };
    setChallenge(newChallenge);
    saveChallenge(newChallenge);
    setShowChallengeSelector(false);
  };

  const handleClearChallenge = () => {
    setChallenge(null);
    clearChallenge();
  };

  const handleReminderChange = (updates: Partial<ReminderSettings>) => {
    const updated = { ...reminder, ...updates };
    setReminder(updated);
    saveReminder(updated);
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
      {/* Streak Display */}
      <div className="glass-card p-6 text-center">
        <div className="text-3xl mb-2">{'\uD83D\uDD25'}</div>
        <div className="text-4xl font-bold text-orange-400 mb-1">{streak}</div>
        <div className="text-sm text-gray-400">日連続記録中</div>
        {streak >= 7 && <div className="text-xs text-yellow-400 mt-2">1週間達成！素晴らしい！</div>}
        {streak >= 30 && <div className="text-xs text-green-400 mt-1">1ヶ月達成！最高の習慣です！</div>}
      </div>

      {/* Weekly Challenge */}
      <div className="glass-card p-4">
        <h3 className="text-lg font-bold text-gray-300 mb-3">週間チャレンジ</h3>
        {challenge ? (
          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="text-sm font-bold text-purple-300">{challenge.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{challenge.description}</p>
                <p className="text-[10px] text-gray-600 mt-1">
                  {challenge.startDate} 〜 {challenge.endDate}
                </p>
              </div>
              {challenge.completed && (
                <span className="text-xs px-2 py-1 rounded-full bg-green-600/30 text-green-400 font-bold">
                  達成！
                </span>
              )}
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{challenge.currentValue}{challenge.unit}</span>
                <span>{challenge.targetValue}{challenge.unit}</span>
              </div>
              <div className="h-3 bg-[#252240] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (challenge.currentValue / challenge.targetValue) * 100)}%`,
                    background: challenge.completed
                      ? 'linear-gradient(to right, #22c55e, #16a34a)'
                      : 'linear-gradient(to right, #7c3aed, #6366f1)',
                  }}
                />
              </div>
            </div>
            <button
              onClick={handleClearChallenge}
              className="w-full mt-3 py-2 rounded-xl text-xs text-gray-500 hover:text-gray-400 transition-colors"
            >
              チャレンジをリセット
            </button>
          </div>
        ) : showChallengeSelector ? (
          <div className="space-y-2">
            {challengeTemplates.map((t, i) => (
              <button
                key={i}
                onClick={() => handleStartChallenge(i)}
                className="w-full p-3 rounded-xl bg-[#252240] hover:bg-[#2d2a50] transition-all text-left"
              >
                <h4 className="text-sm font-bold text-gray-300">{t.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{t.description}</p>
              </button>
            ))}
            <button
              onClick={() => setShowChallengeSelector(false)}
              className="w-full py-2 text-xs text-gray-500"
            >
              キャンセル
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowChallengeSelector(true)}
            className="w-full py-3 rounded-xl border-2 border-dashed border-[#2d2a45] text-gray-400 hover:border-purple-500 hover:text-purple-400 transition-all text-sm"
          >
            + チャレンジを開始する
          </button>
        )}
      </div>

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
          {saved ? '\u4FDD\u5B58\u3057\u307E\u3057\u305F \u2713' : '\u76EE\u6A19\u3092\u4FDD\u5B58'}
        </button>
      </div>

      {/* Reminder Settings */}
      <div className="glass-card p-4">
        <h3 className="text-lg font-bold text-gray-300 mb-3">おやすみリマインダー</h3>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-400">リマインダー表示</span>
          <button
            onClick={() => handleReminderChange({ enabled: !reminder.enabled })}
            className={`w-12 h-6 rounded-full transition-all duration-300 relative ${
              reminder.enabled ? 'bg-purple-600' : 'bg-gray-600'
            }`}
          >
            <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all duration-300 ${
              reminder.enabled ? 'left-6' : 'left-0.5'
            }`} />
          </button>
        </div>
        {reminder.enabled && (
          <div>
            <label className="block text-sm text-gray-400 mb-2">リマインダー時刻</label>
            <input
              type="time"
              value={reminder.time}
              onChange={e => handleReminderChange({ time: e.target.value })}
            />
            <p className="text-xs text-gray-600 mt-2">
              ※ この時刻にアプリを開くと、就寝準備のリマインドが表示されます
            </p>
          </div>
        )}
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
