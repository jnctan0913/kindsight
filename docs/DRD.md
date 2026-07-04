# DRD: Kindsight

**Status:** Draft for developer handover | **Date:** 2026-07-04 | **Source PRD:** docs/PRD.md (approved, open questions resolved)

**Product type:** Social / Consumer App (group ritual game).
**Design direction:** Soft/Pastel warmth on a Claymorphism base, constrained to the locked BrainNest kit and Kindsight brand tokens. The mascot's soft 3D navy body and aurora glow set the mood: calm, warm, a little magical. Every screen should feel like the mascot looks: rounded, unhurried, quietly glowing.

Three surfaces, Kahoot-style split:

| Surface | Form factor | Design bias |
|---|---|---|
| Player app | Mobile-first PWA (BrainNest kit, max-width 650px) | Warmth, focus, one action per screen |
| Host console | Desktop-first web | Control, visibility, sky blue utility surfaces |
| Big screen | Projector view | Distance reading, ambient energy, zero content leakage |

---

## 1. Design Principles

1. **Protect the ritual.** Everything before the reveal builds anticipation. Nothing on any surface may leak a note to its subject before the host triggers Reveal. The reveal itself is slow on purpose.
2. **One job per screen.** Players hold a phone in a room full of people. Each player screen has exactly one primary action, one primary button, and no navigation chrome to wander off through.
3. **The host holds the room, the app holds the game.** Host controls are dense but calm: status always visible, destructive actions gated, no mid-game surprises.
4. **Kind by default.** Copy, motion, and validation all nudge rather than scold. Amber hints, never red walls. The app never shames a slow writer or a thin wall in public.
5. **Anonymity is visible.** Players must see and believe the anonymity promise. State it in the briefing, repeat it on the composer, and never render an author name anywhere.

---

## 2. Information Architecture and State Machine

### 2.1 Room phase state machine

The room has one server-side phase. All three surfaces subscribe and render from it. Only the host advances it, and only forward.

```
                 host creates room
                        |
                        v
 +--------+   host    +----------+   host    +---------+   host     +--------+   host    +---------+
 | LOBBY  | --------> | BRIEFING | --------> | WRITING | ---------> | REVEAL | --------> | WRAP-UP |
 +--------+  advance  +----------+  advance  +---------+  advance*  +--------+  advance  +---------+
                                              |  ^                                           |
                                              |  | Mode A only: round N -> round N+1          v
                                              +--+ (timer or manual, 10s grace)          END + DELETE
                                                                                        (explicit host
                                                                                         action or 24h TTL)

 * Blocked in Mode B until every player has >= 3 notes (the reveal floor).
```

### 2.2 What each surface shows in each phase

| Phase | Player | Host console | Big screen |
|---|---|---|---|
| Lobby | Join, claim name, then "You're in" waiting card | QR, code, live claim list, roster edits | QR, code, join progress |
| Briefing | Rules and the three frames, "waiting for host" footer | Briefing preview, advance control | Title card: "Read the briefing on your phone" |
| Writing | Composer (Mode A: assigned target; Mode B: roster picker) | Phase stepper, round control, coverage, moderation | Phase, timer, ambient note counter |
| Reveal | Locked wall, then hold-to-unlock, then notes one by one, then full wall | Reveal status per player, moderation stays live | "Look at your phone" interstitial |
| Wrap-up | My wall, export, sharing prompt | Highlight wall toggle, sharing prompts, end and delete | Optional highlight wall, closing message |
| Ended | "This room has ended" card with export reminder | Confirmation, back to create | Kindsight logo card |

### 2.3 Surface sitemaps

```
Player (single route, phase-driven)
  /r/[code]
    +-- Join (enter code if deep link missing)
    +-- Claim name
    +-- Briefing
    +-- Writing
    |     +-- Mode A: assigned-target composer
    |     +-- Mode B: roster picker -> composer
    +-- Locked wall (pre-reveal)
    +-- Reveal (hold to unlock -> notes one by one)
    +-- My wall + export

Host console
  /host
    +-- Create room (mode, rounds, timer)
    +-- Roster builder
    +-- Lobby
    +-- In-game (Writing)
    +-- Wrap-up (Reveal + close)
    +-- End and delete (confirm dialog)

Big screen
  /screen/[code]   (read-only, follows phase)
    +-- Lobby -> Writing -> Reveal interstitial -> Highlight wall / closing
```

### 2.4 Edge, empty, and error states

| State | Surface | Design |
|---|---|---|
| Late joiner | Player | Roster shows only unclaimed names. After claiming mid-game, an interstitial explains where the game is ("Round 2 of 4 is in progress. You join from the next round."). Mode A inserts them next round. |
| Refresh recovery | All | Session token restores identity and phase silently. Show a 300ms skeleton, never a login wall. If the token is invalid, fall back to the claim screen with remaining names. |
| Disconnected | Player, host | Persistent slim banner pinned below the header: navy background, "Reconnecting..." with spinner. Composer stays usable; submit queues and the button label changes to "Will send when reconnected". Banner turns teal "Reconnected" for 2s, then dismisses. |
| Host disconnect | Host | Room lives server-side. Reopening the host URL with the host token restores the console at the current phase. Show "Welcome back. The room kept running." toast. |
| Tiny group (under 6) | Host | Amber callout on Create Room when roster count < 6: "Rotation anonymity weakens under 6 players. We recommend Free select or extra shuffling." Non-blocking. |
| Reveal floor unmet (Mode B) | Host | Reveal button disabled with inline reason: "2 players are under 3 notes" plus the exact names highlighted in the coverage list. |
| Empty roster paste | Host | Inline hint under the textarea: "One name per line". |
| No notes for a player at reveal | Player | Cannot occur in Mode A; blocked by the floor in Mode B. Defensive copy anyway: "Your notes are on their way" if count is 0 due to kills after reveal trigger. |
| All notes killed post-reveal | Player | Wall shows remaining notes only. No tombstones, no "a note was removed" notice to the recipient. |
| Room ended / TTL expired | All | Friendly end card: mascot, "This room has closed. Your exported wall is yours to keep." No error styling. |
| Wrong or dead room code | Player | Inline field error: "That code doesn't match a live room. Check the big screen." |

