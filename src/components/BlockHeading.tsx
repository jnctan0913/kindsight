import React from 'react';
import Link from 'next/link';

type Props = {
  href?: string;
  title: string;
  containerStyle?: React.CSSProperties;
  className?: React.HTMLAttributes<HTMLDivElement>['className'];
};

export const BlockHeading: React.FC<Props> = ({
  title,
  className,
  containerStyle,
  href,
}) => {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...containerStyle,
      }}
    >
      <h3 style={{textTransform: 'capitalize'}}>{title}</h3>
      {href && (
        <Link href={href}>
          <span
            className='t18'
            style={{color: 'var(--main-color)'}}
          >
            View all
          </span>
        </Link>
      )}
    </div>
  );
};
