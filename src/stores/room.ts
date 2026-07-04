import {create} from 'zustand';
import {ensureSession} from '@/lib/supabase/auth';
import {
  joinRoom,
  getSnapshot,
  claimName,
  submitNote as submitNoteRpc,
  getTargetNotes,
  getMyWall,
  setNoteShared as setNoteSharedRpc,
  setRevealState as setRevealStateRpc,
  ApiError,
} from '@/lib/api';
import {subscribeToRoom, type ConnectionStatus, type RoomSubscription} from '@/lib/realtime';
import type {
  Snapshot,
  RosterEntry,
  SnapshotMe,
  HostCoverageEntry,
  RoomPhase,
  RoomMode,
  NoteFrame,
  TargetNote,
  MyWallNote,
  RevealState,
} from '@/lib/types';

// Persist the room code so a refresh on any surface restores state (M3 exit
// clause). The anon session itself is persisted by the supabase client, so
// get_snapshot re-derives the player identity; the code is all we need to keep.
const CODE_STORAGE_KEY = 'kindsight.roomCode';

function persistCode(code: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (code) window.localStorage.setItem(CODE_STORAGE_KEY, code);
    else window.localStorage.removeItem(CODE_STORAGE_KEY);
  } catch {
    /* private mode / storage unavailable: refresh-restore degrades, nothing breaks */
  }
}

function readStoredCode(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(CODE_STORAGE_KEY);
  } catch {
    return null;
  }
}

// Server-time offset (D22): serverNow - clientNow at snapshot time, in ms.
// Render every timer as server-anchored: serverNowEstimate = Date.now() + skewMs.
function computeSkewMs(serverNow: string): number {
  return new Date(serverNow).getTime() - Date.now();
}

export type JoinFailure = 'not_found' | 'rate_limited' | 'generic';

export type ClaimOutcome =
  | {ok: true}
  | {ok: false; reason: 'taken' | 'closed' | 'not_found' | 'error'; message: string};

export type SubmitReason =
  | 'cap'
  | 'spacing'
  | 'duplicate'
  | 'not_target'
  | 'round_done'
  | 'self'
  | 'not_started'
  | 'closed'
  | 'error';

export type SubmitOutcome = {ok: true} | {ok: false; reason: SubmitReason; message: string};

type RoomState = {
  uid: string | null;
  roomId: string | null;
  code: string | null;
  role: 'host' | 'player' | 'joiner' | null;

  phase: RoomPhase | null;
  mode: RoomMode | null;
  currentRound: number;
  roundCount: number | null;
  roundSeconds: number;
  roundStartedAt: string | null;
  timerPausedAt: string | null;
  graceUntil: string | null;
  seq: number;
  clockSkewMs: number;

  roster: RosterEntry[];
  me: SnapshotMe | null;
  coverage: HostCoverageEntry[] | null;

  snapshot: Snapshot | null;
  connection: ConnectionStatus;

  // Player-flow lifecycle
  hydrating: boolean;
  joinFailure: JoinFailure | null;
  ended: boolean;
  error: string | null;

  // Reveal wall (fetched on demand behind the reveal gate)
  wall: MyWallNote[] | null;

  bootstrap: (code: string) => Promise<void>;
  restore: () => Promise<boolean>;
  refresh: () => Promise<void>;
  claim: (participantId: string) => Promise<ClaimOutcome>;
  submitNote: (input: {
    targetId: string;
    frame: NoteFrame;
    content: string;
    isBonus?: boolean;
  }) => Promise<SubmitOutcome>;
  loadTargetNotes: (targetId: string) => Promise<TargetNote[]>;
  loadWall: () => Promise<MyWallNote[]>;
  setNoteShared: (noteId: string, shared: boolean) => Promise<void>;
  setReveal: (state: RevealState) => Promise<void>;
  reset: () => void;
  teardown: () => void;
};

let subscription: RoomSubscription | null = null;

function applySnapshot(snapshot: Snapshot): Partial<RoomState> {
  return {
    snapshot,
    roomId: snapshot.room_id,
    code: snapshot.code,
    role: snapshot.role,
    phase: snapshot.phase,
    mode: snapshot.mode,
    currentRound: snapshot.current_round,
    roundCount: snapshot.round_count,
    roundSeconds: snapshot.round_seconds,
    roundStartedAt: snapshot.round_started_at,
    timerPausedAt: snapshot.timer_paused_at,
    graceUntil: snapshot.grace_until,
    seq: snapshot.seq,
    clockSkewMs: computeSkewMs(snapshot.server_now),
    roster: snapshot.roster,
    me: snapshot.role === 'player' ? snapshot.me : null,
    coverage: snapshot.role === 'host' ? snapshot.coverage : null,
  };
}

function messageOf(e: unknown): string {
  if (e instanceof ApiError) {
    // ApiError message is prefixed "fn: raw"; the raw text carries the match.
    return e.message;
  }
  return e instanceof Error ? e.message : String(e);
}

function joinFailureOf(msg: string): JoinFailure {
  if (msg.includes('too many attempts')) return 'rate_limited';
  return 'generic';
}

function claimReasonOf(msg: string): ClaimOutcome & {ok: false} {
  if (msg.includes('already claimed') || msg.includes('you already claimed')) {
    return {ok: false, reason: 'taken', message: msg};
  }
  if (msg.includes('joining is closed')) {
    return {ok: false, reason: 'closed', message: msg};
  }
  if (msg.includes('not found')) {
    return {ok: false, reason: 'not_found', message: msg};
  }
  return {ok: false, reason: 'error', message: msg};
}

