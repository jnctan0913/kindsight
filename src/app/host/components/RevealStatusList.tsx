'use client';

import React from 'react';

import {useT} from '../../../i18n';
import type {StringKey} from '../../../i18n';
import type {RevealStatus} from '../../../mock/room';
import {consoleCard, cardHeading, dosisFont} from './hostStyles';

type Props = {
  statuses: {name: string; status: RevealStatus}[];
};

const statusKey: Record<RevealStatus, StringKey> = {
  holding: 'host.wrap.status.holding',
  reading: 'host.wrap.status.reading',
  finished: 'host.wrap.status.finished',
};

const statusColor: Record<RevealStatus, string> = {
  holding: 'var(--text-color)',
  reading: 'var(--main-color)',
  finished: 'var(--accent-deep)',
};

export const RevealStatusList: React.FC<Props> = ({statuses}) => {
  const t = useT();

  return (
    <div style={consoleCard}>
      <span style={cardHeading}>{t('host.wrap.status.title')}</span>
      <ul style={{marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10}}>
        {statuses.map((s) => (
          <li
            key={s.name}
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
              {s.name}
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: statusColor[s.status],
                fontFamily: dosisFont,
              }}
            >
              {t(statusKey[s.status])}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
