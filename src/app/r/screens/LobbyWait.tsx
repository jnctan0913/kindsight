'use client';

import React from 'react';

import {asset} from '@/config';
import {components} from '@/components';
import {LanguageToggle, useT} from '@/i18n';
import {useRoomStore} from '@/stores/room';

export const LobbyWait: React.FC = () => {
  const t = useT();
  const me = useRoomStore((s) => s.me);

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
          style={{width: '60%', maxWidth: 320, height: 'auto'}}
        />
        <h2 style={{marginTop: 16}}>
          {t('player.claim.waiting.title', {name: me?.display_name ?? ''})}
        </h2>
        <p className='t16' style={{marginTop: 8}}>
          {t('player.claim.waiting.body')}
        </p>
      </main>
    </components.Screen>
  );
};
