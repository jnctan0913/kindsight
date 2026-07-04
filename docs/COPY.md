# Kindsight UI String Table (EN / ZH)

**Status:** v1 for build | **Date:** 2026-07-04 | **Sources:** docs/PRD.md (resolved questions final), docs/DRD.md (sections 2.4, 3, 13), docs/HOST-GUIDE.md (terminology alignment)

## Conventions

- **Sentence case** everywhere. No title case except the wordmark "Kindsight".
- **Zero exclamation marks** in the entire app. The warmth comes from specificity, not punctuation.
- **No emoji** in any UI string (DRD section 9).
- **No em or en dashes** in any string. Periods, commas, colons only.
- **Placeholders** use `{curly}` syntax. Digits stay Latin in both languages (League Spartan renders them, DRD section 10).
- **ZH ellipsis** is `……` (U+2026 doubled). EN uses `...`.
- **ZH quotes** are full-width `“ ”`. ZH gender-neutral third person is `TA`, matching the casual register of the original game.
- **"Note"** is 便签 throughout. **"Wall"** is 墙. **"Reveal"** phase is 开墙. **"Host"** is 主持人. These match HOST-GUIDE.md usage.
- ZH runs 20 to 40 percent shorter than EN for most strings. Layout flags appear in Notes only where the ratio inverts or a string is unusually long.
- Pluralization: EN needs `.one` variants where flagged. ZH never pluralizes; the base string covers all counts.

---

## 1. Shared / app chrome

| Key | EN | ZH | Notes |
|---|---|---|---|
| `app.name` | Kindsight | Kindsight | Wordmark. Never translated, never localized. |
| `app.tagline` | The light behind you | 你背后的光 | Join screen under logo, big screen ended card, export image. ZH is the original game name; treat it as the primary form. |
| `chrome.lang.en` | EN | EN | Language toggle pill, left segment. Always renders as "EN" in both locales. |
| `chrome.lang.zh` | 中文 | 中文 | Toggle pill, right segment. Always renders as 中文 in both locales. |
| `chrome.connection.reconnecting` | Reconnecting... | 正在重新连接…… | Slim navy banner under header (DRD 2.4). With spinner. |
| `chrome.connection.restored` | Reconnected | 已重新连接 | Banner turns teal for 2s, then dismisses. |
| `chrome.connection.queuedSend` | Will send when reconnected | 恢复连接后发送 | Replaces the Send button label while offline. Longest button string in the app; button must fit it at min width. |
| `common.back` | Back | 返回 | Header back arrow aria label. |
| `common.continue` | Continue | 继续 | Generic forward action. |
| `common.cancel` | Cancel | 取消 | Dialogs. |
| `common.done` | Done | 完成 | Sheet dismiss. |
| `common.close` | Close | 关闭 | Dialog close aria label. |

12 strings.

---

## 2. Player: join and claim

| Key | EN | ZH | Notes |
|---|---|---|---|
| `player.join.title` | Join a room | 加入房间 | Join screen heading, under logo block. |
| `player.join.code.label` | Room code | 房间码 | Field label, visible (never placeholder-only). |
| `player.join.code.placeholder` | 6 characters | 6 位房间码 | Input placeholder. Field auto-uppercases. |
| `player.join.cta` | Join | 加入 | Primary button. |
| `player.join.error.badCode` | That code doesn't match a live room. Check the big screen. | 没有找到这个房间。对照大屏幕上的房间码再试一次。 | Inline field error, icon plus text (DRD 2.4 verbatim EN). ZH slightly longer than EN here; error row must wrap to two lines. |
| `player.join.error.ended` | This room has already ended. Ask your host for a new code. | 这个房间已经结束了。请向主持人要新的房间码。 | Inline field error. No error styling beyond the standard inline pattern. |
| `player.join.error.full` | Every name in this room is taken. Check with your host. | 名单上的名字都被认领了。找主持人确认一下。 | Shown when the roster has zero unclaimed names. |
| `player.claim.title` | Who are you? | 你是哪一位？ | Claim screen heading. |
| `player.claim.taken` | Taken | 已认领 | Muted tag on claimed RosterChips. ZH is 3 glyphs vs 5 chars; chip min-width comes from padding, not fixed width. |
| `player.claim.confirm` | That's me | 就是我 | Pinned confirm button after selecting a chip. |
| `player.claim.waiting.title` | You're in, {name} | 你来了，{name} | Waiting card with mascot. ZH is intentionally not literal ("you're here"); it is the natural warm greeting. |
| `player.claim.waiting.body` | Waiting for the host to start. | 等主持人开始。 | Under the title. Pairs with `empty-lobby-soft.png`. |

