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
import {consoleCard, cardHeading} from '../components/hostStyles';
import styles from './InGameContent.module.scss';

type Props = {
  mode: WritingMode;
  round: number;
  totalRounds: number;
  timer: string;
  paused: boolean;
  graceRunning: boolean;
  roundsComplete: boolean;
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
  roundsComplete,
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
    <div className={styles.board}>
      {/* Left column: round control on top, the progress/coverage list fills the
          rest of the height and scrolls on its own. */}
      <div className={styles.leftCol}>
        {isModeA && (
          <RoundControlCard
            round={round}
            totalRounds={totalRounds}
            timer={timer}
            paused={paused}
            graceRunning={graceRunning}
            roundsComplete={roundsComplete}
            onTogglePause={onTogglePause}
            onAdvance={onAdvance}
          />
        )}

        <div className={styles.progressSlot}>
          {isModeA ? (
            <RoundProgressList entries={roundProgress} fill />
          ) : (
            <div
              style={{
                ...consoleCard,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
              }}
            >
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
                  flex: '1 1 auto',
                  minHeight: 0,
                  overflowY: 'auto',
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
      </div>

      {/* Middle column: moderation feed fills the height and scrolls. */}
      <div className={styles.fillSlot}>
        <ModerationFeed notes={notes} onRemove={onRemoveNote} fill />
      </div>
    </div>
  );
};
