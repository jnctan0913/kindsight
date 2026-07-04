'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import {dictionaries, format, type Locale, type StringKey} from './strings';

const STORAGE_KEY = 'kindsight.locale';

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  setLocale: () => {},
});

export const LocaleProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'zh') {
      setLocaleState(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  return (
    <LocaleContext.Provider value={{locale, setLocale}}>
      {children}
    </LocaleContext.Provider>
  );
};

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}

export function useT() {
  const {locale} = useLocale();
  return useCallback(
    (key: StringKey, vars?: Record<string, string | number>): string =>
      format(dictionaries[locale][key], vars),
    [locale],
  );
}
