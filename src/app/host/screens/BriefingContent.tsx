'use client';

import React from 'react';

import {components} from '../../../components';
import {useT} from '../../../i18n';
import {
  BRIEFING_SLIDE_COUNT,
  getBriefingSlide,
  normalizeBriefingIndex,
} from '../../../lib/briefingContent';
import type {RoomMode} from '../../../lib/types';
import {consoleCard, cardHeading} from '../components/hostStyles';

type Props = {
  briefingIndex: number;
  mode: RoomMode;
  onBriefingIndexChange: (index: number) => void;
  onStart: () => void;
};

export const BriefingContent: React.FC<Props> = ({
  briefingIndex,
  mode,
  onBriefingIndexChange,
  onStart,
}) => {
  const t = useT();
  const currentIndex = normalizeBriefingIndex(briefingIndex);
  const slide = getBriefingSlide(currentIndex, mode);
  const isFirstFrame = currentIndex === 0;
  const isLastFrame = currentIndex === BRIEFING_SLIDE_COUNT - 1;

  const moveFrame = (nextIndex: number) => {
    onBriefingIndexChange(normalizeBriefingIndex(nextIndex));
  };

  return (
    <div
      style={{
        maxWidth: 520,
      }}
    >
      <div style={consoleCard}>
        <span style={cardHeading}>{t('phase.briefing')}</span>
        <p className='t16' style={{marginTop: 12, lineHeight: 1.5}}>
          {t('host.briefing.body')}
        </p>
        <div
          style={{
            marginTop: 24,
            padding: 16,
            borderRadius: 8,
            backgroundColor: 'var(--host-surface)',
          }}
        >
          <p className='t13' style={{fontWeight: 700, color: 'var(--accent-deep)'}}>
            {t('host.briefing.frame', {
              n: currentIndex + 1,
              total: BRIEFING_SLIDE_COUNT,
            })}
          </p>
          <p
            style={{
              marginTop: 6,
              fontFamily: 'var(--font-dosis), var(--font-noto-sc), sans-serif',
              fontSize: 24,
              fontWeight: 600,
              lineHeight: 1.1,
            }}
          >
            {t(slide.title)}
          </p>
        </div>
        <div style={{display: 'flex', gap: 10, marginTop: 16}}>
          <components.Button
            label={t('host.briefing.prev')}
            onClick={() => moveFrame(currentIndex - 1)}
            colorScheme='secondary'
            disabled={isFirstFrame}
            containerStyle={{flex: 1}}
            style={{textTransform: 'none'}}
          />
          <components.Button
            label={t('host.briefing.next')}
            onClick={() => moveFrame(currentIndex + 1)}
            colorScheme='secondary'
            disabled={isLastFrame}
            containerStyle={{flex: 1}}
            style={{textTransform: 'none'}}
          />
        </div>
        <components.Button
          label={t('host.briefing.advance')}
          onClick={onStart}
          colorScheme='primary'
          containerStyle={{marginTop: 14}}
          style={{textTransform: 'none'}}
        />
      </div>
    </div>
  );
};
