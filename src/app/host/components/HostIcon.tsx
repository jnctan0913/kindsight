import React from 'react';

export type IconName =
  | 'manage'
  | 'share'
  | 'screen'
  | 'rehearse'
  | 'delete'
  | 'plus'
  | 'home'
  | 'signout';

// Line icons. `color` sets the stroke explicitly (default currentColor). Pass an
// explicit color for icons on dark backgrounds: the svg does not reliably inherit
// the button's text color, so currentColor can resolve to the root navy and go
// invisible on a navy button.
export const HostIcon: React.FC<{name: IconName; size?: number; color?: string}> = ({
  name,
  size = 15,
  color = 'currentColor',
}) => {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    style: {flex: '0 0 auto', color},
  };
  switch (name) {
    case 'manage':
      return (
        <svg {...common}>
          <path d='M4 7h9' />
          <path d='M17 7h3' />
          <path d='M4 17h3' />
          <path d='M11 17h9' />
          <circle cx='15' cy='7' r='2.4' />
          <circle cx='9' cy='17' r='2.4' />
        </svg>
      );
    case 'share':
      return (
        <svg {...common}>
          <path d='M12 15V4' />
          <path d='M8 8l4-4 4 4' />
          <path d='M5 14v4a2 2 0 002 2h10a2 2 0 002-2v-4' />
        </svg>
      );
    case 'screen':
      return (
        <svg {...common}>
          <rect x='3' y='4' width='18' height='12' rx='2' />
          <path d='M8 20h8' />
          <path d='M12 16v4' />
        </svg>
      );
    case 'rehearse':
      return (
        <svg {...common}>
          <polygon points='7 5 19 12 7 19 7 5' fill={color} stroke='none' />
        </svg>
      );
    case 'delete':
      return (
        <svg {...common}>
          <path d='M4 7h16' />
          <path d='M10 11v6' />
          <path d='M14 11v6' />
          <path d='M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12' />
          <path d='M9 7V4h6v3' />
        </svg>
      );
    case 'plus':
      return (
        <svg {...common}>
          <path d='M12 5v14' />
          <path d='M5 12h14' />
        </svg>
      );
    case 'home':
      return (
        <svg {...common}>
          <path d='M4 11l8-7 8 7' />
          <path d='M6 10v9a1 1 0 001 1h10a1 1 0 001-1v-9' />
        </svg>
      );
    case 'signout':
      return (
        <svg {...common}>
          <path d='M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3' />
          <path d='M10 17l-5-5 5-5' />
          <path d='M5 12h11' />
        </svg>
      );
  }
};
