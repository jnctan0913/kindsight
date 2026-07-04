export const strings = {
  'reveal.locked.title': 'Your wall is ready.',
  'reveal.locked.count': '{count} notes are waiting for you',
  'reveal.locked.count.one': '1 note is waiting for you',
  'reveal.locked.host': 'The host opens the walls together.',
  'reveal.invite.title': 'Before you read, take three breaths.',
  'reveal.hold.button': 'Hold',
  'reveal.hold.button.aria': 'Hold for three breaths to open your wall',
  'reveal.hold.line1': 'Someone in this room noticed you.',
  'reveal.hold.line2': 'These words were written only for you.',
  'reveal.hold.line3': 'Take them in slowly.',
  'reveal.hold.counter': 'Breath {n} of 3',
  'reveal.hold.reset':
    "Hold through all three breaths. Start again when you're ready.",
  'reveal.hold.altLink': "Can't hold the button?",
  'reveal.hold.altStart': 'Starting three breaths. Press again to stop.',
  'reveal.sound.on': 'Sound on',
  'reveal.sound.off': 'Sound off',
  'reveal.note.aria': '{frame} note: {text}',
  'reveal.optin.question': 'Share to the big screen wall?',
  'reveal.optin.no': 'No',
  'reveal.optin.share': 'Share',
  'reveal.optin.shared': 'Shared',
  'reveal.optin.aria':
    'Share this note to the big screen wall, currently not shared',
  'wall.header': 'Your wall',
  'wall.optin.hint': "You can change what's shared until the room ends.",
  'wall.export.cta': 'Save my wall as an image',
  'frame.moment.label': 'Moment',
  'frame.strength.label': 'Strength',
  'frame.wish.label': 'Wish',
} as const;

export type StringKey = keyof typeof strings;

export function t(
  key: StringKey,
  vars?: Record<string, string | number>,
): string {
  let out: string = strings[key];
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      out = out.replaceAll(`{${name}}`, String(value));
    }
  }
  return out;
}
