// useAppContext.tsx — MAIN STATE MANAGEMENT. The single source of truth for app data.
// Loads everything from storage once on launch, then every screen reads/writes through this hook.
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Category, Expense, Recurring } from '../types';
import { KEYS, clearAll, loadJSON, loadString, saveJSON, saveString } from '../storage';
import { genId } from '../utils';

// Everything the app shares. Actions persist to storage AND update state so the UI refreshes.
interface AppState {
  loading: boolean; // true until the first load from storage finishes
  onboarded: boolean; // false on first ever launch
  expenses: Expense[];
  recurring: Recurring[];
  customCats: Category[];
  budget: string;
  income: string;
  splurgeFund: string;
  completeOnboarding: () => Promise<void>;
  saveOnboarding: (data: { income: string; budget: string; splurgeFund: string }) => Promise<void>;
  addExpense: (e: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, changes: Omit<Expense, 'id'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  setBudgetValue: (v: string) => Promise<void>;
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
  const [customCats, setCustomCats] = useState<Category[]>([]);
  const [budget, setBudget] = useState('');
  const [income, setIncome] = useState('');
  const [splurgeFund, setSplurgeFund] = useState('');

  // Pull all persisted data from storage into state.
  const reload = useCallback(async () => {
    const [exp, rec, cc, bud, inc, spl, onb] = await Promise.all([
      loadJSON<Expense[]>(KEYS.expenses, []),
      loadJSON<Recurring[]>(KEYS.recurring, []),
      loadJSON<Category[]>(KEYS.customCats, []),
      loadString(KEYS.budget),
      loadString(KEYS.income),
      loadString(KEYS.splurgeFund),
      loadString(KEYS.onboarded),
    ]);
    setExpenses(exp);
    setRecurring(rec);
    setCustomCats(cc);
    setBudget(bud);
    setIncome(inc);
    setSplurgeFund(spl);
    setOnboarded(onb === 'true');
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

  // Remove an expense by id and persist.
  const deleteExpense = useCallback(
    async (id: string) => {
      const next = expenses.filter((x) => x.id !== id);
      setExpenses(next);
      await saveJSON(KEYS.expenses, next);
    },
    [expenses]
  );

  // Save the monthly budget (stored as a plain string, like the prototype).
  const setBudgetValue = useCallback(async (v: string) => {
    setBudget(v);
    await saveString(KEYS.budget, v);
  }, []);

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
    customCats,
    budget,
    income,
    splurgeFund,
    completeOnboarding,
    saveOnboarding,
    addExpense,
    updateExpense,
    deleteExpense,
    setBudgetValue,
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
