// cycle.ts — period/cycle tracking maths (V2/V3). Pure functions, no UI/state, no medical claims.
// Goals: (a) predict the next period, ovulation and fertile window; (b) learn the user's own
// average cycle + period length from her logged history; (c) power a month calendar; and
// (d) gently show whether spending creeps up in the PMS window (the ~5 days before a period).
import { Expense } from '../types';

const DAY = 86400000;
const PMS_WINDOW = 5; // days before a period start we treat as the "PMS week"
const DEFAULT_PERIOD_DAYS = 5; // fallback period length before we've learned it
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

// Which phase a given 1-based day-of-cycle falls in. Mirrors getCycleInfo's logic so the
// ring and the hero card always agree. Days outside 1..len are treated as 'normal'.
// `periodLen` lets the ring shade the real (learned) period length, not always 5.
export function phaseForCycleDay(day: number, cycleLength: number, periodLen: number = DEFAULT_PERIOD_DAYS): Phase {
  const len = cycleLength > 0 ? cycleLength : 28;
  if (day < 1 || day > len) return 'normal';
  const daysToNext = len - day + 1; // days until the next period start (day len+1)
  const ovulationDay = len - OVULATION_BEFORE; // day-of-cycle of ovulation
  const fertileStartDay = ovulationDay - (FERTILE_WINDOW - 1);
  if (day <= Math.max(1, periodLen)) return 'period';
  if (daysToNext >= 0 && daysToNext <= PMS_WINDOW) return 'pms';
  if (day >= fertileStartDay && day <= ovulationDay) return 'fertile';
  return 'normal';
}

// Sort logged starts newest-first and drop blanks/dupes.
function cleanStarts(starts: string[]): string[] {
  return [...new Set(starts.filter(Boolean))].sort((a, b) => (a < b ? 1 : -1));
}

// ── Learned stats ────────────────────────────────────────────────────────────
// Instead of trusting a manual number, work out the user's OWN average cycle length
// (gaps between consecutive starts) and period length (start→end), plus how regular she is.

export interface CycleStats {
  avgCycle: number | null; // learned average gap between periods, null if <2 logs
  avgPeriod: number | null; // learned average period length, null if no ends logged
  cycleSamples: number; // how many cycle gaps we averaged
  periodSamples: number; // how many period lengths we averaged
  variation: number | null; // spread of cycle lengths (max−min), null if <2 logs
  regular: boolean | null; // true = variation small, false = irregular, null = not enough data
  shortest: number | null;
  longest: number | null;
}

// Median of a list (more robust to one weird cycle than the mean).
function median(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

export function getCycleStats(starts: string[], periodEnds: Record<string, string>): CycleStats {
  const sorted = cleanStarts(starts); // newest-first
  const empty: CycleStats = {
    avgCycle: null, avgPeriod: null, cycleSamples: 0, periodSamples: 0,
    variation: null, regular: null, shortest: null, longest: null,
  };
  // Cycle-length gaps between consecutive starts (ignore absurd gaps from missed logs).
  const gaps: number[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const g = diffDays(sorted[i + 1], sorted[i]);
    if (g >= 15 && g <= 60) gaps.push(g);
  }
  // Period lengths from any start that has an end logged.
  const lengths: number[] = [];
  Object.keys(periodEnds).forEach((s) => {
    const e = periodEnds[s];
    if (!e) return;
    const len = diffDays(s, e) + 1; // inclusive
    if (len >= 1 && len <= 15) lengths.push(len);
  });
  if (gaps.length === 0 && lengths.length === 0) return empty;
  const avgCycle = gaps.length ? median(gaps) : null;
  const avgPeriod = lengths.length ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length) : null;
  const shortest = gaps.length ? Math.min(...gaps) : null;
  const longest = gaps.length ? Math.max(...gaps) : null;
  const variation = shortest != null && longest != null ? longest - shortest : null;
  const regular = variation == null ? null : variation <= 5; // within ~5 days = regular
  return { avgCycle, avgPeriod, cycleSamples: gaps.length, periodSamples: lengths.length, variation, regular, shortest, longest };
}

// The cycle length we should actually use: learned average if we have one, else the manual value.
export function effectiveCycleLength(stats: CycleStats, manualLength: number): number {
  if (stats.avgCycle && stats.avgCycle > 0) return stats.avgCycle;
  return manualLength > 0 ? manualLength : 28;
}

