'use client';

import React, {useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';

import {asset} from '../../config';
import {Routes} from '../../routes';
import {components} from '../../components';
import {LanguageToggle, useT} from '../../i18n';
import {MOCK_ROOM_CODE} from '../../mock/room';

const normalize = (value: string) =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);

export const JoinScreen: React.FC = () => {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [code, setCode] = useState(() =>
    normalize(searchParams.get('code') ?? ''),
  );
  const [showError, setShowError] = useState(false);

  const submit = () => {
    if (code === MOCK_ROOM_CODE) {
      router.push(`${Routes.CLAIM}/?code=${code}`);
    } else {
      setShowError(true);
    }
  };

  return (
    <components.Screen>
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
          src={asset('/assets/kindsight/kindsight-logo-transparent.png')}
          alt='Kindsight'
          style={{width: '52%', maxWidth: 240, height: 'auto'}}
        />
        <p
          className='t14'
          style={{marginTop: 2, textAlign: 'center'}}
        >
          {t('app.tagline')}
        </p>

        <h2 style={{marginTop: 32, textAlign: 'center'}}>
          {t('player.join.title')}
        </h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
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
              setShowError(false);
            }}
            placeholder={t('player.join.code.placeholder')}
            maxLength={6}
            autoComplete='off'
            autoCapitalize='characters'
            spellCheck={false}
            style={{
              width: '100%',
              height: 64,
              border: 'none',
              borderRadius: 'var(--radius-control)',
              backgroundColor: 'var(--white-color)',
              boxShadow: 'var(--shadow-soft)',
              textAlign: 'center',
              fontSize: 28,
              letterSpacing: '0.25em',
              fontFamily:
                'var(--font-league-spartan), var(--font-noto-sc), sans-serif',
              color: 'var(--main-color)',
            }}
          />

          {showError && (
            <div
              role='alert'
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                marginTop: 12,
              }}
            >
              <svg
                width='16'
                height='16'
                viewBox='0 0 24 24'
                fill='none'
                aria-hidden='true'
                style={{flexShrink: 0, marginTop: 2}}
              >
                <circle
                  cx='12'
                  cy='12'
                  r='9'
                  stroke='var(--warn-color)'
                  strokeWidth='2'
                />
                <path
                  d='M12 7.5v5'
                  stroke='var(--warn-color)'
                  strokeWidth='2'
                  strokeLinecap='round'
                />
                <circle
                  cx='12'
                  cy='16.5'
                  r='1.2'
                  fill='var(--warn-color)'
                />
              </svg>
              <span
                className='t14'
                style={{color: 'var(--warn-color)'}}
              >
                {t('player.join.error.badCode')}
              </span>
            </div>
          )}

          <components.Button
            label={t('player.join.cta')}
            onClick={submit}
            colorScheme='secondary'
            containerStyle={{marginTop: 24}}
            style={{
              textTransform: 'none',
              boxShadow:
                'var(--shadow-soft), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
            }}
          />
        </form>
      </main>
    </components.Screen>
  );
};