---

## 3. The Reveal Ritual (centerpiece)

This is the make-or-break interaction (PRD Risk 3). Build and test it first. The design goal: recreate the held breath of the paper version. Pacing is the feature. Every duration below is a spec, not a suggestion.

### 3.1 Emotional pacing rationale

The paper ritual works because of enforced slowness: you physically turn the sheet, the room goes quiet, you read one note at a time in handwriting you cannot skim. A phone destroys this by default: content dumps instantly and thumbs scroll. So the design inserts three deliberate brakes:

1. **The locked wall** builds anticipation while others finish. You can see the shape of your wall (count, silhouettes) but not the content.
2. **The hold-to-unlock breath** transfers control of the moment to the player's own body. Holding for three breaths is long enough to quiet the room and short enough not to feel like a loading screen. Releasing early resets, which makes completing it a small act of commitment.
3. **One note at a time, self-paced.** The player taps to advance. No autoplay: reading speed is personal, and some notes need a second read.

### 3.2 States and flow

```
[Writing ends] -> LOCKED WALL -> (host triggers Reveal) -> UNLOCK INVITATION
   -> HOLD-TO-UNLOCK (3 breaths) -> NOTE 1 -> opt-in -> NOTE 2 -> ... -> NOTE N
   -> FULL WALL -> EXPORT
```

**State A: Locked wall.** Shown from the moment writing ends (or whenever the player finishes early) until the host triggers Reveal.

```
+------------------------------------+
| [logo sm]              [EN | 中文] |
|                                    |
|        Your wall is ready.         |   <- h2, Dosis 24
|                                    |
|   +----+  +----+  +----+           |
|   |////|  |////|  |////|           |   <- blurred NoteCard silhouettes,
|   +----+  +----+  +----+              navy 8% fill, no text, slow
|   +----+  +----+                      aurora shimmer sweep (6s loop)
|   |////|  |////|                   |
|   +----+  +----+                   |
|                                    |
|      5 notes are waiting for you   |   <- t16, count is real
|                                    |
|   ( lock icon )  The host opens    |
|   the walls together.              |
+------------------------------------+
```

Silhouette count equals the player's real note count and ticks up live as notes arrive (a new silhouette scales in, 250ms ease-out). This is the anticipation engine. Never render content, even blurred real text. Silhouettes are opaque decorative shapes.

**State B: Unlock invitation.** When the host triggers Reveal, the locked wall crossfades (400ms, ease-in-out) to the unlock screen. A single haptic tick (where supported) marks the moment.

**State C: Hold-to-unlock, three deep breaths.**

```
+------------------------------------+
|                                    |
|        Before you read,            |
|        take three breaths.         |   <- h2, centered
|                                    |
|              .----.                |
|            /        \              |
|           |   HOLD   |             |   <- HoldToRevealButton
|            \        /                 120px circle, navy fill,
|              '----'                    aurora ring around it
|                                    |
|        Breathe in...               |   <- live coach text, t18
|                                    |
|        Breath 1 of 3               |   <- t14, muted
+------------------------------------+
```

Interaction spec:

- The button is a 120px circle (touch target far above the 44pt minimum), navy `#1E2538` fill, mascot-style soft inner shadow, surrounded by a 6px aurora gradient progress ring.
- On press, the breath cycle starts. One breath = 3.2s: inhale 1.6s (button scales 1.0 to 1.12, ring segment fills, coach text "Breathe in..."), exhale 1.6s (scales back to 1.0, "Breathe out..."). Scale animates with ease-in-out on `transform` only.
- The aurora ring fills in three arcs, one third per completed breath. Total hold: 9.6s.
- Coach text and the "Breath N of 3" counter update per cycle. A soft haptic tick marks each completed breath.
- **Release early: the ritual resets.** Ring drains back to zero over 400ms ease-out, button returns to rest, coach text becomes "Hold through all three breaths. Start again when you're ready." No error styling. The reset is gentle, not punitive, but it is a full reset. Partial credit would cheapen the commitment.
- On the third exhale completing: ring pulses once (glow bloom, 500ms), button releases the player automatically (no extra tap), and the screen transitions to the first note.

**State D: Notes appear one by one.**

```
+------------------------------------+
|                        Note 1 of 5 |   <- t14, top-right
|                                    |
|   +----------------------------+   |
|   |  MOMENT                    |   |   <- frame tag, teal pill
|   |                            |   |
|   |  "I noticed you stayed     |   |   <- note text, Dosis 22,
|   |   behind to help Mei pack  |      line-height 1.5
|   |   the kits on day one."    |   |
|   |                            |   |
|   +----------------------------+   |   <- NoteCard: off-white,
|                                        radius 20, aurora edge glow
|   Share this one to the big       |
|   screen wall?                     |
|   (  No  )        (  Share  )      |   <- OptInToggle, default No
|                                    |
|          [   Next note   ]         |   <- Button, primary
+------------------------------------+
```

Motion spec per note:

- Card enters: opacity 0 to 1 and translateY 24px to 0, 450ms, ease-out. `transform` and `opacity` only, no layout shift.
- 250ms after the card settles, the opt-in row fades in (200ms). The stagger keeps eyes on the note first.
- "Next note" advances. The current card exits upward (translateY 0 to -16px, opacity to 0, 250ms ease-in) as the next enters. Advancing is always player-paced; there is no auto-advance and no timer on this screen.
- The opt-in choice ("share this one to the wall?") is per note, inline, defaulting to No (PRD Resolved Question 7). Choosing Share flips the pill to teal with a check icon and the label "Shared". The choice is editable until the player leaves the note; after that it is committed.
- The final note's button reads "See your whole wall".

