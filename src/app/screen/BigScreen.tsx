'use client';

import React, {useMemo} from 'react';
import {useSearchParams} from 'next/navigation';

import {useT} from '../../i18n';
import {useScreenRoomState, type ScreenRoomState} from '../../lib/hostRoomSync';
import {MOCK_HOST_ROOM} from '../../mock/room';
import styles from './BigScreen.module.scss';
import {ProjectorView} from './ProjectorView';
import {useLiveScreenState} from './useLiveScreen';
import {useRoomMusic} from './useRoomMusic';
import {MusicControls} from './MusicControls';

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
    musicOn: true,
    updatedAt: Date.now(),
  };
}

export const BigScreen: React.FC = () => {
  const t = useT();
  const params = useSearchParams();
  const code = (params.get('code') ?? '').trim().toUpperCase();
  // Embedded console preview: mirror the screen but stay silent (no arm overlay,
  // no transport, no music channel).
  const preview = params.get('preview') === '1';

  const live = useLiveScreenState(code || null);
  const synced = useScreenRoomState(code || null);

  const state = useMemo(() => {
    if (!code) return null;
    // Live Supabase room is the source of truth for phase, counts, and
    // highlights. The briefing frame index and active prompt are host-ephemeral
    // and published to localStorage for the same-machine "Open big screen"; when
    // present, overlay them so the projector follows the console's controls.
    if (live.status === 'ready') {
      return synced
        ? {
            ...live.state,
            briefingIndex: synced.briefingIndex,
            activePrompt: synced.activePrompt,
          }
        : live.state;
    }
    // Supabase configured but still resolving or the room is gone: use the
    // same-machine localStorage frame if one exists (null renders the waiting
    // card), never a fabricated mock room.
    if (live.status === 'loading' || live.status === 'not_found') {
      return synced;
    }
    // No Supabase env: demo/preview path.
    return synced ?? defaultState(code);
  }, [code, live, synced]);

  const music = useRoomMusic(state, preview);

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

  const revealing = state.phase === 'reveal' || state.revealTriggered;
  return (
    <div
      style={{position: 'relative', minHeight: '100dvh'}}
      onClick={!preview && music.showControls && !music.armed ? music.arm : undefined}
    >
      <ProjectorView state={state} />
      {!preview && <MusicControls music={music} musicOn={state.musicOn} revealing={revealing} />}
    </div>
  );
};
