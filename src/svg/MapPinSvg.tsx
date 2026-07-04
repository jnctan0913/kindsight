import React from 'react';

export const MapPinSvg: React.FC = () => {
  return (
    <div>
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width={30}
        height={30}
        fill='none'
      >
        <rect
          width={29}
          height={29}
          x={0.5}
          y={0.5}
          stroke='#C8CDD9'
          rx={14.5}
        />
        <g
          stroke='#1E2538'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={1.2}
        >
          <path d='M20.25 13.833c0 4.084-5.25 7.584-5.25 7.584s-5.25-3.5-5.25-7.584a5.25 5.25 0 1 1 10.5 0Z' />
          <path d='M15 15.583a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5Z' />
        </g>
        <defs>
          <clipPath id='a'>
            <path
              fill='#fff'
              d='M8 8h14v14H8z'
            />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
};
