'use client';

import React from 'react';

import {components} from '../../../components';
import {useT} from '../../../i18n';
import {dosisFont} from './hostStyles';

type Props = {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmDisabled?: boolean;
  danger?: boolean;
  children?: React.ReactNode;
};

export const ConfirmDialog: React.FC<Props> = ({
  open,
  title,
  body,
  confirmLabel,
  onCancel,
  onConfirm,
  confirmDisabled,
  danger,
  children,
}) => {
  const t = useT();

  return (
    <components.Modal open={open} onClose={onCancel} labelledBy='confirm-title'>
      <h4 id='confirm-title' style={{fontFamily: dosisFont}}>
        {title}
      </h4>
      <p className='t14' style={{marginTop: 10, lineHeight: 1.5}}>
        {body}
      </p>

      {children}

      <div style={{display: 'flex', gap: 12, marginTop: 24}}>
        <components.Button
          label={t('common.cancel')}
          onClick={onCancel}
          colorScheme='secondary'
          containerStyle={{flex: 1}}
          style={{textTransform: 'none'}}
        />
        <components.Button
          label={confirmLabel}
          onClick={confirmDisabled ? undefined : onConfirm}
          colorScheme='primary'
          containerStyle={{flex: 1}}
          style={{
            textTransform: 'none',
            opacity: confirmDisabled ? 0.45 : 1,
            cursor: confirmDisabled ? 'not-allowed' : 'pointer',
            background: danger ? 'var(--warn-color)' : undefined,
            color: danger ? 'var(--white-color)' : undefined,
          }}
        />
      </div>
    </components.Modal>
  );
};
