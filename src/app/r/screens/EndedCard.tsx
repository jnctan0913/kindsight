'use client';

import React from 'react';
import {useRouter} from 'next/navigation';

import {asset} from '@/config';
import {components} from '@/components';
import {LanguageToggle, useT} from '@/i18n';
import {Routes} from '@/routes';
import {useRoomStore} from '@/stores/room';

import styles from '../player.module.scss';

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
      <div className={styles.aura} aria-hidden='true' />
      <components.Header rightSlot={<LanguageToggle />} />
      <main className={`container scrollable ${styles.center}`}>
        <img
          src={asset('/assets/kindsight/kindsight-mascot-only.png')}
          alt=''
          aria-hidden='true'
          className={styles.mascot}
        />
        <div
          className={`${styles.card} ${styles.cardWide} ${styles.rise}`}
          style={{marginTop: 24}}
        >
          <h2>{t('player.ended.title')}</h2>
          <p className='t16' style={{marginTop: 8}}>
            {t('player.ended.body')}
          </p>
        </div>
        <components.Button
          label={t('player.ended.home')}
          onClick={goHome}
          colorScheme='secondary'
          className='pressable'
          containerStyle={{marginTop: 24, width: '100%', maxWidth: 420}}
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
