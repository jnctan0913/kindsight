'use client';

import React, {useEffect, useRef, useState} from 'react';

import {useT} from '../../i18n';
import {HostIcon} from '../host/components/HostIcon';
import type {RoomMusic} from './useRoomMusic';

type Props = {
  music: RoomMusic;
  musicOn: boolean;
  revealing: boolean;
};

const iconBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  padding: 6,
};

export const MusicControls: React.FC<Props> = ({music, musicOn, revealing}) => {
  const t = useT();
  const [visible, setVisible] = useState(true);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const show = () => {
      setVisible(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setVisible(false), 3000);
    };
    show();
    window.addEventListener('mousemove', show);
    window.addEventListener('touchstart', show);
    return () => {
      window.removeEventListener('mousemove', show);
      window.removeEventListener('touchstart', show);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  // Music off / no track / muted: a quiet corner indicator, no controls.
  if (!music.showControls) {
    if (!musicOn || music.muted || !music.hasTrack) {
      return (
        <div style={{position: 'fixed', top: '2.5vh', right: '2.5vw', pointerEvents: 'none'}}>
          <HostIcon name='mute' size={26} color='rgba(30, 37, 56, 0.45)' />
        </div>
      );
    }
    return null;
  }

  // Autoplay gate: arm on the host's first click anywhere. During reveal /
  // wrap-up the full-screen prompt would cover the interstitial, so it is
  // suppressed there; music still resumes once armed from an earlier phase.
  if (!music.armed) {
    if (revealing) return null;
    return (
      <div
        onClick={music.arm}
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(30, 37, 56, 0.35)',
          cursor: 'pointer',
          zIndex: 50,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            padding: '16px 28px',
            borderRadius: 999,
            background: 'var(--main-color)',
            color: 'var(--neon-white)',
            boxShadow: 'var(--shadow-soft)',
            fontFamily: 'var(--font-dosis), var(--font-noto-sc), sans-serif',
            fontSize: 'clamp(20px, 2.4vw, 32px)',
            fontWeight: 700,
          }}
        >
          <HostIcon name='music' size={30} color='var(--accent-color)' />
          {t('screen.music.enable')}
        </div>
      </div>
    );
  }

  // Armed: bottom-center auto-hide transport bar.
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '3vh',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '10px 20px',
        borderRadius: 999,
        background: 'rgba(30, 37, 56, 0.72)',
        backdropFilter: 'blur(8px)',
        boxShadow: 'var(--shadow-soft)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 300ms ease',
        pointerEvents: visible ? 'auto' : 'none',
        zIndex: 50,
      }}
    >
      <button style={iconBtn} onClick={music.togglePlay} aria-label='Play or pause'>
        <HostIcon name={music.playing ? 'pause' : 'play'} size={28} color='var(--neon-white)' />
      </button>
      <button style={iconBtn} onClick={music.skip} aria-label='Skip'>
        <HostIcon name='skip' size={26} color='var(--neon-white)' />
      </button>
      <button style={iconBtn} onClick={music.toggleMute} aria-label='Mute'>
        <HostIcon
          name={music.muted ? 'mute' : 'volume'}
          size={26}
          color={music.muted ? 'var(--warn-color)' : 'var(--neon-white)'}
        />
      </button>
      <input
        type='range'
        min={0}
        max={100}
        value={music.volume}
        onChange={(e) => music.setVolume(Number(e.target.value))}
        aria-label='Volume'
        style={{width: 150, accentColor: 'var(--accent-color)'}}
      />
      {music.ducked && (
        <span
          style={{
            color: 'var(--aurora-cream)',
            fontSize: 12,
            fontFamily: 'var(--font-dosis), var(--font-noto-sc), sans-serif',
          }}
        >
          20%
        </span>
      )}
    </div>
  );
};
