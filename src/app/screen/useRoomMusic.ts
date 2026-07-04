'use client';

import {useCallback, useEffect, useRef, useState} from 'react';

import {asset} from '../../config';
import type {ScreenPhase, ScreenRoomState} from '../../lib/hostRoomSync';
import {MUSIC_TRACKS, type MusicPhase} from '../../lib/musicManifest';
import {subscribeMusic, type MusicCommand} from '../../lib/realtime';
import {isSupabaseConfigured} from '../../lib/supabase/client';

const VOL_KEY = 'kindsight.music.volume';
const MUTE_KEY = 'kindsight.music.muted';

function readVol(): number {
  try {
    const v = Number(localStorage.getItem(VOL_KEY));
    return Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : 60;
  } catch {
    return 60;
  }
}
function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}
function persistVol(v: number) {
  try {
    localStorage.setItem(VOL_KEY, String(v));
  } catch {
    /* storage unavailable */
  }
}
function persistMuted(m: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, m ? '1' : '0');
  } catch {
    /* storage unavailable */
  }
}

// Phase -> which folder plays and at what duck multiplier. Briefing ducks the
// lobby bed to 20% so the host can talk over it; reveal is silence.
function phaseFolder(phase: ScreenPhase): {folder: MusicPhase | null; duck: number} {
  switch (phase) {
    case 'lobby':
      return {folder: 'lobby', duck: 1};
    case 'briefing':
      return {folder: 'lobby', duck: 0.2};
    case 'writing':
      return {folder: 'writing', duck: 1};
    case 'wrapup':
      return {folder: 'wrapup', duck: 1};
    default:
      return {folder: null, duck: 0};
  }
}

export type RoomMusic = {
  hasTrack: boolean;
  showControls: boolean;
  armed: boolean;
  playing: boolean;
  muted: boolean;
  volume: number;
  ducked: boolean;
  arm: () => void;
  togglePlay: () => void;
  toggleMute: () => void;
  setVolume: (v: number) => void;
  skip: () => void;
};

// Big-screen music engine. The big screen is the only speaker; the console
// remote-commands it over the music channel. Volume + mute are device-local.
export function useRoomMusic(state: ScreenRoomState | null, preview = false): RoomMusic {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeRef = useRef<number | null>(null);
  const [armed, setArmed] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVol] = useState(60);
  const [playing, setPlaying] = useState(false);
  const [pausedByUser, setPausedByUser] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);

  const phase = state?.phase ?? null;
  const code = state?.code ?? null;
  const musicOn = state?.musicOn ?? false;
  const {folder, duck} = phase ? phaseFolder(phase) : {folder: null, duck: 0};
  // A folder is a playlist: every track plays in order, then loops to the first.
  const playlist = folder ? MUSIC_TRACKS[folder] : [];
  const track = playlist.length ? playlist[trackIndex % playlist.length] : null;
  const inReveal = phase === 'reveal' || Boolean(state?.revealTriggered);
  const hasTrack = Boolean(track);
  // Preview iframe mirrors the screen but is never a speaker: no controls, no
  // playback, no remote channel.
  const showControls = musicOn && !inReveal && hasTrack && !preview;
  const active = armed && musicOn && !inReveal && hasTrack && !pausedByUser && !preview;

  useEffect(() => {
    const a = new Audio();
    audioRef.current = a;
    setVol(readVol());
    setMuted(readMuted());
    return () => {
      a.pause();
      audioRef.current = null;
    };
  }, []);

  // Restart each folder's playlist from the top when the phase folder changes.
  useEffect(() => {
    setTrackIndex(0);
  }, [folder]);

  // Advance to the next track when one finishes. A single-track folder loops via
  // the audio element's loop flag (gapless); a multi-track folder advances here
  // and wraps back to the first, so the whole folder plays on repeat.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.loop = playlist.length <= 1;
    if (playlist.length <= 1) return;
    const onEnded = () => setTrackIndex((i) => (i + 1) % playlist.length);
    a.addEventListener('ended', onEnded);
    return () => a.removeEventListener('ended', onEnded);
  }, [playlist.length]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (!track) {
      a.removeAttribute('src');
      setPlaying(false);
      return;
    }
    const src = asset(track);
    if (!a.src.endsWith(src)) a.src = src;
  }, [track]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || inReveal) return;
    a.volume = active && !muted ? Math.max(0, Math.min(1, (volume / 100) * duck)) : 0;
    if (active && a.paused) {
      void a.play().then(() => setPlaying(true)).catch(() => {});
    } else if (!active && !a.paused) {
      a.pause();
      setPlaying(false);
    }
  }, [active, muted, volume, duck, inReveal, track]);

  // Reveal: fade to silence over 2s, then hard stop (M6 exit criterion).
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !inReveal) return;
    const start = a.volume;
    const t0 = performance.now();
    const tick = () => {
      if (!audioRef.current) return;
      const p = (performance.now() - t0) / 2000;
      if (p >= 1) {
        a.volume = 0;
        a.pause();
        setPlaying(false);
        return;
      }
      a.volume = start * (1 - p);
      fadeRef.current = requestAnimationFrame(tick);
    };
    fadeRef.current = requestAnimationFrame(tick);
    return () => {
      if (fadeRef.current) cancelAnimationFrame(fadeRef.current);
    };
  }, [inReveal]);

  const arm = useCallback(() => {
    setArmed(true);
    setPausedByUser(false);
  }, []);
  const togglePlay = useCallback(() => setPausedByUser((p) => !p), []);
  const toggleMute = useCallback(
    () =>
      setMuted((m) => {
        const n = !m;
        persistMuted(n);
        return n;
      }),
    [],
  );
  const setVolume = useCallback((v: number) => {
    const c = Math.min(100, Math.max(0, Math.round(v)));
    setVol(c);
    persistVol(c);
  }, []);
  const skip = useCallback(() => {
    // Multi-track folder: jump to the next track. Single track: restart it.
    if (playlist.length > 1) {
      setTrackIndex((i) => (i + 1) % playlist.length);
    } else {
      const a = audioRef.current;
      if (a) a.currentTime = 0;
    }
  }, [playlist.length]);

  // Obey remote transport commands from the console (keyed on the room code so
  // both windows share the channel without needing the room uuid).
  useEffect(() => {
    if (preview || !code || !isSupabaseConfigured()) return;
    const ch = subscribeMusic(code, (c: MusicCommand) => {
      if (c.cmd === 'playpause') togglePlay();
      else if (c.cmd === 'skip') skip();
      else if (c.cmd === 'mute') {
        setMuted(c.value);
        persistMuted(c.value);
      } else if (c.cmd === 'volume') setVolume(c.value);
    });
    return () => ch.unsubscribe();
  }, [preview, code, togglePlay, skip, setVolume]);

  return {
    hasTrack,
    showControls,
    armed,
    playing,
    muted,
    volume,
    ducked: duck < 1 && active,
    arm,
    togglePlay,
    toggleMute,
    setVolume,
    skip,
  };
}
