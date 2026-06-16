# DIARY.md — Oops Money 💸
# Feature diary. Newest entries at the top. Updated after every feature.

---

## V3 — Salary Curve 💸 ("rich for 3 days") — 16 Jun 2026
**What:** Insights ✿ → a new **"RICH FOR 3 DAYS"** card showing how front-loaded the month's spending is: a sassy headline (e.g. *"aadha paisa 6 tareekh tak hi udd gaya 💸"*) plus a 4-bar chart of spend per week-of-month (1–7, 8–14, 15–21, 22+).
**Why:** The payday → broke arc is painfully relatable for the target user, and no boring expense app visualises it. Pure local maths; reuses the existing `BarChart`.
**How it works:** `getSalaryCurve()` buckets this month's expenses by day-of-month, computes the % spent in the first 10 days, and finds the day by which half the month's money was gone (`halfwayDay`). The headline switches based on those. Card only shows once there's spend this month.
**Files added/changed:**
- `src/utils/salaryCurve.ts` — the curve maths (new)
- `src/screens/InsightsScreen.tsx` — computes + renders the card (between trend and calendar)
**How to test on phone:** Reload → **Insights ✿** → scroll to **RICH FOR 3 DAYS** → bars show which week you spend most; log a few early-month expenses to see the "aadha paisa X tareekh tak" line.
**Next up:** Wishlist / Manifest Board 🌟.

---

## V3 — Paisa Personality 🔮 — 16 Jun 2026
**What:** Insights ✿ now opens with a **"YOUR PAISA PERSONALITY"** card — it reads your spending and gives you a fun, shareable archetype like 💅 The Glow-Up Queen, 🍕 The Foodie Forever, 😩 The Stress Spender, 💸 The Payday Baller, 🎉 The Weekend Warrior, ✨ The Soft-Launch Spender, 👑 Treat-Yourself Tycoon, or 💚 The Budgeting Baddie. Each has a sassy Hinglish tagline + a supporting stat, and a **share it ✦** button that sends it to WhatsApp/Insta/notes.
**Why:** No other expense app has a "personality type" — it's instantly screenshot-able and gives the dry numbers a fun, viral wrapper. 100% local maths over existing expenses, zero new data collected, zero new packages (uses RN's built-in `Share`).
**How it works:** `getPaisaPersonality()` tallies category-group shares (Beauty/Fashion/Food), splurge %, weekend %, first-10-days-of-month %, and stress/sad mood share, scores each archetype, and picks the strongest. Needs ≥5 expenses, else shows 🔮 "The Mystery Spender" (no share). If nothing dominates → 💚 Budgeting Baddie.
**Files added/changed:**
- `src/utils/personality.ts` — the archetype scoring (new)
- `src/components/PaisaPersonality.tsx` — the card + share (new)
- `src/screens/InsightsScreen.tsx` — mounts the card at the top
**How to test on phone:** Reload → **Insights ✿** → top card shows your personality (log a few expenses across categories/moods first) → tap **share it ✦** → share sheet opens with your archetype.
**Next up:** Salary Curve 💸 ("rich for 3 days").

---

