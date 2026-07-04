import React from 'react';

import Image from 'next/image';

export const Background: React.FC = () => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: -1,
        width: '100%',
        height: '100%',
      }}
    >
      <Image
        src='/assets/bg/02.png'
        alt='Background'
        priority={true}
        sizes='100vw'
        width={0}
        height={0}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
        }}
      />
    </div>
  );
};
