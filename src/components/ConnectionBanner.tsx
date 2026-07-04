'use client';

import React, {useEffect, useRef, useState} from 'react';

import {useRoomStore} from '@/stores/room';
import {useT} from '@/i18n';

// A thin top banner that surfaces realtime reconnects (PRD R2/R3). Reconnecting
// shows persistently; a brief "reconnected" confirmation flashes once the
// channel recovers so a player knows their pings resumed.
export const ConnectionBanner: React.FC = () => {
  const t = useT();
  const connection = useRoomStore((s) => s.connection);
  const [showRestored, setShowRestored] = useState(false);
  const wasDown = useRef(false);

  useEffect(() => {
    if (connection === 'reconnecting') {
      wasDown.current = true;
      setShowRestored(false);
      return;
    }
    if (connection === 'connected' && wasDown.current) {
      wasDown.current = false;
      setShowRestored(true);
      const timer = window.setTimeout(() => setShowRestored(false), 2500);
      return () => window.clearTimeout(timer);
    }
  }, [connection]);

  const reconnecting = connection === 'reconnecting';
  if (!reconnecting && !showRestored) return null;

  return (
    <div
      role='status'
      aria-live='polite'
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '8px 16px',
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--white-color)',
        backgroundColor: reconnecting ? 'var(--warn-color)' : 'var(--accent-deep)',
        fontFamily: 'var(--font-dosis), var(--font-noto-sc), sans-serif',
        transition: 'background-color 200ms ease-in-out',
      }}
    >
      {reconnecting && (
        <span
          aria-hidden='true'
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.4)',
            borderTopColor: 'var(--white-color)',
            animation: 'kindsight-spin 0.8s linear infinite',
          }}
        />
      )}
      {reconnecting
        ? t('chrome.connection.reconnecting')
        : t('chrome.connection.restored')}
      <style>{'@keyframes kindsight-spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );
};
