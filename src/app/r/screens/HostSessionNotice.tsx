'use client';

import React from 'react';
import Link from 'next/link';

import {asset} from '@/config';
import {components} from '@/components';
import {LanguageToggle, useT} from '@/i18n';
import {Routes} from '@/routes';

// A host session that opens the player URL (common when testing host and player
// in the same browser) resolves to role 'host', which has nothing player-shaped
// to show. Say so plainly and point to the console instead of dead-ending.
export const HostSessionNotice: React.FC = () => {
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
        <h2 style={{marginTop: 16}}>{t('player.hostSession.title')}</h2>
        <p className='t16' style={{marginTop: 8, maxWidth: 420}}>
          {t('player.hostSession.body')}
        </p>
        <Link
          href={Routes.HOST}
          className='clickable'
          style={{
            marginTop: 24,
            height: 52,
            minWidth: 220,
            borderRadius: 999,
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--white-color)',
            boxShadow: 'var(--shadow-soft)',
            color: 'var(--main-color)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
            fontFamily: 'var(--font-dosis), var(--font-noto-sc), sans-serif',
            fontSize: 16,
            fontWeight: 700,
            padding: '0 24px',
          }}
        >
          {t('player.hostSession.cta')}
        </Link>
      </main>
    </components.Screen>
  );
};