12 strings.

---

## 3. Player: briefing

Carousel of three slides (illustrations per DRD 9.1 asset map), then the frame cards, then the anonymity promise.

| Key | EN | ZH | Notes |
|---|---|---|---|
| `player.briefing.title` | How this works | 玩法说明 | Screen heading. |
| `player.briefing.slide1.title` | Write kind notes | 写下善意的便签 | Slide 1, with `onboarding-write` illustration. |
| `player.briefing.slide1.body` | You'll write short, anonymous notes about the people here. Kind and specific beats long. | 你将为在场的人写下简短的匿名便签。具体的善意，胜过冗长的客套。 | One idea per slide. |
| `player.briefing.slide2a.title` | We pick who you write to | 写给谁，由系统安排 | Slide 2, Mode A rooms only. `onboarding-rotate` illustration. |
| `player.briefing.slide2a.body` | Each round hands you one person. Rotation keeps every wall even. | 每一轮你会拿到一个对象。轮换让每个人的墙一样满。 | |
| `player.briefing.slide2b.title` | You pick who you write to | 写给谁，由你来选 | Slide 2, Mode B rooms only. |
| `player.briefing.slide2b.body` | Choose anyone on the roster. Names you've written to get a check. | 从名单里任选一个人。写过的名字会有标记。 | |
| `player.briefing.slide3.title` | At the end, the walls open | 最后，一起开墙 | Slide 3, `onboarding-reveal` illustration. |
| `player.briefing.slide3.body` | Everyone opens their own wall of notes and reads it one note at a time. | 每个人都会打开属于自己的一面墙，一张一张慢慢读。 | |
| `player.briefing.anonymity` | Your notes are anonymous. No one, including the host, will ever see your name on a note. | 你的便签是匿名的。任何人，包括主持人，都不会在便签上看到你的名字。 | Anonymity promise card, verbatim per DRD P3. Prominent, repeated nowhere else in full. |
| `player.briefing.footer` | The host starts the writing round. | 写作环节由主持人开启。 | Footer. No player action advances the phase. |

### 3.1 The three frames

Frame stems double as composer hint text (DRD section 10). The ZH Strength stem follows the DRD (我觉得你很擅长……) rather than the original game's mid-sentence blank (在……方面很强), because a prefill stem must be a prefix.