## V2+ — Cloud Sync — Phase 2+3: keys pasted + sign-in + sync — 14 Jun 2026
**What:** Shireen created her Supabase project and pasted her Project URL + anon key into `supabaseConfig.ts`, and ran the SQL that creates the `app_state` table with RLS (each user can only touch their own row). Then built the working sign-in + backup/restore feature.
**How it works:** Settings 🎀 now shows a **CLOUD BACKUP ☁️** card (only visible once keys are configured). Signed out → "Sign in with Google" button. Signed in → shows email + **Back up ⬆️** / **Restore ⬇️** buttons + sign out. On first sign-in, if the cloud is empty it auto-backs-up; if a backup already exists it does NOT auto-overwrite local (user chooses), so nothing gets clobbered.
**Sign-in flow:** `implicit` flow — `signInWithOAuth` builds the Google URL, `WebBrowser.openAuthSessionAsync` opens it, tokens come back in the redirect fragment, `setSession` saves them. Redirect scheme = `oopsmoney://auth-callback`.
**Sync model:** `exportSnapshot()` bundles ALL AsyncStorage keys into one object → upserted as a JSONB blob in `app_state.data`. `restoreFromCloud()` downloads + `importSnapshot()` writes them back, then `reload()` refreshes the UI. Local stays the source of truth.
**Files added/changed:**
- `src/storage/index.ts` — `exportSnapshot` / `importSnapshot` helpers
- `src/lib/sync.ts` — `pushSnapshot` / `pullSnapshot` / `restoreFromCloud`
- `src/hooks/useAuth.tsx` — auth + sync brain (`AuthProvider` / `useAuth`)
- `src/components/CloudBackup.tsx` — the Settings card UI
- `src/screens/SettingsScreen.tsx` — renders `<CloudBackup />`
- `App.tsx` — wraps app in `<AuthProvider>` (inside `<AppProvider>`)
- `src/lib/supabase.ts` — `flowType: 'implicit'`; `supabaseConfig.ts` — real keys
**⚠️ Still needs (homework before the button works):** (1) Supabase dashboard → Authentication → Providers → enable **Google** with a Google Cloud OAuth client ID + secret, (2) add `oopsmoney://auth-callback` to Supabase redirect allow-list. Also: Google login redirect to the custom scheme only fully works in a **built APK / dev build**, not plain Expo Go.
**How to test (after Google provider setup + APK build):** Settings 🎀 → Cloud Backup → Sign in with Google → pick account → see your email + "pehla backup ho gaya". Reset app, sign in again, tap Restore ⬇️ → data comes back.

---

## V2+ — Cloud Sync (Supabase + Google) — Phase 1: scaffolding — 14 Jun 2026
**What:** Started the optional cloud-sync feature. This phase just lays the plumbing; nothing works until Shireen sets up her Supabase project.
**Decision:** This intentionally relaxes the "no backend" rule (sync only). Local AsyncStorage stays authoritative; sign-in is **optional** (a "sync/back up" layer, not a login gate). Supabase chosen (anon key is client-safe with RLS). Google sign-in.
**Sync model (simple):** one `app_state` row per user holding the WHOLE app state as a single JSONB blob (mirrors how everything is already stored as JSON locally). Sync = upsert the snapshot; on login pull it. Last-write-wins by `updated_at`.
**Packages added:** `@supabase/supabase-js`, `react-native-url-polyfill`, `expo-web-browser`, `expo-auth-session` (all Expo Go compatible).
**Files added/changed:**
- `src/lib/supabaseConfig.ts` — placeholders for SUPABASE_URL + anon key (she pastes hers)
- `src/lib/supabase.ts` — the client (AsyncStorage-persisted session) + `isSupabaseConfigured` guard
- `app.json` — added `scheme: "oopsmoney"` (for the OAuth redirect) + `expo-web-browser` plugin
**Next phases:** (2) auth context + "Sign in to sync" UI in Settings + Google OAuth flow, (3) sync logic (push/pull the JSON blob). Both need her Supabase project + keys first.

---

## V2+ — Themes & Dark Mode 🎨 — 14 Jun 2026 (big refactor)
**What:** Settings 🎀 → **THEME 🎨** card lets you switch between **7 colour palettes**: Pookie Pink (default), 🌙 Dark Mode, 🌅 Sunset Peach, 🌿 Minty Cool, 💜 Lavender Dream, 🍬 Cotton Candy, ☕ Mocha. The choice applies instantly across the whole app and is remembered. The status bar + tab bar flip too.
**Why / how (IMPORTANT for future me):** Colours were a static `colors` import baked into each `StyleSheet.create` at load time, so they couldn't change at runtime. The refactor:
- `src/constants/theme.ts` now defines a `ThemeColors` type, 7 `Palette`s, and a new **`onAccent`** token (the colour for text/labels sitting on saturated buttons — needed so dark mode stays readable). `spacing`/`radius`/`typography` stayed static.
- `src/hooks/useTheme.tsx` (new) — `ThemeProvider` holds the active palette id (persisted), `useTheme()` returns the live colours, `useThemeMeta()` gives the picker + dark flag.
- **Every screen/component (24 files)** changed its `const styles = StyleSheet.create({...})` into `const makeStyles = (colors: ThemeColors) => StyleSheet.create({...})`, and now calls `const colors = useTheme(); const styles = makeStyles(colors);` at the top. Button labels switched from `colors.cardBg` → `colors.onAccent`.
- `getBudgetState` takes the theme so the budget bar matches; `CycleTracker` phase colours + `SpendCalendar` heatmap colours moved inside the component (were module-level).
- `App.tsx` wraps everything in `<ThemeProvider>`; the status bar uses the palette's `dark` flag.
**Packages:** none — pure refactor.
**How to test on phone:**
1. Reload → **Settings 🎀 → THEME 🎨** → tap each palette → whole app recolours instantly
2. Pick **🌙 Dark Mode** → backgrounds go dark, text light, status bar icons flip — check Home, Insights, Add-expense sheet, Jail, Settings all look right
3. Force-close + reopen → your chosen theme persists
**Next up:** a fresh APK build (lots of new stuff since the last one), or more features.

