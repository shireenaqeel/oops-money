# CLAUDE.md — Oops Money 💸
# This file is your instruction manual. Read this EVERY time before doing anything.

---

## 👩‍💻 Who I am (the human)
- I am a complete coding and GitHub beginner
- Explain EVERYTHING in simple terms — what you're doing AND why
- Before making any change, tell me: "Main ab X kar raha hoon, kyunki Y"
- Break every task into small visible steps
- Never assume I know technical things
- After every feature: tell me exactly what to test on my phone

---

## 💸 What this project is
"Oops Money" — an aesthetic expense tracker Android app for Indian girls
who are beginners at money management.

**Vibe:** Playful, sassy, non-judgmental. No shame, just sass.
**Tagline:** "oops, maine phir se kharch kar diya"
**Target user:** Indian women, 18–28, chaotic with money, impulse buyers, beginners
**Language:** Hinglish microcopy (labels/toasts in Hinglish), English in code
**Reference:** pookie_tracker.html in this folder — read it for logic and features

---

## 🛠️ Tech Stack — NEVER change these without asking

- **Framework:** Expo React Native with TypeScript (NOT bare React Native)
- **Storage:** AsyncStorage only — NO backend, NO Firebase, NO Supabase, NO cloud
- **Navigation:** React Navigation bottom tabs
- **Notifications:** expo-notifications
- **Charts:** Custom SVG bars using react-native-svg (NO victory-native, too heavy)
- **Build:** EAS Build for APK (NOT Android Studio)
- **Testing:** Expo Go app on phone during development

---

## 📁 Folder Structure — always maintain this

```
oops-money/
├── App.tsx                    ← entry point + navigation
├── app.json                   ← Expo config
├── CLAUDE.md                  ← this file
├── DIARY.md                   ← feature diary (update after every feature)
├── pookie_tracker.html        ← reference prototype
└── src/
    ├── screens/               ← one file per screen
    │   ├── OnboardingScreen.tsx
    │   ├── HomeScreen.tsx
    │   ├── AddExpenseModal.tsx
    │   ├── InsightsScreen.tsx
    │   ├── ImpulseJailScreen.tsx
    │   └── SettingsScreen.tsx
    ├── components/            ← reusable UI pieces
    │   └── shared.tsx
    ├── hooks/
    │   └── useAppContext.tsx  ← main state management
    ├── storage/
    │   └── index.ts          ← all AsyncStorage logic
    ├── utils/
    │   └── index.ts          ← formatting, calculations, helpers
    ├── types/
    │   └── index.ts          ← all TypeScript interfaces
    └── constants/
        ├── theme.ts          ← design tokens (colors, spacing, etc.)
        └── categories.ts     ← all 30+ categories + merchant map
```

---

## 🎨 Design System — use EXACTLY these values, always

### Full Pastel Color Palette

#### Primary Colors (main UI)
```
rose:        #F4A7C3   ← buttons, primary actions, active states
lavender:    #C9B8E8   ← secondary actions, category chips
skyBlue:     #A8D8EA   ← highlights, info cards, links
peach:       #F7C5A0   ← warnings, warm accents
mint:        #B8E8C8   ← success states, safe budget bar
```

#### Backgrounds & Text
```
cream:       #FDF6FA   ← main app background — ALWAYS use this
cardBg:      #FFFFFF   ← inside cards
text:        #4A3F4A   ← all body text
textLight:   #8A7A8A   ← subtitles, secondary info
textMuted:   #B8A8B8   ← placeholders, ghost text
```

#### Accent Colors (charts, tags, variety)
```
babyBlue:    #B5D5F5   ← charts, mood tags, data viz
periwinkle:  #C4C0E8   ← streak cards, achievement badges
butter:      #FAE5A0   ← fun facts, did-you-know cards
coral:       #F5B8A8   ← regret audit, oops moments
sage:        #B0D4C0   ← savings, goals, calm states
lilac:       #E0C8F0   ← impulse jail UI
powderBlue:  #C0DCF0   ← info banners, CSV import
blush:       #F8D0DC   ← splurge fund, guilt-free zone
```

#### Status / Budget Bar
```
budgetSafe:    #B8E8C8   ← 0% to 74% spent
budgetWarning: #F7C5A0   ← 75% to 99% spent
budgetOver:    #F4A7C3   ← 100%+ spent (over budget)
dangerDeep:    #E8678A   ← critical alert text color
```

#### Shadows & Borders
```
cardShadow:  rgba(201, 184, 232, 0.25)   ← all card shadows (lavender tint)
border:      rgba(74, 63, 74, 0.08)      ← dividers, outlines
```

### Typography
```
display:  44px, weight 800   ← big rupee amounts
heading:  28px, weight 700   ← screen titles
title:    21px, weight 700   ← card headings
body:     15px, weight 400   ← normal text
small:    13px, weight 400   ← hints, dates
tiny:     11px, weight 400   ← badges, chips
```

### Spacing Scale
```
xs: 4px  |  sm: 8px  |  md: 16px  |  lg: 24px  |  xl: 32px  |  xxl: 48px
```

### Border Radius
```
cards:   24px
modals:  24px
buttons: 999px (always pill shape)
chips:   999px
inputs:  16px
small:   12px
```

---

## 🇮🇳 Indian Formatting Rules — NEVER break these

- Always use ₹ symbol
- Indian number system: ₹1,50,000 (NOT ₹150,000)
- Short form: ₹1.5L (lakh), ₹2.3K (thousand)
- Never show paise/decimals in rupee display
- Dates: "12 Jun", "Today", "Yesterday" (not MM/DD/YYYY)

