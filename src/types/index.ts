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
