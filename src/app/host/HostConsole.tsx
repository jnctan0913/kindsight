'use client';

import React, {useCallback, useEffect, useMemo, useState} from 'react';

import {BASE_PATH, asset} from '../../config';
import {components} from '../../components';
import {useT} from '../../i18n';
import {
  advancePhase,
  createRoom,
  getModerationFeed,
  getSnapshot,
  killNote,
} from '../../lib/api';
import {subscribeToRoom, type RoomSubscription} from '../../lib/realtime';
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
  REVEAL_FLOOR,
  type HostRosterEntry,
  type HostNote,
  type WritingMode,
} from '../../mock/room';
import type {
  HostSnapshot,
  ModerationNote,
  RoomPhase,
  RosterEntry as PublicRosterEntry,
} from '../../lib/types';
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

const formatClock = (totalSeconds: number): string => {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
};

// Round timer, server-anchored (D22): remaining = round_seconds - elapsed since
// round_started_at, frozen at timer_paused_at while paused.
const liveTimerString = (snap: HostSnapshot, skewMs: number): string => {
  if (!snap.round_started_at) return formatClock(snap.round_seconds);
  const startMs = new Date(snap.round_started_at).getTime();
  const refMs = snap.timer_paused_at
    ? new Date(snap.timer_paused_at).getTime()
    : Date.now() + skewMs;
  return formatClock(snap.round_seconds - (refMs - startMs) / 1000);
};

const coverageFromSnapshot = (snap: HostSnapshot) =>
  snap.coverage
    .filter((c) => c.claimed)
    .map((c) => ({name: c.display_name, noteCount: c.live_count}));

const roundProgressFromSnapshot = (snap: HostSnapshot) =>
  snap.coverage
    .filter((c) => c.claimed)
    .map((c) => ({
      name: c.display_name,
      state: (c.submitted_this_round ? 'submitted' : 'writing') as
        | 'submitted'
        | 'writing'
        | 'idle',
    }));

const hostNotesFromModeration = (notes: ModerationNote[]): HostNote[] =>
  notes
    .filter((n) => !n.killed)
    .map((n) => ({
      id: n.note_id,
      target: n.target_name,
      frame: n.frame,
      content: n.content,
    }));

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
  const [hostSnap, setHostSnap] = useState<HostSnapshot | null>(null);
  const [skewMs, setSkewMs] = useState(0);
  const [liveTimer, setLiveTimer] = useState('');
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
    setSkewMs(new Date(snapshot.server_now).getTime() - Date.now());
    if (snapshot.role === 'host') {
      setHostSnap(snapshot);
      setPaused(Boolean(snapshot.timer_paused_at));
      try {
        setNotes(hostNotesFromModeration(await getModerationFeed(liveRoomId)));
      } catch {
        /* moderation feed is best-effort; keep the last list on a miss */
      }
    }
  }, [liveRoomId, rounds]);

  // Converge on server state via realtime pings (snapshot + moderation re-pull),
  // with a slow poll as reconnect backstop. Replaces the old 4s poll.
  useEffect(() => {
    if (
      !liveRoomId ||
      isHostAuthMockMode() ||
      step === 'hub' ||
      step === 'create' ||
      step === 'roster' ||
      step === 'ended'
    ) {
      return;
    }
    const pull = () =>
      void refreshLiveRoom().catch(() => {
        /* keep the console usable if a background refresh misses */
      });
    pull();
    let sub: RoomSubscription | null = subscribeToRoom(liveRoomId, () => pull());
    const id = window.setInterval(pull, 60000);
    return () => {
      window.clearInterval(id);
      sub?.unsubscribe();
      sub = null;
    };
  }, [liveRoomId, refreshLiveRoom, step]);

  // Tick the round timer once a second while writing, server-anchored.
  useEffect(() => {
    if (!hostSnap || step !== 'writing') return;
    setLiveTimer(liveTimerString(hostSnap, skewMs));
    const id = window.setInterval(
      () => setLiveTimer(liveTimerString(hostSnap, skewMs)),
      1000,
    );
    return () => window.clearInterval(id);
  }, [hostSnap, skewMs, step]);

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

  const removeNote = (id: string) => {
    // Optimistic drop so the feed feels instant; the notes ping reconciles.
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (liveRoomId && !isHostAuthMockMode()) {
      void killNote(id)
        .then(() => refreshLiveRoom())
        .catch(() => {
          /* a failed kill will reappear on the next snapshot pull */
          void refreshLiveRoom().catch(() => {});
        });
    }
  };

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

  // The projector is a co-star while the room looks at it (lobby QR, briefing
  // slide) and a monitor while the host works the feed (writing, wrap-up).
  const previewWidth =
    step === 'lobby' ? 660 : step === 'briefing' ? 560 : step === 'wrapup' ? 480 : 400;

  // Live room drives the dashboard from the host snapshot + moderation feed;
  // mock/demo mode keeps the scripted data.
  const liveCoverage = hostSnap ? coverageFromSnapshot(hostSnap) : MOCK_COVERAGE;
  const liveRoundProgress = hostSnap
    ? roundProgressFromSnapshot(hostSnap)
    : MOCK_ROUND_PROGRESS;
  const playerCount = hostSnap
    ? hostSnap.coverage.filter((c) => c.claimed).length
    : rosterNames.length;
  const timerString = hostSnap ? liveTimer || liveTimerString(hostSnap, skewMs) : MOCK_HOST_ROOM.timerRemaining;
  const currentRound = hostSnap ? Math.max(1, hostSnap.current_round) : MOCK_HOST_ROOM.currentRound;
  const stillWriting = hostSnap
    ? mode === 'roundRobin'
      ? hostSnap.coverage.filter((c) => c.claimed && c.submitted_this_round === false).length
      : hostSnap.coverage.filter((c) => c.claimed && c.live_count < REVEAL_FLOOR).length
    : MOCK_ROUND_PROGRESS.filter((p) => p.state !== 'submitted').length;

  return (
    <ConsoleShell
      code={roomCode}
      phase={phase}
      playerCount={playerCount}
      noteCount={notes.length}
      previewWidth={previewWidth}
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
          round={currentRound}
          totalRounds={rounds}
          timer={timerString}
          paused={paused}
          graceRunning={graceRunning}
          stillWriting={stillWriting}
          coverage={liveCoverage}
          roundProgress={liveRoundProgress}
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
          coverage={liveCoverage}
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
