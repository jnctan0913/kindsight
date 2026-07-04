import React from 'react';

export const dosisFont = 'var(--font-dosis), var(--font-noto-sc), sans-serif';

export const numFont =
  'var(--font-league-spartan), var(--font-noto-sc), sans-serif';

export const consoleCard: React.CSSProperties = {
  backgroundColor: 'var(--white-color)',
  borderRadius: 'var(--radius-card)',
  boxShadow: 'var(--shadow-soft)',
  padding: 20,
};

// Shared 12-column grid so cards align phase-to-phase and fill the column at
// equal height. Use gridColumn: 'span N' on children (see span()).
export const consoleGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
  gap: 20,
  alignItems: 'stretch',
};

export const span = (n: number): React.CSSProperties => ({gridColumn: `span ${n}`});

export const cardFill: React.CSSProperties = {height: '100%'};

export const cardHeading: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: 'var(--main-color)',
  fontFamily: dosisFont,
  letterSpacing: '0.02em',
  textTransform: 'uppercase',
};

export const fieldLabel: React.CSSProperties = {
  display: 'block',
  marginBottom: 8,
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--main-color)',
  fontFamily: dosisFont,
};
