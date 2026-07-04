'use client';

import React from 'react';

import {components} from '../../../components';
import {useT} from '../../../i18n';
import type {ActiveRoomEntry} from '../../../lib/hostRoomSync';
import {openBigScreen} from '../../../lib/openBigScreen';
import {Routes} from '../../../routes';
import {consoleCard, cardHeading, dosisFont} from '../components/hostStyles';

type Props = {
  email: string;
  activeRooms: ActiveRoomEntry[];
  onStartGame: () => void;
  onReopenRoom: (code: string) => void;
};

export const ConsoleHubScreen: React.FC<Props> = ({
  email,
  activeRooms,
  onStartGame,
  onReopenRoom,
}) => {
  const t = useT();

  const cardStyle: React.CSSProperties = {
    ...consoleCard,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    height: '100%',
  };

  return (
    <div>
      <div style={{marginBottom: 8}}>
        <h2 style={{fontFamily: dosisFont, fontSize: 28, color: 'var(--main-color)'}}>
          {t('host.hub.title')}
        </h2>
        <p className='t14' style={{marginTop: 6}}>
          {t('host.hub.subtitle', {email})}
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
          gap: 20,
          alignItems: 'stretch',
          marginTop: 24,
        }}
      >
        {/* Row 1: start (hero) + rehearse */}
        <div style={{...cardStyle, gridColumn: 'span 7', padding: 28, gap: 12}}>
          <span style={cardHeading}>{t('host.hub.start.title')}</span>
          <p className='t16' style={{maxWidth: 460}}>{t('host.hub.start.body')}</p>
          <components.Button
            label={t('host.hub.start.cta')}
            onClick={onStartGame}
            colorScheme='primary'
            containerStyle={{marginTop: 'auto', paddingTop: 16, maxWidth: 260}}
            style={{textTransform: 'none'}}
          />
        </div>

        <div style={{...cardStyle, gridColumn: 'span 5'}}>
          <span style={cardHeading}>{t('host.hub.rehearse.title')}</span>
          <p className='t14'>{t('host.hub.rehearse.body')}</p>
          <components.Button
            label={t('host.hub.rehearse.cta')}
            href={Routes.REVEAL_DEMO}
            colorScheme='secondary'
            containerStyle={{marginTop: 'auto', paddingTop: 12}}
            style={{textTransform: 'none'}}
          />
        </div>

        {/* Row 2: reopen + big screen */}
        <div style={{...cardStyle, gridColumn: 'span 7'}}>
          <span style={cardHeading}>{t('host.hub.reopen.title')}</span>
          <p className='t14'>{t('host.hub.reopen.body')}</p>
          {activeRooms.length === 0 ? (
            <p className='t12' style={{marginTop: 'auto', paddingTop: 12, color: 'var(--text-color)'}}>
              {t('host.hub.reopen.empty')}
            </p>
          ) : (
            <ul
              style={{
                listStyle: 'none',
                margin: '8px 0 0',
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {activeRooms.map((room) => (
                <li
                  key={room.code}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-control)',
                    backgroundColor: 'var(--host-surface)',
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontFamily: 'var(--font-league-spartan), monospace',
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                      }}
                    >
                      {room.code}
                    </span>
                    <span className='t12' style={{display: 'block', marginTop: 2}}>
                      {t(`phase.${room.phase}` as 'phase.lobby')} ·{' '}
                      {t('host.hub.reopen.players', {count: room.rosterSize})}
                    </span>
                  </div>
                  <button
                    type='button'
                    className='clickable t14'
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-pill)',
                      border: '1px solid var(--main-color)',
                      background: 'var(--white-color)',
                      color: 'var(--main-color)',
                      fontWeight: 600,
                    }}
                    onClick={() => onReopenRoom(room.code)}
                  >
                    {t('host.hub.reopen.open')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{...cardStyle, gridColumn: 'span 5'}}>
          <span style={cardHeading}>{t('host.hub.bigscreen.title')}</span>
          <p className='t14'>{t('host.hub.bigscreen.body')}</p>
          {activeRooms.length === 0 ? (
            <p className='t12' style={{marginTop: 'auto', paddingTop: 12, color: 'var(--text-color)'}}>
              {t('host.hub.reopen.empty')}
            </p>
          ) : (
            <div style={{display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 'auto', paddingTop: 12}}>
              {activeRooms.map((room) => (
                <button
                  key={`screen-${room.code}`}
                  type='button'
                  className='clickable t14'
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-pill)',
                    border: 'none',
                    backgroundColor: 'var(--main-color)',
                    color: 'var(--neon-white)',
                    fontWeight: 600,
                  }}
                  onClick={() => openBigScreen(room.code)}
                >
                  {t('host.hub.bigscreen.open', {code: room.code})}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
