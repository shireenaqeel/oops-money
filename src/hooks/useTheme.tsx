// useTheme.tsx — runtime colour theming (V2). Holds the selected palette id, persists it,
// and exposes the active colours to every component. Wrap the app in <ThemeProvider>.
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { ThemeColors, Palette, PALETTES, DEFAULT_THEME_ID, getPalette } from '../constants/theme';
import { KEYS, loadString, saveString } from '../storage';

interface ThemeState {
  colors: ThemeColors;
  palette: Palette;
  themeId: string;
  setTheme: (id: string) => void;
  palettes: Palette[];
}

const ThemeContext = createContext<ThemeState | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);

  // Load the saved theme on first mount.
  useEffect(() => {
    (async () => {
      const saved = await loadString(KEYS.theme);
      if (saved) setThemeId(saved);
    })();
  }, []);

  // Switch theme and remember it.
  const setTheme = useCallback((id: string) => {
    setThemeId(id);
    saveString(KEYS.theme, id);
  }, []);

  const palette = getPalette(themeId);
  const value: ThemeState = { colors: palette.colors, palette, themeId, setTheme, palettes: PALETTES };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// Read the active palette's colours (most components only need this).
export function useTheme(): ThemeColors {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx.colors;
}

// Theme metadata + switcher (used by the Settings picker and the status bar).
export function useThemeMeta(): { themeId: string; setTheme: (id: string) => void; palettes: Palette[]; isDark: boolean } {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeMeta must be used inside <ThemeProvider>');
  return { themeId: ctx.themeId, setTheme: ctx.setTheme, palettes: ctx.palettes, isDark: ctx.palette.dark };
}