// The period length we should use: learned average if we have one, else the default.
export function effectivePeriodLength(stats: CycleStats): number {
  return stats.avgPeriod && stats.avgPeriod > 0 ? stats.avgPeriod : DEFAULT_PERIOD_DAYS;
}

// Work out where today sits in the cycle and predict the next period, ovulation and fertile window.
// `periodLen` (optional) shades the correct number of period days for the current-phase check.
export function getCycleInfo(
  starts: string[],
  cycleLength: number,
  todayIso: string,
  periodLen: number = DEFAULT_PERIOD_DAYS
): CycleInfo {
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
  if (dayOfCycle >= 1 && dayOfCycle <= Math.max(1, periodLen)) phase = 'period';
  else if (daysToNext >= 0 && daysToNext <= PMS_WINDOW) phase = 'pms';
  else if (todayIso >= fertileStart && todayIso <= fertileEnd) phase = 'fertile';

  return { lastStart, nextPredicted, ovulation, fertileStart, fertileEnd, dayOfCycle, daysToNext, phase };
}

// The next N predicted period start dates (for "next few periods" list).
export function nextPeriods(starts: string[], effLen: number, count: number): string[] {
  const sorted = cleanStarts(starts);
  if (sorted.length === 0) return [];
  const out: string[] = [];
  for (let k = 1; k <= count; k++) out.push(shift(sorted[0], k * effLen));
  return out;
}

// ── Calendar markers ─────────────────────────────────────────────────────────
// The kind of day a calendar cell should show, most-important first.
export type DayKind = 'period' | 'predPeriod' | 'ovulation' | 'fertile' | 'pms';
const KIND_PRIORITY: Record<DayKind, number> = { period: 5, predPeriod: 4, ovulation: 3, fertile: 2, pms: 1 };

// Build a { dateISO: DayKind } map covering [fromIso, toIso], from logged periods (actual)
// plus projections into the future. Actual period ranges use logged ends when present.
export function cycleMarksForRange(
  starts: string[],
  periodEnds: Record<string, string>,
  effLen: number,
  effPeriod: number,
  fromIso: string,
  toIso: string
): Record<string, DayKind> {
  const sorted = cleanStarts(starts); // newest-first
  const marks: Record<string, DayKind> = {};
  if (sorted.length === 0) return marks;
  const len = effLen > 0 ? effLen : 28;
  const pdays = Math.max(1, effPeriod);

  const set = (dateIso: string, kind: DayKind) => {
    if (dateIso < fromIso || dateIso > toIso) return;
    const prev = marks[dateIso];
    if (!prev || KIND_PRIORITY[kind] > KIND_PRIORITY[prev]) marks[dateIso] = kind;
  };

  // Full list of cycle start dates covering the window: actual logs (oldest→newest) + future projections.
  const asc = [...sorted].reverse();
  const lastStart = sorted[0];
  const futures: string[] = [];
  for (let k = 1; k <= 60; k++) {
    const p = shift(lastStart, k * len);
    futures.push(p);
    if (p > toIso) break;
  }
  const allStarts = [...asc, ...futures];

  for (let i = 0; i < allStarts.length; i++) {
    const s = allStarts[i];
    const isFuture = s > lastStart;
    const next = allStarts[i + 1] ?? shift(s, len);

    // Period days: actual logged range if we have it, else the default/learned length.
    const loggedEnd = periodEnds[s];
    const end = !isFuture && loggedEnd ? loggedEnd : shift(s, pdays - 1);
    for (let d = s; d <= end; d = shift(d, 1)) {
      set(d, isFuture ? 'predPeriod' : 'period');
      if (d > toIso) break;
    }

    // Ovulation / fertile window / PMS for this cycle, based on the NEXT start.
    const ov = shift(next, -OVULATION_BEFORE);
    const fStart = shift(ov, -(FERTILE_WINDOW - 1));
    for (let d = fStart; d <= ov; d = shift(d, 1)) set(d, 'fertile');
    set(ov, 'ovulation');
    for (let d = shift(next, -PMS_WINDOW); d <= shift(next, -1); d = shift(d, 1)) set(d, 'pms');
  }
  return marks;
}

// ── Cycle vs money ───────────────────────────────────────────────────────────
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
