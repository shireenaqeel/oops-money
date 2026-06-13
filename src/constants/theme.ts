// theme.ts — design tokens. Spacing/radius/typography are fixed; COLOURS are themeable (V2).
// Components read the active palette via useTheme(); `colors` below is the default (Pookie Pink),
// kept as a back-compat export and the fallback for pure util functions.

// The full set of colour roles every palette must define.
export interface ThemeColors {
  // Primary (main UI)
  rose: string; // buttons, primary actions, active states
  lavender: string; // secondary actions, category chips
  skyBlue: string; // highlights, info cards
  peach: string; // warnings, warm accents
  mint: string; // success states, safe budget bar
  // Backgrounds & text
  cream: string; // main app background
  cardBg: string; // inside cards (surface)
  onAccent: string; // text/icon colour that sits on top of saturated accent fills (button labels)
  text: string; // body text
  textLight: string; // subtitles
  textMuted: string; // placeholders, ghost text
  // Accents
  babyBlue: string;
  periwinkle: string;
  butter: string;
  coral: string;
  sage: string;
  lilac: string;
  powderBlue: string;
  blush: string;
  // Status / budget bar
  budgetSafe: string;
  budgetWarning: string;
  budgetOver: string;
  dangerDeep: string;
  // Shadows & borders
  cardShadow: string;
  border: string;
}

// Pookie Pink — the original pastel palette (default, light).
const POOKIE_PINK: ThemeColors = {
  rose: '#F4A7C3',
  lavender: '#C9B8E8',
  skyBlue: '#A8D8EA',
  peach: '#F7C5A0',
  mint: '#B8E8C8',
  cream: '#FDF6FA',
  cardBg: '#FFFFFF',
  onAccent: '#FFFFFF',
  text: '#4A3F4A',
  textLight: '#8A7A8A',
  textMuted: '#B8A8B8',
  babyBlue: '#B5D5F5',
  periwinkle: '#C4C0E8',
  butter: '#FAE5A0',
  coral: '#F5B8A8',
  sage: '#B0D4C0',
  lilac: '#E0C8F0',
  powderBlue: '#C0DCF0',
  blush: '#F8D0DC',
  budgetSafe: '#B8E8C8',
  budgetWarning: '#F7C5A0',
  budgetOver: '#F4A7C3',
  dangerDeep: '#E8678A',
  cardShadow: 'rgba(201, 184, 232, 0.25)',
  border: 'rgba(74, 63, 74, 0.08)',
};

// Sunset Peach — warm golden-hour palette (light).
const SUNSET_PEACH: ThemeColors = {
  ...POOKIE_PINK,
  cream: '#FFF6EF',
  text: '#5A4034',
  textLight: '#9C7E6E',
  textMuted: '#CBB0A0',
  rose: '#F2956F',
  lavender: '#F4B58A',
  skyBlue: '#F7CE9B',
  peach: '#F7C5A0',
  mint: '#EBC9A0',
  babyBlue: '#F6D5B0',
  periwinkle: '#EBC0A8',
  butter: '#FAE3A0',
  coral: '#F5A98C',
  sage: '#D9C29C',
  lilac: '#F2CDB6',
  powderBlue: '#FBD9BF',
  blush: '#F9D8C6',
  budgetWarning: '#F6C58A',
  budgetOver: '#F2956F',
  dangerDeep: '#D9663C',
  cardShadow: 'rgba(216, 150, 110, 0.22)',
  border: 'rgba(90, 64, 52, 0.08)',
};

// Minty Cool — fresh cool-toned green/blue palette (light).
const MINTY_COOL: ThemeColors = {
  ...POOKIE_PINK,
  cream: '#F0F8F4',
  text: '#36504A',
  textLight: '#7B968D',
  textMuted: '#A9C2B8',
  rose: '#5FBFA0',
  lavender: '#8FD0C0',
  skyBlue: '#A0D8E0',
  peach: '#BEE2C8',
  mint: '#B8E8C8',
  babyBlue: '#AED9E8',
  periwinkle: '#A8D4D0',
  butter: '#DCEFC0',
  coral: '#9FD8C0',
  sage: '#B0D4C0',
  lilac: '#BEE0DC',
  powderBlue: '#C0E4E8',
  blush: '#CDEBDD',
  budgetSafe: '#9FDDB8',
  budgetWarning: '#F2CE9A',
  budgetOver: '#EC8A8A',
  dangerDeep: '#2E8B72',
  cardShadow: 'rgba(95, 191, 160, 0.20)',
  border: 'rgba(54, 80, 74, 0.08)',
};

// Lavender Dream — dreamy purple palette (light).
const LAVENDER_DREAM: ThemeColors = {
  ...POOKIE_PINK,
  cream: '#F6F1FC',
  text: '#463A57',
  textLight: '#897AA0',
  textMuted: '#B7A8CC',
  rose: '#B79CE0',
  lavender: '#C9B8E8',
  skyBlue: '#BCC4F0',
  peach: '#D8C0EC',
  mint: '#C8E0D0',
  babyBlue: '#C4C8F2',
  periwinkle: '#C4C0E8',
  butter: '#ECE0A8',
  coral: '#D8A8E0',
  sage: '#BBD4CB',
  lilac: '#E0C8F0',
  powderBlue: '#CFD4F2',
  blush: '#ECD2F0',
  budgetOver: '#B79CE0',
  dangerDeep: '#8E5BC0',
  cardShadow: 'rgba(160, 140, 210, 0.22)',
  border: 'rgba(70, 58, 87, 0.08)',
};

