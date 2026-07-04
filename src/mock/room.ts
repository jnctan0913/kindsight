export const MOCK_ROOM_CODE = 'KIND01';

export const CLAIM_STORAGE_KEY = 'kindsight.claimedName';

export type RosterEntry = {
  name: string;
  claimed: boolean;
};

export const MOCK_ROSTER: RosterEntry[] = [
  {name: 'Amira', claimed: false},
  {name: 'Ben', claimed: true},
  {name: 'Chen', claimed: false},
  {name: 'Dana', claimed: false},
  {name: 'Farah', claimed: true},
  {name: 'Mei', claimed: false},
  {name: 'Noah', claimed: false},
  {name: 'Priya', claimed: true},
  {name: 'Tariq', claimed: false},
  {name: 'Wei', claimed: false},
];

export type WritingMode = 'roundRobin' | 'freeSelect';

export type FrameKey = 'moment' | 'strength' | 'wish';

export type HostRosterEntry = {
  id: string;
  name: string;
  claimed: boolean;
  claimedAt?: string;
};

export type HostNote = {
  id: string;
  target: string;
  frame: FrameKey;
  content: string;
};

export type RevealStatus = 'holding' | 'reading' | 'finished';

export type CoverageEntry = {
  name: string;
  noteCount: number;
};

export type RoundProgressState = 'submitted' | 'writing' | 'idle';

export type RoundProgressEntry = {
  name: string;
  state: RoundProgressState;
};

export const REVEAL_FLOOR = 3;

export const MOCK_HOST_ROOM = {
  code: 'KIND01',
  joinUrl: 'kindsight.app/r/KIND01',
  mode: 'roundRobin' as WritingMode,
  rounds: 4,
  currentRound: 2,
  minutesPerRound: 3,
  timerRemaining: '02:41',
};

export const MOCK_HOST_ROSTER: HostRosterEntry[] = [
  {id: 'r1', name: 'Amira', claimed: true, claimedAt: '7:02 pm'},
  {id: 'r2', name: 'Ben', claimed: true, claimedAt: '7:03 pm'},
  {id: 'r3', name: 'Chen', claimed: true, claimedAt: '7:03 pm'},
  {id: 'r4', name: 'Dana', claimed: true, claimedAt: '7:04 pm'},
  {id: 'r5', name: 'Farah', claimed: true, claimedAt: '7:05 pm'},
  {id: 'r6', name: 'Mei', claimed: true, claimedAt: '7:05 pm'},
  {id: 'r7', name: 'Noah', claimed: true, claimedAt: '7:06 pm'},
  {id: 'r8', name: 'Priya', claimed: false},
  {id: 'r9', name: 'Tariq', claimed: false},
  {id: 'r10', name: 'Wei', claimed: false},
];

export const MOCK_COVERAGE: CoverageEntry[] = [
  {name: 'Chen', noteCount: 2},
  {name: 'Farah', noteCount: 1},
  {name: 'Ben', noteCount: 4},
  {name: 'Dana', noteCount: 5},
  {name: 'Amira', noteCount: 6},
  {name: 'Mei', noteCount: 4},
  {name: 'Noah', noteCount: 3},
  {name: 'Priya', noteCount: 3},
  {name: 'Tariq', noteCount: 5},
  {name: 'Wei', noteCount: 4},
];

export const MOCK_ROUND_PROGRESS: RoundProgressEntry[] = [
  {name: 'Amira', state: 'submitted'},
  {name: 'Ben', state: 'submitted'},
  {name: 'Chen', state: 'writing'},
  {name: 'Dana', state: 'submitted'},
  {name: 'Farah', state: 'writing'},
  {name: 'Mei', state: 'submitted'},
  {name: 'Noah', state: 'idle'},
  {name: 'Priya', state: 'submitted'},
  {name: 'Tariq', state: 'submitted'},
  {name: 'Wei', state: 'writing'},
];

export const MOCK_MOD_FEED: HostNote[] = [
  {
    id: 'n1',
    target: 'Chen',
    frame: 'moment',
    content:
      'I noticed you stayed behind to help repack the kits when everyone else left.',
  },
  {
    id: 'n2',
    target: 'Dana',
    frame: 'wish',
    content: 'I hope you get to lead the next client pitch.',
  },
  {
    id: 'n3',
    target: 'Amira',
    frame: 'strength',
    content:
      "I think you're strong at turning a messy discussion into clear next steps.",
  },
  {
    id: 'n4',
    target: 'Ben',
    frame: 'moment',
    content: 'I noticed you stayed calm when the demo broke.',
  },
  {
    id: 'n5',
    target: 'Farah',
    frame: 'wish',
    content: 'I hope you keep sketching on the whiteboard.',
  },
];

export const MOCK_REVEAL_STATUS: {name: string; status: RevealStatus}[] = [
  {name: 'Amira', status: 'finished'},
  {name: 'Ben', status: 'reading'},
  {name: 'Chen', status: 'reading'},
  {name: 'Dana', status: 'finished'},
  {name: 'Farah', status: 'holding'},
  {name: 'Mei', status: 'reading'},
  {name: 'Noah', status: 'holding'},
  {name: 'Priya', status: 'finished'},
  {name: 'Tariq', status: 'reading'},
  {name: 'Wei', status: 'reading'},
];

export const MOCK_OPTED_IN_COUNT = 3;
