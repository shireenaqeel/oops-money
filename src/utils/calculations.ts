// calculations.ts — pure functions for budget maths, month filtering, and danger alerts.
// No UI, no state. Home + Insights both reuse these.
import { Expense, Category, CatBudgets } from '../types';
import { findCat } from '../constants/categories';
import { fmtINR } from './index';
import { colors } from '../constants/theme';

// Keep only the expenses that fall in the given month + year.
export function monthExpenses(expenses: Expense[], month: number, year: number): Expense[] {
  return expenses.filter((e) => {
    const d = new Date(e.date + 'T00:00:00');
    return d.getMonth() === month && d.getFullYear() === year;
  });
}

// Add up the amounts of a list of expenses.
export function sumExpenses(list: Expense[]): number {
  return list.reduce((s, e) => s + Number(e.amount), 0);
}

// Everything the budget card needs to render.
export interface BudgetState {
  hasBudget: boolean;
  spent: number;
  budget: number;
  remaining: number; // negative when over budget
  pct: number; // 0–100, capped for the bar width
  over: boolean;
  barColor: string;
}

// Work out budget progress and which colour the progress bar should be.
export function getBudgetState(spent: number, budgetStr: string): BudgetState {
  const budget = Number(budgetStr) || 0;
  const hasBudget = budget > 0;
  const over = hasBudget && spent > budget;
  const rawPct = hasBudget ? (spent / budget) * 100 : 0;
  const pct = Math.min(rawPct, 100);
  let barColor: string = colors.budgetSafe; // 0–74%
  if (over) barColor = colors.budgetOver; // 100%+
  else if (rawPct >= 75) barColor = colors.budgetWarning; // 75–99%
  return { hasBudget, spent, budget, remaining: budget - spent, pct, over, barColor };
}

// Local yyyy-mm-dd for a Date.
function isoLocal(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

// Streak stats: consecutive days within the daily budget + no-spend days this month. Feature 14.
export interface Streaks {
  streak: number; // consecutive days ending today where you stayed within the daily budget
  noSpendDays: number; // days this month with zero spending
  noSpendToday: boolean;
  hasBudget: boolean;
}

export function getStreaks(expenses: Expense[], budgetStr: string): Streaks {
  const budget = Number(budgetStr) || 0;
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyBudget = budget > 0 ? budget / daysInMonth : 0;

  // total spend per date
  const spendByDate = new Map<string, number>();
  expenses.forEach((e) => spendByDate.set(e.date, (spendByDate.get(e.date) || 0) + Number(e.amount)));

  // consecutive days (counting back from today) where daily spend stayed within the daily budget
  let streak = 0;
  if (budget > 0) {
    for (let i = 0; i <= 366; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const spent = spendByDate.get(isoLocal(d)) || 0;
      if (spent <= dailyBudget) streak++;
      else break;
    }
  }

  // no-spend days so far this month
  let noSpendDays = 0;
  for (let day = 1; day <= now.getDate(); day++) {
    const d = new Date(now.getFullYear(), now.getMonth(), day);
    if ((spendByDate.get(isoLocal(d)) || 0) === 0) noSpendDays++;
  }

  return { streak, noSpendDays, noSpendToday: (spendByDate.get(isoLocal(now)) || 0) === 0, hasBudget: budget > 0 };
}

// A single danger alert card.
export interface Alert {
  emoji: string;
  title: string;
  sub: string;
}

// Build the danger alerts for the current month (mirrors the prototype's rules).
export function getAlerts(
  expenses: Expense[],
  budgetStr: string,
  splurgeFundStr: string,
  customCats: Category[],
  month: number,
  year: number,
  today: string,
  catBudgets: CatBudgets = {}
): Alert[] {
  const alerts: Alert[] = [];
  const monthExp = monthExpenses(expenses, month, year);
  const total = sumExpenses(monthExp);
  const budget = Number(budgetStr) || 0;

  // Per-category limits (work even without a global monthly budget).
  Object.entries(catBudgets).forEach(([catId, limit]) => {
    if (!(limit > 0)) return;
    const spent = sumExpenses(monthExp.filter((e) => e.catId === catId));
    if (spent > limit) {
      const cat = findCat(catId, customCats);
      alerts.push({ emoji: '🎯', title: `${cat.name} limit cross!`, sub: `${fmtINR(spent)} kharch — limit ${fmtINR(limit)} se ${fmtINR(spent - limit)} zyada` });
    }
  });

  // Splurge fund overspent (works even without a monthly budget set).
  const splurgeFund = Number(splurgeFundStr) || 0;
  if (splurgeFund > 0) {
    const splurgeSpent = sumExpenses(monthExp.filter((e) => e.isSplurge));
    if (splurgeSpent > splurgeFund) {
      alerts.push({ emoji: '🛍️', title: 'splurge fund khatam!', sub: `${fmtINR(splurgeSpent)} splurge pe — fund se ${fmtINR(splurgeSpent - splurgeFund)} zyada` });
    }
  }

  if (budget <= 0 || total === 0) return alerts; // no budget alerts to add yet

  const pct = (total / budget) * 100;
  const remaining = budget - total;
  const over = total > budget;

  // 1. Near the budget (80–99%)
  if (pct >= 80 && !over) {
    alerts.push({ emoji: '⚠️', title: 'Danger zone, babe!', sub: `${Math.round(pct)}% budget use ho gaya — sirf ${fmtINR(remaining)} bacha hai` });
  }
  // 2. Over budget
  if (over) {
    alerts.push({ emoji: '💀', title: 'oops, budget gaya', sub: `${fmtINR(Math.abs(remaining))} over — deep breath, agla mahina better karenge 💕` });
  }
  // 3. One category eating most of the budget (>45%)
  const byCat = new Map<string, number>();
  monthExp.forEach((e) => byCat.set(e.catId, (byCat.get(e.catId) || 0) + Number(e.amount)));
  let topId = '';
  let topVal = 0;
  byCat.forEach((v, k) => {
    if (v > topVal) {
      topVal = v;
      topId = k;
    }
  });
  if (topId && topVal / total > 0.45) {
    const cat = findCat(topId, customCats);
    alerts.push({ emoji: '💸', title: `${cat.name} pe bahut kharch!`, sub: `${Math.round((topVal / total) * 100)}% ek hi category mein — thoda diversify karo?` });
  }
  // 4. Today is unusually heavy (2x the daily average)
  const todaySpend = sumExpenses(expenses.filter((e) => e.date === today));
  if (todaySpend > (budget / 30) * 2) {
    alerts.push({ emoji: '📅', title: 'Aaj ka din heavy hai!', sub: `Aaj ${fmtINR(todaySpend)} kharch — daily average se 2x zyada!` });
  }
  return alerts;
}
