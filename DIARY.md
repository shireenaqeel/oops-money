# DIARY.md — Oops Money 💸
# Feature diary. Newest entries at the top. Updated after every feature.

---

## Feature 4: Add Expense modal — 13 Jun 2026
**What:** A floating pink "+" on Home opens a bottom-sheet form to log a spend — amount, category (group filter + pills), mood, note, Today/Yesterday, and a splurge-fund toggle. On save it shows "logged babe 🌸" and the expense instantly appears on Home with the budget updating.
**Why:** This closes the core loop (log → see it → budget moves). Used React Native's built-in `Modal` (no extra package). Amount is digits-only; category defaults to the first so you can log fast. Mood + splurge are optional. Kept date simple (Today/Yesterday pills) to avoid adding a date-picker library — a full calendar can come later if needed.
**Files changed:**
- `src/screens/AddExpenseModal.tsx` — the full logging form (was a placeholder)
- `src/screens/HomeScreen.tsx` — floating + button + renders the modal
- `src/constants/moods.ts` — mood options (new)
- `src/utils/index.ts` — added `getYesterday()`
**How to test:**
1. Reload the app → **🏠 Home** tab → tap the pink **"+"** (bottom-right)
2. A sheet slides up. Type an amount → ₹ shows big
3. Pick a **category** (try the group filter pills: All / Beauty / Food...)
4. Optionally tap a **mood** and add a **note**
5. Toggle **Today/Yesterday**, and try the **Splurge fund** switch
6. Tap **"log this spend ✦"** → button turns green "logged babe 🌸", sheet closes
7. Back on Home: the expense appears under RECENT, "spent in June" goes up, and the **budget bar moves** 🎉
8. Add a few more → watch the bar change colour (green → peach near 75% → pink over 100%) and alerts appear
9. Tap the **✕** on an expense → confirm → it's removed and budget recalculates
**Next up:** Feature 5 — Categories system (custom category creation with emoji picker; the 30+ groups already power this modal).

---

