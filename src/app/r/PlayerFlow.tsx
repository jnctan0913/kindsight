'use client';

import React, {useEffect, useRef, useState} from 'react';
import {useSearchParams} from 'next/navigation';

import {useRoomStore} from '@/stores/room';
import {components} from '@/components';
import {LanguageToggle, useT} from '@/i18n';
import {ConnectionBanner} from '@/components/ConnectionBanner';

import {JoinPrompt} from './screens/JoinPrompt';
import {ClaimContent} from './screens/ClaimContent';
import {ClaimClosed} from './screens/ClaimClosed';
import {HostSessionNotice} from './screens/HostSessionNotice';
import {BriefingContent} from './screens/BriefingContent';
import {LobbyWait} from './screens/LobbyWait';
import {WriteContent} from './screens/WriteContent';
import {RevealContent} from './screens/RevealContent';
import {EndedCard} from './screens/EndedCard';

const normalizeCode = (value: string) =>
  value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);

const LoadingView: React.FC<{label: string}> = ({label}) => (
  <components.Screen>
    <components.Header rightSlot={<LanguageToggle />} />
    <main
      className='container'
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60dvh',
        gap: 16,
      }}
    >
      <span
        aria-hidden='true'
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--accent-color)',
          animation: 'kindsight-spin 0.8s linear infinite',
        }}
      />
      <p className='t14' aria-live='polite'>
        {label}
      </p>
      <style>{'@keyframes kindsight-spin{to{transform:rotate(360deg)}}'}</style>
    </main>
  </components.Screen>
);

export const PlayerFlow: React.FC = () => {
  const t = useT();
  const searchParams = useSearchParams();
  const queryCode = normalizeCode(searchParams.get('code') ?? '');

  const bootstrap = useRoomStore((s) => s.bootstrap);
  const roomId = useRoomStore((s) => s.roomId);
  const role = useRoomStore((s) => s.role);
  const phase = useRoomStore((s) => s.phase);
  const hydrating = useRoomStore((s) => s.hydrating);
  const joinFailure = useRoomStore((s) => s.joinFailure);
  const ended = useRoomStore((s) => s.ended);

  const [initializing, setInitializing] = useState(true);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const store = useRoomStore.getState();
    void (async () => {
      if (store.roomId) {
        await store.refresh();
      } else if (queryCode) {
        await store.bootstrap(queryCode);
      } else {
        await store.restore();
      }
      setInitializing(false);
    })();
  }, [queryCode]);

  if (ended) {
    return <EndedCard />;
  }

  if (initializing || (hydrating && !roomId)) {
    return <LoadingView label={t('player.loading')} />;
  }

  if (!roomId) {
    return <JoinPrompt initialCode={queryCode} failure={joinFailure} onJoin={bootstrap} />;
  }

  let body: React.ReactNode;
  if (role === 'joiner') {
    // Late arrivals can still claim through the writing phase; past that,
    // claim_name refuses, so we say so up front rather than let it fail.
    body =
      phase === 'lobby' || phase === 'briefing' || phase === 'writing' ? (
        <ClaimContent />
      ) : (
        <ClaimClosed />
      );
  } else if (role === 'player') {
    switch (phase) {
      case 'lobby':
        body = <LobbyWait />;
        break;
      case 'briefing':
        body = <BriefingContent />;
        break;
      case 'writing':
        body = <WriteContent />;
        break;
      case 'reveal':
      case 'wrapup':
        body = <RevealContent />;
        break;
      default:
        body = <LoadingView label={t('player.loading')} />;
    }
  } else {
    // A host session that lands on /r (same-browser testing): point to the
    // console and how to join as a player, instead of a dead-end closed card.
    body = <HostSessionNotice />;
  }

  return (
    <>
      <ConnectionBanner />
      {body}
    </>
  );
};