**State E: Full wall and export.** All notes as a scrollable grid of NoteCards (1 column under 400px, 2 columns above). Header: "Your wall" plus the mascot mark. Primary button pinned at the bottom: "Save my wall as an image".

Export spec:

- Tapping renders the wall to a single image via canvas: aurora gradient header band with the Kindsight logo, all notes as cards with their frame tags, footer line "Written anonymously by the people in your room. Kindsight." Rendered in brand tokens regardless of screen theme.
- iOS Safari fallback (PRD Resolved Question 6): if canvas save fails, show the rendered image full-screen with the instruction "Press and hold the image to save it".
- After export, a toast: "Saved. This image is your keepsake. The room deletes itself after the session."
- Notes killed by the host after reveal disappear from the wall and any future export. No notice is shown to the recipient.

### 3.3 Reduced-motion reveal

With `prefers-reduced-motion`: no scaling, no shimmer, no pulse. The hold button shows a static circle with a plain circular progress stroke that fills linearly over the same 9.6s, coach text still updates ("Breathe in... / Breathe out..." as text only). Note cards use a simple 200ms opacity fade with no translation. The ritual timing is preserved; only the motion is stripped.

### 3.4 Screen reader reveal flow

- Locked wall: silhouettes are `aria-hidden`. The live count is announced via `aria-live="polite"`: "5 notes are waiting for you."
- Hold button: `role="button"`, label "Hold for three breaths to open your wall". Because press-and-hold excludes switch and some screen reader users, an accessible alternative is required: when the button receives keyboard or assistive-tech activation (single activate, not pointer hold), it runs the same 9.6s timed sequence automatically with an announced "Starting three breaths. Press again to stop." Each breath boundary is announced. This alternative is also exposed visually as a small "Can't hold the button?" text link beneath the circle.
- Each revealed note is announced in full when it appears (`aria-live="polite"`), frame tag first: "Moment note: I noticed you...". The opt-in control is a labelled switch: "Share this note to the big screen wall, currently not shared."

---

## 4. Player Flow (all five phases)

### Flow overview

```
[Scan QR / open URL] -> [Enter code if needed] -> [Claim name] -> [Briefing]
   -> [Writing: Mode A or Mode B] -> [Locked wall] -> [Reveal ritual] -> [Wall + export]
```

### Screen P1: Join

**Purpose:** get into the room in seconds. **Entry:** QR scan (deep link with code prefilled) or typed URL. **Exit:** Claim name.

- Layout reuses the BrainNest sign-in idiom: centered card on a Screen with AuroraBackground, logo on top (Onboarding logo block, mascot mark at 24% width), one InputField, one Button.
- QR path skips this screen entirely: the code comes from the URL and the player lands on Claim name.
- Room code field: 6-character input, auto-uppercase, large centered text (League Spartan 28). Inline error for dead codes (section 2.4).
- LanguageToggle (EN | 中文) sits top-right from this very first screen. Language choice persists for the whole session.

### Screen P2: Claim name

**Purpose:** bind the player to a roster identity. **Exit:** Briefing (or waiting card if still in Lobby).

- "Who are you?" heading, then the roster as a wrapping grid of RosterChips (pill buttons, 48px height, InputField border style). Claimed names render disabled with a muted "taken" tag.
- Tapping a chip selects it (teal border + check); a confirm Button pins to the bottom: "That's me". Two-step select-then-confirm prevents fat-finger claims of someone else's name.
- After claiming: "You're in, {Name}" card with the mascot and "Waiting for the host to start." The session token binds here; refreshing returns to this card, not to the picker.

### Screen P3: Briefing

**Purpose:** teach the game and the three frames. Entry: host advances to Briefing.

- Scrollable card stack, one card per rule, then one card per frame. Frame cards use the frame's tag pill plus one strong example each:
  - **Moment**, "I noticed you..." (example: "I noticed you stayed calm when the demo broke.")
  - **Strength**, "I think you're strong at..."
  - **Wish**, "I hope you..."
- Anonymity promise card, verbatim and prominent: "Your notes are anonymous. No one, including the host, will ever see your name on a note."
- Footer: "The host starts the writing round." No player action advances the phase.

### Screen P4a: Writing, Mode A (round-robin)

**Purpose:** write one framed note to the assigned target within the round. This is a key screen; wireframe:

```
+------------------------------------+
| [<]   Round 2 of 4        [EN|中文] |   <- Header (BrainNest, title slot)
|====================== 04:12 ======|   <- RoundTimer bar, aurora fill
|                                    |
|  Write to                          |
|  +------------------------------+  |
|  |  ( T )  Tariq                |  |   <- TargetBanner: initial avatar
|  +------------------------------+  |      disc + name, navy card
|                                    |
|  v What others already said (2)    |   <- collapsed accordion,
|                                        expands to anonymized notes
|  Pick a frame                      |
|  (Moment) ( Strength ) ( Wish )    |   <- FrameSelector, single choice
|                                    |
|  +------------------------------+  |
|  | I noticed you...             |  |   <- NoteComposer textarea,
|  |                              |  |      frame stem prefilled as
|  |                              |  |      hint text, 280 char max
|  +------------------------------+  |
|  ~ Try naming a specific moment    |   <- SoftValidatorHint (amber)
|    you saw. "Nice person" fades;   |
|    details last.                   |
|                                    |
|  [        Send note         ]      |   <- Button primary
+------------------------------------+
```

