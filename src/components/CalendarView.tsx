'use client';

import { useState, useMemo } from 'react';
import { SleepRecord, WAKE_FEELING_ICONS } from '@/types/sleep';
import { formatDuration, getQualityLabel } from '@/lib/sleepUtils';

interface Props {
  records: SleepRecord[];
  onSelectRecord: (record: SleepRecord) => void;
}

export default function CalendarView({ records, onSelectRecord }: Props) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const recordMap = useMemo(() => {
    const map = new Map<string, SleepRecord>();
    records.forEach(r => map.set(r.date, r));
    return map;
  }, [records]);

  const calendarDays = useMemo(() => {
    const { year, month } = currentMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay(); // 0=Sun
    const totalDays = lastDay.getDate();

    const days: (number | null)[] = [];
    for (let i = 0; i < startPad; i++) days.push(null);
    for (let d = 1; d <= totalDays; d++) days.push(d);
    // Pad to complete last row
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [currentMonth]);

  const prevMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { ...prev, month: prev.month - 1 };
    });
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { ...prev, month: prev.month + 1 };
    });
    setSelectedDate(null);
  };

  const getDateStr = (day: number) => {
    const { year, month } = currentMonth;
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getDayColor = (record: SleepRecord | undefined) => {
    if (!record) return '';
    if (record.quality >= 4) return 'bg-green-600/30 border-green-500/50';
    if (record.quality >= 3) return 'bg-blue-600/20 border-blue-500/40';
    if (record.quality >= 2) return 'bg-yellow-600/20 border-yellow-500/40';
    return 'bg-red-600/20 border-red-500/40';
  };

  const selectedRecord = selectedDate ? recordMap.get(selectedDate) : null;
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

  // Monthly stats
  const monthRecords = useMemo(() => {
    const { year, month } = currentMonth;
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return records.filter(r => r.date.startsWith(prefix));
  }, [records, currentMonth]);

  const monthStats = useMemo(() => {
    if (monthRecords.length === 0) return null;
    const avgDuration = monthRecords.reduce((s, r) => s + r.duration, 0) / monthRecords.length;
    const avgQuality = monthRecords.reduce((s, r) => s + r.quality, 0) / monthRecords.length;
    return { avgDuration, avgQuality: Math.round(avgQuality * 10) / 10, count: monthRecords.length };
  }, [monthRecords]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Month navigation */}
      <div className="glass-card p-4">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-[#252240] text-gray-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-lg font-bold text-gray-200">
            {currentMonth.year}年 {monthNames[currentMonth.month]}
          </h3>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-[#252240] text-gray-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayNames.map((d, i) => (
            <div key={d} className={`text-center text-xs py-1 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'}`}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} className="aspect-square" />;
            }
            const dateStr = getDateStr(day);
            const record = recordMap.get(dateStr);
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            const isSelected = dateStr === selectedDate;
            const dayOfWeek = (i % 7);

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                className={`aspect-square rounded-lg text-center text-sm transition-all duration-200 border relative
                  ${record ? getDayColor(record) : 'border-transparent'}
                  ${isSelected ? 'ring-2 ring-purple-500 scale-105' : ''}
                  ${isToday ? 'ring-1 ring-purple-400/50' : ''}
                  ${!record ? 'hover:bg-[#252240]' : 'hover:scale-105'}
                  ${dayOfWeek === 0 ? 'text-red-400' : dayOfWeek === 6 ? 'text-blue-400' : 'text-gray-300'}
                `}
              >
                <span className="text-xs">{day}</span>
                {record && (
                  <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Monthly Stats */}
      {monthStats && (
        <div className="glass-card p-4">
          <h4 className="text-sm text-gray-400 mb-2">月間サマリー</h4>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-xs text-gray-500">記録日数</div>
              <div className="text-lg font-bold text-purple-400">{monthStats.count}日</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">平均睡眠</div>
              <div className="text-lg font-bold text-indigo-400">{formatDuration(Math.round(monthStats.avgDuration))}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">平均品質</div>
              <div className="text-lg font-bold text-blue-400">{monthStats.avgQuality}/5</div>
            </div>
          </div>
        </div>
      )}

      {/* Selected date detail */}
      {selectedDate && (
        <div className="glass-card p-4 animate-slide-up">
          {selectedRecord ? (
            <div>
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-sm font-bold text-gray-300">{selectedDate} の記録</h4>
                <button
                  onClick={() => onSelectRecord(selectedRecord)}
                  className="text-xs px-3 py-1 rounded-lg bg-purple-600/30 text-purple-300 hover:bg-purple-600/50 transition-colors"
                >
                  編集
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">睡眠時間: </span>
                  <span className="text-gray-300 font-medium">{formatDuration(selectedRecord.duration)}</span>
                </div>
                <div>
                  <span className="text-gray-500">品質: </span>
                  <span className="text-gray-300 font-medium">{getQualityLabel(selectedRecord.quality)}</span>
                </div>
                <div>
                  <span className="text-gray-500">就寝: </span>
                  <span className="text-gray-300">{selectedRecord.bedtime}</span>
                </div>
                <div>
                  <span className="text-gray-500">起床: </span>
                  <span className="text-gray-300">{selectedRecord.wakeTime}</span>
                </div>
                <div>
                  <span className="text-gray-500">気分: </span>
                  <span className="text-gray-300">{WAKE_FEELING_ICONS[selectedRecord.wakeFeeling]}</span>
                </div>
                <div>
                  <span className="text-gray-500">体調: </span>
                  <span className="text-gray-300">{selectedRecord.bodyScore}/5</span>
                </div>
              </div>
              {selectedRecord.memo && (
                <p className="text-xs text-gray-500 mt-2">{selectedRecord.memo}</p>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <p className="text-sm">{selectedDate} の記録はありません</p>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex justify-center gap-4 text-[10px] text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-600/30 border border-green-500/50" /> 良い(4-5)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-blue-600/20 border border-blue-500/40" /> 普通(3)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-yellow-600/20 border border-yellow-500/40" /> 注意(2)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-600/20 border border-red-500/40" /> 悪い(1)
        </span>
      </div>
    </div>
  );
}
