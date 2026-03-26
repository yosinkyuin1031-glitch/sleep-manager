import { jsPDF } from 'jspdf';
import { SleepRecord, SleepGoal, SLEEP_LATENCY_LABELS, NIGHT_WAKINGS_LABELS, WAKE_FEELING_LABELS } from '@/types/sleep';
import { formatDuration, calculateStats, getScoreLabel, getQualityLabel } from './sleepUtils';

// Register font for Japanese support - use built-in Helvetica with unicode
export function generateSleepReport(
  records: SleepRecord[],
  goals: SleepGoal,
  patientName?: string
): void {
  if (records.length === 0) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Helper functions
  const drawLine = (yPos: number) => {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
  };

  const checkNewPage = (neededSpace: number) => {
    if (y + neededSpace > 280) {
      doc.addPage();
      y = margin;
    }
  };

  // Title
  doc.setFontSize(20);
  doc.setTextColor(80, 40, 180);
  doc.text('Sleep Manager Report', pageWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  const today = new Date();
  const dateStr = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;
  doc.text(`Report Date: ${dateStr}`, pageWidth / 2, y, { align: 'center' });
  y += 4;

  if (patientName) {
    doc.text(`Patient: ${patientName}`, pageWidth / 2, y, { align: 'center' });
    y += 4;
  }

  y += 2;
  drawLine(y);
  y += 8;

  // Stats Summary
  const stats = calculateStats(records, goals);
  const { label: scoreLabel } = getScoreLabel(stats.sleepScore);

  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text('Summary (Last 7 Days)', margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);

  const summaryItems = [
    ['Sleep Score', `${stats.sleepScore} / 100 (${scoreLabel})`],
    ['Avg Duration', formatDuration(Math.round(stats.avgDuration))],
    ['Avg Quality', `${stats.avgQuality} / 5`],
    ['Avg Bedtime', stats.avgBedtime],
    ['Avg Wake Time', stats.avgWakeTime],
    ['Consistency', `${stats.consistency}%`],
    ['Sleep Debt', formatDuration(Math.round(stats.sleepDebt))],
  ];

  summaryItems.forEach(([label, value]) => {
    doc.setTextColor(100, 100, 100);
    doc.text(label, margin + 5, y);
    doc.setTextColor(40, 40, 40);
    doc.text(value, margin + 60, y);
    y += 6;
  });

  y += 4;
  drawLine(y);
  y += 8;

  // Score Breakdown
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text('Score Breakdown', margin, y);
  y += 8;

  const { scoreBreakdown } = stats;
  const breakdownItems = [
    ['Duration (max 30)', scoreBreakdown.durationScore],
    ['Quality (max 25)', scoreBreakdown.qualityScore],
    ['Consistency (max 20)', scoreBreakdown.consistencyScore],
    ['Latency (max 15)', scoreBreakdown.latencyScore],
    ['Lifestyle (max 10)', scoreBreakdown.lifestyleScore],
  ];

  doc.setFontSize(10);
  breakdownItems.forEach(([label, value]) => {
    doc.setTextColor(100, 100, 100);
    doc.text(String(label), margin + 5, y);
    doc.setTextColor(40, 40, 40);
    doc.text(String(value), margin + 70, y);

    // Draw bar
    const barX = margin + 85;
    const barWidth = 60;
    const maxVal = parseInt(String(label).match(/max (\d+)/)?.[1] || '30');
    const pct = Math.min(1, Number(value) / maxVal);

    doc.setFillColor(230, 230, 230);
    doc.roundedRect(barX, y - 3, barWidth, 4, 2, 2, 'F');

    if (pct > 0.7) {
      doc.setFillColor(34, 197, 94);
    } else if (pct > 0.5) {
      doc.setFillColor(245, 158, 11);
    } else {
      doc.setFillColor(239, 68, 68);
    }
    doc.roundedRect(barX, y - 3, barWidth * pct, 4, 2, 2, 'F');

    y += 7;
  });

  y += 4;
  drawLine(y);
  y += 8;

  // Goal Achievement
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text('Goal Achievement', margin, y);
  y += 8;

  doc.setFontSize(10);
  const recent7 = [...records].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
  const goalTargetMin = goals.targetDuration * 60;
  const achievedDays = recent7.filter(r => r.duration >= goalTargetMin).length;
  const achievementRate = recent7.length > 0 ? Math.round((achievedDays / recent7.length) * 100) : 0;

  const goalItems = [
    ['Target Duration', `${goals.targetDuration}h`],
    ['Target Bedtime', goals.targetBedtime],
    ['Target Wake Time', goals.targetWakeTime],
    ['Days Achieved', `${achievedDays} / ${recent7.length}`],
    ['Achievement Rate', `${achievementRate}%`],
  ];

  goalItems.forEach(([label, value]) => {
    doc.setTextColor(100, 100, 100);
    doc.text(label, margin + 5, y);
    doc.setTextColor(40, 40, 40);
    doc.text(value, margin + 60, y);
    y += 6;
  });

  y += 4;
  drawLine(y);
  y += 8;

  // Daily Records Table
  checkNewPage(40);
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text('Daily Records', margin, y);
  y += 8;

  // Table headers
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  const cols = [margin, margin + 22, margin + 42, margin + 58, margin + 82, margin + 100, margin + 125, margin + 150];
  const headers = ['Date', 'Bedtime', 'Wake', 'Duration', 'Quality', 'Latency', 'Wakings', 'Feeling'];

  headers.forEach((h, i) => {
    doc.text(h, cols[i], y);
  });
  y += 2;
  drawLine(y);
  y += 4;

  // Sort records by date desc
  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);

  doc.setFontSize(8);
  sorted.forEach(r => {
    checkNewPage(8);
    doc.setTextColor(60, 60, 60);
    doc.text(r.date, cols[0], y);
    doc.text(r.bedtime, cols[1], y);
    doc.text(r.wakeTime, cols[2], y);
    doc.text(formatDuration(r.duration), cols[3], y);
    doc.text(`${r.quality}/5 (${getQualityLabel(r.quality)})`, cols[4], y);
    doc.text(SLEEP_LATENCY_LABELS[r.sleepLatency], cols[5], y);
    doc.text(NIGHT_WAKINGS_LABELS[r.nightWakings], cols[6], y);
    doc.text(WAKE_FEELING_LABELS[r.wakeFeeling], cols[7], y);
    y += 5;
  });

  // Footer
  y += 4;
  drawLine(y);
  y += 6;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Generated by Sleep Manager', pageWidth / 2, y, { align: 'center' });

  // Download
  const fileName = `sleep-report-${dateStr.replace(/\//g, '-')}${patientName ? `-${patientName}` : ''}.pdf`;
  doc.save(fileName);
}
