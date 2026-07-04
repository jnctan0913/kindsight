'use client';

import React from 'react';

import {asset} from '@/config';
import {components} from '@/components';
import {LanguageToggle, useT} from '@/i18n';

export const ClaimClosed: React.FC = () => {
  const t = useT();
  return (
    <components.Screen>
      <components.Header rightSlot={<LanguageToggle />} />
      <main
        className='container scrollable'
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingBottom: 40,
          textAlign: 'center',
        }}
      >
        <img
          src={asset('/assets/kindsight/empty-lobby-soft.png')}
          alt=''
          aria-hidden='true'
          style={{width: '55%', maxWidth: 300, height: 'auto'}}
        />
        <h2 style={{marginTop: 16}}>{t('player.claim.closed.title')}</h2>
        <p className='t16' style={{marginTop: 8}}>
          {t('player.claim.closed.body')}
        </p>
      </main>
    </components.Screen>
  );
};
