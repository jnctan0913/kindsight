'use client';

import React, {useEffect, useRef, useState} from 'react';
import Link from 'next/link';

import {useT} from '../../../i18n';
import type {StringKey} from '../../../i18n';
import {useRoomStore, type DemoStep} from '../../../stores/room';
import type {RoomMode} from '../../../lib/types';
import {Routes} from '../../../routes';
import {dosisFont} from './hostStyles';
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
      className='clickable pressable'
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: '12px 20px',
        borderRadius: 'var(--radius-control)',
        border: '2px solid var(--main-color)',
        backgroundColor: 'var(--main-color)',
        color: 'var(--neon-white)',
        fontFamily: dosisFont,
        fontSize: 15,
        fontWeight: 700,
        textAlign: 'center',
        opacity: disabled ? 0.35 : 1,
      }}
    >
      {label}
    </button>
  );

  return (
    <div className={styles.wrap} data-surface='host'>
      {/* Left: the phone device */}
      <div className={styles.device}>
        <div className={styles.frame} data-surface='player'>
          <div className={styles.screenScroll}>{renderScreen()}</div>
        </div>
      </div>

      {/* Right: the control panel */}
      <div className={styles.panel}>
        <Link
          href={Routes.HOST}
          className='clickable pressable'
          style={{
            alignSelf: 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--white-color)',
            color: 'var(--main-color)',
            fontFamily: dosisFont,
            fontSize: 13,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          <span aria-hidden='true' style={{fontSize: 16, lineHeight: 1}}>
            &#8592;
          </span>
          {t('host.hub.home')}
        </Link>

        <div className={styles.header}>
          <h2 style={{fontFamily: dosisFont}}>{t('host.preview.title')}</h2>
          <p className='t14' style={{marginTop: 6}}>
            {t('host.preview.subtitle')}
          </p>
        </div>

        {/* Mode toggle */}
        <div className={styles.modeRow}>
          {modeButton('round_robin', t('host.preview.mode.a'))}
          {modeButton('free_select', t('host.preview.mode.b'))}
        </div>

        {/* Vertical step list */}
        <div className={styles.steps}>
          {STEP_META.map((meta, i) => {
            const active = meta.step === step;
            const done = i < idx;
            return (
              <button
                key={meta.step}
                className='clickable pressable'
                onClick={() => setStep(meta.step)}
                aria-current={active ? 'step' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '11px 14px',
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
                  fontSize: 15,
                  fontWeight: 700,
                  textAlign: 'left',
                }}
              >
                <span
                  aria-hidden='true'
                  style={{
                    flex: '0 0 auto',
                    width: 24,
                    height: 24,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    fontSize: 12,
                    fontWeight: 700,
                    backgroundColor: active
                      ? 'rgba(255, 255, 255, 0.22)'
                      : done
                        ? 'var(--accent-color)'
                        : 'var(--border-color)',
                    color: active ? 'var(--white-color)' : done ? 'var(--white-color)' : 'var(--main-color)',
                  }}
                >
                  {i + 1}
                </span>
                {t(meta.label)}
              </button>
            );
          })}
        </div>

        {/* Caption */}
        {caption && (
          <p
            className={`t14 ${styles.caption}`}
            aria-live='polite'
            style={{color: 'var(--text-color)'}}
          >
            {t(caption)}
          </p>
        )}

        {/* Prev / Next */}
        <div className={styles.footer}>
          {navButton(t('host.preview.prev'), () => go(-1), idx === 0)}
          {navButton(t('host.preview.next'), () => go(1), idx === STEPS.length - 1)}
        </div>
      </div>
    </div>
  );
};
