import React from 'react';

export const OpenSvg: React.FC = () => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={11}
      height={7}
      fill='none'
    >
      <g>
        <path
          stroke='#FF8A71'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={1.5}
          d='M1.214 5.643 5.5 1.357l4.286 4.286'
        />
      </g>
      <defs>
        <clipPath id='a'>
          <path
            fill='#fff'
            d='M11 7V0H0v7z'
          />
        </clipPath>
      </defs>
    </svg>
  );
};
