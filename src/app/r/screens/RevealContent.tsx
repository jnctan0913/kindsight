'use client';

import React, {useCallback, useEffect, useRef, useState} from 'react';

import styles from '@/app/reveal-demo/reveal.module.scss';
import {NoteCard} from '@/app/reveal-demo/NoteCard';
import {HoldToRevealButton} from '@/app/reveal-demo/HoldToRevealButton';
import {
  renderShareImage,
  saveWallImage,
  saveImages,
  type ExportFonts,
  type ShareCardStrings,
} from '@/lib/export';
import {
  SHARE_BACKGROUNDS,
  SHARE_FORMATS,
  type ShareFormat,
} from '@/lib/shareBackgrounds';
import {asset} from '@/config';
import {useT} from '@/i18n';
import type {StringKey} from '@/i18n';
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
  const [markedDone, setMarkedDone] = useState(false);

  const [overlayUrl, setOverlayUrl] = useState<string | null>(null);
  const overlayCloseRef = useRef<HTMLButtonElement | null>(null);
  const exportBtnRef = useRef<HTMLButtonElement | null>(null);

  // Share composer state.
  const [composerOpen, setComposerOpen] = useState(false);
  const [format, setFormat] = useState<ShareFormat>('wallpaper');
  const [bgIndex, setBgIndex] = useState(0);
  const [noteIndex, setNoteIndex] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewRendering, setPreviewRendering] = useState(false);
  const [batchRendering, setBatchRendering] = useState(false);
  const previewBlobRef = useRef<Blob | null>(null);

  const count = me?.wall_count ?? 0;
  const noteCount = wall?.length ?? 0;

  const shareStrings = useCallback(
    (): ShareCardStrings => ({
      wordmark: 'Kindsight',
      attribution: t('player.share.attribution'),
      frameLabel: {
        moment: t('frame.moment.label'),
        strength: t('frame.strength.label'),
        wish: t('frame.wish.label'),
      },
    }),
    [t],
  );

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

  // Keep the selected note index in range as the wall loads or changes.
  useEffect(() => {
    if (noteIndex > noteCount - 1) setNoteIndex(Math.max(0, noteCount - 1));
  }, [noteCount, noteIndex]);

  // Render the previewed card whenever the selection changes. The blob is kept
  // in a ref so the save tap stays synchronous (the iOS share-gesture rule).
  useEffect(() => {
    if (!composerOpen || !wall || wall.length === 0) return;
    const note = wall[Math.min(noteIndex, wall.length - 1)];
    if (!note) return;
    const bg = SHARE_BACKGROUNDS[bgIndex];

    let cancelled = false;
    setPreviewRendering(true);
    renderShareImage(
      {frame: note.frame, content: note.content},
      {
        format,
        fonts: resolveFonts(),
        strings: shareStrings(),
        background: {
          src: asset(bg.src),
          tone: bg.tone,
          anchor: format === 'wallpaper' ? bg.wallpaperAnchor : bg.squareAnchor,
          focus: bg.squareFocus,
        },
      },
    )
      .then((blob) => {
        if (cancelled) return;
        previewBlobRef.current = blob;
        const url = URL.createObjectURL(blob);
        setPreviewUrl((old) => {
          if (old) URL.revokeObjectURL(old);
          return url;
        });
      })
      .finally(() => {
        if (!cancelled) setPreviewRendering(false);
      });
    return () => {
      cancelled = true;
    };
  }, [composerOpen, format, bgIndex, noteIndex, wall, shareStrings]);

  // Revoke the preview object URL when the composer closes.
  useEffect(() => {
    if (composerOpen) return;
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    previewBlobRef.current = null;
  }, [composerOpen]);

  useEffect(() => {
    if (overlayUrl) overlayCloseRef.current?.focus();
  }, [overlayUrl]);

  const onUnlockComplete = useCallback(() => {
    void setReveal('reading');
    setStage('wall');
  }, [setReveal]);

  // Signals the host's reveal-status list that this player has finished reading.
  const onDoneReading = useCallback(() => {
    setMarkedDone(true);
    void setReveal('done');
  }, [setReveal]);

  // Single save. Runs synchronously off the pre-rendered preview blob so iOS
  // keeps the share gesture alive.
  const onSaveThis = useCallback(() => {
    const blob = previewBlobRef.current;
    if (!blob) return;
    saveWallImage(blob, {
      fileName: `kindsight-${format}-${noteIndex + 1}.png`,
      onLongPress: (url) => setOverlayUrl(url),
    }).then((result) => {
      if (result !== 'longpress') setToast(t('player.share.success'));
    });
  }, [t, format, noteIndex]);

  // Batch save: one image per note, rotating backgrounds for variety.
  const onSaveAll = useCallback(async () => {
    if (!wall || wall.length === 0 || batchRendering) return;
    setBatchRendering(true);
    try {
      const items: {blob: Blob; fileName: string}[] = [];
      for (let i = 0; i < wall.length; i++) {
        const note = wall[i];
        const bg = SHARE_BACKGROUNDS[i % SHARE_BACKGROUNDS.length];
        const blob = await renderShareImage(
          {frame: note.frame, content: note.content},
          {
            format,
            fonts: resolveFonts(),
            strings: shareStrings(),
            background: {
              src: asset(bg.src),
              tone: bg.tone,
              anchor:
                format === 'wallpaper' ? bg.wallpaperAnchor : bg.squareAnchor,
              focus: bg.squareFocus,
            },
          },
        );
        items.push({blob, fileName: `kindsight-${format}-${i + 1}.png`});
      }
      const result = await saveImages(items);
      if (result !== 'longpress') setToast(t('player.share.success'));
    } finally {
      setBatchRendering(false);
    }
  }, [wall, batchRendering, format, shareStrings, t]);

  const openComposer = useCallback(() => setComposerOpen(true), []);
  const closeComposer = useCallback(() => {
    setComposerOpen(false);
    exportBtnRef.current?.focus();
  }, []);

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
      <h2
        style={{
          marginTop: 64,
          textAlign: 'center',
          maxWidth: 260,
          textWrap: 'balance',
        }}
      >
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
            onClick={openComposer}
          >
            {t('player.wall.export.cta')}
          </button>
          {markedDone ? (
            <p
              role='status'
              className={styles.wallHint}
              style={{marginTop: 10, textAlign: 'center'}}
            >
              {t('player.wall.done.confirm')}
            </p>
          ) : (
            <button
              className={styles.soundToggle}
              style={{marginTop: 10}}
              onClick={onDoneReading}
            >
              {t('player.wall.done.cta')}
            </button>
          )}
        </div>
      )}

      {composerOpen && wall && wall.length > 0 && (
        <div
          className={styles.composer}
          role='dialog'
          aria-modal='true'
          aria-label={t('player.share.title')}
          onKeyDown={(e) => {
            if (e.key === 'Escape') closeComposer();
          }}
        >
          <div className={styles.composerScroll}>
            <div className={styles.composerHead}>
              <h3>{t('player.share.title')}</h3>
              <p>{t('player.share.subtitle')}</p>
            </div>

            <div
              className={styles.previewWrap}
              data-format={format}
              aria-busy={previewRendering}
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt={t('player.wall.export.aria')} />
              ) : (
                <div className={styles.previewSkeleton}>
                  {t('player.share.rendering')}
                </div>
              )}
            </div>

            <div
              className={styles.segmented}
              role='group'
              aria-label={t('player.share.title')}
            >
              {SHARE_FORMATS.map((f) => (
                <button
                  key={f.id}
                  className={`pressable ${format === f.id ? styles.segActive : ''}`}
                  aria-pressed={format === f.id}
                  onClick={() => setFormat(f.id)}
                >
                  {t(`player.share.format.${f.id}` as StringKey)}
                </button>
              ))}
            </div>

            <div
              className={styles.bgRow}
              role='group'
              aria-label={t('player.share.background.aria')}
            >
              {SHARE_BACKGROUNDS.map((b, i) => (
                <button
                  key={b.id}
                  className={`pressable ${styles.bgThumb} ${bgIndex === i ? styles.bgThumbActive : ''}`}
                  style={{backgroundImage: `url(${asset(b.src)})`}}
                  aria-pressed={bgIndex === i}
                  aria-label={t(`player.share.bg.${b.id}` as StringKey)}
                  onClick={() => setBgIndex(i)}
                >
                  <span>{t(`player.share.bg.${b.id}` as StringKey)}</span>
                </button>
              ))}
            </div>

            {wall.length > 1 && (
              <div
                className={styles.noteRow}
                role='group'
                aria-label={t('player.share.note.label')}
              >
                {wall.map((n, i) => (
                  <button
                    key={n.note_id}
                    className={`pressable ${styles.noteChip} ${noteIndex === i ? styles.noteChipActive : ''}`}
                    aria-pressed={noteIndex === i}
                    onClick={() => setNoteIndex(i)}
                  >
                    <span className={styles.noteChipPill}>
                      {t(`frame.${n.frame}.label` as StringKey)}
                    </span>
                    <span className={styles.noteChipText}>{n.content}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.composerActions}>
            <button
              className={`${styles.primaryButton} pressable`}
              style={{
                marginTop: 0,
                borderRadius: 50,
                boxShadow:
                  'var(--shadow-soft), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
              }}
              disabled={previewRendering || batchRendering || !previewUrl}
              onClick={onSaveThis}
            >
              {previewRendering ? t('player.share.rendering') : t('player.share.save')}
            </button>
            <div className={styles.composerActionsRow}>
              {wall.length > 1 && (
                <button
                  className={`${styles.composerGhost} pressable`}
                  disabled={batchRendering}
                  onClick={onSaveAll}
                >
                  {batchRendering
                    ? t('player.share.batch')
                    : t('player.share.saveAll')}
                </button>
              )}
              <button
                className={`${styles.composerGhost} pressable`}
                onClick={closeComposer}
              >
                {t('player.wall.export.close')}
              </button>
            </div>
          </div>
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
          <div className={styles.exportOverlayImageWrap}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={overlayUrl} alt={t('player.wall.export.aria')} />
          </div>
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