- **Read-first step:** "What others already said" is a collapsed accordion above the composer showing the target's existing notes (content and frame only, never authors). Copy on expand: "Add something new, or go more specific." It is collapsed by default so it aids without gating.
- **Frame choice is required.** The Send button stays disabled until a frame is picked and text is non-empty. The selected frame prefills the composer's hint text with its stem.
- **Soft validator:** runs on Send. If the text trips the vague-content heuristics (too short, stock phrases like "nice person", "good luck"), an amber SoftValidatorHint slides in under the composer with a concrete suggestion, and the button relabels to "Send anyway". One more tap sends. Nudge, never block. Amber (not red), lightbulb icon (SVG), never modal.
- After sending: confirmation state "Sent to Tariq's wall" with a small aurora sparkle (300ms), then either "Waiting for the next round" or, if the host allows multiple notes per round, the composer resets.
- **Round advance with 10s grace (PRD Resolved Question 2):** when the host advances and the player has an unsent draft, a GraceCountdown takes over the bottom of the screen: "Round moving on. Sending your note in 10..." with a visible 10-to-0 countdown ring and two actions: "Send now" and "Discard". At zero, the note auto-submits if it passes validation, otherwise it is discarded with a brief "Draft discarded" toast. Drafts never carry to the next target.

### Screen P4b: Writing, Mode B (free select)

**Purpose:** choose anyone and write. Two-step: roster picker, then the same composer as Mode A (minus the round timer, plus a back arrow to the picker).

- Roster picker: grid of RosterChips. Names the player has already written to carry a teal check mark and a written-to count. The player's own chip does not appear.
- A gentle sorting rule: unwritten-to names float to the top. This quietly evens coverage without labelling anyone as neglected.
- Header shows the player's own sent-note count ("You've written 4 notes") to encourage volume. Rate-limit ceiling is invisible until hit; at the cap, the Send button disables with "You've hit the note limit for now."

### Screens P5 to P7: Locked wall, Reveal, Wall and export

Specified in full in section 3.

---

## 5. Host Console Flow

Desktop-first. Visual reference: BrainNest Orchid admin template idioms (left sidebar, content cards, tables with row actions), rebuilt in Next.js. Host surfaces use the **sky blue secondary** background tint to visually separate "control room" from the warm player world. Minimum design width 1024px; the console degrades to stacked cards on tablet but is not designed for phones.

### Console shell

- Left sidebar: Kindsight mark, room code, phase indicator, nav (Room, Roster, Moderation), and the LanguageToggle. Sidebar is navy on sky blue content background.
- Top bar: PhaseStepper, always visible, spanning Lobby, Briefing, Writing, Reveal, Wrap-up. Completed phases render teal, current phase pulses gently (respecting reduced motion), future phases muted. Advancing is always an explicit button click plus the stepper never allows skipping or going back.

### Screen H1: Create room

- Single centered card, form idiom: visible labels above fields (never placeholder-only).
- Mode picker: two large selectable cards side by side, "Round-robin" (subtitle: "Everyone gets even coverage. Best for 6+.") and "Free select" (subtitle: "Players choose who to write to. You watch coverage."). Single select, teal border on the chosen card.
- Round count (Mode A only): stepper input, prefilled with the suggested count once the roster size is known, with helper text "Suggested for {n} players". Per-round timer: minute stepper, default 3:00.
- Tiny-group callout (amber) appears when roster count is under 6 (section 2.4).
- Primary button: "Create room". On success the code and QR generate and the console moves to Roster.

### Screen H2: Roster builder

- Two input affordances on one card: a single-name InputField with "Add", and a paste textarea ("One name per line") with "Add all".
- Names render as a RosterChip list with per-chip edit (pencil) and remove (x) actions. Duplicates auto-suffix on entry ("Alex (2)") with a one-line notice: "Duplicate found. Renamed to Alex (2)."
- Edits are free until the game starts; after Lobby opens, edits move to the Lobby screen's row actions.

### Screen H3: Lobby

- Left two thirds: claim status table. Columns: Name, Status (Claimed / Waiting), row actions (Rename, Reassign, Remove). Claimed rows get a teal dot and the claim time.
- Right third: QRPanel card with the QR, the room code in large type, and the join URL, plus a "Show on big screen" hint.
- Live counter above the table: "9 of 12 claimed".
- Footer action bar: "Start briefing" (primary). Advancing is explicit only.

### Screen H4: In-game console (Writing phase)

Key screen; wireframe:

```
+--------------------------------------------------------------------------+
| [K] ROOM 7GX4  | Lobby > Briefing > [WRITING] > Reveal > Wrap-up         |
|----------------+---------------------------------------------------------|
| Room           |  ROUND CONTROL (Mode A)              COVERAGE           |
| Roster         |  +---------------------------+  +---------------------+ |
| Moderation     |  | Round 2 of 4              |  | Amira   ###### 6    | |
|                |  | Timer   02:41  [pause]    |  | Ben     ####   4    | |
| ---            |  | [ Advance round now ]     |  | Chen    ##!    2 <3 | |
| EN | 中文      |  +---------------------------+  | Dana    #####  5    | |
|                |                                 | ...                 | |
| 12 players     |  ACTIVITY                       +---------------------+ |
| 37 notes       |  "3 players still writing        Mode B: bars = notes  | |
|                |   this round"                    received; names under  | |
|                |                                  the 3-note floor are   | |
|                |  MODERATION (live feed)          flagged amber with !   | |
|                |  +---------------------------+                          | |
|                |  | To: Chen | Moment         |   Mode A: coverage panel | |
|                |  | "I noticed you..."  [Kill]|   becomes round progress | |
|                |  | To: Dana | Wish           |   per player (submitted/ | |
|                |  | "I hope you..."     [Kill]|   writing/idle)          | |
|                |  +---------------------------+                          | |
+--------------------------------------------------------------------------+
```

- **Round control (Mode A):** current round, live countdown mirroring the players' timer, pause, and "Advance round now". Advancing manually fires the players' 10s grace countdown; the console shows "Grace period running (10s)" so the host knows why the round has not flipped yet.
- **Coverage (Mode B):** one CoverageBar per person, sorted ascending so thin walls surface first. The 3-note reveal floor renders as a tick mark on every bar; players under it are amber with an exclamation icon plus text (never color alone). Mode A swaps this panel for per-player round progress.
- **Moderation feed:** every submitted note as a row: target name, frame tag, content, Kill action. Author identity never appears anywhere in the console (PRD H6). Kill asks a one-line inline confirm ("Remove this note? The recipient never sees it.") and the row collapses. The feed is available in every phase, including after reveal.
- Ambient counters in the sidebar (players, total notes) give the host the room's pulse at a glance.

