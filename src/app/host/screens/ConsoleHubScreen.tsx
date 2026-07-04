'use client';

import React, {useState} from 'react';

import {asset, BASE_PATH} from '../../../config';
import {components} from '../../../components';
import {useT} from '../../../i18n';
import type {ScreenPhase, ActiveRoomEntry} from '../../../lib/hostRoomSync';
import {openBigScreen} from '../../../lib/openBigScreen';
import {Routes} from '../../../routes';
import {EndRoomDialog} from '../components/EndRoomDialog';
import {HostIcon} from '../components/HostIcon';
import {
  cardHeading,
  codeText,
  consoleGrid,
  heroCard,
  pageTitle,
  rowActionPrimary,
  rowActionSecondary,
  sessionRow,
  span,
  statLabel,
  statTile,
  statValue,
  surfaceCard,
  dosisFont,
} from '../components/hostStyles';
import styles from './ConsoleHubScreen.module.scss';

type Props = {
  email: string;
  activeRooms: ActiveRoomEntry[];
  onStartGame: () => void;
  onReopenRoom: (code: string) => void;
  onDeleteSession: (code: string) => void;
};

const rowActionDanger: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 14px',
  borderRadius: 'var(--radius-control)',
  border: '1px solid var(--warn-color)',
  backgroundColor: 'var(--white-color)',
  color: 'var(--warn-color)',
  fontWeight: 600,
};

const PHASE_ORDER: ScreenPhase[] = ['lobby', 'briefing', 'writing', 'reveal', 'wrapup'];

const PHASE_DOT: Record<ScreenPhase, string> = {
  lobby: 'var(--border-color)',
  briefing: 'var(--accent-color)',
  writing: '#E9A23B',
  reveal: 'var(--accent-deep)',
  wrapup: 'var(--main-color)',
};

const mascot = (name: string) => asset(`/assets/kindsight/${name}.png`);

const joinUrlForCode = (code: string): string => {
  const path = `${BASE_PATH}/?code=${encodeURIComponent(code.toUpperCase())}`;
  if (typeof window === 'undefined') return path;
  return new URL(path, window.location.origin).href;
};

