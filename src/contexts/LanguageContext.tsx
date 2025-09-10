import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'am';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('preferred-language');
    return (saved as Language) || 'en';
  });

  const [translations, setTranslations] = useState<Record<string, any>>({});

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const module = await import(`../translations/${language}.json`);
        setTranslations(module.default);
      } catch (error) {
        console.error('Failed to load translations:', error);
        // Fallback to English if translation loading fails
        if (language !== 'en') {
          const fallback = await import('../translations/en.json');
          setTranslations(fallback.default);
        }
      }
    };

    loadTranslations();
  }, [language]);

  useEffect(() => {
    localStorage.setItem('preferred-language', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};