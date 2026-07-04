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
import {ConfirmDialog} from '../components/ConfirmDialog';
import {consoleCard, cardHeading, dosisFont} from '../components/hostStyles';
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
}) => {
  const t = useT();
  const [highlightOn, setHighlightOn] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [confirmCode, setConfirmCode] = useState('');

  const blockers =
    mode === 'freeSelect'
      ? coverage.filter((c) => c.noteCount < REVEAL_FLOOR)
      : [];

  return (
    <div>
      <div style={{display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start'}}>
        <div style={{flex: '1 1 320px', minWidth: 300, display: 'flex', flexDirection: 'column', gap: 24}}>
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
          <PromptDeck />
        </div>

        <div style={{flex: '1 1 320px', minWidth: 300}}>
          <ModerationFeed notes={notes} onRemove={onRemoveNote} />
        </div>
      </div>

      <div
        style={{
          ...consoleCard,
          marginTop: 24,
          maxWidth: 560,
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

      <ConfirmDialog
        open={endOpen}
        danger
        title={t('host.wrap.end.cta')}
        body={t('host.wrap.end.body')}
        confirmLabel={t('host.wrap.end.cta')}
        confirmDisabled={confirmCode.trim().toUpperCase() !== code.toUpperCase()}
        onCancel={() => {
          setEndOpen(false);
          setConfirmCode('');
        }}
        onConfirm={() => {
          setEndOpen(false);
          setConfirmCode('');
          onEndRoom();
        }}
      >
        <div style={{marginTop: 16}}>
          <label
            htmlFor='end-code'
            style={{
              display: 'block',
              marginBottom: 8,
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--main-color)',
              fontFamily: dosisFont,
            }}
          >
            {t('host.wrap.end.field', {code})}
          </label>
          <input
            id='end-code'
            value={confirmCode}
            onChange={(e) => setConfirmCode(e.target.value.toUpperCase())}
            autoComplete='off'
            spellCheck={false}
            style={{
              width: '100%',
              height: 50,
              padding: '0 16px',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--white-color)',
              fontSize: 18,
              letterSpacing: '0.12em',
              color: 'var(--main-color)',
              fontFamily:
                'var(--font-league-spartan), var(--font-noto-sc), sans-serif',
            }}
          />
          <p className='t12' style={{marginTop: 10}}>
            {t('host.wrap.end.ttl')}
          </p>
        </div>
      </ConfirmDialog>
    </div>
  );
};
