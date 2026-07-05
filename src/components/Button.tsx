'use client';

import React from 'react';
import Link from 'next/link';
import {UrlObject} from 'url';

type Props = {
  href?: string | UrlObject;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
  colorScheme?: 'primary' | 'secondary';
  containerStyle?: React.CSSProperties;
  className?: string;
};

export const Button: React.FC<Props> = ({
  label,
  style,
  onClick,
  disabled = false,
  href = '#',
  containerStyle,
  colorScheme = 'primary',
  className,
}) => {
  const btnStyle: React.CSSProperties = {
    height: 50,
    width: '100%',
    borderRadius: 50,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxSizing: 'border-box',
    padding: '0 16px',
    fontSize: 18,
    lineHeight: 1,
    textAlign: 'center',
    textTransform: 'capitalize',
    fontFamily: 'var(--font-league-spartan)',
    fontWeight: 400,
    background:
      colorScheme === 'primary' ? 'var(--accent-color)' : 'var(--main-color)',
    color:
      colorScheme === 'primary' ? 'var(--main-color)' : 'var(--white-color)',
    cursor: disabled ? 'not-allowed' : undefined,
    ...style,
  };

  if (href && !onClick && !disabled) {
    return (
      <div style={{...containerStyle}}>
        <Link
          href={href ?? '#'}
          className={className}
          style={{...btnStyle}}
        >
          {label}
        </Link>
      </div>
    );
  }

  return (
    <div style={{...containerStyle}}>
      <button
        type='button'
        onClick={onClick}
        disabled={disabled}
        className={className}
        style={{...btnStyle}}
      >
        {label}
      </button>
    </div>
  );
};
