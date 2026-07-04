'use client';

import React from 'react';

import {components} from '../../../components';
import {useT} from '../../../i18n';
import {consoleCard, cardHeading} from '../components/hostStyles';

type Props = {
  onStart: () => void;
};

export const BriefingContent: React.FC<Props> = ({onStart}) => {
  const t = useT();

  return (
    <div style={{maxWidth: 560}}>
      <div style={consoleCard}>
        <span style={cardHeading}>{t('phase.briefing')}</span>
        <p className='t16' style={{marginTop: 12, lineHeight: 1.5}}>
          {t('host.briefing.body')}
        </p>
        <components.Button
          label={t('host.briefing.advance')}
          onClick={onStart}
          colorScheme='primary'
          containerStyle={{marginTop: 20, maxWidth: 280}}
          style={{textTransform: 'none'}}
        />
      </div>
    </div>
  );
};
