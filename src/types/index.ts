// types/index.ts — all shared TypeScript interfaces for the app.
// Every other file imports its data shapes from here, so types stay consistent.

// A logged income entry (salary, freelance, gift, etc.) — money IN, kept separate from expenses.
export interface Income {
  id: string;
  amount: number;
  source: string; // links to an INCOME_SOURCES id
  note: string;
  date: string; // ISO yyyy-mm-dd
  color: string; // cached source colour for quick rendering
}

// A spending category (built-in or custom). Emoji is the first token of `name`.
export interface Category {
  id: string;
  name: string; // e.g. "💄 Makeup" — emoji + label together
  color: string; // pill colour when selected
  bg: string; // soft background tint
  group: string; // group name, e.g. "Beauty"
}

// A single logged expense.
export interface Expense {
  id: string;
  amount: number;
  catId: string; // links to a Category.id
  note: string;
  date: string; // ISO yyyy-mm-dd
  color: string; // cached category colour for quick rendering
  imported?: boolean; // true if it came from a CSV import (feature 17)
  mood?: string; // mood tag at time of spend (feature 7)
  isSplurge?: boolean; // counted against the splurge fund (feature 4)
  regret?: 'worth' | 'meh' | 'regret'; // 7-day post-purchase verdict (feature 9)
  receiptUri?: string; // attached payment screenshot, saved on-device (V2 screenshot add)
  eventId?: string; // tags this spend to a festival/shaadi event budget (V3)
}

// A temporary "season" budget — Diwali, a friend's wedding, a trip — tracked separately (V3).
// Expenses tagged with this event's id count toward its budget.
export interface EventBudget {
  id: string;
  name: string;
  emoji: string;
  budget: number;
  startDate: string; // ISO yyyy-mm-dd
  endDate: string; // ISO yyyy-mm-dd
  createdAt: number; // ms timestamp
}

// An item put in "impulse jail" — something you're tempted to buy but are waiting on.
export interface ImpulseItem {
  id: string;
  name: string;
  amount: number;
  note?: string; // why you want it (optional)
  createdAt: number; // ms timestamp when it was jailed
  status: 'jailed' | 'released' | 'buried'; // jailed = waiting, released = you bought it, buried = you resisted
  decidedAt?: number; // ms timestamp of the release/bury decision
}

// A note you write to your future self (shown during impulse jail). Feature 11.
export interface Letter {
  id: string;
  text: string;
  createdAt: number; // ms timestamp
}

// A savings goal — the "sapna jar" (V2). `saved` grows as she puts money aside.
export interface Goal {
  id: string;
  name: string;
  emoji: string;
  target: number; // rupees she's aiming for
  saved: number; // rupees stashed so far
  createdAt: number; // ms timestamp
}

// A "manifest board" wish — something you want, with save-up math instead of impulse-buying (V3).
export interface WishItem {
  id: string;
  name: string;
  emoji: string;
  price: number; // what it costs
  perDay: number; // how much you'll set aside each day toward it
  createdAt: number; // ms timestamp
}

// A money challenge the user took on (V3). The template id + start date is all we store;
// win/fail is computed live from expenses so it's always accurate.
export interface Challenge {
  id: string;
  templateId: string; // links to a CHALLENGE_TEMPLATES entry
  startDate: string; // ISO yyyy-mm-dd when she started it
}

// Per-category monthly spending limits, keyed by category id (V2).
export type CatBudgets = Record<string, number>;

// A recurring monthly bill (rent, subscriptions, etc.).
export interface Recurring {
  id: string;
  name: string;
  amount: number;
  catId: string;
  color: string;
  day: number; // day of month it's due (1-31)
  lastHandledDue?: string; // ISO yyyy-mm-dd of the due occurrence the user last logged/skipped (so the
  // due-day prompt doesn't ask twice for the same month). Undefined = never handled.
}
