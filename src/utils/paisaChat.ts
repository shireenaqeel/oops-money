// paisaChat.ts — the brain behind the offline "Paisa se pucho" chat. It answers plain questions
// about your own data ("makeup pe kitna kharcha?", "kitna bacha?", "sabse zyada kahan?") using
// rule-based intent + timeframe detection. No LLM, no network — reads AsyncStorage-backed state only.
import { Expense, Income, Category } from '../types';
import { monthExpenses, sumExpenses } from './calculations';
import { fmtINR, getToday, getYesterday, parseSpokenCategory } from './index';
import { findCat } from '../constants/categories';
import { sumIncomes, monthIncomes } from '../constants/incomes';
import { L } from '../i18n';

export interface ChatInput {
  expenses: Expense[];
  incomes: Income[];
  budget: string;
  customCats: Category[];
}

const DAY = 86400000;

function iso(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

// Work out which stretch of time the question is about, with a matching expense filter + label.
function timeframe(q: string): { label: string; keep: (e: { date: string }) => boolean } {
  const today = getToday();
  if (/(aaj|today)/.test(q)) return { label: L('aaj', 'today'), keep: (e) => e.date === today };
  if (/(kal|yesterday)/.test(q)) {
    const y = getYesterday();
    return { label: L('kal', 'yesterday'), keep: (e) => e.date === y };
  }
  if (/(hafte|hafta|week|7 din|saat din)/.test(q)) {
    const start = iso(new Date(Date.now() - 6 * DAY));
    return { label: L('is hafte', 'this week'), keep: (e) => e.date >= start && e.date <= today };
  }
  // default: this calendar month
  const now = new Date(today + 'T00:00:00');
  const m = now.getMonth();
  const y = now.getFullYear();
  return {
    label: L('is mahine', 'this month'),
    keep: (e) => {
      const d = new Date(e.date + 'T00:00:00');
      return d.getMonth() === m && d.getFullYear() === y;
    },
  };
}

// Answer one question from the user's own data. Always returns a friendly string.
export function answerPaisa(question: string, input: ChatInput): string {
  const { expenses, incomes, budget, customCats } = input;
  const q = question.toLowerCase().trim();
  if (!q) return L('kuch pucho na babe ✨', 'ask me something babe ✨');

  const now = new Date(getToday() + 'T00:00:00');
  const month = now.getMonth();
  const year = now.getFullYear();
  const monthSpend = sumExpenses(monthExpenses(expenses, month, year));
  const budgetNum = Number(budget) || 0;

  // 1) Budget left — "kitna bacha", "budget", "left".
  if (/(bacha|bachā|budget|left|remaining|kitna hai)/.test(q) && !/(kharch|spend|kamaya|income)/.test(q)) {
    if (budgetNum <= 0) return L('abhi tak budget set nahi kiya — Settings mein daal do phir batati hoon 🎯', "you haven't set a budget yet — add one in Settings and I'll track it 🎯");
    const left = budgetNum - monthSpend;
    if (left >= 0) return L(`is mahine ${fmtINR(left)} aur bacha hai (${fmtINR(monthSpend)} kharch ho chuka) 💚`, `you've got ${fmtINR(left)} left this month (${fmtINR(monthSpend)} spent) 💚`);
    return L(`budget ${fmtINR(-left)} se over ho gaya babe 💀 (${fmtINR(monthSpend)} kharch)`, `you're ${fmtINR(-left)} over budget babe 💀 (${fmtINR(monthSpend)} spent)`);
  }

  // 2) Income — "kitna kamaya", "income", "aaya".
  if (/(kamaya|kamaaya|income|aaya|earn|salary|kamaai|kamai)/.test(q)) {
    const tf = timeframe(q);
    const earned = tf.label === L('is mahine', 'this month')
      ? sumIncomes(monthIncomes(incomes, month, year))
      : sumIncomes(incomes.filter(tf.keep));
    if (earned <= 0) return L(`${tf.label} koi income log nahi hui 💰`, `no income logged ${tf.label} 💰`);
    return L(`${tf.label} ${fmtINR(earned)} aaya 💰`, `${fmtINR(earned)} came in ${tf.label} 💰`);
  }

  // 3) Savings / net — "kitna bachaya", "saved", "net".
  if (/(bachaya|bachaaya|saved|savings|net)/.test(q)) {
    const earned = sumIncomes(monthIncomes(incomes, month, year));
    const net = earned - monthSpend;
    if (earned <= 0) return L('income log karo to net saving bata paungi 💰', 'log some income and I can tell you your net savings 💰');
    if (net >= 0) return L(`is mahine ${fmtINR(net)} bachaya — kamai ka ${Math.round((net / earned) * 100)}% 🐷`, `you saved ${fmtINR(net)} this month — ${Math.round((net / earned) * 100)}% of income 🐷`);
    return L(`is mahine kamai se ${fmtINR(-net)} zyada kharch ho gaya ⚠️`, `you spent ${fmtINR(-net)} more than you earned this month ⚠️`);
  }

  // 4) A specific category — "makeup pe kitna", "swiggy", "food delivery".
  const catId = parseSpokenCategory(q, customCats);
  if (catId && /(kitna|kitne|kharch|spend|pe|par|kaha|kahan|on)/.test(q)) {
    const tf = timeframe(q);
    const cat = findCat(catId, customCats);
    const spent = sumExpenses(expenses.filter((e) => e.catId === catId && tf.keep(e)));
    if (spent <= 0) return L(`${tf.label} ${cat.name} pe kuch nahi — proud of you 💅`, `nothing on ${cat.name} ${tf.label} — proud of you 💅`);
    return L(`${tf.label} ${cat.name} pe ${fmtINR(spent)} gaya`, `${fmtINR(spent)} went to ${cat.name} ${tf.label}`);
  }

  // 5) Biggest category — "sabse zyada", "most", "biggest".
  if (/(sabse zyada|sabse jyada|biggest|most|kaha ja raha|kahan ja raha|top)/.test(q)) {
    const tf = timeframe(q);
    const list = expenses.filter(tf.keep);
    if (list.length === 0) return L(`${tf.label} koi kharcha log nahi hua ✨`, `no spending logged ${tf.label} ✨`);
    const cats = [...new Set(list.map((e) => e.catId))];
    let bestId = '';
    let bestVal = 0;
    cats.forEach((id) => {
      const amt = sumExpenses(list.filter((e) => e.catId === id));
      if (amt > bestVal) {
        bestVal = amt;
        bestId = id;
      }
    });
    const cat = findCat(bestId, customCats);
    return L(`${tf.label} sabse zyada ${cat.name} pe — ${fmtINR(bestVal)}`, `${tf.label} most went to ${cat.name} — ${fmtINR(bestVal)}`);
  }

  // 6) Total spend — "kitna kharcha", "total", "kitna uda".
  if (/(kharch|kharcha|kharche|spend|total|uda|udaya|gaya|kitna)/.test(q)) {
    const tf = timeframe(q);
    const spent = sumExpenses(expenses.filter(tf.keep));
    if (spent <= 0) return L(`${tf.label} kuch kharch nahi hua — no spend, you ate 🍽️`, `nothing spent ${tf.label} — no-spend, you ate 🍽️`);
    return L(`${tf.label} total ${fmtINR(spent)} kharch hua`, `${fmtINR(spent)} spent ${tf.label}`);
  }

  // 7) Greeting / fallback.
  if (/(hi|hello|hey|hola|namaste|kaisi)/.test(q)) return L('hey babe 🌸 pucho — "kitna kharcha hua?", "kitna bacha?", "makeup pe kitna?"', 'hey babe 🌸 ask me — "how much did I spend?", "how much is left?", "how much on makeup?"');
  return L('ye samajh nahi aaya 🙈 try karo: "kitna kharcha hua?", "kitna bacha?", "sabse zyada kahan?", "swiggy pe kitna?"', "didn't catch that 🙈 try: \"how much did I spend?\", \"how much is left?\", \"biggest category?\", \"how much on swiggy?\"");
}

// Starter suggestion chips shown in the chat.
export function chatSuggestions(): string[] {
  return [
    L('kitna kharcha hua?', 'how much did I spend?'),
    L('kitna bacha?', "how much is left?"),
    L('sabse zyada kahan?', 'biggest category?'),
    L('is hafte kitna?', 'how much this week?'),
  ];
}
