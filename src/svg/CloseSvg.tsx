import React from 'react';

export const CloseSvg: React.FC = () => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={11}
      height={7}
      fill='none'
    >
      <g>
        <path
          stroke='#6C6D84'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={1.5}
          d='M1.214 1.357 5.5 5.643l4.286-4.286'
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
