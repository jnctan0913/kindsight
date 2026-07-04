'use client';

import React from 'react';

import {components} from '../../../components';
import {useT} from '../../../i18n';
import type {ScreenRoomState} from '../../../lib/hostRoomSync';
import {ProjectorView} from '../../screen/ProjectorView';
import {cardHeading, consoleCard} from './hostStyles';

type Props = {
  state: ScreenRoomState | null;
  onOpenBigScreen: () => void;
};

export const ProjectorPreviewPanel: React.FC<Props> = ({state, onOpenBigScreen}) => {
  const t = useT();

  return (
    <div style={{...consoleCard, padding: 18}}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12}}>
        <span style={cardHeading}>{t('host.projectorPreview.title')}</span>
      </div>
      <p className='t13' style={{marginTop: 8, lineHeight: 1.4}}>
        {t('host.projectorPreview.subtitle')}
      </p>
      <div
        style={{
          marginTop: 14,
          aspectRatio: '16 / 9',
          width: '100%',
          overflow: 'hidden',
          borderRadius: 8,
          border: '1px solid rgba(30, 37, 56, 0.12)',
          backgroundColor: 'var(--neon-white)',
        }}
      >
        {state && <ProjectorView state={state} preview />}
      </div>
      <components.Button
        label={t('host.projectorPreview.open')}
        onClick={onOpenBigScreen}
        colorScheme='secondary'
        containerStyle={{marginTop: 14}}
        style={{height: 44, fontSize: 16, textTransform: 'none'}}
      />
    </div>
  );
};
