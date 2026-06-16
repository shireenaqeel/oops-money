// benchmark.ts (util) — turns expenses into anonymous category-GROUP percentages (V3).
// This is the only thing the Bestie Benchmark ever shares: percentages per group, no amounts,
// no notes, no identity beyond the user's own row. Pure maths.
import { Expense, Category } from '../types';
import { findCat } from '../constants/categories';

// Percentage of total spend that went to each built-in group, e.g. { Food: 35, Beauty: 20 }.
export function getGroupPercents(expenses: Expense[], customCats: Category[] = []): Record<string, number> {
  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
  if (total <= 0) return {};
  const byGroup: Record<string, number> = {};
  for (const e of expenses) {
    const g = findCat(e.catId, customCats).group;
    byGroup[g] = (byGroup[g] || 0) + Number(e.amount);
  }
  const out: Record<string, number> = {};
  for (const g of Object.keys(byGroup)) out[g] = Math.round((byGroup[g] / total) * 100);
  return out;
}

// A little emoji for each group, for the comparison lines.
export const GROUP_EMOJI: Record<string, string> = {
  Beauty: '💄',
  Fashion: '👗',
  Food: '🍕',
  Health: '💊',
  Life: '🏠',
  Growth: '📚',
  Travel: '✈️',
  Misc: '✨',
  Custom: '🌟',
};

export interface BenchmarkLine {
  group: string;
  emoji: string;
  mine: number; // your %
  avg: number; // community avg %
  text: string; // sassy comparison line
}

// Compare your group percentages to the community averages and build sassy lines,
// most "interesting" (furthest from average) first.
export function buildBenchmarkLines(mine: Record<string, number>, avg: Record<string, number>): BenchmarkLine[] {
  const lines: BenchmarkLine[] = [];
  for (const group of Object.keys(mine)) {
    const a = avg[group];
    if (a == null || a <= 0) continue;
    const m = mine[group];
    const ratio = m / a;
    const emoji = GROUP_EMOJI[group] ?? '✨';
    let text: string;
    if (ratio >= 1.5) text = `${emoji} ${group}: tu average se ${ratio.toFixed(1)}x zyada kharchti hai 👀`;
    else if (ratio <= 0.66) text = `${emoji} ${group}: average se kaafi kam — smart cookie 💚`;
    else text = `${emoji} ${group}: average ke aas-paas, balanced 🌸`;
    lines.push({ group, emoji, mine: m, avg: a, text });
  }
  // Sort by how far from "1x" each ratio is (most surprising first).
  lines.sort((x, y) => Math.abs(y.mine / Math.max(y.avg, 1) - 1) - Math.abs(x.mine / Math.max(x.avg, 1) - 1));
  return lines;
}
