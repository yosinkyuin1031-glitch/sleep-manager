'use client';

import { useState, useEffect, useCallback } from 'react';
import { SleepRecord, SleepGoal, TabType } from '@/types/sleep';
import { getRecords, saveRecord, deleteRecord, getGoals, saveGoals } from '@/lib/storage';
import SleepRecordForm from '@/components/SleepRecordForm';
import SleepHistory from '@/components/SleepHistory';
import Dashboard from '@/components/Dashboard';
import AdvicePanel from '@/components/AdvicePanel';
import GoalSettings from '@/components/GoalSettings';

const tabs: { key: TabType; label: string; icon: string }[] = [
  { key: 'record', label: '記録', icon: '📝' },
  { key: 'dashboard', label: '統計', icon: '📊' },
  { key: 'advice', label: 'アドバイス', icon: '💡' },
  { key: 'goals', label: '目標', icon: '🎯' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('record');
  const [records, setRecords] = useState<SleepRecord[]>([]);
  const [goals, setGoals] = useState<SleepGoal | null>(null);
  const [editRecord, setEditRecord] = useState<SleepRecord | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setRecords(getRecords());
    setGoals(getGoals());
    setMounted(true);
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

  if (!mounted || !goals) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🌙</div>
          <p className="text-gray-400">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-x-0 border-t-0 rounded-none px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌙</span>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                スリープマネージャー
              </h1>
              <p className="text-[10px] text-gray-500">睡眠の質を高めるパートナー</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">記録数</div>
            <div className="text-lg font-bold text-purple-400">{records.length}</div>
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
            <SleepHistory
              records={records}
              onEdit={handleEditRecord}
              onDelete={handleDeleteRecord}
            />
          </div>
        )}

        {activeTab === 'dashboard' && (
          <Dashboard records={records} goals={goals} />
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
              <span className={`text-xl transition-transform duration-200 ${
                activeTab === tab.key ? 'scale-110' : ''
              }`}>
                {tab.icon}
              </span>
              <span className={`text-[10px] font-medium ${
                activeTab === tab.key ? 'text-purple-400' : ''
              }`}>
                {tab.label}
              </span>
              {activeTab === tab.key && (
                <div className="absolute bottom-0 w-12 h-0.5 bg-purple-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
