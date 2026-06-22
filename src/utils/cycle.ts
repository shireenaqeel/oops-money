// cycle.ts — period/cycle tracking maths (V2). Pure functions, no UI/state, no medical claims.
// Goal: gently show whether spending creeps up in the PMS window (the ~5 days before a period).
import { Expense } from '../types';
import { sumExpenses } from './calculations';

const DAY = 86400000;
const PMS_WINDOW = 5; // days before a period start we treat as the "PMS week"
const PERIOD_DAYS = 5; // days from a start date we treat as "on period"
const OVULATION_BEFORE = 14; // ovulation lands ~14 days before the next period
const FERTILE_WINDOW = 6; // fertile window = the 5 days before ovulation + ovulation day

// yyyy-mm-dd for a Date (local).
function iso(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

// Whole days from ISO date a to ISO date b (b - a). Negative if b is before a.
function diffDays(aIso: string, bIso: string): number {
  const a = new Date(aIso + 'T00:00:00').getTime();
  const b = new Date(bIso + 'T00:00:00').getTime();
  return Math.round((b - a) / DAY);
}

// Shift an ISO date by n days.
function shift(isoStr: string, n: number): string {
  const d = new Date(isoStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return iso(d);
}

export type Phase = 'period' | 'fertile' | 'pms' | 'normal' | 'unknown';

export interface CycleInfo {
  lastStart: string | null; // most recent logged start
  nextPredicted: string | null; // lastStart + cycleLength
  ovulation: string | null; // predicted ovulation day (~14 days before next period)
  fertileStart: string | null; // start of the fertile window
  fertileEnd: string | null; // end of the fertile window
  dayOfCycle: number | null; // 1-based day within the current cycle
  daysToNext: number | null; // days until the next predicted period
  phase: Phase;
}

// Sort logged starts newest-first and drop blanks/dupes.
function cleanStarts(starts: string[]): string[] {
  return [...new Set(starts.filter(Boolean))].sort((a, b) => (a < b ? 1 : -1));
}

// Work out where today sits in the cycle and predict the next period, ovulation and fertile window.
export function getCycleInfo(starts: string[], cycleLength: number, todayIso: string): CycleInfo {
  const sorted = cleanStarts(starts);
  const len = cycleLength > 0 ? cycleLength : 28;
  if (sorted.length === 0) {
    return { lastStart: null, nextPredicted: null, ovulation: null, fertileStart: null, fertileEnd: null, dayOfCycle: null, daysToNext: null, phase: 'unknown' };
  }
  const lastStart = sorted[0];
  const nextPredicted = shift(lastStart, len);
  // Ovulation is ~14 days before the next period; the fertile window is the 5 days before it plus ovulation day.
  const ovulation = shift(nextPredicted, -OVULATION_BEFORE);
  const fertileStart = shift(ovulation, -(FERTILE_WINDOW - 1));
  const fertileEnd = ovulation;
  const dayOfCycle = diffDays(lastStart, todayIso) + 1; // day 1 = the start date itself
  const daysToNext = diffDays(todayIso, nextPredicted);

  let phase: Phase = 'normal';
  if (dayOfCycle >= 1 && dayOfCycle <= PERIOD_DAYS) phase = 'period';
  else if (daysToNext >= 0 && daysToNext <= PMS_WINDOW) phase = 'pms';
  else if (todayIso >= fertileStart && todayIso <= fertileEnd) phase = 'fertile';

  return { lastStart, nextPredicted, ovulation, fertileStart, fertileEnd, dayOfCycle, daysToNext, phase };
}

export interface CycleSpendInsight {
  hasData: boolean;
  pmsDailyAvg: number;
  otherDailyAvg: number;
  higherPct: number | null; // how much higher PMS daily spend is vs the rest (%), null if not comparable
}

// Compare average daily spend in PMS windows vs the rest of the month, across all the data.
// Period starts are projected by cycleLength from the latest logged start so a single log still works.
export function getCycleSpendInsight(expenses: Expense[], starts: string[], cycleLength: number, todayIso: string): CycleSpendInsight {
  const sorted = cleanStarts(starts);
  const len = cycleLength > 0 ? cycleLength : 28;
  const empty: CycleSpendInsight = { hasData: false, pmsDailyAvg: 0, otherDailyAvg: 0, higherPct: null };
  if (sorted.length === 0 || expenses.length === 0) return empty;

  // Data range: earliest expense (or earliest start) → today.
  const dates = expenses.map((e) => e.date).filter(Boolean);
  const earliest = [...dates, sorted[sorted.length - 1]].sort()[0];
  const spanDays = diffDays(earliest, todayIso);
  if (spanDays < 1) return empty;

  // Project the set of PMS dates across the range, anchored on the latest logged start.
  const anchor = sorted[0];
  const pmsDates = new Set<string>();
  // step backwards and forwards from the anchor by whole cycles to cover the range
  for (let k = -Math.ceil(spanDays / len) - 1; k <= Math.ceil(spanDays / len) + 1; k++) {
    const periodStart = shift(anchor, k * len);
    for (let d = 1; d <= PMS_WINDOW; d++) pmsDates.add(shift(periodStart, -d)); // the days BEFORE the start
  }

  // Tally spend + day counts split by PMS vs other, within [earliest, today].
  let pmsSpend = 0;
  let otherSpend = 0;
  expenses.forEach((e) => {
    if (e.date < earliest || e.date > todayIso) return;
    if (pmsDates.has(e.date)) pmsSpend += Number(e.amount);
    else otherSpend += Number(e.amount);
  });
  let pmsDays = 0;
  for (let i = 0; i <= spanDays; i++) if (pmsDates.has(shift(earliest, i))) pmsDays++;
  const otherDays = spanDays + 1 - pmsDays;
  if (pmsDays < 1 || otherDays < 1) return empty;

  const pmsDailyAvg = Math.round(pmsSpend / pmsDays);
  const otherDailyAvg = Math.round(otherSpend / otherDays);
  const higherPct = otherDailyAvg > 0 ? Math.round((pmsDailyAvg / otherDailyAvg - 1) * 100) : null;
  return { hasData: true, pmsDailyAvg, otherDailyAvg, higherPct };
}
