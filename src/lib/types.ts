// Hand-written types tracking supabase/migrations. Kept close to the SQL:
// enums mirror the create type statements, shapes mirror each RPC return.

export type RoomMode = 'round_robin' | 'free_select';
export type RoomPhase = 'lobby' | 'briefing' | 'writing' | 'reveal' | 'wrapup';
export type NoteFrame = 'moment' | 'strength' | 'wish';
export type RevealState = 'locked' | 'holding' | 'reading' | 'done';

// kindsight_room_public: the public subset present in every snapshot-like return.
export type RoomPublic = {
  room_id: string;
  code: string;
  mode: RoomMode;
  phase: RoomPhase;
  current_round: number;
  round_count: number | null;
  round_seconds: number;
  round_started_at: string | null;
  timer_paused_at: string | null;
  grace_until: string | null;
  highlight_enabled: boolean;
  music_mood: string | null;
  music_on: boolean;
  seq: number;
  expires_at: string;
};

export type RosterEntry = {
  participant_id: string;
  display_name: string;
  claimed: boolean;
};

export type CreateRoomResult = RoomPublic & {
  host_secret: string;
  roster: RosterEntry[];
  server_now: string;
};

export type JoinRoomResult =
  | {found: false; server_now: string}
  | (RoomPublic & {found: true; roster: RosterEntry[]; server_now: string});

export type ClaimNameResult = {
  participant_id: string;
  display_name: string;
  joined_round: number | null;
  server_now: string;
};

// get_snapshot is role-tagged. The player branch carries a `me` block,
// the host branch carries coverage, the joiner branch carries neither.
export type SnapshotMe = {
  participant_id: string;
  display_name: string;
  joined_round: number | null;
  reveal_state: RevealState;
  wall_count: number;
  sent: Array<{
    target_id: string;
    frame: NoteFrame;
    is_bonus: boolean;
    round: number | null;
  }>;
  assignment: {target_id: string; display_name: string} | null;
};

export type HostCoverageEntry = {
  participant_id: string;
  display_name: string;
  claimed: boolean;
  joined_round: number | null;
  reveal_state: RevealState;
  live_count: number;
  submitted_this_round: boolean | null;
};

export type SnapshotBase = RoomPublic & {
  roster: RosterEntry[];
  server_now: string;
};

export type PlayerSnapshot = SnapshotBase & {role: 'player'; me: SnapshotMe};
export type HostSnapshot = SnapshotBase & {
  role: 'host';
  notes_author_cap: number;
  assignments_ready: boolean;
  coverage: HostCoverageEntry[];
};
export type JoinerSnapshot = SnapshotBase & {role: 'joiner'};
export type Snapshot = PlayerSnapshot | HostSnapshot | JoinerSnapshot;

// Returns carrying only the public subset plus server_now.
export type RoomStateResult = RoomPublic & {server_now: string};

export type ReclaimHostResult =
  | {ok: false; server_now: string}
  | (RoomPublic & {ok: true; server_now: string});

export type SubmitNoteResult = {note_id: string; server_now: string};

export type TargetNote = {frame: NoteFrame; content: string};

export type MyWallNote = {
  note_id: string;
  frame: NoteFrame;
  content: string;
  shared_to_wall: boolean;
  created_at: string;
};

export type ModerationNote = {
  note_id: string;
  target_name: string;
  frame: NoteFrame;
  content: string;
  is_bonus: boolean;
  killed: boolean;
  created_at: string;
};

export type MyAssignment = {target_id: string; display_name: string};

export type BigscreenState =
  | {found: false; server_now: string}
  | (RoomPublic & {
      found: true;
      server_now: string;
      roster: RosterEntry[];
      counts: {roster: number; claimed: number; notes: number};
      highlight: Array<{content: string; frame: NoteFrame; recipient: string}>;
    });
