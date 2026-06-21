// categories.ts — all built-in categories + groups + the merchant→category map for CSV import.
// Data mirrors the working prototype (pookie_tracker.html). Feature 5 builds the full UI on top of this.
import { Category } from '../types';

// 29 built-in categories. Custom ones (added by the user) live in storage and merge on top at runtime.
export const CATS: Category[] = [
  { id: 'makeup', name: '💄 Makeup', color: '#F4A7C3', bg: '#FEF0F6', group: 'Beauty' },
  { id: 'skincare', name: '🧴 Skincare', color: '#C9B8E8', bg: '#F3F0FD', group: 'Beauty' },
  { id: 'haircare', name: '💇 Haircare', color: '#F9C784', bg: '#FEF9EE', group: 'Beauty' },
  { id: 'nails', name: '💅 Nails', color: '#F4A7C3', bg: '#FEF0F6', group: 'Beauty' },
  { id: 'fragrance', name: '🌸 Fragrance', color: '#D8A0D8', bg: '#F8F0FB', group: 'Beauty' },
  { id: 'salon', name: '💆 Salon', color: '#E8B4C8', bg: '#FEF0F5', group: 'Beauty' },
  { id: 'fashion', name: '👗 Fashion', color: '#A8D8EA', bg: '#EEF8FC', group: 'Fashion' },
  { id: 'accessories', name: '👜 Accessories', color: '#F7C5A0', bg: '#FEF5EF', group: 'Fashion' },
  { id: 'shoes', name: '👟 Shoes', color: '#B8D4A8', bg: '#EEF6EA', group: 'Fashion' },
  { id: 'food', name: '🍽️ Khaana Peena', color: '#F4A7C3', bg: '#FEF0F6', group: 'Food' },
  { id: 'cafe', name: '☕ Cafe dates', color: '#C9A98B', bg: '#F9F3EE', group: 'Food' },
  { id: 'parties', name: '🍺 Parties', color: '#FFB347', bg: '#FFF5E6', group: 'Food' },
  { id: 'groceries', name: '🛒 Groceries', color: '#B8E8C8', bg: '#EEF9F2', group: 'Food' },
  { id: 'gym', name: '🏋 Gym/Fitness', color: '#A0D4A0', bg: '#EEF8EE', group: 'Health' },
  { id: 'medicines', name: '💊 Medicines', color: '#F7B8B8', bg: '#FEF0F0', group: 'Health' },
  { id: 'selfcare', name: '🛁 Self-care', color: '#B8E8C8', bg: '#EEF9F2', group: 'Health' },
  { id: 'therapy', name: '🧿 Therapy', color: '#B8C8E8', bg: '#EEF0FC', group: 'Health' },
  { id: 'rent', name: '🏠 Rent/Bills', color: '#D4B8A8', bg: '#F9F3EE', group: 'Life' },
  { id: 'transport', name: '🚗 Transport', color: '#A8C8D8', bg: '#EEF5F8', group: 'Life' },
  { id: 'subscriptions', name: '📱 Subscriptions', color: '#D8B4E2', bg: '#F8F0FB', group: 'Life' },
  { id: 'utilities', name: '💡 Utilities', color: '#F9E080', bg: '#FEFBE8', group: 'Life' },
  { id: 'padhai', name: '🎓 Padhai', color: '#A8B8E8', bg: '#EEF0FC', group: 'Growth' },
  { id: 'books', name: '📚 Books', color: '#C8D8A8', bg: '#F4F8EE', group: 'Growth' },
  { id: 'travel', name: '✈ Travel/Trips', color: '#87CEEB', bg: '#EEF7FC', group: 'Travel' },
  { id: 'hotels', name: '🏨 Hotels/Stay', color: '#A8C8E8', bg: '#EEF5FC', group: 'Travel' },
  { id: 'gifting', name: '🎀 Gifting', color: '#F4A7C3', bg: '#FEF0F6', group: 'Misc' },
  { id: 'pets', name: '🐾 Pets', color: '#D4A870', bg: '#F9F0E4', group: 'Misc' },
  { id: 'gaming', name: '🎮 Gaming', color: '#A8A8E8', bg: '#F0F0FC', group: 'Misc' },
  { id: 'investments', name: '💰 Investments', color: '#80C080', bg: '#EEF8EE', group: 'Misc' },
  { id: 'other', name: '✨ Other', color: '#E0D5F5', bg: '#F8F5FF', group: 'Misc' },
];

