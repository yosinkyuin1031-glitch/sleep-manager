'use client';

import { useMemo, useState } from 'react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, Legend,
} from 'recharts';
import { SleepRecord, SleepGoal } from '@/types/sleep';

interface Props {
  records: SleepRecord[];
  goals: SleepGoal;
}

type ViewMode = 'daily' | 'weekly' | 'monthly';

interface AggregatedData {
  label: string;
  avgDuration: number;
  avgQuality: number;
  avgBodyScore: number;
  count: number;
  goalLine: number;
}

export default function TrendChart({ records, goals }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('daily');

  const chartData = useMemo(() => {
    const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
    const goalHours = goals.targetDuration;

    if (viewMode === 'daily') {
      // Show last 14 days
      return sorted.slice(-14).map(r => {
        const d = new Date(r.date);
        return {
          label: `${d.getMonth() + 1}/${d.getDate()}`,
          avgDuration: Math.round((r.duration / 60) * 10) / 10,
          avgQuality: r.quality,
          avgBodyScore: r.bodyScore,
          count: 1,
          goalLine: goalHours,
        };
      });
    }

    if (viewMode === 'weekly') {
      // Aggregate by week
      const weeks = new Map<string, SleepRecord[]>();
      sorted.forEach(r => {
        const d = new Date(r.date);
        const dayOfWeek = d.getDay();
        const weekStart = new Date(d);
        weekStart.setDate(weekStart.getDate() - dayOfWeek);
        const key = weekStart.toISOString().split('T')[0];
        if (!weeks.has(key)) weeks.set(key, []);
        weeks.get(key)!.push(r);
      });

      const result: AggregatedData[] = [];
      const entries = [...weeks.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-8);
      entries.forEach(([key, recs]) => {
        const d = new Date(key);
        const avgDur = recs.reduce((s, r) => s + r.duration, 0) / recs.length;
        const avgQual = recs.reduce((s, r) => s + r.quality, 0) / recs.length;
        const avgBody = recs.reduce((s, r) => s + r.bodyScore, 0) / recs.length;
        result.push({
          label: `${d.getMonth() + 1}/${d.getDate()}~`,
          avgDuration: Math.round((avgDur / 60) * 10) / 10,
          avgQuality: Math.round(avgQual * 10) / 10,
          avgBodyScore: Math.round(avgBody * 10) / 10,
          count: recs.length,
          goalLine: goalHours,
        });
      });
      return result;
    }

    // Monthly
    const months = new Map<string, SleepRecord[]>();
    sorted.forEach(r => {
      const key = r.date.substring(0, 7); // YYYY-MM
      if (!months.has(key)) months.set(key, []);
      months.get(key)!.push(r);
    });

    const result: AggregatedData[] = [];
    const entries = [...months.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-6);
    entries.forEach(([key, recs]) => {
      const [y, m] = key.split('-');
      const avgDur = recs.reduce((s, r) => s + r.duration, 0) / recs.length;
      const avgQual = recs.reduce((s, r) => s + r.quality, 0) / recs.length;
      const avgBody = recs.reduce((s, r) => s + r.bodyScore, 0) / recs.length;
      result.push({
        label: `${parseInt(m)}月`,
        avgDuration: Math.round((avgDur / 60) * 10) / 10,
        avgQuality: Math.round(avgQual * 10) / 10,
        avgBodyScore: Math.round(avgBody * 10) / 10,
        count: recs.length,
        goalLine: goalHours,
      });
    });
    return result;
  }, [records, goals.targetDuration, viewMode]);

  if (records.length < 2) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* View mode selector */}
      <div className="flex justify-center gap-2">
        {([['daily', '日別'], ['weekly', '週間'], ['monthly', '月間']] as [ViewMode, string][]).map(([mode, label]) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              viewMode === mode
                ? 'bg-purple-600 text-white'
                : 'bg-[#252240] text-gray-400 hover:bg-[#2d2a50]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Combined Chart: Duration + Quality */}
      <div className="glass-card p-4">
        <h3 className="text-sm text-gray-400 mb-4">
          睡眠時間 & 品質トレンド
          <span className="text-[10px] text-gray-600 ml-2">
            ({viewMode === 'daily' ? '直近14日' : viewMode === 'weekly' ? '直近8週' : '直近6ヶ月'})
          </span>
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <ComposedChart data={chartData}>
            <defs>
              <linearGradient id="trendDurationGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2a45" />
            <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <YAxis
              yAxisId="duration"
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              domain={[0, 12]}
              tickFormatter={(v: number) => `${v}h`}
            />
            <YAxis
              yAxisId="quality"
              orientation="right"
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              domain={[0, 5]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1730',
                border: '1px solid #2d2a45',
                borderRadius: '0.5rem',
                color: '#e8e6f0',
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => {
                if (name === 'avgDuration') return [`${value}h`, 'Sleep Duration'];
                if (name === 'avgQuality') return [`${value}/5`, 'Quality'];
                if (name === 'goalLine') return [`${value}h`, 'Target'];
                return [value, name];
              }}
            />
            <Legend
              formatter={(value: string) => {
                const labels: Record<string, string> = {
                  avgDuration: 'Sleep Duration',
                  avgQuality: 'Quality',
                  goalLine: 'Target',
                };
                return <span style={{ color: '#9ca3af', fontSize: '11px' }}>{labels[value] || value}</span>;
              }}
            />
            <Area
              yAxisId="duration"
              type="monotone"
              dataKey="avgDuration"
              stroke="#7c3aed"
              strokeWidth={2}
              fill="url(#trendDurationGrad)"
              dot={{ fill: '#7c3aed', r: 3 }}
            />
            <Line
              yAxisId="duration"
              type="monotone"
              dataKey="goalLine"
              stroke="#f59e0b"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
            />
            <Bar
              yAxisId="quality"
              dataKey="avgQuality"
              fill="#6366f1"
              opacity={0.6}
              radius={[2, 2, 0, 0]}
              barSize={viewMode === 'daily' ? 12 : 20}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Body Score Trend */}
      <div className="glass-card p-4">
        <h3 className="text-sm text-gray-400 mb-4">体調スコアトレンド</h3>
        <ResponsiveContainer width="100%" height={160}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2a45" />
            <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <YAxis domain={[0, 5]} tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1730',
                border: '1px solid #2d2a45',
                borderRadius: '0.5rem',
                color: '#e8e6f0',
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [`${value}/5`, 'Body Score']}
            />
            <Line
              type="monotone"
              dataKey="avgBodyScore"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ fill: '#22c55e', r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
