# Quick PRD: Kindsight

**Tier:** QUICK | **Owner:** Product | **Status:** Approved 2026-07-04, open questions resolved, in design (DRD) | **Date:** 2026-07-04

Kindsight is a digital adaptation of the physical icebreaker "你背后的光" (The Light Behind You). Players anonymously write kind, specific observations about each other, then each player reveals their own "wall" of notes in a deliberate, ritual moment. Built for teams, workshops, and conference groups on phones, with a host console and a big-screen view.

## Problem

Facilitators run the paper version of the game because the reveal moment is powerful: a wall of anonymous kindness, read in silence. The paper medium undermines it in five ways.

1. Handwriting is identifiable, so anonymity is weak and people self-censor.
2. Coverage is uneven. Popular or central people collect full pages while quiet participants get two or three notes, which inverts the point of the exercise.
3. There is no keepsake. The A4 sheet creases, fades, or gets lost.
4. Ink bleeds through the paper and markers show through shirts.
5. The host must roam the room to police quality and nudge writers, so the host cannot hold the room.

The digital version must fix these frictions while preserving what makes the game work: the ritual pause before reading, the warmth of specific observations, and anonymity that people trust.

**Problem statement:** A facilitator running a connection exercise for a group struggles with the paper format because handwriting breaks anonymity, coverage is uneven, and quality policing pulls the host away from the room, so the emotional payoff of the reveal is diluted and nothing survives the session.

## Solution

A host-controlled, five-phase group game across three surfaces: a mobile-first player web app (PWA), a desktop-first host console, and a projector big screen. No accounts. Rooms are ephemeral. The keepsake is an exported image of your own wall.

### Game flow (host-controlled phases)
1. **Setup/Lobby:** host creates the room and roster; players join via QR or room code and claim their name.
2. **Briefing:** rules and the three writing frames appear on player screens and the big screen.
3. **Writing:** players write anonymous kind notes for 10 to 15 minutes, in one of two modes.
4. **Reveal:** host triggers it. Each player unlocks their own wall after a ritual pause: hold a button through a three-deep-breaths animation, then notes appear one by one.
5. **Sharing/Wrap-up:** optional voluntary sharing prompts on the big screen, then the host closing message.

### Three writing frames (forced choice of one per note)
- **Moment:** "I noticed you..." (a specific observed moment)
- **Strength:** "I think you're strong at..."
- **Wish:** "I hope you..."

A soft validator nudges vague content ("nice person", "good luck") toward specific observations. Notes are anonymous to humans forever. The system stores author_id internally for moderation and rate limiting only.

### Two writing modes (host picks at room creation)
- **Mode A, Round-robin:** the app generates a randomized rotation schedule (a derangement per round: never yourself, never a repeated target). Each round assigns every player a target. Host advances rounds by timer or manually. Guarantees even coverage. Recommended for groups of 6 or more.
- **Mode B, Free select:** players pick anyone from the roster. Already-written-to names are marked. The host console shows a live coverage bar per person so the host can nudge under-written players.

Shared in both modes: before writing, the writer sees the target's existing notes to avoid duplicates and escalate specificity.

## Personas

| Persona | Role | Needs |
|---|---|---|
| **Host/Facilitator** (primary) | Creates and runs the game from a laptop | Full control of pacing, visibility into coverage and quality, zero mid-game tech firefighting |
| **Player** (primary) | Joins on their own phone | Frictionless join, confidence their notes are anonymous, a reveal that feels earned, a keepsake |
| **Event organizer** (secondary) | Projects the big screen at a workshop or conference | A display that builds ambient energy without ever leaking note content |

## Success Metric

**North Star for v1:** a full 10-person game completes end to end on real phones via a public URL with no facilitator tech intervention, and the reveal moment lands (qualitative: silence, visible emotion, players exporting their walls).

