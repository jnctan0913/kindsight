'use client';

import React, {useState} from 'react';

import {useT} from '../../../i18n';
import type {StringKey} from '../../../i18n';
import {consoleCard, cardHeading, dosisFont} from './hostStyles';

const prompts: StringKey[] = ['host.prompt.1', 'host.prompt.2', 'host.prompt.3'];

export const PromptDeck: React.FC = () => {
  const t = useT();
  const [active, setActive] = useState<number | null>(null);

  return (
    <div style={consoleCard}>
      <span style={cardHeading}>{t('host.wrap.prompts.title')}</span>
      <ul style={{marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10}}>
        {prompts.map((key, i) => {
          const pushed = active === i;
          return (
            <li
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: 12,
                borderRadius: 'var(--radius-control)',
                backgroundColor: 'var(--host-surface)',
                border: pushed
                  ? '2px solid var(--accent-color)'
                  : '2px solid transparent',
              }}
            >
              <span className='t14' style={{color: 'var(--main-color)'}}>
                {t(key)}
              </span>
              <button
                className='clickable'
                onClick={() => setActive(i)}
                style={{
                  flexShrink: 0,
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'var(--white-color)',
                  boxShadow: 'var(--shadow-soft)',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--main-color)',
                  fontFamily: dosisFont,
                }}
              >
                {t('host.wrap.prompts.push')}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
