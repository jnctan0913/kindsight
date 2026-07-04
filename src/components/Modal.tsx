'use client';

import React from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  labelledBy?: string;
  children: React.ReactNode;
  containerStyle?: React.CSSProperties;
};

export const Modal: React.FC<Props> = ({
  open,
  onClose,
  labelledBy,
  children,
  containerStyle,
}) => {
  if (!open) return null;

  return (
    <div
      role='presentation'
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: 'rgba(30, 37, 56, 0.45)',
      }}
    >
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 440,
          backgroundColor: 'var(--white-color)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-soft)',
          padding: 24,
          ...containerStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
};
