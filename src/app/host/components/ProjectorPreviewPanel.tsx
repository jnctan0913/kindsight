'use client';

import React, {useEffect, useRef, useState} from 'react';

import {components} from '../../../components';
import {useT} from '../../../i18n';
import type {ScreenRoomState} from '../../../lib/hostRoomSync';
import {bigScreenUrl} from '../../../lib/openBigScreen';
import {cardHeading, consoleCard} from './hostStyles';

type Props = {
  state: ScreenRoomState | null;
  onOpenBigScreen: () => void;
};

// The projector uses viewport (vw/vh) sizing, so it only renders faithfully at a
// real 16:9 viewport. Rendering it directly into the narrow rail overflows and
// crops. Instead, load the actual /screen route in a fixed 1280x720 iframe (its
// own viewport) and CSS-scale it down: a true-to-life mini projector.
const STAGE_W = 1280;
const STAGE_H = 720;

export const ProjectorPreviewPanel: React.FC<Props> = ({state, onOpenBigScreen}) => {
  const t = useT();
  const frameBoxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = frameBoxRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / STAGE_W);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const src = state?.code ? bigScreenUrl(state.code) : null;

  return (
    <div style={{...consoleCard, padding: 18}}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12}}>
        <span style={cardHeading}>{t('host.projectorPreview.title')}</span>
      </div>
      <p className='t13' style={{marginTop: 8, lineHeight: 1.4}}>
        {t('host.projectorPreview.subtitle')}
      </p>
      <div
        ref={frameBoxRef}
        style={{
          marginTop: 14,
          aspectRatio: '16 / 9',
          width: '100%',
          overflow: 'hidden',
          borderRadius: 8,
          border: '1px solid rgba(30, 37, 56, 0.12)',
          backgroundColor: 'var(--neon-white)',
          position: 'relative',
        }}
      >
        {src && scale > 0 && (
          <iframe
            key={src}
            src={src}
            title={t('host.projectorPreview.title')}
            aria-hidden='true'
            tabIndex={-1}
            scrolling='no'
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: STAGE_W,
              height: STAGE_H,
              border: 'none',
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              pointerEvents: 'none',
            }}
          />
        )}
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
