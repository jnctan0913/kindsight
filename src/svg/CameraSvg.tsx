import React from 'react';

type Props = {
  style?: React.CSSProperties;
};

export const CameraSvg: React.FC<Props> = ({style}) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={24}
      height={20}
      fill='none'
      style={{...style}}
    >
      <path
        fill='#fff'
        fillRule='evenodd'
        d='M8.168.445A1 1 0 0 1 9 0h6a1 1 0 0 1 .832.445L17.535 3H21a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h3.465L8.168.445ZM9.535 2 7.832 4.555A1 1 0 0 1 7 5H3a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-4a1 1 0 0 1-.832-.445L14.465 2h-4.93Z'
        clipRule='evenodd'
      />
      <path
        fill='#fff'
        fillRule='evenodd'
        d='M12 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm-5 3a5 5 0 1 1 10 0 5 5 0 0 1-10 0Z'
        clipRule='evenodd'
      />
    </svg>
  );
};
