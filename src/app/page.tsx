'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { SleepRecord, SleepGoal, TabType } from '@/types/sleep';
import { getRecords, saveRecord, deleteRecord, getGoals, saveGoals, calculateStreak, getReminder } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/LoginForm';
import SleepRecordForm from '@/components/SleepRecordForm';
import SleepHistory from '@/components/SleepHistory';
import Dashboard from '@/components/Dashboard';
import AdvicePanel from '@/components/AdvicePanel';
import GoalSettings from '@/components/GoalSettings';
import CalendarView from '@/components/CalendarView';

const tabs: { key: TabType; label: string; icon: string }[] = [
  { key: 'record', label: '記録', icon: '\uD83D\uDCDD' },
  { key: 'dashboard', label: '統計', icon: '\uD83D\uDCCA' },
  { key: 'calendar', label: 'カレンダー', icon: '\uD83D\uDCC5' },
  { key: 'advice', label: 'アドバイス', icon: '\uD83D\uDCA1' },
  { key: 'goals', label: '目標', icon: '\uD83C\uDFAF' },
];

export default function Home() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('record');
  const [records, setRecords] = useState<SleepRecord[]>([]);
  const [goals, setGoals] = useState<SleepGoal | null>(null);
  const [editRecord, setEditRecord] = useState<SleepRecord | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showReminder, setShowReminder] = useState(false);

  const streak = useMemo(() => calculateStreak(records), [records]);

  useEffect(() => {
    setRecords(getRecords());
    setGoals(getGoals());
    setMounted(true);

    // Check reminder
    const reminder = getReminder();
    if (reminder.enabled) {
      const now = new Date();
      const [rh, rm] = reminder.time.split(':').map(Number);
      const reminderMinutes = rh * 60 + rm;
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      // Show reminder if within 30 minutes of the set time
      if (Math.abs(nowMinutes - reminderMinutes) <= 30) {
        setShowReminder(true);
      }
    }
  }, []);

  const handleSaveRecord = useCallback((record: SleepRecord) => {
    saveRecord(record);
    setRecords(getRecords());
    setEditRecord(null);
  }, []);

  const handleDeleteRecord = useCallback((id: string) => {
    deleteRecord(id);
    setRecords(getRecords());
  }, []);

  const handleEditRecord = useCallback((record: SleepRecord) => {
    setEditRecord(record);
    setActiveTab('record');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSaveGoals = useCallback((newGoals: SleepGoal) => {
    saveGoals(newGoals);
    setGoals(newGoals);
  }, []);

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">{'\uD83C\uDF19'}</div>
          <p className="text-gray-400">認証確認中...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show login
  if (!user) {
    return <LoginForm />;
  }

  if (!mounted || !goals) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">{'\uD83C\uDF19'}</div>
          <p className="text-gray-400">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Reminder Banner */}
      {showReminder && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-indigo-900/95 to-purple-900/95 backdrop-blur-md px-4 py-3 animate-slide-up">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{'\uD83C\uDF19'}</span>
              <div>
                <p className="text-sm font-bold text-purple-200">おやすみの時間です</p>
                <p className="text-xs text-purple-300/70">そろそろ就寝準備を始めましょう</p>
              </div>
            </div>
            <button
              onClick={() => setShowReminder(false)}
              className="text-purple-300/70 hover:text-white transition-colors p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-x-0 border-t-0 rounded-none px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{'\uD83C\uDF19'}</span>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                スリープマネージャー
              </h1>
              <p className="text-[10px] text-gray-500">睡眠の質を高めるパートナー</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {streak > 0 && (
              <div className="text-center">
                <div className="text-xs text-gray-500">{'\uD83D\uDD25'}</div>
                <div className="text-sm font-bold text-orange-400">{streak}日</div>
              </div>
            )}
            <div className="text-right">
              <div className="text-xs text-gray-500">記録数</div>
              <div className="text-lg font-bold text-purple-400">{records.length}</div>
            </div>
            <button
              onClick={signOut}
              className="p-2 rounded-lg hover:bg-[#252240] text-gray-500 hover:text-gray-300 transition-colors"
              title="ログアウト"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {activeTab === 'record' && (
          <div>
            <SleepRecordForm
              onSave={handleSaveRecord}
              editRecord={editRecord}
              onCancelEdit={() => setEditRecord(null)}
            />
            <div className="mt-6">
              <SleepHistory
                records={records}
                onEdit={handleEditRecord}
                onDelete={handleDeleteRecord}
              />
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <Dashboard records={records} goals={goals} />
        )}

        {activeTab === 'calendar' && (
          <CalendarView records={records} onSelectRecord={handleEditRecord} />
        )}

        {activeTab === 'advice' && (
          <AdvicePanel records={records} goals={goals} />
        )}

        {activeTab === 'goals' && (
          <GoalSettings
            goals={goals}
            records={records}
            onSave={handleSaveGoals}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-x-0 border-b-0 rounded-none">
        <div className="max-w-lg mx-auto flex">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 flex flex-col items-center gap-1 transition-all duration-200 relative ${
                activeTab === tab.key
                  ? 'text-purple-400'
                  : 'text-gray-500 hover:text-gray-400'
              }`}
            >
              <span className={`text-lg transition-transform duration-200 ${
                activeTab === tab.key ? 'scale-110' : ''
              }`}>
                {tab.icon}
              </span>
              <span className={`text-[9px] font-medium ${
                activeTab === tab.key ? 'text-purple-400' : ''
              }`}>
                {tab.label}
              </span>
              {activeTab === tab.key && (
                <div className="absolute bottom-0 w-10 h-0.5 bg-purple-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