Supporting signals:
- 100% of players receive at least the minimum expected note count for the chosen mode.
- Zero notes visible to their subject before the reveal phase (verified by RLS, see Constraints).
- At least half of players export their wall image.

## User Stories and Acceptance Criteria

### Epic 1: Room setup and lobby (Host console)

**H1. Create a room**
As a host, I create a room and pick the writing mode so the game fits my group.
- Given the host console, when I create a room, I choose Mode A (round-robin) or Mode B (free select), and the app suggests a round count from group size and lets me set a per-round timer.
- A room code and QR are generated on creation.
- For groups under 6, the console recommends free select or extra shuffling because rotation anonymity weakens.

**H2. Build the roster**
As a host, I build the roster fast so setup takes minutes.
- I can type names one by one or paste a list with one name per line.
- Duplicate names are detected and auto-suffixed (e.g. "Alex (2)").
- I can edit or remove names before the game starts.

**H3. Run the lobby**
As a host, I watch players claim names so I know when everyone is in.
- The lobby shows the QR, the room code, and a live claim status per roster name.
- I can reassign a claimed name or rename a participant.
- I advance to Briefing only by explicit action.

### Epic 2: Join and briefing (Player)

**P1. Join and claim a name**
As a player, I join in seconds without creating an account.
- Scanning the QR or entering the room code opens the player app.
- I claim my name from the roster. A claimed name is locked to my session token.
- My session survives a page refresh: reopening the URL restores my identity and place in the game.

**P2. Understand the rules**
As a player, I see the briefing so I know how to write a good note.
- The briefing shows the rules and introduces the three frames with examples.
- I can toggle the whole UI, including the frames, between English (default) and Chinese at any time.

### Epic 3: Writing (Player)

**P3. Write a framed note**
As a player, I write a kind, specific note using one frame.
- Every note requires choosing exactly one frame: Moment, Strength, or Wish.
- A soft validator flags vague content and suggests being specific. It nudges, it does not block.
- Before writing, I see the target's existing notes so I avoid duplicates and add something new.
- My note is anonymous to all humans. The system stores author_id internally for moderation and rate limiting only.
- Rate limiting caps note volume per author to prevent spam.

**P4. Round-robin writing (Mode A)**
As a player in Mode A, I am told who to write to each round.
- Each round I get one assigned target. I am never assigned myself and never a repeated target.
- When the host advances the round, my screen moves to the next assignment.
- If I have not submitted when the round advances, my draft is handled predictably (see Open Questions).

**P5. Free-select writing (Mode B)**
As a player in Mode B, I pick who to write to.
- I see the full roster with names I have already written to marked.
- I can write to anyone except myself.

### Epic 4: In-game control (Host console)

**H4. Drive the phases**
As a host, I step the game through its five phases from one screen.
- A phase stepper moves Lobby, Briefing, Writing, Reveal, Wrap-up in order. All player and big-screen surfaces follow within seconds.
- In Mode A, I advance rounds manually or let the per-round timer do it. The timer is visible to me and to players.

**H5. Monitor coverage**
As a host, I see who is under-written so nobody reveals a thin wall.
- In Mode B, a live coverage bar per person shows note counts.
- In Mode A, I see round progress and any players falling behind.
- I never see note content attributed to an author.

**H6. Moderate with the kill switch**
As a host, I remove a harmful note before it wounds someone at reveal.
- I can view submitted notes (content plus target, never author identity) and kill any note.
- A killed note never appears on the target's wall or the big screen.
- Kill is available in every phase, including after reveal.

### Epic 5: Reveal and keepsake (Player)

**P6. Ritual reveal**
As a player, I unlock my wall through a deliberate pause so the moment lands.
- My wall stays locked until the host triggers the Reveal phase. Before that, no client or API path returns notes about me (enforced by row-level security keyed on room phase).
- To unlock, I hold a button through a three-deep-breaths animation. Releasing early resets the hold.
- Notes then appear one by one, not as a dump.

