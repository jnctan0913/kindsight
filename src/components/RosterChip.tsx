'use client';

import React from 'react';

type Props = {
  name: string;
  taken?: boolean;
  takenLabel?: string;
  selected?: boolean;
  onClick?: () => void;
};

export const RosterChip: React.FC<Props> = ({
  name,
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
      className={taken ? undefined : 'clickable'}
      style={{
        minHeight: 48,
        padding: '0 18px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        borderRadius: 'var(--radius-pill)',
        backgroundColor: taken ? '#E6EAF1' : 'var(--white-color)',
        boxShadow: taken ? 'none' : 'var(--shadow-soft)',
        border: selected
          ? '2px solid var(--accent-color)'
          : '2px solid transparent',
        fontSize: 16,
        fontWeight: 500,
        fontFamily: 'var(--font-dosis), var(--font-noto-sc), sans-serif',
        color: taken ? 'var(--text-color)' : 'var(--main-color)',
        transition: 'border-color 150ms ease-in-out',
      }}
    >
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
