'use client';

import React, {useRef, useState} from 'react';
import {QRCodeCanvas} from 'qrcode.react';

import {useT} from '../../../i18n';
import {HostIcon} from './HostIcon';
import {rowActionSecondary} from './hostStyles';

type Props = {
  value: string;
  size?: number;
  // Rendered in the button column, below the Copy QR button (e.g. a Share button).
  children?: React.ReactNode;
};

// Small join QR with a "copy the QR image" action: writes the canvas PNG to the
// clipboard where supported, otherwise downloads it.
export const JoinQR: React.FC<Props> = ({value, size = 76, children}) => {
  const t = useT();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const copyImage = async () => {
    const canvas = wrapRef.current?.querySelector('canvas');
    if (!canvas) return;
    const download = () => {
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'kindsight-qr.png';
      a.click();
    };
    try {
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
      const ClipboardItemCtor = (window as {ClipboardItem?: typeof ClipboardItem}).ClipboardItem;
      if (blob && navigator.clipboard && ClipboardItemCtor) {
        await navigator.clipboard.write([new ClipboardItemCtor({'image/png': blob})]);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
        return;
      }
      download();
    } catch {
      download();
    }
  };

  return (
    <div ref={wrapRef} style={{display: 'flex', alignItems: 'center', gap: 12}}>
      <div
        style={{
          background: 'var(--white-color)',
          padding: 6,
          borderRadius: 10,
          boxShadow: 'var(--shadow-soft)',
          lineHeight: 0,
          flex: '0 0 auto',
        }}
      >
        <QRCodeCanvas
          value={value}
          size={size}
          level='M'
          marginSize={1}
          fgColor='#1E2538'
          bgColor='#ffffff'
        />
      </div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
        <button
          type='button'
          className='clickable'
          style={rowActionSecondary}
          onClick={() => void copyImage()}
        >
          <HostIcon name='share' />
          {copied ? t('host.hub.session.qrCopied') : t('host.hub.session.copyQr')}
        </button>
        {children}
      </div>
    </div>
  );
};
