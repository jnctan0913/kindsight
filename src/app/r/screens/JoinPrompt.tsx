'use client';

import React, {useEffect, useState} from 'react';
import Link from 'next/link';

import {asset} from '@/config';
import {components} from '@/components';
import {LanguageToggle, useT} from '@/i18n';
import {Routes} from '@/routes';
import type {StringKey} from '@/i18n';
import type {JoinFailure} from '@/stores/room';

import styles from '../player.module.scss';

const normalize = (value: string) =>
  value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);

const FAILURE_STRING: Record<JoinFailure, StringKey> = {
  not_found: 'player.join.error.badCode',
  rate_limited: 'player.join.error.rateLimited',
  generic: 'player.join.error.generic',
};

type Props = {
  initialCode: string;
  failure: JoinFailure | null;
  onJoin: (code: string) => Promise<void>;
};

export const JoinPrompt: React.FC<Props> = ({initialCode, failure, onJoin}) => {
  const t = useT();
  const [code, setCode] = useState(() => normalize(initialCode));
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!dirty) setCode(normalize(initialCode));
  }, [initialCode, dirty]);

  const submit = async () => {
    if (code.length < 6 || submitting) return;
    setSubmitting(true);
    setDirty(false);
    await onJoin(code);
    setSubmitting(false);
  };

  const showError = !dirty && failure !== null;

  return (
    <components.Screen>
      <div className={styles.aura} aria-hidden='true' />
      <components.Header rightSlot={<LanguageToggle />} />

      <main
        className='container scrollable'
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '8%',
          paddingBottom: 20,
        }}
      >
        <img
          src={asset('/assets/kindsight/kindsight-mascot-only.png')}
          alt=''
          aria-hidden='true'
          className={`${styles.mascot} ${styles.bob}`}
        />
        <img
          src={asset('/assets/kindsight/kindsight-wordmark.png')}
          alt='Kindsight'
          style={{width: '48%', maxWidth: 210, height: 'auto', marginTop: 12}}
        />
        <p className='t14' style={{marginTop: 6, textAlign: 'center'}}>
          {t('app.tagline')}
        </p>

        <h2 style={{marginTop: 28, textAlign: 'center'}}>{t('player.join.title')}</h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          style={{width: '100%', maxWidth: 400, marginTop: 24}}
        >
          <label
            htmlFor='room-code'
            style={{
              display: 'block',
              marginBottom: 8,
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--main-color)',
              fontFamily: 'var(--font-dosis), var(--font-noto-sc), sans-serif',
            }}
          >
            {t('player.join.code.label')}
          </label>
          <input
            id='room-code'
            value={code}
            onChange={(e) => {
              setCode(normalize(e.target.value));
              setDirty(true);
            }}
            placeholder={t('player.join.code.placeholder')}
            maxLength={6}
            autoComplete='off'
            autoCapitalize='characters'
            inputMode='text'
            spellCheck={false}
            disabled={submitting}
            style={{
              width: '100%',
              height: 64,
              border: 'none',
              borderRadius: 'var(--radius-control)',
              backgroundColor: 'var(--white-color)',
              boxShadow: 'var(--shadow-soft)',
              textAlign: 'center',
              fontSize: 28,
              lineHeight: '64px',
              letterSpacing: '0.25em',
              fontFamily: 'var(--font-league-spartan), var(--font-noto-sc), sans-serif',
              color: 'var(--main-color)',
            }}
          />

          {showError && failure && (
            <div
              role='alert'
              style={{display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 12}}
            >
              <svg
                width='16'
                height='16'
                viewBox='0 0 24 24'
                fill='none'
                aria-hidden='true'
                style={{flexShrink: 0, marginTop: 2}}
              >
                <circle cx='12' cy='12' r='9' stroke='var(--warn-color)' strokeWidth='2' />
                <path d='M12 7.5v5' stroke='var(--warn-color)' strokeWidth='2' strokeLinecap='round' />
                <circle cx='12' cy='16.5' r='1.2' fill='var(--warn-color)' />
              </svg>
              <span className='t14' style={{color: 'var(--warn-color)'}}>
                {t(FAILURE_STRING[failure])}
              </span>
            </div>
          )}

          <components.Button
            label={submitting ? t('player.write.sending') : t('player.join.cta')}
            onClick={() => void submit()}
            colorScheme='secondary'
            disabled={code.length < 6 || submitting}
            className='pressable'
            containerStyle={{marginTop: 24}}
            style={{
              textTransform: 'none',
              opacity: code.length < 6 || submitting ? 0.5 : 1,
              boxShadow: 'var(--shadow-soft), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
            }}
          />
        </form>

        <div style={{marginTop: 'auto', paddingTop: 32, width: '100%', maxWidth: 400}}>
          <Link
            href={Routes.HOST}
            className='clickable pressable'
            style={{
              height: 52,
              width: '100%',
              borderRadius: 999,
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--white-color)',
              boxShadow: 'var(--shadow-soft)',
              color: 'var(--main-color)',
              display: 'flex',
              alignItems: 'center',
              boxSizing: 'border-box',
              justifyContent: 'center',
              fontFamily: 'var(--font-dosis), var(--font-noto-sc), sans-serif',
              fontSize: 16,
              fontWeight: 700,
              lineHeight: 1,
              padding: '0 16px',
              textAlign: 'center',
            }}
          >
            {t('player.join.hostSignIn')}
          </Link>
        </div>
      </main>
    </components.Screen>
  );
};
