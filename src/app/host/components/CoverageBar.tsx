'use client';

import React from 'react';

import {useT} from '../../../i18n';
import {REVEAL_FLOOR} from '../../../mock/room';
import {dosisFont, numFont} from './hostStyles';

type Props = {
  name: string;
  noteCount: number;
  maxCount: number;
};

export const CoverageBar: React.FC<Props> = ({name, noteCount, maxCount}) => {
  const t = useT();
  const under = noteCount < REVEAL_FLOOR;
  const scale = Math.max(maxCount, REVEAL_FLOOR + 1);
  const fillPct = Math.min(100, (noteCount / scale) * 100);
  const floorPct = (REVEAL_FLOOR / scale) * 100;

  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
      <span
        style={{
          width: 64,
          flexShrink: 0,
          fontSize: 14,
          fontWeight: 500,
          color: 'var(--main-color)',
          fontFamily: dosisFont,
        }}
      >
        {name}
      </span>

      <div
        style={{
          position: 'relative',
          flex: 1,
          height: 14,
          borderRadius: 'var(--radius-pill)',
          backgroundColor: 'var(--host-surface)',
        }}
      >
        <div
          style={{
            width: `${fillPct}%`,
            height: '100%',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: under
              ? 'var(--warn-color)'
              : 'var(--accent-color)',
          }}
        />
        <span
          aria-hidden='true'
          title={t('host.game.coverage.floor')}
          style={{
            position: 'absolute',
            top: -2,
            bottom: -2,
            left: `${floorPct}%`,
            width: 2,
            backgroundColor: 'var(--main-color)',
          }}
        />
      </div>

      <span
        style={{
          width: 28,
          textAlign: 'right',
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--main-color)',
          fontFamily: numFont,
        }}
      >
        {noteCount}
      </span>

      {under ? (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            width: 130,
            flexShrink: 0,
            color: 'var(--warn-color)',
          }}
        >
          <svg width='16' height='16' viewBox='0 0 24 24' fill='none' aria-hidden='true'>
            <circle cx='12' cy='12' r='9' stroke='var(--warn-color)' strokeWidth='2' />
            <path d='M12 7.5v5' stroke='var(--warn-color)' strokeWidth='2' strokeLinecap='round' />
            <circle cx='12' cy='16.5' r='1.1' fill='var(--warn-color)' />
          </svg>
          <span className='t12' style={{color: 'var(--warn-color)'}}>
            {t('host.game.coverage.under', {
              name,
              count: REVEAL_FLOOR - noteCount,
            })}
          </span>
        </span>
      ) : (
        <span style={{width: 130, flexShrink: 0}} />
      )}
    </div>
  );
};