### Screen H5: Wrap-up console (Reveal and close)

- **Reveal trigger:** a single prominent card. In Mode B, the button is disabled until every player meets the 3-note floor, with the blockers listed by name ("Chen needs 1 more, Farah needs 2 more"). In Mode A the floor is met by design and the button is live. Button label: "Open the walls". A sub-line sets expectations: "Every player unlocks their own wall with a three-breath hold."
- Post-trigger: per-player reveal status list (Holding / Reading / Finished) so the host can pace the sharing conversation.
- **Highlight wall toggle:** switch card, "Show opted-in notes on the big screen", with a live count of opted-in notes. Off by default. Disabled with the reason "No notes opted in yet" when the count is zero.
- Sharing prompts: a small deck of discussion prompts the host can push to the big screen one at a time.
- **End and delete:** danger-zone card at the bottom, visually separated. Button "End and delete room" opens a ConfirmDialog: "This deletes all notes and the roster permanently. Exported images are unaffected. Type the room code to confirm." Also states the 24h auto-delete fallback.

---

## 6. Big Screen

One route, phase-driven, zero interaction. Design for the back row: assume 8 to 15 metres viewing distance on a 1080p projector.

### Distance-readable type scale (at 1920x1080)

| Element | Size | Font |
|---|---|---|
| Room code | 160px | League Spartan bold, letter-spaced |
| Phase title / headline | 72px | Dosis semibold |
| Counters (notes, players) | 112px | League Spartan |
| Supporting copy | 40px minimum | Dosis |
| Highlight wall note text | 44px minimum, max ~24 words per note | Dosis |

Navy ink text on off-white panels over the AuroraBackground. Never body text directly on the gradient midsection (see section 9 contrast rules).

### States

**Lobby:**

```
+----------------------------------------------------------------+
|                        [ Kindsight mark ]                       |
|                                                                 |
|   +-------------+          JOIN AT                              |
|   |             |          kindsight.app                        |
|   |   QR CODE   |                                               |
|   |             |          ROOM CODE                            |
|   +-------------+          7 G X 4                              |
|                                                                 |
|          ( 9 of 12 people are in )                              |
|          [•][•][•][•][•][•][•][•][•][ ][ ][ ]                   |
+----------------------------------------------------------------+
```

Join progress renders as filled dots, one per roster slot, filling with a 250ms teal pop as each claim lands. Names optionally cycle in a ticker ("Amira just joined") sized at 40px.

**Writing:** phase title ("Writing round 2 of 4" or "Writing in progress"), the shared countdown timer at counter scale, and one ambient stat: total notes written, ticking upward with a soft scale pulse per increment. Sparkle particles drift on the aurora at low density. **Never note content, never names, never who-wrote-to-whom.**

**Reveal interstitial:** the screen goes intentionally quiet. Deep navy full-bleed, the mascot centered, one line at headline scale: "Look at your phone. Take three breaths." This dims the room and pushes all attention to the phones. The big screen holds this state until the host enables the highlight wall or advances.

**Highlight wall (Wrap-up, host-toggled):** opted-in notes only, as large NoteCards in a slow crossfading rotation (one note at a time, 8s dwell, 600ms crossfade). Anonymized: no author ever; recipient name shown only because the recipient opted that specific note in (PRD B3 and Resolved Question 7). Frame tag pill on each card. Reduced-motion equivalent: hard cuts, no crossfade.

---

## 7. Component Map

### 7.1 Reused BrainNest components and idioms

| BrainNest asset | Reuse |
|---|---|
| `Screen` | Every player screen (fade-in wrapper) |
| `Header` | Player screens: back arrow, centered title, right slot repurposed for LanguageToggle |
| `Button` | All primary/secondary CTAs, all surfaces (50px pill, League Spartan) |
| `InputField` | Room code, name add, all host form fields |
| `Modal` (overlay pattern) | Base for ConfirmDialog and GraceCountdown sheet |
| `Background` (pattern) | Replaced by AuroraBackground, same absolute-inset slot |
| `BlockHeading` | Section headings on briefing, wall, and console cards |
| `BottomTabBar` | **Not used.** Players get no free navigation; phase drives the screen. Its fixed-footer sizing idiom (`--footer-height`) is reused for pinned action bars |
| Onboarding layout | Briefing cards, claim-name framing (logo block, centered h1, dots) |
| Sign-in layout | Join screen (centered card, logo, field, button) |
| SCSS tokens (`_variables.scss`, `_text.scss`) | Extended, not replaced (see section 9) |

### 7.2 Screens by surface

| # | Screen | Surface | Reuses | New components |
|---|---|---|---|---|
| 1 | Join | Player | Screen, Header, InputField, Button, sign-in layout | AuroraBackground, LanguageToggle |
| 2 | Claim name | Player | Screen, Button, Onboarding layout | RosterChip |
| 3 | Briefing | Player | Screen, Header, BlockHeading | FrameTag, Callout |
| 4 | Writing Mode A | Player | Screen, Header, Button | RoundTimer, TargetBanner, FrameSelector, NoteComposer, SoftValidatorHint, PriorNotesAccordion, GraceCountdown |
| 5 | Roster picker Mode B | Player | Screen, Header | RosterChip (written-to variant) |
| 6 | Composer Mode B | Player | Same as screen 4 minus RoundTimer/GraceCountdown | (shared) |
| 7 | Locked wall | Player | Screen | NoteWall (locked variant), NoteCard (silhouette) |
| 8 | Reveal | Player | Screen, Button | HoldToRevealButton, RevealSequence, NoteCard, FrameTag, OptInToggle |
| 9 | My wall + export | Player | Screen, Button, BlockHeading | NoteWall, WallExportRenderer, Toast |
| 10 | Create room | Host | Button, InputField (form idiom) | ConsoleShell, ModeCardPicker, StepperInput, Callout |
| 11 | Roster builder | Host | InputField, Button | RosterChip (editable), PasteList |
| 12 | Lobby | Host | Button | ConsoleShell, QRPanel, ClaimStatusTable |
| 13 | In-game console | Host | Button | PhaseStepper, RoundControlCard, CoverageBar, ModerationFeed, ConnectionBanner |
| 14 | Wrap-up console | Host | Button | RevealTriggerCard, RevealStatusList, HighlightToggle, PromptDeck, ConfirmDialog |
| 15 | Big screen lobby | Big screen | none (custom scale) | QRPanel (XL), JoinProgressDots, AuroraBackground |
| 16 | Big screen writing | Big screen | none | BigScreenStat, RoundTimer (XL) |
| 17 | Reveal interstitial | Big screen | none | (static composition) |
| 18 | Highlight wall | Big screen | none | HighlightWall, NoteCard (XL), FrameTag (XL) |

