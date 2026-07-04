import React from 'react';

export const UserSvg: React.FC = () => {
  return (
    <div>
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
          d='M26.667 27.5v-1.667a3.333 3.333 0 0 0-3.334-3.333h-6.666a3.333 3.333 0 0 0-3.334 3.333V27.5M20 19.167a3.333 3.333 0 1 0 0-6.667 3.333 3.333 0 0 0 0 6.667Z'
        />
      </svg>
    </div>
  );
};
