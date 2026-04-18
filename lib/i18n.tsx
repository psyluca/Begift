"use client";
import { createContext, useContext, useState, useEffect } from "react";
import it from "../messages/it.json";
import en from "../messages/en.json";
import ja from "../messages/ja.json";
import zh from "../messages/zh.json";

const messages: Record<string, any> = { it, en, ja, zh };

const I18nContext = createContext<{ locale: string; t: (key: string, params?: Record<string, string>) => string; setLocale: (l: string) => void }>({
  locale: "it", t: (k) => k, setLocale: () => {},
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("begift_locale") || "it";
    }
    return "it";
  });

  const setLocale = (l: string) => {
    localStorage.setItem("begift_locale", l);
    setLocaleState(l);
  };

  const t = (key: string, params?: Record<string, string>): string => {
    const parts = key.split(".");
    let val: any = messages[locale];
    for (const p of parts) { val = val?.[p]; }
    if (!val) {
      // Fallback to Italian
      val = messages["it"];
      for (const p of parts) { val = val?.[p]; }
    }
    let result = val ?? key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        result = result.replace(new RegExp(`\\{${k}\\}`, "g"), v);
      });
    }
    return result;
  };

  return <I18nContext.Provider value={{ locale, t, setLocale }}>{children}</I18nContext.Provider>;
}

export function useI18n() { return useContext(I18nContext); }