---

## V2+ — Bestie Accountability Mode 🤝 (local) — 13 Jun 2026
**What:** Settings 🎀 → **BESTIE MODE** card: save an accountability bestie (name + optional WhatsApp number). A **"💌 confess to <bestie>"** button — and a Home banner when you go over budget — open WhatsApp (or the OS share sheet) pre-filled with a sassy auto-message: *"oops bestie 💀 maine is mahine ₹X kharch kar diya (budget ₹Y — ₹Z over). roko mujhe pls 🙏"*. You hit send.
**Why this approach (IMPORTANT):** CLAUDE.md lists Bestie mode as "needs backend — not in v1", and the *real-time* version (bestie sees your live data) genuinely does. But Shireen chose to stay **local / no-backend**. So this is the no-backend version: the app only **builds the message and hands it to your phone's WhatsApp/SMS/share** — no data is sent anywhere automatically, no server, no account linking. Uses core React Native `Linking` (WhatsApp deep link `whatsapp://send?phone=…&text=…`) with a `Share.share()` fallback. **Zero new packages.**
**Files changed:**
- `src/utils/bestie.ts` — confession message builder + WhatsApp/share opener (new)
- `src/storage/index.ts` — `bestieName` + `bestiePhone` keys
- `src/hooks/useAppContext.tsx` — `bestieName`/`bestiePhone` + `setBestie`
- `src/components/BestieMode.tsx` — Settings UI (new)
- `src/screens/HomeScreen.tsx` — over-budget "confess to bestie" banner
**How to test on phone:**
1. Reload → **Settings 🎀 → BESTIE MODE** → add a name (+ optional WhatsApp number with country code, e.g. 9198…) → **save bestie ✦**
2. Tap **💌 confess to <name>** → WhatsApp opens (if number set) or the share sheet, pre-filled with the message → pick a chat → send
3. When you go over budget, a **🤝 confess** banner appears on Home too
**Next up:** more local features, polish, or a fresh APK build with all the new stuff.

---

## V2+ — Bill Reminders 🔔 (notifications) — 13 Jun 2026
**What:** Settings 🎀 → **🔔 Bill reminders** toggle. When on, each recurring bill (Bills tab 🔁) gets a local notification at 10 AM on its due day: "rent due hai aaj 🔔 — ₹15,000 ka bill, bhulna mat babe 💸". Reminders auto-reschedule to the next occurrence whenever bills change or the app opens.
**Why this approach:** Uses **local scheduled notifications only** — no push server, no backend (our rule). Turning the toggle on requests notification permission; if denied, it flips back off and explains. The schedule is refreshed on every launch so each bill always points at its next upcoming due date (a robust pattern vs fragile monthly-repeat triggers).
**Package added:** `expo-notifications` (~0.32.17) — was listed in CLAUDE.md's stack but not installed. **Local notifications work in Expo Go (Android)**; they're rock-solid in the standalone APK.
**Files changed:**
- `src/utils/notifications.ts` — permission + schedule/cancel local reminders (new)
- `src/storage/index.ts` — `billReminders` key
- `src/hooks/useAppContext.tsx` — `billReminders` + `setBillReminders` + auto-reschedule effect
- `src/screens/SettingsScreen.tsx` — 🔔 toggle (handles permission denial)
- `app.json` — `expo-notifications` plugin
**How to test on phone:**
1. Reload the app → **Settings 🎀** → turn on **🔔 Bill reminders** → allow notifications
2. **Bills 🔁** → add a bill with **today's date** as the due day (if it's before 10 AM) to see it fire, or set tomorrow's day and check tomorrow morning
3. Toggle off → all reminders cancel
4. ⚠️ In Expo Go a permissions warning may appear; reminders still schedule. Fully reliable in the installed APK.

