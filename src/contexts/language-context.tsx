
'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import id from '@/locales/id.json';
import en from '@/locales/en.json';

type Locale = 'id' | 'en';

type LanguageContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const translations = { id, en };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('id');

  useEffect(() => {
    const storedLocale = localStorage.getItem('moodlink-locale') as Locale | null;
    if (storedLocale && ['id', 'en'].includes(storedLocale)) {
      setLocaleState(storedLocale);
    } else {
        // Set default based on browser language if available
        const browserLang = navigator.language.split('-')[0];
        if (browserLang === 'en') {
            setLocaleState('en');
        }
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    localStorage.setItem('moodlink-locale', newLocale);
    setLocaleState(newLocale);
    document.documentElement.lang = newLocale;
  };

  const t = useCallback((key: string): string => {
    const keys = key.split('.');
    let result: any = translations[locale];
    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) {
        // Fallback to English if translation is missing
        let fallbackResult: any = translations['en'];
        for (const fk of keys) {
            fallbackResult = fallbackResult?.[fk];
            if (fallbackResult === undefined) return key;
        }
        return fallbackResult || key;
      }
    }
    return result || key;
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
