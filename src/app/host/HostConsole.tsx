'use client';

import React, {useCallback, useEffect, useMemo, useState} from 'react';

import {BASE_PATH, asset} from '../../config';
import {components} from '../../components';
import {useT} from '../../i18n';
import {
  addRound,
  advancePhase,
  createRoom,
  endRoom,
  finalizeRound,
  getModerationFeed,
  getSnapshot,
  joinRoom,
  killNote,
  listHostRooms,
  removeParticipant,
  renameParticipant,
  rewindPhase,
  startRound,
  updateSettings,
} from '../../lib/api';
import {subscribeToRoom, type RoomSubscription} from '../../lib/realtime';
import {
  listActiveRooms,
  publishScreenState,
  readPromptList,
  readScreenState,
  removeActiveRoom,
  upsertActiveRoom,
  writePromptList,
  type ActiveRoomEntry,
  type PromptItem,
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
  MOCK_REVEAL_STATUS,
  MOCK_ROUND_PROGRESS,
  REVEAL_FLOOR,
  type HostRosterEntry,
  type HostNote,
  type WritingMode,
} from '../../mock/room';
import type {
  HighlightMode,
  HostSnapshot,
  ModerationNote,
  RoomPhase,
  RosterEntry as PublicRosterEntry,
} from '../../lib/types';
import {ConsoleShell} from './components/ConsoleShell';
import {type HostPhase} from './components/PhaseStepper';
import {Toast} from './components/Toast';
import {ProjectorPreviewPanel} from './components/ProjectorPreviewPanel';
import {SessionSummaryCard} from './components/SessionSummaryCard';
import {ConsoleHubScreen} from './screens/ConsoleHubScreen';
import {CreateRoomScreen} from './screens/CreateRoomScreen';
import {HostLoginScreen} from './screens/HostLoginScreen';
import {RosterBuilderScreen} from './screens/RosterBuilderScreen';
import {LobbyContent} from './screens/LobbyContent';
import {BriefingContent} from './screens/BriefingContent';
import {InGameContent} from './screens/InGameContent';
import {WrapUpContent} from './screens/WrapUpContent';
import {codeText, consoleCard, dosisFont, rowActionSecondary} from './components/hostStyles';
import {HostIcon} from './components/HostIcon';
import {JoinQR} from './components/JoinQR';

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
// round_started_at, frozen at timer_paused_at while paused. Seconds can go
// negative between the timer hitting 0 and the round finalizing.
const liveTimerSeconds = (snap: HostSnapshot, skewMs: number): number => {
  if (!snap.round_started_at) return snap.round_seconds;
  const startMs = new Date(snap.round_started_at).getTime();
  const refMs = snap.timer_paused_at
    ? new Date(snap.timer_paused_at).getTime()
    : Date.now() + skewMs;
  return snap.round_seconds - (refMs - startMs) / 1000;
};

const liveTimerString = (snap: HostSnapshot, skewMs: number): string =>
  formatClock(liveTimerSeconds(snap, skewMs));

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
      shared: n.shared_to_wall,
    }));

