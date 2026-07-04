import * as React from 'react';

export const IsOpenSvg: React.FC = () => {
  return (
    <div style={{width: 10, height: 6}}>
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width={10}
        height={6}
        fill='none'
      >
        <g>
          <path
            stroke='#FF8A71'
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={1.5}
            d='m.429 5.429 4.285-4.286L9 5.429'
          />
        </g>
        <defs>
          <clipPath id='a'>
            <path
              fill='#fff'
              d='M10 .143v5.714H0V.143z'
            />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
};
