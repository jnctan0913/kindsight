import React from 'react';

export const NotificationCheckSvg: React.FC = () => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={18}
      height={18}
      fill='none'
    >
      <rect
        width={18}
        height={18}
        fill='#55ACEE'
        rx={9}
      />
      <g>
        <path
          stroke='#fff'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={1.5}
          d='M12.2 6.6 7.8 11l-2-2'
        />
      </g>
      <defs>
        <clipPath id='a'>
          <path
            fill='#fff'
            d='M4.8 6h8.4v6H4.8z'
          />
        </clipPath>
      </defs>
    </svg>
  );
};
