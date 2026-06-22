// incomes.ts — built-in income sources (money IN). Mirrors the shape of categories so the
// add-income picker looks/feels the same. Fixed greenish-pastel colours (not themeable).
import { Income } from '../types';

export interface IncomeSource {
  id: string;
  name: string; // "💼 Salary" — emoji + label together
  color: string; // pill colour when selected
  bg: string; // soft background tint
}

export const INCOME_SOURCES: IncomeSource[] = [
  { id: 'salary', name: '💼 Salary', color: '#7FC9A0', bg: '#EAF7F0' },
  { id: 'freelance', name: '💻 Freelance', color: '#88C8B0', bg: '#ECF6F2' },
  { id: 'business', name: '🛍️ Business', color: '#A0C890', bg: '#EFF6EA' },
  { id: 'gift', name: '🎁 Gift / mila', color: '#F4A7C3', bg: '#FEF0F6' },
  { id: 'refund', name: '↩️ Refund / wapas', color: '#A8D8EA', bg: '#EEF8FC' },
  { id: 'investment', name: '📈 Returns', color: '#9CC59C', bg: '#EEF6EE' },
  { id: 'pocket', name: '👛 Pocket money', color: '#C9B8E8', bg: '#F3F0FD' },
  { id: 'other', name: '✨ Other', color: '#B0D4C0', bg: '#EEF6F0' },
];

// Find a source by id, falling back to "Other".
export function findSource(id: string): IncomeSource {
  return INCOME_SOURCES.find((s) => s.id === id) ?? INCOME_SOURCES[INCOME_SOURCES.length - 1];
}

// Sum a list of incomes.
export function sumIncomes(incomes: Income[]): number {
  return incomes.reduce((t, i) => t + Number(i.amount), 0);
}

// Incomes logged in a given month/year.
export function monthIncomes(incomes: Income[], month: number, year: number): Income[] {
  return incomes.filter((i) => {
    const d = new Date(i.date + 'T00:00:00');
    return d.getMonth() === month && d.getFullYear() === year;
  });
}
