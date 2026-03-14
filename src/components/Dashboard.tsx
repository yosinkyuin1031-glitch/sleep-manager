'use client';

import { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, AreaChart, Area
} from 'recharts';
import { SleepRecord, SleepGoal } from '@/types/sleep';
import { calculateStats, formatDuration, getScoreLabel } from '@/lib/sleepUtils';

interface Props {
  records: SleepRecord[];
  goals: SleepGoal;
}

type Period = '7' | '14' | '30';

export default function Dashboard({ records, goals }: Props) {
  const [period, setPeriod] = useState<Period>('7');
  const periodDays = parseInt(period);

  const filteredRecords = useMemo(() => {
    const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.slice(-periodDays);
  }, [records, periodDays]);

  const stats = useMemo(() => calculateStats(records, goals), [records, goals]);

  const chartData = useMemo(() => {
    return filteredRecords.map(r => {
      const d = new Date(r.date);
      return {
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        duration: Math.round((r.duration / 60) * 10) / 10,
        quality: r.quality,
        bedtime: (() => {
          const [h, m] = r.bedtime.split(':').map(Number);
          const normalized = h < 12 ? h + 24 : h;
          return normalized + m / 60;
        })(),
      };
    });
  }, [filteredRecords]);

  const scoreData = useMemo(() => {
    const { label, color } = getScoreLabel(stats.sleepScore);
    return [{ name: label, value: stats.sleepScore, fill: color }];
  }, [stats.sleepScore]);

  if (records.length === 0) {
    return (
      <div className="glass-card p-8 text-center text-gray-400 animate-fade-in">
        <div className="text-4xl mb-3">📊</div>
        <p>データがまだありません</p>
        <p className="text-sm mt-1">睡眠記録をつけると統計が表示されます</p>
      </div>
    );
  }

  const { label: scoreLabel, color: scoreColor } = getScoreLabel(stats.sleepScore);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Score Ring */}
      <div className="glass-card p-6 flex flex-col items-center score-ring">
        <h3 className="text-sm text-gray-400 mb-2">睡眠スコア</h3>
        <div className="relative w-48 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%" cy="50%"
              innerRadius="70%" outerRadius="100%"
              startAngle={90} endAngle={-270}
              data={scoreData}
            >
              <RadialBar
                dataKey="value"
                cornerRadius={10}
                background={{ fill: '#252240' }}
                max={100}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold" style={{ color: scoreColor }}>
              {stats.sleepScore}
            </span>
            <span className="text-sm mt-1" style={{ color: scoreColor }}>
              {scoreLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="平均睡眠時間"
          value={formatDuration(Math.round(stats.avgDuration))}
          color={stats.avgDuration >= 420 ? '#22c55e' : stats.avgDuration >= 360 ? '#f59e0b' : '#ef4444'}
        />
        <StatCard
          label="平均品質"
          value={`${stats.avgQuality} / 5`}
          color={stats.avgQuality >= 4 ? '#22c55e' : stats.avgQuality >= 3 ? '#f59e0b' : '#ef4444'}
        />
        <StatCard
          label="平均就寝"
          value={stats.avgBedtime}
          color="#a78bfa"
        />
        <StatCard
          label="平均起床"
          value={stats.avgWakeTime}
          color="#6366f1"
        />
        <StatCard
          label="一貫性"
          value={`${stats.consistency}%`}
          color={stats.consistency >= 80 ? '#22c55e' : stats.consistency >= 60 ? '#f59e0b' : '#ef4444'}
        />
        <StatCard
          label="睡眠負債"
          value={formatDuration(Math.round(stats.sleepDebt))}
          color={stats.sleepDebt <= 60 ? '#22c55e' : stats.sleepDebt <= 180 ? '#f59e0b' : '#ef4444'}
        />
      </div>

      {/* Period selector */}
      <div className="flex justify-center gap-2">
        {([['7', '1週間'], ['14', '2週間'], ['30', '1ヶ月']] as [Period, string][]).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setPeriod(val)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              period === val
                ? 'bg-purple-600 text-white'
                : 'bg-[#252240] text-gray-400 hover:bg-[#2d2a50]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Duration Chart */}
      <div className="glass-card p-4">
        <h3 className="text-sm text-gray-400 mb-4">睡眠時間の推移</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="durationGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2a45" />
            <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              domain={[0, 12]}
              tickFormatter={(v: number) => `${v}h`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1730',
                border: '1px solid #2d2a45',
                borderRadius: '0.5rem',
                color: '#e8e6f0',
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [`${value}時間`, '睡眠時間']}
            />
            <Area
              type="monotone"
              dataKey="duration"
              stroke="#7c3aed"
              strokeWidth={2}
              fill="url(#durationGrad)"
              dot={{ fill: '#7c3aed', r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Quality Chart */}
      <div className="glass-card p-4">
        <h3 className="text-sm text-gray-400 mb-4">睡眠品質の推移</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2a45" />
            <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <YAxis
              domain={[0, 5]}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1730',
                border: '1px solid #2d2a45',
                borderRadius: '0.5rem',
                color: '#e8e6f0',
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [`${value} / 5`, '品質']}
            />
            <Bar
              dataKey="quality"
              fill="#6366f1"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bedtime Chart */}
      <div className="glass-card p-4">
        <h3 className="text-sm text-gray-400 mb-4">就寝時間の推移</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2a45" />
            <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <YAxis
              domain={[20, 28]}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickFormatter={(v: number) => {
                const h = v >= 24 ? v - 24 : v;
                return `${h}:00`;
              }}
              reversed
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1730',
                border: '1px solid #2d2a45',
                borderRadius: '0.5rem',
                color: '#e8e6f0',
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => {
                const v = Number(value);
                const h = Math.floor(v >= 24 ? v - 24 : v);
                const m = Math.round((v % 1) * 60);
                return [`${h}:${String(m).padStart(2, '0')}`, '就寝時間'];
              }}
            />
            <Line
              type="monotone"
              dataKey="bedtime"
              stroke="#a78bfa"
              strokeWidth={2}
              dot={{ fill: '#a78bfa', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="glass-card p-4 text-center">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-lg font-bold" style={{ color }}>{value}</div>
    </div>
  );
}
