'use client';

import React, {useState} from 'react';

import {asset} from '../../../config';
import {components} from '../../../components';
import {LanguageToggle, useT} from '../../../i18n';
import {PasteList} from '../components/PasteList';
import {Callout} from '../components/Callout';
import {consoleCard, dosisFont, fieldLabel} from '../components/hostStyles';

type RosterItem = {id: string; name: string};

type Props = {
  initial: string[];
  onContinue: (names: string[]) => void;
  onBack?: () => void;
  submitting?: boolean;
  error?: string | null;
};

let idSeq = 0;
const nextId = () => `roster-${idSeq++}`;

export const RosterBuilderScreen: React.FC<Props> = ({
  initial,
  onContinue,
  onBack,
  submitting = false,
  error = null,
}) => {
  const t = useT();
  const [items, setItems] = useState<RosterItem[]>(() =>
    initial.map((name) => ({id: nextId(), name})),
  );
  const [single, setSingle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [dupNotice, setDupNotice] = useState<string | null>(null);

  const dedupe = (name: string, existing: RosterItem[]) => {
    const taken = new Set(existing.map((it) => it.name.toLowerCase()));
    if (!taken.has(name.toLowerCase())) return {name, renamed: false};
    let n = 2;
    let candidate = `${name} (${n})`;
    while (taken.has(candidate.toLowerCase())) {
      n += 1;
      candidate = `${name} (${n})`;
    }
    return {name: candidate, renamed: true};
  };

  const addNames = (names: string[]) => {
    setItems((prev) => {
      const acc = [...prev];
      let lastRenamed: string | null = null;
      for (const raw of names) {
        const trimmed = raw.trim();
        if (!trimmed) continue;
        const {name, renamed} = dedupe(trimmed, acc);
        if (renamed) lastRenamed = name;
        acc.push({id: nextId(), name});
      }
      setDupNotice(lastRenamed);
      return acc;
    });
  };

  const addSingle = () => {
    const trimmed = single.trim();
    if (!trimmed) return;
    addNames([trimmed]);
    setSingle('');
  };

  const remove = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const startEdit = (item: RosterItem) => {
    setEditingId(item.id);
    setEditValue(item.name);
  };

  const commitEdit = () => {
    if (!editingId) return;
    const trimmed = editValue.trim();
    setItems((prev) =>
      prev.map((it) =>
        it.id === editingId && trimmed ? {...it, name: trimmed} : it,
      ),
    );
    setEditingId(null);
    setEditValue('');
  };

  const iconBtn: React.CSSProperties = {
    width: 32,
    height: 32,
    borderRadius: 'var(--radius-control)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-color)',
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: 'var(--host-surface)',
        padding: 24,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: 640,
          margin: '0 auto',
        }}
      >
        <img
          src={asset('/assets/kindsight/kindsight-logo-transparent.png')}
          alt='Kindsight'
          style={{width: 132, height: 'auto'}}
        />
        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
          {onBack && (
            <button
              type='button'
              className='clickable t14'
              onClick={onBack}
              style={{
                background: 'none',
                border: 'none',
                textDecoration: 'underline',
                color: 'var(--text-color)',
              }}
            >
              {t('common.back')}
            </button>
          )}
          <LanguageToggle />
        </div>
      </div>

      <div style={{...consoleCard, maxWidth: 640, margin: '24px auto 0', padding: 28}}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{fontFamily: dosisFont}}>{t('host.roster.title')}</h2>
          <span className='t14'>{t('host.roster.count', {count: items.length})}</span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            addSingle();
          }}
          style={{marginTop: 20}}
        >
          <label htmlFor='single-name' style={fieldLabel}>
            {t('host.roster.add.label')}
          </label>
          <div style={{display: 'flex', gap: 12}}>
            <components.InputField
              inputType='text'
              placeholder={t('host.roster.add.label')}
              value={single}
              onChange={(e) => setSingle(e.target.value)}
              containerStyle={{flex: 1, borderRadius: 'var(--radius-control)'}}
            />
            <components.Button
              label={t('host.roster.add.cta')}
              onClick={addSingle}
              colorScheme='secondary'
              containerStyle={{width: 120}}
              style={{height: 50, textTransform: 'none'}}
            />
          </div>
        </form>

        {dupNotice && (
          <div style={{marginTop: 14}}>
            <Callout tone='info'>
              {t('host.roster.duplicate', {name: dupNotice})}
            </Callout>
          </div>
        )}

        <ul
          style={{
            marginTop: 20,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          {items.map((item) => (
            <li
              key={item.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 6px 4px 14px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--host-surface)',
              }}
            >
              {editingId === item.id ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEdit();
                  }}
                  style={{
                    width: 100,
                    border: 'none',
                    background: 'transparent',
                    fontSize: 15,
                    color: 'var(--main-color)',
                    fontFamily: dosisFont,
                  }}
                />
              ) : (
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 500,
                    color: 'var(--main-color)',
                    fontFamily: dosisFont,
                  }}
                >
                  {item.name}
                </span>
              )}
              <button
                className='clickable'
                aria-label={t('host.roster.edit')}
                onClick={() => startEdit(item)}
                style={iconBtn}
              >
                <svg width='16' height='16' viewBox='0 0 24 24' fill='none' aria-hidden='true'>
                  <path
                    d='M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3z'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinejoin='round'
                  />
                </svg>
              </button>
              <button
                className='clickable'
                aria-label={t('host.roster.remove')}
                onClick={() => remove(item.id)}
                style={iconBtn}
              >
                <svg width='16' height='16' viewBox='0 0 24 24' fill='none' aria-hidden='true'>
                  <path
                    d='M6 6l12 12M18 6L6 18'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>

        <div style={{marginTop: 24}}>
          <PasteList onAddAll={addNames} />
        </div>

        {error && (
          <div style={{marginTop: 18}}>
            <Callout tone='warning'>{error}</Callout>
          </div>
        )}

        <components.Button
          label={submitting ? t('host.roster.creating') : t('host.roster.continue')}
          onClick={() => onContinue(items.map((it) => it.name))}
          colorScheme='primary'
          disabled={items.length === 0 || submitting}
          containerStyle={{marginTop: 28}}
          style={{
            textTransform: 'none',
            opacity: items.length === 0 || submitting ? 0.45 : 1,
          }}
        />
      </div>
    </div>
  );
};
