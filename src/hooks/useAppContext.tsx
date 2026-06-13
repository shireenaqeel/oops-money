// useAppContext.tsx — MAIN STATE MANAGEMENT. The single source of truth for app data.
// Loads everything from storage once on launch, then every screen reads/writes through this hook.
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Category, Expense, ImpulseItem, Letter, Recurring } from '../types';
import { KEYS, clearAll, loadJSON, loadString, saveJSON, saveString } from '../storage';
import { PASTEL_COLORS, findCat } from '../constants/categories';
import { genId, getToday } from '../utils';

// Everything the app shares. Actions persist to storage AND update state so the UI refreshes.
interface AppState {
  loading: boolean; // true until the first load from storage finishes
  onboarded: boolean; // false on first ever launch
  expenses: Expense[];
  recurring: Recurring[];
  impulse: ImpulseItem[];
  letters: Letter[];
  customCats: Category[];
  budget: string;
  income: string;
  splurgeFund: string;
  nightShield: boolean; // late-night shopping shield on/off (V2), default on
  periodStarts: string[]; // logged period start dates, ISO (V2 cycle tracking)
  cycleLength: number; // average cycle length in days (V2), default 28
  completeOnboarding: () => Promise<void>;
  saveOnboarding: (data: { income: string; budget: string; splurgeFund: string }) => Promise<void>;
  addExpense: (e: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, changes: Omit<Expense, 'id'>) => Promise<void>;
  rateExpense: (id: string, regret: 'worth' | 'meh' | 'regret') => Promise<void>;
  bulkAddExpenses: (items: Omit<Expense, 'id'>[]) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addImpulse: (name: string, amount: number, note: string) => Promise<void>;
  buryImpulse: (id: string) => Promise<void>;
  releaseImpulse: (id: string) => Promise<void>;
  rejailImpulse: (id: string) => Promise<void>;
  deleteImpulse: (id: string) => Promise<void>;
  addRecurring: (name: string, amount: number, catId: string, day: number) => Promise<void>;
  deleteRecurring: (id: string) => Promise<void>;
  logRecurring: (id: string) => Promise<void>;
  addLetter: (text: string) => Promise<void>;
  deleteLetter: (id: string) => Promise<void>;
  setBudgetValue: (v: string) => Promise<void>;
  setNightShield: (on: boolean) => Promise<void>;
  logPeriodStart: (dateIso: string) => Promise<void>;
  removePeriodStart: (dateIso: string) => Promise<void>;
  setCycleLength: (days: number) => Promise<void>;
  addCustomCat: (name: string, emoji: string) => Promise<Category>;
  deleteCustomCat: (id: string) => Promise<void>;
  resetAll: () => Promise<void>;
  reload: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

// Wraps the whole app (in App.tsx). Loads persisted data and exposes state + actions.
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [onboarded, setOnboarded] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [recurring, setRecurring] = useState<Recurring[]>([]);
  const [impulse, setImpulse] = useState<ImpulseItem[]>([]);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [customCats, setCustomCats] = useState<Category[]>([]);
  const [budget, setBudget] = useState('');
  const [income, setIncome] = useState('');
  const [splurgeFund, setSplurgeFund] = useState('');
  const [nightShield, setNightShieldState] = useState(true);
  const [periodStarts, setPeriodStarts] = useState<string[]>([]);
  const [cycleLength, setCycleLengthState] = useState(28);

  // Pull all persisted data from storage into state.
  const reload = useCallback(async () => {
    const [exp, rec, imp, ltrs, cc, bud, inc, spl, onb, shield, pStarts, cLen] = await Promise.all([
      loadJSON<Expense[]>(KEYS.expenses, []),
      loadJSON<Recurring[]>(KEYS.recurring, []),
      loadJSON<ImpulseItem[]>(KEYS.impulse, []),
      loadJSON<Letter[]>(KEYS.letters, []),
      loadJSON<Category[]>(KEYS.customCats, []),
      loadString(KEYS.budget),
      loadString(KEYS.income),
      loadString(KEYS.splurgeFund),
      loadString(KEYS.onboarded),
      loadString(KEYS.nightShield),
      loadJSON<string[]>(KEYS.periodStarts, []),
      loadString(KEYS.cycleLength),
    ]);
    setExpenses(exp);
    setRecurring(rec);
    setImpulse(imp);
    setLetters(ltrs);
    setCustomCats(cc);
    setBudget(bud);
    setIncome(inc);
    setSplurgeFund(spl);
    setOnboarded(onb === 'true');
    setNightShieldState(shield !== 'false'); // default ON unless explicitly turned off
    setPeriodStarts(pStarts);
    setCycleLengthState(parseInt(cLen, 10) || 28); // default 28-day cycle
  }, []);

  // On first mount, load everything, then drop the loading flag.
  useEffect(() => {
    (async () => {
      await reload();
      setLoading(false);
    })();
  }, [reload]);

  // Mark onboarding finished and remember it forever.
  const completeOnboarding = useCallback(async () => {
    await saveString(KEYS.onboarded, 'true');
    setOnboarded(true);
  }, []);

