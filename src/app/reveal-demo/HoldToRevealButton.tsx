'use client';

import React, {useEffect, useRef, useState} from 'react';

import styles from './reveal.module.scss';
import {t} from './strings';

/*
  Breath state machine (DRD 3.2 state C):

    idle --pointerdown--> holding --3 breaths done--> complete --> onComplete()
      ^                     |
      |   release early     v
      +---- drain 400ms <---+

    idle --keyboard/AT activate or alt-link tap--> timed (same 3 breaths,
    no pointer required, press again drains back to idle)

  One breath = breathMs: inhale (first half) scales 1.0 -> 1.12 and fills one
  third of the ring, exhale (second half) scales back. Reduced motion: no
  scaling, ring fills linearly over 3 * breathMs.
*/

const BREATHS = 3;
const RING_BOX = 148;
const RING_RADIUS = 68;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

type RunMode = 'none' | 'hold' | 'timed' | 'drain' | 'complete';

type Props = {
  breathMs: number;
  reducedMotion: boolean;
  soundOn: boolean;
  onComplete: () => void;
};

function easeInOut(x: number): number {
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

function easeOut(x: number): number {
  return 1 - Math.pow(1 - x, 2);
}

function playChime() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as {webkitAudioContext: typeof AudioContext})
        .webkitAudioContext;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.connect(ctx.destination);
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.08, now + 0.03);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = i === 0 ? 1 : 0.35;
      osc.connect(g);
      g.connect(master);
      osc.start(now);
      osc.stop(now + 1.5);
    });
    window.setTimeout(() => void ctx.close(), 1700);
  } catch {
    /* audio is optional */
  }
}

