'use client';

import React, {useEffect, useMemo, useState} from 'react';

import {asset} from '@/config';
import {components} from '@/components';
import {LanguageToggle, useT} from '@/i18n';
import type {StringKey} from '@/i18n';
import {assignAvatars} from '@/lib/avatar';
import {useRoomStore} from '@/stores/room';
import type {NoteFrame, TargetNote} from '@/lib/types';

import styles from '../player.module.scss';

const MAX = 240;

const FRAMES: {key: NoteFrame; label: StringKey; stem: StringKey}[] = [
  {key: 'moment', label: 'frame.moment.label', stem: 'frame.moment.stem'},
  {key: 'strength', label: 'frame.strength.label', stem: 'frame.strength.stem'},
  {key: 'wish', label: 'frame.wish.label', stem: 'frame.wish.stem'},
];

function frameLabel(f: NoteFrame): StringKey {
  const meta = FRAMES.find((x) => x.key === f);
  return meta ? meta.label : 'frame.moment.label';
}

function frameStem(f: NoteFrame): StringKey {
  const meta = FRAMES.find((x) => x.key === f);
  return meta ? meta.stem : 'frame.moment.stem';
}

export const WriteContent: React.FC = () => {
  const t = useT();
  const mode = useRoomStore((s) => s.mode);
  const me = useRoomStore((s) => s.me);
  const roster = useRoomStore((s) => s.roster);
  const currentRound = useRoomStore((s) => s.currentRound);
  const roundCount = useRoomStore((s) => s.roundCount);
  const submitNote = useRoomStore((s) => s.submitNote);
  const loadTargetNotes = useRoomStore((s) => s.loadTargetNotes);

  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [frame, setFrame] = useState<NoteFrame | null>(null);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentToast, setSentToast] = useState(false);
  const [priorOpen, setPriorOpen] = useState(false);
  const [priorNotes, setPriorNotes] = useState<TargetNote[] | null>(null);
  const [priorLoading, setPriorLoading] = useState(false);

  const avatars = useMemo(
    () => assignAvatars(roster.map((r) => r.participant_id)),
    [roster],
  );

  const isModeA = mode === 'round_robin';
  const assignment = me?.assignment ?? null;
  const resolvedTarget = isModeA ? (assignment?.target_id ?? null) : selectedTarget;

  // The read-first accordion is scoped to one target; a new target resets it.
  useEffect(() => {
    setPriorOpen(false);
    setPriorNotes(null);
  }, [resolvedTarget]);

  // The success toast is a transient acknowledgement, not a persistent banner.
  useEffect(() => {
    if (!sentToast) return;
    const id = setTimeout(() => setSentToast(false), 3000);
    return () => clearTimeout(id);
  }, [sentToast]);

  const errorMessage = (reason: string): string => {
    switch (reason) {
      case 'cap':
        return t('player.write.error.cap');
      case 'spacing':
        return t('player.write.error.spacing');
      case 'duplicate':
        return t('player.write.error.duplicate');
      case 'round_done':
        return t('player.write.error.roundDone');
      case 'not_target':
        return t('player.write.error.notTarget');
      case 'self':
        return t('player.write.error.self');
      case 'not_started':
      case 'closed':
        return t('player.write.error.closed');
      default:
        return t('player.write.error.generic');
    }
  };

  const togglePrior = async () => {
    if (priorOpen) {
      setPriorOpen(false);
      return;
    }
    setPriorOpen(true);
    if (priorNotes === null && resolvedTarget) {
      setPriorLoading(true);
      try {
        const notes = await loadTargetNotes(resolvedTarget);
        setPriorNotes(notes);
      } catch {
        setPriorNotes([]);
      } finally {
        setPriorLoading(false);
      }
    }
  };

  const trimmed = content.trim();
  const canSend = !!resolvedTarget && !!frame && trimmed.length > 0 && !sending;

  const handleSend = async () => {
    if (!resolvedTarget || !frame || trimmed.length === 0 || sending) return;
    setSending(true);
    setError(null);
    const outcome = await submitNote({targetId: resolvedTarget, frame, content: trimmed});
    setSending(false);
    if (outcome.ok) {
      setSentToast(true);
      setContent('');
      setFrame(null);
      setPriorOpen(false);
      setPriorNotes(null);
      // Mode B: drop the selection so they pick the next person. Mode A: the
      // snapshot auto-refresh flips this screen to the done card.
      if (!isModeA) setSelectedTarget(null);
    } else {
      setError(errorMessage(outcome.reason));
    }
  };

  const shell = (children: React.ReactNode) => (
    <components.Screen>
      <div className={styles.aura} aria-hidden='true' />
      <components.Header rightSlot={<LanguageToggle />} />
      {children}
    </components.Screen>
  );

  const centeredCard = (title: string, body: string, mascotPose: string) =>
    shell(
      <main className={`container scrollable ${styles.center}`}>
        <img
          src={asset(`/assets/kindsight/${mascotPose}`)}
          alt=''
          aria-hidden='true'
          className={`${styles.mascotSm} ${styles.bob}`}
        />
        <div
          className={`${styles.card} ${styles.cardWide} ${styles.rise}`}
          style={{marginTop: 20}}
          aria-live='polite'
        >
          <h2 style={{color: 'var(--main-color)'}}>{title}</h2>
          <p className='t16' style={{marginTop: 12}}>
            {body}
          </p>
        </div>
      </main>,
    );

  // Loading guard: the snapshot has not resolved a player identity yet.
  if (!me) {
    return shell(
      <main
        className='container'
        style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}
      >
        <p className='t16'>{t('player.loading')}</p>
      </main>,
    );
  }

  // Mode A, between assignments: nothing to write until the next round hands
  // this player a person.
  if (isModeA && !assignment) {
    return centeredCard(
      t('player.write.waiting.title'),
      t('player.write.waiting.body'),
      'mascot-peek.png',
    );
  }

  // Mode A, already sent this round's note: the round stays open but this
  // player is done for now.
  const submittedThisRound = me.sent.some((s) => !s.is_bonus && s.round === currentRound);
  if (isModeA && assignment && submittedThisRound) {
    return centeredCard(
      t('player.write.done.title'),
      t('player.write.done.body'),
      'mascot-cheer.png',
    );
  }

  const resolvedTargetName = isModeA
    ? (assignment?.display_name ?? '')
    : (roster.find((r) => r.participant_id === selectedTarget)?.display_name ?? '');

  const targets = roster.filter((r) => r.claimed && r.participant_id !== me.participant_id);

  const nudge =
    trimmed.length > 0 && trimmed.length < 12
      ? t('player.write.nudge.short')
      : trimmed.length >= 12 && !/\s/.test(trimmed)
        ? t('player.write.nudge.generic')
        : '';

  const progressPct =
    roundCount && roundCount > 0
      ? Math.min(100, Math.round((currentRound / roundCount) * 100))
      : 0;

  return shell(
    <>
      <main className='container scrollable' style={{flex: 1, paddingBottom: 20}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, gap: 12}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 10, minWidth: 0}}>
            <img
              src={asset('/assets/kindsight/mascot-write.png')}
              alt=''
              aria-hidden='true'
              style={{width: 44, height: 44, objectFit: 'contain', flexShrink: 0}}
            />
            <h2 style={{margin: 0}}>{t('player.write.title')}</h2>
          </div>
          <span className={styles.modePill} style={{flexShrink: 0}}>
            {isModeA ? t('player.briefing.mode.a') : t('player.briefing.mode.b')}
          </span>
        </div>

        {isModeA ? (
          <>
            {roundCount && roundCount > 0 && (
              <div className={styles.progressRow} style={{marginTop: 14}}>
                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} style={{width: `${progressPct}%`}} />
                </div>
                <span className={styles.progressLabel}>
                  {t('player.write.round', {n: currentRound, total: roundCount})}
                </span>
              </div>
            )}
            <div className={`${styles.targetBanner} ${styles.rise}`} style={{marginTop: 14}}>
              <components.Avatar avatarId={avatars.get(assignment?.target_id ?? '')} size='md' />
              <div>
                <span className={styles.targetLabel}>{t('player.write.to.assigned')}</span>
                <p className={styles.targetName} style={{marginTop: 4}}>
                  {resolvedTargetName}
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <label
              className='t14'
              style={{
                display: 'block',
                marginTop: 16,
                marginBottom: 10,
                fontWeight: 600,
                color: 'var(--main-color)',
              }}
            >
              {t('player.write.to.label')}
            </label>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: 10}}>
              {targets.map((entry) => {
                const written = me.sent.some((s) => s.target_id === entry.participant_id);
                return (
                  <components.RosterChip
                    key={entry.participant_id}
                    name={entry.display_name}
                    avatarId={avatars.get(entry.participant_id)}
                    taken={written}
                    takenLabel={t('player.write.written')}
                    selected={selectedTarget === entry.participant_id}
                    onClick={() =>
                      setSelectedTarget(
                        selectedTarget === entry.participant_id ? null : entry.participant_id,
                      )
                    }
                  />
                );
              })}
            </div>
          </>
        )}

        {resolvedTarget && (
          <div className={styles.rise}>
            {/* Read-first accordion: see what this person already has before adding. */}
            <button
              onClick={() => void togglePrior()}
              aria-expanded={priorOpen}
              className={`clickable ${styles.accordionToggle}`}
              style={{marginTop: 18}}
            >
              {priorOpen ? '\u25BE' : '\u25B8'}
              {t('player.write.prior.toggle', {name: resolvedTargetName})}
            </button>
            {priorOpen && (
              <div style={{marginTop: 4}}>
                {priorLoading ? (
                  <p className='t14' style={{marginTop: 8}}>
                    {t('player.loading')}
                  </p>
                ) : priorNotes && priorNotes.length > 0 ? (
                  priorNotes.map((note, i) => (
                    <div key={i} className={styles.card} style={{marginTop: 8}}>
                      <components.FrameTag label={t(frameLabel(note.frame))} />
                      <p className='t14' style={{marginTop: 8, color: 'var(--main-color)'}}>
                        {note.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <div
                    className={styles.card}
                    style={{
                      marginTop: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <img
                      src={asset('/assets/kindsight/empty-notes-soft.png')}
                      alt=''
                      aria-hidden='true'
                      style={{width: 72, height: 72, objectFit: 'contain', flexShrink: 0}}
                    />
                    <p className='t14' style={{fontStyle: 'italic'}}>
                      {t('player.write.prior.empty')}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Frame selector: a required single choice. */}
            <div style={{marginTop: 20}}>
              <label
                className='t14'
                style={{display: 'block', fontWeight: 600, color: 'var(--main-color)'}}
              >
                {t('player.write.frame.label')}
              </label>
              <div className={styles.frameRow} style={{marginTop: 10}}>
                {FRAMES.map((f) => {
                  const active = frame === f.key;
                  return (
                    <button
                      key={f.key}
                      onClick={() => setFrame(f.key)}
                      aria-pressed={active}
                      className={`clickable ${styles.frameBtn} ${active ? styles.frameBtnActive : ''}`}
                    >
                      {t(f.label)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Composer */}
            <div style={{marginTop: 20}}>
              <textarea
                value={content}
                maxLength={MAX}
                onChange={(e) => setContent(e.target.value)}
                aria-label={t('player.write.title')}
                placeholder={frame ? t(frameStem(frame)) : t('player.write.placeholder')}
                className={styles.composer}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: 12,
                  marginTop: 6,
                }}
              >
                <span
                  aria-live='polite'
                  className='t12'
                  style={{color: 'var(--warn-color)', minHeight: 16}}
                >
                  {nudge}
                </span>
                <span
                  className={`t12 ${styles.counter}`}
                  style={{color: 'var(--text-color)', flexShrink: 0}}
                >
                  {t('player.write.counter', {n: content.length, max: MAX})}
                </span>
              </div>
            </div>

            {error && (
              <p role='alert' className='t14' style={{color: 'var(--warn-color)', marginTop: 12}}>
                {error}
              </p>
            )}
            <div aria-live='polite'>
              {sentToast && (
                <p
                  className='t14'
                  style={{color: 'var(--accent-deep)', fontWeight: 600, marginTop: 12}}
                >
                  {t('player.write.sent')}
                </p>
              )}
            </div>
          </div>
        )}
      </main>
      <footer className={styles.footer}>
        <components.Button
          label={sending ? t('player.write.sending') : t('player.write.send')}
          onClick={() => void handleSend()}
          colorScheme='secondary'
          className='pressable'
          style={{
            textTransform: 'none',
            opacity: canSend ? 1 : 0.5,
            boxShadow: 'var(--shadow-soft), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          }}
        />
      </footer>
    </>,
  );
};
