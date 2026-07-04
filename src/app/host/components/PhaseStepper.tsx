'use client';

import React from 'react';

import {useT} from '../../../i18n';
import type {StringKey} from '../../../i18n';
import {dosisFont} from './hostStyles';

export type HostPhase = 'lobby' | 'briefing' | 'writing' | 'reveal' | 'wrapup';

const order: HostPhase[] = ['lobby', 'briefing', 'writing', 'reveal', 'wrapup'];

const labels: Record<HostPhase, StringKey> = {
  lobby: 'phase.lobby',
  briefing: 'phase.briefing',
  writing: 'phase.writing',
  reveal: 'phase.reveal',
  wrapup: 'phase.wrapup',
};

type Props = {
  current: HostPhase;
};

export const PhaseStepper: React.FC<Props> = ({current}) => {
  const t = useT();
  const currentIndex = order.indexOf(current);

  return (
    <ol
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
        listStyle: 'none',
        margin: 0,
        padding: 0,
      }}
    >
      {order.map((phase, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const color = done
          ? 'var(--accent-deep)'
          : active
            ? 'var(--main-color)'
            : 'var(--text-color)';
        return (
          <li
            key={phase}
            aria-current={active ? 'step' : undefined}
            style={{display: 'flex', alignItems: 'center', gap: 8}}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: active
                  ? 'var(--host-surface)'
                  : 'transparent',
                fontSize: 14,
                fontWeight: active ? 700 : 500,
                color,
                fontFamily: dosisFont,
              }}
            >
              {done && (
                <svg width='14' height='14' viewBox='0 0 24 24' fill='none' aria-hidden='true'>
                  <path
                    d='M5 13l4 4L19 7'
                    stroke='var(--accent-deep)'
                    strokeWidth='3'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
              )}
              {t(labels[phase])}
            </span>
            {i < order.length - 1 && (
              <span aria-hidden='true' style={{color: 'var(--border-color)'}}>
                ›
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
};
