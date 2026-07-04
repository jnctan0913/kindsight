import React from 'react';
import Link from 'next/link';

import {asset} from '../config';
import {Routes} from '../routes';

export default function Home() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        minHeight: '100dvh',
        padding: 24,
        textAlign: 'center',
        backgroundColor: 'var(--night-surface)',
      }}
    >
      <img
        src={asset('/assets/kindsight/kindsight-logo-transparent.png')}
        alt='Kindsight'
        style={{width: '60%', maxWidth: 280, height: 'auto'}}
      />
      <h1 style={{color: 'var(--neon-white)'}}>Kindsight</h1>
      <p className='t16' style={{color: 'rgba(245, 250, 251, 0.7)'}}>
        The light behind you
      </p>
      <Link
        href={Routes.REVEAL_DEMO}
        style={{
          marginTop: 24,
          padding: '16px 32px',
          borderRadius: 'var(--radius-control)',
          backgroundColor: 'var(--main-color)',
          boxShadow: 'var(--glow-teal), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          color: 'var(--neon-white)',
          fontSize: 18,
          fontFamily: 'var(--font-league-spartan)',
        }}
      >
        Open the reveal demo
      </Link>
    </main>
  );
}
