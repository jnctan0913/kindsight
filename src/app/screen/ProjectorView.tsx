'use client';

import React, {useEffect, useState} from 'react';
import {QRCodeSVG} from 'qrcode.react';

import {asset} from '../../config';
import {useT} from '../../i18n';
import type {StringKey} from '../../i18n';
import {
  BRIEFING_FRAME_CARDS,
  BRIEFING_SLIDE_COUNT,
  getBriefingSlide,
  normalizeBriefingIndex,
} from '../../lib/briefingContent';
import type {ScreenRoomState} from '../../lib/hostRoomSync';
import styles from './BigScreen.module.scss';

type Props = {
  state: ScreenRoomState;
  preview?: boolean;
};

export const ProjectorView: React.FC<Props> = ({state, preview = false}) => {
  const t = useT();
  const [highlightIndex, setHighlightIndex] = useState(0);
  const shellClass = `${styles.shell} ${preview ? styles.previewShell : ''}`;

  useEffect(() => {
    if (!state.highlightEnabled || state.highlightNotes.length === 0) return;
    const id = window.setInterval(() => {
      setHighlightIndex((i) => (i + 1) % state.highlightNotes.length);
    }, 8000);
    return () => window.clearInterval(id);
  }, [state.highlightEnabled, state.highlightNotes.length]);

  if (state.highlightEnabled && state.highlightNotes.length > 0) {
    const note = state.highlightNotes[highlightIndex % state.highlightNotes.length];
    const frameKey = `frame.${note.frame}.label` as StringKey;
    return (
      <div className={shellClass}>
        <img
          src={asset('/assets/kindsight/kindsight-logo-transparent.png')}
          alt='Kindsight'
          className={styles.logo}
        />
        <p className={styles.headline}>{t('screen.highlight.title')}</p>
        <div className={styles.highlightCard}>
          <span className={styles.highlightFrame}>{t(frameKey)}</span>
          <p className={styles.highlightText}>{note.content}</p>
        </div>
        {state.activePrompt && (
          <p className={styles.subcopy} style={{marginTop: '4vh'}}>
            {state.activePrompt}
          </p>
        )}
      </div>
    );
  }

  if (state.revealTriggered || state.phase === 'reveal') {
    return (
      <div className={`${shellClass} ${styles.revealShell}`}>
        <img
          src={asset('/assets/kindsight/kindsight-mascot-only.png')}
          alt=''
          className={styles.mascot}
        />
        <p className={styles.headline}>{t('screen.reveal.interstitial')}</p>
      </div>
    );
  }

  if (state.phase === 'briefing') {
    const briefingIndex = normalizeBriefingIndex(state.briefingIndex);
    const slide = getBriefingSlide(briefingIndex, state.mode);
    return (
      <div className={`${shellClass} ${styles.briefingShell}`}>
        <div className={styles.briefingVisual}>
          <img src={asset(slide.image)} alt='' aria-hidden='true' />
        </div>
        <div className={styles.briefingCopy}>
          <p className={styles.eyebrow}>
            {t('screen.briefing.frame', {
              n: briefingIndex + 1,
              total: BRIEFING_SLIDE_COUNT,
            })}
          </p>
          <p className={styles.headline}>{t(slide.title)}</p>
          <p className={styles.subcopy}>{t(slide.body)}</p>
        </div>

        {slide.id === 'write' && (
          <div className={styles.briefingFrames}>
            {BRIEFING_FRAME_CARDS.map((frame) => (
              <div key={frame.frame} className={styles.frameCard}>
                <p className={styles.frameLabel}>{t(frame.label)}</p>
                <p className={styles.frameStem}>{t(frame.stem)}</p>
                <p className={styles.frameExample}>{t(frame.good)}</p>
              </div>
            ))}
          </div>
        )}

        {slide.id === 'targets' && (
          <div className={styles.briefingNote}>
            <p>
              {state.mode === 'free_select'
                ? t('host.preview.mode.b')
                : t('host.preview.mode.a')}
            </p>
          </div>
        )}

        {slide.id === 'reveal' && (
          <div className={styles.briefingNote}>
            <p>{t('player.briefing.anonymity')}</p>
          </div>
        )}
      </div>
    );
  }

  if (state.phase === 'writing') {
    return (
      <div className={shellClass}>
        <img
          src={asset('/assets/kindsight/kindsight-logo-transparent.png')}
          alt='Kindsight'
          className={styles.logo}
        />
        <p className={styles.headline}>
          {t('screen.writing.title', {
            n: state.currentRound,
            total: state.totalRounds,
          })}
        </p>
        <p className={styles.counter} style={{marginTop: '4vh'}}>
          {state.timerRemaining}
        </p>
        <p className={styles.subcopy} style={{marginTop: '3vh'}}>
          {t('screen.writing.notes', {count: state.notesWritten})}
        </p>
      </div>
    );
  }

  const dots = Array.from({length: state.totalCount}, (_, i) => i < state.claimedCount);

  return (
    <div className={`${shellClass} ${styles.lobbyShell}`}>
      <div className={styles.lobbyGrid}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2vh',
          }}
        >
          <img
            src={asset('/assets/kindsight/mascot-cheer.png')}
            alt=''
            aria-hidden='true'
            style={{width: 'clamp(160px, 18vw, 300px)', height: 'auto'}}
          />
          <img
            src={asset('/assets/kindsight/kindsight-wordmark.png')}
            alt='Kindsight'
            style={{width: 'clamp(140px, 14vw, 240px)', height: 'auto'}}
          />
        </div>
        <div className={styles.qrBlock}>
          <QRCodeSVG
            value={state.joinUrl}
            level='M'
            marginSize={2}
            bgColor='#ffffff'
            fgColor='#1E2538'
            style={{width: '100%', height: '100%', display: 'block'}}
          />
        </div>
        <div>
          <p className={styles.subcopy}>{t('screen.lobby.roomCode')}</p>
          <p className={styles.code}>{state.code}</p>
          <p
            className={styles.subcopy}
            style={{marginTop: '1.5vh', wordBreak: 'break-all'}}
          >
            {state.joinUrl}
          </p>
        </div>
      </div>
      <p className={styles.subcopy} style={{marginTop: '4vh'}}>
        {t('screen.lobby.progress', {
          claimed: state.claimedCount,
          total: state.totalCount,
        })}
      </p>
      <div className={styles.dots}>
        {dots.map((filled, i) => (
          <span
            key={i}
            className={`${styles.dot} ${filled ? styles.dotFilled : ''}`}
          />
        ))}
      </div>
      {state.lastJoinedName && (
        <p className={styles.ticker}>
          {t('screen.lobby.ticker', {name: state.lastJoinedName})}
        </p>
      )}
    </div>
  );
};
