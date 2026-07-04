'use client';

import React, {useEffect, useMemo, useState} from 'react';

import {components} from '@/components';
import {LanguageToggle, useT} from '@/i18n';
import type {StringKey} from '@/i18n';
import {assignAvatars} from '@/lib/avatar';
import {useRoomStore} from '@/stores/room';
import type {NoteFrame, TargetNote} from '@/lib/types';

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

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--white-color)',
  borderRadius: 'var(--radius-card)',
  boxShadow: 'var(--shadow-soft)',
  padding: 16,
  marginTop: 14,
};

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
      <components.Header rightSlot={<LanguageToggle />} />
      {children}
    </components.Screen>
  );

  const centeredCard = (title: string, body: string) =>
    shell(
      <main
        className='container'
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: 24,
        }}
      >
        <div style={{...cardStyle, maxWidth: 420, width: '100%'}}>
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
    return centeredCard(t('player.write.waiting.title'), t('player.write.waiting.body'));
  }

  // Mode A, already sent this round's note: the round stays open but this
  // player is done for now.
  const submittedThisRound = me.sent.some((s) => !s.is_bonus && s.round === currentRound);
  if (isModeA && assignment && submittedThisRound) {
    return centeredCard(t('player.write.done.title'), t('player.write.done.body'));
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

  const frameButtonStyle = (active: boolean): React.CSSProperties => ({
    flex: '1 1 0',
    minHeight: 48,
    padding: '0 12px',
    borderRadius: 'var(--radius-pill)',
    backgroundColor: active ? 'var(--accent-color)' : 'var(--white-color)',
    border: active ? '2px solid var(--accent-color)' : '2px solid var(--border-color)',
    boxShadow: 'var(--shadow-soft)',
    fontSize: 15,
    fontWeight: 600,
    fontFamily: 'var(--font-dosis), var(--font-noto-sc), sans-serif',
    color: 'var(--main-color)',
    transition: 'border-color 150ms ease-in-out, background-color 150ms ease-in-out',
  });

  return shell(
    <>
      <main className='container scrollable' style={{flex: 1, paddingBottom: 20}}>
        <h2 style={{marginTop: 16, marginBottom: isModeA ? 4 : 16}}>{t('player.write.title')}</h2>
        {isModeA && (
          <p className='t14' style={{marginBottom: 16, color: 'var(--text-color)'}}>
            {t('player.write.round', {n: currentRound, total: roundCount ?? currentRound})}
          </p>
        )}

        {isModeA ? (
          <div style={cardStyle}>
            <span className='t12' style={{color: 'var(--text-color)'}}>
              {t('player.write.to.assigned')}
            </span>
            <p style={{marginTop: 6, fontSize: 18, fontWeight: 600, color: 'var(--main-color)'}}>
              {resolvedTargetName}
            </p>
          </div>
        ) : (
          <>
            <label
              className='t14'
              style={{
                display: 'block',
                marginTop: 4,
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
          <div>
            {/* Read-first accordion: see what this person already has before adding. */}
            <button
              onClick={() => void togglePrior()}
              aria-expanded={priorOpen}
              className='clickable'
              style={{
                marginTop: 18,
                padding: 0,
                background: 'none',
                border: 'none',
                textAlign: 'left',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--accent-deep)',
                fontFamily: 'var(--font-dosis), var(--font-noto-sc), sans-serif',
              }}
            >
              {priorOpen ? '\u25BE ' : '\u25B8 '}
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
                    <div key={i} style={{...cardStyle, marginTop: 8}}>
                      <components.FrameTag label={t(frameLabel(note.frame))} />
                      <p className='t14' style={{marginTop: 8, color: 'var(--main-color)'}}>
                        {note.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className='t14' style={{marginTop: 8, fontStyle: 'italic'}}>
                    {t('player.write.prior.empty')}
                  </p>
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
              <div style={{display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10}}>
                {FRAMES.map((f) => {
                  const active = frame === f.key;
                  return (
                    <button
                      key={f.key}
                      onClick={() => setFrame(f.key)}
                      aria-pressed={active}
                      className='clickable'
                      style={frameButtonStyle(active)}
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
                style={{
                  width: '100%',
                  minHeight: 120,
                  resize: 'vertical',
                  padding: 14,
                  borderRadius: 'var(--radius-card)',
                  border: '2px solid var(--border-color)',
                  backgroundColor: 'var(--white-color)',
                  boxShadow: 'var(--shadow-soft)',
                  fontSize: 16,
                  lineHeight: 1.5,
                  color: 'var(--main-color)',
                  fontFamily: 'var(--font-dosis), var(--font-noto-sc), sans-serif',
                }}
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
                <span className='t12' style={{color: 'var(--text-color)', flexShrink: 0}}>
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
      <footer style={{padding: 20}}>
        <components.Button
          label={sending ? t('player.write.sending') : t('player.write.send')}
          onClick={() => void handleSend()}
          colorScheme='secondary'
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
