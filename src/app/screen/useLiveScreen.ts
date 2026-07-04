'use client';

import {useEffect, useRef, useState} from 'react';

import {BASE_PATH} from '../../config';
import {getBigscreenState} from '../../lib/api';
import type {ScreenRoomState} from '../../lib/hostRoomSync';
import {subscribeToRoom, type RoomSubscription} from '../../lib/realtime';
import {ensureSession} from '../../lib/supabase/auth';
import {isSupabaseConfigured} from '../../lib/supabase/client';
import type {BigscreenState} from '../../lib/types';

type FoundState = Extract<BigscreenState, {found: true}>;

// The big screen converges on server state through get_bigscreen_state (content-
// free counts + opt-in highlights only) plus the room realtime ping. localStorage
// stays as the demo/same-machine fallback in BigScreen when Supabase is absent.
export type LiveScreen =
  | {status: 'disabled'} // no Supabase env: caller uses the localStorage/demo path
  | {status: 'loading'}
  | {status: 'not_found'}
  | {status: 'ready'; state: ScreenRoomState};

function joinUrlForCode(code: string): string {
  const normalized = code.trim().toUpperCase();
  const path = `${BASE_PATH}/?code=${encodeURIComponent(normalized)}`;
  if (typeof window === 'undefined') return path;
  return new URL(path, window.location.origin).href;
}

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

// Timer is derived from the server's round_started_at + round_seconds and the
// captured clock skew, never a local countdown (ENG-PLAN D22). Paused rooms
// freeze at timer_paused_at.
function remainingSeconds(bs: FoundState, skewMs: number): number {
  if (!bs.round_started_at) return bs.round_seconds;
  const startMs = new Date(bs.round_started_at).getTime();
  const refMs = bs.timer_paused_at
    ? new Date(bs.timer_paused_at).getTime()
    : Date.now() + skewMs;
  return bs.round_seconds - (refMs - startMs) / 1000;
}

function mapState(bs: FoundState, skewMs: number): ScreenRoomState {
  return {
    code: bs.code,
    mode: bs.mode,
    phase: bs.phase,
    briefingIndex: bs.briefing_index,
    claimedCount: bs.counts.claimed,
    totalCount: bs.counts.roster,
    roster: bs.roster.map((r) => ({id: r.participant_id, claimed: r.claimed})),
    joinUrl: joinUrlForCode(bs.code),
    currentRound: bs.current_round,
    totalRounds: bs.round_count ?? 0,
    timerRemaining: formatClock(remainingSeconds(bs, skewMs)),
    notesWritten: bs.counts.notes,
    revealTriggered: bs.phase === 'reveal' || bs.phase === 'wrapup',
    highlightEnabled: bs.highlight_enabled,
    highlightNotes: bs.highlight.map((h) => ({frame: h.frame, content: h.content})),
    activePrompt: bs.active_prompt,
    lastJoinedName: null,
    musicOn: bs.music_on,
    updatedAt: Date.now(),
  };
}

export function useLiveScreenState(code: string | null): LiveScreen {
  const [result, setResult] = useState<LiveScreen>(() =>
    isSupabaseConfigured() ? {status: 'loading'} : {status: 'disabled'},
  );
  const bsRef = useRef<FoundState | null>(null);
  const skewRef = useRef(0);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setResult({status: 'disabled'});
      return;
    }
    if (!code) {
      setResult({status: 'loading'});
      return;
    }

    let cancelled = false;
    let sub: RoomSubscription | null = null;

    const pull = async () => {
      try {
        // get_bigscreen_state is granted to authenticated only; the projector
        // needs an anonymous session before it can read the room.
        await ensureSession();
        const bs = await getBigscreenState(code);
        if (cancelled) return;
        if (!bs.found) {
          bsRef.current = null;
          setResult({status: 'not_found'});
          return;
        }
        skewRef.current = new Date(bs.server_now).getTime() - Date.now();
        bsRef.current = bs;
        setResult({status: 'ready', state: mapState(bs, skewRef.current)});
        if (!sub) {
          sub = subscribeToRoom(bs.room_id, () => {
            void pull();
          });
        }
      } catch {
        if (cancelled) return;
        // Keep the last good frame on a transient miss; only demote if we never had one.
        setResult((prev) => (prev.status === 'ready' ? prev : {status: 'not_found'}));
      }
    };

    void pull();
    const poll = window.setInterval(() => void pull(), 60000);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
      sub?.unsubscribe();
    };
  }, [code]);

  const phase = result.status === 'ready' ? result.state.phase : null;
  useEffect(() => {
    if (phase !== 'writing') return;
    const id = window.setInterval(() => {
      const bs = bsRef.current;
      if (!bs) return;
      setResult({status: 'ready', state: mapState(bs, skewRef.current)});
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  return result;
}
