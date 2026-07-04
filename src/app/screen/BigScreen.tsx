'use client';

import React, {useMemo} from 'react';
import {useSearchParams} from 'next/navigation';

import {useT} from '../../i18n';
import {readScreenState, useScreenRoomState, type ScreenRoomState} from '../../lib/hostRoomSync';
import {MOCK_HOST_ROOM} from '../../mock/room';
import styles from './BigScreen.module.scss';
import {ProjectorView} from './ProjectorView';
import {useLiveScreenState} from './useLiveScreen';

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

  const live = useLiveScreenState(code || null);
  const synced = useScreenRoomState(code || null);

  const state = useMemo(() => {
    if (!code) return null;
    // Live Supabase room is the source of truth when present.
    if (live.status === 'ready') return live.state;
    // Supabase configured but still resolving or the room is gone: prefer a
    // same-machine localStorage frame if one exists, else show the waiting card
    // rather than fabricating a mock room.
    if (live.status === 'loading' || live.status === 'not_found') {
      return synced ?? readScreenState(code);
    }
    // No Supabase env: demo/preview path.
    return synced ?? readScreenState(code) ?? defaultState(code);
  }, [code, live, synced]);

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
