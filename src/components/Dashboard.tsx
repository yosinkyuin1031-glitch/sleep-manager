'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, AreaChart, Area
} from 'recharts';
import { SleepRecord, SleepGoal } from '@/types/sleep';
import {
  calculateStats, formatDuration, getScoreLabel,
  calculateSocialJetLag, analyzeFactorImpact, getWeeklyReport, getSleepDebtHistory,
} from '@/lib/sleepUtils';
import { calculateStreak } from '@/lib/storage';
import { downloadCSV } from '@/lib/exportUtils';

interface Props {
  records: SleepRecord[];
  goals: SleepGoal;
}

type Period = '7' | '14' | '30';

export default function Dashboard({ records, goals }: Props) {
  const [period, setPeriod] = useState<Period>('7');
  const [animatedScore, setAnimatedScore] = useState(0);
  const periodDays = parseInt(period);

  const filteredRecords = useMemo(() => {
    const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.slice(-periodDays);
  }, [records, periodDays]);

  const stats = useMemo(() => calculateStats(records, goals), [records, goals]);
  const streak = useMemo(() => calculateStreak(records), [records]);
  const socialJetLag = useMemo(() => calculateSocialJetLag(records), [records]);
  const factorImpact = useMemo(() => analyzeFactorImpact(records), [records]);
  const weeklyReport = useMemo(() => getWeeklyReport(records, goals), [records, goals]);
  const debtHistory = useMemo(() => getSleepDebtHistory(records, goals.idealDuration), [records, goals.idealDuration]);

  // Score count-up animation
  useEffect(() => {
    if (stats.sleepScore === 0) return;
    let start = 0;
    const target = stats.sleepScore;
    const duration = 1000;
    const stepTime = 16;
    const steps = duration / stepTime;
    const increment = target / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setAnimatedScore(target);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.round(start));
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [stats.sleepScore]);

  const chartData = useMemo(() => {
    return filteredRecords.map(r => {
      const d = new Date(r.date);
      return {
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        duration: Math.round((r.duration / 60) * 10) / 10,
        quality: r.quality,
        bodyScore: r.bodyScore,
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
        <div className="text-4xl mb-3">{'\uD83D\uDCCA'}</div>
        <p>データがまだありません</p>
        <p className="text-sm mt-1">睡眠記録をつけると統計が表示されます</p>
      </div>
    );
  }

  const { label: scoreLabel, color: scoreColor } = getScoreLabel(stats.sleepScore);
  const { scoreBreakdown } = stats;

  const formatMinutesToTime = (minutes: number) => {
    const norm = minutes >= 24 * 60 ? minutes - 24 * 60 : minutes;
    const h = Math.floor(norm / 60);
    const m = Math.round(norm % 60);
    return `${h}:${String(m).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Streak & Quick Stats */}
      <div className="flex gap-3">
        <div className="glass-card p-4 flex-1 text-center">
          <div className="text-2xl mb-1">{'\uD83D\uDD25'}</div>
          <div className="text-2xl font-bold text-orange-400">{streak}</div>
          <div className="text-[10px] text-gray-500">連続記録日数</div>
        </div>
        <div className="glass-card p-4 flex-1 text-center">
          <div className="text-2xl mb-1">{'\uD83D\uDCDD'}</div>
          <div className="text-2xl font-bold text-purple-400">{records.length}</div>
          <div className="text-[10px] text-gray-500">総記録数</div>
        </div>
        <div className="glass-card p-4 flex-1 text-center">
          <div className="text-2xl mb-1">{weeklyReport.scoreChange >= 0 ? '\u2B06\uFE0F' : '\u2B07\uFE0F'}</div>
          <div className={`text-2xl font-bold ${weeklyReport.scoreChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {weeklyReport.scoreChange >= 0 ? '+' : ''}{weeklyReport.scoreChange}
          </div>
          <div className="text-[10px] text-gray-500">前週比スコア</div>
        </div>
      </div>

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
              {animatedScore}
            </span>
            <span className="text-sm mt-1" style={{ color: scoreColor }}>
              {scoreLabel}
            </span>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="w-full mt-4 space-y-2">
          <ScoreBar label="睡眠時間" value={scoreBreakdown.durationScore} max={30} color="#7c3aed" />
          <ScoreBar label="睡眠品質" value={scoreBreakdown.qualityScore} max={25} color="#6366f1" />
          <ScoreBar label="一貫性" value={scoreBreakdown.consistencyScore} max={20} color="#3b82f6" />
          <ScoreBar label="入眠効率" value={scoreBreakdown.latencyScore} max={15} color="#22c55e" />
          <ScoreBar label="生活習慣" value={scoreBreakdown.lifestyleScore} max={10} color="#f59e0b" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="平均睡眠時間"
          value={formatDuration(Math.round(stats.avgDuration))}
          color={stats.avgDuration >= 420 ? '#22c55e' : stats.avgDuration >= 360 ? '#f59e0b' : '#ef4444'}
          change={weeklyReport.avgDurationChange !== 0 ? `${weeklyReport.avgDurationChange > 0 ? '+' : ''}${Math.round(weeklyReport.avgDurationChange)}分` : undefined}
        />
        <StatCard
          label="平均品質"
          value={`${stats.avgQuality} / 5`}
          color={stats.avgQuality >= 4 ? '#22c55e' : stats.avgQuality >= 3 ? '#f59e0b' : '#ef4444'}
          change={weeklyReport.avgQualityChange !== 0 ? `${weeklyReport.avgQualityChange > 0 ? '+' : ''}${weeklyReport.avgQualityChange}` : undefined}
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

      {/* Social Jet Lag */}
      {socialJetLag && (
        <div className="glass-card p-4">
          <h3 className="text-sm text-gray-400 mb-3">社会的時差ぼけ（平日 vs 休日）</h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xs text-gray-500 mb-1">平日の中間点</div>
              <div className="text-lg font-bold text-blue-400">{formatMinutesToTime(socialJetLag.weekdayMid)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">差</div>
              <div className={`text-lg font-bold ${socialJetLag.diff > 90 ? 'text-red-400' : socialJetLag.diff > 60 ? 'text-yellow-400' : 'text-green-400'}`}>
                {Math.round(socialJetLag.diff)}分
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">休日の中間点</div>
              <div className="text-lg font-bold text-purple-400">{formatMinutesToTime(socialJetLag.weekendMid)}</div>
            </div>
          </div>
          {socialJetLag.diff > 90 && (
            <p className="text-xs text-red-400 mt-2 text-center">
              90分以上の差は体内時計の乱れを引き起こします
            </p>
          )}
        </div>
      )}

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

      {/* Sleep Debt History */}
      {debtHistory.length > 3 && (
        <div className="glass-card p-4">
          <h3 className="text-sm text-gray-400 mb-4">睡眠負債の推移</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={debtHistory.slice(-periodDays)}>
              <defs>
                <linearGradient id="debtGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2a45" />
              <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(v: number) => `${v}h`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1730',
                  border: '1px solid #2d2a45',
                  borderRadius: '0.5rem',
                  color: '#e8e6f0',
                }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [`${value}時間`, '累積睡眠負債']}
              />
              <Area
                type="monotone"
                dataKey="debt"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#debtGrad)"
                dot={{ fill: '#ef4444', r: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Factor Impact Analysis */}
      {factorImpact.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="text-sm text-gray-400 mb-3">要因別 睡眠品質への影響</h3>
          <div className="space-y-3">
            {factorImpact.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-20 text-xs text-gray-400 text-right">{f.factor}</div>
                <div className="flex-1">
                  <div className="flex gap-1 items-center">
                    <div className="flex-1 h-4 bg-[#252240] rounded-full overflow-hidden flex">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(f.withAvg / 5) * 100}%`,
                          backgroundColor: f.impact < 0 ? '#ef4444' : '#22c55e',
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-8">{f.withAvg}</span>
                  </div>
                  <div className="flex gap-1 items-center mt-1">
                    <div className="flex-1 h-4 bg-[#252240] rounded-full overflow-hidden flex">
                      <div
                        className="h-full rounded-full bg-gray-500"
                        style={{ width: `${(f.withoutAvg / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-8">{f.withoutAvg}</span>
                  </div>
                </div>
                <div className={`text-xs font-bold w-12 text-right ${f.impact < 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {f.impact > 0 ? '+' : ''}{f.impact}
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-500">
              <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }} />
              <span>あり</span>
              <span className="inline-block w-3 h-3 rounded-full bg-gray-500 ml-2" />
              <span>なし</span>
            </div>
          </div>
        </div>
      )}

      {/* Export Button */}
      <div className="flex justify-center">
        <button
          onClick={() => downloadCSV(records)}
          className="px-6 py-3 rounded-xl bg-[#252240] text-gray-300 hover:bg-[#2d2a50] transition-all text-sm font-medium flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          CSVエクスポート
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, change }: { label: string; value: string; color: string; change?: string }) {
  return (
    <div className="glass-card p-4 text-center">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-lg font-bold" style={{ color }}>{value}</div>
      {change && (
        <div className={`text-[10px] mt-1 ${change.startsWith('+') ? 'text-green-400' : change.startsWith('-') ? 'text-red-400' : 'text-gray-500'}`}>
          前週比 {change}
        </div>
      )}
    </div>
  );
}

function ScoreBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 text-xs text-gray-400 text-right">{label}</div>
      <div className="flex-1 h-2.5 bg-[#252240] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="w-12 text-xs text-gray-400">{value}/{max}</div>
    </div>
  );
}
