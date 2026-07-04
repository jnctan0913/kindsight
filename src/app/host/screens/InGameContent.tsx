'use client';

import React from 'react';

import {useT} from '../../../i18n';
import type {
  CoverageEntry,
  HostNote,
  RoundProgressEntry,
  WritingMode,
} from '../../../mock/room';
import {RoundControlCard} from '../components/RoundControlCard';
import {RoundProgressList} from '../components/RoundProgressList';
import {CoverageBar} from '../components/CoverageBar';
import {ModerationFeed} from '../components/ModerationFeed';
import {consoleCard, cardHeading, consoleGrid, span} from '../components/hostStyles';

type Props = {
  mode: WritingMode;
  round: number;
  totalRounds: number;
  timer: string;
  paused: boolean;
  graceRunning: boolean;
  stillWriting: number;
  coverage: CoverageEntry[];
  roundProgress: RoundProgressEntry[];
  notes: HostNote[];
  onTogglePause: () => void;
  onAdvance: () => void;
  onRemoveNote: (id: string) => void;
};

export const InGameContent: React.FC<Props> = ({
  mode,
  round,
  totalRounds,
  timer,
  paused,
  graceRunning,
  stillWriting,
  coverage,
  roundProgress,
  notes,
  onTogglePause,
  onAdvance,
  onRemoveNote,
}) => {
  const t = useT();
  const isModeA = mode === 'roundRobin';
  const maxCount = coverage.reduce((m, c) => Math.max(m, c.noteCount), 0);
  const sortedCoverage = [...coverage].sort((a, b) => a.noteCount - b.noteCount);

  return (
    <div style={{...consoleGrid, alignItems: 'start'}}>
      {isModeA && (
        <div style={span(6)}>
          <RoundControlCard
            round={round}
            totalRounds={totalRounds}
            timer={timer}
            paused={paused}
            graceRunning={graceRunning}
            onTogglePause={onTogglePause}
            onAdvance={onAdvance}
          />
        </div>
      )}

      <div style={span(isModeA ? 6 : 7)}>
        {isModeA ? (
          <RoundProgressList entries={roundProgress} />
        ) : (
          <div style={consoleCard}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={cardHeading}>{t('host.game.coverage.title')}</span>
              <span className='t12'>{t('host.game.coverage.floor')}</span>
            </div>
            <div
              style={{
                marginTop: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              {sortedCoverage.map((c) => (
                <CoverageBar
                  key={c.name}
                  name={c.name}
                  noteCount={c.noteCount}
                  maxCount={maxCount}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{...consoleCard, ...span(isModeA ? 12 : 5)}}>
        <span style={cardHeading}>{t('phase.writing')}</span>
        <p className='t16' style={{marginTop: 10}}>
          {t('host.game.activity', {count: stillWriting})}
        </p>
      </div>

      <div style={span(12)}>
        <ModerationFeed notes={notes} onRemove={onRemoveNote} />
      </div>
    </div>
  );
};