| Key | EN | ZH | Notes |
|---|---|---|---|
| `frame.moment.label` | Moment | 时刻 | FrameTag pill. ZH tags are 2 glyphs; pill min-width from padding, never fixed width (DRD 10). |
| `frame.moment.stem` | I noticed you... | 我注意到你…… | Stem, prefilled as composer hint. |
| `frame.strength.label` | Strength | 强项 | FrameTag pill. |
| `frame.strength.stem` | I think you're strong at... | 我觉得你很擅长…… | Stem. |
| `frame.wish.label` | Wish | 祝愿 | FrameTag pill. 祝愿 (a wish for someone), not 心愿 (one's own wish). |
| `frame.wish.stem` | I hope you... | 我希望你…… | Stem. |

### 3.2 Briefing examples (one good, one gently corrected, per frame)

| Key | EN | ZH | Notes |
|---|---|---|---|
| `briefing.example.vagueLabel` | A bit vague | 有点空 | Label above the crossed-through vague example. Muted, never red. |
| `briefing.example.betterLabel` | More like this | 这样更好 | Label above the corrected version. Teal accent. |
| `briefing.moment.good` | I noticed you stayed calm when the demo broke. | 我注意到演示出错的时候，你一直很沉着。 | DRD P3 example, kept. |
| `briefing.moment.vague` | I noticed you are really nice. | 我注意到你人很好。 | The classic bad note (HOST-GUIDE). |
| `briefing.moment.better` | I noticed you stayed behind to help Mei repack the kits when everyone else left. | 我注意到大家都走了以后，你留下来帮 Mei 重新打包物料。 | Correction, aligned with the host's spoken demo. |
| `briefing.strength.good` | I think you're strong at asking the question everyone else is avoiding. | 我觉得你很擅长问出大家都在回避的那个问题。 | |
| `briefing.strength.vague` | I think you're strong at everything. | 我觉得你什么都很强。 | |
| `briefing.strength.better` | I think you're strong at turning a messy discussion into three clear next steps. | 我觉得你很擅长把一场乱糟糟的讨论理成三步清晰的行动。 | |
| `briefing.wish.good` | I hope you get to lead the next client pitch. You are more ready than you think. | 我希望下次客户提案由你来主讲。你比你以为的更有准备。 | From HOST-GUIDE demo, kept consistent. |
| `briefing.wish.vague` | I hope you have a good life. | 我希望你一切都好。 | |
| `briefing.wish.better` | I hope you keep sketching on the whiteboard. It changed how we talked today. | 我希望你继续在白板上画图。今天的讨论因为它变得不一样。 | |

28 strings.

---

## 4. Player: writing

| Key | EN | ZH | Notes |
|---|---|---|---|
| `player.writing.roundHeader` | Round {n} of {total} | 第 {n} 轮 / 共 {total} 轮 | Header title slot, Mode A. |
| `player.writing.target.label` | Write to | 写给 | Above the TargetBanner (Mode A). |
| `player.writing.timer.remaining` | {time} left | 还剩 {time} | Visible near the RoundTimer bar. {time} formatted mm:ss. |
| `player.writing.timer.aria` | About {minutes} minutes left | 还剩大约 {minutes} 分钟 | aria-live announcement at intervals (DRD 11: never color alone for urgency). |
| `player.writing.timer.final` | 30 seconds left | 还剩 30 秒 | Final-30s state, text pairs with the bar color change. |
| `player.writing.prior.label` | What others already said ({count}) | 其他人已经写的（{count}） | PriorNotesAccordion, collapsed. |
| `player.writing.prior.hint` | Add something new, or go more specific. | 补充一点新的，或者写得更具体。 | Shown on expand (DRD P4a verbatim EN). |
| `player.writing.prior.empty` | No notes for {name} yet. Yours will be the first. | {name} 还没有收到便签。你的会是第一张。 | Empty state with `empty-notes-soft.png`. The "be the first" invitation. |
| `player.writing.frame.label` | Pick a frame | 选一个开头 | Above FrameSelector. ZH says "pick an opening", which is what a frame is to the writer. |
| `player.writing.composer.placeholder.moment` | I noticed you... | 我注意到你…… | Mirrors `frame.moment.stem`. Separate key so composer copy can diverge later without touching the briefing. |
| `player.writing.composer.placeholder.strength` | I think you're strong at... | 我觉得你很擅长…… | Mirrors `frame.strength.stem`. |
| `player.writing.composer.placeholder.wish` | I hope you... | 我希望你…… | Mirrors `frame.wish.stem`. |
| `player.writing.composer.counter` | {count}/280 | {count}/280 | Character counter. 280 max both locales; ZH carries more meaning per char, do not lower the cap. |
| `player.writing.send` | Send note | 发送便签 | Primary button. Disabled until frame picked and text non-empty. |
| `player.writing.sendAnyway` | Send anyway | 就这样发送 | Button relabel after a validator nudge. One more tap sends. |
| `player.writing.sent` | Sent to {name}'s wall | 已经贴到 {name} 的墙上了 | Confirmation state with aurora sparkle. ZH uses 贴 (stick onto), echoing the paper wall. |
| `player.writing.sent.waiting` | Waiting for the next round. | 等下一轮开始。 | After sending in Mode A, if no bonus note available. |
| `player.writing.bonus.title` | One more while you wait? | 等的时候，再写一张？ | Bonus note invitation card, Mode A after submitting (DRD Q5). |
| `player.writing.bonus.body` | Write a bonus note to anyone you choose. | 写给任何一个你想写的人。 | |
| `player.writing.bonus.cta` | Write a bonus note | 加写一张 | Opens the Mode B style picker. |
| `player.writing.rateCap` | You've hit the note limit for now. | 暂时到便签上限了，先歇一会儿。 | Send button disabled state (DRD P4b). Invisible until hit. ZH adds "rest a moment" to keep it kind. |

### 4.1 Soft validator nudges

Amber SoftValidatorHint with lightbulb icon. Never blocks, never modal, never red. Rotate variants by trigger; if a note trips two, show the first match only.

| Key | EN | ZH | Notes |
|---|---|---|---|
| `validator.vaguePraise` | Try naming a specific moment you saw. "Nice person" fades; details last. | 试着写下你亲眼见到的一个瞬间。“人很好”会被忘掉，细节才留得住。 | Trigger: stock praise phrases. EN from DRD wireframe, kept. |
| `validator.tooShort` | A few more words would land better. What did you see them do? | 再多写几个字会更有分量。你看到 TA 做了什么？ | Trigger: below length threshold. |
| `validator.genericWish` | "Good luck" fits anyone. What do you hope for them, specifically? | “祝你好运”写给谁都行。你具体希望 TA 怎么样？ | Trigger: stock wish phrases on the Wish frame. |
| `validator.noMoment` | This reads like a general impression. Tie it to one moment you actually watched. | 这更像一个整体印象。试着落在一个你真正看到的瞬间上。 | Trigger: Moment frame without concrete markers. |
| `validator.stockPhrase` | This line gets written a lot. What would only fit {name}? | 这句话很多人都会写。有什么是只属于 {name} 的？ | Trigger: high-frequency phrase list. The strongest nudge; use last in rotation. |

### 4.2 Round advance grace (Mode A)

| Key | EN | ZH | Notes |
|---|---|---|---|
| `grace.title` | Round moving on. Sending your note in {n}... | 这一轮要结束了。你的便签 {n} 秒后发出…… | GraceCountdown bottom sheet, 10 to 0 ring (DRD P4a). Announced via aria-live at 10 and 5. |
| `grace.sendNow` | Send now | 现在发送 | Primary action on the sheet. |
| `grace.discard` | Discard | 放弃这张 | Secondary action. ZH names the object ("this one") so the verb is unambiguous. |
| `grace.discardedToast` | Draft discarded | 草稿已放弃 | Toast at zero if the note failed validation, or on tapping Discard. |

### 4.3 Mode B roster picker

| Key | EN | ZH | Notes |
|---|---|---|---|
| `player.picker.title` | Who will you write to? | 这一张，写给谁？ | Picker heading. |
| `player.picker.written` | Written | 写过 | Teal check tag on written-to chips, with count. |
| `player.picker.written.aria` | Written to {name}, {count} notes | 已写给 {name} {count} 张 | Chip aria label. |
| `player.picker.sentCount` | You've written {count} notes | 你已经写了 {count} 张 | Header line, encourages volume (DRD P4b). |
| `player.picker.sentCount.one` | You've written 1 note | 你已经写了 1 张 | EN singular. ZH base covers all counts. |

35 strings.

---

## 5. Player: reveal ritual

The quiet section. Night navy screens (DRD 9.1). Every string is load-bearing; do not pad, do not decorate. Breath pacing words: `in / out` coach text only, per DRD 3.2. Nothing else speaks during the hold.

| Key | EN | ZH | Notes |
|---|---|---|---|
| `reveal.locked.title` | Your wall is ready. | 你的墙准备好了。 | Locked wall heading (DRD state A). |
| `reveal.locked.count` | {count} notes are waiting for you | {count} 张便签在等你 | Live count under silhouettes, aria-live polite. Ticks up as notes arrive. |
| `reveal.locked.count.one` | 1 note is waiting for you | 1 张便签在等你 | EN singular. |
| `reveal.locked.host` | The host opens the walls together. | 主持人会让大家一起开墙。 | Lock icon line at the bottom. |
| `reveal.invite.title` | Before you read, take three breaths. | 读之前，先深呼吸三次。 | Unlock screen heading (state C). |
| `reveal.hold.button` | Hold | 按住 | Label inside the 120px circle. |
| `reveal.hold.button.aria` | Hold for three breaths to open your wall | 按住并呼吸三次，打开你的墙 | Button aria label (DRD 3.4). |
| `reveal.hold.line1` | Someone in this room noticed you. | 这个房间里，有人注意到了你。 | Priming line, breath 1 (replaced breathe-in/out coaching, 2026-07-04). |
| `reveal.hold.line2` | These words were written only for you. | 这些话，是只写给你的。 | Priming line, breath 2. |
| `reveal.hold.line3` | Take them in slowly. | 慢慢读，慢慢收下。 | Priming line, breath 3. |
| `reveal.hold.counter` | Breath {n} of 3 | 第 {n} 次呼吸 · 共 3 次 | Muted counter under coach text. |
| `reveal.hold.reset` | Hold through all three breaths. Start again when you're ready. | 要按住呼吸满三次。准备好了，再来一次。 | Early-release reset. Gentle, no error styling (DRD state C). |
| `reveal.hold.altLink` | Can't hold the button? | 按不住按钮？ | Small text link under the circle, opens timed mode (DRD 3.4). |
| `reveal.hold.altStart` | Starting three breaths. Press again to stop. | 开始三次呼吸。再按一次可以停下。 | Announced when timed mode starts. |
| `reveal.sound.on` | Sound on | 有声音 | Chime mute toggle (DRD Q7), small control on the unlock screen. |
| `reveal.sound.off` | Sound off | 静音 | |
| `reveal.note.counter` | Note {n} of {count} | 第 {n} 张 · 共 {count} 张 | Top-right during one-by-one reveal (state D). |
| `reveal.note.aria` | {frame} note: {text} | {frame}便签：{text} | aria-live announcement per note, frame tag first (DRD 3.4). |
| `reveal.optin.question` | Share this one to the big screen wall? | 把这一张分享到大屏幕吗？ | Per-note opt-in row, defaults to No (PRD RQ7). |
| `reveal.optin.no` | No | 不用 | Default pill. ZH 不用 (no need), softer than 不. |
| `reveal.optin.share` | Share | 分享 | |
| `reveal.optin.shared` | Shared | 已分享 | Pill state after choosing Share, teal with check. |
| `reveal.optin.aria` | Share this note to the big screen wall, currently not shared | 把这张便签分享到大屏幕，当前未分享 | Switch aria label (DRD 3.4). |
| `reveal.next` | Next note | 下一张 | Advance button, player-paced. |
| `reveal.last` | See your whole wall | 看看整面墙 | Final note's button (DRD state D). |
| `reveal.empty.defensive` | Your notes are on their way. | 你的便签正在路上。 | Defensive only: count hits 0 from post-trigger kills (DRD 2.4). Should never render in practice. |
| `wall.header` | Your wall | 你的墙 | Full wall screen (state E), with mascot mark. Daylight returns: off-white surface. |
| `wall.optin.hint` | You can change what's shared until the room ends. | 分享哪几张，在房间结束前都可以改。 | Small line under the wall header (DRD Q2: consent revocable while the room lives). |
| `wall.export.cta` | Save my wall as an image | 把墙保存为图片 | Pinned primary button. |
| `wall.export.rendering` | Making your image... | 正在生成图片…… | Button busy state during canvas render. |
| `wall.export.success` | Saved. This image is your keepsake. The room deletes itself after the session. | 已保存。这张图片是留给你的纪念。活动结束后，房间会自行删除。 | Toast (DRD state E verbatim EN). |
| `wall.export.fallback` | Press and hold the image to save it | 长按图片即可保存 | iOS Safari fallback instruction over the rendered full-screen image (PRD RQ6). |
| `wall.export.footer` | Written anonymously by the people in your room. Kindsight. | 这间房里的人，匿名为你写下。Kindsight。 | Keepsake line. Appears on the export image footer and the room-ended card. ZH adds 为你 (for you); it is the emotional payload and reads native. |

32 strings.

---

## 6. Host console

Host-facing strings can be denser than player strings, but stay calm: status, not drama.

### 6.1 Create room

| Key | EN | ZH | Notes |
|---|---|---|---|
| `host.create.title` | Create a room | 创建房间 | Screen heading. |
| `host.create.mode.label` | Writing mode | 写作模式 | Above the ModeCardPicker. |
| `host.create.mode.rr` | Round-robin | 轮换分配 | Mode card title. |
| `host.create.mode.rr.desc` | Everyone gets even coverage. Best for 6+. | 每个人收到的便签一样多。适合 6 人及以上。 | Card subtitle (DRD H1 verbatim EN). |
| `host.create.mode.fs` | Free select | 自由选择 | Mode card title. |
| `host.create.mode.fs.desc` | Players choose who to write to. You watch coverage. | 玩家自己选写给谁，你来关注覆盖情况。 | Card subtitle. |
| `host.create.rounds.label` | Rounds | 轮数 | Stepper label, Mode A only. |
| `host.create.rounds.helper` | Suggested for {n} players | 按 {n} 人给出的建议 | Helper under the prefilled stepper. |
| `host.create.timer.label` | Minutes per round | 每轮分钟数 | Minute stepper, default 3:00. |
| `host.create.tinyGroup` | Rotation anonymity weakens under 6 players. We recommend Free select or extra shuffling. | 少于 6 人时，轮换的匿名性会变弱。建议改用自由选择，或增加打乱次数。 | Amber Callout, non-blocking (DRD 2.4 verbatim EN). |
| `host.create.cta` | Create room | 创建房间 | Primary button. |

### 6.2 Roster builder

| Key | EN | ZH | Notes |
|---|---|---|---|
| `host.roster.title` | Roster | 名单 | Sidebar nav item and screen heading. |
| `host.roster.add.label` | Add a name | 添加名字 | Single-name field label. |
| `host.roster.add.cta` | Add | 添加 | |
| `host.roster.paste.hint` | One name per line | 每行一个名字 | Textarea hint (DRD 2.4 verbatim EN). Also the empty-paste inline hint. |
| `host.roster.paste.cta` | Add all | 全部添加 | |
| `host.roster.parsed` | {count} names found | 找到 {count} 个名字 | PasteList parse feedback. |
| `host.roster.duplicate` | Duplicate found. Renamed to {name}. | 发现重名，已改为 {name}。 | One-line notice on auto-suffix ("Alex (2)"). |
| `host.roster.edit` | Edit | 编辑 | Chip pencil action aria label. |
| `host.roster.remove` | Remove | 移除 | Chip x action aria label. |

### 6.3 Lobby

| Key | EN | ZH | Notes |
|---|---|---|---|
| `host.lobby.counter` | {claimed} of {total} claimed | 已认领 {claimed} / {total} | Live counter above the table. ZH is markedly shorter; keep the counter left-aligned so both look intentional. |
| `host.lobby.status.claimed` | Claimed | 已认领 | Table status with teal dot and claim time. |
| `host.lobby.status.waiting` | Waiting | 未认领 | |
| `host.lobby.action.rename` | Rename | 重命名 | Row action. |
| `host.lobby.action.reassign` | Reassign | 重新分配 | Row action. |
| `host.lobby.action.remove` | Remove | 移除 | Row action. |
| `host.lobby.qr.hint` | Show this on the big screen. | 把这里投到大屏幕上。 | Under QRPanel. |
| `host.lobby.start` | Start briefing | 开始说明 | Footer primary action. Explicit only. |

### 6.4 Phases and in-game console

| Key | EN | ZH | Notes |
|---|---|---|---|
| `phase.lobby` | Lobby | 大厅 | PhaseStepper labels, shared by all surfaces. |
| `phase.briefing` | Briefing | 说明 | |
| `phase.writing` | Writing | 写作 | |
| `phase.reveal` | Reveal | 开墙 | ZH names the act, matching `host.wrap.reveal.cta`. |
| `phase.wrapup` | Wrap-up | 收尾 | |
| `phase.announce.writing` | Writing has started, round {n} of {total} | 写作开始了，第 {n} 轮，共 {total} 轮 | aria-live phase announcement pattern (DRD 11). Other phases follow the same "{phase} has started" shape. |
| `host.game.round` | Round {n} of {total} | 第 {n} 轮 / 共 {total} 轮 | RoundControlCard heading. |
| `host.game.pause` | Pause | 暂停 | Timer control. |
| `host.game.resume` | Resume | 继续 | |
| `host.game.advance` | Advance round now | 立即进入下一轮 | Manual advance; fires the players' 10s grace. |
| `host.game.grace` | Grace period running (10s) | 缓冲期进行中（10 秒） | Status while player grace countdowns run (DRD H4). |
| `host.game.activity` | {count} players still writing this round | 本轮还有 {count} 人在写 | Activity line. |
| `host.game.coverage.title` | Coverage | 覆盖情况 | Panel heading, Mode B. |
| `host.game.coverage.floor` | 3-note floor | 3 张下限 | Tick-mark legend on CoverageBars. |
| `host.game.coverage.under` | {name} needs {count} more | {name} 还差 {count} 张 | Amber flag with icon, never color alone (DRD H4). |
| `host.game.progress.title` | Round progress | 本轮进度 | Panel heading, Mode A (replaces coverage). |
| `host.game.progress.submitted` | Submitted | 已提交 | Per-player round state. |
| `host.game.progress.writing` | Writing | 写作中 | |
| `host.game.progress.idle` | Idle | 未动笔 | ZH "hasn't started writing", kinder and more precise than 闲置. |
| `host.stats.players` | {count} players | {count} 位玩家 | Sidebar ambient counter. |
| `host.stats.notes` | {count} notes | {count} 张便签 | Sidebar ambient counter. |

### 6.5 Moderation

| Key | EN | ZH | Notes |
|---|---|---|---|
| `host.mod.title` | Moderation | 内容把关 | Sidebar nav and feed heading. ZH 内容把关 (content gatekeeping) reads as care, not policing. |
| `host.mod.to` | To: {name} | 写给：{name} | Feed row. Author identity never appears (PRD H6). |
| `host.mod.remove` | Remove | 移除 | Row action. The DRD wireframe says "Kill"; that stays internal vocabulary. See departures note. |
| `host.mod.confirm` | Remove this note? The recipient never sees it. | 移除这张便签？收到的人不会看到它。 | Inline one-line confirm (DRD H4 verbatim EN, verb aligned to Remove). |
| `host.mod.removed` | Note removed | 已移除 | Row collapse confirmation. |

### 6.6 Wrap-up

| Key | EN | ZH | Notes |
|---|---|---|---|
| `host.wrap.reveal.cta` | Open the walls | 打开所有墙 | The trigger (DRD H5 verbatim EN, HOST-GUIDE aligned). |
| `host.wrap.reveal.sub` | Every player unlocks their own wall with a three-breath hold. | 每位玩家按住按钮、呼吸三次，打开自己的那面墙。 | Expectation-setting sub-line. |
| `host.wrap.reveal.blockedCount` | {count} players are under 3 notes | 还有 {count} 人不足 3 张 | Disabled-button reason, Mode B floor (DRD 2.4). |
| `host.wrap.reveal.blockedNames` | Waiting on {names} | 还差 {names} | Blocker list; per-name detail uses `host.game.coverage.under`. |
| `host.wrap.status.holding` | Holding | 按住中 | RevealStatusList states. |
| `host.wrap.status.reading` | Reading | 阅读中 | |
| `host.wrap.status.finished` | Finished | 已读完 | |
| `host.wrap.highlight.label` | Show opted-in notes on the big screen | 在大屏幕上展示同意分享的便签 | HighlightToggle. Off by default. |
| `host.wrap.highlight.count` | {count} notes opted in | {count} 张便签已同意分享 | Live count beside the toggle. |
| `host.wrap.highlight.disabled` | No notes opted in yet | 还没有便签同意分享 | Disabled reason at zero (DRD H5). |
| `host.wrap.prompts.title` | Sharing prompts | 分享话题 | PromptDeck heading. Prompt content ships in HOST-GUIDE; the deck seeds the three questions from section 21:00 there. |
| `host.wrap.prompts.push` | Show on big screen | 推送到大屏幕 | Per-prompt action. |
| `host.wrap.end.cta` | End and delete room | 结束并删除房间 | Danger-zone card button. |
| `host.wrap.end.body` | This deletes all notes and the roster permanently. Exported images are unaffected. Type the room code to confirm. | 这会永久删除所有便签和名单。已导出的图片不受影响。输入房间码以确认。 | ConfirmDialog body (DRD H5 verbatim EN). |
| `host.wrap.end.ttl` | Rooms also delete themselves 24 hours after creation. | 房间也会在创建 24 小时后自动删除。 | Sub-line in the same dialog (PRD RQ1). |
| `host.wrap.end.field` | Type {code} to confirm | 输入 {code} 以确认 | Typed-code field label. |

### 6.7 Rehearsal mode

| Key | EN | ZH | Notes |
|---|---|---|---|
| `host.rehearsal.entry` | Preview the ritual | 预演开墙仪式 | Console entry point (DRD Q6, PRD P1 feature). |
| `host.rehearsal.banner` | Rehearsal. These notes are samples, not from a real room. | 预演模式。这些是示例便签，不来自真实房间。 | Persistent demo banner on every rehearsal screen. |
| `host.rehearsal.exit` | Exit rehearsal | 退出预演 | |
| `host.rehearsal.note1` | I noticed you gave up your seat by the window without making it a thing. | 我注意到你把靠窗的位置让了出来，还一点都没声张。 | Sample Moment note. The fake notes model good writing: observed, small, specific. |
| `host.rehearsal.note2` | I think you're strong at making the newest person in the room feel like a regular. | 我觉得你很擅长让刚来的人觉得自己是老朋友。 | Sample Strength note. |
| `host.rehearsal.note3` | I hope you take the stage next time. Your run-through this morning was the real thing. | 我希望你下次站上台。今天早上你排练的样子，已经完全可以了。 | Sample Wish note. |
| `host.reclaim.toast` | Welcome back. The room kept running. | 欢迎回来。房间一直在正常运行。 | Host reconnect toast (DRD 2.4 verbatim EN). |

77 strings.

---

## 7. Big screen

Distance-readable: supporting copy 40px minimum, headlines 72px (DRD section 6). Keep every string short enough to hold one line at those sizes.

| Key | EN | ZH | Notes |
|---|---|---|---|
| `screen.lobby.joinAt` | Join at | 加入地址 | Label above the URL, 40px supporting scale. |
| `screen.lobby.code` | Room code | 房间码 | Label above the 160px code. |
| `screen.lobby.progress` | {claimed} of {total} people are in | 已有 {claimed} / {total} 人进来 | Under JoinProgressDots. |
| `screen.lobby.ticker` | {name} just joined | {name} 刚刚加入 | Name ticker, lobby only (DRD Q3). 40px. |
| `screen.briefing.title` | Read the briefing on your phone | 在手机上看玩法说明 | Briefing title card (DRD 2.2). |
| `screen.writing.round` | Writing round {n} of {total} | 写作 · 第 {n} 轮 / 共 {total} 轮 | Phase title, Mode A. |
| `screen.writing.generic` | Writing in progress | 写作进行中 | Phase title, Mode B. |
| `screen.writing.notes` | {count} notes written | 已写下 {count} 张便签 | Ambient stat caption beside the 112px counter. Never content, never names. |
| `screen.reveal.interstitial` | Look at your phone. Take three breaths. | 看向你的手机。深呼吸三次。 | The interstitial line, headline scale, deep navy full-bleed (DRD section 6 verbatim EN). The room's only instruction; nothing else on screen but the mascot. |
| `screen.highlight.header` | The light in this room | 这间房里的光 | Highlight wall header. Echoes the game's name without repeating it. |
| `screen.closing` | Save your wall before you go. It's yours to keep. | 离开前保存你的墙。它属于你。 | Closing message card, Wrap-up. |

11 strings.

---

## 8. Edge states (DRD 2.4)

Connection banner and queued-send live in section 1. Tiny group lives in 6.1. Host reclaim lives in 6.7.

| Key | EN | ZH | Notes |
|---|---|---|---|
| `edge.late.title` | Welcome, {name} | 欢迎你，{name} | Late-joiner interstitial heading, after mid-game claim. |
| `edge.late.modeA` | Round {n} of {total} is in progress. You join from the next round. | 现在是第 {n} 轮，共 {total} 轮。你会从下一轮加入。 | Body, Mode A (rotation inserts them next round). |
| `edge.late.modeB` | Writing is in progress. Pick anyone and start. | 写作正在进行。选一个人，开始写吧。 | Body, Mode B: no waiting needed. |
| `edge.refresh.claimFallback` | Pick your name to rejoin. | 选回你的名字，继续游戏。 | Claim screen subtitle when a session token is invalid after refresh. Normal recovery is silent (skeleton only, no string). |
| `edge.ended.title` | This room has closed. | 这个房间已经结束。 | End card heading, mascot, no error styling. Shown for host end and 24h TTL alike. |
| `edge.ended.body` | Your exported wall is yours to keep. | 你导出的墙，永远属于你。 | End card body (DRD 2.4). Pair with `wall.export.footer` as the final line where space allows. |

6 strings.

---

## 9. Export image

Rendered by WallExportRenderer in brand tokens regardless of screen theme. One tall image (DRD Q4).

| Key | EN | ZH | Notes |
|---|---|---|---|
| `export.image.title` | {name}'s wall | {name} 的墙 | Header band, over the aurora gradient, next to the logo. White text on the deep-blue end only (DRD section 9 rule 2). |
| `export.image.date` | {date} | {date} | Under the title. Format EN "8 September 2026", ZH "2026 年 9 月 8 日". Locale-formatted by the renderer, not a translated string. |
| `export.image.footer` | Written anonymously by the people in your room. Kindsight. | 这间房里的人，匿名为你写下。Kindsight。 | Same string as `wall.export.footer`; single key, listed here for the renderer spec. |

3 keys (footer shared with section 5).

---

## Total: 216 strings across 9 surfaces

## Departures from DRD draft copy

1. **Moderation action label is "Remove", not "Kill".** The DRD wireframe and PRD use "Kill" as the feature name. On a screen a nervous first-time host reads mid-session, "Kill" is the only violent word in the product. "Remove" does the same job in the same calm register; "kill switch" stays as internal and host-guide vocabulary.
2. **ZH Strength stem follows the DRD, not the original game phrasing.** 我觉得你在……方面很强 has its blank mid-sentence and cannot prefill a composer. 我觉得你很擅长…… is a clean prefix and already appears in the DRD and the host guide's spoken ZH demo.
3. **Big screen highlight wall header is new copy** ("The light in this room" / 这间房里的光). The DRD specs the component but no title. It ties the wall back to the game's name without restating it.
4. **"You're in, {name}" renders in ZH as 你来了，{name}.** A literal 你已加入 is system-speak; 你来了 is what a person says when someone arrives.
5. **The rate-cap and discard strings add a soft landing in ZH** (先歇一会儿, 放弃这张). ZH bare imperatives read colder than EN equivalents; two extra characters restore the warmth.
