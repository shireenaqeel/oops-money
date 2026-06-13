// types/index.ts — all shared TypeScript interfaces for the app.
// Every other file imports its data shapes from here, so types stay consistent.

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

// A recurring monthly bill (rent, subscriptions, etc.).
export interface Recurring {
  id: string;
  name: string;
  amount: number;
  catId: string;
  color: string;
  day: number; // day of month it's due (1-31)
}
