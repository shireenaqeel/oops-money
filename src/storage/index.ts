// storage/index.ts — the ONLY file that talks to AsyncStorage (the phone's local storage).
// No backend, no cloud. All data stays on the device. Keep every getItem/setItem call inside this file.
import AsyncStorage from '@react-native-async-storage/async-storage';

// All storage keys. Prefix "om_" = oops money, so we never clash with other apps.
export const KEYS = {
  expenses: 'om_expenses',
  recurring: 'om_recurring',
  impulse: 'om_impulse',
  letters: 'om_letters',
  customCats: 'om_custom_cats',
  budget: 'om_budget',
  income: 'om_income',
  splurgeFund: 'om_splurge_fund',
  onboarded: 'om_onboarded',
  nightShield: 'om_night_shield', // late-night shopping shield on/off (V2)
  periodStarts: 'om_period_starts', // logged period start dates (V2 cycle tracking)
  cycleLength: 'om_cycle_length', // average cycle length in days (V2)
  catBudgets: 'om_cat_budgets', // per-category monthly limits { catId: amount } (V2)
  goals: 'om_goals', // savings goals / sapna jar (V2)
  billReminders: 'om_bill_reminders', // bill reminder notifications on/off (V2)
  bestieName: 'om_bestie_name', // accountability bestie's name (V2, local)
  bestiePhone: 'om_bestie_phone', // bestie's WhatsApp/SMS number, optional (V2, local)
  theme: 'om_theme', // selected colour theme id (V2)
  wishlist: 'om_wishlist', // manifest board wishlist items (V3)
  challenges: 'om_challenges', // money challenges taken on (V3)
  events: 'om_events', // festival/shaadi season event budgets (V3)
} as const;

// Read + JSON-parse a value, returning the fallback if it's missing or corrupted.
export async function loadJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw != null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

// JSON-stringify + save a value.
export async function saveJSON(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// Read a plain string value (used for budget/income/flags).
export async function loadString(key: string, fallback = ''): Promise<string> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw != null ? raw : fallback;
  } catch {
    return fallback;
  }
}

// Save a plain string value.
export async function saveString(key: string, value: string): Promise<void> {
  await AsyncStorage.setItem(key, value);
}

// Wipe ALL app data (only our keys). Used by the Settings reset option.
export async function clearAll(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}

// A full picture of the app's data: every key mapped to its raw stored string (or null if unset).
// Used by cloud sync to upload/download everything at once.
export type Snapshot = Record<string, string | null>;

// Read every app key into one object — the parcel we upload to the cloud.
export async function exportSnapshot(): Promise<Snapshot> {
  const keys = Object.values(KEYS);
  const entries = await AsyncStorage.multiGet(keys);
  const snap: Snapshot = {};
  for (const [k, v] of entries) snap[k] = v;
  return snap;
}

// Write a downloaded snapshot back into storage, replacing local data.
// Only our own keys are touched (anything unknown in the parcel is ignored for safety).
export async function importSnapshot(snap: Snapshot): Promise<void> {
  const known = new Set<string>(Object.values(KEYS));
  const toSet: [string, string][] = [];
  const toRemove: string[] = [];
  for (const key of known) {
    const val = snap[key];
    if (val == null) toRemove.push(key);
    else toSet.push([key, val]);
  }
  if (toSet.length) await AsyncStorage.multiSet(toSet);
  if (toRemove.length) await AsyncStorage.multiRemove(toRemove);
}
