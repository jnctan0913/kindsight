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
        backgroundColor: 'var(--neon-white)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <img
          src={asset('/assets/kindsight/kindsight-logo-transparent.png')}
          alt='Kindsight'
          style={{width: '60%', maxWidth: 280, height: 'auto'}}
        />
        <p className='t16' style={{color: 'var(--text-color)', marginTop: 2}}>
          The light behind you
        </p>
      </div>
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
      <Link
        href={`${Routes.JOIN}/?code=KIND01`}
        style={{
          padding: '16px 32px',
          borderRadius: 'var(--radius-control)',
          backgroundColor: 'var(--main-color)',
          boxShadow: 'var(--glow-teal), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          color: 'var(--neon-white)',
          fontSize: 18,
          fontFamily: 'var(--font-league-spartan)',
        }}
      >
        Open the join flow demo
      </Link>
    </main>
  );
}
