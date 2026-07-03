// gemini.ts — the optional REAL AI coach. Calls Google's free Gemini API with the USER'S OWN key
// (pasted in Settings). We send a compact summary of her finances + the chat so far, and Gemini
// replies as a sassy, non-judgmental Hinglish money coach. If there's no key, the app never calls
// this — it falls back to the offline rule-based chat (paisaChat.ts). Nothing is stored by us.
import { Expense, Income, Category } from '../types';
import { monthExpenses, sumExpenses } from './calculations';
import { fmtINR, getToday } from './index';
import { findCat } from '../constants/categories';
import { sumIncomes, monthIncomes } from '../constants/incomes';

// Gemini's free flash model — good enough for a chat coach, generous free tier.
const MODEL = 'gemini-2.0-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export interface CoachData {
  expenses: Expense[];
  incomes: Income[];
  budget: string;
  customCats: Category[];
}

// One turn of the conversation, in Gemini's role vocabulary.
export interface CoachTurn {
  role: 'user' | 'model';
  text: string;
}

// Build a short, current snapshot of her money for the model to reason over (grounding).
export function buildMoneyContext(data: CoachData): string {
  const { expenses, incomes, budget, customCats } = data;
  const now = new Date(getToday() + 'T00:00:00');
  const month = now.getMonth();
  const year = now.getFullYear();
  const thisMonth = monthExpenses(expenses, month, year);
  const spent = sumExpenses(thisMonth);
  const budgetNum = Number(budget) || 0;
  const earned = sumIncomes(monthIncomes(incomes, month, year));

  // top 3 categories this month
  const cats = [...new Set(thisMonth.map((e) => e.catId))]
    .map((id) => ({ name: findCat(id, customCats).name, amt: sumExpenses(thisMonth.filter((e) => e.catId === id)) }))
    .sort((a, b) => b.amt - a.amt)
    .slice(0, 3);

  const lines = [
    `Today: ${getToday()}.`,
    budgetNum > 0 ? `Monthly budget: ${fmtINR(budgetNum)}. Spent so far this month: ${fmtINR(spent)}. Remaining: ${fmtINR(budgetNum - spent)}.` : `No monthly budget set. Spent this month: ${fmtINR(spent)}.`,
    earned > 0 ? `Income this month: ${fmtINR(earned)}. Net saved: ${fmtINR(earned - spent)}.` : `No income logged this month.`,
    cats.length ? `Top spending: ${cats.map((c) => `${c.name} ${fmtINR(c.amt)}`).join(', ')}.` : `No spending logged this month.`,
    `Total expenses on record: ${expenses.length}.`,
  ];
  return lines.join('\n');
}

// The coach's persona + rules. Kept tight so replies stay short, kind and on-brand.
const SYSTEM = `You are "Paisa", the friendly money coach inside "Oops Money", an expense-tracker app for young Indian women (18-28) who are beginners with money.
Personality: playful, sassy, warm, NEVER judgmental or shaming. Think supportive best friend, not a bank.
Rules:
- Reply in the SAME language style the user writes in: if they use Hinglish (Hindi+English mix in Latin script), reply in Hinglish; if plain English, reply in English. Never use Devanagari script.
- Keep replies SHORT: 2-4 sentences max. Use a warm emoji or two, not more.
- All money is Indian Rupees. Use the ₹ symbol and Indian formatting (e.g. ₹1,50,000, ₹2.3K).
- Base your answers ONLY on the user's data provided below. If you don't have the data, say so gently and suggest logging it — never invent numbers.
- You can give practical, gentle money tips, encouragement, and simple plans. No investment/tax/legal advice, no medical advice.
- If asked something unrelated to money/spending/saving, gently steer back with humour.
- Never shame the user for spending. Celebrate small wins.`;

export interface CoachResult {
  ok: boolean;
  text: string; // the reply, or a friendly error message
}

// Ask the Gemini coach. `history` is prior turns (excluding the new message); `userMsg` is the new one.
export async function askGeminiCoach(key: string, history: CoachTurn[], userMsg: string, data: CoachData): Promise<CoachResult> {
  const context = buildMoneyContext(data);
  const contents = [
    ...history.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
    { role: 'user' as const, parts: [{ text: `${userMsg}\n\n---\nMy current money data:\n${context}` }] },
  ];
  const body = {
    system_instruction: { parts: [{ text: SYSTEM }] },
    contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 350 },
  };

  try {
    const res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      // Friendly, specific-ish errors for the common cases.
      if (res.status === 400 || res.status === 403) return { ok: false, text: 'invalid-key' };
      if (res.status === 429) return { ok: false, text: 'rate-limit' };
      return { ok: false, text: 'error' };
    }
    const json = await res.json();
    const text: string | undefined = json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? undefined;
    if (!text || !text.trim()) return { ok: false, text: 'empty' };
    return { ok: true, text: text.trim() };
  } catch {
    return { ok: false, text: 'network' };
  }
}

// Quick liveness check used by Settings to confirm a pasted key actually works.
export async function testGeminiKey(key: string): Promise<CoachResult> {
  return askGeminiCoach(key, [], 'Say hi in one short line.', { expenses: [], incomes: [], budget: '', customCats: [] });
}
