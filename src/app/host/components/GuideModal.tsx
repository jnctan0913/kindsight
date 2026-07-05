'use client';

import React, {useEffect, useState} from 'react';

import {components} from '../../../components';
import {useT} from '../../../i18n';
import type {StringKey} from '../../../i18n';
import styles from './HelpModal.module.scss';

type Tab = {
  id: string;
  labelKey: StringKey;
  bodyKey: StringKey;
};

type GuideModalProps = {
  open: boolean;
  onClose: () => void;
  domId: string;
  titleKey: StringKey;
  subtitleKey: StringKey;
  tabs: Tab[];
};

// Split a bullet into an optional bold lead (the part before the first colon) and
// the rest, so lines like "Lobby: ..." read as scannable labels.
function splitLead(line: string): {lead: string | null; rest: string} {
  const match = line.match(/^([^:：]{1,28})[:：]\s*(.+)$/);
  if (!match) return {lead: null, rest: line};
  return {lead: match[1], rest: match[2]};
}

const GuideModal: React.FC<GuideModalProps> = ({
  open,
  onClose,
  domId,
  titleKey,
  subtitleKey,
  tabs,
}) => {
  const t = useT();
  const [tab, setTab] = useState<string>(tabs[0]?.id ?? '');

  // Reset to the first tab each time it opens, and wire Esc to close.
  useEffect(() => {
    if (!open) return;
    setTab(tabs[0]?.id ?? '');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, tabs]);

  const active = tabs.find((x) => x.id === tab) ?? tabs[0];
  const lines = active
    ? t(active.bodyKey)
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
    : [];

  return (
    <components.Modal
      open={open}
      onClose={onClose}
      labelledBy={domId}
      containerStyle={{maxWidth: 640}}
    >
      <div className={styles.head}>
        <div className={styles.titleWrap}>
          <h2 id={domId} className={styles.title}>
            {t(titleKey)}
          </h2>
          <p className={styles.subtitle}>{t(subtitleKey)}</p>
        </div>
        <button
          type='button'
          className={styles.closeBtn}
          aria-label={t('common.close')}
          onClick={onClose}
        >
          {'\u00d7'}
        </button>
      </div>

      <div className={styles.tabs} role='tablist' aria-label={t(titleKey)}>
        {tabs.map((x) => (
          <button
            key={x.id}
            type='button'
            role='tab'
            aria-selected={x.id === tab}
            className={`${styles.tab} ${x.id === tab ? styles.tabOn : ''}`}
            onClick={() => setTab(x.id)}
          >
            {t(x.labelKey)}
          </button>
        ))}
      </div>

      <div className={styles.body}>
        <ul className={styles.list}>
          {lines.map((line, i) => {
            const {lead, rest} = splitLead(line);
            return (
              <li key={i} className={styles.item}>
                {lead && <span className={styles.lead}>{lead}: </span>}
                {rest}
              </li>
            );
          })}
        </ul>
      </div>
    </components.Modal>
  );
};

const FACILITATOR_TABS: Tab[] = [
  {id: 'prep', labelKey: 'host.guide.tab.prep', bodyKey: 'host.guide.prep.body'},
  {id: 'run', labelKey: 'host.guide.tab.run', bodyKey: 'host.guide.run.body'},
  {id: 'room', labelKey: 'host.guide.tab.room', bodyKey: 'host.guide.room.body'},
  {id: 'close', labelKey: 'host.guide.tab.close', bodyKey: 'host.guide.close.body'},
];

const HELP_TABS: Tab[] = [
  {id: 'screens', labelKey: 'host.help.tab.screens', bodyKey: 'host.help.screens.body'},
  {id: 'controls', labelKey: 'host.help.tab.controls', bodyKey: 'host.help.controls.body'},
  {id: 'fixes', labelKey: 'host.help.tab.fixes', bodyKey: 'host.help.fixes.body'},
  {id: 'privacy', labelKey: 'host.help.tab.privacy', bodyKey: 'host.help.privacy.body'},
];

type Props = {open: boolean; onClose: () => void};

// Facilitation-focused guide: how to hold the room, beat by beat.
export const FacilitatorGuideModal: React.FC<Props> = (props) => (
  <GuideModal
    {...props}
    domId='facilitator-guide-title'
    titleKey='host.guide.title'
    subtitleKey='host.guide.subtitle'
    tabs={FACILITATOR_TABS}
  />
);

// Technical help: how the app works and how to fix hiccups.
export const HelpModal: React.FC<Props> = (props) => (
  <GuideModal
    {...props}
    domId='help-title'
    titleKey='host.help.title'
    subtitleKey='host.help.subtitle'
    tabs={HELP_TABS}
  />
);
