'use client';

import React from 'react';

import {useT} from '../../../i18n';
import type {WritingMode} from '../../../mock/room';
import {dosisFont} from './hostStyles';

type Props = {
  value: WritingMode;
  onChange: (mode: WritingMode) => void;
};

const cards: {mode: WritingMode; title: any; desc: any}[] = [
  {
    mode: 'roundRobin',
    title: 'host.create.mode.rr',
    desc: 'host.create.mode.rr.desc',
  },
  {
    mode: 'freeSelect',
    title: 'host.create.mode.fs',
    desc: 'host.create.mode.fs.desc',
  },
];

export const ModeCardPicker: React.FC<Props> = ({value, onChange}) => {
  const t = useT();

  return (
    <div
      role='radiogroup'
      aria-label={t('host.create.mode.label')}
      style={{display: 'flex', gap: 14, flexWrap: 'wrap'}}
    >
      {cards.map((card) => {
        const selected = value === card.mode;
        return (
          <button
            key={card.mode}
            type='button'
            role='radio'
            aria-checked={selected}
            className='clickable'
            onClick={() => onChange(card.mode)}
            style={{
              flex: '1 1 220px',
              minWidth: 200,
              textAlign: 'left',
              padding: 18,
              borderRadius: 'var(--radius-card)',
              backgroundColor: 'var(--white-color)',
              boxShadow: 'var(--shadow-soft)',
              border: selected
                ? '2px solid var(--accent-color)'
                : '2px solid transparent',
              transition: 'border-color 150ms ease-in-out',
              display: 'block',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--main-color)',
                  fontFamily: dosisFont,
                }}
              >
                {t(card.title)}
              </span>
              {selected && (
                <svg width='20' height='20' viewBox='0 0 24 24' fill='none' aria-hidden='true'>
                  <path
                    d='M5 13l4 4L19 7'
                    stroke='var(--accent-deep)'
                    strokeWidth='2.5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
              )}
            </div>
            <p className='t14' style={{marginTop: 8, lineHeight: 1.5}}>
              {t(card.desc)}
            </p>
          </button>
        );
      })}
    </div>
  );
};
