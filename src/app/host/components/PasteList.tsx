'use client';

import React, {useState} from 'react';

import {components} from '../../../components';
import {useT} from '../../../i18n';
import {dosisFont, fieldLabel} from './hostStyles';

type Props = {
  onAddAll: (names: string[]) => void;
};

const parse = (raw: string) =>
  raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

export const PasteList: React.FC<Props> = ({onAddAll}) => {
  const t = useT();
  const [value, setValue] = useState('');
  const names = parse(value);
  const showEmptyHint = value.length > 0 && names.length === 0;

  const submit = () => {
    if (names.length === 0) return;
    onAddAll(names);
    setValue('');
  };

  return (
    <div>
      <span style={fieldLabel}>{t('host.roster.paste.hint')}</span>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t('host.roster.paste.hint')}
        rows={5}
        style={{
          width: '100%',
          resize: 'vertical',
          padding: 14,
          borderRadius: 'var(--radius-control)',
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--white-color)',
          fontSize: 16,
          lineHeight: 1.5,
          color: 'var(--main-color)',
          fontFamily: dosisFont,
        }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginTop: 10,
        }}
      >
        <span className='t12'>
          {showEmptyHint
            ? t('host.roster.paste.hint')
            : names.length > 0
              ? t('host.roster.parsed', {count: names.length})
              : ''}
        </span>
        <components.Button
          label={t('host.roster.paste.cta')}
          onClick={submit}
          colorScheme='secondary'
          containerStyle={{width: 140}}
          style={{
            height: 44,
            textTransform: 'none',
            opacity: names.length === 0 ? 0.45 : 1,
          }}
        />
      </div>
    </div>
  );
};
