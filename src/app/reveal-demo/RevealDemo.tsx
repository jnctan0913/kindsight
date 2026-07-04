'use client';

import React, {useEffect, useState} from 'react';
import {useSearchParams} from 'next/navigation';

import styles from './reveal.module.scss';
import {t} from './strings';
import {demoNotes} from './demoNotes';
import {NoteCard} from './NoteCard';
import {HoldToRevealButton} from './HoldToRevealButton';
import {asset} from '../../config';

type Stage = 'locked' | 'unlock' | 'wall';

const DEFAULT_BREATH = 3200;
const SILHOUETTE_START = 5;

export const RevealDemo: React.FC = () => {
  const searchParams = useSearchParams();

  const [breathMs, setBreathMs] = useState(() => {
    const q = Number(searchParams.get('breath'));
    return Number.isFinite(q) && q >= 1000 && q <= 10000 ? q : DEFAULT_BREATH;
  });
  const [stage, setStage] = useState<Stage>('locked');
  const [silCount, setSilCount] = useState(SILHOUETTE_START);
  const [shared, setShared] = useState<boolean[]>(() =>
    demoNotes.map(() => false),
  );
  const [soundOn, setSoundOn] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Anticipation engine stand-in: fake notes arriving while the wall is locked.
  useEffect(() => {
    if (stage !== 'locked' || silCount >= demoNotes.length) return;
    const timer = window.setInterval(
      () => setSilCount((c) => Math.min(c + 1, demoNotes.length)),
      2200,
    );
    return () => window.clearInterval(timer);
  }, [stage, silCount]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const restart = () => {
    setStage('locked');
    setSilCount(SILHOUETTE_START);
    setShared(demoNotes.map(() => false));
    setToast('');
  };

  const renderLocked = () => (
    <div key='locked' className={`${styles.stage} ${styles.ritual}`}>
      <img
        src={asset('/assets/kindsight/kindsight-mascot-only.png')}
        alt='Kindsight mascot'
        style={{width: 96, height: 96, objectFit: 'contain', marginTop: 24}}
      />
      <h2 style={{marginTop: 24, textAlign: 'center'}}>
        {t('reveal.locked.title')}
      </h2>

      <div
        className={`${styles.silhouetteGrid} ${styles.shimmer}`}
        aria-hidden='true'
      >
        {Array.from({length: silCount}, (_, i) => (
          <div key={i} className={styles.silhouette} />
        ))}
      </div>

      <p aria-live='polite' style={{fontSize: 16}}>
        {silCount === 1
          ? t('reveal.locked.count.one')
          : t('reveal.locked.count', {count: silCount})}
      </p>

      <div className={styles.lockRow}>
        <svg
          width='20'
          height='20'
          viewBox='0 0 24 24'
          fill='none'
          stroke='rgba(30, 37, 56, 0.6)'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
          aria-hidden='true'
        >
          <rect x='3' y='11' width='18' height='11' rx='2' ry='2' />
          <path d='M7 11V7a5 5 0 0 1 10 0v4' />
        </svg>
        <p className={styles.muted} style={{fontSize: 14}}>
          {t('reveal.locked.host')}
        </p>
      </div>
    </div>
  );

  const renderUnlock = () => (
    <div key='unlock' className={`${styles.stage} ${styles.ritual}`}>
      <h2 style={{marginTop: 64, textAlign: 'center', maxWidth: 280}}>
        {t('reveal.invite.title')}
      </h2>

      <HoldToRevealButton
        breathMs={breathMs}
        reducedMotion={reducedMotion}
        soundOn={soundOn}
        onComplete={() => setStage('wall')}
      />

      <button
        className={styles.soundToggle}
        onClick={() => setSoundOn((s) => !s)}
        aria-pressed={soundOn}
      >
        {soundOn ? t('reveal.sound.on') : t('reveal.sound.off')}
      </button>
    </div>
  );

  const renderWall = () => (
    <div
      key='wall'
      className={`${styles.stage} ${styles.day} ${styles.dayWithDev}`}
    >
      <div className={styles.wallHeader}>
        <img
          src={asset('/assets/kindsight/kindsight-mascot-only.png')}
          alt=''
          aria-hidden='true'
        />
        <h2>{t('wall.header')}</h2>
      </div>
      <p className={styles.wallHint}>{t('wall.share.hint')}</p>

      <div className={styles.wallGrid}>
        {demoNotes.map((note, i) => (
          <div
            key={note.id}
            className={reducedMotion ? undefined : styles.noteEnter}
            style={
              reducedMotion ? undefined : {animationDelay: `${i * 140}ms`}
            }
          >
            <NoteCard
              note={note}
              variant='wall'
              className={shared[i] ? styles.wallCardShared : undefined}
              cornerAction={
                <button
                  className={`${styles.shareButton} ${shared[i] ? styles.shareButtonActive : ''}`}
                  aria-label={t('wall.share.aria')}
                  aria-pressed={shared[i]}
                  onClick={() =>
                    setShared((s) => s.map((v, j) => (j === i ? !v : v)))
                  }
                >
                  <svg
                    width='20'
                    height='20'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    aria-hidden='true'
                  >
                    <rect x='2' y='3' width='20' height='14' rx='2' />
                    <path d='M8 21h8' />
                    <path d='M12 17v4' />
                    {shared[i] && <path d='M8.5 10l2.5 2.5 4.5-4.5' />}
                  </svg>
                </button>
              }
            />
          </div>
        ))}
      </div>

      <div className={styles.pinnedBar}>
        <button
          className={styles.primaryButton}
          style={{marginTop: 0}}
          onClick={() =>
            setToast('Saving your wall as an image ships in milestone M1.')
          }
        >
          {t('wall.export.cta')}
        </button>
      </div>

      {toast && (
        <div className={styles.toast} role='status'>
          {toast}
        </div>
      )}
    </div>
  );

  return (
    <>
      {stage === 'locked' && renderLocked()}
      {stage === 'unlock' && renderUnlock()}
      {stage === 'wall' && renderWall()}

      <div className={styles.devRow}>
        <span>demo</span>
        <button
          className={`${styles.devButton} ${breathMs === 3200 ? styles.devButtonActive : ''}`}
          onClick={() => setBreathMs(3200)}
        >
          3.2s
        </button>
        <button
          className={`${styles.devButton} ${breathMs === 4500 ? styles.devButtonActive : ''}`}
          onClick={() => setBreathMs(4500)}
        >
          4.5s
        </button>
        {stage === 'locked' && (
          <button
            className={styles.devButton}
            onClick={() => setStage('unlock')}
          >
            Host opens the walls
          </button>
        )}
        <button className={styles.devButton} onClick={restart}>
          Restart
        </button>
      </div>
    </>
  );
};
