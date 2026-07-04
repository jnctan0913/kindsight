'use client';

import React, {useState} from 'react';

import {components} from '@/components';
import {LanguageToggle, useT} from '@/i18n';
import {useRoomStore} from '@/stores/room';

export const ClaimContent: React.FC = () => {
  const t = useT();
  const roster = useRoomStore((s) => s.roster);
  const claim = useRoomStore((s) => s.claim);

  const [selected, setSelected] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const confirm = async () => {
    if (!selected || claiming) return;
    setClaiming(true);
    setNotice(null);
    const result = await claim(selected);
    setClaiming(false);
    if (!result.ok) {
      // The refresh inside claim() already re-greyed the taken chip.
      setSelected(null);
      setNotice(
        result.reason === 'taken'
          ? t('player.claim.race')
          : result.reason === 'closed'
            ? t('player.claim.closed.body')
            : t('player.claim.error'),
      );
    }
    // On success the snapshot flips role -> player and the router advances us.
  };

  return (
    <components.Screen>
      <components.Header rightSlot={<LanguageToggle />} />
      <main className='container scrollable' style={{flex: 1, paddingBottom: 20}}>
        <h2 style={{marginTop: 16, marginBottom: 20}}>{t('player.claim.title')}</h2>

        {notice && (
          <p role='alert' className='t14' style={{color: 'var(--warn-color)', marginBottom: 16}}>
            {notice}
          </p>
        )}

        <div style={{display: 'flex', flexWrap: 'wrap', gap: 10}}>
          {roster.map((entry) => (
            <components.RosterChip
              key={entry.participant_id}
              name={entry.display_name}
              taken={entry.claimed}
              takenLabel={t('player.claim.taken')}
              selected={selected === entry.participant_id}
              onClick={() =>
                setSelected(selected === entry.participant_id ? null : entry.participant_id)
              }
            />
          ))}
        </div>
      </main>
      <footer style={{padding: 20}}>
        <components.Button
          label={claiming ? t('player.write.sending') : t('player.claim.confirm')}
          onClick={() => void confirm()}
          colorScheme='secondary'
          style={{
            textTransform: 'none',
            opacity: selected && !claiming ? 1 : 0.5,
            boxShadow: 'var(--shadow-soft), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          }}
        />
      </footer>
    </components.Screen>
  );
};
