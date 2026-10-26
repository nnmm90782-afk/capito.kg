"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Lang = "ru" | "en" | "kg";

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LangContext = createContext<LangContextValue>({
  lang: "ru",
  setLang: () => {},
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ru");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("capito-lang") as Lang | null;
    if (saved && ["ru", "en", "kg"].includes(saved)) {
      setLangState(saved);
      document.documentElement.setAttribute("lang", saved);
    }
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("capito-lang", l);
    document.documentElement.setAttribute("lang", l);
  }

  if (!mounted) {
    return (
      <LangContext.Provider value={{ lang: "ru", setLang: () => {} }}>
        {children}
      </LangContext.Provider>
    );
  }

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
