'use client';

import React from 'react';
import {useRouter} from 'next/navigation';

import {asset} from '@/config';
import {components} from '@/components';
import {LanguageToggle, useT} from '@/i18n';
import {Routes} from '@/routes';
import {useRoomStore} from '@/stores/room';

export const EndedCard: React.FC = () => {
  const t = useT();
  const router = useRouter();
  const reset = useRoomStore((s) => s.reset);

  // Clear the persisted room code and tear down the subscription before we
  // leave, so /r does not try to restore the dead room on the way home.
  const goHome = () => {
    reset();
    router.push(Routes.HOME);
  };

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
        <h2 style={{marginTop: 16}}>{t('player.ended.title')}</h2>
        <p className='t16' style={{marginTop: 8}}>
          {t('player.ended.body')}
        </p>
        <components.Button
          label={t('player.ended.home')}
          onClick={goHome}
          colorScheme='secondary'
          containerStyle={{marginTop: 24, width: '100%', maxWidth: 400}}
          style={{
            textTransform: 'none',
            boxShadow:
              'var(--shadow-soft), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          }}
        />
      </main>
    </components.Screen>
  );
};
