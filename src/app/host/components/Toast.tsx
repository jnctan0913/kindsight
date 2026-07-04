'use client';

import React from 'react';

import {dosisFont} from './hostStyles';

type Props = {
  message: string;
  visible: boolean;
};

export const Toast: React.FC<Props> = ({message, visible}) => (
  <div
    role='status'
    aria-live='polite'
    style={{
      position: 'fixed',
      left: '50%',
      bottom: 28,
      transform: `translateX(-50%) translateY(${visible ? 0 : 12}px)`,
      opacity: visible ? 1 : 0,
      pointerEvents: 'none',
      zIndex: 200,
      padding: '12px 20px',
      borderRadius: 'var(--radius-pill)',
      backgroundColor: 'var(--main-color)',
      color: 'var(--neon-white)',
      fontSize: 15,
      fontWeight: 600,
      fontFamily: dosisFont,
      boxShadow: 'var(--shadow-soft)',
      transition: 'opacity 200ms ease-in-out, transform 200ms ease-in-out',
    }}
  >
    {message}
  </div>
);
