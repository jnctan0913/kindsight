'use client';

import React from 'react';

import {asset} from '../../../config';
import {LanguageToggle, useT} from '../../../i18n';
import type {StringKey} from '../../../i18n';
import {numFont, dosisFont} from './hostStyles';
import {PhaseStepper, type HostPhase} from './PhaseStepper';

export type ConsoleNav = 'room' | 'roster' | 'moderation';

type Props = {
  code: string;
  phase: HostPhase;
  activeNav: ConsoleNav;
  onNav: (nav: ConsoleNav) => void;
  playerCount: number;
  noteCount: number;
  children: React.ReactNode;
};

const navItems: {id: ConsoleNav; labelKey: StringKey}[] = [
  {id: 'room', labelKey: 'host.nav.room'},
  {id: 'roster', labelKey: 'host.roster.title'},
  {id: 'moderation', labelKey: 'host.mod.title'},
];

export const ConsoleShell: React.FC<Props> = ({
  code,
  phase,
  activeNav,
  onNav,
  playerCount,
  noteCount,
  children,
}) => {
  const t = useT();

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: 'var(--host-surface)',
        display: 'flex',
        flexWrap: 'wrap',
      }}
    >
      <aside
        style={{
          flex: '0 0 240px',
          minWidth: 240,
          backgroundColor: 'var(--main-color)',
          color: 'var(--neon-white)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        <div>
          <img
            src={asset('/assets/kindsight/kindsight-logo-transparent.png')}
            alt='Kindsight'
            style={{width: 120, height: 'auto', filter: 'brightness(0) invert(1)'}}
          />
          <p
            style={{
              marginTop: 16,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '0.14em',
              color: 'var(--neon-white)',
              fontFamily: numFont,
            }}
          >
            {code}
          </p>
          <p style={{marginTop: 2, fontSize: 13, color: 'var(--aurora-cream)', fontFamily: dosisFont}}>
            {t(`phase.${phase}` as StringKey)}
          </p>
        </div>

        <nav style={{display: 'flex', flexDirection: 'column', gap: 4}}>
          {navItems.map((item) => {
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                className='clickable'
                onClick={() => onNav(item.id)}
                aria-current={active ? 'page' : undefined}
                style={{
                  textAlign: 'left',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-control)',
                  backgroundColor: active ? 'rgba(255,255,255,0.10)' : 'transparent',
                  color: active ? 'var(--neon-white)' : 'rgba(245,250,251,0.7)',
                  fontSize: 15,
                  fontWeight: active ? 700 : 500,
                  fontFamily: dosisFont,
                }}
              >
                {t(item.labelKey)}
              </button>
            );
          })}
        </nav>

        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{display: 'flex', flexDirection: 'column', gap: 2}}>
            <span style={{fontSize: 14, color: 'rgba(245,250,251,0.85)', fontFamily: dosisFont}}>
              {t('host.stats.players', {count: playerCount})}
            </span>
            <span style={{fontSize: 14, color: 'rgba(245,250,251,0.85)', fontFamily: dosisFont}}>
              {t('host.stats.notes', {count: noteCount})}
            </span>
          </div>
          <LanguageToggle />
        </div>
      </aside>

      <div style={{flex: '1 1 640px', minWidth: 0, display: 'flex', flexDirection: 'column'}}>
        <div
          style={{
            padding: '20px 28px',
            borderBottom: '1px solid rgba(30,37,56,0.08)',
          }}
        >
          <PhaseStepper current={phase} />
        </div>
        <main style={{flex: 1, padding: 28}}>{children}</main>
      </div>
    </div>
  );
};
