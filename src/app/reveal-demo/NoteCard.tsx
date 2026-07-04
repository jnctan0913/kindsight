'use client';

import React from 'react';

import styles from './reveal.module.scss';
import {t} from './strings';
import type {DemoNote} from './demoNotes';

type Props = {
  note: DemoNote;
  variant: 'reveal' | 'wall';
  className?: string;
  cardRef?: React.Ref<HTMLDivElement>;
  cornerAction?: React.ReactNode;
};

export const NoteCard: React.FC<Props> = ({
  note,
  variant,
  className,
  cardRef,
  cornerAction,
}) => {
  const frameLabel = t(`frame.${note.frame}.label`);
  return (
    <div
      ref={cardRef}
      className={`${variant === 'reveal' ? styles.noteCard : styles.wallCard} ${className ?? ''}`}
      tabIndex={variant === 'reveal' ? -1 : undefined}
    >
      {cornerAction ? (
        <div className={styles.cardHeader}>
          <span className={styles.framePill}>{frameLabel}</span>
          {cornerAction}
        </div>
      ) : (
        <span className={styles.framePill}>{frameLabel}</span>
      )}
      <p>{note.content}</p>
    </div>
  );
};
