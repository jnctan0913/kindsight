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
  'wall.header': 'Your wall',
  'wall.share.hint':
    'Tap the screen button on a note to show it on the big screen wall. You can change this until the room ends.',
  'wall.share.aria': 'Show this note on the big screen wall',
  'wall.export.cta': 'Save my wall as an image',
  'export.rendering': 'Making your image...',
  'export.success':
    'Saved. This image is your keepsake. The room deletes itself after the session.',
  'export.fallback': 'Press and hold the image to save it',
  'export.fallback.close': 'Close',
  'export.overlay.aria': 'Your Kindsight wall, ready to save',
  'export.wordmark': 'Kindsight',
  'export.title': "Your wall",
  'export.date': '8 September 2026',
  'export.footer.en': 'Written anonymously by the people in your room. Kindsight.',
  'export.footer.zh': '这间房里的人，匿名为你写下。Kindsight。',
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
