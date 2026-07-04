'use client';

import React from 'react';

import {useT} from '../../../i18n';
import type {HostRosterEntry} from '../../../mock/room';
import {QRPanel} from '../components/QRPanel';
import {ClaimStatusTable} from '../components/ClaimStatusTable';
import {consoleCard, cardHeading, consoleGrid, span, dosisFont} from '../components/hostStyles';

type Props = {
  code: string;
  joinUrl: string;
  roster: HostRosterEntry[];
  onOpenBigScreen?: () => void;
};

export const LobbyContent: React.FC<Props> = ({
  code,
  joinUrl,
  roster,
  onOpenBigScreen,
}) => {
  const t = useT();
  const claimed = roster.filter((r) => r.claimed).length;

  return (
    <div style={consoleGrid}>
      <div style={{...consoleCard, ...span(7)}}>
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
          <ClaimStatusTable roster={roster} />
        </div>
      </div>

      <div style={span(5)}>
        <QRPanel code={code} joinUrl={joinUrl} onOpenBigScreen={onOpenBigScreen} />
      </div>
    </div>
  );
};
