// copy.ts — all Hinglish microcopy in one place (CLAUDE.md microcopy rules).
// Keep user-facing text here so the sassy voice stays consistent and easy to tweak.

export const COPY = {
  amountPlaceholder: 'how much, babe?',
  logged: 'logged babe 🌸',
  overBudget: 'oops, budget gaya 💀',
  nearBudget: 'danger zone, babe!',
  empty: 'nothing here yet babe ✨',
  loading: 'loading your chaos...',
  jailSuccess: 'sentenced! come back tomorrow 🔒',
  regretPrompt: 'was it worth it? be honest babe',
  noSpendDay: 'no spend day! you ate 🍽️',
  budgetSafe: "you're doing great babe 💚",
} as const;

// Buried impulse item message — takes the saved amount string, e.g. "₹2,000".
export function buriedMsg(amountText: string): string {
  return `RIP bestie 🪦 you saved ${amountText}`;
}