## Feature 3: Home screen — 13 Jun 2026
**What:** Built the main Home screen — a budget card (spent this month, money left/over, coloured progress bar), danger alerts, and a recent-expenses list with delete.
**Why:** This is the screen the user sees most, so it shows the budget at a glance. Bar colour follows the design system: green (0–74%), peach (75–99%), pink (100%+). Pulled the budget/alert maths into `utils/calculations.ts` so Insights (Feature 6) can reuse it. Alerts mirror the prototype (near-budget, over-budget, one category dominating, heavy day). Delete asks for confirmation so nothing vanishes by accident.
**Files changed:**
- `src/screens/HomeScreen.tsx` — budget card + alerts + recent list
- `src/utils/calculations.ts` — monthExpenses, budget state, alerts (new, reusable)
**Note:** There's no "add expense" yet (that's Feature 4), so the recent list shows the empty state and the budget card shows ₹0 spent against your budget. The screen fully comes alive once Feature 4 lets you log spends.
**How to test:**
1. Reload the app, go to the **🏠 Home** tab
2. You should see "my money diary", "spent in June ₹0", a pill showing your **budget left**, a green progress bar, and "you're doing great babe 💚"
3. Below: a 🌷 empty state ("nothing here yet babe ✨")
4. (If you skipped budget in onboarding, you'll see a "set budget in Settings" hint instead)
**Next up:** Feature 4 — Add Expense modal (amount, category, mood, note, splurge toggle). After this, Home comes alive.

---

## Feature 2: Onboarding flow — 13 Jun 2026
**What:** Real first-launch setup — a 3-step flow (income → budget → splurge fund) that saves your numbers, then opens the main tabs. Added a Settings screen that shows your saved setup + a reset button.
**Why:** A guided, one-question-per-screen flow is gentle for beginners (matches the app's no-overwhelm vibe). Amounts are digits-only with a live ₹ preview so there's instant feedback. Splurge fund is optional (can skip). Added `saveOnboarding` (saves all 3 at once) and `resetAll` to the state hook. The reset button lives on Settings so the flow can be re-tested without reinstalling.
**Files changed:**
- `src/screens/OnboardingScreen.tsx` — the 3-step flow
- `src/screens/SettingsScreen.tsx` — shows setup + reset button
- `src/hooks/useAppContext.tsx` — `saveOnboarding` + `resetAll`
- `src/storage/index.ts` — `clearAll` helper
**How to test:**
1. Reload the app (in Expo Go)
2. Go to the **🎀 Settings** tab → tap **"reset app data (testing)"** → confirm → app jumps back to onboarding
3. **Step 1 (💰):** type your income → "aage badho" (button stays grey until you type a number)
4. **Step 2 (🎯):** type a budget → notice the ₹ preview formats Indian-style (e.g. ₹15,000)
5. **Step 3 (🛍️):** type a splurge amount OR leave blank to skip → tap "ho gaya, chalo!"
6. Tabs open → go to **Settings** → your income/budget/splurge should be shown there ✅
7. The "‹ wapas" back button should let you go to previous steps without losing what you typed
**Next up:** Feature 3 — Home screen (budget card, danger alerts, recent expenses).

---

## Feature 1: Navigation + src/ structure — 13 Jun 2026
**What:** Built the full `src/` folder structure, design system, and bottom-tab navigation. App now opens to a welcome screen, then 4 tabs (Home, Insights, Jail, Settings).
**Why:** A clean foundation first means every later feature just slots in. Chose React Navigation bottom tabs (per CLAUDE.md). State lives in one `useAppContext` hook so screens stay simple. All colours/sizes/text live in `constants/` so styling stays consistent and the sassy voice is in one place. App.tsx kept logic-free (Rule #10).
**Packages added (all SDK-54 safe via `expo install`):**
- `@react-navigation/native` + `@react-navigation/bottom-tabs` — the tab navigation
- `react-native-screens` + `react-native-safe-area-context` — required navigation helpers
- `@react-native-async-storage/async-storage` — saves data on the phone (no cloud)
**Files changed:**
- `App.tsx` — navigation + providers only
- `src/constants/theme.ts` — colours, spacing, radius, typography
- `src/constants/categories.ts` — 29 categories, groups, merchant map
- `src/constants/copy.ts` — all Hinglish microcopy
- `src/types/index.ts` — Expense, Recurring, Category interfaces
- `src/utils/index.ts` — fmtINR (Indian grouping), dates, ids
- `src/storage/index.ts` — AsyncStorage helpers + keys
- `src/hooks/useAppContext.tsx` — main state (loads from storage)
- `src/components/shared.tsx` — Screen wrapper + Placeholder
- `src/screens/*` — 6 placeholder screens
**How to test:**
1. `npx expo start -c` and scan the QR with Expo Go
2. You should see the **Oops Money** welcome screen with a pink "chalo shuru karein" button
3. Tap it → 4 tabs appear at the bottom (🏠 Home, ✿ Insights, 🔒 Jail, 🎀 Settings)
4. Tap each tab → each shows its emoji + a "coming soon" message
5. Close and reopen the app → it should skip the welcome and go straight to the tabs (onboarding is remembered)
**Next up:** Feature 2 — the real Onboarding flow (income → budget → splurge fund → done).

---

## Fix: Expo SDK 56 → 54 (phone compatibility) — 13 Jun 2026
**What:** Downgraded the whole project from Expo SDK 56 down to SDK 54 so it runs in the Expo Go app on Shireen's phone. CONFIRMED working — white starter screen loads on phone. 🎉
**Why:** `create-expo-app@latest` gave us SDK 56, but the phone's Expo Go (no update available on the Play Store) only supported SDK 54 — and Expo Go runs one SDK at a time. SDK 55 still showed "requires a newer version of Expo Go", so we stepped down once more to 54. Used `expo install --fix` each step so React (19.1.0), React Native (0.81.5), expo-status-bar and TypeScript all auto-aligned to SDK 54.
**Files changed:** `package.json`, `package-lock.json`
**How to test (CONFIRMED PASSING):**
1. `npx expo start -c` in the terminal
2. Scan the QR code with Expo Go
3. White "Open up App.tsx..." screen loads — no incompatible error ✅
**Lesson for future sessions:** This project must stay on **Expo SDK 54** to match the phone's Expo Go. Do NOT bump to 55/56 unless Shireen updates Expo Go first.
**Next up:** Continue Feature 1 — React Navigation (bottom tabs) + `src/` folder structure.

---

## Project Scaffold + Expo Setup — 13 Jun 2026
**What:** Fresh Expo React Native + TypeScript project set up, with our existing CLAUDE.md and pookie_tracker.html kept safe.
**Why:** Expo (not bare React Native) lets us test instantly on the phone with the Expo Go app — no Android Studio needed. TypeScript catches mistakes before they reach the phone. `blank-typescript` is the cleanest starting template (nothing extra to delete).
**Files changed:**
- `App.tsx` — default starter screen (will be replaced with navigation later)
- `package.json` — project deps (named "oops-money")
- `app.json` — Expo config
- `tsconfig.json` — TypeScript config
- `index.ts` — app entry point
- `.gitignore` — tells git to skip node_modules etc.
- `assets/` — default app icon + splash images
- `node_modules/` — all installed libraries (not committed to git)
- `DIARY.md` — this file (new)
**How to test:**
1. Open a terminal in this folder
2. Run: `npm start`
3. Install the **Expo Go** app on your phone (from Play Store)
4. Scan the QR code shown in the terminal with Expo Go
5. You should see a white screen saying "Open up App.tsx to start working on your app!"
   → If you see that, the scaffold works! 🎉
**Next up:** Feature 1 continued — set up React Navigation (bottom tabs) + the `src/` folder structure (screens, components, hooks, storage, utils, types, constants), then start the Onboarding screen.
