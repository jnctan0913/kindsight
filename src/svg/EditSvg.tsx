import React from 'react';

export const EditSvg: React.FC = () => {
  return (
    <div style={{width: 34, height: 34}}>
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width={34}
        height={34}
        fill='none'
      >
        <rect
          width={34}
          height={34}
          fill='#FFD9C3'
          rx={6}
        />
        <g>
          <path
            stroke='#FF8A71'
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={1.5}
            d='M20.333 11a1.884 1.884 0 0 1 3.22 1.333A1.885 1.885 0 0 1 23 13.667l-9 9-3.667 1 1-3.667 9-9Z'
          />
        </g>
        <defs>
          <clipPath id='a'>
            <path
              fill='#fff'
              d='M9 9h16v16H9z'
            />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
};
