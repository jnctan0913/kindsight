'use client';

import React, {useEffect, useState} from 'react';

type Props = {
  children: React.ReactNode;
  containerStyle?: React.CSSProperties;
};

export const Screen: React.FC<Props> = ({children, containerStyle}) => {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOpacity(1);
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <div
      id='screen'
      style={{
        opacity: opacity,
        transition: 'opacity 0.5s ease-in-out',
        ...containerStyle,
      }}
    >
      {children}
    </div>
  );
};