// Group names in display order, for the category filter strip.
export const CAT_GROUPS = ['Beauty', 'Fashion', 'Food', 'Health', 'Life', 'Growth', 'Travel', 'Misc'] as const;

// Colour pool used to auto-assign a colour to each new custom category.
export const PASTEL_COLORS = ['#F4A7C3', '#B8A9E8', '#A8D8EA', '#F9C784', '#B8E8C8', '#D8B4E2', '#F7C5A0'];

// Merchant keyword → category id, used to auto-detect categories during CSV import (feature 17).
export const MERCHANT_MAP: { test: RegExp; catId: string }[] = [
  { test: /swiggy|zomato|food|restaurant|cafe|starbucks|coffee|biryani|dominos|pizza/, catId: 'food' },
  { test: /amazon|flipkart|myntra|ajio|meesho|nykaa|shop|mall|sephora/, catId: 'fashion' },
  { test: /ola|uber|rapido|metro|bus|petrol|fuel|parking/, catId: 'transport' },
  { test: /netflix|spotify|prime|hotstar|youtube|subscription|apple/, catId: 'subscriptions' },
  { test: /rent|emi|loan|mortgage/, catId: 'rent' },
  { test: /gym|cult|fitness|yoga/, catId: 'gym' },
  { test: /pharmacy|medical|doctor|hospital|clinic|medicine|apollo/, catId: 'medicines' },
  { test: /salon|parlour|spa|beauty|wax|facial/, catId: 'salon' },
  { test: /electricity|water|bill|recharge|broadband|jio|airtel/, catId: 'utilities' },
  { test: /flight|hotel|airbnb|booking|travel|goibibo|makemytrip/, catId: 'travel' },
  { test: /udemy|coursera|education|school|college|fee/, catId: 'padhai' },
  { test: /grocery|bigbasket|blinkit|zepto|instamart|dmart/, catId: 'groceries' },
];

// ── Built-in category overrides ───────────────────────────────────────────────
// Built-in categories live in code, but users can rename or hide them. We store those
// tweaks as a per-id override map (in AsyncStorage) and mirror it here at module level
// so pure helpers like findCat() see the edits too — same pattern as the i18n L() helper.
export interface CatOverride {
  name?: string; // replacement "emoji name" string
  hidden?: boolean; // true = removed from the picker (old expenses still resolve by id)
}

let CAT_OVERRIDES: Record<string, CatOverride> = {};

// Called by the app on load and whenever a built-in category is edited/deleted.
export function installCatOverrides(map: Record<string, CatOverride>): void {
  CAT_OVERRIDES = map || {};
}

// Apply a built-in's rename override, if one exists.
function withOverride(c: Category): Category {
  const ov = CAT_OVERRIDES[c.id];
  return ov?.name ? { ...c, name: ov.name } : c;
}

// Built-in categories to show in pickers: renamed where edited, hidden ones dropped.
export function effectiveBuiltins(): Category[] {
  return CATS.filter((c) => !CAT_OVERRIDES[c.id]?.hidden).map(withOverride);
}

// Find a category by id (built-in or custom). Built-ins resolve even if hidden, so a
// deleted built-in still shows its name on old expenses. Falls back to "Other".
export function findCat(id: string, customCats: Category[] = []): Category {
  const builtin = CATS.find((c) => c.id === id);
  if (builtin) return withOverride(builtin);
  return customCats.find((c) => c.id === id) ?? CATS[CATS.length - 1];
}