Counts: **Player 9 screens** (4 and 6 share the composer), **Host 5 screens plus 1 confirm dialog**, **Big screen 4 states**.

### 7.3 New components to build (canonical list)

| Component | Purpose | Key states |
|---|---|---|
| AuroraBackground | Brand gradient surface with optional sparkle drift | static, ambient, reduced-motion |
| LanguageToggle | EN / 中文 pill switch, persists per session | EN, ZH |
| RosterChip | Name pill for claim, pick, and edit contexts | default, selected, claimed/taken, written-to (+count), editable |
| FrameTag | Moment / Strength / Wish pill | 3 variants, XL variant |
| FrameSelector | Required single-choice of the three frames | unselected, selected, error-empty |
| NoteComposer | Textarea with frame stem hint, counter, send | empty, typing, validator-flagged, sending, sent, rate-capped, queued-offline |
| SoftValidatorHint | Amber inline nudge with suggestion | hidden, shown |
| PriorNotesAccordion | Target's existing notes, read-first step | collapsed (count), expanded, empty |
| TargetBanner | Assigned target identity card (Mode A) | default, new-round transition |
| RoundTimer | Countdown bar/ring, shared player and big-screen scales | running, paused, final-30s, XL |
| GraceCountdown | 10s bottom sheet on round advance | counting, send-now, discarded |
| HoldToRevealButton | Three-breath press-and-hold unlock | rest, holding (breath 1/2/3), reset, complete, accessible-timed-mode, reduced-motion |
| RevealSequence | One-by-one note pager with opt-in | note-in, opt-in row, last-note, done |
| NoteCard | The note itself | full, silhouette/locked, XL (big screen), export render |
| NoteWall | Grid of NoteCards | locked, revealed, post-kill |
| OptInToggle | "Share this one to the wall?" per-note switch | no (default), shared, committed |
| WallExportRenderer | Canvas render of the wall image plus save flow | rendering, saved, iOS long-press fallback |
| ConsoleShell | Host sidebar plus top bar layout | per-phase nav states |
| PhaseStepper | Five-phase progress control | done, current, future, advance-blocked |
| ModeCardPicker | Mode A / Mode B selection cards | unselected, selected |
| StepperInput | Numeric stepper (rounds, minutes) | default, suggested-value hint |
| PasteList | Multi-name paste textarea with parse feedback | empty, parsed (n names), duplicates-renamed notice |
| ClaimStatusTable | Lobby roster table with row actions | waiting, claimed, row-edit |
| QRPanel | QR, code, URL block | console scale, XL big-screen scale |
| RoundControlCard | Mode A round/timer/advance controls | running, paused, grace-running |
| CoverageBar | Per-person note count vs the 3-note floor | above floor, below floor (amber + icon), floor tick |
| ModerationFeed | Live note list with Kill action | streaming, kill-confirm, killed |
| RevealTriggerCard | "Open the walls" with floor gating | blocked (with named blockers), ready, triggered |
| RevealStatusList | Per-player reveal progress | holding, reading, finished |
| HighlightToggle | Big-screen highlight wall switch | off, on, disabled-no-optins |
| PromptDeck | Sharing prompts pushed to big screen | idle, active prompt |
| HighlightWall | Rotating opted-in notes display | rotating, single-note, reduced-motion cuts |
| JoinProgressDots | Big-screen claim progress | filling, complete |
| BigScreenStat | Giant ambient counter | idle, tick pulse |
| Callout | Amber/teal inline notice (tiny group, TTL, etc.) | info, warning |
| ConfirmDialog | Destructive confirm (end and delete, kill) | open, code-typed-valid |
| ConnectionBanner | Reconnecting/reconnected strip | reconnecting, restored, hidden |
| Toast | Transient confirmations | default, success |

38 new components. The heavy lifts are HoldToRevealButton, RevealSequence, WallExportRenderer, and CoverageBar; the rest are compositions of BrainNest primitives and tokens.

---

## 8. Interaction Patterns

| Pattern | Usage | Behavior |
|---|---|---|
| Navigation | Player | Phase-driven only. No tab bar, no free routing. Back arrow exists only inside a phase (e.g. composer to roster picker). |
| Navigation | Host | Sidebar sections plus forward-only PhaseStepper. |
| Forms | All | Visible labels above fields on the console; the player app's single-field screens may use the field's purpose as the screen heading. Errors inline beneath the field, icon plus text, never color alone. |
| Feedback | All | Every tap answers within 150ms (opacity/scale press state on all BrainNest buttons and chips). Submissions confirm with inline state change plus optional toast. |
| Validation | Composer | Soft: amber hint plus "Send anyway". Never blocks, never modal. |
| Destructive actions | Host | Two-step always: kill (inline confirm), end room (typed-code dialog). |
| Loading | All | Skeletons matched to layout, 300ms max before appearing. No spinners on full screens. |
| Realtime sync | All | Phase changes land within seconds; each surface transitions with the standard 400ms crossfade. Missed changes reconcile silently on reconnect. |
| Motion | All | 150 to 300ms for micro-interactions, ease-in-out, `transform`/`opacity` only. The reveal ritual is the sole sanctioned exception to the 300ms ceiling. |

