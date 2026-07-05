'use client';

import React from 'react';

import {asset} from '@/config';
import {components} from '@/components';
import {LanguageToggle, useT} from '@/i18n';
import {useRoomStore} from '@/stores/room';

import styles from '../player.module.scss';

export const LobbyWait: React.FC = () => {
  const t = useT();
  const me = useRoomStore((s) => s.me);

  return (
    <components.Screen>
      <div className={styles.aura} aria-hidden='true' />
      <components.Header rightSlot={<LanguageToggle />} />
      <main className={`container scrollable ${styles.center}`}>
        <img
          src={asset('/assets/kindsight/mascot-wave.png')}
          alt=''
          aria-hidden='true'
          className={`${styles.mascot} ${styles.bob}`}
        />
        <div
          className={`${styles.card} ${styles.cardGlow} ${styles.cardWide} ${styles.rise}`}
          style={{marginTop: 24}}
          aria-live='polite'
        >
          <h2>{t('player.claim.waiting.title', {name: me?.display_name ?? ''})}</h2>
          <p className='t16' style={{marginTop: 8}}>
            {t('player.claim.waiting.body')}
          </p>
        </div>
      </main>
    </components.Screen>
  );
};