---

## V2+ — Spend Calendar Heatmap 🗓️ — 13 Jun 2026
**What:** Insights ✿ → a **month calendar** where each day is colour-coded by how much you spent: cream = no-spend day, mint = light, peach = medium, rose = heavy. Today gets a lavender ring. A legend + "busiest: ₹X" sits below.
**Why:** A bar chart shows totals; a calendar shows *rhythm* — which days/weekends you splurge, and how many no-spend days you're stacking. Pure view over existing expenses, no storage/state added.
**Files changed:**
- `src/components/SpendCalendar.tsx` — the heatmap grid (new)
- `src/screens/InsightsScreen.tsx` — mounts the calendar card
**How to test:** Insights ✿ → scroll to **"<MONTH> CALENDAR"** → days with more spend are darker/hotter; today is ringed.

---

## V2+ — Sapna Jar 🫙 (savings goals) — 13 Jun 2026
**What:** Settings 🎀 → **🫙 Sapna Jar** opens a modal where you set savings goals ("Goa trip ₹15,000"), then stash money toward each one (jodo 🪙 / nikalo). A progress bar fills as you save; at 100% it celebrates "🎉 sapna poora!". Fully local.
**Why:** A positive counterweight to all the "stop spending" features — gives saving a visible, rewarding goal. Lives in a modal (like CSV import) so it doesn't need a new tab.
**Files changed:**
- `src/types/index.ts` — `Goal` interface
- `src/storage/index.ts` — `goals` key
- `src/hooks/useAppContext.tsx` — `goals` + addGoal/addToGoal/withdrawFromGoal/deleteGoal
- `src/screens/GoalsModal.tsx` — the jar UI (new)
- `src/screens/SettingsScreen.tsx` — Sapna Jar button + modal
**How to test:** Settings → 🫙 Sapna Jar → add a goal (emoji + name + target) → type an amount → **jodo 🪙** → watch the bar fill; **nikalo** takes it back; ✕ deletes.

---

## V2+ — Category Budgets 🎯 — 13 Jun 2026
**What:** Settings 🎀 → **CATEGORY BUDGETS** card: pick a category, set a monthly limit (e.g. Makeup ₹2,000). Shows this-month spent vs limit with a colour-coded bar (green/peach/rose). Crossing a limit fires a 🎯 danger alert on Home + Insights.
**Why:** A single overall budget hides where the leak is; per-category limits catch the specific category (makeup, food delivery) that blows up. Reuses the existing alert system — just added one more param (`catBudgets`) to `getAlerts`, defaulted so nothing else broke.
**Files changed:**
- `src/types/index.ts` — `CatBudgets` type
- `src/storage/index.ts` — `catBudgets` key
- `src/hooks/useAppContext.tsx` — `catBudgets` + setCatBudget/removeCatBudget
- `src/utils/calculations.ts` — `getAlerts` now adds per-category over-limit alerts
- `src/components/CategoryBudgets.tsx` — Settings UI (new)
- `src/screens/HomeScreen.tsx` + `InsightsScreen.tsx` — pass `catBudgets` to `getAlerts`
**How to test:** Settings → CATEGORY BUDGETS → pick a category, type a small limit, **set ✦** → spend over it → a 🎯 "limit cross!" alert shows on Home.

---

