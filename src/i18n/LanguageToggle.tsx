'use client';

import React from 'react';

import {useLocale, useT} from './LocaleContext';
import type {Locale, StringKey} from './strings';

const segments: {locale: Locale; labelKey: StringKey}[] = [
  {locale: 'en', labelKey: 'chrome.lang.en'},
  {locale: 'zh', labelKey: 'chrome.lang.zh'},
];

export const LanguageToggle: React.FC = () => {
  const t = useT();
  const {locale, setLocale} = useLocale();

  return (
    <div
      role='group'
      aria-label='Language'
      style={{
        height: 44,
        padding: 3,
        display: 'flex',
        alignItems: 'center',
        borderRadius: 'var(--radius-pill)',
        backgroundColor: 'var(--white-color)',
        boxShadow: 'var(--shadow-soft)',
      }}
    >
      {segments.map((segment) => {
        const active = locale === segment.locale;
        return (
          <button
            key={segment.locale}
            onClick={() => setLocale(segment.locale)}
            aria-pressed={active}
            className='clickable'
            style={{
              flex: 1,
              minWidth: 44,
              height: 38,
              padding: '0 14px',
              borderRadius: 'var(--radius-pill)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              whiteSpace: 'nowrap',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'var(--font-dosis), var(--font-noto-sc), sans-serif',
              backgroundColor: active ? 'var(--main-color)' : 'transparent',
              color: active ? 'var(--neon-white)' : 'var(--text-color)',
              transition: 'background-color 150ms ease-in-out',
            }}
          >
            {t(segment.labelKey)}
          </button>
        );
      })}
    </div>
  );
};
