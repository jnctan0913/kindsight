export type Frame = 'moment' | 'strength' | 'wish';

export type DemoNote = {
  id: number;
  frame: Frame;
  content: string;
};

// Content from COPY.md rehearsal and briefing example strings.
export const demoNotes: DemoNote[] = [
  {
    id: 1,
    frame: 'moment',
    content: 'I noticed you stayed calm when the demo broke.',
  },
  {
    id: 2,
    frame: 'strength',
    content:
      "I think you're strong at asking the question everyone else is avoiding.",
  },
  {
    id: 3,
    frame: 'wish',
    content:
      'I hope you get to lead the next client pitch. You are more ready than you think.',
  },
  {
    id: 4,
    frame: 'moment',
    content:
      'I noticed you gave up your seat by the window without making it a thing.',
  },
  {
    id: 5,
    frame: 'strength',
    content:
      "I think you're strong at making the newest person in the room feel like a regular.",
  },
  {
    id: 6,
    frame: 'wish',
    content:
      'I hope you take the stage next time. Your run-through this morning was the real thing.',
  },
  {
    id: 7,
    frame: 'moment',
    content:
      'I noticed you stayed behind to help Mei repack the kits when everyone else left.',
  },
  {
    id: 8,
    frame: 'strength',
    content:
      "I think you're strong at turning a messy discussion into three clear next steps.",
  },
];
