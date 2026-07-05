'use client';

import React, {useEffect} from 'react';

import {components} from '../../../components';
import {useT} from '../../../i18n';
import type {WritingMode} from '../../../mock/room';
import {StepperInput} from './StepperInput';
import {dosisFont, fieldLabel} from './hostStyles';
import styles from './HelpModal.module.scss';

// Session parameters the host can retune mid-run. round_count is only editable
// before writing (the server locks it once rounds start); during writing the
// host can still lengthen the game with an extra round. Duration is editable at
// any time. Mode is fixed at creation, shown read-only for context.
export type SessionSettings = {
  mode: WritingMode;
  rounds: number;
  minutes: number;
  roundCountEditable: boolean;
  canAddRound: boolean;
  onRoundsChange: (n: number) => void;
  onMinutesChange: (n: number) => void;
  onAddRound: () => void;
};

type Props = SessionSettings & {
  open: boolean;
  onClose: () => void;
};

export const SessionSettingsModal: React.FC<Props> = ({
  open,
  onClose,
  mode,
  rounds,
  minutes,
  roundCountEditable,
  canAddRound,
  onRoundsChange,
  onMinutesChange,
  onAddRound,
}) => {
  const t = useT();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const isModeA = mode === 'roundRobin';

  return (
    <components.Modal
      open={open}
      onClose={onClose}
      labelledBy='session-settings-title'
      containerStyle={{maxWidth: 440}}
    >
      <div className={styles.head}>
        <div className={styles.titleWrap}>
          <h2 id='session-settings-title' className={styles.title}>
            {t('host.settings.title')}
          </h2>
          <p className={styles.subtitle}>{t('host.settings.subtitle')}</p>
        </div>
        <button
          type='button'
          className={styles.closeBtn}
          aria-label={t('common.close')}
          onClick={onClose}
        >
          {'\u00d7'}
        </button>
      </div>

      <div
        style={{
          marginTop: 22,
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
        }}
      >
        {isModeA &&
          (roundCountEditable ? (
            <StepperInput
              label={t('host.create.rounds.label')}
              value={rounds}
              min={1}
              max={12}
              onChange={onRoundsChange}
            />
          ) : (
            <div>
              <span style={fieldLabel}>{t('host.create.rounds.label')}</span>
              <p
                style={{
                  fontFamily: dosisFont,
                  fontSize: 18,
                  fontWeight: 600,
                  color: 'var(--main-color)',
                  marginTop: 2,
                }}
              >
                {t('host.settings.rounds.current', {n: rounds})}
              </p>
              <p className='t12' style={{marginTop: 6}}>
                {t('host.settings.roundsLocked')}
              </p>
              {canAddRound && (
                <components.Button
                  label={t('host.settings.addRound')}
                  onClick={onAddRound}
                  colorScheme='secondary'
                  containerStyle={{marginTop: 12}}
                  style={{textTransform: 'none', height: 44}}
                />
              )}
            </div>
          ))}

        <StepperInput
          label={t('host.create.timer.label')}
          value={minutes}
          min={1}
          max={10}
          onChange={onMinutesChange}
          suffix='min'
        />

        <div>
          <span style={fieldLabel}>{t('host.create.mode.label')}</span>
          <p
            style={{
              fontFamily: dosisFont,
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--main-color)',
              marginTop: 2,
            }}
          >
            {isModeA
              ? t('host.settings.mode.roundRobin')
              : t('host.settings.mode.freeSelect')}
          </p>
        </div>
      </div>
    </components.Modal>
  );
};