export const ConsoleHubScreen: React.FC<Props> = ({
  email,
  activeRooms,
  onStartGame,
  onReopenRoom,
  onDeleteSession,
}) => {
  const t = useT();
  const [endCode, setEndCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Share the player join link: native share sheet where available, clipboard
  // fallback with a brief "copied" confirmation on the button.
  const shareSession = async (code: string) => {
    const url = joinUrlForCode(code);
    const text = t('host.hub.session.shareText', {code});
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({title: t('app.name'), text, url});
        return;
      } catch {
        /* user dismissed the sheet: fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode((c) => (c === code ? null : c)), 1800);
    } catch {
      /* clipboard blocked: nothing to do */
    }
  };

  const ageLabel = (createdAt: string): string => {
    const min = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (min < 1) return t('host.hub.session.age.now');
    if (min < 60) return t('host.hub.session.age.min', {n: min});
    return t('host.hub.session.age.hr', {n: Math.floor(min / 60)});
  };

  const seats = activeRooms.reduce((sum, r) => sum + r.rosterSize, 0);
  const furthest = activeRooms.reduce(
    (max, r) => Math.max(max, PHASE_ORDER.indexOf(r.phase)),
    -1,
  );
  const furthestLabel =
    furthest >= 0 ? t(`phase.${PHASE_ORDER[furthest]}` as 'phase.lobby') : t('host.hub.stat.none');

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <img
          src={mascot('mascot-cheer')}
          alt=''
          aria-hidden='true'
          style={{height: 64, width: 'auto', flex: '0 0 auto'}}
        />
        <div>
          <h2 style={pageTitle}>{t('host.hub.welcome')}</h2>
          <p className='t14' style={{marginTop: 6}}>
            {t('host.hub.subtitle', {email})}
          </p>
        </div>
      </div>

      {/* Row 1: stats */}
      <div style={{...consoleGrid, marginBottom: 20}}>
        <div style={{...statTile, ...span(4)}}>
          <span style={statValue}>{activeRooms.length}</span>
          <span style={statLabel}>{t('host.hub.stat.active')}</span>
        </div>
        <div style={{...statTile, ...span(4)}}>
          <span style={statValue}>{seats}</span>
          <span style={statLabel}>{t('host.hub.stat.seats')}</span>
        </div>
        <div style={{...statTile, ...span(4)}}>
          <span style={{...statValue, fontSize: 24, fontFamily: dosisFont}}>
            {furthestLabel}
          </span>
          <span style={statLabel}>{t('host.hub.stat.phase')}</span>
        </div>
      </div>

      {/* Row 2: actions */}
      <div style={{...consoleGrid, marginBottom: 20}}>
        <div className={styles.card} style={{...heroCard, ...span(8)}}>
          <div style={{maxWidth: '64%'}}>
            <h3 style={cardHeading}>{t('host.hub.start.title')}</h3>
            <p className='t16' style={{marginTop: 10}}>
              {t('host.hub.start.body')}
            </p>
          </div>
          <components.Button
            label={t('host.hub.start.cta')}
            onClick={onStartGame}
            colorScheme='primary'
            containerStyle={{marginTop: 24, maxWidth: 260}}
            style={{textTransform: 'none'}}
          />
          <img
            src={mascot('mascot-wave')}
            alt=''
            aria-hidden='true'
            style={{
              position: 'absolute',
              right: -6,
              bottom: -10,
              height: 168,
              width: 'auto',
              opacity: 0.97,
              pointerEvents: 'none',
              userSelect: 'none',
              filter: 'drop-shadow(0 10px 22px rgba(0, 121, 95, 0.16))',
            }}
          />
        </div>

        <div
          className={styles.card}
          style={{...surfaceCard, ...span(4), position: 'relative', overflow: 'hidden'}}
        >
          <div style={{maxWidth: '72%'}}>
            <h3 style={cardHeading}>{t('host.hub.rehearse.title')}</h3>
            <p className='t14' style={{marginTop: 8}}>
              {t('host.hub.rehearse.body')}
            </p>
          </div>
          <components.Button
            label={t('host.hub.rehearse.cta')}
            href={Routes.REVEAL_DEMO}
            colorScheme='secondary'
            containerStyle={{marginTop: 20, maxWidth: 200}}
            style={{textTransform: 'none'}}
          />
          <img
            src={mascot('mascot-rehearse')}
            alt=''
            aria-hidden='true'
            style={{
              position: 'absolute',
              right: -4,
              bottom: -6,
              height: 104,
              width: 'auto',
              opacity: 0.95,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
        </div>
      </div>

      {/* Row 3: per-session list */}
      <div className={styles.card} style={{...surfaceCard, position: 'relative', overflow: 'hidden'}}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <h3 style={cardHeading}>
            {t('host.hub.sessions.title')} ({activeRooms.length})
          </h3>
          <button
            type='button'
            className={`clickable ${styles.rowBtn}`}
            style={rowActionSecondary}
            onClick={onStartGame}
          >
            <HostIcon name='plus' />
            {t('host.hub.sessions.new')}
          </button>
        </div>

        {activeRooms.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              padding: '28px 16px 20px',
            }}
          >
            <img
              src={mascot('mascot-peek')}
              alt=''
              aria-hidden='true'
              style={{height: 132, width: 'auto', marginBottom: 12}}
            />
            <p className='t16' style={{maxWidth: 340}}>
              {t('host.hub.sessions.empty')}
            </p>
            <components.Button
              label={t('host.hub.start.cta')}
              onClick={onStartGame}
              colorScheme='primary'
              containerStyle={{marginTop: 16, maxWidth: 220}}
              style={{textTransform: 'none'}}
            />
          </div>
        ) : (
          <ul
            style={{
              listStyle: 'none',
              margin: '14px 0 0',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {activeRooms.map((room) => (
              <li key={room.code} className={styles.row} style={sessionRow}>
                <div style={{display: 'flex', alignItems: 'center', gap: 12, minWidth: 0}}>
                  <span
                    aria-hidden='true'
                    style={{
                      flex: '0 0 auto',
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: PHASE_DOT[room.phase],
                    }}
                  />
                  <div style={{minWidth: 0}}>
                    <span style={{...codeText, fontSize: 17}}>{room.code}</span>
                    <span className='t12' style={{display: 'block', marginTop: 2}}>
                      {t(`phase.${room.phase}` as 'phase.lobby')} ·{' '}
                      {t('host.hub.session.seats', {count: room.rosterSize})} ·{' '}
                      {ageLabel(room.createdAt)}
                    </span>
                  </div>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap'}}>
                  <button
                    type='button'
                    className={`clickable ${styles.rowBtn}`}
                    style={rowActionPrimary}
                    onClick={() => onReopenRoom(room.code)}
                  >
                    <HostIcon name='manage' color='var(--neon-white)' />
                    {t('host.hub.session.manage')}
                  </button>
                  <button
                    type='button'
                    className={`clickable ${styles.rowBtn}`}
                    style={rowActionSecondary}
                    onClick={() => void shareSession(room.code)}
                  >
                    <HostIcon name='share' />
                    {copiedCode === room.code
                      ? t('host.hub.session.copied')
                      : t('host.hub.session.share')}
                  </button>
                  <button
                    type='button'
                    className={`clickable ${styles.rowBtn}`}
                    style={rowActionSecondary}
                    onClick={() => openBigScreen(room.code)}
                  >
                    <HostIcon name='screen' />
                    {t('host.hub.session.screen')}
                  </button>
                  <a
                    className={`clickable ${styles.rowBtn}`}
                    href={Routes.REVEAL_DEMO}
                    style={{...rowActionSecondary, textDecoration: 'none'}}
                  >
                    <HostIcon name='rehearse' />
                    {t('host.hub.session.rehearse')}
                  </a>
                  <button
                    type='button'
                    className={`clickable ${styles.rowBtn}`}
                    style={rowActionDanger}
                    onClick={() => setEndCode(room.code)}
                  >
                    <HostIcon name='delete' />
                    {t('host.hub.session.end')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <EndRoomDialog
        open={endCode !== null}
        code={endCode ?? ''}
        onClose={() => setEndCode(null)}
        onConfirm={() => {
          if (endCode) onDeleteSession(endCode);
          setEndCode(null);
        }}
      />
    </div>
  );
};
