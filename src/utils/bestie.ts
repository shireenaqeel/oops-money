// bestie.ts — accountability "bestie mode" (V2, fully local). Builds a sassy confession message and
// hands it to WhatsApp (if a number is set) or the OS share sheet. No backend — the phone does the sending.
import { Share, Linking } from 'react-native';
import { fmtINR } from './index';

// Build the confession text from this month's numbers. Tone: sassy, non-judgmental (CLAUDE.md).
export function buildConfession(spent: number, budget: number, name: string): string {
  const who = name ? `${name}` : 'bestie';
  if (budget > 0 && spent > budget) {
    const over = spent - budget;
    return `oops ${who} 💀 maine is mahine ₹${fmtINR(spent).slice(1)} kharch kar diya (budget ₹${fmtINR(budget).slice(1)} tha — ₹${fmtINR(over).slice(1)} over). roko mujhe pls 🙏 #OopsMoney`;
  }
  if (budget > 0) {
    const left = budget - spent;
    return `update ${who} 🌸 is mahine ₹${fmtINR(spent).slice(1)} kharch hua, abhi budget mein hoon (₹${fmtINR(left).slice(1)} bacha) — proud of me na? 💅 #OopsMoney`;
  }
  return `hi ${who} 🌸 is mahine ab tak ₹${fmtINR(spent).slice(1)} kharch — mujh pe nazar rakhna 👀 #OopsMoney`;
}

// Keep only digits for a phone number (strip spaces, +, dashes for the wa.me link).
function cleanPhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

// Send the confession: try WhatsApp directly if a number is set, else open the OS share sheet.
export async function confessToBestie(message: string, phone: string): Promise<void> {
  const num = cleanPhone(phone);
  if (num) {
    const url = `whatsapp://send?phone=${num}&text=${encodeURIComponent(message)}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return;
      }
    } catch {
      // WhatsApp not available — fall through to the share sheet
    }
  }
  await Share.share({ message });
}
