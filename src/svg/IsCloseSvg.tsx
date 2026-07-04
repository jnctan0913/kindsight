import * as React from 'react';

export const IsCloseSvg: React.FC = () => {
  return (
    <div style={{width: 10, height: 6}}>
      <svg
        width='10'
        height='6'
        viewBox='0 0 10 6'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
      >
        <g clipPath='url(#clip0_3657_2453)'>
          <path
            d='M0.428572 0.571464L4.71429 4.85718L9 0.571464'
            stroke='#6C6D84'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </g>
        <defs>
          <clipPath id='clip0_3657_2453'>
            <rect
              width='5.71429'
              height='10'
              fill='white'
              transform='matrix(-4.37114e-08 -1 -1 4.37114e-08 10 5.85718)'
            />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
};
