// recurring.ts — pure date helpers for the bill due-day prompt (Feature 10+).
// Figures out the most recent due date that has arrived for a monthly bill, and which bills
// are still "pending" (a due date arrived that the user hasn't logged or skipped yet).
import { Recurring } from '../types';

// Days in a given month (0-based month).
function daysInMonth(y: number, m: number): number {
  return new Date(y, m + 1, 0).getDate();
}

// Local yyyy-mm-dd for a Date.
function iso(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

// The most recent due date (yyyy-mm-dd) on or before `ref` for a bill due on `day` each month.
// Clamps to the last day for short months (e.g. day 31 in Feb → 28/29).
export function dueOccurrenceISO(day: number, ref: Date): string {
  const refMidnight = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const thisMonthDue = new Date(ref.getFullYear(), ref.getMonth(), Math.min(day, daysInMonth(ref.getFullYear(), ref.getMonth())));
  if (thisMonthDue.getTime() <= refMidnight.getTime()) return iso(thisMonthDue);
  // This month's due is still in the future → the most recent one was last month.
  const pmY = ref.getMonth() === 0 ? ref.getFullYear() - 1 : ref.getFullYear();
  const pmM = ref.getMonth() === 0 ? 11 : ref.getMonth() - 1;
  return iso(new Date(pmY, pmM, Math.min(day, daysInMonth(pmY, pmM))));
}

// A bill whose latest arrived due date hasn't been handled yet, with that due date.
export interface PendingBill {
  bill: Recurring;
  occ: string; // yyyy-mm-dd of the due occurrence to ask about
}

// Bills with an arrived-but-unhandled due date, oldest due first.
export function pendingBills(recurring: Recurring[], ref: Date): PendingBill[] {
  return recurring
    .map((bill) => ({ bill, occ: dueOccurrenceISO(bill.day, ref) }))
    .filter((p) => p.occ !== p.bill.lastHandledDue)
    .sort((a, b) => a.occ.localeCompare(b.occ));
}
