'use client';

import React from 'react';

import {components} from '../../../components';
import {useT} from '../../../i18n';
import {REVEAL_FLOOR, type CoverageEntry} from '../../../mock/room';
import {consoleCard, cardHeading, dosisFont} from './hostStyles';

type Props = {
  triggered: boolean;
  blockers: CoverageEntry[];
  onTrigger: () => void;
};

export const RevealTriggerCard: React.FC<Props> = ({
  triggered,
  blockers,
  onTrigger,
}) => {
  const t = useT();
  const blocked = blockers.length > 0;

  return (
    <div style={consoleCard}>
      <span style={cardHeading}>{t('phase.reveal')}</span>
      <p className='t14' style={{marginTop: 10, lineHeight: 1.5}}>
        {t('host.wrap.reveal.sub')}
      </p>

      {triggered ? (
        <p
          role='status'
          style={{
            marginTop: 16,
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--accent-deep)',
            fontFamily: dosisFont,
          }}
        >
          {t('host.wrap.reveal.triggered')}
        </p>
      ) : (
        <>
          <components.Button
            label={t('host.wrap.reveal.cta')}
            onClick={blocked ? undefined : onTrigger}
            colorScheme='primary'
            containerStyle={{marginTop: 16}}
            style={{
              textTransform: 'none',
              opacity: blocked ? 0.45 : 1,
              cursor: blocked ? 'not-allowed' : 'pointer',
            }}
          />
          {blocked && (
            <div style={{marginTop: 12}}>
              <p className='t14' style={{color: 'var(--warn-color)', fontWeight: 600}}>
                {t('host.wrap.reveal.blockedCount', {count: blockers.length})}
              </p>
              <ul style={{marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4}}>
                {blockers.map((b) => (
                  <li key={b.name} className='t12' style={{color: 'var(--warn-color)'}}>
                    {t('host.game.coverage.under', {
                      name: b.name,
                      count: REVEAL_FLOOR - b.noteCount,
                    })}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};
