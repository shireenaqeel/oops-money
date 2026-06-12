# DIARY.md — Oops Money 💸
# Feature diary. Newest entries at the top. Updated after every feature.

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
