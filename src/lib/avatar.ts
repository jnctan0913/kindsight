import {asset} from '@/config';

// avatar-01 (navy) is the Kindsight app mascot and is never handed to a
// participant. Players draw from avatar-02..avatar-15.
export const MASCOT_AVATAR_ID = 1;

export const ASSIGNABLE_AVATARS: readonly number[] = [
  2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
];

export const avatarSrc = (id: number): string =>
  asset(`/assets/kindsight/avatars/avatar-${String(id).padStart(2, '0')}.png`);

// Deterministic, per-room avatar assignment computed purely on the client.
// Roster slots are created once at room creation, so the participant-id set is
// stable for the whole session and every surface (player, host, projector)
// derives the same mapping from the same ids without any shared DB state.
// Uniqueness holds for up to 14 participants; beyond that avatars repeat. This
// is a client-only stand-in until a persisted avatar_id column lands, which is
// also what unlocks user-swapping.
export function assignAvatars(participantIds: string[]): Map<string, number> {
  const map = new Map<string, number>();
  [...participantIds].sort().forEach((id, i) => {
    map.set(id, ASSIGNABLE_AVATARS[i % ASSIGNABLE_AVATARS.length]);
  });
  return map;
}
