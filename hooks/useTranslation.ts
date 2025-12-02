'use client';

import { useState, useEffect } from 'react';
import { Locale, defaultLocale } from '@/i18n';
import { loadMessages, t as translate, getCurrentLocale, setCurrentLocale } from '@/lib/i18n';

export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Cargar idioma guardado
    const savedLocale = (localStorage.getItem('locale') as Locale) || defaultLocale;
    changeLocale(savedLocale);
  }, []);

  const changeLocale = async (newLocale: Locale) => {
    setIsLoading(true);
    try {
      await loadMessages(newLocale);
      setCurrentLocale(newLocale);
      setLocaleState(newLocale);
      localStorage.setItem('locale', newLocale);
      // Actualizar lang del HTML
      if (typeof document !== 'undefined') {
        document.documentElement.lang = newLocale;
      }
    } catch (error) {
      console.error('Error changing locale:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    return translate(key, params);
  };

  return {
    t,
    locale,
    changeLocale,
    isLoading,
  };
}







