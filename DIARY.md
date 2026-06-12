# DIARY.md — Oops Money 💸
# Feature diary. Newest entries at the top. Updated after every feature.

---

## Feature 11: Future-me letters — 13 Jun 2026
**What:** In Settings you can write notes to your future self ("dear future me, please mat khareedna..."). One of your letters then shows as a 💌 card at the top of the Impulse Jail screen, reminding you why you're saving right when you're tempted.
**Why:** A message from past-you (calm, goal-focused) is a strong nudge against impulse buys. New `Letter` type + storage key + `addLetter`/`deleteLetter`. The jail screen picks one letter per visit (random seed on mount) so it varies.
**Files changed:**
- `src/types/index.ts` — `Letter`
- `src/storage/index.ts` — `om_letters` key
- `src/hooks/useAppContext.tsx` — `letters` + `addLetter`/`deleteLetter`
- `src/screens/SettingsScreen.tsx` — write/list/delete letters
- `src/screens/ImpulseJailScreen.tsx` — 💌 letter card
**How to test:**
1. **🎀 Settings** → "FUTURE-ME LETTERS" → write a note → "save letter ✦" (write 2–3)
2. Go to **🔒 Jail** tab → a 💌 "future you se ek baat" card shows your note at the top
3. Leave + re-open the Jail tab → it may show a different letter
4. Delete a letter from Settings with ✕
**Next up:** Feature 12 — Broke Math (₹X = Y days of salary / Z coffees).

---

## Feature 10: Recurring bills — 13 Jun 2026
**What:** A new **🔁 Bills** tab (5th tab). Add a recurring bill (name, amount, due day, category), see a due-date countdown ("3 days left" / "due today!"), a monthly fixed-cost total, and a one-tap **"log now"** that drops it into today's expenses.
**Why:** Rent/subscriptions/gym repeat every month — re-typing them is annoying. Bills are templates; "log now" creates a normal expense (note "<name> (recurring)") so it flows into budget/insights. Sorted by soonest due. Reused the existing `Recurring` type + storage key.
**Files changed:**
- `src/hooks/useAppContext.tsx` — `addRecurring`, `deleteRecurring`, `logRecurring`
- `src/screens/AddRecurringModal.tsx` — add-bill form (new)
- `src/screens/RecurringScreen.tsx` — bills list + countdown (new)
- `App.tsx` — added the Bills tab
**How to test:**
1. Reload → new **🔁 Bills** tab → tap the blue **"+"**
2. Add a bill (e.g. "Netflix", ₹649, day 15, Subscriptions) → save
3. See it with "X days left" + a monthly total banner
4. Tap **"log now"** → "logged babe 🌸" → check **🏠 Home**: it's in today's expenses, budget updated
5. ✕ deletes a bill (with confirm); list is sorted by soonest due
**Next up:** Feature 11 — Future-me letters (write a note that shows during impulse jail).

---

## Feature 9.1: Edit regret verdict — 13 Jun 2026
**What:** You can now change a purchase's verdict any time — tapping an expense (edit) shows a "was it worth it?" selector (😍/😐/😭, tap again to clear). The verdict shows as a small emoji on the Home row, and Insights' REGRET CHECK updates automatically.
**Why:** Shireen wanted to re-rate, not just rate once. Folded it into the existing edit modal (no separate flow). `regret` flows through the normal add/update payload, so all the regret insights recompute for free.
**Files changed:**
- `src/screens/AddExpenseModal.tsx` — verdict selector (add/edit)
- `src/screens/HomeScreen.tsx` — regret emoji on expense rows
**How to test:** Home → tap any expense → pick/change a "was it worth it?" verdict → save → emoji shows on the row, Insights REGRET CHECK reflects it.

---