---

## 9. Design Tokens

Extends BrainNest `_variables.scss`. Existing tokens keep their names; Kindsight adds:

```css
:root {
  /* existing BrainNest (kept) */
  --main-color: #1E2538;        /* navy ink: text, primary fills */
  --neon-white: #F5FAFB;        /* off-white: app background */
  --text-color: #666E84;
  --border-color: #C8CDD9;
  --white-color: #fff;

  /* Kindsight additions */
  --accent-color: #00C79F;      /* REPLACES BrainNest yellow #FCC55E: solid teal accent */
  --accent-deep: #00795F;       /* teal dark: small text, links on light (AA-safe) */
  --aurora: linear-gradient(160deg, #1E4FA3 0%, #00C79F 55%, #FFF3D6 100%);
  --aurora-cream: #FFF3D6;
  --host-surface: #E8F4FB;      /* sky blue tint: host console background */
  --warn-color: #B45309;        /* amber text on light, AA-safe */
  --warn-surface: #FEF3C7;

  /* type */
  --font-dosis: 'Dosis';               /* body, headings */
  --font-league-spartan: 'League Spartan';  /* buttons, numerals, code */
  --font-zh-fallback: 'Noto Sans SC';  /* appended to both stacks for ZH */

  /* motion */
  --breath-cycle: 3200ms;
  --note-enter: 450ms;
  --phase-crossfade: 400ms;
}
```

Gradient usage rules (contrast-driven):