**P7. Export my wall**
As a player, I keep my wall after the room is gone.
- One tap exports my full wall as a shareable image rendered in the Kindsight visual style.
- The export works on iOS Safari and Android Chrome.
- The room and its data are ephemeral. The image is the keepsake, and players are told this.

### Epic 6: Big screen (Event organizer)

**B1. Lobby display**
As an organizer, I project the join screen so the room fills itself.
- The big screen shows the QR, the room code, and join progress during the lobby.

**B2. Ambient writing display**
As an organizer, I project energy without leaking content.
- During Writing, the big screen shows the phase, the timer, and ambient activity such as total note counts. It never shows note content or who wrote to whom.

**B3. Opt-in highlight wall**
As an organizer, I can show anonymized highlights after the reveal.
- After Reveal, the host can enable a highlight wall showing notes whose recipients explicitly opted in.
- Highlights are anonymized: no author, recipient shown only with opt-in consent.

### Epic 7: Resilience (all surfaces, requirements for engineering review)

**R1. Late joiner:** a player who joins mid-game claims a remaining roster name and, in Mode A, the rotation self-repairs to include them in subsequent rounds without breaking the derangement guarantee.
**R2. Refresh recovery:** any surface (player, host, big screen) recovers full state on page refresh via the session token.
**R3. Dropped connections:** the app reconnects to realtime automatically and reconciles missed phase or round changes.
**R4. Tiny groups:** below 6 players the app warns the host that rotation anonymity weakens and recommends free select or extra shuffling.
**R5. Host disconnect:** the game state persists server-side; the host reclaims the console on reconnect and the room does not die with the host's laptop.

## P0 Features (RICE, simplified)

Reach is players per typical session cohort per quarter (assumed 500). Effort in person-weeks.

| Feature | Reach | Impact | Confidence | Effort | Score | Priority |
|---|---|---|---|---|---|---|
| Join flow + roster claim (P1, H2, H3) | 500 | 3 | 100% | 2 | 750 | P0 |
| Writing with frames + validator (P3) | 500 | 3 | 80% | 2 | 600 | P0 |
| Phase engine + host stepper (H1, H4) | 500 | 3 | 80% | 3 | 400 | P0 |
| Ritual reveal + RLS lock (P6) | 500 | 3 | 80% | 3 | 400 | P0 |
| Mode A rotation engine (P4) | 500 | 2 | 80% | 2 | 400 | P0 |
| Wall image export (P7) | 500 | 2 | 80% | 2 | 400 | P0 |
| Mode B + coverage view (P5, H5) | 500 | 2 | 80% | 2 | 400 | P0 |
| Note kill switch (H6) | 500 | 2 | 100% | 1 | 1000* | P0 |
| Big screen lobby + ambient (B1, B2) | 500 | 1 | 80% | 1 | 400 | P0 |
| Resilience set (R1 to R5) | 500 | 2 | 50% | 3 | 167 | P0** |
| Bilingual EN/ZH toggle (P2) | 250 | 1 | 80% | 1 | 200 | P1 |
| Opt-in highlight wall (B3) | 250 | 1 | 50% | 1 | 125 | P1 |
| Host rehearsal mode: "preview the ritual" demo with fake notes (added 2026-07-04) | 250 | 1 | 80% | 1 | 200 | P1 |
| Background music, big screen only: per-phase tracks, host mood picker, volume/mute/skip, hard stop at Reveal (added 2026-07-04) | 250 | 1 | 80% | 1 | 200 | P1 |

\* High score from tiny effort; it is also a launch-blocking safety requirement regardless of score.
\** Promoted to P0 despite score: the success criterion "no facilitator tech intervention" fails without it.

## Constraints

