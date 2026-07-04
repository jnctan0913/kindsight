'use client';

import React from 'react';

import {asset} from '../../../config';
import {LanguageToggle, useT} from '../../../i18n';
import type {StringKey} from '../../../i18n';
import {PhaseStepper, type HostPhase} from './PhaseStepper';
import styles from './ConsoleShell.module.scss';

export type ConsoleNav = 'room' | 'roster' | 'moderation' | 'preview';

type BaseProps = {
  activeNav: ConsoleNav;
  onNav: (nav: ConsoleNav) => void;
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
  onSignOut?: () => void;
  onHome?: () => void;
};

type GameProps = BaseProps & {
  variant?: 'game';
  code: string;
  phase: HostPhase;
  playerCount: number;
  noteCount: number;
};

type HubProps = BaseProps & {
  variant: 'hub';
  code?: never;
  phase?: never;
  playerCount?: never;
  noteCount?: never;
};

type Props = GameProps | HubProps;

const navItems: {id: ConsoleNav; labelKey: StringKey}[] = [
  {id: 'room', labelKey: 'host.nav.room'},
  {id: 'roster', labelKey: 'host.roster.title'},
  {id: 'moderation', labelKey: 'host.mod.title'},
  {id: 'preview', labelKey: 'host.preview.title'},
];

export const ConsoleShell: React.FC<Props> = (props) => {
  const t = useT();
  const isHub = props.variant === 'hub';

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <img
            src={asset('/assets/kindsight/kindsight-logo-transparent.png')}
            alt='Kindsight'
            className={styles.logo}
          />
          <div>
            {isHub ? (
              <>
                <p className={styles.code}>{t('host.hub.sidebar')}</p>
                <p className={styles.phase}>{t('host.hub.sidebarHint')}</p>
              </>
            ) : (
              <>
                <p className={styles.code}>{props.code}</p>
                <p className={styles.phase}>{t(`phase.${props.phase}` as StringKey)}</p>
              </>
            )}
          </div>
        </div>

        {!isHub && (
          <nav className={styles.nav}>
            {navItems.map((item) => {
              const active = props.activeNav === item.id;
              return (
                <button
                  key={item.id}
                  className={`clickable ${styles.navItem} ${
                    active ? styles.navItemActive : ''
                  }`}
                  onClick={() => props.onNav(item.id)}
                  aria-current={active ? 'page' : undefined}
                >
                  {t(item.labelKey)}
                </button>
              );
            })}
          </nav>
        )}

        <div className={styles.footer}>
          {!isHub && (
            <div className={styles.stats}>
              <span className={styles.stat}>
                {t('host.stats.players', {count: props.playerCount})}
              </span>
              <span className={styles.stat}>
                {t('host.stats.notes', {count: props.noteCount})}
              </span>
            </div>
          )}
          {isHub && props.onHome && (
            <button
              type='button'
              className={`clickable ${styles.navItem}`}
              onClick={props.onHome}
            >
              {t('host.hub.home')}
            </button>
          )}
          {!isHub && props.onHome && (
            <button
              type='button'
              className={`clickable ${styles.navItem}`}
              onClick={props.onHome}
            >
              {t('host.hub.home')}
            </button>
          )}
          {props.onSignOut && (
            <button
              type='button'
              className={`clickable ${styles.navItem}`}
              onClick={props.onSignOut}
            >
              {t('host.login.signOut')}
            </button>
          )}
          <LanguageToggle />
        </div>
      </aside>

      <div className={styles.mainCol}>
        {!isHub && (
          <div className={styles.stepperBar}>
            <PhaseStepper current={props.phase} />
          </div>
        )}
        <main className={props.rightPanel ? styles.contentWithPanel : styles.content}>
          <div className={styles.primaryContent}>{props.children}</div>
          {props.rightPanel && (
            <aside className={styles.rightPanel}>{props.rightPanel}</aside>
          )}
        </main>
      </div>
    </div>
  );
};
