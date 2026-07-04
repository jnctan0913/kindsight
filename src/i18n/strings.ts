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

  'host.demo.link': 'Open the host console demo',

  'host.create.title': 'Create a room',
  'host.create.mode.label': 'Writing mode',
  'host.create.mode.rr': 'Round-robin',
  'host.create.mode.rr.desc': 'Everyone gets even coverage. Best for 6+.',
  'host.create.mode.fs': 'Free select',
  'host.create.mode.fs.desc':
    'Players choose who to write to. You watch coverage.',
  'host.create.rounds.label': 'Rounds',
  'host.create.rounds.helper': 'Suggested for {n} players',
  'host.create.timer.label': 'Minutes per round',
  'host.create.tinyGroup':
    'Rotation anonymity weakens under 6 players. We recommend Free select or extra shuffling.',
  'host.create.cta': 'Create room',

  'host.roster.title': 'Roster',
  'host.roster.add.label': 'Add a name',
  'host.roster.add.cta': 'Add',
  'host.roster.paste.hint': 'One name per line',
  'host.roster.paste.cta': 'Add all',
  'host.roster.parsed': '{count} names found',
  'host.roster.duplicate': 'Duplicate found. Renamed to {name}.',
  'host.roster.edit': 'Edit',
  'host.roster.remove': 'Remove',
  'host.roster.count': '{count} names',
  'host.roster.continue': 'Open the lobby',

  'host.lobby.title': 'Lobby',
  'host.lobby.counter': '{claimed} of {total} claimed',
  'host.lobby.status.claimed': 'Claimed',
  'host.lobby.status.waiting': 'Waiting',
  'host.lobby.action.rename': 'Rename',
  'host.lobby.action.reassign': 'Reassign',
  'host.lobby.action.remove': 'Remove',
  'host.lobby.qr.hint': 'Show this on the big screen.',
  'host.lobby.start': 'Start briefing',
  'host.lobby.col.name': 'Name',
  'host.lobby.col.status': 'Status',

  'phase.lobby': 'Lobby',
  'phase.briefing': 'Briefing',
  'phase.writing': 'Writing',
  'phase.reveal': 'Reveal',
  'phase.wrapup': 'Wrap-up',
  'phase.announce.writing': 'Writing has started, round {n} of {total}',

  'host.game.round': 'Round {n} of {total}',
  'host.game.pause': 'Pause',
  'host.game.resume': 'Resume',
  'host.game.advance': 'Advance round now',
  'host.game.grace': 'Grace period running (10s)',
  'host.game.activity': '{count} players still writing this round',
  'host.game.coverage.title': 'Coverage',
  'host.game.coverage.floor': '3-note floor',
  'host.game.coverage.under': '{name} needs {count} more',
  'host.game.progress.title': 'Round progress',
  'host.game.progress.submitted': 'Submitted',
  'host.game.progress.writing': 'Writing',
  'host.game.progress.idle': 'Idle',
  'host.stats.players': '{count} players',
  'host.stats.notes': '{count} notes',
  'host.game.advanceReveal': 'Advance to reveal',
  'host.briefing.advance': 'Start writing',
  'host.briefing.body':
    'Players are reading the briefing on their phones. Start writing when the room is ready.',

  'host.mod.title': 'Moderation',
  'host.mod.to': 'To: {name}',
  'host.mod.remove': 'Remove',
  'host.mod.confirm': 'Remove this note? The recipient never sees it.',
  'host.mod.removed': 'Note removed',
  'host.nav.room': 'Room',

  'host.wrap.title': 'Wrap-up',
  'host.wrap.reveal.cta': 'Open the walls',
  'host.wrap.reveal.sub':
    'Every player unlocks their own wall with a three-breath hold.',
  'host.wrap.reveal.blockedCount': '{count} players are under 3 notes',
  'host.wrap.reveal.blockedNames': 'Waiting on {names}',
  'host.wrap.reveal.triggered': 'The walls are open.',
  'host.wrap.status.title': 'Reveal status',
  'host.wrap.status.holding': 'Holding',
  'host.wrap.status.reading': 'Reading',
  'host.wrap.status.finished': 'Finished',
  'host.wrap.highlight.label': 'Show opted-in notes on the big screen',
  'host.wrap.highlight.count': '{count} notes opted in',
  'host.wrap.highlight.disabled': 'No notes opted in yet',
  'host.wrap.prompts.title': 'Sharing prompts',
  'host.wrap.prompts.push': 'Show on big screen',
  'host.wrap.end.cta': 'End and delete room',
  'host.wrap.end.body':
    'This deletes all notes and the roster permanently. Exported images are unaffected. Type the room code to confirm.',
  'host.wrap.end.ttl': 'Rooms also delete themselves 24 hours after creation.',
  'host.wrap.end.field': 'Type {code} to confirm',
  'host.wrap.dangerZone': 'Danger zone',

  'host.reclaim.toast': 'Welcome back. The room kept running.',

  'host.prompt.1': 'What surprised you about a note on your wall?',
  'host.prompt.2': 'Which note will you carry into next week?',
  'host.prompt.3': 'Who wants to say thank you out loud?',

  'host.ended.title': 'This room has closed.',
  'host.ended.body': 'Your exported wall is yours to keep.',
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

  'host.demo.link': '打开主持人控制台演示',

  'host.create.title': '创建房间',
  'host.create.mode.label': '写作模式',
  'host.create.mode.rr': '轮换分配',
  'host.create.mode.rr.desc': '每个人收到的便签一样多。适合 6 人及以上。',
  'host.create.mode.fs': '自由选择',
  'host.create.mode.fs.desc': '玩家自己选写给谁，你来关注覆盖情况。',
  'host.create.rounds.label': '轮数',
  'host.create.rounds.helper': '按 {n} 人给出的建议',
  'host.create.timer.label': '每轮分钟数',
  'host.create.tinyGroup':
    '少于 6 人时，轮换的匿名性会变弱。建议改用自由选择，或增加打乱次数。',
  'host.create.cta': '创建房间',

  'host.roster.title': '名单',
  'host.roster.add.label': '添加名字',
  'host.roster.add.cta': '添加',
  'host.roster.paste.hint': '每行一个名字',
  'host.roster.paste.cta': '全部添加',
  'host.roster.parsed': '找到 {count} 个名字',
  'host.roster.duplicate': '发现重名，已改为 {name}。',
  'host.roster.edit': '编辑',
  'host.roster.remove': '移除',
  'host.roster.count': '{count} 个名字',
  'host.roster.continue': '进入大厅',

  'host.lobby.title': '大厅',
  'host.lobby.counter': '已认领 {claimed} / {total}',
  'host.lobby.status.claimed': '已认领',
  'host.lobby.status.waiting': '未认领',
  'host.lobby.action.rename': '重命名',
  'host.lobby.action.reassign': '重新分配',
  'host.lobby.action.remove': '移除',
  'host.lobby.qr.hint': '把这里投到大屏幕上。',
  'host.lobby.start': '开始说明',
  'host.lobby.col.name': '名字',
  'host.lobby.col.status': '状态',

  'phase.lobby': '大厅',
  'phase.briefing': '说明',
  'phase.writing': '写作',
  'phase.reveal': '开墙',
  'phase.wrapup': '收尾',
  'phase.announce.writing': '写作开始了，第 {n} 轮，共 {total} 轮',

  'host.game.round': '第 {n} 轮 / 共 {total} 轮',
  'host.game.pause': '暂停',
  'host.game.resume': '继续',
  'host.game.advance': '立即进入下一轮',
  'host.game.grace': '缓冲期进行中（10 秒）',
  'host.game.activity': '本轮还有 {count} 人在写',
  'host.game.coverage.title': '覆盖情况',
  'host.game.coverage.floor': '3 张下限',
  'host.game.coverage.under': '{name} 还差 {count} 张',
  'host.game.progress.title': '本轮进度',
  'host.game.progress.submitted': '已提交',
  'host.game.progress.writing': '写作中',
  'host.game.progress.idle': '未动笔',
  'host.stats.players': '{count} 位玩家',
  'host.stats.notes': '{count} 张便签',
  'host.game.advanceReveal': '进入开墙',
  'host.briefing.advance': '开始写作',
  'host.briefing.body': '玩家正在手机上阅读玩法说明。准备好了就开始写作。',

  'host.mod.title': '内容把关',
  'host.mod.to': '写给：{name}',
  'host.mod.remove': '移除',
  'host.mod.confirm': '移除这张便签？收到的人不会看到它。',
  'host.mod.removed': '已移除',
  'host.nav.room': '房间',

  'host.wrap.title': '收尾',
  'host.wrap.reveal.cta': '打开所有墙',
  'host.wrap.reveal.sub': '每位玩家按住按钮、呼吸三次，打开自己的那面墙。',
  'host.wrap.reveal.blockedCount': '还有 {count} 人不足 3 张',
  'host.wrap.reveal.blockedNames': '还差 {names}',
  'host.wrap.reveal.triggered': '所有墙都打开了。',
  'host.wrap.status.title': '开墙状态',
  'host.wrap.status.holding': '按住中',
  'host.wrap.status.reading': '阅读中',
  'host.wrap.status.finished': '已读完',
  'host.wrap.highlight.label': '在大屏幕上展示同意分享的便签',
  'host.wrap.highlight.count': '{count} 张便签已同意分享',
  'host.wrap.highlight.disabled': '还没有便签同意分享',
  'host.wrap.prompts.title': '分享话题',
  'host.wrap.prompts.push': '推送到大屏幕',
  'host.wrap.end.cta': '结束并删除房间',
  'host.wrap.end.body':
    '这会永久删除所有便签和名单。已导出的图片不受影响。输入房间码以确认。',
  'host.wrap.end.ttl': '房间也会在创建 24 小时后自动删除。',
  'host.wrap.end.field': '输入 {code} 以确认',
  'host.wrap.dangerZone': '危险操作',

  'host.reclaim.toast': '欢迎回来。房间一直在正常运行。',

  'host.prompt.1': '你墙上的哪张便签让你意外？',
  'host.prompt.2': '哪一张你会带进下一周？',
  'host.prompt.3': '谁想大声说一句谢谢？',

  'host.ended.title': '这个房间已经结束。',
  'host.ended.body': '你导出的墙，永远属于你。',
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
