import React from 'react';

export const CalendarSvg: React.FC = () => {
  return (
    <div>
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
        <path
          stroke='#1E2538'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={1.5}
          d='M25.833 13.333H14.167c-.92 0-1.667.746-1.667 1.667v11.667c0 .92.746 1.666 1.667 1.666h11.666c.92 0 1.667-.746 1.667-1.666V15c0-.92-.746-1.667-1.667-1.667ZM23.333 11.667V15M16.667 11.667V15M12.5 18.333h15'
        />
      </svg>
    </div>
  );
};
