'use client';

import React from 'react';

import {asset} from '../../../config';
import {components} from '../../../components';
import {LanguageToggle, useT} from '../../../i18n';
import type {WritingMode} from '../../../mock/room';
import {ModeCardPicker} from '../components/ModeCardPicker';
import {StepperInput} from '../components/StepperInput';
import {Callout} from '../components/Callout';
import {consoleCard, dosisFont} from '../components/hostStyles';

type Props = {
  mode: WritingMode;
  rounds: number;
  minutes: number;
  rosterSize: number;
  onModeChange: (mode: WritingMode) => void;
  onRoundsChange: (n: number) => void;
  onMinutesChange: (n: number) => void;
  onCreate: () => void;
  onBack?: () => void;
};

export const CreateRoomScreen: React.FC<Props> = ({
  mode,
  rounds,
  minutes,
  rosterSize,
  onModeChange,
  onRoundsChange,
  onMinutesChange,
  onCreate,
  onBack,
}) => {
  const t = useT();
  const tinyGroup = rosterSize < 6;

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: 'var(--host-surface)',
        padding: 24,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: 640,
          margin: '0 auto',
        }}
      >
        <img
          src={asset('/assets/kindsight/kindsight-logo-transparent.png')}
          alt='Kindsight'
          style={{width: 132, height: 'auto'}}
        />
        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
          {onBack && (
            <button
              type='button'
              className='clickable t14'
              onClick={onBack}
              style={{
                background: 'none',
                border: 'none',
                textDecoration: 'underline',
                color: 'var(--text-color)',
              }}
            >
              {t('common.back')}
            </button>
          )}
          <LanguageToggle />
        </div>
      </div>

      <div style={{...consoleCard, maxWidth: 640, margin: '24px auto 0', padding: 28}}>
        <h2 style={{fontFamily: dosisFont}}>{t('host.create.title')}</h2>

        <div style={{marginTop: 24}}>
          <p
            style={{
              marginBottom: 10,
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--main-color)',
              fontFamily: dosisFont,
            }}
          >
            {t('host.create.mode.label')}
          </p>
          <ModeCardPicker value={mode} onChange={onModeChange} />
        </div>

        {mode === 'roundRobin' && (
          <div style={{marginTop: 24}}>
            <StepperInput
              label={t('host.create.rounds.label')}
              value={rounds}
              min={1}
              max={12}
              onChange={onRoundsChange}
              helper={t('host.create.rounds.helper', {n: rosterSize})}
            />
          </div>
        )}

        <div style={{marginTop: 24}}>
          <StepperInput
            label={t('host.create.timer.label')}
            value={minutes}
            min={1}
            max={10}
            onChange={onMinutesChange}
            suffix='min'
          />
        </div>

        {tinyGroup && (
          <div style={{marginTop: 24}}>
            <Callout tone='warning'>{t('host.create.tinyGroup')}</Callout>
          </div>
        )}

        <components.Button
          label={t('host.create.cta')}
          onClick={onCreate}
          colorScheme='primary'
          containerStyle={{marginTop: 28}}
          style={{textTransform: 'none'}}
        />
      </div>
    </div>
  );
};
