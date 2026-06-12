// theme.ts — design tokens (colours, spacing, radius, typography).
// SINGLE SOURCE OF TRUTH for styling. Never hardcode hex/sizes in screens — import from here.
// Values copied exactly from CLAUDE.md's design system.

// Full pastel colour palette.
export const colors = {
  // Primary (main UI)
  rose: '#F4A7C3', // buttons, primary actions, active states
  lavender: '#C9B8E8', // secondary actions, category chips
  skyBlue: '#A8D8EA', // highlights, info cards, links
  peach: '#F7C5A0', // warnings, warm accents
  mint: '#B8E8C8', // success states, safe budget bar

  // Backgrounds & text
  cream: '#FDF6FA', // main app background — ALWAYS use this
  cardBg: '#FFFFFF', // inside cards
  text: '#4A3F4A', // all body text
  textLight: '#8A7A8A', // subtitles, secondary info
  textMuted: '#B8A8B8', // placeholders, ghost text

  // Accents (charts, tags, variety)
  babyBlue: '#B5D5F5',
  periwinkle: '#C4C0E8',
  butter: '#FAE5A0',
  coral: '#F5B8A8',
  sage: '#B0D4C0',
  lilac: '#E0C8F0',
  powderBlue: '#C0DCF0',
  blush: '#F8D0DC',

  // Status / budget bar
  budgetSafe: '#B8E8C8', // 0–74% spent
  budgetWarning: '#F7C5A0', // 75–99% spent
  budgetOver: '#F4A7C3', // 100%+ spent
  dangerDeep: '#E8678A', // critical alert text

  // Shadows & borders
  cardShadow: 'rgba(201, 184, 232, 0.25)', // lavender-tinted card shadow
  border: 'rgba(74, 63, 74, 0.08)', // dividers, outlines
} as const;

// Spacing scale, in pixels.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Border radius values, in pixels. `buttons`/`chips` use 999 = full pill shape.
export const radius = {
  cards: 24,
  modals: 24,
  buttons: 999,
  chips: 999,
  inputs: 16,
  small: 12,
} as const;

// Typography presets. fontWeight is a string because React Native expects that.
export const typography = {
  display: { fontSize: 44, fontWeight: '800' as const }, // big rupee amounts
  heading: { fontSize: 28, fontWeight: '700' as const }, // screen titles
  title: { fontSize: 21, fontWeight: '700' as const }, // card headings
  body: { fontSize: 15, fontWeight: '400' as const }, // normal text
  small: { fontSize: 13, fontWeight: '400' as const }, // hints, dates
  tiny: { fontSize: 11, fontWeight: '400' as const }, // badges, chips
} as const;
