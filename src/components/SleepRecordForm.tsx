'use client';

import { useState, useEffect } from 'react';
import { SleepRecord, SleepFactors, SleepLatency, NightWakings, WakeFeeling, EmotionTag,
  SLEEP_LATENCY_LABELS, NIGHT_WAKINGS_LABELS, WAKE_FEELING_LABELS, WAKE_FEELING_ICONS,
  EMOTION_TAG_LABELS, EMOTION_TAG_ICONS } from '@/types/sleep';
import { calculateDuration, formatDuration, generateId, getQualityLabel } from '@/lib/sleepUtils';

interface Props {
  onSave: (record: SleepRecord) => void;
  editRecord?: SleepRecord | null;
  onCancelEdit?: () => void;
}

const factorLabels: { key: keyof SleepFactors; label: string; icon: string }[] = [
  { key: 'caffeine', label: 'カフェイン', icon: '\u2615' },
  { key: 'exercise', label: '運動', icon: '\uD83C\uDFC3' },
  { key: 'stress', label: 'ストレス', icon: '\uD83D\uDE30' },
  { key: 'screenTime', label: 'スクリーン', icon: '\uD83D\uDCF1' },
  { key: 'alcohol', label: '飲酒', icon: '\uD83C\uDF7A' },
  { key: 'nap', label: '昼寝', icon: '\uD83D\uDE34' },
];

const TOTAL_STEPS = 5;

