'use client';

import React from 'react';

import {Avatar} from './Avatar';

type Props = {
  name: string;
  avatarId?: number | null;
  taken?: boolean;
  takenLabel?: string;
  selected?: boolean;
  onClick?: () => void;
};

export const RosterChip: React.FC<Props> = ({
  name,
  avatarId,
  taken,
  takenLabel,
  selected,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={taken}
      aria-pressed={selected}
      className={taken ? undefined : 'clickable pressable'}
      style={{
        minHeight: 48,
        padding: avatarId ? '0 18px 0 8px' : '0 18px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        borderRadius: 'var(--radius-pill)',
        backgroundColor: taken ? '#E6EAF1' : 'var(--white-color)',
        boxShadow: taken
          ? 'none'
          : selected
            ? 'var(--shadow-soft), var(--glow-teal)'
            : 'var(--shadow-soft)',
        border: selected
          ? '2px solid var(--accent-color)'
          : '2px solid transparent',
        fontSize: 16,
        fontWeight: 500,
        fontFamily: 'var(--font-dosis), var(--font-noto-sc), sans-serif',
        color: taken ? 'var(--text-color)' : 'var(--main-color)',
      }}
    >
      {avatarId ? <Avatar avatarId={avatarId} size='sm' /> : null}
      <span>{name}</span>
      {taken && takenLabel && (
        <span
          className='t12'
          style={{color: 'var(--text-color)'}}
        >
          {takenLabel}
        </span>
      )}
      {selected && !taken && (
        <svg
          width='16'
          height='16'
          viewBox='0 0 24 24'
          fill='none'
          aria-hidden='true'
        >
          <path
            d='M5 13l4 4L19 7'
            stroke='var(--accent-deep)'
            strokeWidth='2.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      )}
    </button>
  );
};