export const HoldToRevealButton: React.FC<Props> = ({
  breathMs,
  reducedMotion,
  soundOn,
  onComplete,
}) => {
  const [coach, setCoach] = useState('');
  const [breathN, setBreathN] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const [bloom, setBloom] = useState(false);
  const [timedLink, setTimedLink] = useState(false);
  const [running, setRunning] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const rafRef = useRef(0);
  const modeRef = useRef<RunMode>('none');
  const progressRef = useRef(0);
  const soundOnRef = useRef(soundOn);
  soundOnRef.current = soundOn;

  const setRing = (progress: number) => {
    progressRef.current = progress;
    if (ringRef.current) {
      ringRef.current.style.strokeDashoffset = String(
        CIRCUMFERENCE * (1 - progress),
      );
    }
  };

  const setScale = (scale: number) => {
    if (buttonRef.current) {
      buttonRef.current.style.transform = `scale(${scale})`;
    }
  };

  const stopLoop = () => {
    cancelAnimationFrame(rafRef.current);
  };

  const finish = () => {
    stopLoop();
    modeRef.current = 'complete';
    setRunning(false);
    setRing(1);
    setScale(1);
    setBloom(true);
    if (navigator.vibrate) navigator.vibrate(20);
    if (soundOnRef.current) playChime();
    window.setTimeout(onComplete, reducedMotion ? 250 : 600);
  };

  const drain = () => {
    if (modeRef.current !== 'hold' && modeRef.current !== 'timed') return;
    stopLoop();
    modeRef.current = 'drain';
    setRunning(false);
    const from = progressRef.current;
    const t0 = performance.now();
    const step = (now: number) => {
      const x = Math.min((now - t0) / 400, 1);
      setRing(from * (1 - easeOut(x)));
      setScale(1);
      if (x < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        modeRef.current = 'none';
        setRing(0);
        setBreathN(0);
        setCoach(t('reveal.hold.reset'));
      }
    };
    rafRef.current = requestAnimationFrame(step);
  };

  const begin = (mode: 'hold' | 'timed') => {
    stopLoop();
    modeRef.current = mode;
    setRunning(true);
    setBloom(false);
    const total = BREATHS * breathMs;
    const half = breathMs / 2;
    const t0 = performance.now();
    let lastCycle = -1;
    const lines = [
      t('reveal.hold.line1'),
      t('reveal.hold.line2'),
      t('reveal.hold.line3'),
    ];
    const step = (now: number) => {
      const elapsed = now - t0;
      if (elapsed >= total) {
        finish();
        return;
      }
      const cycle = Math.min(Math.floor(elapsed / breathMs), BREATHS - 1);
      const inCycle = elapsed - cycle * breathMs;
      const inhale = inCycle < half;

      if (reducedMotion) {
        setRing(elapsed / total);
        setScale(1);
      } else {
        const withinThird = inhale ? easeOut(inCycle / half) : 1;
        setRing((cycle + withinThird) / BREATHS);
        const x = inhale ? inCycle / half : (inCycle - half) / half;
        const eased = easeInOut(x);
        setScale(inhale ? 1 + 0.12 * eased : 1.12 - 0.12 * eased);
      }

      if (cycle !== lastCycle) {
        lastCycle = cycle;
        setBreathN(cycle + 1);
        setCoach(lines[cycle]);
        if (cycle > 0 && navigator.vibrate) navigator.vibrate(10);
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  };

  useEffect(() => stopLoop, []);

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (timedLink) return;
    if (modeRef.current !== 'none') return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    begin('hold');
  };

  const onPointerEnd = () => {
    if (modeRef.current === 'hold') drain();
  };

  const toggleTimed = () => {
    if (modeRef.current === 'timed') {
      drain();
      return;
    }
    if (modeRef.current !== 'none') return;
    setAnnouncement(t('reveal.hold.altStart'));
    begin('timed');
  };

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // e.detail === 0 means keyboard or assistive-tech activation (DRD 3.4).
    if (timedLink || e.detail === 0) toggleTimed();
  };

  return (
    <div className={styles.holdArea}>
      <button
        ref={buttonRef}
        className={`${styles.holdButton} ${bloom ? styles.holdBloom : ''}`}
        aria-label={t('reveal.hold.button.aria')}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onClick={onClick}
        onContextMenu={(e) => e.preventDefault()}
      >
        <svg
          className={styles.ring}
          viewBox={`0 0 ${RING_BOX} ${RING_BOX}`}
          aria-hidden='true'
        >
          <defs>
            <linearGradient id='auroraRing' x1='0%' y1='0%' x2='100%' y2='100%'>
              <stop offset='0%' stopColor='#1E4FA3' />
              <stop offset='55%' stopColor='#00C79F' />
              <stop offset='100%' stopColor='#FFF3D6' />
            </linearGradient>
          </defs>
          <circle
            cx={RING_BOX / 2}
            cy={RING_BOX / 2}
            r={RING_RADIUS}
            fill='none'
            stroke='rgba(30, 37, 56, 0.12)'
            strokeWidth='6'
          />
          <circle
            ref={ringRef}
            cx={RING_BOX / 2}
            cy={RING_BOX / 2}
            r={RING_RADIUS}
            fill='none'
            stroke='url(#auroraRing)'
            strokeWidth='6'
            strokeLinecap='round'
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE}
          />
        </svg>
        <span>{running ? '' : t('reveal.hold.button')}</span>
      </button>

      <div aria-live='polite' style={{textAlign: 'center', minHeight: 64}}>
        <p style={{fontSize: 18, color: 'var(--main-color)'}}>{coach}</p>
        {breathN > 0 && (
          <p className={styles.muted} style={{fontSize: 14, marginTop: 8}}>
            {t('reveal.hold.counter', {n: breathN})}
          </p>
        )}
      </div>

      {!timedLink && (
        <button
          className={styles.altLink}
          onClick={() => setTimedLink(true)}
        >
          {t('reveal.hold.altLink')}
        </button>
      )}
      {timedLink && (
        <p className={styles.muted} style={{fontSize: 14, maxWidth: 260, textAlign: 'center'}}>
          Tap the circle once to start a timed unlock. Tap again to stop.
        </p>
      )}

      <span className={styles.srOnly} aria-live='polite'>
        {announcement}
      </span>
    </div>
  );
};
