'use client';

import React, {useMemo, useState} from 'react';

import {asset} from '../../../config';
import {components} from '../../../components';
import {useT} from '../../../i18n';
import {assignAvatars} from '../../../lib/avatar';
import type {HostRosterEntry} from '../../../mock/room';
import {ConfirmDialog} from './ConfirmDialog';
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

type Target = {id: string; name: string};

export const ClaimStatusTable: React.FC<Props> = ({roster, onRename, onRemove}) => {
  const t = useT();
  const avatars = useMemo(
    () => assignAvatars(roster.map((r) => r.id)),
    [roster],
  );
  const [renameTarget, setRenameTarget] = useState<Target | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [removeTarget, setRemoveTarget] = useState<Target | null>(null);

  const openRename = (id: string, name: string) => {
    setRenameTarget({id, name});
    setRenameValue(name);
  };
  const submitRename = () => {
    const next = renameValue.trim();
    if (renameTarget && next && next !== renameTarget.name) onRename?.(renameTarget.id, next);
    setRenameTarget(null);
  };
  const submitRemove = () => {
    if (removeTarget) onRemove?.(removeTarget.id);
    setRemoveTarget(null);
  };

  return (
    <>
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
                <span style={{display: 'inline-flex', alignItems: 'center', gap: 10}}>
                  <components.Avatar
                    avatarId={entry.claimed ? avatars.get(entry.id) : undefined}
                    size='sm'
                  />
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
                      onClick={() => openRename(entry.id, entry.name)}
                    >
                      {t('host.lobby.action.rename')}
                    </button>
                  )}
                  {onRemove && (
                    <button
                      type='button'
                      className='clickable'
                      style={{...actionLabel, color: 'var(--warn-color)'}}
                      onClick={() => setRemoveTarget({id: entry.id, name: entry.name})}
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

    <components.Modal
      open={renameTarget !== null}
      onClose={() => setRenameTarget(null)}
      labelledBy='rename-title'
      containerStyle={{maxWidth: 600}}
    >
      <div style={{display: 'flex', gap: 20, alignItems: 'center'}}>
        <div style={{flex: 1, minWidth: 0}}>
          <h4 id='rename-title' style={{fontFamily: dosisFont}}>
            {t('host.lobby.action.rename')}
          </h4>
          <p className='t14' style={{marginTop: 10, lineHeight: 1.5}}>
            {t('host.lobby.rename.prompt', {name: renameTarget?.name ?? ''})}
          </p>
          <input
            aria-label={t('host.lobby.action.rename')}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            autoFocus
            maxLength={40}
            onKeyDown={(e) => {
              if (
                e.key === 'Enter' &&
                renameValue.trim() &&
                renameValue.trim() !== renameTarget?.name
              ) {
                submitRename();
              }
            }}
            style={{
              width: '100%',
              height: 50,
              marginTop: 14,
              padding: '0 16px',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--white-color)',
              fontSize: 16,
              color: 'var(--main-color)',
              fontFamily: dosisFont,
              boxSizing: 'border-box',
            }}
          />
          <div style={{display: 'flex', gap: 12, marginTop: 20}}>
            <components.Button
              label={t('common.cancel')}
              onClick={() => setRenameTarget(null)}
              colorScheme='secondary'
              containerStyle={{flex: 1}}
              style={{textTransform: 'none'}}
            />
            <components.Button
              label={t('host.lobby.action.rename')}
              onClick={
                !renameValue.trim() || renameValue.trim() === renameTarget?.name
                  ? undefined
                  : submitRename
              }
              colorScheme='primary'
              containerStyle={{flex: 1}}
              style={{
                textTransform: 'none',
                opacity:
                  !renameValue.trim() || renameValue.trim() === renameTarget?.name ? 0.45 : 1,
                cursor:
                  !renameValue.trim() || renameValue.trim() === renameTarget?.name
                    ? 'not-allowed'
                    : 'pointer',
              }}
            />
          </div>
        </div>
        <img
          src={asset('/assets/kindsight/mascot-rehearse.png')}
          alt=''
          aria-hidden='true'
          style={{height: 200, width: 'auto', flex: '0 0 auto', alignSelf: 'flex-end'}}
        />
      </div>
    </components.Modal>

    <ConfirmDialog
      open={removeTarget !== null}
      danger
      title={t('host.lobby.action.remove')}
      body={t('host.lobby.remove.confirm', {name: removeTarget?.name ?? ''})}
      confirmLabel={t('host.lobby.action.remove')}
      onCancel={() => setRemoveTarget(null)}
      onConfirm={submitRemove}
    />
    </>
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
