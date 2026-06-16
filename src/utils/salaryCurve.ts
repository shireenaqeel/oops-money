// salaryCurve.ts — the "rich for 3 days" pattern: how front-loaded your month's spending is (V2).
// Pure maths over this month's expenses. Shows the classic payday → broke arc.
import { Expense } from '../types';
import { L } from '../i18n';

export interface SalaryCurve {
  hasData: boolean;
  buckets: { label: string; value: number }[]; // spend per week-of-month (for the bar chart)
  firstThirdPct: number; // % of the month's money spent in days 1–10
  halfwayDay: number | null; // day of month by which you'd spent half your money (0 = none)
  headline: string; // sassy one-liner
}

// Build the salary curve for a given month/year from all expenses.
export function getSalaryCurve(expenses: Expense[], month: number, year: number): SalaryCurve {
  // Keep only this month's expenses, summed per day-of-month (1–31).
  const perDay = new Array<number>(32).fill(0);
  let total = 0;
  for (const e of expenses) {
    const d = new Date(e.date + 'T00:00:00');
    if (d.getMonth() !== month || d.getFullYear() !== year) continue;
    perDay[d.getDate()] += Number(e.amount);
    total += Number(e.amount);
  }

  if (total <= 0) {
    return { hasData: false, buckets: [], firstThirdPct: 0, halfwayDay: null, headline: '' };
  }

  // Weekly buckets (1–7, 8–14, 15–21, 22+) for the little bar chart.
  const buckets = [
    { label: '1–7', value: sumRange(perDay, 1, 7) },
    { label: '8–14', value: sumRange(perDay, 8, 14) },
    { label: '15–21', value: sumRange(perDay, 15, 21) },
    { label: '22+', value: sumRange(perDay, 22, 31) },
  ];

  const firstThirdPct = Math.round((sumRange(perDay, 1, 10) / total) * 100);

  // The day by which you'd burned through half the month's money.
  let running = 0;
  let halfwayDay: number | null = null;
  for (let day = 1; day <= 31; day++) {
    running += perDay[day];
    if (running >= total / 2) {
      halfwayDay = day;
      break;
    }
  }

  return { hasData: true, buckets, firstThirdPct, halfwayDay, headline: buildHeadline(firstThirdPct, halfwayDay) };
}

// Add up perDay between two days (inclusive).
function sumRange(perDay: number[], from: number, to: number): number {
  let s = 0;
  for (let d = from; d <= to; d++) s += perDay[d] || 0;
  return s;
}

// A relatable line about how fast the money goes.
function buildHeadline(firstThirdPct: number, halfwayDay: number | null): string {
  if (halfwayDay != null && halfwayDay <= 10) {
    return L(`aadha paisa ${halfwayDay} tareekh tak hi udd gaya 💸 1 ko rani, baaki mahina maggi 🍜`, `half your money was gone by the ${halfwayDay}th 💸 queen on the 1st, maggi the rest of the month 🍜`);
  }
  if (firstThirdPct >= 50) {
    return L(`${firstThirdPct}% kharcha pehle 10 din mein — payday excitement real hai 😭 thoda baad ke liye bachao`, `${firstThirdPct}% spent in the first 10 days — payday excitement is real 😭 save some for later`);
  }
  if (firstThirdPct <= 25) {
    return L(`kharcha poore mahine mein achhe se faila hua hai — disciplined queen 💚`, `spending is nicely spread across the month — disciplined queen 💚`);
  }
  return L(`kharcha thoda month-start pe heavy hai (${firstThirdPct}% pehle 10 din mein) — par sambhla hua hai 🌸`, `spending leans a bit early (${firstThirdPct}% in the first 10 days) — but it's under control 🌸`);
}
