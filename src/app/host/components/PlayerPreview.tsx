'use client';

import React, {useEffect, useRef, useState} from 'react';

import {useT} from '../../../i18n';
import type {StringKey} from '../../../i18n';
import {useRoomStore, type DemoStep} from '../../../stores/room';
import type {RoomMode} from '../../../lib/types';
import {consoleCard, dosisFont} from './hostStyles';
import styles from './PlayerPreview.module.scss';

import {JoinPrompt} from '../../r/screens/JoinPrompt';
import {ClaimContent} from '../../r/screens/ClaimContent';
import {LobbyWait} from '../../r/screens/LobbyWait';
import {BriefingContent} from '../../r/screens/BriefingContent';
import {WriteContent} from '../../r/screens/WriteContent';
import {RevealContent} from '../../r/screens/RevealContent';

type StepMeta = {step: DemoStep; label: StringKey; caption: StringKey};

const STEP_META: StepMeta[] = [
  {step: 'join', label: 'host.preview.step.join', caption: 'host.preview.cap.join'},
  {step: 'claim', label: 'host.preview.step.claim', caption: 'host.preview.cap.claim'},
  {step: 'lobby', label: 'host.preview.step.lobby', caption: 'host.preview.cap.lobby'},
  {step: 'briefing', label: 'host.preview.step.briefing', caption: 'host.preview.cap.briefing'},
  {step: 'write', label: 'host.preview.step.write', caption: 'host.preview.cap.write'},
  {step: 'reveal', label: 'host.preview.step.reveal', caption: 'host.preview.cap.reveal'},
];

const STEPS = STEP_META.map((s) => s.step);

type Props = {
  initialStep?: DemoStep;
  initialMode: RoomMode;
};

export const PlayerPreview: React.FC<Props> = ({initialStep = 'lobby', initialMode}) => {
  const t = useT();
  const demoSetStep = useRoomStore((s) => s.demoSetStep);
  const stopDemo = useRoomStore((s) => s.stopDemo);
  const role = useRoomStore((s) => s.role);

  const [step, setStep] = useState<DemoStep>(initialStep);
  const [mode, setMode] = useState<RoomMode>(initialMode);

  // Drive the shared store into the scripted state for this step + mode. The
  // player screens read the store reactively, so this is all they need.
  useEffect(() => {
    demoSetStep(step, mode);
  }, [step, mode, demoSetStep]);

  // Leave the store clean for any real player session once the host closes it.
  useEffect(() => () => stopDemo(), [stopDemo]);

  // Claiming a name flips role joiner -> player; mirror the live auto-advance,
  // but only on the actual transition so arriving on the claim step from a later
  // step (where role is still 'player') does not skip it.
  const prevRole = useRef(role);
  useEffect(() => {
    if (step === 'claim' && prevRole.current === 'joiner' && role === 'player') {
      setStep('lobby');
    }
    prevRole.current = role;
  }, [step, role]);

  const idx = STEPS.indexOf(step);
  const go = (delta: number) => {
    const next = idx + delta;
    if (next >= 0 && next < STEPS.length) setStep(STEPS[next]);
  };

  const renderScreen = () => {
    switch (step) {
      case 'join':
        return (
          <JoinPrompt
            initialCode='DEMO01'
            failure={null}
            onJoin={async () => {
              setStep('claim');
            }}
          />
        );
      case 'claim':
        return <ClaimContent />;
      case 'lobby':
        return <LobbyWait />;
      case 'briefing':
        return <BriefingContent />;
      case 'write':
        return <WriteContent />;
      case 'reveal':
        return <RevealContent />;
      default:
        return null;
    }
  };

  const caption = STEP_META[idx]?.caption;

  const modeButton = (value: RoomMode, label: string) => {
    const active = mode === value;
    return (
      <button
        className='clickable'
        onClick={() => setMode(value)}
        aria-pressed={active}
        style={{
          padding: '8px 14px',
          borderRadius: 'var(--radius-pill)',
          border: active ? '2px solid var(--accent-color)' : '2px solid var(--border-color)',
          backgroundColor: active ? 'var(--accent-color)' : 'var(--white-color)',
          color: active ? 'var(--white-color)' : 'var(--main-color)',
          fontFamily: dosisFont,
          fontSize: 13,
          fontWeight: 700,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </button>
    );
  };

  const navButton = (label: string, onClick: () => void, disabled: boolean) => (
    <button
      className='clickable'
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '10px 20px',
        borderRadius: 'var(--radius-control)',
        border: '2px solid var(--main-color)',
        backgroundColor: 'var(--main-color)',
        color: 'var(--neon-white)',
        fontFamily: dosisFont,
        fontSize: 14,
        fontWeight: 700,
        opacity: disabled ? 0.35 : 1,
      }}
    >
      {label}
    </button>
  );

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h2 style={{fontFamily: dosisFont}}>{t('host.preview.title')}</h2>
        <p className='t14' style={{marginTop: 6}}>
          {t('host.preview.subtitle')}
        </p>
      </div>

      <div className={styles.frame} data-surface='player'>
        {renderScreen()}
      </div>

      <div className={`${styles.controls}`} style={{...consoleCard, padding: 18}}>
        {/* Mode toggle */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 16,
          }}
        >
          {modeButton('round_robin', t('host.preview.mode.a'))}
          {modeButton('free_select', t('host.preview.mode.b'))}
        </div>

        {/* Step rail */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: 6,
          }}
        >
          {STEP_META.map((meta, i) => {
            const active = meta.step === step;
            const done = i < idx;
            return (
              <button
                key={meta.step}
                className='clickable'
                onClick={() => setStep(meta.step)}
                aria-current={active ? 'step' : undefined}
                style={{
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 6px',
                  borderRadius: 'var(--radius-control)',
                  border: active
                    ? '2px solid var(--accent-color)'
                    : '2px solid var(--border-color)',
                  backgroundColor: active
                    ? 'var(--accent-color)'
                    : done
                      ? 'var(--host-surface)'
                      : 'var(--white-color)',
                  color: active ? 'var(--white-color)' : 'var(--main-color)',
                  fontFamily: dosisFont,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <span style={{display: 'block', opacity: 0.7, fontSize: 10}}>{i + 1}</span>
                {t(meta.label)}
              </button>
            );
          })}
        </div>

        {/* Caption */}
        {caption && (
          <p
            className='t14'
            aria-live='polite'
            style={{
              marginTop: 14,
              textAlign: 'center',
              color: 'var(--text-color)',
              minHeight: 40,
            }}
          >
            {t(caption)}
          </p>
        )}

        {/* Prev / Next */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            marginTop: 6,
          }}
        >
          {navButton(t('host.preview.prev'), () => go(-1), idx === 0)}
          {navButton(t('host.preview.next'), () => go(1), idx === STEPS.length - 1)}
        </div>
      </div>
    </div>
  );
};