1. The aurora gradient is a **glow, not a text surface**. Use it for: backgrounds behind cards, progress rings, edge glows on NoteCards, the export header band.
2. Text may sit on the gradient only on its deep-blue end, in white, and only at 24px+.
3. Never place text over the teal-to-cream midsection. Cards (off-white, navy text) always mediate.
4. Solid teal `#00C79F` fails AA against white (about 2.2:1). Use it for large graphics, fills behind navy text, and pills whose label is navy. For teal-colored small text or links use `--accent-deep` (#00795F, AA on off-white).
5. Navy `#1E2538` on off-white `#F5FAFB` is about 14:1. This is the default text pairing everywhere.

Icons: SVG only, extending the BrainNest `src/svg` set (Lucide style). Sizes: 16 / 20 / 24px tokens. No emoji anywhere in UI chrome.

### 9.1 Brand alignment addendum (added 2026-07-04, after final assets landed)

The generated brand set defines the look. UI must match the logo, not just reference its colors.

**Night ritual rule.** The logo's story is light glowing on a dark body. Screens that belong to the ritual go full-bleed night navy `#1E2538` with aurora glow accents: player Locked wall, Hold-to-unlock, and the one-by-one note reveal (DRD 3.2 states A to D), matching the big screen interstitial. Text on these screens is off-white; NoteCards stay off-white with navy text and an aurora edge glow, so each note reads as a lit card in a dark room. The full-wall/export screen (state E) returns to off-white: the ritual ends, daylight returns. All other screens (join, briefing, writing, host console) stay light per the base spec.

**Soft-3D (clay) treatment, exact CSS rules:**
- Radii: cards 20px, buttons and inputs 16px, pills 999px. No corner sharper than 12px anywhere.
- Elevation is soft and navy-tinted, never grey: `box-shadow: 0 6px 24px rgba(30,37,56,0.10), 0 2px 6px rgba(30,37,56,0.06)`.
- Glow is an outer shadow in accent color, reserved for aurora elements: `box-shadow: 0 0 24px rgba(0,199,159,0.35)` (teal) or `0 0 32px rgba(255,243,214,0.45)` (cream, on navy surfaces only).
- Primary buttons: navy fill, off-white label, soft inner highlight `inset 0 1px 0 rgba(255,255,255,0.08)`. On night screens the primary action carries the teal glow.
- No hard borders on interactive elements; use fills and shadows. `--border-color` is for table rules and dividers only.

**Asset placement map (files in `Kindsight/assets/`, all processed and final):**

| Asset | Screens |
|---|---|
| `logo/kindsight-logo-transparent.png` | Join screen header, export image header band, host console login/create screen |
| `logo/kindsight-mascot-only.png` | Night ritual screens (locked wall header), "You're in" card, room-ended card, big screen reveal interstitial |
| `logo/kindsight-icon-square.png` | PWA manifest icons, favicon derivation (192/512px resizes) |
| `logo/kindsight-icon-rounded.png` | In-app about/settings, README, marketing |
| `illustrations/onboarding-write-transparent.png` | Briefing carousel slide 1 (how to write) |
| `illustrations/onboarding-rotate-transparent.png` | Briefing carousel slide 2 (how turns work; Mode A rooms) |
| `illustrations/onboarding-reveal-transparent.png` | Briefing carousel slide 3 (what happens at the end); also usable on night screens |
| `illustrations/empty-lobby-soft.png` | Host lobby before anyone claims; player "waiting for host" card |
| `illustrations/empty-notes-soft.png` | Composer empty state when a target has no notes yet ("be the first to write") |

The `-soft` empty states are edge-faded for light surfaces only; never place them on navy. Illustrations render at max 60% viewport width on mobile, capped 320px, always above the text they support.

---

## 10. Bilingual Design (EN default, ZH toggle)

- **Placement.** Player: in the Header right slot on every screen, an "EN | 中文" pill (44px touch height). Host: bottom of the sidebar. Big screen: follows the host console's setting; no toggle of its own.
- **Scope.** Full depth per PRD Resolved Question 5: UI chrome, the three frames and their stems, validator nudges, briefing, sharing prompts, export footer text. The toggle switches everything instantly, mid-phase included. Player-written note content is never translated.
- **Frame stems in ZH:** Moment "我注意到你...", Strength "我觉得你很擅长...", Wish "我希望你...". The composer's prefilled stem follows the current language; the note is saved with whatever the player wrote.
- **Text expansion.** English runs 20 to 40 percent longer than Chinese for the same string. Design all buttons, pills, and table headers to the English length; ZH will fit. The exceptions run the other way: single ZH characters render wider than single Latin glyphs, so chips and tags need `min-width` from padding, not fixed widths, and no fixed-width truncation on frame tags.
- **Font fallback.** Dosis and League Spartan carry no CJK glyphs. Append `'Noto Sans SC', sans-serif` to both font stacks so ZH renders intentionally rather than in the browser default. Verify the 160px big-screen room code and 112px counters render digits in League Spartan in both languages (digits stay Latin, so this holds).
- Language choice persists in the session token and survives refresh.

---

## 11. Accessibility Requirements

Priority 1, non-negotiable. WCAG 2.1 AA minimum.

- [ ] **Contrast:** all text pairs at 4.5:1 or better. Navy on off-white (about 14:1) is the default. Teal is never used for small text; `--accent-deep` substitutes. Gradient text rules per section 9. Amber warnings use `--warn-color` text, not raw amber.
- [ ] **Touch targets:** 44x44pt minimum everywhere; RosterChips 48px; HoldToRevealButton 120px; element gaps 8px or more.
- [ ] **Hold-to-unlock alternative:** the timed single-activation mode (section 3.4) ships with the button, exposed both to assistive tech and as a visible text link. Press-and-hold is never the only path to the reveal.
- [ ] **Reduced motion:** `prefers-reduced-motion` variants specified for the breath animation, note entrances, locked-wall shimmer, big-screen crossfades, and stat pulses (sections 3.3, 6). Timing is preserved; motion is stripped.
- [ ] **Screen reader flow:** reveal announcement order per section 3.4. Phase changes announce via `aria-live="polite"` on all surfaces ("Writing has started, round 1 of 4"). GraceCountdown announces at 10, 5, and submit/discard. Focus order matches visual order; focus moves to the new note card on advance.
- [ ] **Focus indicators:** 3px `--accent-deep` focus ring on all interactive elements, visible on both off-white and navy surfaces (white ring on navy).
- [ ] **Keyboard:** the host console is fully keyboard-operable, including Kill (row focus plus Enter, confirm inline) and the PhaseStepper advance.
- [ ] **Forms:** visible labels, errors as icon plus text adjacent to the field, no placeholder-only labels.
- [ ] **Timers:** the round timer pairs the countdown with a text phrase ("about 2 minutes left" announced at intervals), not color alone for urgency.
- [ ] **Alt text:** mascot and logo images carry alt text; decorative silhouettes and sparkles are `aria-hidden`.
- [ ] **Localization a11y:** `lang` attribute switches with the toggle so screen readers pick the right voice.

Pre-delivery checklist (designer skill, 7 items): all pass in this spec. Pressed feedback on all tappables (section 8), contrast verified (section 9), targets 44pt+ (above), safe areas via the BrainNest screen frame and pinned action bars respecting the gesture inset, reduced motion covered, focus order specified, zero emoji icons (SVG set specified).

---

## 12. Responsive Breakpoints

| Breakpoint | Width | Surface | Layout changes |
|---|---|---|---|
| Mobile | <400px | Player | Single-column NoteWall, FrameSelector wraps to 2+1 |
| Mobile L / small tablet | 400 to 650px | Player | Two-column NoteWall; BrainNest `--screen-width: 650px` cap centers the app beyond this |
| Tablet | 768 to 1024px | Host | Console degrades to stacked cards, sidebar collapses to top bar. Functional, not primary |
| Desktop | >1024px | Host | Full sidebar plus two-panel in-game layout |
| Projector | 1920x1080 baseline | Big screen | Fixed composition, scales proportionally via viewport units; verify at 1280x720 minimum |

No horizontal scroll on any surface at any width. 4/8pt spacing grid throughout, matching BrainNest's existing rhythm.

---

## 13. Design Questions (resolved by product owner, 2026-07-04)

- [x] **Q1. Breath pacing:** build the reveal prototype with breath duration configurable; evaluate 3.2s vs 4.5s by feel on real phones during the first spike. 3.2s is the starting default.
- [x] **Q2. Opt-in editability:** share toggles stay editable from the full-wall screen until Wrap-up ends. Consent is revocable while the room lives.
- [x] **Q3. Big-screen name ticker in Lobby:** keep the ticker. Lobby-only, proven energy-builder.
- [x] **Q4. Export image format:** one single tall image. Phones handle tall images fine; no grid mode in v1.
- [x] **Q5. Mode A notes per round:** after submitting the assigned note, the player may write one optional free-select "bonus note" while waiting for the round to advance. Bonus notes are labeled as such internally and count toward walls but not toward the rotation guarantee.
- [x] **Q6. Host rehearsal mode:** IN for v1. The console offers a "preview the ritual" demo with fake notes so hosts can rehearse the reveal before a real session. Demo data never touches a live room.
- [x] **Q7. Sound:** in, one very subtle chime at unlock completion, with a mute toggle. Silent-mode devices stay silent.
- [x] **Q8. Big-screen highlight wall density:** one rotating note at a time, as specced.

---

## 14. Handover Notes for Engineering

- Build order follows PRD Risk 3: **HoldToRevealButton and RevealSequence first**, as a standalone prototype on real phones, before any other screen.
- WallExportRenderer is the second spike (iOS Safari canvas). The long-press fallback is part of the v1 spec, not a nice-to-have.
- The BrainNest `--accent-color` override (yellow to teal) restyles every reused Button and accent instantly; audit reused screens for places the yellow was load-bearing against navy (teal on navy is fine for fills, roughly 5.5:1 for large elements, but verify any small accent text).
- RLS remains the reveal lock; the locked-wall silhouettes must be driven by a count-only query that is legal pre-reveal. The design never needs pre-reveal content on the player surface.
