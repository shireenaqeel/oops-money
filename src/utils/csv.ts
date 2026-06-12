// csv.ts — parse an Indian bank statement CSV (HDFC/ICICI/SBI/Paytm) into expenses with auto-detected categories.
// Logic ported from the working prototype (pookie_tracker.html). Feature 17.
import { MERCHANT_MAP, findCat } from '../constants/categories';
import { getToday } from './index';
import { Expense } from '../types';

export type ParsedExpense = Omit<Expense, 'id'>;

// Parse raw CSV text into a list of expenses (debits only). Best-effort across bank formats.
export function parseBankCSV(text: string): ParsedExpense[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const results: ParsedExpense[] = [];

  // Find the header row (first line mentioning date/amount/etc.); data starts after it.
  let dataStart = 0;
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const low = lines[i].toLowerCase();
    if (low.includes('date') || low.includes('narration') || low.includes('amount') || low.includes('debit')) {
      dataStart = i + 1;
      break;
    }
  }

  const header = (lines[dataStart - 1] || '').toLowerCase().split(',').map((h) => h.replace(/"/g, '').trim());
  const dateIdx = header.findIndex((h) => h.includes('date'));
  const amtIdx = header.findIndex((h) => h.includes('debit') || h.includes('withdrawal') || h.includes('amount'));
  const descIdx = header.findIndex((h) => h.includes('narration') || h.includes('description') || h.includes('particulars') || h.includes('remarks'));

  for (let i = dataStart; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.replace(/"/g, '').trim());
    if (cols.length < 3) continue;

    // amount (skip non-debit / empty rows)
    const rawAmt = (cols[amtIdx >= 0 ? amtIdx : 2] || '').replace(/[₹,\s]/g, '');
    const amt = parseFloat(rawAmt);
    if (!amt || amt <= 0) continue;

    // date — handle dd/mm/yyyy and yyyy-mm-dd
    const rawDate = cols[dateIdx >= 0 ? dateIdx : 0] || '';
    let parsedDate = getToday();
    const dm = rawDate.match(/(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})/);
    const ym = rawDate.match(/(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})/);
    if (ym) parsedDate = `${ym[1]}-${ym[2].padStart(2, '0')}-${ym[3].padStart(2, '0')}`;
    else if (dm) {
      const yr = dm[3].length === 2 ? '20' + dm[3] : dm[3];
      parsedDate = `${yr}-${dm[2].padStart(2, '0')}-${dm[1].padStart(2, '0')}`;
    }

    // category from the description via the merchant map
    const desc = cols[descIdx >= 0 ? descIdx : 1] || 'Imported';
    const dl = desc.toLowerCase();
    let catId = 'other';
    for (const m of MERCHANT_MAP) {
      if (m.test.test(dl)) {
        catId = m.catId;
        break;
      }
    }

    results.push({ amount: amt, catId, note: desc.slice(0, 60), date: parsedDate, color: findCat(catId).color, imported: true });
  }
  return results;
}
