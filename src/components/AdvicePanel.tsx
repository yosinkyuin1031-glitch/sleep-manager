'use client';

import { useState } from 'react';
import { SleepRecord, SleepGoal } from '@/types/sleep';
import { generateAdvice, calculateStats, getScoreLabel, generateWeeklyPlan } from '@/lib/sleepUtils';

interface Props {
  records: SleepRecord[];
  goals: SleepGoal;
}

const tipIcons: Record<string, string> = {
  '\u7761\u7720\u6642\u9593': '\u23F0',
  '\u30AB\u30D5\u30A7\u30A4\u30F3': '\u2615',
  '\u30B9\u30AF\u30EA\u30FC\u30F3': '\uD83D\uDCF1',
  '\u30B9\u30C8\u30EC\u30B9': '\uD83E\uDDD8',
  '\u98F2\u9152': '\uD83C\uDF7A',
  '\u904B\u52D5': '\uD83C\uDFC3',
  '\u7761\u7720\u8CA0\u50B5': '\uD83D\uDCA4',
  '\u5C31\u5BDD\u6642\u9593': '\uD83C\uDF19',
  '\u4E00\u8CAB\u6027': '\uD83D\uDCC5',
  '\u54C1\u8CEA': '\u2728',
  '\u7D20\u6674\u3089\u3057\u3044': '\uD83C\uDF89',
  '\u8A18\u9332': '\uD83D\uDCDD',
  '\u5BDD\u3064\u304D': '\uD83D\uDECF\uFE0F',
  '\u899A\u9192': '\u26A1',
  '\u4F53\u8ABF': '\uD83D\uDC9A',
  '\u4E0D\u5B89': '\uD83E\uDDD8',
  '\u793E\u4F1A\u7684': '\u23F1\uFE0F',
  '\u6574\u4F53': '\uD83E\uDDB4',
  '\u30C4\u30DC': '\uD83D\uDC46',
  '\u767E\u4F1A': '\uD83D\uDC46',
  '\u795E\u9580': '\uD83D\uDC46',
};

function getAdviceIcon(text: string): string {
  for (const [keyword, icon] of Object.entries(tipIcons)) {
    if (text.includes(keyword)) return icon;
  }
  return '\uD83D\uDCA1';
}

type AdviceTab = 'personal' | 'plan' | 'checklist' | 'bodywork';

