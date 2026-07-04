'use client';

import React from 'react';

import {dosisFont} from './hostStyles';

type Props = {
  tone?: 'warning' | 'info';
  children: React.ReactNode;
};

export const Callout: React.FC<Props> = ({tone = 'warning', children}) => {
  const warning = tone === 'warning';
  return (
    <div
      role={warning ? 'alert' : undefined}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '12px 14px',
        borderRadius: 'var(--radius-control)',
        backgroundColor: warning ? 'var(--warn-surface)' : 'var(--host-surface)',
      }}
    >
      <svg
        width='20'
        height='20'
        viewBox='0 0 24 24'
        fill='none'
        aria-hidden='true'
        style={{flexShrink: 0, marginTop: 1}}
      >
        <path
          d='M12 3l9 16H3L12 3z'
          stroke={warning ? 'var(--warn-color)' : 'var(--accent-deep)'}
          strokeWidth='2'
          strokeLinejoin='round'
        />
        <path
          d='M12 10v4'
          stroke={warning ? 'var(--warn-color)' : 'var(--accent-deep)'}
          strokeWidth='2'
          strokeLinecap='round'
        />
        <circle
          cx='12'
          cy='16.5'
          r='1.1'
          fill={warning ? 'var(--warn-color)' : 'var(--accent-deep)'}
        />
      </svg>
      <span
        style={{
          fontSize: 14,
          lineHeight: 1.5,
          color: warning ? 'var(--warn-color)' : 'var(--main-color)',
          fontFamily: dosisFont,
        }}
      >
        {children}
      </span>
    </div>
  );
};
