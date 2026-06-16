// i18n — tiny two-language helper (Hinglish default + English). V3.
// Usage: L('logged babe 🌸', 'logged babe 🌸') → returns the right one for the active language.
// A MODULE-LEVEL current language lets pure util functions translate too (calculations,
// personality, etc.) — not just React components. The <LangProvider> keeps this in sync and
// re-renders subscribed components (those that call useLang) whenever the language flips.

export type Lang = 'hinglish' | 'english';

let _lang: Lang = 'hinglish';

// Read the active language (used by pure utils).
export function getLang(): Lang {
  return _lang;
}

// Set the active language at the module level (called by the provider).
export function setLangValue(l: Lang) {
  _lang = l;
}

// Pick the string for the active language. Hinglish is the default/fallback.
export function L(hinglish: string, english: string): string {
  return _lang === 'english' ? english : hinglish;
}
