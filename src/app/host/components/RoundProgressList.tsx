'use client';

import React from 'react';

import {useT} from '../../../i18n';
import type {StringKey} from '../../../i18n';
import type {RoundProgressEntry, RoundProgressState} from '../../../mock/room';
import {consoleCard, cardHeading, dosisFont} from './hostStyles';

type Props = {
  entries: RoundProgressEntry[];
  // Fill the parent's height and scroll the list internally (writing dashboard).
  fill?: boolean;
};

const stateKey: Record<RoundProgressState, StringKey> = {
  submitted: 'host.game.progress.submitted',
  writing: 'host.game.progress.writing',
  idle: 'host.game.progress.idle',
};

const stateColor: Record<RoundProgressState, string> = {
  submitted: 'var(--accent-deep)',
  writing: 'var(--main-color)',
  idle: 'var(--text-color)',
};

export const RoundProgressList: React.FC<Props> = ({entries, fill = false}) => {
  const t = useT();

  return (
    <div
      style={
        fill
          ? {...consoleCard, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0}
          : consoleCard
      }
    >
      <span style={cardHeading}>{t('host.game.progress.title')}</span>
      <ul
        style={{
          marginTop: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          ...(fill ? {flex: '1 1 auto', minHeight: 0, overflowY: 'auto'} : null),
        }}
      >
        {entries.map((entry) => (
          <li
            key={entry.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: 'var(--main-color)',
                fontFamily: dosisFont,
              }}
            >
              {entry.name}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                color: stateColor[entry.state],
                fontFamily: dosisFont,
              }}
            >
              <span
                aria-hidden='true'
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: stateColor[entry.state],
                }}
              />
              {t(stateKey[entry.state])}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
