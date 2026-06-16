// challenges.ts — money challenges (V3). Templates + a live evaluator that decides
// won / failed / still-going purely from the expenses, so status is never stale.
import { Challenge, Expense, Category } from '../types';
import { findCat } from '../constants/categories';
import { daysSince } from './index';

// A challenge you can take on. `kind` decides how it's judged:
//  - 'cap'      → total spend in the window must stay ≤ cap (cap 0 = a no-spend challenge)
//  - 'no_group' → zero spend in the listed category groups during the window
export interface ChallengeTemplate {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  durationDays: number;
  kind: 'cap' | 'no_group';
  cap?: number; // for 'cap'
  groups?: string[]; // for 'no_group'
}

export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  { id: 'no_zomato', emoji: '🍜', title: 'No-Zomato Week', desc: '7 din zero food delivery + cafe — ghar ka khaana time', durationDays: 7, kind: 'no_group', groups: ['Food'] },
  { id: 'cap500', emoji: '💸', title: '₹500 Week', desc: 'poore 7 din mein ₹500 se kam kharcha', durationDays: 7, kind: 'cap', cap: 500 },
  { id: 'no_shop', emoji: '🛍️', title: 'No-Shopping 3 Days', desc: '3 din beauty + fashion kuch nahi', durationDays: 3, kind: 'no_group', groups: ['Beauty', 'Fashion'] },
  { id: 'no_spend3', emoji: '🚫', title: 'No-Spend 3 Days', desc: '3 din bilkul zero kharcha — pakka?', durationDays: 3, kind: 'cap', cap: 0 },
];

// Find a template by id.
export function findTemplate(id: string): ChallengeTemplate | undefined {
  return CHALLENGE_TEMPLATES.find((t) => t.id === id);
}

// ISO yyyy-mm-dd for "iso + n days" (used to find the window's end date).
function isoPlus(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export interface ChallengeStatus {
  template: ChallengeTemplate;
  status: 'active' | 'won' | 'failed';
  daysElapsed: number; // 1..duration
  daysLeft: number;
  progressPct: number; // 0..100 by days
  detail: string; // a short live line ("₹320 / ₹500 spent")
}

// Judge one challenge against the expenses. ISO date strings compare correctly, so we
// just keep expenses whose date is inside [start, end].
export function evaluateChallenge(ch: Challenge, expenses: Expense[], customCats: Category[] = []): ChallengeStatus | null {
  const template = findTemplate(ch.templateId);
  if (!template) return null;

  const endIso = isoPlus(ch.startDate, template.durationDays - 1);
  const windowExp = expenses.filter((e) => e.date >= ch.startDate && e.date <= endIso);

  const elapsedRaw = daysSince(ch.startDate) + 1; // day 1 = start day itself
  const daysElapsed = Math.max(1, Math.min(elapsedRaw, template.durationDays));
  const windowOver = elapsedRaw >= template.durationDays;
  const progressPct = Math.round((daysElapsed / template.durationDays) * 100);

  let failed = false;
  let detail = '';

  if (template.kind === 'cap') {
    const spent = windowExp.reduce((s, e) => s + Number(e.amount), 0);
    const cap = template.cap ?? 0;
    failed = spent > cap;
    detail = cap === 0 ? (spent > 0 ? `oops, ₹${Math.round(spent)} kharch ho gaya` : 'abhi tak ₹0 — slay 💚') : `${Math.round(spent)} / ${cap} kharch`;
  } else {
    // no_group: any expense in a forbidden group breaks it
    const groups = template.groups ?? [];
    const slip = windowExp.find((e) => groups.includes(findCat(e.catId, customCats).group));
    failed = !!slip;
    detail = slip ? `oops, ${findCat(slip.catId, customCats).name} pe kharch ho gaya` : 'abhi tak clean 💚';
  }

  let status: ChallengeStatus['status'] = 'active';
  if (failed) status = 'failed';
  else if (windowOver) status = 'won';

  return { template, status, daysElapsed, daysLeft: Math.max(0, template.durationDays - daysElapsed), progressPct, detail };
}
