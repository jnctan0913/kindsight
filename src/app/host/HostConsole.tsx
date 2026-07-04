'use client';

import React, {useEffect, useState} from 'react';

import {asset} from '../../config';
import {components} from '../../components';
import {useT} from '../../i18n';
import {
  MOCK_COVERAGE,
  MOCK_HOST_ROOM,
  MOCK_HOST_ROSTER,
  MOCK_MOD_FEED,
  MOCK_OPTED_IN_COUNT,
  MOCK_REVEAL_STATUS,
  MOCK_ROUND_PROGRESS,
  type HostNote,
  type WritingMode,
} from '../../mock/room';
import {ConsoleShell, type ConsoleNav} from './components/ConsoleShell';
import {type HostPhase} from './components/PhaseStepper';
import {Toast} from './components/Toast';
import {CreateRoomScreen} from './screens/CreateRoomScreen';
import {RosterBuilderScreen} from './screens/RosterBuilderScreen';
import {LobbyContent} from './screens/LobbyContent';
import {BriefingContent} from './screens/BriefingContent';
import {InGameContent} from './screens/InGameContent';
import {WrapUpContent} from './screens/WrapUpContent';
import {consoleCard, dosisFont} from './components/hostStyles';

type Step =
  | 'create'
  | 'roster'
  | 'lobby'
  | 'briefing'
  | 'writing'
  | 'wrapup'
  | 'ended';

const stepToPhase: Record<Exclude<Step, 'create' | 'roster' | 'ended'>, HostPhase> = {
  lobby: 'lobby',
  briefing: 'briefing',
  writing: 'writing',
  wrapup: 'wrapup',
};

export const HostConsole: React.FC = () => {
  const t = useT();

  const [step, setStep] = useState<Step>('create');
  const [mode, setMode] = useState<WritingMode>(MOCK_HOST_ROOM.mode);
  const [rounds, setRounds] = useState(MOCK_HOST_ROOM.rounds);
  const [minutes, setMinutes] = useState(MOCK_HOST_ROOM.minutesPerRound);
  const [rosterNames, setRosterNames] = useState<string[]>(
    MOCK_HOST_ROSTER.map((r) => r.name),
  );

  const [nav, setNav] = useState<ConsoleNav>('room');
  const [paused, setPaused] = useState(false);
  const [graceRunning, setGraceRunning] = useState(false);
  const [notes, setNotes] = useState<HostNote[]>(MOCK_MOD_FEED);
  const [revealTriggered, setRevealTriggered] = useState(false);
  const [showReconnect, setShowReconnect] = useState(false);

  useEffect(() => {
    if (step === 'create' || step === 'roster' || step === 'ended') return;
    const t1 = setTimeout(() => setShowReconnect(true), 600);
    const t2 = setTimeout(() => setShowReconnect(false), 4200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [step]);

  const removeNote = (id: string) =>
    setNotes((prev) => prev.filter((n) => n.id !== id));

  const advanceRound = () => {
    setGraceRunning(true);
    setTimeout(() => setGraceRunning(false), 3000);
  };

  if (step === 'create') {
    return (
      <CreateRoomScreen
        mode={mode}
        rounds={rounds}
        minutes={minutes}
        rosterSize={rosterNames.length}
        onModeChange={setMode}
        onRoundsChange={setRounds}
        onMinutesChange={setMinutes}
        onCreate={() => setStep('roster')}
      />
    );
  }

  if (step === 'roster') {
    return (
      <RosterBuilderScreen
        initial={rosterNames}
        onContinue={(names) => {
          setRosterNames(names);
          setStep('lobby');
        }}
      />
    );
  }

  if (step === 'ended') {
    return (
      <div
        style={{
          minHeight: '100dvh',
          backgroundColor: 'var(--host-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div style={{...consoleCard, maxWidth: 420, textAlign: 'center', padding: 32}}>
          <img
            src={asset('/assets/kindsight/kindsight-mascot-only.png')}
            alt='Kindsight'
            style={{width: 120, height: 'auto', margin: '0 auto'}}
          />
          <h2 style={{marginTop: 16, fontFamily: dosisFont}}>
            {t('host.ended.title')}
          </h2>
          <p className='t14' style={{marginTop: 8}}>
            {t('host.ended.body')}
          </p>
          <components.Button
            label={t('host.create.title')}
            onClick={() => {
              setStep('create');
              setNotes(MOCK_MOD_FEED);
              setRevealTriggered(false);
            }}
            colorScheme='secondary'
            containerStyle={{marginTop: 24}}
            style={{textTransform: 'none'}}
          />
        </div>
      </div>
    );
  }

  const phase = stepToPhase[step];
  const stillWriting = MOCK_ROUND_PROGRESS.filter(
    (p) => p.state !== 'submitted',
  ).length;

  return (
    <ConsoleShell
      code={MOCK_HOST_ROOM.code}
      phase={phase}
      activeNav={nav}
      onNav={setNav}
      playerCount={rosterNames.length}
      noteCount={notes.length}
    >
      {step === 'lobby' && (
        <LobbyContent
          code={MOCK_HOST_ROOM.code}
          joinUrl={MOCK_HOST_ROOM.joinUrl}
          roster={MOCK_HOST_ROSTER}
          onStart={() => setStep('briefing')}
        />
      )}

      {step === 'briefing' && (
        <BriefingContent onStart={() => setStep('writing')} />
      )}

      {step === 'writing' && (
        <InGameContent
          mode={mode}
          round={MOCK_HOST_ROOM.currentRound}
          totalRounds={rounds}
          timer={MOCK_HOST_ROOM.timerRemaining}
          paused={paused}
          graceRunning={graceRunning}
          stillWriting={stillWriting}
          coverage={MOCK_COVERAGE}
          roundProgress={MOCK_ROUND_PROGRESS}
          notes={notes}
          onTogglePause={() => setPaused((v) => !v)}
          onAdvance={advanceRound}
          onRemoveNote={removeNote}
          onAdvanceReveal={() => setStep('wrapup')}
        />
      )}

      {step === 'wrapup' && (
        <WrapUpContent
          code={MOCK_HOST_ROOM.code}
          mode={mode}
          coverage={MOCK_COVERAGE}
          revealStatus={MOCK_REVEAL_STATUS}
          optedInCount={MOCK_OPTED_IN_COUNT}
          notes={notes}
          revealTriggered={revealTriggered}
          onTriggerReveal={() => setRevealTriggered(true)}
          onRemoveNote={removeNote}
          onEndRoom={() => setStep('ended')}
        />
      )}

      <Toast message={t('host.reclaim.toast')} visible={showReconnect} />
    </ConsoleShell>
  );
};
