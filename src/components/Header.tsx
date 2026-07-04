'use client';

import React from 'react';
import {useRouter} from 'next/navigation';

import {svg} from '../svg';

type Props = {
  title?: string;
  showLogo?: boolean;
  showGoBack?: boolean;
};

export const Header: React.FC<Props> = ({showGoBack, showLogo, title}) => {
  const router = useRouter();

  const renderGoBack = () => {
    if (!showGoBack) return null;
    return (
      <button
        onClick={() => router.back()}
        style={{left: '0px', padding: '0 20px', position: 'absolute'}}
      >
        <svg.GoBackSvg />
      </button>
    );
  };

  const renderTitle = () => {
    if (!title) return null;
    return (
      <div
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        <h4>{title}</h4>
      </div>
    );
  };

  const renderLogo = () => {
    if (!showLogo) return null;
    return (
      <div
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        <svg.HeaderLogoSvg />
      </div>
    );
  };

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        position: 'relative',
        height: 'var(--header-height)',
      }}
    >
      {renderGoBack()}
      {renderTitle()}
      {renderLogo()}
    </header>
  );
};
