'use client';

import React, {useState} from 'react';

import {useT} from '../../../i18n';
import type {RevealStatus} from '../../../mock/room';
import {RevealStatusList} from './RevealStatusList';
import {consoleCard, cardHeading, dosisFont} from './hostStyles';

type Props = {
  statuses: {name: string; status: RevealStatus}[];
};

// Reveal pacing meter plus the per-player status list. The name list is
// collapsed by default so the card stays compact; the host expands it on demand.
export const RevealProgressCard: React.FC<Props> = ({statuses}) => {
  const t = useT();
  const [showNames, setShowNames] = useState(false);

  const total = statuses.length;
  const opened = statuses.filter((s) => s.status !== 'locked').length;
  const finished = statuses.filter((s) => s.status === 'done').length;
  const finishedPct = total > 0 ? Math.round((finished / total) * 100) : 0;

  return (
    <div style={consoleCard}>
      <span style={cardHeading}>{t('host.wrap.progress.title')}</span>
      <p
        style={{
          marginTop: 12,
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--main-color)',
          fontFamily: dosisFont,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {t('host.wrap.progress.meter', {done: finished, total})}
      </p>
      <div
        aria-hidden='true'
        style={{
          marginTop: 10,
          height: 8,
          borderRadius: 'var(--radius-pill)',
          backgroundColor: 'var(--host-surface)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${finishedPct}%`,
            height: '100%',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--accent-color)',
            transition: 'width 300ms ease-in-out',
          }}
        />
      </div>
      {opened > 0 && (
        <p className='t12' style={{marginTop: 8}}>
          {t('host.wrap.progress.opened', {opened})}
        </p>
      )}

      <div
        style={{
          marginTop: 16,
          paddingTop: 16,
          borderTop: '1px solid var(--border-color)',
        }}
      >
        <button
          type='button'
          className='clickable'
          aria-expanded={showNames}
          onClick={() => setShowNames((v) => !v)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--main-color)',
            fontFamily: dosisFont,
          }}
        >
          <span>{t('host.wrap.status.title')}</span>
          <span
            aria-hidden='true'
            style={{
              display: 'inline-block',
              fontSize: 12,
              color: 'var(--text-color)',
              transform: showNames ? 'rotate(180deg)' : 'none',
              transition: 'transform 150ms ease',
            }}
          >
            {'\u25BE'}
          </span>
        </button>

        {showNames && (
          <div style={{marginTop: 12}}>
            <RevealStatusList statuses={statuses} bare />
          </div>
        )}
      </div>
    </div>
  );
};
