'use client';

import React from 'react';

import {useT} from '../../../i18n';
import type {HostRosterEntry} from '../../../mock/room';
import {dosisFont, numFont} from './hostStyles';

type Props = {
  roster: HostRosterEntry[];
  onRename?: (id: string, name: string) => void;
  onRemove?: (id: string) => void;
};

const cellStyle: React.CSSProperties = {
  padding: '12px 8px',
  textAlign: 'left',
  verticalAlign: 'middle',
  borderBottom: '1px solid var(--border-color)',
};

const actionLabel: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--accent-deep)',
  fontFamily: dosisFont,
};

export const ClaimStatusTable: React.FC<Props> = ({roster, onRename, onRemove}) => {
  const t = useT();

  const promptRename = (id: string, current: string) => {
    if (!onRename) return;
    const next = window.prompt(t('host.lobby.rename.prompt', {name: current}), current);
    const trimmed = next?.trim();
    if (trimmed && trimmed !== current) onRename(id, trimmed);
  };

  const confirmRemove = (id: string, name: string) => {
    if (!onRemove) return;
    if (window.confirm(t('host.lobby.remove.confirm', {name}))) onRemove(id);
  };

  return (
    <div style={{overflowX: 'auto'}}>
      <table style={{width: '100%', borderCollapse: 'collapse', minWidth: 480}}>
        <thead>
          <tr>
            <th style={{...cellStyle, ...headerStyle}}>{t('host.lobby.col.name')}</th>
            <th style={{...cellStyle, ...headerStyle}}>{t('host.lobby.col.status')}</th>
            <th style={{...cellStyle, ...headerStyle}} />
          </tr>
        </thead>
        <tbody>
          {roster.map((entry) => (
            <tr key={entry.id}>
              <td style={cellStyle}>
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 500,
                    color: entry.claimed
                      ? 'var(--main-color)'
                      : 'var(--text-color)',
                    fontFamily: dosisFont,
                  }}
                >
                  {entry.name}
                </span>
              </td>
              <td style={cellStyle}>
                <span style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>
                  <span
                    aria-hidden='true'
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: entry.claimed
                        ? 'var(--accent-color)'
                        : 'var(--border-color)',
                    }}
                  />
                  <span
                    className='t14'
                    style={{
                      color: entry.claimed
                        ? 'var(--main-color)'
                        : 'var(--text-color)',
                    }}
                  >
                    {entry.claimed
                      ? t('host.lobby.status.claimed')
                      : t('host.lobby.status.waiting')}
                  </span>
                  {entry.claimed && entry.claimedAt && (
                    <span className='t12' style={{fontFamily: numFont}}>
                      {entry.claimedAt}
                    </span>
                  )}
                </span>
              </td>
              <td style={{...cellStyle, textAlign: 'right'}}>
                <span style={{display: 'inline-flex', gap: 14}}>
                  {onRename && (
                    <button
                      type='button'
                      className='clickable'
                      style={actionLabel}
                      onClick={() => promptRename(entry.id, entry.name)}
                    >
                      {t('host.lobby.action.rename')}
                    </button>
                  )}
                  {onRemove && (
                    <button
                      type='button'
                      className='clickable'
                      style={{...actionLabel, color: 'var(--warn-color)'}}
                      onClick={() => confirmRemove(entry.id, entry.name)}
                    >
                      {t('host.lobby.action.remove')}
                    </button>
                  )}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const headerStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: 'var(--text-color)',
  fontFamily: dosisFont,
};
