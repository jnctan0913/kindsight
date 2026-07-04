'use client';

import React, {useEffect, useRef, useState} from 'react';

import {useT} from '../../../i18n';
import {hasAnyMusic} from '../../../lib/musicManifest';
import {subscribeMusic, type MusicChannel} from '../../../lib/realtime';
import {HostIcon} from './HostIcon';
import styles from './ConsoleShell.module.scss';

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

type Props = {
  code: string;
  musicOn: boolean;
  onToggleMusic: () => void;
};

const transportBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  padding: 4,
};

// Sidebar remote for the big-screen music. On/off is a room setting (persists
// via the parent's update_settings). Play/pause, skip, mute, and volume are
// broadcast commands the big screen obeys; volume/mute share the big screen's
// localStorage keys so a same-browser "Open big screen" stays in sync.
export const MusicDock: React.FC<Props> = ({code, musicOn, onToggleMusic}) => {
  const t = useT();
  const chRef = useRef<MusicChannel | null>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(60);

  useEffect(() => {
    setVolume(readVol());
    setMuted(readMuted());
  }, []);
  useEffect(() => {
    const ch = subscribeMusic(code);
    chRef.current = ch;
    return () => {
      ch.unsubscribe();
      chRef.current = null;
    };
  }, [code]);

  const togglePlay = () => {
    setPlaying((p) => !p);
    chRef.current?.send({cmd: 'playpause'});
  };
  const skip = () => chRef.current?.send({cmd: 'skip'});
  const toggleMute = () => {
    const n = !muted;
    setMuted(n);
    try {
      localStorage.setItem(MUTE_KEY, n ? '1' : '0');
    } catch {
      /* storage unavailable */
    }
    chRef.current?.send({cmd: 'mute', value: n});
  };
  const changeVolume = (v: number) => {
    setVolume(v);
    try {
      localStorage.setItem(VOL_KEY, String(v));
    } catch {
      /* storage unavailable */
    }
    chRef.current?.send({cmd: 'volume', value: v});
  };

  const header = (
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8}}>
      <span style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>
        <HostIcon
          name='music'
          size={16}
          color={musicOn && hasAnyMusic ? 'var(--accent-color)' : 'rgba(245, 250, 251, 0.55)'}
        />
        <span className={styles.roomLabel}>{t('host.music.title')}</span>
      </span>
      {hasAnyMusic && (
        <button
          type='button'
          className='clickable'
          onClick={onToggleMusic}
          aria-pressed={musicOn}
          style={{
            border: 'none',
            borderRadius: 999,
            padding: '4px 10px',
            fontSize: 12,
            fontWeight: 700,
            fontFamily: 'var(--font-dosis), var(--font-noto-sc), sans-serif',
            cursor: 'pointer',
            backgroundColor: musicOn ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.14)',
            color: musicOn ? 'var(--main-color)' : 'rgba(245, 250, 251, 0.8)',
          }}
        >
          {musicOn ? t('host.music.on') : t('host.music.off')}
        </button>
      )}
    </div>
  );

  return (
    <div className={styles.musicDock}>
      {header}
      {!hasAnyMusic ? (
        <span className={styles.stat} style={{opacity: 0.7}}>
          {t('host.music.unavailable')}
        </span>
      ) : (
        musicOn && (
          <>
            <div style={{display: 'flex', alignItems: 'center', gap: 10, marginTop: 4}}>
              <button style={transportBtn} onClick={togglePlay} aria-label={t('host.music.play')}>
                <HostIcon name={playing ? 'pause' : 'play'} size={18} color='var(--neon-white)' />
              </button>
              <button style={transportBtn} onClick={skip} aria-label={t('host.music.skip')}>
                <HostIcon name='skip' size={16} color='rgba(245, 250, 251, 0.7)' />
              </button>
              <button style={transportBtn} onClick={toggleMute} aria-label={t('host.music.mute')}>
                <HostIcon
                  name={muted ? 'mute' : 'volume'}
                  size={16}
                  color={muted ? 'var(--warn-color)' : 'rgba(245, 250, 251, 0.7)'}
                />
              </button>
              <input
                type='range'
                min={0}
                max={100}
                value={volume}
                onChange={(e) => changeVolume(Number(e.target.value))}
                aria-label={t('host.music.volume')}
                style={{flex: 1, minWidth: 0, accentColor: 'var(--accent-color)'}}
              />
            </div>
            <span className={styles.stat} style={{fontSize: 11, opacity: 0.7}}>
              {t('host.music.hint')}
            </span>
          </>
        )
      )}
    </div>
  );
};
