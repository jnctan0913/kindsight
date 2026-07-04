'use client';

import React from 'react';

import {numFont, fieldLabel} from './hostStyles';

type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  helper?: string;
  suffix?: string;
};

const btnStyle: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 'var(--radius-control)',
  backgroundColor: 'var(--host-surface)',
  color: 'var(--main-color)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 22,
  fontFamily: numFont,
};

export const StepperInput: React.FC<Props> = ({
  label,
  value,
  min,
  max,
  onChange,
  helper,
  suffix,
}) => {
  const clamp = (next: number) => Math.min(max, Math.max(min, next));

  return (
    <div>
      <span style={fieldLabel}>{label}</span>
      <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
        <button
          type='button'
          aria-label={`${label} minus`}
          className='clickable'
          onClick={() => onChange(clamp(value - 1))}
          style={btnStyle}
        >
          -
        </button>
        <div
          aria-live='polite'
          style={{
            minWidth: 64,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            borderRadius: 'var(--radius-control)',
            backgroundColor: 'var(--white-color)',
            boxShadow: 'var(--shadow-soft)',
            fontSize: 20,
            fontWeight: 600,
            color: 'var(--main-color)',
            fontFamily: numFont,
          }}
        >
          <span>{value}</span>
          {suffix && (
            <span className='t12' style={{fontFamily: numFont}}>
              {suffix}
            </span>
          )}
        </div>
        <button
          type='button'
          aria-label={`${label} plus`}
          className='clickable'
          onClick={() => onChange(clamp(value + 1))}
          style={btnStyle}
        >
          +
        </button>
      </div>
      {helper && (
        <p className='t12' style={{marginTop: 8}}>
          {helper}
        </p>
      )}
    </div>
  );
};