## V2 — Screenshot Add 📸 — 13 Jun 2026
**What:** In the add-expense sheet you can now tap **"📸 payment screenshot lagao"**, pick a GPay/PhonePe/bank screenshot from your gallery, and it gets attached to the expense as proof. A thumbnail shows in the sheet; the Home list shows a 📎 marker on expenses that have one; tapping an expense (edit) shows the screenshot again.
**Why this approach (IMPORTANT — read this):** True auto-OCR (reading the amount off the image automatically) needs either a cloud OCR API (we have a strict NO-backend/NO-cloud rule) or a native on-device OCR module like ML Kit (needs a dev build — **breaks Expo Go**, same problem as real voice STT). There is no pure-JS OCR that runs in Expo Go's Hermes engine. So this version does the honest, Expo-Go-friendly thing: **attach the screenshot as the receipt**, and you fill the amount in 2 seconds using the 🎤 voice box right above it (which is already there). You get proof + fast entry today, with zero workflow breakage. **Future upgrade path:** once we go full EAS dev-build, we can drop in `@react-native-ml-kit/text-recognition` to auto-read the amount — the `receiptUri` plumbing is already in place for it.
**Package added:** `expo-image-picker` (~17.0.11) — standard Expo module, **works in Expo Go**, same family as the `expo-document-picker` we already use for CSV. Picks the image; we copy it into the app's document directory (via `expo-file-system`) so it persists.
**Files changed:**
- `src/types/index.ts` — `Expense.receiptUri?`
- `src/screens/AddExpenseModal.tsx` — 📸 pick + persist + thumbnail, saved on the expense
- `src/screens/HomeScreen.tsx` — 📎 marker on expenses with a screenshot
- `app.json` — `expo-image-picker` plugin + gallery permission text (for future EAS build; Expo Go ignores it)
**How to test on phone:**
1. Reload the app
2. Tap **+** → scroll to **"📸 payment screenshot lagao"** → allow gallery access → pick any screenshot
3. Thumbnail appears; use the **🎤 box** above to type/say "499 Swiggy" → **log this spend ✦**
4. On Home, that expense shows a **📎**; tap it → the screenshot shows again in the edit sheet
**Next up:** All V2 features done 🎉 — remaining V1 checklist item is the EAS Build APK (icons + eas.json already set up, uncommitted).

---

## V2 — Period / Cycle Tracking 🌸 — 13 Jun 2026
**What:** In **Settings 🎀** there's a new **🌸 Cycle Tracking** card: tap "period shuru hua aaj" (or pick a past date) to log period start dates, set your cycle length (20–45 days stepper), and see a supportive current-phase banner + predicted next period. In **Insights ✿** a new **"CYCLE vs MONEY"** card compares your average daily spend in the PMS week vs the rest of the cycle, with a gentle, non-judgmental line.
**Why:** Cravings + impulse buys often spike in the PMS week; surfacing that pattern (without shame) helps her plan. 100% local & private — no package, no backend, just date maths. Logging lives in Settings (like future-me letters), the insight in Insights (like mood-vs-money), so it slots into the existing patterns without a new tab.
**The maths (`src/utils/cycle.ts`):** `getCycleInfo` → current phase (period / pms / normal) + next-period prediction from cycle length. `getCycleSpendInsight` → projects PMS windows (5 days before each period start) across all your data, then compares PMS daily-avg vs other daily-avg. Verified with a test run (correctly catches PMS-heavy spending, handles no-data).
**Files changed:**
- `src/utils/cycle.ts` — cycle phase + PMS-spend maths (new)
- `src/components/CycleTracker.tsx` — Settings logging UI (new)
- `src/storage/index.ts` — `periodStarts` + `cycleLength` keys
- `src/hooks/useAppContext.tsx` — `periodStarts`, `cycleLength` + log/remove/setLength actions
- `src/screens/SettingsScreen.tsx` — mounts CycleTracker
- `src/screens/InsightsScreen.tsx` — CYCLE vs MONEY card
**How to test on phone:**
1. Reload the app
2. **🎀 Settings** → **🌸 Cycle Tracking** → tap **"period shuru hua aaj"** (and add 1–2 past dates via 📅 for a better pattern)
3. See the phase banner + **🔮 agla period** prediction; nudge cycle length with − / +
4. **✿ Insights** → scroll to **CYCLE vs MONEY** → it compares PMS-week vs other-days daily spend
**Next up:** Screenshot add 📸 (last V2 feature).

