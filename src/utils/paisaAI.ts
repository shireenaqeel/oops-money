// paisaAI.ts — "Paisa AI ✨": a fully on-device, no-LLM insight engine. It reads your spending,
// income, budget and cycle data, finds patterns, and writes them up as short natural-language
// observations. No network, no API key, no cost — it just feels smart. Each generator returns
// one insight (or null); we rank them by `score` and the UI shows the most useful few.
import { Expense, Income, Category } from '../types';
import { monthExpenses, sumExpenses } from './calculations';
import { getCycleSpendInsight } from './cycle';
import { fmtINR } from './index';
import { findCat } from '../constants/categories';
import { sumIncomes, monthIncomes } from '../constants/incomes';
import { L } from '../i18n';

export type Tone = 'good' | 'warn' | 'info';

export interface PaisaInsight {
  id: string;
  emoji: string;
  text: string; // already localized (hinglish/english) via L()
  tone: Tone;
  score: number; // higher = more important; used for ranking
}

const DAY = 86400000;
const WEEKDAY_HI = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// yyyy-mm-dd for a Date (local).
function iso(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export interface PaisaInput {
  expenses: Expense[];
  incomes: Income[];
  budget: string;
  customCats: Category[];
  periodStarts: string[];
  cycleLength: number;
  today: string; // yyyy-mm-dd
}

// Build the full ranked list of insights. The UI decides how many to show.
export function getPaisaInsights(input: PaisaInput): PaisaInsight[] {
  const { expenses, incomes, budget, customCats, periodStarts, cycleLength, today } = input;
  const now = new Date(today + 'T00:00:00');
  const month = now.getMonth();
  const year = now.getFullYear();
  const dom = now.getDate(); // day of month (1-based)
  const dim = new Date(year, month + 1, 0).getDate(); // days in this month

  const thisMonth = monthExpenses(expenses, month, year);
  const total = sumExpenses(thisMonth);
  const budgetNum = Number(budget) || 0;

  const out: (PaisaInsight | null)[] = [];

  // 1) Budget burn forecast — the headline "AI" insight.
  if (budgetNum > 0 && total > 0 && dom >= 2) {
    const dailyPace = total / dom;
    const projected = Math.round(dailyPace * dim);
    if (projected > budgetNum * 1.03) {
      const dayOut = Math.ceil(budgetNum / dailyPace);
      if (dayOut <= dim) {
        out.push({
          id: 'forecast-out',
          emoji: '💀',
          text: L(`is rate se budget ${dayOut} tarikh ko khatam ho jayega — thoda dheere babe`, `at this pace your budget runs out by the ${ordinal(dayOut)} — ease up babe`),
          tone: 'warn',
          score: 100,
        });
      } else {
        out.push({
          id: 'forecast-over',
          emoji: '📈',
          text: L(`is pace pe month end tak ~${fmtINR(projected - budgetNum)} over budget ho jaogi`, `at this pace you'll be ~${fmtINR(projected - budgetNum)} over budget by month end`),
          tone: 'warn',
          score: 95,
        });
      }
    } else if (projected < budgetNum * 0.9) {
      out.push({
        id: 'forecast-save',
        emoji: '💚',
        text: L(`is rate se month end pe ~${fmtINR(budgetNum - projected)} bach jayega — doing great 💅`, `at this pace you'll have ~${fmtINR(budgetNum - projected)} left at month end — doing great 💅`),
        tone: 'good',
        score: 60,
      });
    }
  }

  // 2) Busiest weekday — over the last 8 weeks.
  const weekday = busiestWeekday(expenses, now);
  if (weekday) {
    out.push({
      id: 'weekday',
      emoji: '📅',
      text: L(`${dayNameHi(weekday.day)} tumhara sabse mehenga din hai — us din avg ${fmtINR(weekday.avg)} jaata hai`, `${WEEKDAY_HI[weekday.day]} is your priciest day — you spend about ${fmtINR(weekday.avg)} then`),
      tone: 'info',
      score: 55,
    });
  }

  // 3) Category spike vs last month.
  const spike = categorySpike(expenses, customCats, month, year);
  if (spike) {
    out.push({
      id: 'spike',
      emoji: '🔺',
      text: L(`${spike.name} pe is mahine ${spike.pct}% zyada — ${fmtINR(spike.now)} (pichhle mahine ${fmtINR(spike.prev)})`, `${spike.name} is up ${spike.pct}% this month — ${fmtINR(spike.now)} (was ${fmtINR(spike.prev)})`),
      tone: 'warn',
      score: 80,
    });
  }

  // 4) Top category share this month.
  const topCat = topCategory(thisMonth, customCats, total);
  if (topCat) {
    out.push({
      id: 'topcat',
      emoji: topCat.emoji,
      text: L(`is mahine ka ${topCat.pct}% ${topCat.name} pe gaya — ${fmtINR(topCat.amount)}`, `${topCat.pct}% of this month went to ${topCat.name} — ${fmtINR(topCat.amount)}`),
      tone: 'info',
      score: 50,
    });
  }

  // 5) No-spend days this month — positive reinforcement.
  const noSpend = noSpendDays(thisMonth, dom);
  if (noSpend >= 3) {
    out.push({
      id: 'nospend',
      emoji: '🍽️',
      text: L(`is mahine ${noSpend} no-spend days — you ate 💚`, `${noSpend} no-spend days this month — you ate 💚`),
      tone: 'good',
      score: 45,
    });
  }

  // 6) Biggest single day this month.
  const bigDay = biggestDay(thisMonth);
  if (bigDay && bigDay.amount >= Math.max(500, dailyAvg(total, dom) * 3)) {
    out.push({
      id: 'bigday',
      emoji: '🎢',
      text: L(`${fmtDay(bigDay.date)} ko sabse zyada uda diya — ${fmtINR(bigDay.amount)} ek din mein`, `your biggest day was ${fmtDay(bigDay.date)} — ${fmtINR(bigDay.amount)} in one day`),
      tone: 'info',
      score: 40,
    });
  }

  // 7) Regret pattern this month.
  const regretSum = sumExpenses(thisMonth.filter((e) => e.regret === 'regret'));
  const regretCount = thisMonth.filter((e) => e.regret === 'regret').length;
  if (regretCount > 0) {
    out.push({
      id: 'regret',
      emoji: '🪦',
      text: L(`is mahine ${fmtINR(regretSum)} ke kharchon ko tumne 'regret' mark kiya — pattern samajh aa raha? 👀`, `you tagged ${fmtINR(regretSum)} of spending as 'regret' this month — seeing a pattern? 👀`),
      tone: 'warn',
      score: 70,
    });
  }

  // 8) Splurge fund pace.
  const splurgeSum = sumExpenses(thisMonth.filter((e) => e.isSplurge));
  if (splurgeSum > 0) {
    out.push({
      id: 'splurge',
      emoji: '💃',
      text: L(`is mahine ${fmtINR(splurgeSum)} guilt-free splurge pe — that's the fun money, no shame`, `${fmtINR(splurgeSum)} went to guilt-free splurges this month — that's the fun money, no shame`),
      tone: 'info',
      score: 35,
    });
  }

  // 9) Savings rate (income vs spend).
  const earned = sumIncomes(monthIncomes(incomes, month, year));
  if (earned > 0) {
    const net = earned - total;
    const pct = Math.round((net / earned) * 100);
    if (net > 0) {
      out.push({
        id: 'saverate',
        emoji: '🐷',
        text: L(`is mahine kamai ka ${pct}% bachaya (${fmtINR(net)}) — proud of you`, `you saved ${pct}% of what you earned this month (${fmtINR(net)}) — proud of you`),
        tone: 'good',
        score: 65,
      });
    } else {
      out.push({
        id: 'overspend',
        emoji: '⚠️',
        text: L(`is mahine kamai se ${fmtINR(-net)} zyada kharch ho gaya — heads up babe`, `you spent ${fmtINR(-net)} more than you earned this month — heads up babe`),
        tone: 'warn',
        score: 85,
      });
    }
  }

  // 10) PMS-week spending pattern (reuses the cycle engine).
  if (periodStarts.length > 0) {
    const cyc = getCycleSpendInsight(expenses, periodStarts, cycleLength, today);
    if (cyc.hasData && cyc.higherPct != null && cyc.higherPct >= 15) {
      out.push({
        id: 'pms',
        emoji: '🌸',
        text: L(`PMS week mein daily kharcha ~${cyc.higherPct}% zyada hota hai — cravings real hain 💕`, `your daily spending is ~${cyc.higherPct}% higher in PMS week — cravings are real 💕`),
        tone: 'info',
        score: 58,
      });
    }
  }

  // Rank most-useful first; drop nulls.
  return out.filter((x): x is PaisaInsight => x !== null).sort((a, b) => b.score - a.score);
}

// ── helpers ────────────────────────────────────────────────────────────────
function dailyAvg(total: number, dom: number): number {
  return total / Math.max(dom, 1);
}

// Hindi-ish day name in hinglish mode uses the English weekday too (kept simple + friendly).
function dayNameHi(day: number): string {
  return WEEKDAY_HI[day];
}

// English ordinal (1st, 2nd, 3rd, 24th) for the "runs out by the Xth" line.
function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// "12 Jun"-style short day label from an ISO date.
function fmtDay(isoStr: string): string {
  const d = new Date(isoStr + 'T00:00:00');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

// Average spend per weekday over the last 8 weeks; returns the priciest weekday.
function busiestWeekday(expenses: Expense[], now: Date): { day: number; avg: number } | null {
  const start = iso(new Date(now.getTime() - 55 * DAY));
  const nowIso = iso(now);
  const recent = expenses.filter((e) => e.date >= start && e.date <= nowIso);
  if (recent.length < 8) return null;
  const sums = new Array(7).fill(0);
  recent.forEach((e) => {
    const wd = new Date(e.date + 'T00:00:00').getDay();
    sums[wd] += Number(e.amount);
  });
  let best = -1;
  let bestVal = 0;
  for (let i = 0; i < 7; i++) {
    if (sums[i] > bestVal) {
      bestVal = sums[i];
      best = i;
    }
  }
  if (best < 0 || bestVal <= 0) return null;
  return { day: best, avg: Math.round(bestVal / 8) }; // ~8 occurrences of each weekday in 8 weeks
}

// The category whose spend grew the most (by %) vs last month, among meaningful amounts.
function categorySpike(
  expenses: Expense[],
  customCats: Category[],
  month: number,
  year: number
): { name: string; now: number; prev: number; pct: number } | null {
  const thisM = monthExpenses(expenses, month, year);
  const prevDate = new Date(year, month - 1, 1);
  const prevM = monthExpenses(expenses, prevDate.getMonth(), prevDate.getFullYear());
  if (prevM.length === 0) return null;
  const cats = [...new Set(thisM.map((e) => e.catId))];
  let bestName = '';
  let bestNow = 0;
  let bestPrev = 0;
  let bestPct = 0;
  cats.forEach((catId) => {
    const nowAmt = sumExpenses(thisM.filter((e) => e.catId === catId));
    const prevAmt = sumExpenses(prevM.filter((e) => e.catId === catId));
    if (prevAmt < 200 || nowAmt < prevAmt * 1.3 || nowAmt < 500) return; // only real, meaningful jumps
    const pct = Math.round((nowAmt / prevAmt - 1) * 100);
    if (pct > bestPct) {
      bestPct = pct;
      bestNow = nowAmt;
      bestPrev = prevAmt;
      bestName = findCat(catId, customCats).name;
    }
  });
  if (!bestName || bestPct < 30) return null;
  return { name: bestName, now: bestNow, prev: bestPrev, pct: bestPct };
}

// The single biggest category this month + its share.
function topCategory(
  thisMonth: Expense[],
  customCats: Category[],
  total: number
): { name: string; emoji: string; amount: number; pct: number } | null {
  if (thisMonth.length === 0 || total <= 0) return null;
  const cats = [...new Set(thisMonth.map((e) => e.catId))];
  let bestId = '';
  let bestVal = 0;
  cats.forEach((catId) => {
    const amt = sumExpenses(thisMonth.filter((e) => e.catId === catId));
    if (amt > bestVal) {
      bestVal = amt;
      bestId = catId;
    }
  });
  if (!bestId) return null;
  const cat = findCat(bestId, customCats);
  const pct = Math.round((bestVal / total) * 100);
  if (pct < 25) return null; // only call it out if it's actually dominant
  return { name: cat.name, emoji: cat.name.split(' ')[0], amount: bestVal, pct };
}

// Count days so far this month with zero spend.
function noSpendDays(thisMonth: Expense[], dom: number): number {
  const spentDays = new Set(thisMonth.map((e) => e.date));
  return Math.max(0, dom - spentDays.size);
}

// The day this month with the highest total spend.
function biggestDay(thisMonth: Expense[]): { date: string; amount: number } | null {
  if (thisMonth.length === 0) return null;
  const byDay = new Map<string, number>();
  thisMonth.forEach((e) => byDay.set(e.date, (byDay.get(e.date) || 0) + Number(e.amount)));
  let bestDate = '';
  let bestVal = 0;
  byDay.forEach((v, k) => {
    if (v > bestVal) {
      bestVal = v;
      bestDate = k;
    }
  });
  return bestDate ? { date: bestDate, amount: bestVal } : null;
}
