'use client';

import React, {useState} from 'react';

import {useT} from '../../../i18n';
import {ConfirmDialog} from './ConfirmDialog';
import {dosisFont} from './hostStyles';

type Props = {
  open: boolean;
  code: string;
  onClose: () => void;
  onConfirm: () => void;
};

// Retype-the-room-code confirm for the hard delete. Shared by the wrap-up
// danger zone and the console chrome so the guard is identical everywhere.
export const EndRoomDialog: React.FC<Props> = ({open, code, onClose, onConfirm}) => {
  const t = useT();
  const [confirmCode, setConfirmCode] = useState('');

  const close = () => {
    setConfirmCode('');
    onClose();
  };

  return (
    <ConfirmDialog
      open={open}
      danger
      title={t('host.wrap.end.cta')}
      body={t('host.wrap.end.body')}
      confirmLabel={t('host.wrap.end.cta')}
      confirmDisabled={confirmCode.trim().toUpperCase() !== code.toUpperCase()}
      onCancel={close}
      onConfirm={() => {
        setConfirmCode('');
        onConfirm();
      }}
    >
      <div style={{marginTop: 16}}>
        <label
          htmlFor='end-code'
          style={{
            display: 'block',
            marginBottom: 8,
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--main-color)',
            fontFamily: dosisFont,
          }}
        >
          {t('host.wrap.end.field', {code})}
        </label>
        <input
          id='end-code'
          value={confirmCode}
          onChange={(e) => setConfirmCode(e.target.value.toUpperCase())}
          autoComplete='off'
          spellCheck={false}
          style={{
            width: '100%',
            height: 50,
            padding: '0 16px',
            borderRadius: 'var(--radius-control)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--white-color)',
            fontSize: 18,
            letterSpacing: '0.12em',
            color: 'var(--main-color)',
            fontFamily:
              'var(--font-league-spartan), var(--font-noto-sc), sans-serif',
          }}
        />
        <p className='t12' style={{marginTop: 10}}>
          {t('host.wrap.end.ttl')}
        </p>
      </div>
    </ConfirmDialog>
  );
};