  // Save all onboarding answers at once (income, budget, splurge fund) and mark onboarding complete.
  const saveOnboarding = useCallback(
    async (data: { income: string; budget: string; splurgeFund: string }) => {
      setIncome(data.income);
      setBudget(data.budget);
      setSplurgeFund(data.splurgeFund);
      await Promise.all([
        saveString(KEYS.income, data.income),
        saveString(KEYS.budget, data.budget),
        saveString(KEYS.splurgeFund, data.splurgeFund),
        saveString(KEYS.onboarded, 'true'),
      ]);
      setOnboarded(true);
    },
    []
  );

  // Add a new expense to the top of the list and persist.
  const addExpense = useCallback(
    async (e: Omit<Expense, 'id'>) => {
      const next = [{ ...e, id: genId() }, ...expenses];
      setExpenses(next);
      await saveJSON(KEYS.expenses, next);
    },
    [expenses]
  );

  // Edit an existing expense (keeps its id) and persist.
  const updateExpense = useCallback(
    async (id: string, changes: Omit<Expense, 'id'>) => {
      const next = expenses.map((e) => (e.id === id ? { ...changes, id } : e));
      setExpenses(next);
      await saveJSON(KEYS.expenses, next);
    },
    [expenses]
  );

  // Record the 7-day "was it worth it?" verdict on an expense.
  const rateExpense = useCallback(
    async (id: string, regret: 'worth' | 'meh' | 'regret') => {
      const next = expenses.map((e) => (e.id === id ? { ...e, regret } : e));
      setExpenses(next);
      await saveJSON(KEYS.expenses, next);
    },
    [expenses]
  );

  // Add many expenses at once (used by CSV import). Newest on top.
  const bulkAddExpenses = useCallback(
    async (items: Omit<Expense, 'id'>[]) => {
      const withIds = items.map((it) => ({ ...it, id: genId() }));
      const next = [...withIds, ...expenses];
      setExpenses(next);
      await saveJSON(KEYS.expenses, next);
    },
    [expenses]
  );

  // Remove an expense by id and persist.
  const deleteExpense = useCallback(
    async (id: string) => {
      const next = expenses.filter((x) => x.id !== id);
      setExpenses(next);
      await saveJSON(KEYS.expenses, next);
    },
    [expenses]
  );

  // Put a new tempting item into impulse jail (status "jailed", 24h clock starts now).
  const addImpulse = useCallback(
    async (name: string, amount: number, note: string) => {
      const item: ImpulseItem = { id: genId(), name, amount, note: note || undefined, createdAt: Date.now(), status: 'jailed' };
      const next = [item, ...impulse];
      setImpulse(next);
      await saveJSON(KEYS.impulse, next);
    },
    [impulse]
  );

  // Change an impulse item's status (bury = resisted, release = gave in) and persist.
  const setImpulseStatus = useCallback(
    async (id: string, status: 'released' | 'buried') => {
      const next = impulse.map((i) => (i.id === id ? { ...i, status, decidedAt: Date.now() } : i));
      setImpulse(next);
      await saveJSON(KEYS.impulse, next);
    },
    [impulse]
  );

  // Resist the urge — money saved. Goes to the graveyard.
  const buryImpulse = useCallback((id: string) => setImpulseStatus(id, 'buried'), [setImpulseStatus]);

  // Give in — you bought it. Marks released AND logs a real expense so it counts against the budget.
  const releaseImpulse = useCallback(
    async (id: string) => {
      const item = impulse.find((i) => i.id === id);
      const nextImpulse = impulse.map((i) => (i.id === id ? { ...i, status: 'released' as const, decidedAt: Date.now() } : i));
      setImpulse(nextImpulse);
      await saveJSON(KEYS.impulse, nextImpulse);
      if (item) {
        const cat = findCat('other', customCats);
        const exp: Expense = { id: genId(), amount: item.amount, catId: 'other', note: `${item.name} (impulse)`, date: getToday(), color: cat.color, isSplurge: true };
        const nextExp = [exp, ...expenses];
        setExpenses(nextExp);
        await saveJSON(KEYS.expenses, nextExp);
      }
    },
    [impulse, expenses, customCats]
  );

  // Dig a buried item back up and restart its 24h clock.
  const rejailImpulse = useCallback(
    async (id: string) => {
      const next = impulse.map((i) => (i.id === id ? { ...i, status: 'jailed' as const, createdAt: Date.now(), decidedAt: undefined } : i));
      setImpulse(next);
      await saveJSON(KEYS.impulse, next);
    },
    [impulse]
  );

  // Remove an impulse item entirely.
  const deleteImpulse = useCallback(
    async (id: string) => {
      const next = impulse.filter((i) => i.id !== id);
      setImpulse(next);
      await saveJSON(KEYS.impulse, next);
    },
    [impulse]
  );

