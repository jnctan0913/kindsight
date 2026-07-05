'use client';

import React from 'react';

import {useT} from '../../../i18n';
import {consoleCard, cardHeading, statValue, statLabel} from './hostStyles';

type Props = {
  playersCount: number;
  notesWritten: number;
  optedInCount: number;
  opened: number;
  // Walls-opened only means something once the reveal has started.
  showOpened: boolean;
};

const Tile: React.FC<{value: number; label: string}> = ({value, label}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: 2,
      minWidth: 0,
    }}
  >
    <span style={{...statValue, fontSize: 26}}>{value}</span>
    <span style={statLabel}>{label}</span>
  </div>
);

export const SessionSummaryCard: React.FC<Props> = ({
  playersCount,
  notesWritten,
  optedInCount,
  opened,
  showOpened,
}) => {
  const t = useT();
  const tileCount = showOpened ? 4 : 3;

  return (
    <div style={consoleCard}>
      <span style={cardHeading}>{t('host.wrap.summary.title')}</span>
      <div
        style={{
          marginTop: 14,
          display: 'grid',
          gridTemplateColumns: `repeat(${tileCount}, minmax(0, 1fr))`,
          gap: 12,
        }}
      >
        <Tile value={playersCount} label={t('host.wrap.summary.players')} />
        <Tile value={notesWritten} label={t('host.wrap.summary.notes')} />
        <Tile value={optedInCount} label={t('host.wrap.summary.shared')} />
        {showOpened && <Tile value={opened} label={t('host.wrap.summary.opened')} />}
      </div>
    </div>
  );
};
