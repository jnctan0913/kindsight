import * as React from 'react';

export const ModalMailSvg: React.FC = () => {
  return (
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
        <path d='M10.583 10.083h9.334a1.17 1.17 0 0 1 1.166 1.167v7a1.17 1.17 0 0 1-1.166 1.167h-9.334a1.17 1.17 0 0 1-1.166-1.167v-7a1.17 1.17 0 0 1 1.166-1.167Z' />
        <path d='m21.083 11.25-5.833 4.083-5.833-4.083' />
      </g>
      <defs>
        <clipPath id='a'>
          <path
            fill='#fff'
            d='M8.25 7.75h14v14h-14z'
          />
        </clipPath>
      </defs>
    </svg>
  );
};