// Cotton Candy — pink + blue pastel pop (light).
const COTTON_CANDY: ThemeColors = {
  ...POOKIE_PINK,
  cream: '#FFF0F6',
  text: '#4F3A4A',
  textLight: '#9A7E92',
  textMuted: '#C9AEC0',
  rose: '#F7A8C8',
  lavender: '#B9C8F2',
  skyBlue: '#A8D8EA',
  peach: '#FAC3D8',
  mint: '#B8E8D8',
  babyBlue: '#AEC8F5',
  periwinkle: '#C4C0E8',
  butter: '#FBE6B0',
  coral: '#F8B0C8',
  sage: '#B6E0CC',
  lilac: '#EAC8F0',
  powderBlue: '#BCD8F5',
  blush: '#FAD2E2',
  budgetOver: '#F7A8C8',
  dangerDeep: '#E85A9A',
  cardShadow: 'rgba(230, 160, 200, 0.22)',
  border: 'rgba(79, 58, 74, 0.08)',
};

// Mocha — warm coffee-neutral palette (light).
const MOCHA: ThemeColors = {
  ...POOKIE_PINK,
  cream: '#F6F0EA',
  cardBg: '#FFFDFB',
  text: '#4A3C32',
  textLight: '#8E7C6E',
  textMuted: '#BBA994',
  rose: '#C9A07A',
  lavender: '#C4B09A',
  skyBlue: '#B8C0B0',
  peach: '#D8B894',
  mint: '#BFD0B0',
  babyBlue: '#C0C8BC',
  periwinkle: '#C6B8A8',
  butter: '#E8D8A8',
  coral: '#D6A98C',
  sage: '#BCCBA8',
  lilac: '#D2C4B4',
  powderBlue: '#C8D0C4',
  blush: '#E6CDBC',
  budgetSafe: '#AECDA0',
  budgetWarning: '#E0BC8E',
  budgetOver: '#C97E5E',
  dangerDeep: '#A85A3A',
  cardShadow: 'rgba(150, 120, 90, 0.20)',
  border: 'rgba(74, 60, 50, 0.08)',
};

// Midnight — dark mode. Deep accents + light text so both button labels (onAccent)
// and tinted-card content (text) stay readable.
const MIDNIGHT: ThemeColors = {
  cream: '#16131C',
  cardBg: '#241F2E',
  onAccent: '#FBF6FF',
  text: '#F2EAF7',
  textLight: '#B6A8C6',
  textMuted: '#7E7194',
  rose: '#B5638A',
  lavender: '#7E6BA8',
  skyBlue: '#4F7A92',
  peach: '#B5825A',
  mint: '#5AA882',
  babyBlue: '#5A7BA8',
  periwinkle: '#5B5680',
  butter: '#8A7A3A',
  coral: '#B56A5A',
  sage: '#5E8C72',
  lilac: '#7A5E92',
  powderBlue: '#4E6E86',
  blush: '#7A4A5E',
  budgetSafe: '#5AA882',
  budgetWarning: '#C49A5A',
  budgetOver: '#C76A8E',
  dangerDeep: '#FF96B4',
  cardShadow: 'rgba(0, 0, 0, 0.45)',
  border: 'rgba(255, 255, 255, 0.10)',
};

// One entry per selectable theme. `emoji` shows in the picker; `dark` flips the status bar.
export interface Palette {
  id: string;
  name: string;
  emoji: string;
  dark: boolean;
  colors: ThemeColors;
}

export const PALETTES: Palette[] = [
  { id: 'pookie', name: 'Pookie Pink', emoji: '🌸', dark: false, colors: POOKIE_PINK },
  { id: 'dark', name: 'Dark Mode', emoji: '🌙', dark: true, colors: MIDNIGHT },
  { id: 'sunset', name: 'Sunset Peach', emoji: '🌅', dark: false, colors: SUNSET_PEACH },
  { id: 'minty', name: 'Minty Cool', emoji: '🌿', dark: false, colors: MINTY_COOL },
  { id: 'lavender', name: 'Lavender Dream', emoji: '💜', dark: false, colors: LAVENDER_DREAM },
  { id: 'candy', name: 'Cotton Candy', emoji: '🍬', dark: false, colors: COTTON_CANDY },
  { id: 'mocha', name: 'Mocha', emoji: '☕', dark: false, colors: MOCHA },
];

export const DEFAULT_THEME_ID = 'pookie';

// Look up a palette by id, falling back to the default.
export function getPalette(id: string): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}

// Default colours — used as the static fallback (e.g. pure utils that can't use the hook).
export const colors: ThemeColors = POOKIE_PINK;

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
  display: { fontSize: 44, fontWeight: '800' as const },
  heading: { fontSize: 28, fontWeight: '700' as const },
  title: { fontSize: 21, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  small: { fontSize: 13, fontWeight: '400' as const },
  tiny: { fontSize: 11, fontWeight: '400' as const },
} as const;
