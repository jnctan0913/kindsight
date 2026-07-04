import React from 'react';

export default function ScreenLayout({children}: {children: React.ReactNode}) {
  return <div data-surface='screen'>{children}</div>;
}
