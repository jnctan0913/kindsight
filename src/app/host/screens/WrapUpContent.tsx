'use client';

import React from 'react';

import {useT} from '../../../i18n';
import {
  REVEAL_FLOOR,
  type CoverageEntry,
  type HostNote,
  type RevealStatus,
  type WritingMode,
} from '../../../mock/room';
import type {HighlightMode} from '../../../lib/types';
import type {PromptItem} from '../../../lib/hostRoomSync';
import {RevealTriggerCard} from '../components/RevealTriggerCard';
import {RevealProgressCard} from '../components/RevealProgressCard';
import {HighlightControls} from '../components/HighlightControls';
import {PromptDeck} from '../components/PromptDeck';
import {ModerationFeed} from '../components/ModerationFeed';
import {consoleCard, cardHeading, dosisFont} from '../components/hostStyles';
import {components} from '../../../components';
import styles from './WrapUpContent.module.scss';

type Props = {
  mode: WritingMode;
  coverage: CoverageEntry[];
  revealStatus: {name: string; status: RevealStatus}[];
  optedInCount: number;
  notes: HostNote[];
  revealTriggered: boolean;
  onTriggerReveal: () => void;
  onRemoveNote: (id: string) => void;
  onHighlightToggle?: (enabled: boolean) => void;
  highlightEnabled: boolean;
  highlightMode: HighlightMode;
  highlightTarget: string | null;
  onHighlightMode: (mode: HighlightMode) => void;
  onHighlightTarget: (name: string | null) => void;
  prompts: PromptItem[];
  activePromptId: string | null;
  onPromptPush: (item: PromptItem | null) => void;
  onPromptAdd: () => void;
  onPromptEdit: (id: string, text: string) => void;
  onPromptRemove: (id: string) => void;
  closing: boolean;
  onToggleClosing: () => void;
};

export const WrapUpContent: React.FC<Props> = ({
  mode,
  coverage,
  revealStatus,
  optedInCount,
  notes,
  revealTriggered,
  onTriggerReveal,
  onRemoveNote,
  onHighlightToggle,
  highlightEnabled,
  highlightMode,
  highlightTarget,
  onHighlightMode,
  onHighlightTarget,
  prompts,
  activePromptId,
  onPromptPush,
  onPromptAdd,
  onPromptEdit,
  onPromptRemove,
  closing,
  onToggleClosing,
}) => {
  const t = useT();

  const blockers =
    mode === 'freeSelect'
      ? coverage.filter((c) => c.noteCount < REVEAL_FLOOR)
      : [];

  // People with at least one note opted onto the wall, for the 'one person' mode.
  const optedInPeople = Array.from(
    new Set(notes.filter((n) => n.shared).map((n) => n.target)),
  );

  return (
    <div className={styles.board}>
      {/* Left column: moderation feed. */}
      <div className={styles.fillSlot}>
        <ModerationFeed notes={notes} onRemove={onRemoveNote} fill />
      </div>

      {/* Right column: reveal trigger (pre-reveal) or the big-screen controls
          (wall, prompts, closing) once the reveal is live. */}
      <div className={styles.col}>
        {!revealTriggered ? (
          <RevealTriggerCard
            triggered={revealTriggered}
            blockers={blockers}
            onTrigger={onTriggerReveal}
          />
        ) : (
          <>
            <RevealProgressCard statuses={revealStatus} />

            <HighlightControls
              enabled={highlightEnabled}
              mode={highlightMode}
              target={highlightTarget}
              optedInCount={optedInCount}
              people={optedInPeople}
              onToggle={(enabled) => onHighlightToggle?.(enabled)}
              onModeChange={onHighlightMode}
              onTargetChange={onHighlightTarget}
            />

            <PromptDeck
              prompts={prompts}
              activePromptId={activePromptId}
              onPush={onPromptPush}
              onAdd={onPromptAdd}
              onEdit={onPromptEdit}
              onRemove={onPromptRemove}
            />

            {/* Closing screen control: ends the room on a quiet thank-you instead
                of leaving the projector on the reveal interstitial. */}
            <div style={consoleCard}>
              <span style={cardHeading}>{t('host.wrap.closing.title')}</span>
              <p className='t14' style={{marginTop: 10, lineHeight: 1.5}}>
                {t('host.wrap.closing.sub')}
              </p>
              {closing && (
                <p
                  role='status'
                  style={{
                    marginTop: 12,
                    fontSize: 15,
                    fontWeight: 600,
                    color: 'var(--accent-deep)',
                    fontFamily: dosisFont,
                  }}
                >
                  {t('host.wrap.closing.on')}
                </p>
              )}
              <components.Button
                label={
                  closing ? t('host.wrap.closing.stop') : t('host.wrap.closing.cta')
                }
                onClick={onToggleClosing}
                colorScheme={closing ? 'primary' : 'secondary'}
                containerStyle={{marginTop: 14}}
                style={{textTransform: 'none', height: 46}}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
