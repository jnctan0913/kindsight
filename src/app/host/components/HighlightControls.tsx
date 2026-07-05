'use client';

import React from 'react';

import {useT} from '../../../i18n';
import type {StringKey} from '../../../i18n';
import {joinHighlightTargets, parseHighlightTargets} from '../../../lib/hostRoomSync';
import type {HighlightMode} from '../../../lib/types';
import {consoleCard, dosisFont} from './hostStyles';

type Props = {
  enabled: boolean;
  mode: HighlightMode;
  target: string | null;
  optedInCount: number;
  people: string[];
  onToggle: (enabled: boolean) => void;
  onModeChange: (mode: HighlightMode) => void;
  onTargetChange: (name: string | null) => void;
};

const MODES: {mode: HighlightMode; key: StringKey}[] = [
  {mode: 'grid', key: 'host.wrap.highlight.mode.grid'},
  {mode: 'person', key: 'host.wrap.highlight.mode.person'},
];

const chipBase: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 'var(--radius-pill)',
  fontSize: 13,
  fontWeight: 600,
  fontFamily: dosisFont,
  cursor: 'pointer',
  border: '2px solid transparent',
  transition: 'background-color 150ms ease, border-color 150ms ease',
};

export const HighlightControls: React.FC<Props> = ({
  enabled,
  mode,
  target,
  optedInCount,
  people,
  onToggle,
  onModeChange,
  onTargetChange,
}) => {
  const t = useT();
  const disabled = optedInCount === 0;
  const selected = new Set(parseHighlightTargets(target));

  return (
    <div style={consoleCard}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--main-color)',
              fontFamily: dosisFont,
            }}
          >
            {t('host.wrap.highlight.label')}
          </p>
          <p className='t12' style={{marginTop: 4}}>
            {disabled
              ? t('host.wrap.highlight.disabled')
              : t('host.wrap.highlight.count', {count: optedInCount})}
          </p>
        </div>

        <button
          type='button'
          role='switch'
          aria-checked={enabled && !disabled}
          aria-label={t('host.wrap.highlight.label')}
          disabled={disabled}
          className={disabled ? undefined : 'clickable'}
          onClick={disabled ? undefined : () => onToggle(!enabled)}
          style={{
            flexShrink: 0,
            width: 52,
            height: 30,
            borderRadius: 'var(--radius-pill)',
            padding: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: enabled && !disabled ? 'flex-end' : 'flex-start',
            backgroundColor:
              enabled && !disabled ? 'var(--accent-color)' : 'var(--border-color)',
            opacity: disabled ? 0.5 : 1,
            transition: 'background-color 150ms ease-in-out',
          }}
        >
          <span
            aria-hidden='true'
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              backgroundColor: 'var(--white-color)',
              boxShadow: 'var(--shadow-soft)',
            }}
          />
        </button>
      </div>

      {enabled && !disabled && (
        <>
          <div style={{marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8}}>
            {MODES.map(({mode: m, key}) => {
              const active = mode === m;
              return (
                <button
                  key={m}
                  type='button'
                  className='clickable'
                  aria-pressed={active}
                  onClick={() => onModeChange(m)}
                  style={{
                    ...chipBase,
                    backgroundColor: active ? 'var(--accent-color)' : 'var(--host-surface)',
                    borderColor: active ? 'var(--accent-color)' : 'transparent',
                    color: 'var(--main-color)',
                  }}
                >
                  {t(key)}
                </button>
              );
            })}
          </div>

          {mode === 'person' && (
            <div style={{marginTop: 12}}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <p className='t12'>
                  {people.length === 0
                    ? t('host.wrap.highlight.person.empty')
                    : t('host.wrap.highlight.person.hint')}
                </p>
                {selected.size > 0 && (
                  <button
                    type='button'
                    className='clickable'
                    onClick={() => onTargetChange(null)}
                    style={{
                      flexShrink: 0,
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: dosisFont,
                      color: 'var(--accent-color)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {t('host.wrap.highlight.person.clear')}
                  </button>
                )}
              </div>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
                {people.map((name) => {
                  const active = selected.has(name);
                  const toggle = () => {
                    const next = new Set(selected);
                    if (next.has(name)) next.delete(name);
                    else next.add(name);
                    onTargetChange(joinHighlightTargets([...next]));
                  };
                  return (
                    <button
                      key={name}
                      type='button'
                      className='clickable'
                      aria-pressed={active}
                      onClick={toggle}
                      style={{
                        ...chipBase,
                        backgroundColor: active
                          ? 'var(--main-color)'
                          : 'var(--white-color)',
                        borderColor: active ? 'var(--main-color)' : 'var(--border-color)',
                        color: active ? 'var(--white-color)' : 'var(--main-color)',
                        boxShadow: 'var(--shadow-soft)',
                      }}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