function submitReasonOf(msg: string): SubmitReason {
  if (msg.includes('note cap reached')) return 'cap';
  if (msg.includes('arriving too fast')) return 'spacing';
  if (msg.includes('duplicate note')) return 'duplicate';
  if (msg.includes('already submitted')) return 'round_done';
  if (msg.includes('assigned target')) return 'not_target';
  if (msg.includes('yourself')) return 'self';
  if (msg.includes('has not started')) return 'not_started';
  if (msg.includes('writing phase')) return 'closed';
  return 'error';
}

export const useRoomStore = create<RoomState>((set, get) => ({
  uid: null,
  roomId: null,
  code: null,
  role: null,

  phase: null,
  mode: null,
  currentRound: 0,
  roundCount: null,
  roundSeconds: 180,
  roundStartedAt: null,
  timerPausedAt: null,
  graceUntil: null,
  seq: 0,
  clockSkewMs: 0,

  roster: [],
  me: null,
  coverage: null,

  snapshot: null,
  connection: 'closed',

  hydrating: false,
  joinFailure: null,
  ended: false,
  error: null,

  wall: null,

  bootstrap: async (rawCode: string) => {
    const code = rawCode.trim().toUpperCase();
    set({hydrating: true, joinFailure: null, ended: false, error: null});
    try {
      const uid = await ensureSession();
      set({uid});

      const joined = await joinRoom(code);
      if (!joined.found) {
        set({hydrating: false, joinFailure: 'not_found'});
        return;
      }
      const roomId = joined.room_id;

      const snapshot = await getSnapshot(roomId);
      set({...applySnapshot(snapshot), hydrating: false});
      persistCode(code);

      subscription?.unsubscribe();
      subscription = subscribeToRoom(
        roomId,
        (event) => {
          if (event === 'room_ended') {
            subscription?.unsubscribe();
            subscription = null;
            persistCode(null);
            set({ended: true, connection: 'closed'});
            return;
          }
          void get().refresh();
        },
        (status) => set({connection: status})
      );
    } catch (e) {
      const msg = messageOf(e);
      set({hydrating: false, joinFailure: joinFailureOf(msg), error: msg});
    }
  },

  restore: async () => {
    const stored = readStoredCode();
    if (!stored) return false;
    await get().bootstrap(stored);
    return true;
  },

  refresh: async () => {
    const roomId = get().roomId;
    if (!roomId) return;
    try {
      const snapshot = await getSnapshot(roomId);
      set(applySnapshot(snapshot));
    } catch (e) {
      const msg = messageOf(e);
      // A room that vanished mid-session (host end-and-delete, TTL sweep) reads
      // as "room not found": treat it as an end rather than a transient error.
      if (msg.includes('room not found')) {
        set({ended: true});
      } else {
        set({error: msg});
      }
    }
  },

  claim: async (participantId: string) => {
    try {
      await ensureSession();
      await claimName(participantId);
      await get().refresh();
      return {ok: true};
    } catch (e) {
      // A lost claim race still needs a fresh roster so the taken name greys out.
      void get().refresh();
      return claimReasonOf(messageOf(e));
    }
  },

  submitNote: async (input) => {
    const roomId = get().roomId;
    if (!roomId) return {ok: false, reason: 'error', message: 'No room'};
    try {
      await submitNoteRpc({
        p_room_id: roomId,
        p_target_id: input.targetId,
        p_frame: input.frame,
        p_content: input.content,
        p_is_bonus: input.isBonus ?? false,
      });
      await get().refresh();
      return {ok: true};
    } catch (e) {
      const msg = messageOf(e);
      return {ok: false, reason: submitReasonOf(msg), message: msg};
    }
  },

  loadTargetNotes: async (targetId: string) => {
    const roomId = get().roomId;
    if (!roomId) return [];
    return getTargetNotes(roomId, targetId);
  },

  loadWall: async () => {
    const roomId = get().roomId;
    if (!roomId) return [];
    const wall = await getMyWall(roomId);
    set({wall});
    return wall;
  },

  setNoteShared: async (noteId: string, shared: boolean) => {
    await setNoteSharedRpc(noteId, shared);
    // Optimistic local flip so the wall toggle feels instant; the notes ping
    // will reconcile via loadWall if anything drifted.
    const wall = get().wall;
    if (wall) {
      set({wall: wall.map((n) => (n.note_id === noteId ? {...n, shared_to_wall: shared} : n))});
    }
  },

  setReveal: async (state: RevealState) => {
    const roomId = get().roomId;
    if (!roomId) return;
    try {
      await setRevealStateRpc(roomId, state);
    } catch {
      /* reveal-state is best-effort telemetry for the host list; never block the ritual */
    }
  },

  reset: () => {
    persistCode(null);
    get().teardown();
  },

  teardown: () => {
    subscription?.unsubscribe();
    subscription = null;
    set({
      roomId: null,
      code: null,
      role: null,
      phase: null,
      mode: null,
      currentRound: 0,
      roundCount: null,
      roundStartedAt: null,
      timerPausedAt: null,
      graceUntil: null,
      seq: 0,
      roster: [],
      me: null,
      coverage: null,
      snapshot: null,
      connection: 'closed',
      hydrating: false,
      joinFailure: null,
      wall: null,
    });
  },
}));