export default function SleepRecordForm({ onSave, editRecord, onCancelEdit }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const [step, setStep] = useState(1);
  const [date, setDate] = useState(editRecord?.date || today);
  const [bedtime, setBedtime] = useState(editRecord?.bedtime || '23:00');
  const [wakeTime, setWakeTime] = useState(editRecord?.wakeTime || '07:00');
  const [quality, setQuality] = useState(editRecord?.quality || 3);
  const [sleepLatency, setSleepLatency] = useState<SleepLatency>(editRecord?.sleepLatency || '5to15');
  const [nightWakings, setNightWakings] = useState<NightWakings>(editRecord?.nightWakings || '0');
  const [wakeFeeling, setWakeFeeling] = useState<WakeFeeling>(editRecord?.wakeFeeling || 'okay');
  const [napMinutes, setNapMinutes] = useState(editRecord?.napMinutes || 0);
  const [bodyScore, setBodyScore] = useState(editRecord?.bodyScore || 3);
  const [emotionTags, setEmotionTags] = useState<EmotionTag[]>(editRecord?.emotionTags || []);
  const [factors, setFactors] = useState<SleepFactors>(
    editRecord?.factors || {
      caffeine: false,
      exercise: false,
      stress: false,
      screenTime: false,
      alcohol: false,
      nap: false,
    }
  );
  const [memo, setMemo] = useState(editRecord?.memo || '');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (editRecord) {
      setStep(1);
      setDate(editRecord.date);
      setBedtime(editRecord.bedtime);
      setWakeTime(editRecord.wakeTime);
      setQuality(editRecord.quality);
      setSleepLatency(editRecord.sleepLatency);
      setNightWakings(editRecord.nightWakings);
      setWakeFeeling(editRecord.wakeFeeling);
      setNapMinutes(editRecord.napMinutes);
      setBodyScore(editRecord.bodyScore);
      setEmotionTags(editRecord.emotionTags);
      setFactors(editRecord.factors);
      setMemo(editRecord.memo);
    }
  }, [editRecord]);

  const duration = calculateDuration(bedtime, wakeTime);

  const toggleFactor = (key: keyof SleepFactors) => {
    setFactors(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleEmotion = (tag: EmotionTag) => {
    setEmotionTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    const record: SleepRecord = {
      id: editRecord?.id || generateId(),
      date,
      bedtime,
      wakeTime,
      duration,
      quality,
      factors,
      sleepLatency,
      nightWakings,
      wakeFeeling,
      napMinutes,
      bodyScore,
      emotionTags,
      memo,
      createdAt: editRecord?.createdAt || new Date().toISOString(),
    };
    onSave(record);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setStep(1);
    }, 2000);
    if (!editRecord) {
      setQuality(3);
      setSleepLatency('5to15');
      setNightWakings('0');
      setWakeFeeling('okay');
      setNapMinutes(0);
      setBodyScore(3);
      setEmotionTags([]);
      setFactors({
        caffeine: false,
        exercise: false,
        stress: false,
        screenTime: false,
        alcohol: false,
        nap: false,
      });
      setMemo('');
    }
  };

  const nextStep = () => setStep(s => Math.min(s + 1, TOTAL_STEPS));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  return (
    <div className="animate-fade-in">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-400">ステップ {step} / {TOTAL_STEPS}</span>
          {editRecord && (
            <span className="text-xs text-purple-400">編集中</span>
          )}
        </div>
        <div className="h-1.5 bg-[#252240] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1: Date & Time */}
      {step === 1 && (
        <div className="space-y-4 step-animate">
          <div className="glass-card p-4">
            <label className="block text-sm text-gray-400 mb-2">日付</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              max={today}
            />
          </div>

          <div className="glass-card p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">就寝時間</label>
                <input
                  type="time"
                  value={bedtime}
                  onChange={e => setBedtime(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">起床時間</label>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={e => setWakeTime(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-3 text-center">
              <span className="text-2xl font-bold" style={{ color: duration >= 420 ? '#22c55e' : duration >= 360 ? '#f59e0b' : '#ef4444' }}>
                {formatDuration(duration)}
              </span>
              <span className="text-sm text-gray-400 ml-2">の睡眠</span>
            </div>
          </div>

          {/* Sleep Latency */}
          <div className="glass-card p-4">
            <label className="block text-sm text-gray-400 mb-3">寝つくまでの時間</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(SLEEP_LATENCY_LABELS) as SleepLatency[]).map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSleepLatency(key)}
                  className={`py-2.5 px-3 rounded-xl text-sm text-center transition-all duration-200 ${
                    sleepLatency === key
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'bg-[#252240] text-gray-400 hover:bg-[#2d2a50]'
                  }`}
                >
                  {SLEEP_LATENCY_LABELS[key]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Quality & Wakings */}
      {step === 2 && (
        <div className="space-y-4 step-animate">
          <div className="glass-card p-4">
            <label className="block text-sm text-gray-400 mb-3">睡眠の質</label>
            <div className="flex justify-between items-center gap-2">
              {[1, 2, 3, 4, 5].map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuality(q)}
                  className={`flex-1 py-3 rounded-xl text-center transition-all duration-200 ${
                    quality === q
                      ? 'bg-purple-600 text-white scale-105 shadow-lg shadow-purple-600/30'
                      : 'bg-[#252240] text-gray-400 hover:bg-[#2d2a50]'
                  }`}
                >
                  <div className="text-lg font-bold">{q}</div>
                  <div className="text-[10px] mt-1">{getQualityLabel(q)}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-4">
            <label className="block text-sm text-gray-400 mb-3">中途覚醒回数</label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(NIGHT_WAKINGS_LABELS) as NightWakings[]).map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setNightWakings(key)}
                  className={`py-2.5 rounded-xl text-sm text-center transition-all duration-200 ${
                    nightWakings === key
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'bg-[#252240] text-gray-400 hover:bg-[#2d2a50]'
                  }`}
                >
                  {NIGHT_WAKINGS_LABELS[key]}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-4">
            <label className="block text-sm text-gray-400 mb-3">起床時の気分</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(WAKE_FEELING_LABELS) as WakeFeeling[]).map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setWakeFeeling(key)}
                  className={`py-3 px-3 rounded-xl text-center transition-all duration-200 ${
                    wakeFeeling === key
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'bg-[#252240] text-gray-400 hover:bg-[#2d2a50]'
                  }`}
                >
                  <span className="text-lg mr-1">{WAKE_FEELING_ICONS[key]}</span>
                  <span className="text-sm">{WAKE_FEELING_LABELS[key]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Body & Emotions */}
      {step === 3 && (
        <div className="space-y-4 step-animate">
          <div className="glass-card p-4">
            <label className="block text-sm text-gray-400 mb-3">
              体調スコア: <span className="text-purple-400 font-bold">{bodyScore}</span>
            </label>
            <div className="flex justify-between items-center gap-2">
              {[1, 2, 3, 4, 5].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setBodyScore(s)}
                  className={`flex-1 py-3 rounded-xl text-center transition-all duration-200 ${
                    bodyScore === s
                      ? 'bg-indigo-600 text-white scale-105 shadow-lg shadow-indigo-600/30'
                      : 'bg-[#252240] text-gray-400 hover:bg-[#2d2a50]'
                  }`}
                >
                  <div className="text-lg font-bold">{s}</div>
                  <div className="text-[10px] mt-1">{['', '悪い', 'やや悪い', '普通', '良い', 'とても良い'][s]}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-4">
            <label className="block text-sm text-gray-400 mb-3">気分・感情（複数選択可）</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(EMOTION_TAG_LABELS) as EmotionTag[]).map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleEmotion(tag)}
                  className={`py-2.5 px-3 rounded-xl text-center transition-all duration-200 flex items-center justify-center gap-1 ${
                    emotionTags.includes(tag)
                      ? 'bg-purple-600/30 border-purple-500 border text-purple-300'
                      : 'bg-[#252240] border border-transparent text-gray-400 hover:bg-[#2d2a50]'
                  }`}
                >
                  <span>{EMOTION_TAG_ICONS[tag]}</span>
                  <span className="text-sm">{EMOTION_TAG_LABELS[tag]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-4">
            <label className="block text-sm text-gray-400 mb-2">
              昼寝: <span className="text-purple-400 font-bold">{napMinutes > 0 ? `${napMinutes}分` : 'なし'}</span>
            </label>
            <input
              type="range"
              min={0}
              max={120}
              step={5}
              value={napMinutes}
              onChange={e => setNapMinutes(parseInt(e.target.value))}
              className="w-full accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-600">
              <span>なし</span>
              <span>30分</span>
              <span>1時間</span>
              <span>2時間</span>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Factors */}
      {step === 4 && (
        <div className="space-y-4 step-animate">
          <div className="glass-card p-4">
            <label className="block text-sm text-gray-400 mb-3">睡眠に影響した要因</label>
            <div className="grid grid-cols-3 gap-2">
              {factorLabels.map(({ key, label, icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleFactor(key)}
                  className={`py-3 px-2 rounded-xl text-center transition-all duration-200 ${
                    factors[key]
                      ? 'bg-purple-600/30 border-purple-500 border text-purple-300'
                      : 'bg-[#252240] border border-transparent text-gray-400 hover:bg-[#2d2a50]'
                  }`}
                >
                  <div className="text-xl">{icon}</div>
                  <div className="text-xs mt-1">{label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-4">
            <label className="block text-sm text-gray-400 mb-2">メモ</label>
            <textarea
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="今日の睡眠について..."
              rows={3}
              className="resize-none"
            />
          </div>
        </div>
      )}

      {/* Step 5: Confirm */}
      {step === 5 && (
        <div className="space-y-4 step-animate">
          <div className="glass-card p-4">
            <h3 className="text-sm text-gray-400 mb-3 text-center">記録の確認</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-[#2d2a45]">
                <span className="text-sm text-gray-400">日付</span>
                <span className="text-sm font-medium text-gray-200">{date}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#2d2a45]">
                <span className="text-sm text-gray-400">就寝 → 起床</span>
                <span className="text-sm font-medium text-gray-200">{bedtime} → {wakeTime}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#2d2a45]">
                <span className="text-sm text-gray-400">睡眠時間</span>
                <span className="text-sm font-bold" style={{ color: duration >= 420 ? '#22c55e' : duration >= 360 ? '#f59e0b' : '#ef4444' }}>
                  {formatDuration(duration)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#2d2a45]">
                <span className="text-sm text-gray-400">睡眠品質</span>
                <span className="text-sm font-medium text-gray-200">{quality} / 5 ({getQualityLabel(quality)})</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#2d2a45]">
                <span className="text-sm text-gray-400">入眠潜時</span>
                <span className="text-sm font-medium text-gray-200">{SLEEP_LATENCY_LABELS[sleepLatency]}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#2d2a45]">
                <span className="text-sm text-gray-400">中途覚醒</span>
                <span className="text-sm font-medium text-gray-200">{NIGHT_WAKINGS_LABELS[nightWakings]}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#2d2a45]">
                <span className="text-sm text-gray-400">起床時の気分</span>
                <span className="text-sm font-medium text-gray-200">{WAKE_FEELING_ICONS[wakeFeeling]} {WAKE_FEELING_LABELS[wakeFeeling]}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#2d2a45]">
                <span className="text-sm text-gray-400">体調</span>
                <span className="text-sm font-medium text-gray-200">{bodyScore} / 5</span>
              </div>
              {napMinutes > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-[#2d2a45]">
                  <span className="text-sm text-gray-400">昼寝</span>
                  <span className="text-sm font-medium text-gray-200">{napMinutes}分</span>
                </div>
              )}
              {emotionTags.length > 0 && (
                <div className="py-2 border-b border-[#2d2a45]">
                  <span className="text-sm text-gray-400 block mb-1">感情</span>
                  <div className="flex flex-wrap gap-1">
                    {emotionTags.map(t => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-purple-900/40 text-purple-300">
                        {EMOTION_TAG_ICONS[t]} {EMOTION_TAG_LABELS[t]}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {memo && (
                <div className="py-2">
                  <span className="text-sm text-gray-400 block mb-1">メモ</span>
                  <p className="text-sm text-gray-300">{memo}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-3 mt-6">
        {editRecord && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="py-3 px-4 rounded-xl bg-gray-700 text-gray-300 font-bold transition-all hover:bg-gray-600 text-sm"
          >
            キャンセル
          </button>
        )}
        {step > 1 && (
          <button
            type="button"
            onClick={prevStep}
            className="flex-1 py-3 rounded-xl bg-[#252240] text-gray-300 font-bold transition-all hover:bg-[#2d2a50]"
          >
            戻る
          </button>
        )}
        {step < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={nextStep}
            className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all active:scale-95"
          >
            次へ
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            className={`flex-1 py-3 rounded-xl font-bold text-white transition-all duration-300 ${
              saved
                ? 'bg-green-600 scale-95'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95'
            }`}
          >
            {saved ? '\u4FDD\u5B58\u3057\u307E\u3057\u305F \u2713' : editRecord ? '\u66F4\u65B0\u3059\u308B' : '\u8A18\u9332\u3059\u308B'}
          </button>
        )}
      </div>
    </div>
  );
}
