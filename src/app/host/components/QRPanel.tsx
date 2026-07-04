'use client';

import React, {useState} from 'react';

import {useT} from '../../../i18n';
import {consoleCard, numFont, dosisFont} from './hostStyles';

type Props = {
  code: string;
  joinUrl: string;
  onOpenBigScreen?: () => void;
};

export const QRPanel: React.FC<Props> = ({code, joinUrl, onOpenBigScreen}) => {
  const t = useT();
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const text = t('host.hub.session.shareText', {code});
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({title: t('app.name'), text, url: joinUrl});
        return;
      } catch {
        /* dismissed: fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div style={{...consoleCard, textAlign: 'center'}}>
      <div
        aria-hidden='true'
        style={{
          width: 180,
          height: 180,
          margin: '0 auto',
          borderRadius: 'var(--radius-control)',
          background:
            'repeating-conic-gradient(var(--main-color) 0% 25%, var(--white-color) 0% 50%) 0 0 / 24px 24px',
          boxShadow: 'inset 0 0 0 8px var(--white-color)',
        }}
      />
      <p className='t12' style={{marginTop: 10}}>
        {joinUrl}
      </p>
      <p
        style={{
          marginTop: 12,
          fontSize: 40,
          fontWeight: 700,
          letterSpacing: '0.15em',
          color: 'var(--main-color)',
          fontFamily: numFont,
        }}
      >
        {code}
      </p>
      <p
        className='t14'
        style={{marginTop: 8, fontFamily: dosisFont}}
      >
        {t('host.lobby.qr.hint')}
      </p>
      <div
        style={{
          marginTop: 16,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          justifyContent: 'center',
        }}
      >
        <button
          type='button'
          className='clickable'
          onClick={() => void share()}
          style={{
            padding: '10px 18px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--main-color)',
            backgroundColor: 'var(--white-color)',
            color: 'var(--main-color)',
            fontSize: 14,
            fontWeight: 600,
            fontFamily: dosisFont,
          }}
        >
          {copied ? t('host.hub.session.copied') : t('host.hub.session.share')}
        </button>
        {onOpenBigScreen && (
          <button
            type='button'
            className='clickable'
            onClick={onOpenBigScreen}
            style={{
              padding: '10px 18px',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              backgroundColor: 'var(--main-color)',
              color: 'var(--neon-white)',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: dosisFont,
            }}
          >
            {t('host.bigscreen.open')}
          </button>
        )}
      </div>
    </div>
  );
};
