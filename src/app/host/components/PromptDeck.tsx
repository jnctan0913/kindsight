'use client';

import React from 'react';

import {useT} from '../../../i18n';
import type {PromptItem} from '../../../lib/hostRoomSync';
import {HostIcon} from './HostIcon';
import {consoleCard, cardHeading, dosisFont} from './hostStyles';

type Props = {
  prompts: PromptItem[];
  activePromptId: string | null;
  onPush: (item: PromptItem | null) => void;
  onAdd: () => void;
  onEdit: (id: string, text: string) => void;
  onRemove: (id: string) => void;
};

export const PromptDeck: React.FC<Props> = ({
  prompts,
  activePromptId,
  onPush,
  onAdd,
  onEdit,
  onRemove,
}) => {
  const t = useT();

  return (
    <div style={consoleCard}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <span style={cardHeading}>{t('host.wrap.prompts.title')}</span>
        <button
          className='clickable'
          onClick={onAdd}
          style={{
            flexShrink: 0,
            padding: '6px 12px',
            borderRadius: 'var(--radius-pill)',
            border: '1px dashed var(--accent-color)',
            background: 'transparent',
            color: 'var(--accent-deep)',
            fontSize: 13,
            fontWeight: 700,
            fontFamily: dosisFont,
          }}
        >
          + {t('host.wrap.prompts.add')}
        </button>
      </div>
      <ul style={{marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10}}>
        {prompts.map((item) => {
          const pushed = activePromptId === item.id;
          const empty = item.text.trim().length === 0;
          return (
            <li
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: 12,
                borderRadius: 'var(--radius-control)',
                backgroundColor: 'var(--host-surface)',
                border: pushed
                  ? '2px solid var(--accent-color)'
                  : '2px solid transparent',
              }}
            >
              {pushed && (
                <span
                  aria-hidden='true'
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    flexShrink: 0,
                    backgroundColor: 'var(--accent-color)',
                  }}
                />
              )}
              <textarea
                className='t14'
                value={item.text}
                onChange={(e) => onEdit(item.id, e.target.value)}
                placeholder={t('host.wrap.prompts.placeholder')}
                rows={1}
                style={{
                  flex: '1 1 auto',
                  minWidth: 0,
                  resize: 'none',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--main-color)',
                  fontFamily: 'inherit',
                  lineHeight: 1.35,
                  outline: 'none',
                }}
              />
              <button
                className='clickable'
                onClick={() => onPush(pushed ? null : item)}
                disabled={empty && !pushed}
                aria-pressed={pushed}
                aria-label={
                  pushed ? t('host.wrap.prompts.stop') : t('host.wrap.prompts.push')
                }
                title={
                  pushed ? t('host.wrap.prompts.stop') : t('host.wrap.prompts.push')
                }
                style={{
                  flexShrink: 0,
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  border: pushed
                    ? '1px solid var(--accent-color)'
                    : '1px solid var(--border-color)',
                  backgroundColor: pushed ? 'var(--accent-color)' : 'var(--white-color)',
                  boxShadow: 'var(--shadow-soft)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: empty && !pushed ? 0.5 : 1,
                  cursor: empty && !pushed ? 'not-allowed' : 'pointer',
                }}
              >
                <HostIcon name='screen' size={17} color='var(--main-color)' />
              </button>
              <button
                className='clickable'
                onClick={() => onRemove(item.id)}
                aria-label={t('host.wrap.prompts.remove')}
                title={t('host.wrap.prompts.remove')}
                style={{
                  flexShrink: 0,
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  border: '1px solid var(--border-color)',
                  background: 'var(--white-color)',
                  color: 'var(--main-color)',
                  fontSize: 18,
                  lineHeight: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                &minus;
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
