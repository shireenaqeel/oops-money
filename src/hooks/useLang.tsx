// useLang.tsx — holds the active language (persisted) and re-renders subscribers on change.
// Components that show translated text should call useLang() once so they re-render when the
// language toggles (the actual strings come from L() in ../i18n).
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { KEYS, loadString, saveString } from '../storage';
import { Lang, setLangValue } from '../i18n';

interface LangState {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LangContext = createContext<LangState | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('hinglish');

  // Load the saved language on launch.
  useEffect(() => {
    (async () => {
      const saved = await loadString(KEYS.lang);
      if (saved === 'english' || saved === 'hinglish') {
        setLangValue(saved);
        setLangState(saved);
      }
    })();
  }, []);

  // Switch language: update the module-level value (for utils), the state (to re-render), and persist.
  const setLang = useCallback((l: Lang) => {
    setLangValue(l);
    setLangState(l);
    saveString(KEYS.lang, l).catch(() => {});
  }, []);

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

// Subscribe to the active language. Throws if used outside <LangProvider>.
export function useLang(): LangState {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>');
  return ctx;
}
