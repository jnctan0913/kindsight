'use client';

import React from 'react';

import {useT} from '../../../i18n';
import {consoleCard, dosisFont} from './hostStyles';

type Props = {
  on: boolean;
  optedInCount: number;
  onToggle: () => void;
};

export const HighlightToggle: React.FC<Props> = ({
  on,
  optedInCount,
  onToggle,
}) => {
  const t = useT();
  const disabled = optedInCount === 0;

  return (
    <div style={consoleCard}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--main-color)',
              fontFamily: dosisFont,
            }}
          >
            {t('host.wrap.highlight.label')}
          </p>
          <p className='t12' style={{marginTop: 4}}>
            {disabled
              ? t('host.wrap.highlight.disabled')
              : t('host.wrap.highlight.count', {count: optedInCount})}
          </p>
        </div>

        <button
          type='button'
          role='switch'
          aria-checked={on && !disabled}
          aria-label={t('host.wrap.highlight.label')}
          disabled={disabled}
          className={disabled ? undefined : 'clickable'}
          onClick={disabled ? undefined : onToggle}
          style={{
            flexShrink: 0,
            width: 52,
            height: 30,
            borderRadius: 'var(--radius-pill)',
            padding: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: on && !disabled ? 'flex-end' : 'flex-start',
            backgroundColor:
              on && !disabled ? 'var(--accent-color)' : 'var(--border-color)',
            opacity: disabled ? 0.5 : 1,
            transition: 'background-color 150ms ease-in-out',
          }}
        >
          <span
            aria-hidden='true'
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              backgroundColor: 'var(--white-color)',
              boxShadow: 'var(--shadow-soft)',
            }}
          />
        </button>
      </div>
    </div>
  );
};
