// utils/index.ts — pure formatting / calculation / id helpers. No UI, no state, no storage.

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

// Generate a short unique id for new records.
export function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
