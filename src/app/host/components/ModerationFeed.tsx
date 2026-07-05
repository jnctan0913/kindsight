'use client';

import React, {useState} from 'react';

import {components} from '../../../components';
import {useT} from '../../../i18n';
import type {StringKey} from '../../../i18n';
import type {FrameKey, HostNote} from '../../../mock/room';
import {ConfirmDialog} from './ConfirmDialog';
import {consoleCard, cardHeading, dosisFont} from './hostStyles';

type Props = {
  notes: HostNote[];
  onRemove: (id: string) => void;
  // Fill the parent's height and scroll the feed internally (writing dashboard).
  fill?: boolean;
};

const frameLabelKey: Record<FrameKey, StringKey> = {
  moment: 'frame.moment.label',
  strength: 'frame.strength.label',
  wish: 'frame.wish.label',
};

export const ModerationFeed: React.FC<Props> = ({notes, onRemove, fill = false}) => {
  const t = useT();
  const [pending, setPending] = useState<string | null>(null);

  return (
    <div
      style={
        fill
          ? {...consoleCard, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0}
          : consoleCard
      }
    >
      <span style={cardHeading}>{t('host.mod.title')}</span>

      <ul
        style={{
          marginTop: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          ...(fill ? {flex: '1 1 auto', minHeight: 0, overflowY: 'auto'} : null),
        }}
      >
        {notes.map((note) => (
          <li
            key={note.id}
            style={{
              padding: 14,
              borderRadius: 'var(--radius-control)',
              backgroundColor: 'var(--host-surface)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                <span
                  className='t14'
                  style={{color: 'var(--main-color)', fontWeight: 600}}
                >
                  {t('host.mod.to', {name: note.target})}
                </span>
                <components.FrameTag label={t(frameLabelKey[note.frame])} />
              </div>
              <button
                className='clickable'
                onClick={() => setPending(note.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'var(--white-color)',
                  boxShadow: 'var(--shadow-soft)',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--warn-color)',
                  fontFamily: dosisFont,
                }}
              >
                {t('host.mod.remove')}
              </button>
            </div>
            <p
              className='t14'
              style={{marginTop: 8, color: 'var(--main-color)', lineHeight: 1.5}}
            >
              {note.content}
            </p>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={pending !== null}
        danger
        title={t('host.mod.remove')}
        body={t('host.mod.confirm')}
        confirmLabel={t('host.mod.remove')}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) onRemove(pending);
          setPending(null);
        }}
      />
    </div>
  );
};
