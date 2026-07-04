'use client';

import React, {useEffect, useState} from 'react';

import {asset} from '../../../config';
import {LanguageToggle, useT} from '../../../i18n';
import type {StringKey} from '../../../i18n';
import {PhaseStepper, type HostPhase} from './PhaseStepper';
import styles from './ConsoleShell.module.scss';

type BaseProps = {
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
  primaryAction?: React.ReactNode;
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

export const ConsoleShell: React.FC<Props> = (props) => {
  const t = useT();
  const isHub = props.variant === 'hub';
  const hasPreview = Boolean(props.rightPanel);

  // The projector preview is a togglable rail, default open only on wide
  // desktops so it never starves the content column on smaller screens. Init
  // false (SSR-safe) and open on mount when there's room.
  const [previewOpen, setPreviewOpen] = useState(false);
  useEffect(() => {
    if (hasPreview) setPreviewOpen(window.innerWidth >= 1280);
  }, [hasPreview]);

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <img
            src={asset('/assets/kindsight/kindsight-logo-transparent.png')}
            alt='Kindsight'
            className={styles.logo}
          />
          {isHub ? (
            <div className={styles.roomChip}>
              <p className={styles.code}>{t('host.hub.sidebar')}</p>
              <p className={styles.phase}>{t('host.hub.sidebarHint')}</p>
            </div>
          ) : (
            <div className={styles.roomChip}>
              <span className={styles.roomLabel}>{t('host.nav.room')}</span>
              <p className={styles.code}>{props.code}</p>
            </div>
          )}
        </div>

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
          {props.onHome && (
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
          <div className={styles.headerBar}>
            <PhaseStepper current={props.phase} />
            {hasPreview && (
              <button
                type='button'
                className={`clickable ${styles.previewToggle} ${
                  previewOpen ? styles.previewToggleOn : ''
                }`}
                aria-pressed={previewOpen}
                onClick={() => setPreviewOpen((v) => !v)}
              >
                {t('host.preview.title' as StringKey)}
              </button>
            )}
          </div>
        )}

        <div className={styles.scrollArea}>
          <main
            className={
              hasPreview && previewOpen ? styles.contentWithPanel : styles.content
            }
          >
            <div className={styles.primaryContent}>{props.children}</div>
            {hasPreview && previewOpen && (
              <aside className={styles.rightPanel}>{props.rightPanel}</aside>
            )}
          </main>
        </div>

        {props.primaryAction && (
          <div className={styles.actionBar}>{props.primaryAction}</div>
        )}
      </div>
    </div>
  );
};
