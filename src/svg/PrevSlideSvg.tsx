import * as React from 'react';

type Props = {
  color?: string;
};

export const PrevSlideSvg: React.FC<Props> = ({color = '#1E2538'}) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={11}
      height={22}
      fill='none'
    >
      <g>
        <path
          stroke={color}
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={1.5}
          d='M9.934 21 1 11 9.934 1'
        />
      </g>
      <defs>
        <clipPath id='a'>
          <path
            fill='#fff'
            d='M0 0h11v22H0z'
          />
        </clipPath>
      </defs>
    </svg>
  );
};
