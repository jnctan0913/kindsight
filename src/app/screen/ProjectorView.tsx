'use client';

import React from 'react';
import {QRCodeSVG} from 'qrcode.react';

import {asset} from '../../config';
import {useT} from '../../i18n';
import type {StringKey} from '../../i18n';
import {assignAvatars, avatarSrc} from '../../lib/avatar';
import {
  BRIEFING_FRAME_CARDS,
  BRIEFING_SLIDE_COUNT,
  getBriefingSlide,
  normalizeBriefingIndex,
} from '../../lib/briefingContent';
import {parseHighlightTargets} from '../../lib/hostRoomSync';
import type {ScreenRoomState} from '../../lib/hostRoomSync';
import styles from './BigScreen.module.scss';

type Props = {
  state: ScreenRoomState;
  preview?: boolean;
};

export const ProjectorView: React.FC<Props> = ({state, preview = false}) => {
  const t = useT();
  const shellClass = `${styles.shell} ${preview ? styles.previewShell : ''}`;

  // The wall always shows everyone's notes. 'person' (Highlight) mode does not
  // filter; it rings the focused recipients' cards and dims the rest, with a
  // header legend. The host may focus several people at once.
  const focusNames = parseHighlightTargets(state.highlightTarget);
  const focusSet = new Set(focusNames);
  const isPerson = state.highlightMode === 'person' && focusSet.size > 0;
  const highlightNotes = state.highlightNotes;

  // Closing is the final beat: a quiet thank-you that ends the room. It wins
  // over every other state so the host can close gracefully from anywhere.
  if (state.closing) {
    return (
      <div className={shellClass}>
        <img
          src={asset('/assets/kindsight/mascot-farewell.png')}
          alt=''
          className={styles.mascot}
        />
        <p className={styles.headline}>{t('screen.closing.title')}</p>
        <p className={styles.subcopy} style={{marginTop: '4vh'}}>
          {t('screen.closing.subcopy')}
        </p>
      </div>
    );
  }

  if (state.highlightEnabled && highlightNotes.length > 0) {
    const frameKeyOf = (frame: string) => `frame.${frame}.label` as StringKey;
    const frameClass: Record<string, string> = {
      moment: styles.frameMoment,
      strength: styles.frameStrength,
      wish: styles.frameWish,
    };

    // Arranged wall: every opted-in note fits one non-scrolling frame at once.
    // Columns/rows are derived from the count (favouring a wider grid to match
    // the 16:9 stage) and the grid stretches to fill the height; --wall-scale
    // shrinks the type as density grows so nothing clips.
    const count = highlightNotes.length;
    // A live prompt always reserves a 2x2 block for the modal and lets the cards
    // reflow into the remaining cells, so no note is hidden. In person mode the
    // focus glow still marks the selected recipient's cards wherever they land.
    const reserve = !!state.activePrompt;
    let reserveCols = reserve ? 2 : 0;
    let reserveRows = reserve ? 2 : 0;
    const cells = count + reserveCols * reserveRows;
    const columns = Math.min(
      6,
      Math.max(reserve ? 2 : 1, Math.ceil(Math.sqrt(cells * 1.6))),
    );
    const rows = Math.ceil(cells / columns);
    if (reserve) {
      reserveCols = Math.min(reserveCols, columns);
      reserveRows = Math.min(reserveRows, rows);
    }
    const wallScale =
      count <= 4
        ? 1
        : count <= 8
        ? 0.9
        : count <= 12
        ? 0.8
        : count <= 16
        ? 0.72
        : count <= 24
        ? 0.62
        : 0.54;

    const tileStyle: React.CSSProperties | undefined = reserve
      ? {
          gridColumn: `${columns - reserveCols + 1} / span ${reserveCols}`,
          gridRow: `${rows - reserveRows + 1} / span ${reserveRows}`,
        }
      : undefined;

    const promptInner = (
      <>
        <div className={styles.promptModalCopy}>
          <p className={styles.promptModalEyebrow}>{t('screen.prompt.eyebrow')}</p>
          <p className={styles.promptModalText}>{state.activePrompt}</p>
        </div>
        <img
          src={asset('/assets/kindsight/mascot-talk.png')}
          alt=''
          aria-hidden='true'
          className={styles.promptModalMascot}
        />
      </>
    );

    return (
      <div className={`${shellClass} ${styles.wallShell}`}>
        <div className={styles.wallHeader}>
          <img
            src={asset('/assets/kindsight/kindsight-logo-transparent.png')}
            alt='Kindsight'
            className={styles.wallLogo}
          />
          <p className={styles.wallTitle}>{t('screen.highlight.title')}</p>
          {isPerson && (
            <span className={styles.wallLegend}>
              <span className={styles.wallLegendDot} aria-hidden='true' />
              {t('screen.highlight.focusLegend', {name: focusNames.join(', ')})}
            </span>
          )}
        </div>
        <div
          className={styles.highlightWall}
          style={
            {
              '--wall-cols': columns,
              '--wall-rows': rows,
              '--wall-scale': wallScale,
            } as React.CSSProperties
          }
        >
          {highlightNotes.map((n, i) => (
            <div
              key={`${n.recipient}-${i}`}
              className={`${styles.highlightCard} ${frameClass[n.frame] ?? ''} ${
                isPerson
                  ? focusSet.has(n.recipient)
                    ? styles.highlightCardFocus
                    : styles.highlightCardDim
                  : ''
              }`}
            >
              <div className={styles.highlightHead}>
                <span className={styles.highlightFrame}>{t(frameKeyOf(n.frame))}</span>
                <span className={styles.highlightRecipient}>{n.recipient}</span>
              </div>
              <p className={styles.highlightText}>{n.content}</p>
            </div>
          ))}
          {reserve && (
            <div
              className={`${styles.promptModal} ${styles.promptModalTile}`}
              style={tileStyle}
            >
              {promptInner}
            </div>
          )}
        </div>
      </div>
    );
  }

  // A pushed prompt with the highlight wall off gets its own beat so the room
  // sees the discussion question instead of the "look at your phone" holding
  // screen. Only during/after reveal so a lingering prompt never hijacks writing.
  if (state.activePrompt && state.revealTriggered) {
    return (
      <div className={`${shellClass} ${styles.promptShell}`}>
        <div className={styles.promptCopy}>
          <p className={styles.eyebrow}>{t('screen.prompt.eyebrow')}</p>
          <p className={styles.headline}>{state.activePrompt}</p>
        </div>
        <div className={styles.promptVisual}>
          <img
            src={asset('/assets/kindsight/mascot-talk.png')}
            alt=''
            aria-hidden='true'
          />
        </div>
      </div>
    );
  }

  if (state.revealTriggered || state.phase === 'reveal') {
    return (
      <div className={`${shellClass} ${styles.revealMoment}`}>
        <div className={styles.breathHalo}>
          <img
            src={asset('/assets/kindsight/onboarding-reveal-transparent.png')}
            alt=''
            className={styles.mascot}
          />
        </div>
        <p className={styles.revealEyebrow}>{t('screen.reveal.eyebrow')}</p>
        <p className={styles.headline}>{t('screen.reveal.title')}</p>
        <p className={styles.revealBreathe}>{t('screen.reveal.breathe')}</p>
      </div>
    );
  }

  if (state.phase === 'briefing') {
    const briefingIndex = normalizeBriefingIndex(state.briefingIndex);
    const slide = getBriefingSlide(briefingIndex, state.mode);
    return (
      <div className={`${shellClass} ${styles.briefingShell}`}>
        <div className={styles.briefingVisual}>
          <img src={asset(slide.image)} alt='' aria-hidden='true' />
        </div>
        <div className={styles.briefingRight}>
          <div className={styles.briefingCopy}>
            <p className={styles.eyebrow}>
              {t('screen.briefing.frame', {
                n: briefingIndex + 1,
                total: BRIEFING_SLIDE_COUNT,
              })}
            </p>
            <p className={styles.headline}>{t(slide.title)}</p>
            <p className={styles.subcopy}>{t(slide.body)}</p>
          </div>

          {slide.id === 'write' && (
            <div className={styles.briefingFrames}>
              {BRIEFING_FRAME_CARDS.map((frame) => (
                <div key={frame.frame} className={styles.frameCard}>
                  <p className={styles.frameLabel}>{t(frame.label)}</p>
                  <p className={styles.frameStem}>{t(frame.stem)}</p>
                  <p className={styles.frameExample}>{t(frame.good)}</p>
                </div>
              ))}
            </div>
          )}

          {slide.id === 'targets' && (
            <div className={styles.briefingNote}>
              <p>
                {state.mode === 'free_select'
                  ? t('host.preview.mode.b')
                  : t('host.preview.mode.a')}
              </p>
            </div>
          )}

          {slide.id === 'reveal' && (
            <div className={styles.briefingNote}>
              <p>{t('player.briefing.anonymity')}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (state.phase === 'writing') {
    return (
      <div className={shellClass}>
        <img
          src={asset('/assets/kindsight/kindsight-logo-transparent.png')}
          alt='Kindsight'
          className={styles.logo}
        />
        <p className={styles.headline}>
          {t('screen.writing.title', {
            n: state.currentRound,
            total: state.totalRounds,
          })}
        </p>
        <p className={styles.counter} style={{marginTop: '4vh'}}>
          {state.timerRemaining}
        </p>
        <p className={styles.subcopy} style={{marginTop: '3vh'}}>
          {t('screen.writing.notes', {count: state.notesWritten})}
        </p>
      </div>
    );
  }

  const dots = Array.from({length: state.totalCount}, (_, i) => i < state.claimedCount);
  const roster = state.roster ?? null;
  const rosterAvatars = roster ? assignAvatars(roster.map((r) => r.id)) : null;

  return (
    <div className={`${shellClass} ${styles.lobbyShell}`}>
      <div className={styles.lobbyGrid}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2vh',
          }}
        >
          <img
            src={asset('/assets/kindsight/mascot-cheer.png')}
            alt=''
            aria-hidden='true'
            style={{width: 'clamp(160px, 18vw, 300px)', height: 'auto'}}
          />
          <img
            src={asset('/assets/kindsight/kindsight-wordmark.png')}
            alt='Kindsight'
            style={{width: 'clamp(140px, 14vw, 240px)', height: 'auto'}}
          />
        </div>
        <div className={styles.qrBlock}>
          <QRCodeSVG
            value={state.joinUrl}
            level='M'
            marginSize={2}
            bgColor='#ffffff'
            fgColor='#1E2538'
            style={{width: '100%', height: '100%', display: 'block'}}
          />
        </div>
        <div>
          <p className={styles.subcopy}>{t('screen.lobby.roomCode')}</p>
          <p className={styles.code}>{state.code}</p>
          <p
            className={styles.subcopy}
            style={{marginTop: '1.5vh', wordBreak: 'break-all'}}
          >
            {state.joinUrl}
          </p>
        </div>
      </div>
      <p className={styles.subcopy} style={{marginTop: '4vh'}}>
        {t('screen.lobby.progress', {
          claimed: state.claimedCount,
          total: state.totalCount,
        })}
      </p>
      {roster && rosterAvatars ? (
        <div className={styles.avatarWall}>
          {roster.map((r) =>
            r.claimed ? (
              <img
                key={r.id}
                className={styles.avatarTile}
                src={avatarSrc(rosterAvatars.get(r.id) ?? 2)}
                alt=''
                aria-hidden='true'
              />
            ) : (
              <span
                key={r.id}
                className={`${styles.avatarTile} ${styles.avatarGhost}`}
                aria-hidden='true'
              />
            ),
          )}
        </div>
      ) : (
        <div className={styles.dots}>
          {dots.map((filled, i) => (
            <span
              key={i}
              className={`${styles.dot} ${filled ? styles.dotFilled : ''}`}
            />
          ))}
        </div>
      )}
      {state.lastJoinedName && (
        <p className={styles.ticker}>
          {t('screen.lobby.ticker', {name: state.lastJoinedName})}
        </p>
      )}
    </div>
  );
};
