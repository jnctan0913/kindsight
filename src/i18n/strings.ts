export type Locale = 'en' | 'zh';

const en = {
  'app.name': 'Kindsight',
  'app.tagline': 'The light behind you',
  'chrome.lang.en': 'EN',
  'chrome.lang.zh': '中文',
  'chrome.connection.reconnecting': 'Reconnecting...',
  'chrome.connection.restored': 'Reconnected',
  'chrome.connection.queuedSend': 'Will send when reconnected',
  'common.back': 'Back',
  'common.continue': 'Continue',
  'common.cancel': 'Cancel',
  'common.done': 'Done',
  'common.close': 'Close',

  'player.join.title': 'Join a room',
  'player.join.code.label': 'Room code',
  'player.join.code.placeholder': '6 characters',
  'player.join.cta': 'Join',
  'player.join.error.badCode':
    "That code doesn't match a live room. Check the big screen.",
  'player.join.error.ended':
    'This room has already ended. Ask your host for a new code.',
  'player.join.error.full':
    'Every name in this room is taken. Check with your host.',
  'player.claim.title': 'Who are you?',
  'player.claim.taken': 'Taken',
  'player.claim.confirm': "That's me",
  'player.claim.waiting.title': "You're in, {name}",
  'player.claim.waiting.body': 'Waiting for the host to start.',

  'player.briefing.title': 'How this works',
  'player.briefing.slide1.title': 'Write kind notes',
  'player.briefing.slide1.body':
    "You'll write short, anonymous notes about the people here. Kind and specific beats long.",
  'player.briefing.slide2a.title': 'We pick who you write to',
  'player.briefing.slide2a.body':
    'Each round hands you one person. Rotation keeps every wall even.',
  'player.briefing.slide2b.title': 'You pick who you write to',
  'player.briefing.slide2b.body':
    "Choose anyone on the roster. Names you've written to get a check.",
  'player.briefing.slide3.title': 'At the end, the walls open',
  'player.briefing.slide3.body':
    'Everyone opens their own wall of notes and reads it one note at a time.',
  'player.briefing.anonymity':
    'Your notes are anonymous. No one, including the host, will ever see your name on a note.',
  'player.briefing.footer': 'The host starts the writing round.',

  'frame.moment.label': 'Moment',
  'frame.moment.stem': 'I noticed you...',
  'frame.strength.label': 'Strength',
  'frame.strength.stem': "I think you're strong at...",
  'frame.wish.label': 'Wish',
  'frame.wish.stem': 'I hope you...',

  'briefing.example.vagueLabel': 'A bit vague',
  'briefing.example.betterLabel': 'More like this',
  'briefing.moment.good': 'I noticed you stayed calm when the demo broke.',
  'briefing.moment.vague': 'I noticed you are really nice.',
  'briefing.moment.better':
    'I noticed you stayed behind to help Mei repack the kits when everyone else left.',
  'briefing.strength.good':
    "I think you're strong at asking the question everyone else is avoiding.",
  'briefing.strength.vague': "I think you're strong at everything.",
  'briefing.strength.better':
    "I think you're strong at turning a messy discussion into three clear next steps.",
  'briefing.wish.good':
    'I hope you get to lead the next client pitch. You are more ready than you think.',
  'briefing.wish.vague': 'I hope you have a good life.',
  'briefing.wish.better':
    'I hope you keep sketching on the whiteboard. It changed how we talked today.',
} as const;

export type StringKey = keyof typeof en;

const zh: Record<StringKey, string> = {
  'app.name': 'Kindsight',
  'app.tagline': '你背后的光',
  'chrome.lang.en': 'EN',
  'chrome.lang.zh': '中文',
  'chrome.connection.reconnecting': '正在重新连接……',
  'chrome.connection.restored': '已重新连接',
  'chrome.connection.queuedSend': '恢复连接后发送',
  'common.back': '返回',
  'common.continue': '继续',
  'common.cancel': '取消',
  'common.done': '完成',
  'common.close': '关闭',

  'player.join.title': '加入房间',
  'player.join.code.label': '房间码',
  'player.join.code.placeholder': '6 位房间码',
  'player.join.cta': '加入',
  'player.join.error.badCode': '没有找到这个房间。对照大屏幕上的房间码再试一次。',
  'player.join.error.ended': '这个房间已经结束了。请向主持人要新的房间码。',
  'player.join.error.full': '名单上的名字都被认领了。找主持人确认一下。',
  'player.claim.title': '你是哪一位？',
  'player.claim.taken': '已认领',
  'player.claim.confirm': '就是我',
  'player.claim.waiting.title': '你来了，{name}',
  'player.claim.waiting.body': '等主持人开始。',

  'player.briefing.title': '玩法说明',
  'player.briefing.slide1.title': '写下善意的便签',
  'player.briefing.slide1.body':
    '你将为在场的人写下简短的匿名便签。具体的善意，胜过冗长的客套。',
  'player.briefing.slide2a.title': '写给谁，由系统安排',
  'player.briefing.slide2a.body':
    '每一轮你会拿到一个对象。轮换让每个人的墙一样满。',
  'player.briefing.slide2b.title': '写给谁，由你来选',
  'player.briefing.slide2b.body': '从名单里任选一个人。写过的名字会有标记。',
  'player.briefing.slide3.title': '最后，一起开墙',
  'player.briefing.slide3.body':
    '每个人都会打开属于自己的一面墙，一张一张慢慢读。',
  'player.briefing.anonymity':
    '你的便签是匿名的。任何人，包括主持人，都不会在便签上看到你的名字。',
  'player.briefing.footer': '写作环节由主持人开启。',

  'frame.moment.label': '时刻',
  'frame.moment.stem': '我注意到你……',
  'frame.strength.label': '强项',
  'frame.strength.stem': '我觉得你很擅长……',
  'frame.wish.label': '祝愿',
  'frame.wish.stem': '我希望你……',

  'briefing.example.vagueLabel': '有点空',
  'briefing.example.betterLabel': '这样更好',
  'briefing.moment.good': '我注意到演示出错的时候，你一直很沉着。',
  'briefing.moment.vague': '我注意到你人很好。',
  'briefing.moment.better':
    '我注意到大家都走了以后，你留下来帮 Mei 重新打包物料。',
  'briefing.strength.good': '我觉得你很擅长问出大家都在回避的那个问题。',
  'briefing.strength.vague': '我觉得你什么都很强。',
  'briefing.strength.better':
    '我觉得你很擅长把一场乱糟糟的讨论理成三步清晰的行动。',
  'briefing.wish.good': '我希望下次客户提案由你来主讲。你比你以为的更有准备。',
  'briefing.wish.vague': '我希望你一切都好。',
  'briefing.wish.better':
    '我希望你继续在白板上画图。今天的讨论因为它变得不一样。',
};

export const dictionaries: Record<Locale, Record<StringKey, string>> = {
  en,
  zh,
};

export function format(
  template: string,
  vars?: Record<string, string | number>,
): string {
  let out = template;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      out = out.replaceAll(`{${name}}`, String(value));
    }
  }
  return out;
}