export default function AdvicePanel({ records, goals }: Props) {
  const [tab, setTab] = useState<AdviceTab>('personal');
  const advice = generateAdvice(records, goals);
  const stats = calculateStats(records, goals);
  const plan = generateWeeklyPlan(records, goals);
  const { label: scoreLabel, color: scoreColor } = getScoreLabel(stats.sleepScore);

  const tabs: { key: AdviceTab; label: string }[] = [
    { key: 'personal', label: '\u30A2\u30C9\u30D0\u30A4\u30B9' },
    { key: 'plan', label: '\u6539\u5584\u30D7\u30E9\u30F3' },
    { key: 'checklist', label: '\u7761\u7720\u885B\u751F' },
    { key: 'bodywork', label: '\u6574\u4F53\u30FB\u30C4\u30DC' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary card */}
      {records.length > 0 && (
        <div className="glass-card p-6 text-center">
          <h3 className="text-sm text-gray-400 mb-2">あなたの睡眠評価</h3>
          <div className="text-3xl font-bold mb-1" style={{ color: scoreColor }}>
            {scoreLabel}
          </div>
          <p className="text-sm text-gray-500">
            直近{Math.min(records.length, 7)}日間のデータに基づく分析
          </p>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-1 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
              tab === t.key
                ? 'bg-purple-600 text-white'
                : 'bg-[#252240] text-gray-400 hover:bg-[#2d2a50]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Personal Advice */}
      {tab === 'personal' && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gray-300 px-1">パーソナルアドバイス</h3>
          {advice.map((text, i) => (
            <div
              key={i}
              className="glass-card p-4 animate-slide-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex gap-3">
                <div className="text-2xl flex-shrink-0 mt-1">
                  {getAdviceIcon(text)}
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{text}</p>
              </div>
            </div>
          ))}

          {/* Morning Report */}
          {records.length > 0 && (
            <MorningReport record={records.sort((a, b) => b.date.localeCompare(a.date))[0]} />
          )}
        </div>
      )}

      {/* Weekly Improvement Plan */}
      {tab === 'plan' && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gray-300 px-1">1週間の改善プラン</h3>
          {plan.length > 0 ? (
            plan.map((text, i) => (
              <div key={i} className="glass-card p-4 animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-purple-600/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-purple-300">{i + 1}</span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{text}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="glass-card p-4 text-center text-gray-400">
              <p className="text-sm">3日以上の記録が必要です</p>
            </div>
          )}
        </div>
      )}

      {/* Sleep Hygiene Checklist */}
      {tab === 'checklist' && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gray-300 px-1">
            睡眠衛生チェックリスト
          </h3>
          <p className="text-xs text-gray-500 px-1">厚生労働省「睡眠対策」ベース</p>
          {sleepHygieneChecklist.map((item, i) => (
            <ChecklistItem key={i} item={item} index={i} />
          ))}
        </div>
      )}

      {/* Bodywork / Acupressure */}
      {tab === 'bodywork' && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gray-300 px-1">整体・鍼灸で睡眠改善</h3>
          <p className="text-xs text-gray-500 px-1">睡眠に効くツボ・ストレッチ</p>
          {bodyworkTips.map((tip, i) => (
            <div
              key={i}
              className="glass-card p-4 animate-slide-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex gap-3">
                <div className="text-2xl flex-shrink-0">{tip.icon}</div>
                <div>
                  <h4 className="text-sm font-bold text-purple-300 mb-1">{tip.title}</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">{tip.description}</p>
                  {tip.howTo && (
                    <div className="mt-2 p-2 rounded-lg bg-[#252240]">
                      <p className="text-xs text-indigo-300 leading-relaxed">{tip.howTo}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MorningReport({ record }: { record: SleepRecord }) {
  const d = new Date(record.date);
  const days = ['\u65E5', '\u6708', '\u706B', '\u6C34', '\u6728', '\u91D1', '\u571F'];
  const dateStr = `${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]})`;

  return (
    <div className="glass-card p-4 border-l-4 border-l-indigo-500">
      <h4 className="text-sm font-bold text-indigo-300 mb-2">
        {'\u2600\uFE0F'} モーニングレポート - {dateStr}
      </h4>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-500">睡眠時間: </span>
          <span className="text-gray-300 font-medium">
            {Math.floor(record.duration / 60)}h{record.duration % 60}m
          </span>
        </div>
        <div>
          <span className="text-gray-500">品質: </span>
          <span className="text-gray-300 font-medium">{record.quality}/5</span>
        </div>
        <div>
          <span className="text-gray-500">入眠: </span>
          <span className="text-gray-300 font-medium">{record.bedtime}</span>
        </div>
        <div>
          <span className="text-gray-500">起床: </span>
          <span className="text-gray-300 font-medium">{record.wakeTime}</span>
        </div>
      </div>
    </div>
  );
}

function ChecklistItem({ item, index }: { item: typeof sleepHygieneChecklist[number]; index: number }) {
  const [checked, setChecked] = useState(false);
  return (
    <div
      className={`glass-card p-4 animate-slide-up cursor-pointer transition-all ${checked ? 'border-green-500/30' : ''}`}
      style={{ animationDelay: `${index * 80}ms` }}
      onClick={() => setChecked(!checked)}
    >
      <div className="flex gap-3 items-start">
        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
          checked ? 'bg-green-600 border-green-600' : 'border-gray-500'
        }`}>
          {checked && <span className="text-white text-xs">{'\u2713'}</span>}
        </div>
        <div>
          <h4 className={`text-sm font-bold mb-1 transition-colors ${checked ? 'text-green-300' : 'text-gray-300'}`}>
            {item.title}
          </h4>
          <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
        </div>
      </div>
    </div>
  );
}

const sleepHygieneChecklist = [
  {
    title: '\u5FC5\u8981\u306A\u7761\u7720\u6642\u9593\u306F\u4EBA\u305D\u308C\u305E\u308C',
    description: '8\u6642\u9593\u306B\u3053\u3060\u308F\u3089\u305A\u3001\u65E5\u4E2D\u306E\u7720\u6C17\u3067\u56F0\u3089\u306A\u3051\u308C\u3070\u5341\u5206\u3067\u3059\u3002\u5E74\u9F62\u3068\u3068\u3082\u306B\u5FC5\u8981\u306A\u7761\u7720\u6642\u9593\u306F\u77ED\u304F\u306A\u308A\u307E\u3059\u3002',
  },
  {
    title: '\u523A\u6FC0\u7269\u3092\u907F\u3051\u3001\u5BC4\u308B\u524D\u306B\u30EA\u30E9\u30C3\u30AF\u30B9',
    description: '\u30AB\u30D5\u30A7\u30A4\u30F3\u306F\u5348\u5F8C2\u6642\u307E\u3067\u3002\u8EFD\u3044\u8AAD\u66F8\u3001\u97F3\u697D\u3001\u306C\u308B\u3081\u306E\u304A\u98A8\u5442\u3067\u30EA\u30E9\u30C3\u30AF\u30B9\u3002',
  },
  {
    title: '\u898F\u5247\u6B63\u3057\u3044\u751F\u6D3B\u30EA\u30BA\u30E0\u3092\u5B88\u308B',
    description: '\u6BCE\u65E5\u540C\u3058\u6642\u523B\u306B\u8D77\u304D\u308B\u3053\u3068\u304C\u3001\u4F53\u5185\u6642\u8A08\u3092\u6574\u3048\u308B\u6700\u3082\u52B9\u679C\u7684\u306A\u65B9\u6CD5\u3067\u3059\u3002',
  },
  {
    title: '\u5149\u306E\u5229\u7528\u3092\u4E0A\u624B\u306B',
    description: '\u671D\u306F\u660E\u308B\u3044\u5149\u3092\u6D74\u3073\u3001\u591C\u306F\u6697\u304F\u3057\u3066\u4F53\u5185\u6642\u8A08\u3092\u8ABF\u6574\u3057\u307E\u3057\u3087\u3046\u3002',
  },
  {
    title: '\u5BDD\u5BA4\u306F\u5FEB\u9069\u306A\u74B0\u5883\u306B',
    description: '\u5BA4\u6E2918\u301C22\u2103\u3001\u6E7F\u5EA650\u301C60%\u3001\u906E\u5149\u3067\u6697\u304F\u3001\u9759\u304B\u306A\u74B0\u5883\u3092\u4F5C\u308A\u307E\u3057\u3087\u3046\u3002',
  },
  {
    title: '\u5C31\u5BDD\u524D\u306E\u30A2\u30EB\u30B3\u30FC\u30EB\u306F\u63A7\u3048\u308B',
    description: '\u30A2\u30EB\u30B3\u30FC\u30EB\u306F\u5165\u7720\u3092\u4FC3\u3057\u307E\u3059\u304C\u3001\u7761\u7720\u5F8C\u534A\u306E\u8CEA\u3092\u4E0B\u3052\u3001\u4E2D\u9014\u899A\u9192\u3092\u5897\u3084\u3057\u307E\u3059\u3002',
  },
  {
    title: '\u9069\u5EA6\u306A\u904B\u52D5\u3092\u7FD2\u6163\u306B',
    description: '\u65E5\u4E2D\u306E\u904B\u52D5\u306F\u6DF1\u3044\u7761\u7720\u3092\u4FC3\u9032\u3057\u307E\u3059\u3002\u305F\u3060\u3057\u5C31\u5BDD3\u6642\u9593\u524D\u307E\u3067\u306B\u7D42\u308F\u3089\u305B\u307E\u3057\u3087\u3046\u3002',
  },
  {
    title: '\u5BDD\u308B\u305F\u3081\u3060\u3051\u306B\u5BDD\u5BA4\u3092\u4F7F\u3046',
    description: '\u5BDD\u5BA4\u3067\u306E\u4ED5\u4E8B\u3084\u30B9\u30DE\u30DB\u306F\u907F\u3051\u3001\u300C\u5BDD\u5BA4=\u7761\u7720\u300D\u306E\u9023\u60F3\u3092\u4F5C\u308A\u307E\u3057\u3087\u3046\u3002',
  },
  {
    title: '\u7720\u304F\u306A\u3063\u3066\u304B\u3089\u5E03\u56E3\u306B\u5165\u308B',
    description: '\u7720\u304F\u306A\u3044\u306E\u306B\u7121\u7406\u306B\u5BDD\u3088\u3046\u3068\u3059\u308B\u3068\u9006\u52B9\u679C\u3002\u7720\u304F\u306A\u308B\u307E\u3067\u5225\u306E\u3053\u3068\u3092\u3057\u307E\u3057\u3087\u3046\u3002',
  },
  {
    title: '\u663C\u5BDD\u306F\u77ED\u3081\u306B',
    description: '\u663C\u5BDD\u306F15\u301C20\u5206\u4EE5\u5185\u306B\u3002\u5348\u5F8C3\u6642\u4EE5\u964D\u306E\u663C\u5BDD\u306F\u591C\u306E\u7761\u7720\u306B\u5F71\u97FF\u3057\u307E\u3059\u3002',
  },
  {
    title: '\u5C31\u5BDD\u524D\u306E\u91CD\u3044\u98DF\u4E8B\u3092\u907F\u3051\u308B',
    description: '\u5C31\u5BDD2\u301C3\u6642\u9593\u524D\u307E\u3067\u306B\u5915\u98DF\u3092\u6E08\u307E\u305B\u307E\u3057\u3087\u3046\u3002\u7A7A\u8179\u6642\u306F\u6E29\u304B\u3044\u30DF\u30EB\u30AF\u304C\u304A\u3059\u3059\u3081\u3002',
  },
  {
    title: '\u7761\u7720\u306B\u4E0D\u5B89\u3092\u611F\u3058\u305F\u3089\u5C02\u9580\u5BB6\u3078',
    description: '\u7761\u7720\u306E\u554F\u984C\u304C2\u9031\u9593\u4EE5\u4E0A\u7D9A\u304F\u5834\u5408\u306F\u3001\u533B\u5E2B\u306B\u76F8\u8AC7\u3057\u307E\u3057\u3087\u3046\u3002',
  },
];

const bodyworkTips = [
  {
    icon: '\uD83D\uDC46',
    title: '\u767E\u4F1A\uFF08\u3072\u3083\u304F\u3048\uFF09- \u5165\u7720\u4FC3\u9032',
    description: '\u982D\u306E\u3066\u3063\u307A\u3093\u306B\u3042\u308B\u30C4\u30DC\u3002\u81EA\u5F8B\u795E\u7D4C\u3092\u6574\u3048\u3001\u5168\u8EAB\u306E\u7DCA\u5F35\u3092\u7DE9\u3081\u308B\u52B9\u679C\u304C\u3042\u308A\u307E\u3059\u3002',
    howTo: '\u4E21\u8033\u306E\u5148\u7AEF\u3092\u7D50\u3093\u3060\u7DDA\u306E\u4E2D\u592E\u3002\u4E2D\u6307\u3067\u512A\u3057\u304F3\u79D2\u62BC\u30573\u79D2\u96E2\u3059\u3092\u30015\u56DE\u7E70\u308A\u8FD4\u3057\u307E\u3059\u3002',
  },
  {
    icon: '\uD83D\uDC46',
    title: '\u5B89\u7720\uFF08\u3042\u3093\u307F\u3093\uFF09- \u4E0D\u7720\u6539\u5584',
    description: '\u8033\u306E\u5F8C\u308D\u306E\u9AA8\uFF08\u4E73\u69D8\u7A81\u8D77\uFF09\u306E\u4E0B\u306B\u3042\u308B\u30C4\u30DC\u3002\u7761\u7720\u306E\u8CEA\u3092\u9AD8\u3081\u307E\u3059\u3002',
    howTo: '\u8033\u305F\u3076\u306E\u5F8C\u308D\u306E\u9AA8\u306E\u5C11\u3057\u4E0B\u3002\u89AA\u6307\u3067\u3086\u3063\u304F\u308A\u5186\u3092\u63CF\u304F\u3088\u3046\u306B30\u79D2\u63C9\u307F\u307B\u3050\u3057\u307E\u3059\u3002',
  },
  {
    icon: '\uD83D\uDC46',
    title: '\u795E\u9580\uFF08\u3057\u3093\u3082\u3093\uFF09- \u30B9\u30C8\u30EC\u30B9\u7DE9\u548C',
    description: '\u624B\u9996\u306E\u5185\u5074\u3001\u5C0F\u6307\u5074\u306E\u304F\u307C\u307F\u306B\u3042\u308B\u30C4\u30DC\u3002\u7CBE\u795E\u306E\u5B89\u5B9A\u306B\u52B9\u679C\u304C\u3042\u308A\u307E\u3059\u3002',
    howTo: '\u53CD\u5BFE\u5074\u306E\u89AA\u6307\u3067\u3001\u5C11\u3057\u75DB\u6C17\u6301\u3061\u3044\u3044\u7A0B\u5EA6\u306B5\u79D2\u62BC\u30575\u79D2\u96E2\u3059\u3092\u30015\u56DE\u7E70\u308A\u8FD4\u3057\u307E\u3059\u3002',
  },
  {
    icon: '\uD83D\uDC46',
    title: '\u5408\u8C37\uFF08\u3054\u3046\u3053\u304F\uFF09- \u4E07\u80FD\u306E\u30C4\u30DC',
    description: '\u89AA\u6307\u3068\u4EBA\u5DEE\u3057\u6307\u306E\u9AA8\u306E\u5408\u6D41\u70B9\u3002\u5168\u8EAB\u306E\u7DCA\u5F35\u3092\u7DE9\u3081\u3001\u30EA\u30E9\u30C3\u30AF\u30B9\u3092\u4FC3\u3057\u307E\u3059\u3002',
    howTo: '\u53CD\u5BFE\u5074\u306E\u89AA\u6307\u3068\u4EBA\u5DEE\u3057\u6307\u3067\u6311\u3080\u3088\u3046\u306B\u62BC\u3057\u307E\u3059\u30023\u79D2\u62BC\u30573\u79D2\u96E2\u3059\u30925\u56DE\u3002',
  },
  {
    icon: '\uD83E\uDDD8',
    title: '\u5C31\u5BDD\u524D\u30B9\u30C8\u30EC\u30C3\u30C1\uFF085\u5206\uFF09',
    description: '\u5BDD\u308B\u524D\u306E\u7C21\u5358\u306A\u30B9\u30C8\u30EC\u30C3\u30C1\u3067\u526F\u4EA4\u611F\u795E\u7D4C\u3092\u6D3B\u6027\u5316\u3002\u7B4B\u8089\u306E\u7DCA\u5F35\u3092\u307B\u3050\u3057\u3066\u5165\u7720\u3092\u4FC3\u9032\u3057\u307E\u3059\u3002',
    howTo: '\u2460\u9996\u3092\u3086\u3063\u304F\u308A\u56DE\u3059\uFF0830\u79D2\uFF09\u2461\u80A9\u3092\u3050\u3063\u3068\u4E0A\u3052\u3066\u30B9\u30C8\u30F3\u3068\u843D\u3068\u3059\uFF083\u56DE\uFF09\u2462\u4EF0\u5411\u3051\u3067\u4E21\u819D\u3092\u80F8\u306B\u5F15\u304D\u5BC4\u305B\u308B\uFF0830\u79D2\uFF09\u2463\u3086\u3063\u304F\u308A\u6DF1\u547C\u5438\uFF085\u56DE\uFF09',
  },
  {
    icon: '\uD83E\uDDB4',
    title: '\u80CC\u9AA8\u30B9\u30C8\u30EC\u30C3\u30C1\uFF08\u808B\u9AA8\u306E\u53EF\u52D5\u57DF\u6539\u5584\uFF09',
    description: '\u80CC\u9AA8\u306E\u67D4\u8EDF\u6027\u306F\u547C\u5438\u306E\u6DF1\u3055\u306B\u5F71\u97FF\u3057\u307E\u3059\u3002\u6DF1\u3044\u547C\u5438\u306F\u7761\u7720\u306E\u8CEA\u5411\u4E0A\u306B\u7E4B\u304C\u308A\u307E\u3059\u3002',
    howTo: '\u56DB\u3064\u3093\u9019\u3044\u3067\u80CC\u4E2D\u3092\u4E38\u3081\u3066\u53CD\u3089\u3059\u300C\u732B\u306E\u30DD\u30FC\u30BA\u300D\u3092\u30865\u56DE\u7E70\u308A\u8FD4\u3057\u307E\u3059\u3002\u5404\u30DD\u30FC\u30BA\u30675\u79D2\u30AD\u30FC\u30D7\u3002',
  },
];
