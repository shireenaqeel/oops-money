// utils/index.ts — pure formatting / calculation / id helpers. No UI, no state, no storage.
import { Category } from '../types';
import { CATS, MERCHANT_MAP } from '../constants/categories';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Turn a Date into an ISO yyyy-mm-dd string using LOCAL time (not UTC).
function toISO(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

// Today's date as yyyy-mm-dd.
export function getToday(): string {
  return toISO(new Date());
}

// Yesterday's date as yyyy-mm-dd.
export function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toISO(d);
}

// Format a number as Indian-grouped rupees, no decimals. e.g. 150000 -> "₹1,50,000".
// Done manually (not toLocaleString) because React Native's Hermes engine has flaky locale support.
export function fmtINR(n: number): string {
  const value = Math.round(Number(n) || 0);
  const sign = value < 0 ? '-' : '';
  const digits = String(Math.abs(value));
  let grouped: string;
  if (digits.length <= 3) {
    grouped = digits;
  } else {
    const last3 = digits.slice(-3);
    const rest = digits.slice(0, -3);
    // group the remaining digits in pairs (Indian system), then attach the last 3
    grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
  }
  return '₹' + sign + grouped;
}

// Short Indian money form for compact spots: ₹2.3K, ₹1.5L, ₹1.2Cr.
export function fmtINRShort(n: number): string {
  const value = Math.round(Number(n) || 0);
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 10000000) return '₹' + sign + trim(abs / 10000000) + 'Cr';
  if (abs >= 100000) return '₹' + sign + trim(abs / 100000) + 'L';
  if (abs >= 1000) return '₹' + sign + trim(abs / 1000) + 'K';
  return '₹' + sign + abs;
}

// Round to 1 decimal, but drop a trailing ".0" (e.g. 2 not 2.0, 1.5 stays 1.5).
function trim(x: number): string {
  return (Math.round(x * 10) / 10).toString();
}

// Translate an amount into relatable "broke math" units — coffees, days of salary, etc. (Feature 12).
export function brokeMath(amount: number, monthlyIncome: number): string[] {
  if (amount <= 0) return [];
  const lines: string[] = [];
  const coffees = Math.round(amount / 250);
  if (coffees >= 1) lines.push(`☕ ${coffees} coffee${coffees > 1 ? 's' : ''}`);
  if (monthlyIncome > 0) {
    const days = amount / (monthlyIncome / 30);
    lines.push(`💼 ${trim(days)} din ki kamai`);
  }
  const netflix = amount / 649;
  if (netflix >= 1) lines.push(`📺 ${trim(netflix)} mahine Netflix`);
  const autos = Math.round(amount / 50);
  if (autos >= 1) lines.push(`🛺 ${autos} auto ride${autos > 1 ? 's' : ''}`);
  return lines;
}

// Friendly date label from an ISO date: "Today", "Yesterday", or "12 Jun".
export function fmtDateLabel(iso: string): string {
  if (iso === getToday()) return 'Today';
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (iso === toISO(y)) return 'Yesterday';
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

// How many whole days ago an ISO date was (0 = today, 7 = a week ago).
export function daysSince(iso: string): number {
  const then = new Date(iso + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.floor((now.getTime() - then.getTime()) / 86400000);
}

// True if the current local time is inside the late-night danger window (11pm–4am).
// Used by the late-night shopping shield (V2) to intercept impulse spends.
export function isLateNight(d: Date = new Date()): boolean {
  const h = d.getHours();
  return h >= 23 || h < 4;
}

// Generate a short unique id for new records.
export function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ───────── Voice logging (V2) ─────────
// The keyboard's mic turns speech into text; THESE helpers turn that text into a spend.
// e.g. "do hazaar Myntra" → { amount: 2000, catId: 'fashion' }.

// Small Hinglish/English number-word map (1–10) for spoken amounts like "paanch sau".
const NUM_WORDS: Record<string, number> = {
  ek: 1, do: 2, teen: 3, char: 4, chaar: 4, paanch: 5, panch: 5, chhe: 6, che: 6, saat: 7, aath: 8, nau: 9, das: 10,
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

// Parse a rupee amount out of spoken text. Handles digits ("500", "1,500", "2k"),
// multiplier words (sau/hundred, hazaar/thousand, lakh) and combos ("do hazaar paanch sau" = 2500).
export function parseSpokenAmount(text: string): number {
  const tokens = text.toLowerCase().replace(/,/g, '').split(/\s+/);
  let total = 0; // sum of completed "chunks" (e.g. the 2000 in "2 hazaar 500")
  let current = 0; // the number being built before its multiplier lands
  let found = false;
  for (const w of tokens) {
    const kMatch = w.match(/^(\d+(?:\.\d+)?)k$/); // "2k", "1.5k"
    if (kMatch) {
      total += parseFloat(kMatch[1]) * 1000;
      current = 0;
      found = true;
      continue;
    }
    const digit = /^\d+(?:\.\d+)?$/.test(w) ? parseFloat(w) : NUM_WORDS[w] ?? null;
    if (digit != null) {
      current = current === 0 ? digit : current + digit;
      found = true;
      continue;
    }
    let mult = 0;
    if (/^(lakh|lac)$/.test(w)) mult = 100000;
    else if (/^(hazaar|hazar|thousand)$/.test(w)) mult = 1000;
    else if (/^(sau|hundred)$/.test(w)) mult = 100;
    if (mult) {
      total += (current === 0 ? 1 : current) * mult;
      current = 0;
      found = true;
    }
  }
  return found ? Math.round(total + current) : 0;
}

// Guess a category id from spoken text: merchant names first (Swiggy→food), then category labels.
export function parseSpokenCategory(text: string, customCats: Category[] = []): string | null {
  const t = text.toLowerCase();
  for (const m of MERCHANT_MAP) if (m.test.test(t)) return m.catId;
  for (const c of [...CATS, ...customCats]) {
    // strip the emoji + punctuation off the label, keep words longer than 2 chars
    const words = c.name.replace(/[^\p{L}\s]/gu, ' ').toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    if (words.some((w) => t.includes(w))) return c.id;
  }
  return null;
}

// Turn one spoken phrase into the pieces of an expense (amount + best-guess category + raw note).
export function parseSpokenExpense(text: string, customCats: Category[] = []): { amount: number; catId: string | null; note: string } {
  return { amount: parseSpokenAmount(text), catId: parseSpokenCategory(text, customCats), note: text.trim() };
}
