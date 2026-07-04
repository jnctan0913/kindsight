'use client';

import React from 'react';

import {components} from '../../../components';
import {useT} from '../../../i18n';
import type {HostRosterEntry} from '../../../mock/room';
import {QRPanel} from '../components/QRPanel';
import {ClaimStatusTable} from '../components/ClaimStatusTable';
import {consoleCard, cardHeading, dosisFont} from '../components/hostStyles';

type Props = {
  code: string;
  joinUrl: string;
  roster: HostRosterEntry[];
  onStart: () => void;
};

export const LobbyContent: React.FC<Props> = ({
  code,
  joinUrl,
  roster,
  onStart,
}) => {
  const t = useT();
  const claimed = roster.filter((r) => r.claimed).length;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: 24,
          flexWrap: 'wrap',
          alignItems: 'flex-start',
        }}
      >
        <div style={{flex: '2 1 420px', minWidth: 300}}>
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
              <ClaimStatusTable roster={roster} />
            </div>
          </div>
        </div>

        <div style={{flex: '1 1 260px', minWidth: 240}}>
          <QRPanel code={code} joinUrl={joinUrl} />
        </div>
      </div>

      <components.Button
        label={t('host.lobby.start')}
        onClick={onStart}
        colorScheme='primary'
        containerStyle={{marginTop: 24, maxWidth: 320}}
        style={{textTransform: 'none'}}
      />
    </div>
  );
};
