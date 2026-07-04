import * as React from 'react';

export const CrossSvg: React.FC = () => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={40}
      height={40}
      fill='none'
    >
      <rect
        width={40}
        height={40}
        fill='#FFF2F5'
        rx={20}
      />
      <path
        stroke='#FF4768'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.5}
        d='M25 15 15 25M15 15l10 10'
      />
    </svg>
  );
};
