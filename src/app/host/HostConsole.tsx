'use client';

import React, {useCallback, useEffect, useMemo, useState} from 'react';

import {BASE_PATH, asset} from '../../config';
import {components} from '../../components';
import {useT} from '../../i18n';
import {advancePhase, createRoom, getSnapshot} from '../../lib/api';
import {
  listActiveRooms,
  publishScreenState,
  readScreenState,
  removeActiveRoom,
  upsertActiveRoom,
  type ScreenRoomState,
  type ScreenPhase,
} from '../../lib/hostRoomSync';
import type {RoomMode} from '../../lib/types';
import {openBigScreen} from '../../lib/openBigScreen';
import {
  getHostSession,
  isHostAuthMockMode,
  onHostAuthChange,
  signOutHost,
  type HostSession,
} from '../../lib/supabase/hostAuth';
import {
  MOCK_COVERAGE,
  MOCK_HOST_ROOM,
  MOCK_HOST_ROSTER,
  MOCK_MOD_FEED,
  MOCK_OPTED_IN_COUNT,
  MOCK_REVEAL_STATUS,
  MOCK_ROUND_PROGRESS,
  type HostRosterEntry,
  type HostNote,
  type WritingMode,
} from '../../mock/room';
import type {RoomPhase, RosterEntry as PublicRosterEntry} from '../../lib/types';
import {ConsoleShell} from './components/ConsoleShell';
import {type HostPhase} from './components/PhaseStepper';
import {Toast} from './components/Toast';
import {ProjectorPreviewPanel} from './components/ProjectorPreviewPanel';
import {ConsoleHubScreen} from './screens/ConsoleHubScreen';
import {CreateRoomScreen} from './screens/CreateRoomScreen';
import {HostLoginScreen} from './screens/HostLoginScreen';
import {RosterBuilderScreen} from './screens/RosterBuilderScreen';
import {LobbyContent} from './screens/LobbyContent';
import {BriefingContent} from './screens/BriefingContent';
import {InGameContent} from './screens/InGameContent';
import {WrapUpContent} from './screens/WrapUpContent';
import {consoleCard, dosisFont} from './components/hostStyles';

type Step =
  | 'hub'
  | 'create'
  | 'roster'
  | 'lobby'
  | 'briefing'
  | 'writing'
  | 'wrapup'
  | 'ended';

const stepToPhase: Record<Exclude<Step, 'hub' | 'create' | 'roster' | 'ended'>, HostPhase> = {
  lobby: 'lobby',
  briefing: 'briefing',
  writing: 'writing',
  wrapup: 'wrapup',
};

const stepToScreenPhase = (step: Step, revealTriggered: boolean): ScreenPhase | null => {
  switch (step) {
    case 'lobby':
      return 'lobby';
    case 'briefing':
      return 'briefing';
    case 'writing':
      return 'writing';
    case 'wrapup':
      return revealTriggered ? 'reveal' : 'wrapup';
    default:
      return null;
  }
};

const MOCK_HIGHLIGHT_NOTES = MOCK_MOD_FEED.filter((_, i) => i < MOCK_OPTED_IN_COUNT).map(
  (n) => ({frame: n.frame, content: n.content}),
);

const toScreenMode = (mode: WritingMode): RoomMode =>
  mode === 'freeSelect' ? 'free_select' : 'round_robin';

const toWritingMode = (mode: RoomMode): WritingMode =>
  mode === 'free_select' ? 'freeSelect' : 'roundRobin';

const roomPhaseToStep: Record<RoomPhase, Step> = {
  lobby: 'lobby',
  briefing: 'briefing',
  writing: 'writing',
  reveal: 'wrapup',
  wrapup: 'wrapup',
};

const hostRosterFromPublic = (roster: PublicRosterEntry[]): HostRosterEntry[] =>
  roster.map((entry) => ({
    id: entry.participant_id,
    name: entry.display_name,
    claimed: entry.claimed,
  }));

const hostRosterFromNames = (names: string[]): HostRosterEntry[] =>
  names.map((name, index) => ({
    id: `local-${index}-${name}`,
    name,
    claimed: false,
  }));

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const joinUrlForRoom = (code: string): string => {
  const normalized = code.trim().toUpperCase();
  const path = `${BASE_PATH}/?code=${encodeURIComponent(normalized)}`;
  if (typeof window === 'undefined') return path;
  return new URL(path, window.location.origin).href;
};

