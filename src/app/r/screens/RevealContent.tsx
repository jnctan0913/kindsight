'use client';

import React, {useCallback, useEffect, useRef, useState} from 'react';

import styles from '@/app/reveal-demo/reveal.module.scss';
import {NoteCard} from '@/app/reveal-demo/NoteCard';
import {HoldToRevealButton} from '@/app/reveal-demo/HoldToRevealButton';
import {renderWallImage, saveWallImage, type ExportFonts} from '@/lib/export';
import {asset} from '@/config';
import {useT} from '@/i18n';
import {useRoomStore} from '@/stores/room';

// Lifted verbatim from reveal-demo/RevealDemo.tsx: next/font hashes the family
// names, so the export reads the resolved families off the rendered body.
function resolveFonts(): ExportFonts {
  const cs = getComputedStyle(document.body);
  const pick = (v: string, fallback: string) => {
    const raw = cs.getPropertyValue(v).trim();
    const first = raw.split(',')[0]?.trim().replace(/^['"]|['"]$/g, '');
    return first || fallback;
  };
  return {
    dosis: pick('--font-dosis', 'Dosis'),
    leagueSpartan: pick('--font-league-spartan', 'League Spartan'),
    notoSC: pick('--font-noto-sc', 'Noto Sans SC'),
  };
}

type Stage = 'locked' | 'unlock' | 'wall';

const BREATH_MS = 3200;
const MASCOT = '/assets/kindsight/kindsight-mascot-only.png';

export const RevealContent: React.FC = () => {
  const t = useT();
  const me = useRoomStore((s) => s.me);
  const seq = useRoomStore((s) => s.seq);
  const wall = useRoomStore((s) => s.wall);
  const loadWall = useRoomStore((s) => s.loadWall);
  const setNoteShared = useRoomStore((s) => s.setNoteShared);
  const setReveal = useRoomStore((s) => s.setReveal);

  const [stage, setStage] = useState<Stage>('locked');
  const [soundOn, setSoundOn] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [toast, setToast] = useState('');

  const exportBlobRef = useRef<Blob | null>(null);
  const exportSigRef = useRef<string | null>(null);
  const [exportReady, setExportReady] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [overlayUrl, setOverlayUrl] = useState<string | null>(null);
  const overlayCloseRef = useRef<HTMLButtonElement | null>(null);
  const exportBtnRef = useRef<HTMLButtonElement | null>(null);

  const count = me?.wall_count ?? 0;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Best-effort telemetry so the host's reveal-status list lights up once the
  // player commits to the breathing ritual. Never blocks the ritual itself.
  useEffect(() => {
    if (stage === 'unlock') void setReveal('holding');
  }, [stage, setReveal]);

  // Fetch the wall behind the reveal gate on entry, and again on every realtime
  // ping (seq) so a host kill drops the note (get_my_wall already filters it).
  useEffect(() => {
    if (stage !== 'wall') return;
    void loadWall();
  }, [stage, seq, loadWall]);

  // Pre-render the PNG blob before the export tap. Rendering ahead of the
  // gesture is the iOS Safari fix: navigator.share must be called synchronously
  // inside the tap, so no async work can happen after the user taps. The
  // signature (title + note content, locale-sensitive) skips redundant renders
  // when only a share toggle flips.
  useEffect(() => {
    if (stage !== 'wall' || !wall || wall.length === 0) return;
    const sig = [
      t('player.wall.header'),
      ...wall.map((n) => `${n.frame}\u0000${n.content}`),
    ].join('\u0001');
    if (sig === exportSigRef.current) return;
    exportSigRef.current = sig;
    setExportReady(false);

    let cancelled = false;
    const run = () => {
      renderWallImage(
        wall.map((n) => ({frame: n.frame, content: n.content})),
        {
          fonts: resolveFonts(),
          strings: {
            wordmark: 'Kindsight',
            title: t('player.wall.header'),
            date: new Date().toLocaleDateString(),
            footerEN:
              'Written anonymously by the people in your room. Kindsight.',
            footerZH: '这间房里的人，匿名为你写下。Kindsight。',
            frameLabel: {
              moment: t('frame.moment.label'),
              strength: t('frame.strength.label'),
              wish: t('frame.wish.label'),
            },
          },
          mascotSrc: asset(MASCOT),
        },
      )
        .then((blob) => {
          if (cancelled) return;
          exportBlobRef.current = blob;
          setExportReady(true);
        })
        .catch(() => {
          if (cancelled) return;
          exportSigRef.current = null;
          setExportReady(false);
        });
    };
    const ric = (
      window as unknown as {requestIdleCallback?: (cb: () => void) => number}
    ).requestIdleCallback;
    const handle = ric ? ric(run) : window.setTimeout(run, 0);
    return () => {
      cancelled = true;
      const cic = (
        window as unknown as {cancelIdleCallback?: (h: number) => void}
      ).cancelIdleCallback;
      if (cic) cic(handle);
      else window.clearTimeout(handle);
    };
  }, [stage, wall, t]);

  useEffect(() => {
    if (overlayUrl) overlayCloseRef.current?.focus();
  }, [overlayUrl]);

  const onUnlockComplete = useCallback(() => {
    void setReveal('reading');
    setStage('wall');
  }, [setReveal]);

  const onExportTap = useCallback(() => {
    const blob = exportBlobRef.current;
    if (!blob) return;
    setExporting(true);
    saveWallImage(blob, {
      fileName: 'kindsight-wall.png',
      onLongPress: (url) => setOverlayUrl(url),
    })
      .then((result) => {
        if (result !== 'longpress') setToast(t('player.wall.export.success'));
      })
      .finally(() => setExporting(false));
  }, [t]);

  const closeOverlay = useCallback(() => {
    setOverlayUrl(null);
    exportBtnRef.current?.focus();
  }, []);

  const renderLocked = () => (
    <div key='locked' className={`${styles.stage} ${styles.ritual}`}>
      <img
        src={asset(MASCOT)}
        alt='Kindsight mascot'
        style={{width: 96, height: 96, objectFit: 'contain', marginTop: 24}}
      />
      <h2 style={{marginTop: 24, textAlign: 'center'}}>
        {t('player.reveal.locked.title')}
      </h2>

      <div
        className={`${styles.silhouetteGrid} ${styles.shimmer}`}
        aria-hidden='true'
      >
        {Array.from({length: count}, (_, i) => (
          <div key={i} className={styles.silhouette} />
        ))}
      </div>

      <p aria-live='polite' style={{fontSize: 16}}>
        {count === 0
          ? t('player.reveal.locked.count.zero')
          : count === 1
            ? t('player.reveal.locked.count.one')
            : t('player.reveal.locked.count', {count})}
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
          {t('player.reveal.locked.host')}
        </p>
      </div>

      <button
        className={styles.primaryButton}
        style={{maxWidth: 320}}
        onClick={() => setStage('unlock')}
      >
        {t('player.reveal.invite.title')}
      </button>
    </div>
  );

  const renderUnlock = () => (
    <div key='unlock' className={`${styles.stage} ${styles.ritual}`}>
      <h2 style={{marginTop: 64, textAlign: 'center', maxWidth: 280}}>
        {t('player.reveal.invite.title')}
      </h2>

      <HoldToRevealButton
        breathMs={BREATH_MS}
        reducedMotion={reducedMotion}
        soundOn={soundOn}
        onComplete={onUnlockComplete}
      />

      <button
        className={styles.soundToggle}
        onClick={() => setSoundOn((s) => !s)}
        aria-pressed={soundOn}
      >
        {soundOn ? t('player.reveal.sound.on') : t('player.reveal.sound.off')}
      </button>
    </div>
  );

  const renderWall = () => (
    <div key='wall' className={`${styles.stage} ${styles.day}`}>
      <div className={styles.wallHeader}>
        <img src={asset(MASCOT)} alt='' aria-hidden='true' />
        <h2>{t('player.wall.header')}</h2>
      </div>
      <p className={styles.wallHint}>{t('player.wall.share.hint')}</p>

      {wall && wall.length === 0 ? (
        <p className={styles.wallHint}>{t('player.wall.empty')}</p>
      ) : (
        <div className={styles.wallGrid}>
          {(wall ?? []).map((note, i) => (
            <div
              key={note.note_id}
              className={reducedMotion ? undefined : styles.noteEnter}
              style={
                reducedMotion ? undefined : {animationDelay: `${i * 140}ms`}
              }
            >
              <NoteCard
                note={{id: i, frame: note.frame, content: note.content}}
                variant='wall'
                className={note.shared_to_wall ? styles.wallCardShared : undefined}
                cornerAction={
                  <button
                    className={`${styles.shareButton} ${note.shared_to_wall ? styles.shareButtonActive : ''}`}
                    aria-label={t('player.wall.share.aria')}
                    aria-pressed={note.shared_to_wall}
                    onClick={() =>
                      void setNoteShared(note.note_id, !note.shared_to_wall)
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
                      {note.shared_to_wall && <path d='M8.5 10l2.5 2.5 4.5-4.5' />}
                    </svg>
                  </button>
                }
              />
            </div>
          ))}
        </div>
      )}

      {wall && wall.length > 0 && (
        <div className={styles.pinnedBar}>
          <button
            ref={exportBtnRef}
            className={`${styles.primaryButton} pressable`}
            style={{
              marginTop: 0,
              borderRadius: 50,
              boxShadow: 'var(--shadow-soft), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
            }}
            disabled={!exportReady || exporting}
            onClick={onExportTap}
          >
            {exporting || !exportReady
              ? t('player.wall.export.rendering')
              : t('player.wall.export.cta')}
          </button>
        </div>
      )}

      {toast && (
        <div className={styles.toast} role='status'>
          {toast}
        </div>
      )}

      {overlayUrl && (
        <div
          className={styles.exportOverlay}
          role='dialog'
          aria-modal='true'
          aria-label={t('player.wall.export.aria')}
          onKeyDown={(e) => {
            if (e.key === 'Escape') closeOverlay();
          }}
        >
          <p>{t('player.wall.export.fallback')}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={overlayUrl} alt={t('player.wall.export.aria')} />
          <button
            ref={overlayCloseRef}
            className={styles.exportOverlayClose}
            onClick={closeOverlay}
          >
            {t('player.wall.export.close')}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {stage === 'locked' && renderLocked()}
      {stage === 'unlock' && renderUnlock()}
      {stage === 'wall' && renderWall()}
    </>
  );
};
