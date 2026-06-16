// personality.ts — turns your spending into a fun, shareable "money personality" archetype (V2).
// Pure maths over the expenses you already have — no new data is collected.
import { Expense, Category } from '../types';
import { findCat } from './../constants/categories';
import { L } from '../i18n';

// One spending archetype, ready to show on a card.
export interface Personality {
  emoji: string;
  title: string; // e.g. "The Soft-Launch Spender"
  tagline: string; // sassy Hinglish one-liner
  stat: string; // a supporting number ("60% kharcha pehle 10 din mein")
  enough: boolean; // false = not enough data yet (Mystery Spender)
}

// Look at all the expenses and decide which archetype fits best.
// Each archetype gets a score; the highest score wins (ties broken by list order).
export function getPaisaPersonality(expenses: Expense[], customCats: Category[] = []): Personality {
  const n = expenses.length;
  // Need a little data before we can read someone's "vibe".
  if (n < 5) {
    return {
      emoji: '🔮',
      title: 'The Mystery Spender',
      tagline: L('abhi tak samajh nahi aaya tu kaisi kharchewaali hai — thode aur kharche log kar, main padh leti hoon 🔮', "can't read your spending vibe yet — log a few more expenses and I'll figure you out 🔮"),
      stat: L(`abhi sirf ${n} kharche hue hain`, `only ${n} expenses so far`),
      enough: false,
    };
  }

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0) || 1;
  const avg = total / n;

  // Tally up the signals we care about.
  const groupTotal: Record<string, number> = {};
  const moodTotal: Record<string, number> = {};
  let foodMoney = 0; // Food group (Swiggy/cafe/khaana)
  let beautyMoney = 0; // Beauty group
  let fashionMoney = 0; // Fashion group
  let splurgeMoney = 0; // marked as splurge
  let weekendMoney = 0; // spent on Sat/Sun
  let firstTenMoney = 0; // spent in the first 10 days of the month (payday rush)

  for (const e of expenses) {
    const cat = findCat(e.catId, customCats);
    groupTotal[cat.group] = (groupTotal[cat.group] || 0) + e.amount;
    if (cat.group === 'Food') foodMoney += e.amount;
    if (cat.group === 'Beauty') beautyMoney += e.amount;
    if (cat.group === 'Fashion') fashionMoney += e.amount;
    if (e.isSplurge) splurgeMoney += e.amount;
    const d = new Date(e.date + 'T00:00:00');
    const dow = d.getDay();
    if (dow === 0 || dow === 6) weekendMoney += e.amount;
    if (d.getDate() <= 10) firstTenMoney += e.amount;
    if (e.mood) moodTotal[e.mood] = (moodTotal[e.mood] || 0) + e.amount;
  }

  // Shares (0–1) used by the scoring below.
  const foodShare = foodMoney / total;
  const beautyShare = beautyMoney / total;
  const fashionShare = fashionMoney / total;
  const splurgeShare = splurgeMoney / total;
  const weekendShare = weekendMoney / total;
  const firstTenShare = firstTenMoney / total;
  const stressShare = ((moodTotal['stressed'] || 0) + (moodTotal['sad'] || 0)) / total;
  const smallTxn = avg > 0 && avg < 400; // lots of little buys

  const pct = (x: number) => Math.round(x * 100);

  // Candidate archetypes, each with a score. Higher share = stronger match.
  const candidates: (Personality & { score: number })[] = [
    {
      score: stressShare * 1.2,
      emoji: '😩',
      title: 'The Stress Spender',
      tagline: L('feelings ko cart mein daal deti ho 😩 retail therapy real hai, par chai bhi try karo ☕', 'you put your feelings in the cart 😩 retail therapy is real, but try chai too ☕'),
      stat: L(`${pct(stressShare)}% kharcha stressed/sad mood mein`, `${pct(stressShare)}% spent while stressed/sad`),
      enough: true,
    },
    {
      score: beautyShare,
      emoji: '💅',
      title: 'The Glow-Up Queen',
      tagline: L('makeup + skincare pe sab ja raha — but you look expensive so... valid 💅', 'it all goes on makeup + skincare — but you look expensive so... valid 💅'),
      stat: L(`${pct(beautyShare)}% kharcha beauty pe`, `${pct(beautyShare)}% spent on beauty`),
      enough: true,
    },
    {
      score: fashionShare,
      emoji: '👗',
      title: 'The Fashion Victim',
      tagline: L('almaari full hai phir bhi "kuch pehnne ko nahi" 👗 we been there bestie', 'wardrobe full but "nothing to wear" 👗 we been there bestie'),
      stat: L(`${pct(fashionShare)}% kharcha kapdon-accessories pe`, `${pct(fashionShare)}% spent on clothes & accessories`),
      enough: true,
    },
    {
      score: foodShare,
      emoji: '🍕',
      title: 'The Foodie Forever',
      tagline: L('Swiggy tera 3am best friend hai 🍕 ghar ka khaana bhi yaad kar lo kabhi', 'Swiggy is your 3am best friend 🍕 maybe remember home food sometimes'),
      stat: L(`${pct(foodShare)}% kharcha khaane-cafe pe`, `${pct(foodShare)}% spent on food & cafes`),
      enough: true,
    },
    {
      score: splurgeShare * 0.9,
      emoji: '👑',
      title: 'The Treat-Yourself Tycoon',
      tagline: L('har cheez pe "main deserve karti hoon" 👑 honestly? half the time, valid', 'everything is "I deserve this" 👑 honestly? half the time, valid'),
      stat: L(`${pct(splurgeShare)}% kharcha splurge tha`, `${pct(splurgeShare)}% was splurge spending`),
      enough: true,
    },
    {
      score: weekendShare > 0.55 ? weekendShare : 0,
      emoji: '🎉',
      title: 'The Weekend Warrior',
      tagline: L('Mon–Fri saint, Sat–Sun full sinner 🎉 weekend aate hi wallet khul jaata hai', 'Mon–Fri saint, Sat–Sun full sinner 🎉 the wallet flies open on weekends'),
      stat: L(`${pct(weekendShare)}% kharcha weekend pe`, `${pct(weekendShare)}% spent on weekends`),
      enough: true,
    },
    {
      score: firstTenShare > 0.5 ? firstTenShare : 0,
      emoji: '💸',
      title: 'The Payday Baller',
      tagline: L('1 tareekh ko rani 👑, 28 ko thodi tang 💸 month start pe hi sab udda deti ho', 'queen on the 1st 👑, broke by the 28th 💸 you blow it all early'),
      stat: L(`${pct(firstTenShare)}% kharcha mahine ke pehle 10 din mein`, `${pct(firstTenShare)}% spent in the first 10 days`),
      enough: true,
    },
    {
      score: smallTxn ? 0.5 : 0,
      emoji: '✨',
      title: 'The Soft-Launch Spender',
      tagline: L('chhoti chhoti cheezein — ₹200 yahan, ₹150 wahan ✨ mahine end pe "paise gaye kahan?!"', 'tiny buys — ₹200 here, ₹150 there ✨ then "where did the money go?!"'),
      stat: L(`average kharcha sirf ${Math.round(avg)}₹, par ${n} baar`, `avg spend just ₹${Math.round(avg)}, but ${n} times`),
      enough: true,
    },
  ];

  // Pick the strongest match.
  let best = candidates[0];
  for (const c of candidates) if (c.score > best.score) best = c;

  // If nothing really stood out, she's just balanced — celebrate it.
  if (best.score < 0.28) {
    return {
      emoji: '💚',
      title: 'The Budgeting Baddie',
      tagline: L('koi ek cheez pe pagalpan nahi — low-key balanced spender. proud of you bestie 💚', 'no single obsession — low-key balanced spender. proud of you bestie 💚'),
      stat: L(`${n} kharche, sab thoda thoda spread out`, `${n} expenses, all nicely spread out`),
      enough: true,
    };
  }

  const { score, ...rest } = best;
  return rest;
}
