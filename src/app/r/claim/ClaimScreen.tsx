'use client';

import React, {useEffect, useState} from 'react';
import Link from 'next/link';

import {asset} from '../../../config';
import {Routes} from '../../../routes';
import {components} from '../../../components';
import {LanguageToggle, useT} from '../../../i18n';
import {CLAIM_STORAGE_KEY, MOCK_ROSTER} from '../../../mock/room';

export const ClaimScreen: React.FC = () => {
  const t = useT();
  const [hydrated, setHydrated] = useState(false);
  const [claimedName, setClaimedName] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    setClaimedName(window.localStorage.getItem(CLAIM_STORAGE_KEY));
    setHydrated(true);
  }, []);

  const confirm = () => {
    if (!selected) return;
    window.localStorage.setItem(CLAIM_STORAGE_KEY, selected);
    setClaimedName(selected);
  };

  const resetClaim = () => {
    window.localStorage.removeItem(CLAIM_STORAGE_KEY);
    setClaimedName(null);
    setSelected(null);
  };

  if (!hydrated) {
    return null;
  }

  if (claimedName) {
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
            justifyContent: 'center',
            paddingBottom: 40,
          }}
        >
          <img
            src={asset('/assets/kindsight/empty-lobby-soft.png')}
            alt=''
            aria-hidden='true'
            style={{width: '60%', maxWidth: 320, height: 'auto'}}
          />
          <h2 style={{marginTop: 16, textAlign: 'center'}}>
            {t('player.claim.waiting.title', {name: claimedName})}
          </h2>
          <p
            className='t16'
            style={{marginTop: 8, textAlign: 'center'}}
          >
            {t('player.claim.waiting.body')}
          </p>

          <div
            style={{
              marginTop: 48,
              display: 'flex',
              gap: 24,
              alignItems: 'center',
            }}
          >
            <Link
              href={Routes.BRIEFING}
              className='t14'
              style={{color: 'var(--accent-deep)'}}
            >
              Demo: view the briefing
            </Link>
            <button
              onClick={resetClaim}
              className='t14 clickable'
              style={{background: 'none', color: 'var(--text-color)'}}
            >
              Demo: reset claim
            </button>
          </div>
        </main>
      </components.Screen>
    );
  }

  return (
    <components.Screen>
      <components.Header rightSlot={<LanguageToggle />} />
      <main
        className='container scrollable'
        style={{flex: 1, paddingBottom: 20}}
      >
        <h2 style={{marginTop: 16, marginBottom: 20}}>
          {t('player.claim.title')}
        </h2>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          {MOCK_ROSTER.map((entry) => (
            <components.RosterChip
              key={entry.name}
              name={entry.name}
              taken={entry.claimed}
              takenLabel={t('player.claim.taken')}
              selected={selected === entry.name}
              onClick={() =>
                setSelected(selected === entry.name ? null : entry.name)
              }
            />
          ))}
        </div>
      </main>
      <footer style={{padding: 20}}>
        <components.Button
          label={t('player.claim.confirm')}
          onClick={confirm}
          colorScheme='secondary'
          style={{
            textTransform: 'none',
            opacity: selected ? 1 : 0.5,
            boxShadow:
              'var(--shadow-soft), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          }}
        />
      </footer>
    </components.Screen>
  );
};
