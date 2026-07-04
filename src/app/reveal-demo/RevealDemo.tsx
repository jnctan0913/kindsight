'use client';

import React, {useEffect, useRef, useState} from 'react';
import {useSearchParams} from 'next/navigation';

import styles from './reveal.module.scss';
import {t} from './strings';
import {demoNotes} from './demoNotes';
import {NoteCard} from './NoteCard';
import {HoldToRevealButton} from './HoldToRevealButton';
import {asset} from '../../config';

type Stage = 'locked' | 'unlock' | 'notes' | 'wall';

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
  const [noteIndex, setNoteIndex] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [shared, setShared] = useState<boolean[]>(() =>
    demoNotes.map(() => false),
  );
  const [soundOn, setSoundOn] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [noteAnnouncement, setNoteAnnouncement] = useState('');
  const [toast, setToast] = useState('');

  const noteCardRef = useRef<HTMLDivElement>(null);

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
    if (stage !== 'notes') return;
    const note = demoNotes[noteIndex];
    setNoteAnnouncement(
      t('reveal.note.aria', {
        frame: t(`frame.${note.frame}.label`),
        text: note.content,
      }),
    );
    noteCardRef.current?.focus({preventScroll: true});
  }, [stage, noteIndex]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const restart = () => {
    setStage('locked');
    setSilCount(SILHOUETTE_START);
    setNoteIndex(0);
    setExiting(false);
    setShared(demoNotes.map(() => false));
    setToast('');
  };

  const advanceNote = () => {
    if (exiting) return;
    setExiting(true);
    window.setTimeout(
      () => {
        setExiting(false);
        if (noteIndex + 1 < demoNotes.length) {
          setNoteIndex(noteIndex + 1);
        } else {
          setStage('wall');
        }
      },
      reducedMotion ? 150 : 250,
    );
  };

  const renderLocked = () => (
    <div key='locked' className={`${styles.stage} ${styles.night}`}>
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
          stroke='rgba(245, 250, 251, 0.7)'
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
    <div key='unlock' className={`${styles.stage} ${styles.night}`}>
      <h2 style={{marginTop: 64, textAlign: 'center', maxWidth: 280}}>
        {t('reveal.invite.title')}
      </h2>

      <HoldToRevealButton
        breathMs={breathMs}
        reducedMotion={reducedMotion}
        soundOn={soundOn}
        onComplete={() => setStage('notes')}
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

  const renderNotes = () => {
    const note = demoNotes[noteIndex];
    const isLast = noteIndex === demoNotes.length - 1;
    return (
      <div key='notes' className={`${styles.stage} ${styles.night}`}>
        <div className={styles.noteStage}>
          <span className={styles.noteCounter}>
            {t('reveal.note.counter', {
              n: noteIndex + 1,
              count: demoNotes.length,
            })}
          </span>

          <NoteCard
            key={note.id}
            note={note}
            variant='reveal'
            className={exiting ? styles.noteExit : styles.noteEnter}
            cardRef={noteCardRef}
          />

          <div key={`optin-${note.id}`} className={styles.optinRow}>
            <p style={{color: 'var(--neon-white)'}}>
              {t('reveal.optin.question')}
            </p>
            <div className={styles.optinButtons} role='group'>
              <button
                className={`${styles.optinPill} ${!shared[noteIndex] ? styles.optinPillActive : ''}`}
                onClick={() =>
                  setShared((s) => s.map((v, i) => (i === noteIndex ? false : v)))
                }
              >
                {t('reveal.optin.no')}
              </button>
              <button
                className={`${styles.optinPill} ${shared[noteIndex] ? styles.optinPillActive : ''}`}
                aria-label={t('reveal.optin.aria')}
                onClick={() =>
                  setShared((s) => s.map((v, i) => (i === noteIndex ? true : v)))
                }
              >
                {shared[noteIndex]
                  ? t('reveal.optin.shared')
                  : t('reveal.optin.share')}
              </button>
            </div>
          </div>

          <button className={styles.primaryButton} onClick={advanceNote}>
            {isLast ? t('reveal.last') : t('reveal.next')}
          </button>
        </div>

        <span className={styles.srOnly} aria-live='polite'>
          {noteAnnouncement}
        </span>
      </div>
    );
  };

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
      <p className={styles.wallHint}>{t('wall.optin.hint')}</p>

      <div className={styles.wallGrid}>
        {demoNotes.map((note) => (
          <NoteCard key={note.id} note={note} variant='wall' />
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
      {stage === 'notes' && renderNotes()}
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