---

## V2 — Voice Logging 🎤 — 13 Jun 2026
**What:** A "🎤 bol ke bharo" box at the top of the add-expense sheet. You tap your phone keyboard's mic and say something like "500 Zomato" or "do hazaar Myntra"; tap **samjho ✨** and the form auto-fills — amount + best-guess category + the phrase as a note. You review and log as normal.
**Why this approach (IMPORTANT):** Real speech-recognition npm packages (`@react-native-voice/voice`, `expo-speech-recognition`) need a native dev build and **do NOT work in Expo Go** — they'd break our "test instantly on phone" workflow and force an EAS build for every test. So instead we lean on the keyboard's built-in mic (every Android keyboard has it) for the actual speech→text, and added a smart **text parser** that pulls the amount and category out. Result: same "speak your spend" feel, **zero new packages**, works in Expo Go today.
**The parser (`src/utils/index.ts`):** understands digits ("500", "1,500", "2k"), Hinglish/English number words + multipliers ("do hazaar" = 2000, "paanch sau" = 500, "do hazaar paanch sau" = 2500, "ek lakh" = 100000), and detects category from merchant names (Swiggy→Khaana, Myntra→Fashion, Uber→Transport) or category labels. Verified with a test run.
**Files changed:**
- `src/utils/index.ts` — `parseSpokenExpense` / `parseSpokenAmount` / `parseSpokenCategory` (new)
- `src/screens/AddExpenseModal.tsx` — the 🎤 voice box + auto-fill
**How to test on phone:**
1. Reload the app
2. Tap **+** on Home → at the top you'll see **"🎤 bol ke bharo"**
3. Tap inside the box → tap the **mic icon on your keyboard** → say *"do hazaar Myntra"* (or just type it)
4. Tap **samjho ✨** → amount becomes ₹2,000, category jumps to Fashion, and a "samajh gaya ✓" line shows
5. Try *"500 Zomato"*, *"teen sau Uber"*, *"paanch sau cafe"* — review the filled form, then **log this spend ✦**
6. Note: at night the late-night shield still shows first (tap "abhi log karna hai" to reach this).
**Next up:** Period/cycle tracking or Screenshot OCR (last two V2 features).

---

