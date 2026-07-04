'use client';

import React, {useState} from 'react';

import {asset} from '../../../config';
import {LanguageToggle, useT} from '../../../i18n';
import {
  HOST_PASSWORD_MIN_LENGTH,
  isHostAuthMockMode,
  signInHostWithPassword,
  signUpHostWithPassword,
  type HostSession,
} from '../../../lib/supabase/hostAuth';
import {consoleCard, dosisFont} from '../components/hostStyles';

type Props = {
  onSignedIn: (session: HostSession) => void;
};

export const HostLoginScreen: React.FC<Props> = ({onSignedIn}) => {
  const t = useT();
  const mockMode = isHostAuthMockMode();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordTooShort =
    password.length > 0 && password.length < HOST_PASSWORD_MIN_LENGTH;
  const passwordMismatch =
    mode === 'signup' && confirmPassword.length > 0 && password !== confirmPassword;
  const canSubmit =
    Boolean(email.trim()) &&
    password.length >= HOST_PASSWORD_MIN_LENGTH &&
    (mode === 'signin' || password === confirmPassword) &&
    !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setError(null);
    setBusy(true);
    try {
      const session =
        mode === 'signup'
          ? await signUpHostWithPassword(email, password)
          : await signInHostWithPassword(email, password);
      onSignedIn(session);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('host.login.error.generic'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: 'var(--host-surface)',
        padding: 24,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: 480,
          margin: '0 auto',
        }}
      >
        <img
          src={asset('/assets/kindsight/kindsight-logo-transparent.png')}
          alt='Kindsight'
          style={{width: 132, height: 'auto'}}
        />
        <LanguageToggle />
      </div>

      <div style={{...consoleCard, maxWidth: 480, margin: '32px auto 0', padding: 28}}>
        <h2 style={{fontFamily: dosisFont}}>{t('host.login.title')}</h2>
        <p className='t14' style={{marginTop: 8}}>
          {t('host.login.subtitle')}
        </p>

        {mockMode && (
          <p
            className='t12'
            style={{
              marginTop: 12,
              padding: '10px 12px',
              borderRadius: 'var(--radius-control)',
              backgroundColor: 'var(--host-surface)',
              color: 'var(--text-color)',
            }}
          >
            {t('host.login.mockHint')}
          </p>
        )}

        <div
          role='group'
          aria-label={t('host.login.mode.label')}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginTop: 24,
            padding: 4,
            borderRadius: 999,
            backgroundColor: 'var(--host-surface)',
          }}
        >
          {(['signin', 'signup'] as const).map((nextMode) => {
            const selected = mode === nextMode;
            return (
              <button
                key={nextMode}
                type='button'
                aria-pressed={selected}
                className='clickable'
                style={{
                  height: 40,
                  borderRadius: 999,
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: selected ? 'var(--accent-color)' : 'transparent',
                  color: selected ? 'var(--main-color)' : 'var(--text-color)',
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: dosisFont,
                  lineHeight: 1,
                  padding: '0 10px',
                  textAlign: 'center',
                }}
                onClick={() => {
                  setMode(nextMode);
                  setError(null);
                  setConfirmPassword('');
                }}
              >
                {nextMode === 'signin'
                  ? t('host.login.mode.signIn')
                  : t('host.login.mode.signUp')}
              </button>
            );
          })}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <label htmlFor='host-email' style={{display: 'block', marginTop: 24}}>
            <span
              style={{
                display: 'block',
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--main-color)',
                fontFamily: dosisFont,
              }}
            >
              {t('host.login.email.label')}
            </span>
            <input
              id='host-email'
              type='email'
              autoComplete='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('host.login.email.placeholder')}
              style={{
                width: '100%',
                height: 50,
                padding: '0 16px',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--border-color)',
                fontSize: 16,
                lineHeight: '50px',
                color: 'var(--main-color)',
              }}
            />
          </label>

          <label htmlFor='host-password' style={{display: 'block', marginTop: 16}}>
            <span
              style={{
                display: 'block',
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--main-color)',
                fontFamily: dosisFont,
              }}
            >
              {t('host.login.password.label')}
            </span>
            <input
              id='host-password'
              type='password'
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('host.login.password.placeholder')}
              minLength={HOST_PASSWORD_MIN_LENGTH}
              style={{
                width: '100%',
                height: 50,
                padding: '0 16px',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--border-color)',
                fontSize: 16,
                lineHeight: '50px',
                color: 'var(--main-color)',
              }}
            />
          </label>

          {mode === 'signup' && (
            <label htmlFor='host-confirm-password' style={{display: 'block', marginTop: 16}}>
              <span
                style={{
                  display: 'block',
                  marginBottom: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--main-color)',
                  fontFamily: dosisFont,
                }}
              >
                {t('host.login.confirmPassword.label')}
              </span>
              <input
                id='host-confirm-password'
                type='password'
                autoComplete='new-password'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('host.login.confirmPassword.placeholder')}
                minLength={HOST_PASSWORD_MIN_LENGTH}
                style={{
                  width: '100%',
                  height: 50,
                  padding: '0 16px',
                  borderRadius: 'var(--radius-control)',
                  border: '1px solid var(--border-color)',
                  fontSize: 16,
                  lineHeight: '50px',
                  color: 'var(--main-color)',
                }}
              />
            </label>
          )}

          {(passwordTooShort || passwordMismatch || error) && (
            <p className='t14' style={{marginTop: 10, color: 'var(--accent-deep)'}} role='alert'>
              {error ??
                (passwordMismatch
                  ? t('host.login.error.passwordMismatch')
                  : t('host.login.error.passwordLength', {count: HOST_PASSWORD_MIN_LENGTH}))}
            </p>
          )}

          <button
            type='submit'
            className='clickable'
            disabled={!canSubmit}
            style={{
              width: '100%',
              height: 50,
              marginTop: 24,
              borderRadius: 999,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--accent-color)',
              color: 'var(--main-color)',
              fontSize: 18,
              fontFamily: 'var(--font-league-spartan), var(--font-noto-sc), sans-serif',
              lineHeight: 1,
              opacity: canSubmit ? 1 : 0.5,
              padding: '0 16px',
              textAlign: 'center',
              textTransform: 'none',
            }}
          >
            {busy
              ? t('host.login.busy')
              : mode === 'signup'
                ? t('host.login.signUpCta')
                : t('host.login.signInCta')}
          </button>
        </form>
      </div>
    </div>
  );
};
