'use client';

import { useMemo } from 'react';
import { SleepRecord, SleepGoal } from '@/types/sleep';
import { formatDuration } from '@/lib/sleepUtils';

interface Props {
  records: SleepRecord[];
  goals: SleepGoal;
}

export default function GoalAchievement({ records, goals }: Props) {
  const stats = useMemo(() => {
    if (records.length === 0) return null;

    const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
    const last7 = sorted.slice(0, 7);
    const last30 = sorted.slice(0, 30);
    const targetMin = goals.targetDuration * 60;

    // Duration achievement
    const weekAchieved = last7.filter(r => r.duration >= targetMin).length;
    const monthAchieved = last30.filter(r => r.duration >= targetMin).length;
    const weekRate = last7.length > 0 ? Math.round((weekAchieved / last7.length) * 100) : 0;
    const monthRate = last30.length > 0 ? Math.round((monthAchieved / last30.length) * 100) : 0;

    // Bedtime achievement (within 30min of target)
    const [targetBedH, targetBedM] = goals.targetBedtime.split(':').map(Number);
    const targetBedMin = targetBedH < 12 ? targetBedH * 60 + targetBedM + 24 * 60 : targetBedH * 60 + targetBedM;

    const weekBedtimeAchieved = last7.filter(r => {
      const [h, m] = r.bedtime.split(':').map(Number);
      const bedMin = h < 12 ? h * 60 + m + 24 * 60 : h * 60 + m;
      return Math.abs(bedMin - targetBedMin) <= 30;
    }).length;
    const weekBedtimeRate = last7.length > 0 ? Math.round((weekBedtimeAchieved / last7.length) * 100) : 0;

    // Wake time achievement
    const [targetWakeH, targetWakeM] = goals.targetWakeTime.split(':').map(Number);
    const targetWakeMin = targetWakeH * 60 + targetWakeM;

    const weekWakeAchieved = last7.filter(r => {
      const [h, m] = r.wakeTime.split(':').map(Number);
      const wakeMin = h * 60 + m;
      return Math.abs(wakeMin - targetWakeMin) <= 30;
    }).length;
    const weekWakeRate = last7.length > 0 ? Math.round((weekWakeAchieved / last7.length) * 100) : 0;

    // Average actual duration
    const avgDuration = last7.reduce((s, r) => s + r.duration, 0) / last7.length;
    const durationDiff = avgDuration - targetMin;

    return {
      weekAchieved,
      weekTotal: last7.length,
      weekRate,
      monthAchieved,
      monthTotal: last30.length,
      monthRate,
      weekBedtimeRate,
      weekWakeRate,
      avgDuration,
      durationDiff,
    };
  }, [records, goals]);

  if (!stats || records.length === 0) {
    return (
      <div className="glass-card p-6 text-center text-gray-400">
        <p className="text-sm">記録を開始すると目標達成率が表示されます</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Weekly Achievement */}
      <div className="glass-card p-4">
        <h4 className="text-sm text-gray-400 mb-3">週間目標達成率</h4>
        <div className="grid grid-cols-3 gap-3">
          <AchievementCircle
            label="睡眠時間"
            rate={stats.weekRate}
            detail={`${stats.weekAchieved}/${stats.weekTotal}日`}
          />
          <AchievementCircle
            label="就寝時間"
            rate={stats.weekBedtimeRate}
            detail={`目標${goals.targetBedtime}`}
          />
          <AchievementCircle
            label="起床時間"
            rate={stats.weekWakeRate}
            detail={`目標${goals.targetWakeTime}`}
          />
        </div>
      </div>

      {/* Monthly Achievement */}
      <div className="glass-card p-4">
        <h4 className="text-sm text-gray-400 mb-3">月間達成率（睡眠時間）</h4>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold" style={{
              color: stats.monthRate >= 80 ? '#22c55e' : stats.monthRate >= 60 ? '#f59e0b' : '#ef4444'
            }}>
              {stats.monthRate}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.monthAchieved}/{stats.monthTotal}日達成
            </div>
          </div>
          <div className="flex-1">
            <div className="h-4 bg-[#252240] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${stats.monthRate}%`,
                  background: stats.monthRate >= 80
                    ? 'linear-gradient(to right, #22c55e, #16a34a)'
                    : stats.monthRate >= 60
                    ? 'linear-gradient(to right, #f59e0b, #d97706)'
                    : 'linear-gradient(to right, #ef4444, #dc2626)',
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-600 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Duration Comparison */}
      <div className="glass-card p-4">
        <h4 className="text-sm text-gray-400 mb-2">目標 vs 実績（週間平均）</h4>
        <div className="flex items-center justify-between">
          <div className="text-center">
            <div className="text-xs text-gray-500">目標</div>
            <div className="text-lg font-bold text-purple-400">{goals.targetDuration}h</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">実績</div>
            <div className="text-lg font-bold text-indigo-400">
              {formatDuration(Math.round(stats.avgDuration))}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">差分</div>
            <div className={`text-lg font-bold ${stats.durationDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.durationDiff >= 0 ? '+' : ''}{Math.round(stats.durationDiff)}分
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AchievementCircle({ label, rate, detail }: { label: string; rate: number; detail: string }) {
  const circumference = 2 * Math.PI * 28;
  const strokeDashoffset = circumference - (rate / 100) * circumference;
  const color = rate >= 80 ? '#22c55e' : rate >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32" cy="32" r="28"
            stroke="#252240"
            strokeWidth="4"
            fill="none"
          />
          <circle
            cx="32" cy="32" r="28"
            stroke={color}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.7s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold" style={{ color }}>{rate}%</span>
        </div>
      </div>
      <span className="text-xs text-gray-400 mt-1">{label}</span>
      <span className="text-[10px] text-gray-600">{detail}</span>
    </div>
  );
}
