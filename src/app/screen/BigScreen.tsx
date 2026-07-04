'use client';

import React, {useMemo} from 'react';
import {useSearchParams} from 'next/navigation';

import {useT} from '../../i18n';
import {readScreenState, useScreenRoomState, type ScreenRoomState} from '../../lib/hostRoomSync';
import {MOCK_HOST_ROOM} from '../../mock/room';
import styles from './BigScreen.module.scss';
import {ProjectorView} from './ProjectorView';

function defaultState(code: string): ScreenRoomState {
  return {
    code,
    mode: 'round_robin',
    phase: 'lobby',
    briefingIndex: 0,
    claimedCount: 0,
    totalCount: 10,
    joinUrl: MOCK_HOST_ROOM.joinUrl,
    currentRound: 1,
    totalRounds: 4,
    timerRemaining: '03:00',
    notesWritten: 0,
    revealTriggered: false,
    highlightEnabled: false,
    highlightNotes: [],
    activePrompt: null,
    lastJoinedName: null,
    updatedAt: Date.now(),
  };
}

export const BigScreen: React.FC = () => {
  const t = useT();
  const params = useSearchParams();
  const code = (params.get('code') ?? '').trim().toUpperCase();

  const synced = useScreenRoomState(code || null);

  const state = useMemo(() => {
    if (!code) return null;
    return synced ?? readScreenState(code) ?? defaultState(code);
  }, [code, synced]);

  if (!code) {
    return (
      <div className={styles.shell}>
        <p className={styles.headline}>{t('screen.missingCode')}</p>
      </div>
    );
  }

  if (!state) {
    return (
      <div className={`${styles.shell} ${styles.waiting}`}>
        <p className={styles.headline}>{t('screen.waiting')}</p>
        <p className={styles.subcopy}>{code}</p>
      </div>
    );
  }

  return <ProjectorView state={state} />;
};