export const HostConsole: React.FC = () => {
  const t = useT();

  const [authReady, setAuthReady] = useState(false);
  const [hostSession, setHostSession] = useState<HostSession | null>(null);

  const [step, setStep] = useState<Step>('hub');
  const [mode, setMode] = useState<WritingMode>(MOCK_HOST_ROOM.mode);
  const [rounds, setRounds] = useState(MOCK_HOST_ROOM.rounds);
  const [minutes, setMinutes] = useState(MOCK_HOST_ROOM.minutesPerRound);
  const [rosterNames, setRosterNames] = useState<string[]>(
    MOCK_HOST_ROSTER.map((r) => r.name),
  );
  const [hostRoster, setHostRoster] = useState<HostRosterEntry[]>(MOCK_HOST_ROSTER);
  const [roomCode, setRoomCode] = useState(MOCK_HOST_ROOM.code);
  const [liveRoomId, setLiveRoomId] = useState<string | null>(null);

  const [paused, setPaused] = useState(false);
  const [graceRunning, setGraceRunning] = useState(false);
  const [notes, setNotes] = useState<HostNote[]>(MOCK_MOD_FEED);
  const [briefingIndex, setBriefingIndex] = useState(0);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [roomActionError, setRoomActionError] = useState<string | null>(null);
  const [revealTriggered, setRevealTriggered] = useState(false);
  const [highlightEnabled, setHighlightEnabled] = useState(false);
  const [showReconnect, setShowReconnect] = useState(false);
  const [activeRooms, setActiveRooms] = useState(listActiveRooms());
  const joinUrl = useMemo(() => joinUrlForRoom(roomCode), [roomCode]);

  useEffect(() => {
    void getHostSession().then((session) => {
      setHostSession(session);
      setAuthReady(true);
    });
    return onHostAuthChange(setHostSession);
  }, []);

  const refreshActiveRooms = useCallback(() => {
    setActiveRooms(listActiveRooms());
  }, []);

  const buildScreenState = useCallback(
    (currentStep: Step, triggered: boolean, highlight: boolean): ScreenRoomState | null => {
      const screenPhase = stepToScreenPhase(currentStep, triggered);
      if (!screenPhase) return null;

      const claimed = hostRoster.filter((r) => r.claimed).length;
      return {
        code: roomCode,
        mode: toScreenMode(mode),
        phase: screenPhase,
        briefingIndex,
        claimedCount: claimed,
        totalCount: hostRoster.length,
        joinUrl,
        currentRound: MOCK_HOST_ROOM.currentRound,
        totalRounds: rounds,
        timerRemaining: MOCK_HOST_ROOM.timerRemaining,
        notesWritten: notes.length,
        revealTriggered: triggered,
        highlightEnabled: highlight,
        highlightNotes: MOCK_HIGHLIGHT_NOTES,
        activePrompt: null,
        lastJoinedName: hostRoster.find((r) => r.claimed)?.name ?? null,
        updatedAt: Date.now(),
      };
    },
    [briefingIndex, hostRoster, joinUrl, mode, notes.length, roomCode, rounds],
  );

  const syncScreen = useCallback(
    (currentStep: Step, triggered: boolean, highlight: boolean) => {
      const screenState = buildScreenState(currentStep, triggered, highlight);
      if (!screenState) return;

      publishScreenState(screenState);

      upsertActiveRoom({
        code: roomCode,
        phase: screenState.phase,
        createdAt: new Date().toISOString(),
        rosterSize: hostRoster.length,
      });
      refreshActiveRooms();
    },
    [buildScreenState, hostRoster.length, refreshActiveRooms, roomCode],
  );

  useEffect(() => {
    if (step === 'hub' || step === 'create' || step === 'roster' || step === 'ended') return;
    syncScreen(step, revealTriggered, highlightEnabled);
  }, [step, revealTriggered, highlightEnabled, briefingIndex, syncScreen]);

  useEffect(() => {
    if (step === 'hub' || step === 'create' || step === 'roster' || step === 'ended') return;
    const t1 = setTimeout(() => setShowReconnect(true), 600);
    const t2 = setTimeout(() => setShowReconnect(false), 4200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [step]);

  const refreshLiveRoom = useCallback(async () => {
    if (!liveRoomId || isHostAuthMockMode()) return;
    const snapshot = await getSnapshot(liveRoomId);
    setRoomCode(snapshot.code);
    setMode(toWritingMode(snapshot.mode));
    setRounds(snapshot.round_count ?? rounds);
    setMinutes(Math.max(1, Math.round(snapshot.round_seconds / 60)));
    setRosterNames(snapshot.roster.map((entry) => entry.display_name));
    setHostRoster(hostRosterFromPublic(snapshot.roster));
  }, [liveRoomId, rounds]);

  useEffect(() => {
    if (
      !liveRoomId ||
      step === 'hub' ||
      step === 'create' ||
      step === 'roster' ||
      step === 'ended'
    ) {
      return;
    }
    void refreshLiveRoom().catch(() => {
      /* keep the console usable if a background refresh misses */
    });
    const id = window.setInterval(() => {
      void refreshLiveRoom().catch(() => {
        /* keep the console usable if a background refresh misses */
      });
    }, 4000);
    return () => window.clearInterval(id);
  }, [liveRoomId, refreshLiveRoom, step]);

  const handleCreateRoom = useCallback(
    async (names: string[]) => {
      const cleanNames = names.map((name) => name.trim()).filter(Boolean);
      if (cleanNames.length === 0 || creatingRoom) return;

      setCreatingRoom(true);
      setRoomActionError(null);
      try {
        setRosterNames(cleanNames);
        setBriefingIndex(0);
        setRevealTriggered(false);
        setHighlightEnabled(false);

        if (isHostAuthMockMode()) {
          setRoomCode(MOCK_HOST_ROOM.code);
          setLiveRoomId(null);
          setHostRoster(hostRosterFromNames(cleanNames));
          setStep('lobby');
          return;
        }

        const roomMode = toScreenMode(mode);
        const created = await createRoom({
          p_mode: roomMode,
          p_names: cleanNames,
          p_round_count: roomMode === 'round_robin' ? rounds : null,
          p_round_seconds: minutes * 60,
        });

        setRoomCode(created.code);
        setLiveRoomId(created.room_id);
        setMode(toWritingMode(created.mode));
        setRounds(created.round_count ?? rounds);
        setMinutes(Math.max(1, Math.round(created.round_seconds / 60)));
        setRosterNames(created.roster.map((entry) => entry.display_name));
        setHostRoster(hostRosterFromPublic(created.roster));
        upsertActiveRoom({
          code: created.code,
          phase: 'lobby',
          createdAt: new Date().toISOString(),
          rosterSize: created.roster.length,
        });
        refreshActiveRooms();
        setStep('lobby');
      } catch (error) {
        setRoomActionError(messageOf(error));
      } finally {
        setCreatingRoom(false);
      }
    },
    [creatingRoom, minutes, mode, refreshActiveRooms, rounds],
  );

  const advanceRoomPhase = useCallback(
    async (fallbackStep: Step) => {
      setRoomActionError(null);
      if (!liveRoomId || isHostAuthMockMode()) {
        setStep(fallbackStep);
        return;
      }

      try {
        const next = await advancePhase(liveRoomId);
        setMode(toWritingMode(next.mode));
        setRounds(next.round_count ?? rounds);
        setMinutes(Math.max(1, Math.round(next.round_seconds / 60)));
        setStep(roomPhaseToStep[next.phase]);
        void refreshLiveRoom().catch(() => {
          /* background snapshot refresh only */
        });
      } catch (error) {
        setRoomActionError(messageOf(error));
      }
    },
    [liveRoomId, refreshLiveRoom, rounds],
  );

  const removeNote = (id: string) =>
    setNotes((prev) => prev.filter((n) => n.id !== id));

  const advanceRound = () => {
    setGraceRunning(true);
    setTimeout(() => setGraceRunning(false), 3000);
  };

  const handleSignOut = async () => {
    await signOutHost();
    setHostSession(null);
    setLiveRoomId(null);
    setRoomActionError(null);
    setStep('hub');
  };

  const reopenRoom = (code: string) => {
    if (code.toUpperCase() !== roomCode) return;
    const stored = listActiveRooms().find((r) => r.code === code.toUpperCase());
    if (!stored) return;
    const screenState = readScreenState(code.toUpperCase());
    if (typeof screenState?.briefingIndex === 'number') {
      setBriefingIndex(screenState.briefingIndex);
    }
    const phaseMap: Record<ScreenPhase, Step> = {
      lobby: 'lobby',
      briefing: 'briefing',
      writing: 'writing',
      reveal: 'wrapup',
      wrapup: 'wrapup',
    };
    setStep(phaseMap[stored.phase] ?? 'lobby');
  };

  const hubShell = useMemo(
    () => (
      <ConsoleShell variant='hub' onSignOut={() => void handleSignOut()}>
        <ConsoleHubScreen
          email={hostSession?.email ?? ''}
          activeRooms={activeRooms}
          onStartGame={() => setStep('create')}
          onReopenRoom={reopenRoom}
        />
      </ConsoleShell>
    ),
    [activeRooms, hostSession?.email],
  );

  const presenterState = buildScreenState(step, revealTriggered, highlightEnabled);

  if (!authReady) {
    return null;
  }

  if (!hostSession) {
    return <HostLoginScreen onSignedIn={setHostSession} />;
  }

  if (step === 'hub') {
    return hubShell;
  }

  if (step === 'create') {
    return (
      <CreateRoomScreen
        mode={mode}
        rounds={rounds}
        minutes={minutes}
        rosterSize={rosterNames.length}
        onModeChange={setMode}
        onRoundsChange={setRounds}
        onMinutesChange={setMinutes}
        onCreate={() => setStep('roster')}
        onBack={() => setStep('hub')}
      />
    );
  }

  if (step === 'roster') {
    return (
      <RosterBuilderScreen
        initial={rosterNames}
        onContinue={(names) => void handleCreateRoom(names)}
        onBack={() => setStep('create')}
        submitting={creatingRoom}
        error={roomActionError}
      />
    );
  }

  if (step === 'ended') {
    return (
      <div
        style={{
          minHeight: '100dvh',
          backgroundColor: 'var(--host-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div style={{...consoleCard, maxWidth: 420, textAlign: 'center', padding: 32}}>
          <img
            src={asset('/assets/kindsight/kindsight-mascot-only.png')}
            alt='Kindsight'
            style={{width: 120, height: 'auto', margin: '0 auto'}}
          />
          <h2 style={{marginTop: 16, fontFamily: dosisFont}}>
            {t('host.ended.title')}
          </h2>
          <p className='t14' style={{marginTop: 8}}>
            {t('host.ended.body')}
          </p>
          <components.Button
            label={t('host.hub.home')}
            onClick={() => {
              removeActiveRoom(roomCode);
              refreshActiveRooms();
              setStep('hub');
              setNotes(MOCK_MOD_FEED);
              setRoomCode(MOCK_HOST_ROOM.code);
              setLiveRoomId(null);
              setHostRoster(MOCK_HOST_ROSTER);
              setRosterNames(MOCK_HOST_ROSTER.map((r) => r.name));
              setBriefingIndex(0);
              setRevealTriggered(false);
              setHighlightEnabled(false);
            }}
            colorScheme='secondary'
            containerStyle={{marginTop: 24}}
            style={{textTransform: 'none'}}
          />
        </div>
      </div>
    );
  }

  const phase = stepToPhase[step];
  const stillWriting = MOCK_ROUND_PROGRESS.filter(
    (p) => p.state !== 'submitted',
  ).length;

  return (
    <ConsoleShell
      code={roomCode}
      phase={phase}
      playerCount={rosterNames.length}
      noteCount={notes.length}
      onHome={() => setStep('hub')}
      onSignOut={() => void handleSignOut()}
      rightPanel={
        <ProjectorPreviewPanel
          state={presenterState}
          onOpenBigScreen={() => openBigScreen(roomCode)}
        />
      }
    >
      {step === 'lobby' && (
        <LobbyContent
          code={roomCode}
          joinUrl={joinUrl}
          roster={hostRoster}
          onStart={() => {
            setBriefingIndex(0);
            void advanceRoomPhase('briefing');
          }}
          onOpenBigScreen={() => openBigScreen(roomCode)}
        />
      )}

      {step === 'briefing' && (
        <BriefingContent
          briefingIndex={briefingIndex}
          mode={toScreenMode(mode)}
          onBriefingIndexChange={setBriefingIndex}
          onStart={() => void advanceRoomPhase('writing')}
        />
      )}

      {step === 'writing' && (
        <InGameContent
          mode={mode}
          round={MOCK_HOST_ROOM.currentRound}
          totalRounds={rounds}
          timer={MOCK_HOST_ROOM.timerRemaining}
          paused={paused}
          graceRunning={graceRunning}
          stillWriting={stillWriting}
          coverage={MOCK_COVERAGE}
          roundProgress={MOCK_ROUND_PROGRESS}
          notes={notes}
          onTogglePause={() => setPaused((v) => !v)}
          onAdvance={advanceRound}
          onRemoveNote={removeNote}
          onAdvanceReveal={() => void advanceRoomPhase('wrapup')}
        />
      )}

      {step === 'wrapup' && (
        <WrapUpContent
          code={roomCode}
          mode={mode}
          coverage={MOCK_COVERAGE}
          revealStatus={MOCK_REVEAL_STATUS}
          optedInCount={MOCK_OPTED_IN_COUNT}
          notes={notes}
          revealTriggered={revealTriggered}
          onTriggerReveal={() => setRevealTriggered(true)}
          onRemoveNote={removeNote}
          onEndRoom={() => setStep('ended')}
          onHighlightToggle={(enabled) => setHighlightEnabled(enabled)}
        />
      )}

      <Toast
        message={roomActionError ?? t('host.reclaim.toast')}
        visible={Boolean(roomActionError) || showReconnect}
      />
    </ConsoleShell>
  );
};
