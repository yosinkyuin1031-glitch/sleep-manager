'use client';

import { useState } from 'react';
import { SleepRecord, SleepGoal } from '@/types/sleep';
import { downloadCSV } from '@/lib/exportUtils';
import { generateSleepReport } from '@/lib/pdfExport';

interface Props {
  records: SleepRecord[];
  goals: SleepGoal;
}

export default function ExportPanel({ records, goals }: Props) {
  const [patientName, setPatientName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  const handlePdfExport = () => {
    if (records.length === 0) return;
    generateSleepReport(records, goals, patientName || undefined);
  };

  const handleCsvExport = () => {
    if (records.length === 0) return;
    downloadCSV(records);
  };

  return (
    <div className="glass-card p-4">
      <h3 className="text-sm text-gray-400 mb-3">データエクスポート</h3>

      {showNameInput && (
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">患者名（PDF用・任意）</label>
          <input
            type="text"
            value={patientName}
            onChange={e => setPatientName(e.target.value)}
            placeholder="例: 山田太郎"
            className="w-full text-sm"
          />
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => {
            if (!showNameInput) {
              setShowNameInput(true);
              return;
            }
            handlePdfExport();
          }}
          disabled={records.length === 0}
          className="flex-1 py-3 rounded-xl bg-red-600/20 text-red-300 hover:bg-red-600/30 transition-all text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          PDF
        </button>
        <button
          onClick={handleCsvExport}
          disabled={records.length === 0}
          className="flex-1 py-3 rounded-xl bg-green-600/20 text-green-300 hover:bg-green-600/30 transition-all text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          CSV
        </button>
      </div>

      {records.length === 0 && (
        <p className="text-xs text-gray-600 text-center mt-2">記録がありません</p>
      )}
    </div>
  );
}