- **Stack (locked):** Next.js 15 static export (output: 'export') on GitHub Pages, PWA enabled. Supabase free tier for database and realtime with tables rooms, participants, notes. Row-level security enforces that nobody reads notes about themselves until room phase = reveal. All game logic must live client-side or in Supabase (RLS, policies), since GitHub Pages serves static files only.
- **No accounts:** roster claim plus Supabase anonymous auth session token bound to participant ID, surviving refresh.
- **UI (locked):** components and layout reuse the purchased BrainNest Next.js mobile kit. Host console design references the BrainNest Laravel/Orchid admin template as visual reference only, no PHP.
- **Design tokens (locked, revised 2026-07-04 to match the generated logo):** navy ink #1E2538, off-white #F5FAFB. Lead accent is the aurora glow gradient from the mascot's back: deep blue through teal #00C79F to warm cream. Teal #00C79F is the promoted solid accent (matches the wordmark's "i" dot). Sky blue secondary for host surfaces. Fonts: Dosis and League Spartan. Brand assets live in `assets/logo/` (transparent logo, mascot-only crop).
- **Bilingual:** English default, Chinese toggle covering UI and the three writing frames.
- **Ephemeral rooms:** data lives for the session. This simplifies the privacy and PDPA posture: minimal retention, no profiles, anonymous notes.

## Out of Scope for v1

- Native iOS/Android apps
- Accounts and sign-in
- Multi-room organizations or recurring team spaces
- Analytics dashboards
- AI content moderation (v1 relies on the soft validator plus the host kill switch)
- Payments

## Risks

1. **Supabase free tier under a 100-plus person conference room.** Realtime connection limits and rate limits could throttle a large session. Mitigate: load-test at target group sizes before first public run; document a max supported room size.
2. **RLS as the only reveal lock.** A policy bug leaks notes early and breaks trust permanently. Mitigate: dedicated tests that attempt self-reads in every phase; engineering review treats the phase-gated policy as the highest-risk component.
3. **The ritual falls flat on a phone.** The paper version's silence and physicality may not translate. The hold-to-breathe reveal is the bet. Mitigate: prototype the reveal interaction first and test it with a real group before building everything around it.
4. **Rotation self-repair complexity (late joiners, Mode A).** Maintaining the derangement guarantee mid-game is the hardest algorithmic piece. Mitigate: engineering review details it; fall back to "late joiners enter next round" if needed.
5. **Static export limits.** No server means secrets, scheduled cleanup of ephemeral rooms, and abuse controls all have to fit Supabase primitives. Mitigate: confirm feasibility in engineering review before build.

## Resolved Questions (product owner sign-off 2026-07-04)

1. **Room data deletion:** both. Host gets an explicit "end and delete room" action, plus a 24-hour TTL sweep implemented as a Supabase scheduled function (GitHub Pages cannot run crons).
2. **Unsubmitted drafts at round advance (Mode A):** 10-second grace countdown when the round advances, then auto-submit if the note passes validation, otherwise discard. Drafts never carry over; carrying over breaks the derangement schedule.
3. **Minimum notes to reveal:** hard floor of 3. Mode A guarantees this by design. In Mode B, the host cannot trigger Reveal until every player has at least 3 notes, and the console shows exactly who is under the floor.
4. **Kill switch after reveal:** killed notes disappear from the wall and from future exports. Already-saved images cannot be recalled; the host guide states this.
5. **Chinese language depth:** full depth. UI, frames, validator nudges, and sharing prompts all localize. Half-translated feels broken and the string count is small.
6. **Export rendering:** accepted as the first build spike (iOS Safari canvas-to-image). Fallback is a long-press-to-save rendered view.
7. **Highlight wall opt-in:** per note, asked inline at reveal while the player reads each note ("share this one to the wall?"). Whole-wall opt-in overshares.

Build-order note from Risk 3: prototype the reveal ritual first; it is the make-or-break interaction.

## Handover

Next step: engineering review (`/plan-eng-review`) to detail the resilience requirements (R1 to R5), the RLS policy design, and the rotation self-repair algorithm, then `/scrum` for sprint planning.
