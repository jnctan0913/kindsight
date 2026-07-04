'use client';

import React from 'react';
import Link from 'next/link';
import {UrlObject} from 'url';

type Props = {
  href?: string | UrlObject;
  label: string;
  onClick?: () => void;
  style?: React.CSSProperties;
  colorScheme?: 'primary' | 'secondary';
  containerStyle?: React.CSSProperties;
};

export const Button: React.FC<Props> = ({
  label,
  style,
  onClick,
  href = '#',
  containerStyle,
  colorScheme = 'primary',
}) => {
  const btnStyle: React.CSSProperties = {
    height: 50,
    width: '100%',
    borderRadius: 50,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 18,
    textTransform: 'capitalize',
    fontFamily: 'var(--font-league-spartan)',
    fontWeight: 400,
    background:
      colorScheme === 'primary' ? 'var(--accent-color)' : 'var(--main-color)',
    color:
      colorScheme === 'primary' ? 'var(--main-color)' : 'var(--white-color)',
    ...style,
  };

  if (href && !onClick) {
    return (
      <div style={{...containerStyle}}>
        <Link
          href={href ?? '#'}
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
        onClick={onClick}
        style={{...btnStyle}}
      >
        {label}
      </button>
    </div>
  );
};
