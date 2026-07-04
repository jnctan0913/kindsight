'use client';

import {useCallback, useEffect, useState} from 'react';

import type {FrameKey} from '../mock/room';
import type {RoomMode} from './types';

export type ScreenPhase = 'lobby' | 'briefing' | 'writing' | 'reveal' | 'wrapup';

export type HighlightNote = {
  frame: FrameKey;
  content: string;
};

export type ScreenRoomState = {
  code: string;
  mode: RoomMode;
  phase: ScreenPhase;
  briefingIndex: number;
  claimedCount: number;
  totalCount: number;
  // Present on the live Supabase path; absent on the localStorage/demo path,
  // where the projector falls back to anonymous progress dots.
  roster?: {id: string; claimed: boolean}[];
  joinUrl: string;
  currentRound: number;
  totalRounds: number;
  timerRemaining: string;
  notesWritten: number;
  revealTriggered: boolean;
  highlightEnabled: boolean;
  highlightNotes: HighlightNote[];
  activePrompt: string | null;
  lastJoinedName: string | null;
  // Room-level music toggle (host on/off). Track choice, volume, and mute are
  // device-local on the big screen; only this on/off syncs.
  musicOn: boolean;
  updatedAt: number;
};

const STORAGE_PREFIX = 'kindsight.screenState.';

function storageKey(code: string): string {
  return `${STORAGE_PREFIX}${code.toUpperCase()}`;
}

export function publishScreenState(state: ScreenRoomState): void {
  if (typeof window === 'undefined') return;
  try {
    const payload = {...state, code: state.code.toUpperCase(), updatedAt: Date.now()};
    window.localStorage.setItem(storageKey(state.code), JSON.stringify(payload));
    window.dispatchEvent(
      new CustomEvent('kindsight:screen-state', {detail: {code: payload.code}}),
    );
  } catch {
    /* storage unavailable */
  }
}

export function readScreenState(code: string): ScreenRoomState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(storageKey(code));
    if (!raw) return null;
    return JSON.parse(raw) as ScreenRoomState;
  } catch {
    return null;
  }
}

const ACTIVE_ROOMS_KEY = 'kindsight.hostActiveRooms';

export type ActiveRoomEntry = {
  code: string;
  phase: ScreenPhase;
  createdAt: string;
  rosterSize: number;
};

export function listActiveRooms(): ActiveRoomEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(ACTIVE_ROOMS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ActiveRoomEntry[];
  } catch {
    return [];
  }
}

export function upsertActiveRoom(entry: ActiveRoomEntry): void {
  if (typeof window === 'undefined') return;
  try {
    const rooms = listActiveRooms().filter((r) => r.code !== entry.code);
    rooms.unshift(entry);
    window.localStorage.setItem(ACTIVE_ROOMS_KEY, JSON.stringify(rooms.slice(0, 10)));
  } catch {
    /* storage unavailable */
  }
}

export function removeActiveRoom(code: string): void {
  if (typeof window === 'undefined') return;
  try {
    const rooms = listActiveRooms().filter((r) => r.code !== code.toUpperCase());
    window.localStorage.setItem(ACTIVE_ROOMS_KEY, JSON.stringify(rooms));
    window.localStorage.removeItem(storageKey(code));
  } catch {
    /* storage unavailable */
  }
}

export function useScreenRoomState(code: string | null): ScreenRoomState | null {
  const normalized = code?.trim().toUpperCase() ?? null;
  // Init null (not a localStorage read) so the first client render matches the
  // server. The effect below loads the stored state right after mount; reading
  // localStorage during render would cause a hydration mismatch.
  const [state, setState] = useState<ScreenRoomState | null>(null);

  const refresh = useCallback(() => {
    if (!normalized) {
      setState(null);
      return;
    }
    setState(readScreenState(normalized));
  }, [normalized]);

  useEffect(() => {
    refresh();
    if (!normalized) return;

    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey(normalized)) refresh();
    };
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent<{code: string}>).detail;
      if (detail?.code === normalized) refresh();
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('kindsight:screen-state', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('kindsight:screen-state', onCustom);
    };
  }, [normalized, refresh]);

  return state;
}
