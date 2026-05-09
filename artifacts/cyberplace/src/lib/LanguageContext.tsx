import { createContext, useContext, useState, ReactNode } from "react";

export type Language = "en" | "uz" | "ru";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (en: string, uz?: string, ru?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem("cdctf_lang") as Language) || "en";
  });

  const changeLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("cdctf_lang", newLang);
  };

  const t = (en: string, uz?: string, ru?: string): string => {
    if (lang === "uz" && uz) return uz;
    if (lang === "ru" && ru) return ru;
    return en;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: changeLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLang must be used within LanguageProvider");
  return context;
}
