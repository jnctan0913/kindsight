'use client';

import React from 'react';

import {useT} from '../../../i18n';
import type {HostRosterEntry} from '../../../mock/room';
import {ClaimStatusTable} from '../components/ClaimStatusTable';
import {consoleCard, cardHeading, dosisFont} from '../components/hostStyles';

type Props = {
  roster: HostRosterEntry[];
  onRename?: (id: string, name: string) => void;
  onRemove?: (id: string) => void;
};

// Lobby content is "who's here" only. Join details (code, link, share) live in
// the sticky action bar, and the QR players scan is on the big-screen preview.
export const LobbyContent: React.FC<Props> = ({roster, onRename, onRemove}) => {
  const t = useT();
  const claimed = roster.filter((r) => r.claimed).length;

  return (
    <div style={consoleCard}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={cardHeading}>{t('host.lobby.title')}</span>
        <span
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--main-color)',
            fontFamily: dosisFont,
          }}
        >
          {t('host.lobby.counter', {claimed, total: roster.length})}
        </span>
      </div>
      <div style={{marginTop: 14}}>
        <ClaimStatusTable roster={roster} onRename={onRename} onRemove={onRemove} />
      </div>
    </div>
  );
};
