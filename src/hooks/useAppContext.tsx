// useAppContext.tsx — MAIN STATE MANAGEMENT. The single source of truth for app data.
// Loads everything from storage once on launch, then every screen reads/writes through this hook.
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Category, Expense, Income, Goal, CatBudgets, ImpulseItem, Letter, Recurring, WishItem, Challenge, EventBudget } from '../types';
import { KEYS, clearAll, loadJSON, loadString, saveJSON, saveString } from '../storage';
import { PASTEL_COLORS, CATS, findCat, installCatOverrides, CatOverride } from '../constants/categories';
import { genId, getToday } from '../utils';
import { dueOccurrenceISO } from '../utils/recurring';
import { ensureNotifPermission, scheduleBillReminders, cancelBillReminders } from '../utils/notifications';

// Everything the app shares. Actions persist to storage AND update state so the UI refreshes.
interface AppState {
  loading: boolean; // true until the first load from storage finishes
  onboarded: boolean; // false on first ever launch
  expenses: Expense[];
  incomes: Income[];
  recurring: Recurring[];
  impulse: ImpulseItem[];
  letters: Letter[];
  customCats: Category[];
  catOverrides: Record<string, CatOverride>; // edits/deletes to built-in categories
  budget: string;
  income: string;
  splurgeFund: string;
  nightShield: boolean; // late-night shopping shield on/off (V2), default on
  periodStarts: string[]; // logged period start dates, ISO (V2 cycle tracking)
  cycleLength: number; // average cycle length in days (V2), default 28
  catBudgets: CatBudgets; // per-category monthly limits (V2)
  goals: Goal[]; // savings goals / sapna jar (V2)
  billReminders: boolean; // bill reminder notifications on/off (V2)
  bestieName: string; // accountability bestie's name (V2, local)
  bestiePhone: string; // bestie's WhatsApp/SMS number, optional (V2, local)
  wishlist: WishItem[]; // manifest board / wishlist (V3)
  challenges: Challenge[]; // money challenges taken on (V3)
  events: EventBudget[]; // festival/shaadi season budgets (V3)
  completeOnboarding: () => Promise<void>;
  saveOnboarding: (data: { income: string; budget: string; splurgeFund: string }) => Promise<void>;
  addExpense: (e: Omit<Expense, 'id'>) => Promise<void>;
  addIncome: (i: Omit<Income, 'id'>) => Promise<void>;
  updateIncome: (id: string, changes: Omit<Income, 'id'>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
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
  logRecurring: (id: string, dateISO?: string) => Promise<void>;
  resolveRecurring: (id: string, occISO: string, paid: boolean) => Promise<void>; // answer the due-day prompt
  addLetter: (text: string) => Promise<void>;
  deleteLetter: (id: string) => Promise<void>;
  setBudgetValue: (v: string) => Promise<void>;
  setNightShield: (on: boolean) => Promise<void>;
  logPeriodStart: (dateIso: string) => Promise<void>;
  removePeriodStart: (dateIso: string) => Promise<void>;
  setCycleLength: (days: number) => Promise<void>;
  setCatBudget: (catId: string, amount: number) => Promise<void>;
  removeCatBudget: (catId: string) => Promise<void>;
  addGoal: (name: string, emoji: string, target: number) => Promise<void>;
  addToGoal: (id: string, amount: number) => Promise<void>;
  withdrawFromGoal: (id: string, amount: number) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  setBillReminders: (on: boolean) => Promise<boolean>; // returns false if permission denied
  setBestie: (name: string, phone: string) => Promise<void>;
  addWish: (name: string, emoji: string, price: number, perDay: number) => Promise<void>;
  updateWishPerDay: (id: string, perDay: number) => Promise<void>;
  deleteWish: (id: string) => Promise<void>;
  startChallenge: (templateId: string) => Promise<void>;
  abandonChallenge: (id: string) => Promise<void>;
  addEvent: (name: string, emoji: string, budget: number, startDate: string, endDate: string) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  addCustomCat: (name: string, emoji: string) => Promise<Category>;
  editCategory: (id: string, name: string, emoji: string) => Promise<void>; // edits built-in OR custom
  deleteCategory: (id: string) => Promise<void>; // deletes custom, hides built-in
  resetCategories: () => Promise<void>; // clear all built-in edits/deletes, restore defaults
  resetAll: () => Promise<void>;
  reload: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

// Wraps the whole app (in App.tsx). Loads persisted data and exposes state + actions.
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [onboarded, setOnboarded] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [recurring, setRecurring] = useState<Recurring[]>([]);
  const [impulse, setImpulse] = useState<ImpulseItem[]>([]);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [customCats, setCustomCats] = useState<Category[]>([]);
  const [catOverrides, setCatOverrides] = useState<Record<string, CatOverride>>({});
  const [budget, setBudget] = useState('');
  const [income, setIncome] = useState('');
  const [splurgeFund, setSplurgeFund] = useState('');
  const [nightShield, setNightShieldState] = useState(true);
  const [periodStarts, setPeriodStarts] = useState<string[]>([]);
  const [cycleLength, setCycleLengthState] = useState(28);
  const [catBudgets, setCatBudgets] = useState<CatBudgets>({});
  const [goals, setGoals] = useState<Goal[]>([]);
  const [billReminders, setBillRemindersState] = useState(false);
  const [bestieName, setBestieName] = useState('');
  const [bestiePhone, setBestiePhone] = useState('');
  const [wishlist, setWishlist] = useState<WishItem[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [events, setEvents] = useState<EventBudget[]>([]);

  // Pull all persisted data from storage into state.
  const reload = useCallback(async () => {
    const [exp, incs, rec, imp, ltrs, cc, catOv, bud, inc, spl, onb, shield, pStarts, cLen, cBudgets, gls, billRem, bName, bPhone, wish, chals, evts] = await Promise.all([
      loadJSON<Expense[]>(KEYS.expenses, []),
      loadJSON<Income[]>(KEYS.incomes, []),
      loadJSON<Recurring[]>(KEYS.recurring, []),
      loadJSON<ImpulseItem[]>(KEYS.impulse, []),
      loadJSON<Letter[]>(KEYS.letters, []),
      loadJSON<Category[]>(KEYS.customCats, []),
      loadJSON<Record<string, CatOverride>>(KEYS.catOverrides, {}),
      loadString(KEYS.budget),
      loadString(KEYS.income),
      loadString(KEYS.splurgeFund),
      loadString(KEYS.onboarded),
      loadString(KEYS.nightShield),
      loadJSON<string[]>(KEYS.periodStarts, []),
      loadString(KEYS.cycleLength),
      loadJSON<CatBudgets>(KEYS.catBudgets, {}),
      loadJSON<Goal[]>(KEYS.goals, []),
      loadString(KEYS.billReminders),
      loadString(KEYS.bestieName),
      loadString(KEYS.bestiePhone),
      loadJSON<WishItem[]>(KEYS.wishlist, []),
      loadJSON<Challenge[]>(KEYS.challenges, []),
      loadJSON<EventBudget[]>(KEYS.events, []),
    ]);
    setExpenses(exp);
    setIncomes(incs);
    setRecurring(rec);
    setImpulse(imp);
    setLetters(ltrs);
    setCustomCats(cc);
    installCatOverrides(catOv); // mirror into categories.ts so findCat() sees built-in edits
    setCatOverrides(catOv);
    setBudget(bud);
    setIncome(inc);
    setSplurgeFund(spl);
    setOnboarded(onb === 'true');
    setNightShieldState(shield !== 'false'); // default ON unless explicitly turned off
    setPeriodStarts(pStarts);
    setCycleLengthState(parseInt(cLen, 10) || 28); // default 28-day cycle
    setCatBudgets(cBudgets);
    setGoals(gls);
    setBillRemindersState(billRem === 'true');
    setBestieName(bName);
    setBestiePhone(bPhone);
    setWishlist(wish);
    setChallenges(chals);
    setEvents(evts);
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

  // Add a new income entry (money IN) to the top of the list and persist.
  const addIncome = useCallback(
    async (i: Omit<Income, 'id'>) => {
      const next = [{ ...i, id: genId() }, ...incomes];
      setIncomes(next);
      await saveJSON(KEYS.incomes, next);
    },
    [incomes]
  );

  // Edit an existing income (keeps its id) and persist.
  const updateIncome = useCallback(
    async (id: string, changes: Omit<Income, 'id'>) => {
      const next = incomes.map((i) => (i.id === id ? { ...changes, id } : i));
      setIncomes(next);
      await saveJSON(KEYS.incomes, next);
    },
    [incomes]
  );

  // Remove an income by id and persist.
  const deleteIncome = useCallback(
    async (id: string) => {
      const next = incomes.filter((x) => x.id !== id);
      setIncomes(next);
      await saveJSON(KEYS.incomes, next);
    },
    [incomes]
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
      // If the due day already passed THIS month, leave it unhandled so the prompt asks
      // "did you pay on the Xth?". If it's still upcoming, mark last month's occurrence handled
      // so we don't ask about a date from before the bill even existed.
      const now = new Date();
      const lastHandledDue = day > now.getDate() ? dueOccurrenceISO(day, now) : undefined;
      const item: Recurring = { id: genId(), name, amount, catId, color: cat.color, day, lastHandledDue };
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

  // Log a bill as an expense on a chosen date (defaults to today), without deleting the bill.
  // Also marks that date's due occurrence handled so the due-day prompt won't double-ask.
  const logRecurring = useCallback(
    async (id: string, dateISO?: string) => {
      const rec = recurring.find((r) => r.id === id);
      if (!rec) return;
      const date = dateISO ?? getToday();
      const exp: Expense = { id: genId(), amount: rec.amount, catId: rec.catId, note: `${rec.name} (recurring)`, date, color: rec.color };
      const nextExp = [exp, ...expenses];
      setExpenses(nextExp);
      await saveJSON(KEYS.expenses, nextExp);
      const occ = dueOccurrenceISO(rec.day, new Date(date + 'T00:00:00'));
      const nextRec = recurring.map((r) => (r.id === id ? { ...r, lastHandledDue: occ } : r));
      setRecurring(nextRec);
      await saveJSON(KEYS.recurring, nextRec);
    },
    [recurring, expenses]
  );

  // Answer the due-day prompt for a bill: if paid, log it dated to the due day; either way mark
  // that occurrence handled so we don't ask again.
  const resolveRecurring = useCallback(
    async (id: string, occISO: string, paid: boolean) => {
      const rec = recurring.find((r) => r.id === id);
      if (!rec) return;
      if (paid) {
        const exp: Expense = { id: genId(), amount: rec.amount, catId: rec.catId, note: `${rec.name} (recurring)`, date: occISO, color: rec.color };
        const nextExp = [exp, ...expenses];
        setExpenses(nextExp);
        await saveJSON(KEYS.expenses, nextExp);
      }
      const nextRec = recurring.map((r) => (r.id === id ? { ...r, lastHandledDue: occISO } : r));
      setRecurring(nextRec);
      await saveJSON(KEYS.recurring, nextRec);
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

  // Set (or update) a category's monthly limit; 0/blank removes it.
  const setCatBudget = useCallback(
    async (catId: string, amount: number) => {
      const next = { ...catBudgets };
      if (amount > 0) next[catId] = Math.round(amount);
      else delete next[catId];
      setCatBudgets(next);
      await saveJSON(KEYS.catBudgets, next);
    },
    [catBudgets]
  );

  // Remove a category's monthly limit.
  const removeCatBudget = useCallback(
    async (catId: string) => {
      const next = { ...catBudgets };
      delete next[catId];
      setCatBudgets(next);
      await saveJSON(KEYS.catBudgets, next);
    },
    [catBudgets]
  );

  // Create a new savings goal (sapna jar), starting at ₹0 saved.
  const addGoal = useCallback(
    async (name: string, emoji: string, target: number) => {
      const goal: Goal = { id: genId(), name, emoji, target: Math.round(target), saved: 0, createdAt: Date.now() };
      const next = [goal, ...goals];
      setGoals(next);
      await saveJSON(KEYS.goals, next);
    },
    [goals]
  );

  // Stash money into a goal (capped at the target so the jar never "overflows").
  const addToGoal = useCallback(
    async (id: string, amount: number) => {
      const next = goals.map((g) => (g.id === id ? { ...g, saved: Math.min(g.target, g.saved + Math.round(amount)) } : g));
      setGoals(next);
      await saveJSON(KEYS.goals, next);
    },
    [goals]
  );

  // Take money back out of a goal (never below ₹0).
  const withdrawFromGoal = useCallback(
    async (id: string, amount: number) => {
      const next = goals.map((g) => (g.id === id ? { ...g, saved: Math.max(0, g.saved - Math.round(amount)) } : g));
      setGoals(next);
      await saveJSON(KEYS.goals, next);
    },
    [goals]
  );

  // Delete a savings goal.
  const deleteGoal = useCallback(
    async (id: string) => {
      const next = goals.filter((g) => g.id !== id);
      setGoals(next);
      await saveJSON(KEYS.goals, next);
    },
    [goals]
  );

  // Turn bill reminders on/off. Turning on requests notification permission first;
  // returns false (and stays off) if permission is denied so the UI can explain.
  const setBillReminders = useCallback(
    async (on: boolean): Promise<boolean> => {
      if (on) {
        const ok = await ensureNotifPermission();
        if (!ok) return false;
        setBillRemindersState(true);
        await saveString(KEYS.billReminders, 'true');
        await scheduleBillReminders(recurring);
        return true;
      }
      setBillRemindersState(false);
      await saveString(KEYS.billReminders, 'false');
      await cancelBillReminders();
      return true;
    },
    [recurring]
  );

  // Save the accountability bestie's name + optional phone (both local).
  const setBestie = useCallback(async (name: string, phone: string) => {
    setBestieName(name);
    setBestiePhone(phone);
    await Promise.all([saveString(KEYS.bestieName, name), saveString(KEYS.bestiePhone, phone)]);
  }, []);

  // Keep scheduled reminders fresh: reschedule whenever bills change (or after first load),
  // so each bill always points at its next upcoming occurrence.
  useEffect(() => {
    if (loading || !billReminders) return;
    scheduleBillReminders(recurring).catch(() => {});
  }, [loading, billReminders, recurring]);

  // Add a wish to the manifest board (newest first). perDay = how much she'll set aside daily.
  const addWish = useCallback(
    async (name: string, emoji: string, price: number, perDay: number) => {
      const item: WishItem = { id: genId(), name, emoji, price: Math.round(price), perDay: Math.max(1, Math.round(perDay)), createdAt: Date.now() };
      const next = [item, ...wishlist];
      setWishlist(next);
      await saveJSON(KEYS.wishlist, next);
    },
    [wishlist]
  );

  // Change how much per day a wish saves up (re-does the countdown maths in the UI).
  const updateWishPerDay = useCallback(
    async (id: string, perDay: number) => {
      const next = wishlist.map((w) => (w.id === id ? { ...w, perDay: Math.max(1, Math.round(perDay)) } : w));
      setWishlist(next);
      await saveJSON(KEYS.wishlist, next);
    },
    [wishlist]
  );

  // Remove a wish (resisted, or bought it — either way off the board).
  const deleteWish = useCallback(
    async (id: string) => {
      const next = wishlist.filter((w) => w.id !== id);
      setWishlist(next);
      await saveJSON(KEYS.wishlist, next);
    },
    [wishlist]
  );

  // Take on a money challenge — records the template + today as the start date.
  const startChallenge = useCallback(
    async (templateId: string) => {
      const item: Challenge = { id: genId(), templateId, startDate: getToday() };
      const next = [item, ...challenges];
      setChallenges(next);
      await saveJSON(KEYS.challenges, next);
    },
    [challenges]
  );

  // Give up / clear a challenge (also used to "claim" a finished one off the board).
  const abandonChallenge = useCallback(
    async (id: string) => {
      const next = challenges.filter((c) => c.id !== id);
      setChallenges(next);
      await saveJSON(KEYS.challenges, next);
    },
    [challenges]
  );

  // Create a festival/shaadi season budget (newest first).
  const addEvent = useCallback(
    async (name: string, emoji: string, budget: number, startDate: string, endDate: string) => {
      const item: EventBudget = { id: genId(), name, emoji, budget: Math.round(budget), startDate, endDate, createdAt: Date.now() };
      const next = [item, ...events];
      setEvents(next);
      await saveJSON(KEYS.events, next);
    },
    [events]
  );

  // Delete an event budget (the tagged expenses stay; they just lose the tag visually).
  const deleteEvent = useCallback(
    async (id: string) => {
      const next = events.filter((e) => e.id !== id);
      setEvents(next);
      await saveJSON(KEYS.events, next);
    },
    [events]
  );

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

  // Save a new built-in override map to state + module mirror + storage.
  const persistOverrides = useCallback(async (next: Record<string, CatOverride>) => {
    installCatOverrides(next); // so findCat()/effectiveBuiltins() see it immediately
    setCatOverrides(next);
    await saveJSON(KEYS.catOverrides, next);
  }, []);

  // Edit ANY category's name/emoji. Custom ones change in place; built-ins get a stored
  // override (their id stays the same either way, so existing expenses stay linked).
  const editCategory = useCallback(
    async (id: string, name: string, emoji: string) => {
      if (CATS.some((c) => c.id === id)) {
        await persistOverrides({ ...catOverrides, [id]: { ...catOverrides[id], name: `${emoji} ${name}` } });
      } else {
        const next = customCats.map((c) => (c.id === id ? { ...c, name: `${emoji} ${name}` } : c));
        setCustomCats(next);
        await saveJSON(KEYS.customCats, next);
      }
    },
    [customCats, catOverrides, persistOverrides]
  );

  // Delete ANY category. Custom ones are removed; built-ins are hidden from pickers
  // (kept resolvable so old expenses logged under them still show their name).
  const deleteCategory = useCallback(
    async (id: string) => {
      if (CATS.some((c) => c.id === id)) {
        await persistOverrides({ ...catOverrides, [id]: { ...catOverrides[id], hidden: true } });
      } else {
        const next = customCats.filter((c) => c.id !== id);
        setCustomCats(next);
        await saveJSON(KEYS.customCats, next);
      }
    },
    [customCats, catOverrides, persistOverrides]
  );

  // Restore all built-in categories to default (drops every rename/hide). Custom categories untouched.
  const resetCategories = useCallback(async () => {
    await persistOverrides({});
  }, [persistOverrides]);

  // Wipe everything and return to the onboarding screen (testing/reset helper).
  const resetAll = useCallback(async () => {
    await clearAll();
    await reload(); // storage now empty → onboarded becomes false again
  }, [reload]);

  const value: AppState = {
    loading,
    onboarded,
    expenses,
    incomes,
    recurring,
    impulse,
    letters,
    customCats,
    catOverrides,
    budget,
    income,
    splurgeFund,
    nightShield,
    periodStarts,
    cycleLength,
    catBudgets,
    goals,
    billReminders,
    bestieName,
    bestiePhone,
    wishlist,
    challenges,
    events,
    completeOnboarding,
    saveOnboarding,
    addExpense,
    addIncome,
    updateIncome,
    deleteIncome,
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
    resolveRecurring,
    addLetter,
    deleteLetter,
    setBudgetValue,
    setNightShield,
    logPeriodStart,
    removePeriodStart,
    setCycleLength,
    setCatBudget,
    removeCatBudget,
    addGoal,
    addToGoal,
    withdrawFromGoal,
    deleteGoal,
    setBillReminders,
    setBestie,
    addWish,
    updateWishPerDay,
    deleteWish,
    startChallenge,
    abandonChallenge,
    addEvent,
    deleteEvent,
    addCustomCat,
    editCategory,
    deleteCategory,
    resetCategories,
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
