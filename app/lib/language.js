import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'tarapeza_lang';

export function getStoredLang(fallback = 'en') {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem(STORAGE_KEY) || fallback;
    } catch {}
  }
  return fallback;
}

export function setStoredLang(lang) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {}
  }
}

export function useLanguage(urlLang) {
  const [lang, setLang] = useState(() => urlLang || getStoredLang('en'));

  useEffect(() => {
    const stored = getStoredLang();
    if (stored !== lang) {
      setLang(stored);
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang(prev => {
      const next = prev === 'ar' ? 'en' : 'ar';
      setStoredLang(next);
      return next;
    });
  }, []);

  return { lang, setLang, toggleLang, isRtl: lang === 'ar' };
}
