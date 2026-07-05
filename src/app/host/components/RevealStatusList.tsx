'use client';

import React from 'react';

import {useT} from '../../../i18n';
import type {StringKey} from '../../../i18n';
import type {RevealStatus} from '../../../mock/room';
import {consoleCard, cardHeading, dosisFont} from './hostStyles';

type Props = {
  statuses: {name: string; status: RevealStatus}[];
  // Fill the parent's height and scroll the list internally (wrap-up board).
  fill?: boolean;
  // Render just the list (no card wrapper, no heading) so it can nest inside
  // another card, e.g. under the reveal-progress meter.
  bare?: boolean;
};

const statusKey: Record<RevealStatus, StringKey> = {
  locked: 'host.wrap.status.locked',
  holding: 'host.wrap.status.holding',
  reading: 'host.wrap.status.reading',
  done: 'host.wrap.status.finished',
};

const statusColor: Record<RevealStatus, string> = {
  locked: 'var(--text-color)',
  holding: 'var(--text-color)',
  reading: 'var(--main-color)',
  done: 'var(--accent-deep)',
};

export const RevealStatusList: React.FC<Props> = ({
  statuses,
  fill = false,
  bare = false,
}) => {
  const t = useT();

  const list = (
    <ul
      style={{
        marginTop: bare ? 0 : 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        ...(fill ? {flex: '1 1 auto', minHeight: 0, overflowY: 'auto'} : null),
      }}
    >
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
  );

  if (bare) return list;

  return (
    <div
      style={
        fill
          ? {...consoleCard, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0}
          : consoleCard
      }
    >
      <span style={cardHeading}>{t('host.wrap.status.title')}</span>
      {list}
    </div>
  );
};
