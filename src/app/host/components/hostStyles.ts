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
  fontSize: 18,
  fontWeight: 600,
  lineHeight: 1.2,
  letterSpacing: 0,
  color: 'var(--main-color)',
  fontFamily: dosisFont,
};

export const pageTitle: React.CSSProperties = {
  fontSize: 34,
  fontWeight: 700,
  lineHeight: 1.1,
  letterSpacing: '-0.01em',
  color: 'var(--main-color)',
  fontFamily: dosisFont,
};

// Use at most once per screen. Small teal eyebrow above a heading.
export const cardEyebrow: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--accent-deep)',
  fontFamily: dosisFont,
};

export const codeText: React.CSSProperties = {
  fontFamily: numFont,
  fontWeight: 700,
  letterSpacing: '0.12em',
  fontVariantNumeric: 'tabular-nums',
  color: 'var(--main-color)',
};

// Flatter base for secondary tiles: hairline + close shadow.
export const surfaceCard: React.CSSProperties = {
  backgroundColor: 'var(--white-color)',
  borderRadius: 'var(--radius-card)',
  border: '1px solid rgba(30, 37, 56, 0.06)',
  boxShadow: '0 1px 2px rgba(30, 37, 56, 0.04), 0 10px 26px -14px rgba(30, 37, 56, 0.16)',
  padding: 24,
};

// The primary card. Warm light gradient so the navy mascot reads, teal hairline,
// deeper teal-tinted lift. Never navy-filled (the mascot would disappear).
export const heroCard: React.CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  borderRadius: 'var(--radius-card)',
  padding: 32,
  background: 'linear-gradient(140deg, #FFFFFF 0%, #EEF8FF 52%, #FFF6E4 100%)',
  border: '1px solid rgba(0, 199, 159, 0.22)',
  boxShadow: '0 1px 2px rgba(30, 37, 56, 0.04), 0 18px 44px -20px rgba(0, 121, 95, 0.30)',
};

// One at-a-glance stat tile.
export const statTile: React.CSSProperties = {
  ...surfaceCard,
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontVariantNumeric: 'tabular-nums',
};

export const statValue: React.CSSProperties = {
  fontSize: 34,
  fontWeight: 700,
  lineHeight: 1,
  color: 'var(--main-color)',
  fontFamily: numFont,
  fontVariantNumeric: 'tabular-nums',
};

export const statLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--text-color)',
  fontFamily: dosisFont,
};

// One session row in the per-session list.
export const sessionRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '12px 14px',
  borderRadius: 'var(--radius-control)',
  backgroundColor: 'var(--host-surface)',
  border: '1px solid rgba(30, 37, 56, 0.05)',
};

// Row action buttons: one shape family (control radius, not pill), icon + label.
export const rowActionPrimary: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 14px',
  borderRadius: 'var(--radius-control)',
  border: 'none',
  backgroundColor: 'var(--main-color)',
  color: 'var(--neon-white)',
  fontWeight: 600,
  fontFamily: dosisFont,
};

export const rowActionSecondary: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 14px',
  borderRadius: 'var(--radius-control)',
  border: '1px solid rgba(30, 37, 56, 0.12)',
  backgroundColor: 'var(--white-color)',
  color: 'var(--main-color)',
  fontWeight: 600,
  fontFamily: dosisFont,
};

export const fieldLabel: React.CSSProperties = {
  display: 'block',
  marginBottom: 8,
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--main-color)',
  fontFamily: dosisFont,
};
