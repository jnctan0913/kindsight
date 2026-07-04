import {create} from 'zustand';
import {ensureSession} from '@/lib/supabase/auth';
import {joinRoom, getSnapshot} from '@/lib/api';
import {subscribeToRoom, type ConnectionStatus, type RoomSubscription} from '@/lib/realtime';
import type {
  Snapshot,
  RosterEntry,
  SnapshotMe,
  HostCoverageEntry,
  RoomPhase,
  RoomMode,
} from '@/lib/types';

// Server-time offset (D22): serverNow - clientNow at snapshot time, in ms.
// Render every timer as server-anchored: serverNowEstimate = Date.now() + skewMs.
function computeSkewMs(serverNow: string): number {
  return new Date(serverNow).getTime() - Date.now();
}

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
  error: string | null;

  bootstrap: (code: string) => Promise<void>;
  refresh: () => Promise<void>;
  teardown: () => void;
};

let subscription: RoomSubscription | null = null;

function applySnapshot(snapshot: Snapshot): Partial<RoomState> {
  const base: Partial<RoomState> = {
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
  return base;
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
  error: null,

  bootstrap: async (code: string) => {
    set({error: null});
    try {
      const uid = await ensureSession();
      set({uid});

      const joined = await joinRoom(code);
      if (!joined.found) {
        set({error: 'Room not found'});
        return;
      }
      const roomId = joined.room_id;

      const snapshot = await getSnapshot(roomId);
      set(applySnapshot(snapshot));

      subscription?.unsubscribe();
      subscription = subscribeToRoom(
        roomId,
        (event) => {
          if (event === 'room_ended') {
            get().teardown();
            return;
          }
          void get().refresh();
        },
        (status) => set({connection: status})
      );
    } catch (e) {
      set({error: e instanceof Error ? e.message : 'Failed to join room'});
    }
  },

  refresh: async () => {
    const roomId = get().roomId;
    if (!roomId) return;
    try {
      const snapshot = await getSnapshot(roomId);
      set(applySnapshot(snapshot));
    } catch (e) {
      set({error: e instanceof Error ? e.message : 'Failed to refresh'});
    }
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
    });
  },
}));