## V2 — Late-Night Shopping Shield 🌙 — 13 Jun 2026 (first V2 feature)
**What:** When you open "naya kharcha" between 11pm–4am, a sassy interception appears FIRST — "so jao na, babe", a random late-night line, and (if you've written any) one of your own future-me letters. Two choices: "theek hai, so jaati hoon 😴" (closes the sheet) or "nahi, abhi log karna hai" (drops you into the normal add form). Editing an existing spend at night is NOT shielded. There's a Settings toggle to turn it off (default ON).
**Why:** Late-night scrolling is peak impulse-buy time; a tiny friction + your own past words is enough to break the autopilot, without ever blocking you. Fully local — no backend, no notifications, just a time check (`isLateNight`). Built it INSIDE the add-expense sheet so every entry path (Home FAB) is covered automatically; gated behind a `bypassed` flag so once you choose to log, it doesn't nag again that session.
**Files changed:**
- `src/components/NightShield.tsx` — the interception screen (new)
- `src/utils/index.ts` — `isLateNight()` helper (11pm–4am window)
- `src/storage/index.ts` — new `nightShield` key
- `src/hooks/useAppContext.tsx` — `nightShield` state + `setNightShield` (default ON)
- `src/screens/AddExpenseModal.tsx` — shows shield before the form when shielded
- `src/screens/SettingsScreen.tsx` — 🌙 Late-night shield toggle
**How to test on phone:**
1. Reload the app (shake → Reload, or `r` in terminal)
2. **Quick test any time of day:** go to **🎀 Settings**, you'll see the new **🌙 Late-night shield** toggle near the top — confirm it's ON.
3. **Real test (after 11pm):** tap **+** on Home to add a spend → you should see the moon "so jao na, babe" screen instead of the form. If you wrote a future-me letter (Settings → 💌), it shows here too.
4. Tap **"nahi, abhi log karna hai"** → normal add form opens. Tap **"so jaati hoon"** → sheet closes.
5. Turn the toggle OFF in Settings → at night the add form opens directly (no shield).
6. **Can't stay up till 11pm?** Tell me and I'll temporarily widen the window so you can test in daytime.
**Next up:** pick the next V2 feature — Period/cycle tracking, Voice logging, or Screenshot OCR.

---

## Feature 17: CSV import — 13 Jun 2026 🎉 (final V1 feature)
**What:** Settings → "📂 Import bank statement" lets you pick a bank CSV (HDFC/ICICI/SBI/Paytm), auto-detects categories from the description (via the merchant map), shows a preview, and bulk-imports all debits as expenses.
**Why:** Backfilling a whole month by hand is painful; importing a statement is instant. Ported the prototype's robust parser (finds the header row, handles dd/mm/yyyy + yyyy-mm-dd, skips non-debits). Added `bulkAddExpenses`. Imported items are tagged `imported`.
**Packages added:** `expo-document-picker` (pick the file) + `expo-file-system` (read it) — both bundled in Expo Go. Read via `expo-file-system/legacy` (`readAsStringAsync`).
**Files changed:**
- `src/utils/csv.ts` — `parseBankCSV` (new)
- `src/screens/CSVImportModal.tsx` — pick → preview → import (new)
- `src/hooks/useAppContext.tsx` — `bulkAddExpenses`
- `src/screens/SettingsScreen.tsx` — import button
**Needs a FULL restart** (`npx expo start -c`) — new native modules.
**How to test:**
1. Restart with `npx expo start -c`
2. **🎀 Settings** → **"📂 Import bank statement"**
3. Tap "choose CSV file" → pick a bank statement CSV from your phone
4. See "found X transactions" with auto-detected category emojis → "import all ✦"
5. Check Home/Insights — the transactions are in, categorised
**Next up:** All 17 V1 features done! Remaining: EAS Build APK (packaging, not a code feature).

---

## Feature 16: Monthly Wrapped — 13 Jun 2026
**What:** A "✨ Monthly Wrapped" button on Insights opens a Spotify-Wrapped-style recap card: total spent, top category, biggest splurge, no-spend days, money resisted in jail, top mood, regrets — plus a **share** button that shares a text recap via the phone's share sheet.
**Why:** A shareable recap makes the app fun and word-of-mouth-y. Used React Native's built-in `Share` (text recap) — no extra package. Image-capture sharing (view-shot) can come later if wanted.
**Files changed:**
- `src/screens/MonthlyWrappedModal.tsx` — the recap card + share (new)
- `src/screens/InsightsScreen.tsx` — entry button
**How to test:**
1. **✿ Insights** → tap **"✨ see your Monthly Wrapped"**
2. A recap card slides up with your month's stats
3. Tap **"share it ✦"** → the phone share sheet opens with a text recap (send to WhatsApp/notes/etc.)
**Next up:** Feature 17 (final!) — CSV import (bank statement → auto-detect categories).

---

## Feature 15: Receipts Graveyard — 13 Jun 2026
**What:** Polished the buried-items graveyard in the Jail tab into a proper 2-column tombstone grid — each 🪦 tombstone (gravestone-shaped card) shows the item name struck through, "RIP bestie", the money saved, and the date buried. Count in the header; bring-back + long-press-delete kept.
**Why:** The graveyard is the emotional payoff of resisting — making it look like an actual graveyard of dead impulse buys is satisfying and shareable. Reused the existing buried data (added the buried date from `decidedAt`).
**Files changed:**
- `src/screens/ImpulseJailScreen.tsx` — tombstone grid + `isoOfMs` date helper
**How to test:**
1. **🔒 Jail** → add an item → **bury 🪦** it → repeat a few times
2. Scroll to **RECEIPTS GRAVEYARD** → see a grid of tombstones with struck-through names, "saved ₹X", and "buried <date>"
3. **bring back 🔁** returns one to jail; **long-press** a tombstone removes it
**Next up:** Feature 16 — Monthly Wrapped (shareable recap card).

---

## Feature 14: Streaks — 13 Jun 2026
**What:** A streak card on Home showing 🔥 consecutive days you stayed within your daily budget and 🍽️ no-spend days this month. On a day with zero spending, a "no spend day! you ate 🍽️" celebration line appears.
**Why:** Positive reinforcement > guilt. Streaks make good habits feel like a game. `getStreaks` walks back from today counting days where daily spend ≤ (budget ÷ days in month); no-spend days are counted across the month. The within-budget streak only shows if a budget is set.
**Files changed:**
- `src/utils/calculations.ts` — `getStreaks`
- `src/screens/HomeScreen.tsx` — streak card + no-spend celebration
**How to test:**
1. **🏠 Home** → near the top, a purple card shows 🔥 din-budget-mein + 🍽️ no-spend-days
2. If you haven't logged anything today → "no spend day! you ate 🍽️" shows
3. Log a small amount today (under your daily budget) → streak holds; log a huge amount → streak resets next time
4. Backdate a no-spend gap with the date picker to see the no-spend count change
**Next up:** Feature 15 — Receipts Graveyard (tombstones for buried impulse items — partly exists in Jail; will make it its own polished view).

---

## Feature 13: Danger alerts — 13 Jun 2026
**What:** The 4 danger alerts (80%+ budget, over budget, one category dominating, today 2× the daily average) now show on **both** Home and Insights, plus a new **"splurge fund khatam!"** alert when splurge spending exceeds your splurge fund. Pulled the alert card into a reusable `<AlertList>`.
**Why:** Alerts are the app's "tap on the shoulder" — they should appear wherever you look at money, not just Home. The splurge alert closes the loop on the splurge-fund feature. DRY'd the card markup so the look can't drift between screens.
**Note:** In-app alerts only for now. Push/scheduled notifications (expo-notifications) are deferred — Expo Go on SDK 54 has limited notification support; they'll slot in cleanly for the EAS build since the alert logic is already centralised in `getAlerts`.
**Files changed:**
- `src/utils/calculations.ts` — `getAlerts` takes splurge fund + adds the splurge alert
- `src/components/AlertList.tsx` — reusable alert cards (new)
- `src/screens/HomeScreen.tsx` + `src/screens/InsightsScreen.tsx` — use AlertList
**How to test:**
1. Log expenses until you cross ~80% of budget → ⚠️ "Danger zone, babe!" appears on Home AND Insights
2. Go over budget → 💀 "oops, budget gaya"
3. Put most spend in one category → 💸 dominance alert
4. Mark expenses as splurge 🛍️ beyond your splurge fund → 🛍️ "splurge fund khatam!"
**Next up:** Feature 14 — Streaks (budget-within days, no-spend-day celebrations).

---

## Feature 12: Broke Math translator — 13 Jun 2026
**What:** As you type an amount (in Add Expense and in Impulse Jail), little "broke math 🧮" chips appear translating it into relatable units: coffees (₹250), days of your salary, months of Netflix (₹649), auto rides (₹50).
**Why:** "₹3000" feels abstract; "12 coffees / 3 days of your salary" hits different — great for second-guessing impulse buys. Made `brokeMath(amount, income)` (pure) + a reusable `<BrokeMath amount>` component that reads income from context. Days-of-salary only shows if income is set.
**Files changed:**
- `src/utils/index.ts` — `brokeMath` helper
- `src/components/BrokeMath.tsx` — chips component (new)
- `src/screens/AddExpenseModal.tsx` + `src/screens/AddToJailModal.tsx` — show it live under the amount
**How to test:**
1. Home → "+" → type an amount (e.g. 3000) → "broke math 🧮" chips appear (☕ coffees, 💼 din ki kamai, etc.)
2. Same in **🔒 Jail** → "+" → type an amount → see the chips (makes you reconsider 👀)
3. Bigger amount = more/bigger numbers
**Next up:** Feature 13 — Danger alerts (80%/over/category dominance/daily 2x — Home already has these; will round out + notifications check).

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
