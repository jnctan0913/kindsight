import * as React from 'react';

export const LogOutSvg: React.FC = () => {
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
        fill='#F5FAFB'
        rx={20}
      />
      <path
        stroke='#1E2538'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.5}
        d='M17.5 27.5h-3.333a1.666 1.666 0 0 1-1.667-1.667V14.167a1.666 1.666 0 0 1 1.667-1.667H17.5M23.333 24.167 27.5 20l-4.167-4.167M27.5 20h-10'
      />
    </svg>
  );
};