  // Add a recurring monthly bill (rent, subscriptions, etc.).
  const addRecurring = useCallback(
    async (name: string, amount: number, catId: string, day: number) => {
      const cat = findCat(catId, customCats);
      const item: Recurring = { id: genId(), name, amount, catId, color: cat.color, day };
      const next = [...recurring, item];
      setRecurring(next);
      await saveJSON(KEYS.recurring, next);
    },
    [recurring, customCats]
  );

  // Remove a recurring bill.
  const deleteRecurring = useCallback(
    async (id: string) => {
      const next = recurring.filter((r) => r.id !== id);
      setRecurring(next);
      await saveJSON(KEYS.recurring, next);
    },
    [recurring]
  );

  // One-tap log a bill as today's expense (without deleting the bill).
  const logRecurring = useCallback(
    async (id: string) => {
      const rec = recurring.find((r) => r.id === id);
      if (!rec) return;
      const exp: Expense = { id: genId(), amount: rec.amount, catId: rec.catId, note: `${rec.name} (recurring)`, date: getToday(), color: rec.color };
      const next = [exp, ...expenses];
      setExpenses(next);
      await saveJSON(KEYS.expenses, next);
    },
    [recurring, expenses]
  );

  // Add a letter to your future self (newest first).
  const addLetter = useCallback(
    async (text: string) => {
      const item: Letter = { id: genId(), text, createdAt: Date.now() };
      const next = [item, ...letters];
      setLetters(next);
      await saveJSON(KEYS.letters, next);
    },
    [letters]
  );

  // Delete a letter.
  const deleteLetter = useCallback(
    async (id: string) => {
      const next = letters.filter((l) => l.id !== id);
      setLetters(next);
      await saveJSON(KEYS.letters, next);
    },
    [letters]
  );

  // Save the monthly budget (stored as a plain string, like the prototype).
  const setBudgetValue = useCallback(async (v: string) => {
    setBudget(v);
    await saveString(KEYS.budget, v);
  }, []);

  // Turn the late-night shopping shield on/off and remember the choice.
  const setNightShield = useCallback(async (on: boolean) => {
    setNightShieldState(on);
    await saveString(KEYS.nightShield, on ? 'true' : 'false');
  }, []);

  // Log a period start date (kept unique, newest-first ordering handled at read time).
  const logPeriodStart = useCallback(
    async (dateIso: string) => {
      const next = [...new Set([dateIso, ...periodStarts])];
      setPeriodStarts(next);
      await saveJSON(KEYS.periodStarts, next);
    },
    [periodStarts]
  );

  // Remove a logged period start date.
  const removePeriodStart = useCallback(
    async (dateIso: string) => {
      const next = periodStarts.filter((d) => d !== dateIso);
      setPeriodStarts(next);
      await saveJSON(KEYS.periodStarts, next);
    },
    [periodStarts]
  );

  // Save the average cycle length (days) used for predictions.
  const setCycleLength = useCallback(async (days: number) => {
    const safe = Math.max(20, Math.min(45, Math.round(days) || 28)); // keep it sane
    setCycleLengthState(safe);
    await saveString(KEYS.cycleLength, String(safe));
  }, []);

  // Create a new custom category (emoji + name), auto-assign a colour, save, and return it.
  const addCustomCat = useCallback(
    async (name: string, emoji: string): Promise<Category> => {
      const color = PASTEL_COLORS[customCats.length % PASTEL_COLORS.length];
      const cat: Category = { id: genId(), name: `${emoji} ${name}`, color, bg: '#FDF8FF', group: 'Custom' };
      const next = [...customCats, cat];
      setCustomCats(next);
      await saveJSON(KEYS.customCats, next);
      return cat;
    },
    [customCats]
  );

  // Remove a custom category and persist.
  const deleteCustomCat = useCallback(
    async (id: string) => {
      const next = customCats.filter((c) => c.id !== id);
      setCustomCats(next);
      await saveJSON(KEYS.customCats, next);
    },
    [customCats]
  );

  // Wipe everything and return to the onboarding screen (testing/reset helper).
  const resetAll = useCallback(async () => {
    await clearAll();
    await reload(); // storage now empty → onboarded becomes false again
  }, [reload]);

  const value: AppState = {
    loading,
    onboarded,
    expenses,
    recurring,
    impulse,
    letters,
    customCats,
    budget,
    income,
    splurgeFund,
    nightShield,
    periodStarts,
    cycleLength,
    completeOnboarding,
    saveOnboarding,
    addExpense,
    updateExpense,
    rateExpense,
    bulkAddExpenses,
    deleteExpense,
    addImpulse,
    buryImpulse,
    releaseImpulse,
    rejailImpulse,
    deleteImpulse,
    addRecurring,
    deleteRecurring,
    logRecurring,
    addLetter,
    deleteLetter,
    setBudgetValue,
    setNightShield,
    logPeriodStart,
    removePeriodStart,
    setCycleLength,
    addCustomCat,
    deleteCustomCat,
    resetAll,
    reload,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Read app state anywhere. Throws if used outside <AppProvider> so mistakes show up immediately.
export function useAppContext(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside <AppProvider>');
  return ctx;
}