## Feature 9: Regret audit — 13 Jun 2026
**What:** Purchases that are 7+ days old and unrated trigger a "🤔 was it worth it?" banner on Home. Tapping it opens a one-by-one review where you tap 😍 worth it / 😐 meh / 😭 regret. Insights gets a "REGRET CHECK" card: counts, money spent on regrets, and your most-regretted category.
**Why:** Reflection a week later (when the dopamine's gone) is where the real lesson lands — gently, no shame. Added a `regret` field to Expense + `rateExpense`. The review snapshots the eligible queue when it opens so ratings don't reshuffle mid-review. `daysSince` helper added.
**Files changed:**
- `src/types/index.ts` — `regret` on Expense
- `src/utils/index.ts` — `daysSince`
- `src/hooks/useAppContext.tsx` — `rateExpense`
- `src/screens/RegretAuditModal.tsx` — the review flow (new)
- `src/screens/HomeScreen.tsx` — regret banner + modal
- `src/screens/InsightsScreen.tsx` — REGRET CHECK card
**How to test:** (you need a 7+ day-old expense — use the date picker!)
1. Add an expense → tap **"📅 koi din"** → pick a date **8+ days ago** → log it
2. Go to **🏠 Home** → a 🤔 **"was it worth it?"** banner appears → tap it
3. Rate the purchase (😍/😐/😭) → it advances; rate all → "all done 💅"
4. Go to **✿ Insights** → **REGRET CHECK** card shows your counts + most-regretted category
5. The Home banner disappears once everything 7+ days old is rated
**Next up:** Feature 10 — Recurring bills (add, due-date countdown, one-tap log).

---

## Feature 8.1: Impulse Jail — release logs spend + bring-back — 13 Jun 2026
**What:** Two improvements Shireen asked for: (1) **releasing** (buying) a jailed item now logs a real expense (category "Other", note "<name> (impulse)", marked splurge) so it counts against the budget; (2) buried items have a **"bring back 🔁"** button that re-jails them and restarts the 24h clock. Also: release is no longer hard-locked — you can "buy anyway" early, but get a soft "itni jaldi? 👀" warning first.
**Why:** "Paise toh kharch ho hi gaye" — caving should hit the budget honestly. Re-jailing lets you reconsider something you buried. Making early-release possible (with a nudge) is realistic and testable. Released expenses land in "Other" — you can recategorise on Home via edit.
**Files changed:**
- `src/hooks/useAppContext.tsx` — `releaseImpulse` now logs an expense; new `rejailImpulse`
- `src/screens/ImpulseJailScreen.tsx` — soft early-release warning, bring-back button, "added to spending" note
**How to test:**
1. Jail tab → add an item → **buy anyway 🛍️** → confirm the "itni jaldi?" warning → it moves to YOU CAVED **and** appears on Home/Insights as a spend (budget goes up)
2. Bury another item → in the graveyard tap **bring back 🔁** → it returns to jail with a fresh 24h countdown
**Next up:** Feature 9 — Regret audit.

---

## Feature 8: Impulse Jail — 13 Jun 2026
**What:** The 🔒 Jail tab lets you "sentence" a tempting purchase (name, amount, why) to a 24-hour cool-off. A live countdown ticks down. You can **bury** (resist → money saved, goes to the graveyard) anytime, but **release** (buy) only unlocks after 24h. Shows total money saved, a receipts graveyard 🪦, and a "you caved" list.
**Why:** The signature behavioural feature — delaying impulse buys kills most of them. Locking "release" for 24h enforces the cool-off; allowing "bury" anytime rewards early resistance. New `ImpulseItem` type + storage key + 4 state actions. Countdown uses a 1-second tick that only runs while something is jailed (battery-friendly). Long-press removes graveyard/caved items.
**Files changed:**
- `src/types/index.ts` — `ImpulseItem`
- `src/storage/index.ts` — `om_impulse` key
- `src/hooks/useAppContext.tsx` — `addImpulse`, `buryImpulse`, `releaseImpulse`, `deleteImpulse`
- `src/screens/AddToJailModal.tsx` — sentence form (new)
- `src/screens/ImpulseJailScreen.tsx` — jail + graveyard (rewritten)
**How to test:**
1. Reload → **🔒 Jail** tab → tap the purple **"+"**
2. Add something tempting (e.g. "zara dress", ₹3000, "saw it on insta") → "sentence it 🔒"
3. It appears IN JAIL with a **live countdown** (watch the seconds tick)
4. **release** is locked ("release locked 🔒") until 24h pass — that's intentional
5. Tap **bury it 🪦** → a "you saved ₹X" alert → it moves to the **graveyard**, and the green "saved" banner updates
6. Add + bury a few → watch total saved grow 👑
7. Long-press a graveyard item to remove it
**Next up:** Feature 9 — Regret audit (7-day post-purchase "was it worth it?" prompt + regret patterns).

---

## Feature 7: Mood ↔ spending insights — 13 Jun 2026
**What:** Insights now has a "MOOD vs MONEY" card — spending grouped by the mood you tagged, biggest first, with % bars and a sassy headline about your top spending mood (e.g. stress-shopping callout).
**Why:** The mood was already captured at log time but never shown. This surfaces emotional spending patterns gently/funnily (no shame, just sass — the app's whole vibe). Only counts expenses that have a mood; shows a hint to start tagging if none yet. No new package — reused the breakdown-bar style.
**Files changed:**
- `src/screens/InsightsScreen.tsx` — mood breakdown card + `buildMoodLine` sassy lines
**How to test:**
1. Log a few expenses with **different moods** (tap a mood when adding — try 😩 stressed on a big one)
2. Go to **✿ Insights** → scroll to **MOOD vs MONEY**
3. See a headline line + a bar per mood showing how much you spent in each
4. (No moods tagged yet → you'll see a hint to start tagging)
**Next up:** Feature 8 — Impulse Jail (24h timer, release/bury, graveyard).

---

## Feature 6.1: Log any past date — 13 Jun 2026
**What:** The Add/Edit sheet now has a "📅 koi din" button next to Today/Yesterday that opens a native calendar to pick any past date.
**Why:** Shireen could only log Today/Yesterday, so backfilling older spends was impossible. Added `@react-native-community/datetimepicker` (bundled in Expo Go, so it works without a dev build). Future dates are blocked (`maximumDate`). The chosen date shows on the chip.
**Note:** Adding native packages (this + react-native-svg) needs a FULL dev-server restart (`npx expo start -c`), not just a JS reload — otherwise screens using them can render blank.
**Files changed:**
- `src/screens/AddExpenseModal.tsx` — date picker button + native picker
**How to test:** Add expense → tap "📅 koi din" → pick a date from last week → log it → it appears with that date, and Insights charts spread across more days.

---

## Feature 6: Insights screen — 13 Jun 2026
**What:** The ✿ Insights tab now shows: 4 summary cards (total spent, daily avg, biggest splurge, categories used), a 7-day bar chart, a 6-month trend chart, a category breakdown with % bars, and personalised "pookie's advice" tips.
**Why:** Seeing where money goes is the whole point. Built a reusable `BarChart` with **react-native-svg** (per CLAUDE.md's stack) — measures its own width via onLayout, then draws scaled `<Rect>` bars. Category breakdown uses simple View bars (like the budget bar). Reused `monthExpenses`/`sumExpenses` from calculations. Shows a friendly empty state until there's data.
**Packages added:** `react-native-svg` (for the chart bars — already named in the tech stack)
**Files changed:**
- `src/components/BarChart.tsx` — reusable SVG bar chart (new)
- `src/screens/InsightsScreen.tsx` — the full insights screen
**How to test:**
1. Make sure you've logged a few expenses (across different categories/days helps)
2. Go to the **✿ Insights** tab
3. Top: 4 cards with your totals
4. **Last 7 days** bar chart — taller bars = bigger spend days
5. **6 month trend** — this month vs previous months
6. **Where it went** — each category with a coloured % bar, biggest first
7. **Pookie's advice** — tips based on your top category + budget
8. (With zero expenses you'll see a 📊 empty state instead)
**Next up:** Feature 7 — mood tracking insights (mood↔spending correlation). Moods are already captured when logging; this will visualise them.

---

## Feature 5: Categories — custom category creation — 13 Jun 2026
**What:** The 30+ grouped categories already powered the Add modal; this adds **custom categories**. A "+ apni category" pill in the Add sheet opens a little maker: pick an emoji from a grid, type a name → it's created, saved, and auto-selected. A "Custom" group filter appears once you have any.
**Why:** Everyone spends on something the defaults miss (Art, Plants, etc.). Used a curated emoji grid instead of a free-text emoji field (easier + prettier, no emoji-picker library). New categories get an auto-assigned pastel colour and persist in storage. Added `addCustomCat` (returns the new category so the Add modal can select it) and `deleteCustomCat` (wired for a future Settings option).
**Files changed:**
- `src/screens/AddCategoryModal.tsx` — emoji-grid + name maker (new)
- `src/screens/AddExpenseModal.tsx` — "+ apni category" pill + Custom group
- `src/hooks/useAppContext.tsx` — `addCustomCat`, `deleteCustomCat`
**How to test:**
1. Reload → Home → tap **"+"** → in the category area, scroll to the dashed **"+ apni category"** pill, tap it
2. A maker pops up → type a name (e.g. "Plants") → pick an emoji 🪴 → tap **add ✦**
3. It closes and your new category is **already selected** (under the new **Custom** filter)
4. Log the expense → it shows up with your custom emoji + name on Home
5. Add another custom category → its colour is different (auto-rotated)
6. Custom categories stick around after closing/reopening the app
**Next up:** Feature 6 — Insights screen (7-day bar, 6-month trend, category breakdown).

---

## Feature 4.1: Edit logged expenses — 13 Jun 2026
**What:** You can now tap any expense in the RECENT list to edit it — the same sheet opens pre-filled, and the button reads "save changes". (Before, you could only delete.)
**Why:** Shireen noticed there was no way to fix a mistake after logging. Reused the Add modal with an `editing` prop instead of building a second screen. Date handling now keeps the original date when editing (shows it as a chip if it's not Today/Yesterday). Added `updateExpense` to the state hook. The ✕ still deletes (tap row = edit, tap ✕ = delete).
**Files changed:**
- `src/screens/AddExpenseModal.tsx` — add/edit modes, pre-fill, real date state
- `src/screens/HomeScreen.tsx` — rows are tappable → edit; shows mood/splurge tags
- `src/hooks/useAppContext.tsx` — `updateExpense`
**How to test:**
1. Reload → Home → **tap** any logged expense (not the ✕)
2. The sheet opens with everything filled in → change the amount/category/note
3. Tap **"save changes ✦"** → the expense updates and budget recalculates
4. The ✕ still deletes as before
**Next up:** Feature 5 — custom categories (emoji picker).

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