---

## 💬 Microcopy Rules — use these exact phrases

```
Amount input placeholder : "how much, babe?"
After logging expense    : "logged babe 🌸"
Over budget alert        : "oops, budget gaya 💀"
Near budget warning      : "danger zone, babe!"
Empty state              : "nothing here yet babe ✨"
Loading state            : "loading your chaos..."
Impulse jail success     : "sentenced! come back tomorrow 🔒"
Buried item              : "RIP bestie 🪦 you saved ₹X"
Regret prompt            : "was it worth it? be honest babe"
No spend day             : "no spend day! you ate 🍽️"
Budget safe zone         : "you're doing great babe 💚"
```

---

## ✅ V1 Features — build in this order

- [x] 1. Project scaffold + navigation
- [x] 2. Onboarding screen (income → budget → splurge fund → done)
- [x] 3. Home screen (budget card, alerts, recent expenses)
- [x] 4. Add expense modal (amount, category, mood, note, splurge toggle)
- [x] 5. Categories (30+ with groups, custom category creation)
- [ ] 6. Insights screen (7-day bar, 6-month trend, category % breakdown)
- [ ] 7. Mood tracking + mood-spending correlation in insights
- [ ] 8. Impulse Jail (24h timer, release/bury, graveyard)
- [ ] 9. Regret audit (7-day post-purchase prompt, regret patterns)
- [ ] 10. Recurring bills (add, due-date countdown, one-tap log)
- [ ] 11. Future-me letters (write, shows during impulse jail)
- [ ] 12. Broke Math translator (₹X = Y days salary / Z coffees)
- [ ] 13. Danger alerts (80% budget, over budget, category dominance, daily 2x)
- [ ] 14. Streaks (budget-within days, no-spend day celebrations)
- [ ] 15. Receipts Graveyard (tombstones for buried impulse items)
- [ ] 16. Monthly Wrapped card (shareable recap)
- [ ] 17. CSV import (HDFC/ICICI/SBI/Paytm, merchant auto-detect)

---

## 🚫 V2 — DO NOT build yet (just keep architecture clean for these)

- Bestie accountability mode (needs backend — not in v1)
- Period/cycle tracking integration
- Screenshot OCR auto-logging
- Voice logging
- Late-night shopping shield

---

## 📋 Categories Reference

### Groups and categories:
```
Beauty:       Makeup, Skincare, Haircare, Nails, Fragrance, Salon
Fashion:      Clothes, Accessories, Shoes
Food/Social:  Khaana, Café Dates, Parties, Groceries, Food Delivery
Health:       Gym, Medicines, Self-care, Therapy
Life:         Rent/Bills, Transport, Subscriptions, Utilities
Growth:       Padhai, Books
Travel:       Trips, Hotels
Misc:         Gifting, Pets, Gaming, Savings, Other
+ Custom:     user can create with emoji picker
```

### Merchant → Category auto-detect (CSV import):
```
Swiggy/Zomato    → Food Delivery
Nykaa/Sephora    → Makeup
Myntra/AJIO      → Clothes
Uber/Ola/Rapido  → Transport
Netflix/Spotify/Hotstar/Prime → Subscriptions
BigBasket/Blinkit/Zepto → Groceries
Cult.fit         → Gym
Amazon/Flipkart  → Other (ask user to confirm)
```

---

## ⚠️ Rules Claude Code Must Always Follow

1. Run `npx tsc --noEmit` after EVERY change — fix ALL TypeScript errors before moving on
2. NEVER delete a file without asking me first
3. NEVER add a new npm package without explaining: what it does, why we need it, alternatives considered
4. ALWAYS update DIARY.md after completing each feature
5. One component per file — no giant 500-line files
6. Every function needs a one-line comment explaining what it does
7. After each feature: "Ab yeh test karo phone pe: [exact steps]"
8. If something might break or take long: warn me first
9. Never use `any` type in TypeScript without a comment explaining why
10. Keep App.tsx clean — only navigation, no business logic

---

## 📔 DIARY.md Update Format

After every feature, add an entry to DIARY.md:

```
## [Feature Name] — [Date]
**What:** What was built in one line
**Why:** Why this approach was chosen
**Files changed:** list of files
**How to test:** exact steps to test on phone
**Next up:** what comes after this
```

---

## 🔁 Git Rules

- `git add -A && git commit` after every completed feature
- Commit message format: `feat: home screen — budget card + danger alerts`
- Other prefixes: `fix:` for bugs, `style:` for UI tweaks, `docs:` for DIARY updates
- Never commit broken TypeScript

---

## 📊 Current Status (update this as features get done)

```
[x] Project scaffold + Expo setup
[x] CLAUDE.md + DIARY.md created
[x] Onboarding screen
[x] Home screen
[x] Add expense modal
[x] Categories system
[ ] Insights screen
[ ] Mood tracking
[ ] Impulse Jail
[ ] Regret audit
[ ] Recurring bills
[ ] Future-me letters
[ ] Broke Math
[ ] Danger alerts
[ ] Streaks
[ ] Receipts Graveyard
[ ] Monthly Wrapped
[ ] CSV import
[ ] EAS Build APK
```

---

## 🧠 Context for every session

Every time a new Claude Code session starts, it should:
1. Read this CLAUDE.md fully
2. Read DIARY.md to see what's already done
3. Check current status checklist above
4. Ask: "Kahan se shuru karein?" before doing anything
