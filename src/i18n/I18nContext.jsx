import { createContext, useContext, useState, useCallback } from "react";
import strings from "./strings.js";
import { LANGUAGES } from "./languages.js";

const I18nContext = createContext(null);

/**
 * Proxy-wrapped t() — throws in dev if a key is missing in the active language.
 * No silent English fallback — ever.
 */
function makeTranslator(lang) {
  return function t(key) {
    const entry = strings[key];
    if (!entry) {
      if (import.meta.env.DEV) throw new Error(`[i18n] Missing string key: "${key}"`);
      return key;
    }
    const value = entry[lang];
    if (value === undefined || value === null) {
      if (import.meta.env.DEV) throw new Error(`[i18n] Missing "${lang}" translation for key: "${key}"`);
      return entry.en ?? key;
    }
    return value;
  };
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem("rs_lang") || null;
  });

  const setLang = useCallback((code) => {
    localStorage.setItem("rs_lang", code);
    setLangState(code);
    // Apply correct font-family to :root
    const fontFamily = LANGUAGES[code]?.fontFamily;
    if (fontFamily) {
      document.documentElement.style.setProperty("--rs-font-body", fontFamily);
    }
    document.documentElement.setAttribute("lang", code);
    document.documentElement.setAttribute("dir", LANGUAGES[code]?.dir || "ltr");
  }, []);

  const t = lang ? makeTranslator(lang) : makeTranslator("en");

  return (
    <I18nContext.Provider value={{ lang, setLang, t, languages: LANGUAGES }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