const revealStatusesFromSnapshot = (snap: HostSnapshot) =>
  snap.coverage
    .filter((c) => c.claimed)
    .map((c) => ({name: c.display_name, status: c.reveal_state}));

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
  const [copiedLink, setCopiedLink] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const [briefingIndex, setBriefingIndex] = useState(0);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [roomActionError, setRoomActionError] = useState<string | null>(null);
  const [revealTriggered, setRevealTriggered] = useState(false);
  const [highlightEnabled, setHighlightEnabled] = useState(false);
  const [highlightMode, setHighlightMode] = useState<HighlightMode>('grid');
  const [highlightTarget, setHighlightTarget] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  // Host's editable discussion-prompt list plus which one is live on the screen.
  // The active prompt *text* is derived, so editing the live prompt updates the
  // projector automatically (localStorage sync); the DB push happens in handlers.
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [activePromptId, setActivePromptId] = useState<string | null>(null);
  const activePrompt = useMemo(
    () => prompts.find((p) => p.id === activePromptId)?.text ?? null,
    [prompts, activePromptId],
  );
  const [showReconnect, setShowReconnect] = useState(false);
  const [activeRooms, setActiveRooms] = useState(listActiveRooms());
  const joinUrl = useMemo(() => joinUrlForRoom(roomCode), [roomCode]);

  const seedPrompts = useCallback(
    (): PromptItem[] =>
      (['host.prompt.1', 'host.prompt.2', 'host.prompt.3'] as const).map((k, i) => ({
        id: `seed-${i}`,
        text: t(k),
      })),
    [t],
  );

  // Load this room's saved prompt list (or seed defaults). Keyed on roomCode only
  // so resuming a room reloads it, while stepping through phases never wipes edits.
  useEffect(() => {
    const stored = readPromptList(roomCode);
    setPrompts(stored && stored.length > 0 ? stored : seedPrompts());
  }, [roomCode, seedPrompts]);

  // Persist edits so a host refresh keeps them.
  useEffect(() => {
    if (prompts.length > 0) writePromptList(roomCode, prompts);
  }, [prompts, roomCode]);

  useEffect(() => {
    void getHostSession().then((session) => {
      setHostSession(session);
      setAuthReady(true);
    });
    return onHostAuthChange(setHostSession);
  }, []);

  // On the live path the host's rooms live in Postgres (host_id = the account),
  // so the hub follows the account across devices/origins instead of only this
  // browser's localStorage. Cache each into localStorage (oldest first so the
  // newest ends up at the front) for instant first paint and offline fallback.
  const syncHostRoomsFromDb = useCallback(async () => {
    if (isHostAuthMockMode()) return;
    try {
      const rows = await listHostRooms();
      const mapped: ActiveRoomEntry[] = rows.map((r) => ({
        code: r.code,
        phase: r.phase,
        createdAt: r.created_at,
        rosterSize: r.roster_size,
      }));
      setActiveRooms(mapped);
      [...mapped].reverse().forEach(upsertActiveRoom);
    } catch {
      setActiveRooms(listActiveRooms());
    }
  }, []);

  const refreshActiveRooms = useCallback(() => {
    if (!isHostAuthMockMode()) {
      void syncHostRoomsFromDb();
      return;
    }
    setActiveRooms(listActiveRooms());
  }, [syncHostRoomsFromDb]);

  useEffect(() => {
    if (hostSession && !isHostAuthMockMode()) void syncHostRoomsFromDb();
  }, [hostSession, syncHostRoomsFromDb]);

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
        highlightMode,
        highlightTarget,
        highlightNotes: notes
          .filter((n) => n.shared)
          .map((n) => ({frame: n.frame, content: n.content, recipient: n.target})),
        activePrompt,
        closing,
        lastJoinedName: hostRoster.find((r) => r.claimed)?.name ?? null,
        musicOn,
        updatedAt: Date.now(),
      };
    },
    [
      activePrompt,
      briefingIndex,
      closing,
      highlightMode,
      highlightTarget,
      hostRoster,
      joinUrl,
      mode,
      musicOn,
      notes,
      roomCode,
      rounds,
    ],
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
  }, [step, revealTriggered, highlightEnabled, briefingIndex, activePrompt, syncScreen]);

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
    setClosing(snapshot.closing);
    setHighlightEnabled(snapshot.highlight_enabled);
    // 'all' (rotate) is retired; treat any legacy value as the arranged wall.
    setHighlightMode(snapshot.highlight_mode === 'person' ? 'person' : 'grid');
    setHighlightTarget(snapshot.highlight_target);
    if (snapshot.role === 'host') {
      setHostSnap(snapshot);
      setMusicOn(snapshot.music_on);
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

  // Grace window driver: whenever the snapshot carries a live grace_until, show
  // the "grace running" state and schedule finalize_round for when it elapses.
  // finalize_round is idempotent and host-or-participant callable, so a re-pull
  // that reschedules is harmless. Clearing grace_until flips the flag back off.
  useEffect(() => {
    if (!liveRoomId || isHostAuthMockMode() || step !== 'writing') return;
    const graceUntil = hostSnap?.grace_until;
    if (!graceUntil) {
      setGraceRunning(false);
      return;
    }
    setGraceRunning(true);
    const delay =
      Math.max(0, new Date(graceUntil).getTime() - (Date.now() + skewMs)) + 300;
    const id = window.setTimeout(() => {
      void finalizeRound(liveRoomId)
        .then(() => refreshLiveRoom())
        .catch(() => {
          void refreshLiveRoom().catch(() => {});
        });
    }, delay);
    return () => window.clearTimeout(id);
  }, [hostSnap, liveRoomId, skewMs, step, refreshLiveRoom]);

  // Auto-advance (Mode A): when the round timer reaches 0 with no grace running
  // and the timer unpaused, open the grace window automatically. Skipped on the
  // final round (no next round to roll into) so the room parks for the host to
  // advance to reveal. Fires once per snapshot; the next pull carries grace_until
  // and the guard above takes over.
  useEffect(() => {
    if (!liveRoomId || isHostAuthMockMode() || step !== 'writing') return;
    if (!hostSnap || mode !== 'roundRobin') return;
    if (hostSnap.timer_paused_at || hostSnap.grace_until) return;
    if (
      hostSnap.round_count != null &&
      hostSnap.current_round >= hostSnap.round_count
    ) {
      return;
    }
    let fired = false;
    const tick = () => {
      if (fired) return;
      if (liveTimerSeconds(hostSnap, skewMs) <= 0) {
        fired = true;
        void startRound(liveRoomId)
          .then(() => refreshLiveRoom())
          .catch(() => {
            fired = false;
          });
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [hostSnap, liveRoomId, mode, skewMs, step, refreshLiveRoom]);

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
        setActivePromptId(null);

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

  // Reset the console back to the hub and clear the live room. Used by both the
  // ended-card home button and a successful hard delete.
  const returnToHub = useCallback(() => {
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
    setHighlightMode('grid');
    setHighlightTarget(null);
    setClosing(false);
    setActivePromptId(null);
  }, [roomCode, refreshActiveRooms]);

  // Hard delete (cascade) from any live phase. Real rooms delete server-side and
  // land on the hub; mock/demo keeps the local "session ended" card.
  const handleEndRoom = useCallback(async () => {
    setRoomActionError(null);
    if (liveRoomId && !isHostAuthMockMode()) {
      try {
        await endRoom(liveRoomId);
      } catch (error) {
        setRoomActionError(messageOf(error));
        return;
      }
      returnToHub();
      return;
    }
    setStep('ended');
  }, [liveRoomId, returnToHub]);

  // Rewind one SERVER phase (reveal folds into the wrap-up step, so one call is
  // one phase back regardless of the visible step). Mirrors advanceRoomPhase.
  const rewindRoomPhase = useCallback(async () => {
    setRoomActionError(null);
    if (!liveRoomId || isHostAuthMockMode()) {
      const order: Step[] = ['lobby', 'briefing', 'writing', 'wrapup'];
      const i = order.indexOf(step);
      const target = i > 0 ? order[i - 1] : step;
      setStep(target);
      if (target !== 'wrapup') setRevealTriggered(false);
      return;
    }

    try {
      const next = await rewindPhase(liveRoomId);
      setMode(toWritingMode(next.mode));
      setRounds(next.round_count ?? rounds);
      setMinutes(Math.max(1, Math.round(next.round_seconds / 60)));
      setStep(roomPhaseToStep[next.phase]);
      if (roomPhaseToStep[next.phase] !== 'wrapup') setRevealTriggered(false);
      void refreshLiveRoom().catch(() => {
        /* background snapshot refresh only */
      });
    } catch (error) {
      setRoomActionError(messageOf(error));
    }
  }, [liveRoomId, refreshLiveRoom, rounds, step]);

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

  // Pause/resume the players' round timer. update_settings freezes/unfreezes
  // round_started_at server-side; optimistic locally, reverted on failure.
  const handleTogglePause = useCallback(() => {
    const next = !paused;
    setPaused(next);
    if (liveRoomId && !isHostAuthMockMode()) {
      void updateSettings(liveRoomId, {timer_paused: next})
        .then(() => refreshLiveRoom())
        .catch((error) => {
          setPaused(!next);
          setRoomActionError(messageOf(error));
        });
    }
  }, [paused, liveRoomId, refreshLiveRoom]);

  // Advance the round manually: open the server 10s grace window (start_round).
  // The grace effect below then fires finalize_round when the window elapses,
  // which bumps the round and reassigns targets. Guarded so it can't stack while
  // grace is already running or the timer is paused. Mock/demo keeps a cosmetic
  // grace flash since there is no live room to drive.
  const advanceRound = useCallback(async () => {
    setRoomActionError(null);
    if (!liveRoomId || isHostAuthMockMode()) {
      setGraceRunning(true);
      window.setTimeout(() => setGraceRunning(false), 3000);
      return;
    }
    if (graceRunning || paused) return;
    try {
      await startRound(liveRoomId);
      await refreshLiveRoom();
    } catch (error) {
      setRoomActionError(messageOf(error));
    }
  }, [liveRoomId, graceRunning, paused, refreshLiveRoom]);

  // Session settings: round count is only editable before writing (server-locked
  // afterward); duration is editable anytime; add_round lengthens a live game.
  const handleSetRoundCount = useCallback(
    (n: number) => {
      setRounds(n);
      if (liveRoomId && !isHostAuthMockMode()) {
        void updateSettings(liveRoomId, {round_count: n})
          .then(() => refreshLiveRoom())
          .catch((error) => setRoomActionError(messageOf(error)));
      }
    },
    [liveRoomId, refreshLiveRoom],
  );

  const handleSetRoundMinutes = useCallback(
    (mins: number) => {
      setMinutes(mins);
      if (liveRoomId && !isHostAuthMockMode()) {
        void updateSettings(liveRoomId, {round_seconds: mins * 60})
          .then(() => refreshLiveRoom())
          .catch((error) => setRoomActionError(messageOf(error)));
      }
    },
    [liveRoomId, refreshLiveRoom],
  );

  const handleAddRound = useCallback(() => {
    if (liveRoomId && !isHostAuthMockMode()) {
      void addRound(liveRoomId)
        .then(() => refreshLiveRoom())
        .catch((error) => setRoomActionError(messageOf(error)));
    } else {
      setRounds((v) => v + 1);
    }
  }, [liveRoomId, refreshLiveRoom]);

  const handleSignOut = async () => {
    await signOutHost();
    setHostSession(null);
    setLiveRoomId(null);
    setRoomActionError(null);
    setStep('hub');
  };

  // Open a session from the hub list. Resolves the room by code (the list only
  // stores the code), loads its live snapshot, and jumps to the current phase.
  const handleReopenRoom = useCallback(
    async (code: string) => {
      setRoomActionError(null);
      const upper = code.trim().toUpperCase();

      const applyBriefingOverlay = () => {
        const screenState = readScreenState(upper);
        if (typeof screenState?.briefingIndex === 'number') {
          setBriefingIndex(screenState.briefingIndex);
        }
      };

      if (isHostAuthMockMode()) {
        const stored = listActiveRooms().find((r) => r.code === upper);
        if (!stored) return;
        setRoomCode(upper);
        applyBriefingOverlay();
        setStep(roomPhaseToStep[stored.phase] ?? 'lobby');
        return;
      }

      try {
        const joined = await joinRoom(upper);
        if (!joined.found) {
          // The room is gone (ended or swept): drop it from the list.
          removeActiveRoom(upper);
          refreshActiveRooms();
          return;
        }
        const snapshot = await getSnapshot(joined.room_id);
        setLiveRoomId(joined.room_id);
        setRoomCode(snapshot.code);
        setMode(toWritingMode(snapshot.mode));
        setRounds(snapshot.round_count ?? rounds);
        setMinutes(Math.max(1, Math.round(snapshot.round_seconds / 60)));
        setRosterNames(snapshot.roster.map((entry) => entry.display_name));
        setHostRoster(hostRosterFromPublic(snapshot.roster));
        setSkewMs(new Date(snapshot.server_now).getTime() - Date.now());
        if (snapshot.role === 'host') setHostSnap(snapshot);
        setRevealTriggered(snapshot.phase === 'reveal');
        applyBriefingOverlay();
        setStep(roomPhaseToStep[snapshot.phase]);
      } catch (error) {
        setRoomActionError(messageOf(error));
      }
    },
    [refreshActiveRooms, rounds],
  );

  // Hard-delete a session straight from the hub list. Resolves the room_id by
  // code, then end_room (cascade). Removes it from the list either way.
  const handleDeleteSession = useCallback(
    async (code: string) => {
      setRoomActionError(null);
      const upper = code.trim().toUpperCase();
      if (isHostAuthMockMode()) {
        removeActiveRoom(upper);
        refreshActiveRooms();
        return;
      }
      try {
        const joined = await joinRoom(upper);
        if (joined.found) await endRoom(joined.room_id);
        removeActiveRoom(upper);
        refreshActiveRooms();
        if (upper === roomCode) setLiveRoomId(null);
      } catch (error) {
        setRoomActionError(messageOf(error));
      }
    },
    [refreshActiveRooms, roomCode],
  );

  // Lobby roster edits. Live rooms go through the host-only RPCs (roster ping
  // reconciles); mock/demo edits the local roster in place.
  const handleRenameParticipant = useCallback(
    async (id: string, name: string) => {
      setRoomActionError(null);
      if (!liveRoomId || isHostAuthMockMode()) {
        setHostRoster((prev) => prev.map((r) => (r.id === id ? {...r, name} : r)));
        return;
      }
      try {
        await renameParticipant(liveRoomId, id, name);
        await refreshLiveRoom();
      } catch (error) {
        setRoomActionError(messageOf(error));
      }
    },
    [liveRoomId, refreshLiveRoom],
  );

  // Room-level music on/off. Optimistic locally, persisted via update_settings
  // for live rooms (the big screen obeys musicOn from the snapshot / screen state).
  const toggleMusic = useCallback(() => {
    const next = !musicOn;
    setMusicOn(next);
    if (liveRoomId && !isHostAuthMockMode()) {
      void updateSettings(liveRoomId, {music_on: next}).catch(() => setMusicOn(!next));
    }
  }, [musicOn, liveRoomId]);

  // Briefing frame, opt-in highlights, and the pushed wrap-up prompt are display-
  // only room fields. Update local state for instant feedback (and the mock/
  // localStorage preview), then persist for live rooms so the big screen and any
  // other device converge via the room broadcast + get_bigscreen_state.
  const handleBriefingIndexChange = useCallback(
    (i: number) => {
      setBriefingIndex(i);
      if (liveRoomId && !isHostAuthMockMode()) {
        void updateSettings(liveRoomId, {briefing_index: i}).catch((error) =>
          setRoomActionError(messageOf(error)),
        );
      }
    },
    [liveRoomId],
  );

  const handleHighlightToggle = useCallback(
    (enabled: boolean) => {
      setHighlightEnabled(enabled);
      if (liveRoomId && !isHostAuthMockMode()) {
        void updateSettings(liveRoomId, {highlight_enabled: enabled}).catch((error) =>
          setRoomActionError(messageOf(error)),
        );
      }
    },
    [liveRoomId],
  );

  // Persist the live prompt text to the room so a separate-device projector
  // updates over realtime; same-machine updates ride the localStorage sync.
  const pushActivePromptText = useCallback(
    (text: string | null) => {
      if (liveRoomId && !isHostAuthMockMode()) {
        void updateSettings(liveRoomId, {active_prompt: text}).catch((error) =>
          setRoomActionError(messageOf(error)),
        );
      }
    },
    [liveRoomId],
  );

  const handlePromptPush = useCallback(
    (item: PromptItem | null) => {
      setActivePromptId(item?.id ?? null);
      pushActivePromptText(item?.text ?? null);
    },
    [pushActivePromptText],
  );

  const handlePromptAdd = useCallback(() => {
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setPrompts((prev) => [...prev, {id, text: ''}]);
  }, []);

  const handlePromptEdit = useCallback(
    (id: string, text: string) => {
      setPrompts((prev) => prev.map((p) => (p.id === id ? {...p, text} : p)));
      // Editing the currently live prompt should update the projector too.
      if (activePromptId === id) pushActivePromptText(text);
    },
    [activePromptId, pushActivePromptText],
  );

  const handlePromptRemove = useCallback(
    (id: string) => {
      setPrompts((prev) => prev.filter((p) => p.id !== id));
      if (activePromptId === id) {
        setActivePromptId(null);
        pushActivePromptText(null);
      }
    },
    [activePromptId, pushActivePromptText],
  );

  const handleToggleClosing = useCallback(() => {
    setClosing((prev) => {
      const next = !prev;
      if (liveRoomId && !isHostAuthMockMode()) {
        void updateSettings(liveRoomId, {closing: next}).catch((error) =>
          setRoomActionError(messageOf(error)),
        );
      }
      return next;
    });
  }, [liveRoomId]);

  const handleHighlightMode = useCallback(
    (mode: HighlightMode) => {
      setHighlightMode(mode);
      if (liveRoomId && !isHostAuthMockMode()) {
        void updateSettings(liveRoomId, {highlight_mode: mode}).catch((error) =>
          setRoomActionError(messageOf(error)),
        );
      }
    },
    [liveRoomId],
  );

  const handleHighlightTarget = useCallback(
    (name: string | null) => {
      setHighlightTarget(name);
      if (liveRoomId && !isHostAuthMockMode()) {
        void updateSettings(liveRoomId, {highlight_target: name}).catch((error) =>
          setRoomActionError(messageOf(error)),
        );
      }
    },
    [liveRoomId],
  );

  const handleRemoveParticipant = useCallback(
    async (id: string) => {
      setRoomActionError(null);
      if (!liveRoomId || isHostAuthMockMode()) {
        setHostRoster((prev) => prev.filter((r) => r.id !== id));
        return;
      }
      try {
        await removeParticipant(liveRoomId, id);
        await refreshLiveRoom();
      } catch (error) {
        setRoomActionError(messageOf(error));
      }
    },
    [liveRoomId, refreshLiveRoom],
  );

  const hubShell = useMemo(
    () => (
      <ConsoleShell variant='hub' onSignOut={() => void handleSignOut()}>
        <ConsoleHubScreen
          email={hostSession?.email ?? ''}
          activeRooms={activeRooms}
          onStartGame={() => setStep('create')}
          onReopenRoom={(code) => void handleReopenRoom(code)}
          onDeleteSession={(code) => void handleDeleteSession(code)}
        />
      </ConsoleShell>
    ),
    [activeRooms, hostSession?.email, handleReopenRoom, handleDeleteSession],
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
            onClick={returnToHub}
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
  // On or past the final round there is no round to advance into; the host moves
  // on with "Advance to reveal" instead.
  const roundsComplete =
    !!hostSnap &&
    hostSnap.round_count != null &&
    hostSnap.current_round >= hostSnap.round_count;
  const stillWriting = hostSnap
    ? mode === 'roundRobin'
      ? hostSnap.coverage.filter((c) => c.claimed && c.submitted_this_round === false).length
      : hostSnap.coverage.filter((c) => c.claimed && c.live_count < REVEAL_FLOOR).length
    : MOCK_ROUND_PROGRESS.filter((p) => p.state !== 'submitted').length;
  // Wrap-up now runs on live signals: reveal state per player and each note's
  // opt-in flag (from the moderation feed). Mock/demo falls back to scripts.
  const revealStatuses = hostSnap
    ? revealStatusesFromSnapshot(hostSnap)
    : MOCK_REVEAL_STATUS;
  const optedInCount = notes.filter((n) => n.shared).length;
  const wallsOpened = revealStatuses.filter((s) => s.status !== 'locked').length;

  // The one primary action per phase lives in the shell's sticky action bar, so
  // it is always on screen instead of appended below the fold.
  const advanceButton = (label: string, onClick: () => void) => (
    <components.Button
      label={`${label}  →`}
      onClick={onClick}
      colorScheme='primary'
      containerStyle={{maxWidth: 320, width: '100%'}}
      style={{textTransform: 'none'}}
    />
  );

  const shareJoinLink = async () => {
    const text = t('host.hub.session.shareText', {code: roomCode});
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({title: t('app.name'), text, url: joinUrl});
        return;
      } catch {
        /* dismissed: fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  };

  // Lobby's action bar carries the join details on the left (the QR players scan
  // is on the big-screen preview to the right), with Start briefing on the right.
  const lobbyAction = (
    <div
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', minWidth: 0}}>
        <JoinQR value={joinUrl} size={76}>
          <button
            type='button'
            className='clickable'
            style={rowActionSecondary}
            onClick={() => void shareJoinLink()}
          >
            <HostIcon name='share' />
            {copiedLink ? t('host.hub.session.copied') : t('host.hub.session.share')}
          </button>
        </JoinQR>
        <div style={{display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0}}>
          <span style={{...codeText, fontSize: 26}}>{roomCode}</span>
          <span className='t13' style={{color: 'var(--text-color)', wordBreak: 'break-all'}}>
            {joinUrl}
          </span>
        </div>
      </div>
      {advanceButton(t('host.lobby.start'), () => {
        setBriefingIndex(0);
        void advanceRoomPhase('briefing');
      })}
    </div>
  );

  const primaryAction =
    step === 'lobby'
      ? lobbyAction
      : step === 'briefing'
        ? (
            <div
              style={{width: '100%', display: 'flex', justifyContent: 'flex-end'}}
            >
              {advanceButton(t('host.briefing.advance'), () =>
                void advanceRoomPhase('writing'),
              )}
            </div>
          )
        : step === 'writing'
          ? (
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--main-color)',
                    fontFamily: 'var(--font-dosis), var(--font-noto-sc), sans-serif',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  <span
                    aria-hidden='true'
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      flexShrink: 0,
                      backgroundColor:
                        stillWriting > 0
                          ? 'var(--accent-color)'
                          : 'rgba(30, 37, 56, 0.25)',
                    }}
                  />
                  {t('host.game.activity', {count: stillWriting})}
                </span>
                {advanceButton(t('host.game.advanceReveal'), () =>
                  void advanceRoomPhase('wrapup'),
                )}
              </div>
            )
          : undefined;

  return (
    <ConsoleShell
      code={roomCode}
      phase={phase}
      playerCount={playerCount}
      noteCount={notes.length}
      previewWidth={previewWidth}
      primaryAction={primaryAction}
      fillBody={step === 'writing' || step === 'wrapup'}
      onHome={() => setStep('hub')}
      onSignOut={() => void handleSignOut()}
      onEndRoom={() => void handleEndRoom()}
      onRewind={step === 'lobby' ? undefined : () => void rewindRoomPhase()}
      musicOn={musicOn}
      onToggleMusic={toggleMusic}
      sessionSettings={{
        mode,
        rounds,
        minutes,
        roundCountEditable: step === 'lobby' || step === 'briefing',
        canAddRound: mode === 'roundRobin' && step === 'writing',
        onRoundsChange: handleSetRoundCount,
        onMinutesChange: handleSetRoundMinutes,
        onAddRound: handleAddRound,
      }}
      rightPanel={
        step === 'wrapup' ? (
          <div style={{display: 'flex', flexDirection: 'column', gap: 20}}>
            <ProjectorPreviewPanel
              state={presenterState}
              onOpenBigScreen={() => openBigScreen(roomCode)}
            />
            <SessionSummaryCard
              playersCount={playerCount}
              notesWritten={notes.length}
              optedInCount={optedInCount}
              opened={wallsOpened}
              showOpened={revealTriggered}
            />
          </div>
        ) : (
          <ProjectorPreviewPanel
            state={presenterState}
            onOpenBigScreen={() => openBigScreen(roomCode)}
          />
        )
      }
    >
      {step === 'lobby' && (
        <LobbyContent
          roster={hostRoster}
          onRename={(id, name) => void handleRenameParticipant(id, name)}
          onRemove={(id) => void handleRemoveParticipant(id)}
        />
      )}

      {step === 'briefing' && (
        <BriefingContent
          briefingIndex={briefingIndex}
          mode={toScreenMode(mode)}
          onBriefingIndexChange={handleBriefingIndexChange}
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
          roundsComplete={roundsComplete}
          coverage={liveCoverage}
          roundProgress={liveRoundProgress}
          notes={notes}
          onTogglePause={handleTogglePause}
          onAdvance={() => void advanceRound()}
          onRemoveNote={removeNote}
        />
      )}

      {step === 'wrapup' && (
        <WrapUpContent
          mode={mode}
          coverage={liveCoverage}
          revealStatus={revealStatuses}
          optedInCount={optedInCount}
          notes={notes}
          revealTriggered={revealTriggered}
          onTriggerReveal={() => setRevealTriggered(true)}
          onRemoveNote={removeNote}
          onHighlightToggle={handleHighlightToggle}
          highlightEnabled={highlightEnabled}
          highlightMode={highlightMode}
          highlightTarget={highlightTarget}
          onHighlightMode={handleHighlightMode}
          onHighlightTarget={handleHighlightTarget}
          prompts={prompts}
          activePromptId={activePromptId}
          onPromptPush={handlePromptPush}
          onPromptAdd={handlePromptAdd}
          onPromptEdit={handlePromptEdit}
          onPromptRemove={handlePromptRemove}
          closing={closing}
          onToggleClosing={handleToggleClosing}
        />
      )}

      <Toast
        message={roomActionError ?? t('host.reclaim.toast')}
        visible={Boolean(roomActionError) || showReconnect}
      />
    </ConsoleShell>
  );
};
