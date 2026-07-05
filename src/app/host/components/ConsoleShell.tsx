'use client';

import React, {useEffect, useState} from 'react';

import {asset} from '../../../config';
import {LanguageToggle, useT} from '../../../i18n';
import type {StringKey} from '../../../i18n';
import {PhaseStepper, type HostPhase} from './PhaseStepper';
import {EndRoomDialog} from './EndRoomDialog';
import {FacilitatorGuideModal, HelpModal} from './GuideModal';
import {HostIcon} from './HostIcon';
import {MusicDock} from './MusicDock';
import {SessionSettingsModal, type SessionSettings} from './SessionSettingsModal';
import styles from './ConsoleShell.module.scss';

type BaseProps = {
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
  primaryAction?: React.ReactNode;
  // Preview rail width per phase (the projector iframe scales to fill it).
  previewWidth?: number;
  // Fill mode: the body owns a fixed height and inner panels scroll on their
  // own (used by the writing dashboard so it reads as a single control surface).
  fillBody?: boolean;
  onSignOut?: () => void;
  onHome?: () => void;
};

type GameProps = BaseProps & {
  variant?: 'game';
  code: string;
  phase: HostPhase;
  playerCount: number;
  noteCount: number;
  // Hard delete, reachable from every live phase via the sidebar.
  onEndRoom?: () => void;
  // Rewind one server phase. Omit to hide (e.g. at lobby, nothing to go back to).
  onRewind?: () => void;
  // Room music on/off (big screen is the speaker; sidebar is the remote).
  musicOn?: boolean;
  onToggleMusic?: () => void;
  // Editable session parameters (rounds, duration). Omit to hide the button.
  sessionSettings?: SessionSettings;
};

type HubProps = BaseProps & {
  variant: 'hub';
  code?: never;
  phase?: never;
  playerCount?: never;
  noteCount?: never;
  onEndRoom?: never;
  onRewind?: never;
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

  const [endOpen, setEndOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const sessionSettings = isHub ? undefined : props.sessionSettings;

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandRow}>
            <span className={styles.mark}>
              <img
                src={asset('/assets/kindsight/kindsight-mascot-only.png')}
                alt=''
                aria-hidden='true'
                className={styles.markImg}
              />
            </span>
            <span className={styles.wordmark}>{t('app.name')}</span>
          </div>
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

        {/* Session-related controls sit at the top, next to the room context. */}
        {!isHub && (
          <div className={styles.sessionNav}>
            <div className={styles.stats}>
              <span className={styles.stat}>
                {t('host.stats.players', {count: props.playerCount})}
              </span>
              <span className={styles.stat}>
                {t('host.stats.notes', {count: props.noteCount})}
              </span>
            </div>
            {props.onHome && (
              <button
                type='button'
                className={`clickable ${styles.navItem}`}
                onClick={props.onHome}
              >
                <HostIcon name='home' size={16} color='var(--neon-white)' />
                {t('host.hub.home')}
              </button>
            )}
            {sessionSettings && (
              <button
                type='button'
                className={`clickable ${styles.navItem}`}
                onClick={() => setSettingsOpen(true)}
              >
                <HostIcon name='settings' size={16} color='var(--neon-white)' />
                {t('host.settings.nav')}
              </button>
            )}
            {props.onEndRoom && (
              <button
                type='button'
                className={`clickable ${styles.dangerItem}`}
                onClick={() => setEndOpen(true)}
              >
                <HostIcon name='delete' size={16} color='var(--warn-color)' />
                {t('host.wrap.end.cta')}
              </button>
            )}
          </div>
        )}

        {/* Music remote (big screen is the speaker). Sits above the footer as
            the top of the bottom cluster. */}
        {!isHub && (
          <MusicDock
            code={props.code}
            musicOn={props.musicOn ?? true}
            onToggleMusic={props.onToggleMusic ?? (() => {})}
          />
        )}

        {/* Standard controls (account, language) stay pinned at the bottom. */}
        <div className={styles.footer} style={isHub ? {marginTop: 'auto'} : undefined}>
          {isHub && props.onHome && (
            <button
              type='button'
              className={`clickable ${styles.navItem}`}
              onClick={props.onHome}
            >
              <HostIcon name='home' size={16} color='var(--neon-white)' />
              {t('host.hub.home')}
            </button>
          )}
          <button
            type='button'
            className={`clickable ${styles.navItem}`}
            onClick={() => setGuideOpen(true)}
          >
            <HostIcon name='guide' size={16} color='var(--neon-white)' />
            {t('host.guide.cta')}
          </button>
          <button
            type='button'
            className={`clickable ${styles.navItem}`}
            onClick={() => setHelpOpen(true)}
          >
            <HostIcon name='help' size={16} color='var(--neon-white)' />
            {t('host.help.cta')}
          </button>
          {props.onSignOut && (
            <button
              type='button'
              className={`clickable ${styles.navItem}`}
              onClick={props.onSignOut}
            >
              <HostIcon name='signout' size={16} color='var(--neon-white)' />
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
            <div className={styles.headerActions}>
              {props.onRewind && (
                <button
                  type='button'
                  className={`clickable ${styles.previewToggle}`}
                  onClick={props.onRewind}
                >
                  {'‹ '}
                  {t('host.nav.rewind')}
                </button>
              )}
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
          </div>
        )}

        <div
          className={`${styles.scrollArea} ${
            props.fillBody ? styles.scrollAreaFill : ''
          }`}
        >
          <main
            className={`${
              hasPreview && previewOpen ? styles.contentWithPanel : styles.content
            } ${props.fillBody ? styles.contentFill : ''}`}
            style={
              hasPreview && previewOpen
                ? ({'--preview-w': `${props.previewWidth ?? 400}px`} as React.CSSProperties)
                : undefined
            }
          >
            <div
              className={`${styles.primaryContent} ${
                props.fillBody ? styles.primaryContentFill : ''
              }`}
            >
              {props.children}
            </div>
            {hasPreview && previewOpen && (
              <aside className={styles.rightPanel}>{props.rightPanel}</aside>
            )}
          </main>
        </div>

        {props.primaryAction && (
          <div className={styles.actionBar}>{props.primaryAction}</div>
        )}
      </div>

      {!isHub && props.onEndRoom && (
        <EndRoomDialog
          open={endOpen}
          code={props.code}
          onClose={() => setEndOpen(false)}
          onConfirm={() => {
            setEndOpen(false);
            props.onEndRoom?.();
          }}
        />
      )}

      {sessionSettings && (
        <SessionSettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          {...sessionSettings}
        />
      )}

      <FacilitatorGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
};
