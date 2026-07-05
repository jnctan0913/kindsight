'use client';

import React from 'react';

import {components} from '../../../components';
import {useT} from '../../../i18n';
import {consoleCard, cardHeading, numFont} from './hostStyles';

type Props = {
  round: number;
  totalRounds: number;
  timer: string;
  paused: boolean;
  graceRunning: boolean;
  roundsComplete: boolean;
  onTogglePause: () => void;
  onAdvance: () => void;
};

export const RoundControlCard: React.FC<Props> = ({
  round,
  totalRounds,
  timer,
  paused,
  graceRunning,
  roundsComplete,
  onTogglePause,
  onAdvance,
}) => {
  const t = useT();
  const advanceDisabled = paused || graceRunning || roundsComplete;

  return (
    <div style={consoleCard}>
      <span style={cardHeading}>{t('host.game.round', {n: round, total: totalRounds})}</span>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginTop: 14,
        }}
      >
        <span
          style={{
            fontSize: 40,
            fontWeight: 700,
            color: 'var(--main-color)',
            fontFamily: numFont,
            letterSpacing: '0.02em',
          }}
        >
          {timer}
        </span>
        <button
          className='clickable'
          onClick={onTogglePause}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--host-surface)',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--main-color)',
            fontFamily: 'var(--font-dosis), var(--font-noto-sc), sans-serif',
          }}
        >
          {paused ? t('host.game.resume') : t('host.game.pause')}
        </button>
      </div>

      <components.Button
        label={t('host.game.advance')}
        onClick={advanceDisabled ? undefined : onAdvance}
        disabled={advanceDisabled}
        colorScheme='secondary'
        containerStyle={{marginTop: 16}}
        style={{textTransform: 'none', height: 46}}
      />

      {graceRunning ? (
        <p
          className='t14'
          role='status'
          style={{marginTop: 12, color: 'var(--warn-color)'}}
        >
          {t('host.game.grace')}
        </p>
      ) : roundsComplete ? (
        <p className='t14' role='status' style={{marginTop: 12}}>
          {t('host.game.roundsComplete')}
        </p>
      ) : null}
    </div>
  );
};
