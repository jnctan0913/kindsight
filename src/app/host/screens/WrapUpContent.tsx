'use client';

import React, {useState} from 'react';

import {useT} from '../../../i18n';
import {
  REVEAL_FLOOR,
  type CoverageEntry,
  type HostNote,
  type RevealStatus,
  type WritingMode,
} from '../../../mock/room';
import {RevealTriggerCard} from '../components/RevealTriggerCard';
import {RevealStatusList} from '../components/RevealStatusList';
import {HighlightToggle} from '../components/HighlightToggle';
import {PromptDeck} from '../components/PromptDeck';
import {ModerationFeed} from '../components/ModerationFeed';
import {EndRoomDialog} from '../components/EndRoomDialog';
import {consoleCard, cardHeading, consoleGrid, span} from '../components/hostStyles';
import {components} from '../../../components';

type Props = {
  code: string;
  mode: WritingMode;
  coverage: CoverageEntry[];
  revealStatus: {name: string; status: RevealStatus}[];
  optedInCount: number;
  notes: HostNote[];
  revealTriggered: boolean;
  onTriggerReveal: () => void;
  onRemoveNote: (id: string) => void;
  onEndRoom: () => void;
  onHighlightToggle?: (enabled: boolean) => void;
  activePrompt?: string | null;
  onPromptPush?: (prompt: string | null) => void;
};

export const WrapUpContent: React.FC<Props> = ({
  code,
  mode,
  coverage,
  revealStatus,
  optedInCount,
  notes,
  revealTriggered,
  onTriggerReveal,
  onRemoveNote,
  onEndRoom,
  onHighlightToggle,
  activePrompt,
  onPromptPush,
}) => {
  const t = useT();
  const [highlightOn, setHighlightOn] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const blockers =
    mode === 'freeSelect'
      ? coverage.filter((c) => c.noteCount < REVEAL_FLOOR)
      : [];

  return (
    <div style={{...consoleGrid, alignItems: 'start'}}>
      <div style={{...span(7), display: 'flex', flexDirection: 'column', gap: 20}}>
        <RevealTriggerCard
          triggered={revealTriggered}
          blockers={blockers}
          onTrigger={onTriggerReveal}
        />
        {revealTriggered && <RevealStatusList statuses={revealStatus} />}
        <HighlightToggle
          on={highlightOn}
          optedInCount={optedInCount}
          onToggle={() => {
            setHighlightOn((v) => {
              const next = !v;
              onHighlightToggle?.(next);
              return next;
            });
          }}
        />
        <PromptDeck activePrompt={activePrompt} onPush={onPromptPush} />
      </div>

      <div style={span(5)}>
        <ModerationFeed notes={notes} onRemove={onRemoveNote} />
      </div>

      <div
        style={{
          ...consoleCard,
          ...span(12),
          border: '1px solid var(--warn-surface)',
          backgroundColor: 'var(--warn-surface)',
        }}
      >
        <span style={{...cardHeading, color: 'var(--warn-color)'}}>
          {t('host.wrap.dangerZone')}
        </span>
        <components.Button
          label={t('host.wrap.end.cta')}
          onClick={() => setEndOpen(true)}
          colorScheme='primary'
          containerStyle={{marginTop: 14, maxWidth: 280}}
          style={{
            textTransform: 'none',
            background: 'var(--warn-color)',
            color: 'var(--white-color)',
          }}
        />
      </div>

      <EndRoomDialog
        open={endOpen}
        code={code}
        onClose={() => setEndOpen(false)}
        onConfirm={() => {
          setEndOpen(false);
          onEndRoom();
        }}
      />
    </div>
  );
};
