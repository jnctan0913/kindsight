'use client';

import React from 'react';

import {avatarSrc} from '@/lib/avatar';

type Size = 'sm' | 'md' | 'lg';

const PX: Record<Size, number> = {sm: 28, md: 40, lg: 96};

type Props = {
  avatarId?: number | null;
  size?: Size;
  className?: string;
};

export const Avatar: React.FC<Props> = ({avatarId, size = 'md', className}) => {
  const px = PX[size];
  const base: React.CSSProperties = {
    width: px,
    height: px,
    borderRadius: '50%',
    flexShrink: 0,
    display: 'block',
  };

  // Unclaimed slot: neutral placeholder circle, no identity to show yet.
  if (!avatarId) {
    return (
      <span
        aria-hidden='true'
        className={className}
        style={{...base, background: 'rgba(30, 37, 56, 0.12)'}}
      />
    );
  }

  return (
    <img
      src={avatarSrc(avatarId)}
      alt=''
      aria-hidden='true'
      className={className}
      style={{...base, objectFit: 'cover'}}
    />
  );
};
