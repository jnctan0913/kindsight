import * as React from 'react';

export const GiftSvg: React.FC = () => {
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
      <g
        stroke='#1E2538'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.5}
      >
        <path d='M26.667 20v8.333H13.333V20M28.333 15.833H11.667V20h16.666v-4.167ZM20 28.333v-12.5M20 15.833h-3.75a2.083 2.083 0 1 1 0-4.166c2.917 0 3.75 4.166 3.75 4.166ZM20 15.833h3.75a2.083 2.083 0 0 0 0-4.166c-2.917 0-3.75 4.166-3.75 4.166Z' />
      </g>
      <defs>
        <clipPath id='a'>
          <path
            fill='#fff'
            d='M10 10h20v20H10z'
          />
        </clipPath>
      </defs>
    </svg>
  );
};
