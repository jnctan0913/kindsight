import {getSupabase} from './supabase/client';
import type {
  RoomMode,
  NoteFrame,
  RevealState,
  CreateRoomResult,
  JoinRoomResult,
  ClaimNameResult,
  Snapshot,
  RoomStateResult,
  ReclaimHostResult,
  SubmitNoteResult,
  TargetNote,
  MyWallNote,
  ModerationNote,
  MyAssignment,
  BigscreenState,
} from './types';

export class ApiError extends Error {
  code?: string;
  details?: string;
  hint?: string;
  constructor(fn: string, message: string, meta?: {code?: string; details?: string; hint?: string}) {
    super(`${fn}: ${message}`);
    this.name = 'ApiError';
    this.code = meta?.code;
    this.details = meta?.details;
    this.hint = meta?.hint;
  }
}

async function rpc<T>(fn: string, params?: Record<string, unknown>): Promise<T> {
  const supabase = getSupabase();
  const {data, error} = await supabase.rpc(fn, params ?? {});
  if (error) {
    throw new ApiError(fn, error.message, {
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
  }
  return data as T;
}

// --- Room lifecycle ---

export function createRoom(params: {
  p_mode: RoomMode;
  p_names?: string[];
  p_round_count?: number | null;
  p_round_seconds?: number;
}): Promise<CreateRoomResult> {
  return rpc('create_room', params);
}

export function joinRoom(p_code: string): Promise<JoinRoomResult> {
  return rpc('join_room', {p_code});
}

export function claimName(p_participant_id: string): Promise<ClaimNameResult> {
  return rpc('claim_name', {p_participant_id});
}

export function getSnapshot(p_room_id: string): Promise<Snapshot> {
  return rpc('get_snapshot', {p_room_id});
}

// --- Phase and round engine ---

export function advancePhase(p_room_id: string): Promise<RoomStateResult> {
  return rpc('advance_phase', {p_room_id});
}

export function rewindPhase(p_room_id: string): Promise<RoomStateResult> {
  return rpc('rewind_phase', {p_room_id});
}

export function startRound(p_room_id: string): Promise<RoomStateResult> {
  return rpc('start_round', {p_room_id});
}

export function finalizeRound(p_room_id: string): Promise<RoomStateResult> {
  return rpc('finalize_round', {p_room_id});
}

export function addRound(p_room_id: string): Promise<RoomStateResult> {
  return rpc('add_round', {p_room_id});
}

export function updateSettings(
  p_room_id: string,
  p_patch: Record<string, unknown>
): Promise<RoomStateResult> {
  return rpc('update_settings', {p_room_id, p_patch});
}

export function reclaimHost(p_code: string, p_secret: string): Promise<ReclaimHostResult> {
  return rpc('reclaim_host', {p_code, p_secret});
}

export function endRoom(p_room_id: string): Promise<void> {
  return rpc('end_room', {p_room_id});
}

// --- Notes ---

export function submitNote(params: {
  p_room_id: string;
  p_target_id: string;
  p_frame: NoteFrame;
  p_content: string;
  p_is_bonus?: boolean;
}): Promise<SubmitNoteResult> {
  return rpc('submit_note', params);
}

export function getTargetNotes(p_room_id: string, p_target_id: string): Promise<TargetNote[]> {
  return rpc('get_target_notes', {p_room_id, p_target_id});
}

export function getMyWall(p_room_id: string): Promise<MyWallNote[]> {
  return rpc('get_my_wall', {p_room_id});
}

export function getMyWallCount(p_room_id: string): Promise<number> {
  return rpc('get_my_wall_count', {p_room_id});
}

export function setNoteShared(p_note_id: string, p_shared: boolean): Promise<void> {
  return rpc('set_note_shared', {p_note_id, p_shared});
}

export function killNote(p_note_id: string): Promise<void> {
  return rpc('kill_note', {p_note_id});
}

export function getModerationFeed(p_room_id: string): Promise<ModerationNote[]> {
  return rpc('get_moderation_feed', {p_room_id});
}

// --- Host lobby roster edits (lobby phase only) ---

export function renameParticipant(
  p_room_id: string,
  p_participant_id: string,
  p_name: string,
): Promise<{server_now: string}> {
  return rpc('rename_participant', {p_room_id, p_participant_id, p_name});
}

export function removeParticipant(
  p_room_id: string,
  p_participant_id: string,
): Promise<{server_now: string}> {
  return rpc('remove_participant', {p_room_id, p_participant_id});
}

// --- Assignments and reveal ---

export function getMyAssignment(p_room_id: string): Promise<MyAssignment[]> {
  return rpc('get_my_assignment', {p_room_id});
}

export function setRevealState(p_room_id: string, p_state: RevealState): Promise<void> {
  return rpc('set_reveal_state', {p_room_id, p_state});
}

// --- Big screen and keepalive ---

export function getBigscreenState(p_code: string): Promise<BigscreenState> {
  return rpc('get_bigscreen_state', {p_code});
}

export function keepalive(): Promise<string> {
  return rpc('keepalive');
}
