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
