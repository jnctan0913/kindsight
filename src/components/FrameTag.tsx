import React from 'react';

type Props = {
  label: string;
  style?: React.CSSProperties;
};

export const FrameTag: React.FC<Props> = ({label, style}) => {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 14px',
        borderRadius: 'var(--radius-pill)',
        backgroundColor: 'var(--accent-color)',
        color: 'var(--main-color)',
        fontSize: 14,
        fontWeight: 600,
        fontFamily: 'var(--font-dosis), var(--font-noto-sc), sans-serif',
        ...style,
      }}
    >
      {label}
    </span>
  );
};
