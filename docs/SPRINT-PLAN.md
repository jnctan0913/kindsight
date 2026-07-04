# Sprint Plan: Kindsight

**Status:** Active | **Date:** 2026-07-04
**Sources:** docs/ENG-PLAN.md (milestones M0 to M8, authoritative build order), docs/PRD.md (epics 1 to 7, RICE), docs/DRD.md (section 7 component map)
**Mode:** non-interactive scrum planning. Judgment calls are listed in section 8.

---

## 1. Sprint goal: what "done" means

The North Star is ENG-PLAN milestone M8:

> A full 10-person game on real phones via the public URL, zero facilitator tech intervention, at least half the players export; retro notes filed.

Everything in this plan exists to make that sentence true. A story is worth doing only if its absence would make the rehearsal fail or make a facilitator touch a keyboard mid-game. The sprint is done when M8's exit criterion passes and the retro is filed.

Working agreements that follow from the goal:

- **Deployed is the only real.** GitHub Pages deploys on every push to main. A frontend story that builds locally but is not live on the Pages URL is not done.
- **Postgres is the only truth.** Every game-state guarantee is asserted against the database (pgTAP, vitest role matrix, the M4 simulation), never against the client.
- **One story = one dispatchable agent task** with a single verifiable output and an exclusive file territory. No story is sized larger than one agent session can complete with margin (see risks, section 7).

### Already done (not re-planned)

| Item | State |
|---|---|
| M0 reveal ritual prototype | Built and deployed with 2026-07-04 revisions (light surfaces, all-notes wall with share icon toggles, priming lines). Real-phone verification pending (story V0). |
| M1 export spike | Built and deployed (`spikes/export`). Real-phone checklist pending (story V0). |
| M2 partial | 3 migrations exist (`supabase/migrations/`: schema, default_deny, triggers). RPC layer, tests, and remote push in flight (story S2.1 lane). |
| Player pre-game screens | Join, claim, briefing with mock data, plus `src/i18n/` module and LanguageToggle, in flight (story S3.2 wires them to real data). |
| Infra | Pages deploy on push, Supabase project `mvuziqekvurgqngqweyf`, repo variables set. |
| Docs | COPY.md (bilingual strings), HOST-GUIDE.md. |

---

## 2. Team capacity and lanes

Agent lanes, each owning a file territory so parallel agents never collide:

| Lane | Territory (exclusive while a story in the lane is open) |
|---|---|
| Backend | `supabase/*` (migrations, seed, config), `tests/db/*` |
| API bridge | `src/lib/*` (supabase client, api.ts, realtime.ts, rotation.ts), `src/stores/*` |
| Player surface | `src/app/r/*` |
| Host surface | `src/app/host/*` |
| Screen surface | `src/app/screen/*`, `assets/music/*` |
| Shared UI | `src/components/*`, `src/scss/*` |
| i18n | `src/i18n/*` |
| CI/infra | `.github/workflows/*`, `next.config.ts`, `public/*` |
| Sim/QA | `tests/sim/*`, `tests/load/*` |

Cross-territory rules:

1. **`src/i18n/strings.ts` has one owner at a time.** Any story needing new strings either lands in a wave where it owns the i18n territory, or defines its strings in a story-local file (`strings.ts` inside its own folder, matching the `reveal-demo` pattern) and story S7.1 consolidates. Default: story-local strings, consolidated in M7.
2. **`src/app/layout.tsx`, `src/routes/index.tsx`, `src/scss/_variables.scss`, `src/stores/index.tsx` are shared chokepoints.** Only the story explicitly named as owner in its wave may edit them. Everyone else adds files, never edits these.
3. **`src/components/index.tsx` barrel:** new components export from their own file; the barrel is touched only by the Shared UI lane owner in that wave.
4. Within `src/app/r/*`, the phase-router shell (`src/app/r/page.tsx` and its phase switch) is owned by S3.1. Later stories own only their phase-slot component files under `src/app/r/` subfolders (`join/`, `write/`, `reveal/`, `wall/`).

---

## 3. Epics

| Epic ID | Epic name | Maps to | Priority |
|---|---|---|---|
| E-M2 | Supabase foundation complete | ENG-PLAN M2, PRD Epic 7 (R-set), PRD Risk 2 | P0, blocks everything server-backed |
| E-M3 | Vertical slice, Mode B | ENG-PLAN M3, PRD P1, P2, P3, P5, P6, P7, H1 to H4, H6 | P0 |
| E-M4 | Mode A rotation | ENG-PLAN M4, PRD P4, R1, R4 | P0 |
| E-M5 | Host console complete | ENG-PLAN M5, PRD H5, H6, R5, rehearsal mode (P1 RICE row) | P0 |
| E-M6 | Big screen and music | ENG-PLAN M6 + music addendum, PRD B1, B2, B3, music (P1 RICE row) | P0 screen, P1 music |
| E-M7 | Polish, i18n, PWA, load | ENG-PLAN M7, PRD P2, R3, F4, F5, F6 | P0 |
| E-M8 | Dress rehearsal | ENG-PLAN M8, PRD Success Metric | P0, the goal itself |

---

## 4. Stories

Estimation: one unit = one dispatchable agent task. T-shirt size inside a unit signals context budget and review depth (S = small margin needed, L = the agent will use most of a session; anything that smells XL has been split). Every story's acceptance criteria are the relevant clauses of its milestone's ENG-PLAN exit criterion, quoted or restated, plus PRD story references. Each milestone ends in a verification story that asserts the full exit criterion end to end.

### V0. Real-phone verification of M0 and M1 (human, runs immediately)

As the facilitator, I verify the ritual and the export on real phones so the two highest product risks (PRD Risk 3, F7) are answered before more UI stacks on top.

- **AC (ENG-PLAN M0 exit):** on 2 real iOS Safari and 2 Android Chrome phones via the public Pages URL: hold-through-3-breaths completes, early release resets, timed a11y mode reachable by keyboard and VoiceOver, reduced-motion variant verified. Felt-test with 3+ people at 3.2s vs 4.5s recorded as a decision (D20).
- **AC (ENG-PLAN M1 exit):** wall image lands in the iOS camera roll (share path) and Android gallery on the same phones; ZH note renders without tofu; long-press fallback shown and works when share is cancelled; canvas-cap rule tested with a 25-note wall.
- **Territory:** none (no code). Output: checklist results filed in this doc's section 9 or a retro note.
- **Size:** S (human time, not agent time). **Blocked by:** nothing. **Blocks:** nothing structurally, but a failed felt-test reopens M0 before M3 wiring.

### Epic E-M2: Supabase foundation complete

**S2.1 RPC layer migrations** (in flight, complete it)
As the system, I expose all client access as security-definer functions so no table grant ever leaks `author_id` (ENG-PLAN section 2, D2).
- AC: every function in ENG-PLAN section 2 exists as a migration: `create_room`, `join_room`, `claim_participant`, `player_state`, `host_state`, `screen_state`, `submit_note`, `my_wall`, `my_wall_count`, `my_sent_notes`, `target_notes_for_writer`, `moderation_feed`, `kill_note`, `set_note_share`, `highlight_notes`, `advance_phase`, `advance_round`, `finalize_round`, `pause_timer`, `resume_timer`, `add_round`, `set_highlight`, `save_assignments`, `my_assignment`, `set_reveal_state`, `reclaim_host`, `end_room`, `sweep` via pg_cron schedule, plus the `realtime.messages` policy and `rooms_attempts` capping.
- AC: no exposed function returns `author_id`, `host_id`, `host_secret_hash`, or `claimed_by` (invariants 2 and 8). `search_path` pinned, execute granted to `authenticated` only.
- AC: `supabase start` applies all migrations clean from empty.
- PRD refs: P3 (anonymity, rate limit), P6 (phase lock), H6 (kill), R5 (reclaim).
- Territory: `supabase/migrations/*`. Size: L. Lane: Backend.

**S2.2 pgTAP suite**
As the team, I unit-test triggers and functions in the database so no single RPC bug can violate a row-shaped rule (ENG-PLAN section 2 test matrix, trigger backstops).
- AC: pgTAP covers: forward-only phase trigger including the Mode B 3-note floor block and Mode A non-block (D8), assignment permutation validation (no self, no repeat, past-round rejection), note caps and 3s spacing, claim atomicity, `finalize_round` idempotency, code format check, cascade deletes.
- AC: green under `supabase test db` against a fresh `supabase start`.
- Territory: `supabase/tests/*`. Size: M. Lane: Backend. Blocked by: S2.1 (function signatures).

**S2.3 Role-matrix integration suite in CI**
As the team, I run the full section 2 access matrix as vitest against a local Supabase stack so the reveal lock is proven, not hoped (PRD Risk 2, launch blocker).
- AC (ENG-PLAN M2 exit, verbatim): "Full section 2 test matrix green in CI, including the direct-PostgREST adversarial reads and the pre-reveal self-read attempts in every phase."
- AC: one supabase-js client per role (Stranger, Joiner, Player, Host, Screen); every D cell asserts a raised exception; the adversarial test calls `/rest/v1/notes?select=*` with a player JWT and expects a permissions error.
- AC: GitHub Actions workflow runs `supabase start` + pgTAP + vitest matrix on every push.
- Territory: `tests/db/*`, `.github/workflows/ci.yml`. Size: L. Lane: Sim/QA + CI. Blocked by: S2.1, S2.2.

**S2.4 Remote push, project setup, keepalive**
As the facilitator, I have the live Supabase project configured and unpauseable so a workshop never starts against a dead project (F4, F5).
- AC: all migrations pushed to project `mvuziqekvurgqngqweyf`; anonymous sign-ins enabled, other providers off; `pg_cron` and `pgcrypto` enabled; anonymous per-IP rate limit raised (interim 300/hr, M7 load test sets the final number, D17).
- AC: `.github/workflows/keepalive.yml` on cron calls a trivial definer RPC twice weekly with the anon key.
- AC: vitest matrix runs green once against the live project.
- Territory: `supabase/*` (config), `.github/workflows/keepalive.yml`, README setup section. Size: M. Lane: Backend + CI. Blocked by: S2.1. **Watch:** requires the Supabase DB password or access token for `supabase link` / `db push`; see risk RK-3.

**S2.5 Generated types and api.ts wrapper**
As every frontend lane, I call typed RPC wrappers so client and SQL cannot drift silently (ENG-PLAN section 6).
- AC: `supabase gen types typescript` output committed; `src/lib/supabase.ts` (single client, env-driven, anon auth bootstrap: `getSession()` else `signInAnonymously()`); `src/lib/api.ts` wrapping every RPC with generated types; `npm run build` green.
- Territory: `src/lib/*`. Size: M. Lane: API bridge. Blocked by: S2.1.

### Epic E-M3: Vertical slice, Mode B

**S3.1 Realtime module, stores, and phase-router shell**
As every surface, I converge on server state through one snapshot-plus-ping mechanism so reconnect equals initial load (ENG-PLAN sections 4 and 6, PRD R2, R3).
- AC: `src/lib/realtime.ts` implements subscribe to `room:{uuid}`, seq-gap snapshot refetch, exponential backoff, 60s visible-tab poll, server clock skew capture (D22). Inline ASCII ping-and-pull diagram per ENG-PLAN section 6.
- AC: `useSessionStore` (persisted), `useGameStore`, `useHostStore`, `useConnectionStore` with one `applySnapshot` per role, matching the ENG-PLAN store shapes.
- AC: `src/app/r/page.tsx` phase-router shell renders the correct phase slot from the snapshot alone (a surface joining at wrap-up renders wrap-up directly); ConnectionBanner component wired.
- Territory: `src/lib/realtime.ts`, `src/stores/*`, `src/app/r/page.tsx` shell, `src/components/ConnectionBanner.tsx`. **Owns `src/routes/index.tsx` and `src/stores/index.tsx` this wave.** Size: L. Lane: API bridge. Blocked by: S2.5.

**S3.2 Wire pre-game screens to real data**
As a player, I join, claim, and read the briefing against the live room (PRD P1, P2).
- AC: landing page code entry and `?code=` prefill route into `/r/`; `join_room` populates roster; `claim_participant` handles the claim-race loser with the typed error and refetch; refresh restores identity, phase, and language behind the 300ms skeleton (M3 exit clause: "refresh on every surface restores state").
- AC: mock-data module (`src/mock/room.ts`) no longer imported by pre-game screens.
- Territory: `src/app/r/join/*`, `src/app/page.tsx`. Size: M. Lane: Player surface. Blocked by: S3.1, and the in-flight pre-game build landing.

**S3.3 Composer, Mode B**
As a player, I write a framed, validated note to anyone but myself (PRD P3, P5; DRD screens 4 to 6 minus Mode A parts).
- AC: FrameSelector (required single choice), NoteComposer (counter, send, rate-capped and queued-offline states), SoftValidatorHint (nudges, never blocks, client-only per D14), PriorNotesAccordion fed by `target_notes_for_writer` (read-first step), Mode B roster picker with written-to marks fed by `my_sent_notes`.
- AC: `submit_note` errors (cap, spacing, duplicate) surface as typed UI states, not raw exceptions.
- Territory: `src/app/r/write/*`, plus new shared components `FrameSelector`, `NoteComposer`, `SoftValidatorHint`, `PriorNotesAccordion`, `FrameTag`, `RosterChip` in `src/components/` (owns the barrel this wave). Size: L. Lane: Player surface + Shared UI. Blocked by: S3.1.

**S3.4 Locked wall, ritual on real data, export**
As a player, I watch silhouettes accumulate, unlock through the ritual, and keep the image (PRD P6, P7).
- AC: locked wall renders `my_wall_count` silhouettes ticking up on `notes` pings; `my_wall` is called only in reveal or wrap-up phases.
- AC: HoldToRevealButton and RevealSequence lift from `src/app/reveal-demo/` into `src/components/` unchanged in behavior (M0 revisions preserved: light surfaces, all-notes wall, share icon toggles, priming lines); per-note OptInToggle commits via `set_note_share`.
- AC: WallExportRenderer lifts from `spikes/export` and renders real wall data; blob pre-rendered on wall load so the share call is synchronous in the tap handler (F7); three-tier save path intact.
- AC (M3 exit clause): "a kill before reveal never reaches the wall."
- Territory: `src/app/r/reveal/*`, `src/app/r/wall/*`, moves into `src/components/HoldToRevealButton.tsx`, `RevealSequence.tsx`, `NoteCard.tsx`, `NoteWall.tsx`, `WallExportRenderer.ts`. Size: L. Lane: Player surface. Blocked by: S3.1. Parallel-safe with S3.3 (disjoint subfolders; S3.3 owns the component barrel, S3.4 appends export lines through it at wave end or uses direct imports).

**S3.5 Host console v1**
As a host, I create the room, build the roster, run the lobby, drive phases, and kill notes (PRD H1, H2, H3, H4, H6; DRD screens 10 to 14 minimum path).
- AC: create flow (ModeCardPicker, StepperInput with suggested round count, tiny-group callout for n<6 per R4), roster builder (type or paste, auto-suffix duplicates, edit and remove pre-game), lobby (QRPanel with URL built from `NEXT_PUBLIC_APP_URL`, ClaimStatusTable live on roster pings, rename and reassign).
- AC: PhaseStepper advances forward-only via `advance_phase`; RevealTriggerCard blocked state renders the named blockers from the trigger's error detail; ModerationFeed v1 lists notes (content plus target, never author) with kill and confirm.
- AC: create success screen shows the host reclaim link and instructs the host to keep it (link works in S5.3).
- Territory: `src/app/host/*`, `src/components/ConsoleShell.tsx`, `QRPanel.tsx`, `ConfirmDialog.tsx` (thin Modal composition, D11). Size: L. Lane: Host surface. Blocked by: S3.1.

**S3.6 M3 live-run verification** (human-gated)
As the team, I prove the thinnest end-to-end slice on real hardware.
- AC (ENG-PLAN M3 exit, verbatim): "A scripted 3-phone + 1-laptop live run on the deployed URL completes lobby to export with no console errors; a kill before reveal never reaches the wall; refresh on every surface restores state."
- AC: script written first (join x3, claim, brief, write 3+ notes each, kill one, reveal, export); an agent pre-runs the flow headless via browser tooling against the deployed URL before the human run.
- Territory: none (verification). Size: M. Lane: Sim/QA + human. Blocked by: S3.2, S3.3, S3.4, S3.5. **Phase gate: M4 to M6 lanes start only after this passes.**

### Epic E-M4: Mode A rotation

**S4.1 Rotation module**
As the host console, I generate a provably valid schedule in O(n) (ENG-PLAN section 3, D7).
- AC: `src/lib/rotation.ts`: Sattolo cycle, powers-of-σ round expansion, round clamp to n-1, greedy no-repeat repair for late joiners (20 attempts, accept-and-log fallback). Inline cycle-powers ASCII example per ENG-PLAN section 6.
- AC: unit tests: uniform-cycle property spot checks, never-self and never-repeat for all k < n across randomized rosters (n = 4 to 100), repair preserves completed rounds untouched.
- Territory: `src/lib/rotation.ts` + its test file. Size: M. Lane: API bridge. Blocked by: S3.6 gate only (pure TS, no server dependency).

**S4.2 Player Mode A screens**
As a player in Mode A, I am told who to write to each round and my draft is handled predictably (PRD P4; DRD screen 4a).
- AC: TargetBanner with new-round transition, RoundTimer rendered from `round_started_at` + skew (never a local countdown, D22), GraceCountdown sheet on `grace_until`, auto-submit at grace expiry when the draft passes hard conditions else local discard with the "Draft discarded" toast (round-mismatch raise handled), bonus note entry point (one per round client-side, D16), late-joiner interstitial ("you join from the next round") and the no-assignment waiting card.
- Territory: `src/app/r/write/modeA/*`, `src/components/TargetBanner.tsx`, `RoundTimer.tsx`, `GraceCountdown.tsx`. Size: L. Lane: Player surface. Blocked by: S4.1 (types), S3.3.

**S4.3 Host round controls**
As a host, I drive rounds, and the room self-heals when I disappear (PRD H4, R1; DRD RoundControlCard).
- AC: game start generates the schedule via S4.1 and persists through `save_assignments`; RoundControlCard (advance, pause, resume, add_round, grace-running state); claim-during-writing triggers next-round repair and re-save for future rounds only; host reconnect snapshot detects unassigned claimed players and repairs.
- AC: player-callable `finalize_round` verified from the console's perspective: host tab asleep through grace does not stall the room (D9).
- Territory: `src/app/host/game/*`. Size: L. Lane: Host surface. Blocked by: S4.1, S3.5.

**S4.4 8-client rotation simulation**
As the team, I prove the rotation invariants from the database, not the UI.
- AC (ENG-PLAN M4 exit, verbatim): "An automated 8-client simulation (vitest driving supabase-js) runs 4 rounds: never self, never repeated target, grace auto-submit and discard both exercised, late joiner enters round N+1, all invariants asserted from the DB."
- AC: runs in CI against `supabase start`; deterministic seed for the Sattolo shuffle in test mode.
- Territory: `tests/sim/*`. Size: L. Lane: Sim/QA. Blocked by: S4.1 (drives RPCs directly; does not need S4.2/S4.3 UI).

### Epic E-M5: Host console complete

**S5.1 Coverage panel and reveal status**
As a host, I see who is under-written and who has revealed (PRD H5; DRD CoverageBar, RevealStatusList).
- AC: CoverageBar per person with the 3-note floor tick and amber under-floor (Mode B), round-progress variant with falling-behind flags (Mode A, including late-joiner under-floor tracking with `add_round` and bonus-nudge recovery per ENG-PLAN section 3); no note content attributed to an author anywhere in the panel.
- AC: RevealStatusList live on `reveal` pings (holding, reading, finished).
- Territory: `src/app/host/coverage/*`, `src/components/CoverageBar.tsx`. Size: M. Lane: Host surface. Blocked by: S4.3 (host territory sequencing), S3.5.

**S5.2 Moderation complete, kill propagation**
As a host, a kill wins everywhere, in every phase (PRD H6, Resolved Q4).
- AC (ENG-PLAN M5 exit clause): "Host kills a note pre-reveal and post-reveal and it disappears from wall, export, and highlight pool." Post-reveal kill triggers the player wall refetch via the `notes` ping; export re-render excludes it; highlight pool filter verified.
- AC: moderation feed streams live, kill-confirm state, killed notes shown as killed to the host only.
- Territory: `src/app/host/moderation/*`. Size: M. Lane: Host surface. Blocked by: S5.1 (lane order), S3.4.

**S5.3 Reclaim, rehearsal mode, end-and-delete**
As a host, I survive losing my laptop and I can preview the ritual and end the room clean (PRD R5, rehearsal-mode RICE row, D6, D10).
- AC (ENG-PLAN M5 exit clauses): "reclaim from a second browser works; end-and-delete leaves zero rows for the room."
- AC: `/host/?code=&key=` reclaim path calls `reclaim_host`, old session loses rights atomically, failed secrets rate-capped; rehearsal mode links the host to `/dev/reveal` (the `reveal-demo` page) with client-only fake data; end-and-delete uses the typed-code ConfirmDialog, clients render end card from `room_ended`.
- Territory: `src/app/host/settings/*` (reclaim, end), `src/app/host/rehearsal/*`. Size: M. Lane: Host surface. Blocked by: S5.2 (lane order).

**S5.4 M5 verification**
- AC: the full ENG-PLAN M5 exit criterion asserted end to end on the deployed URL: kill propagation (both timings), second-browser reclaim, zero-row check via a count query after end-and-delete.
- Territory: none. Size: S. Lane: Sim/QA. Blocked by: S5.1, S5.2, S5.3.

### Epic E-M6: Big screen and music

**S6.1 Big screen, four states**
As an organizer, I project the room without leaking a word of content (PRD B1, B2, B3; DRD section 6).
- AC: `/screen/?code=` renders lobby (QRPanel XL, JoinProgressDots, ticker name via `screen_state`), writing (BigScreenStat counts only, RoundTimer XL), reveal interstitial (static, plays on the phase event), highlight wall (opt-in rotation, HighlightToggle-gated, PromptDeck prompts ride the `prompt` ping), all at the DRD distance type scale.
- AC: every state renders exclusively from `screen_state` and `highlight_notes`; no other read path imported.
- Territory: `src/app/screen/*`, `src/components/BigScreenStat.tsx`, `JoinProgressDots.tsx`, `HighlightWall.tsx`. Size: L. Lane: Screen surface. Blocked by: S3.6 gate (runs parallel to M4 and M5 lanes).

**S6.2 Music engine**
As a host, the big screen carries the room's soundtrack and the reveal silences it (ENG-PLAN music addendum, DRD 13.1).
- AC: `music_mood` and `music_on` columns migration plus settings RPC extension (small, backend-reviewed); playback client-local on the big screen: phase-coupled shuffle-loop folders (`assets/music/{lobby,writing,wrapup}/`), briefing auto-duck to 20% as a multiplier on host volume, continuous 0 to 100 volume slider, play/pause/mute/skip on both console and big screen at all times outside Reveal, all mute states and volume persisted in localStorage.
- AC: click-to-arm autoplay gate; muted devices never autoplay.
- AC (M6 added exit criterion, verbatim): "the reveal trigger provably kills audio within 2s in the same tick as the interstitial, and no control path can restart it before the highlight wall."
- AC: total assets under 40 MB; `assets/music/README` license note per track (extends F8).
- Territory: `src/app/screen/music/*`, host music controls in `src/app/host/music/*` (coordinated slot, host lane consulted), `assets/music/*`, one migration file in `supabase/migrations/` (backend lane reviews). Size: L. Lane: Screen surface. Blocked by: S6.1; the migration slice blocked by S2.1 numbering.

**S6.3 M6 verification** (human-gated for the projector)
- AC (ENG-PLAN M6 exit, verbatim): "Projector (or 1080p TV) review at 8m: code readable, lobby fills live, writing shows counts only; a content-leak review of every screen state finds zero note content and zero author-adjacent info pre-optin."
- AC: agent pre-pass: automated content-leak sweep of every screen-state DOM against a seeded room before the human projector session.
- Territory: none. Size: S. Lane: Sim/QA + human. Blocked by: S6.1, S6.2.

### Epic E-M7: Polish, i18n, PWA, load

**S7.1 ZH depth and i18n consolidation**
As a Chinese-speaking player, everything switches mid-phase (PRD P2; DRD sections 10 and 13).
- AC: story-local string files consolidated into `src/i18n/en.ts` and `zh.ts` under the shared `Dict` type; frame stems, validator nudges, prompts, export footer all bilingual from COPY.md; `Noto_Sans_SC` via `next/font/google` appended to both font stacks; `document.documentElement.lang` updates on toggle; export renderer `document.fonts.load()` covers all three faces.
- AC (M7 exit clause): "Language toggle switches everything mid-phase" verified on every surface and phase.
- Territory: `src/i18n/*`, plus a consolidation sweep across surface folders (runs solo in its wave for the string-file moves) and `src/app/layout.tsx` (owner this wave). Size: L. Lane: i18n. Blocked by: all M3 to M6 UI stories merged.

**S7.2 PWA under basePath**
As a player on flaky venue wifi, the app installs and loads (F6).
- AC (M7 exit clause): "Lighthouse PWA installable on the Pages URL"; SW registers at `/kindsight/sw.js` with scope `/kindsight/`; manifest reference is `${basePath}/manifest.json` with prefixed icon paths; fallback to `@serwist/next` only if the plugin misbehaves (D18).
- Territory: `next.config.ts` (owner this wave), `public/*`, `src/app/layout.tsx` metadata (coordinated with S7.1: S7.1 owns the file, S7.2 lands after in the same lane or hands a patch to S7.1's owner). Size: M. Lane: CI/infra. Blocked by: S3.6; can start early but verifies after M6.

**S7.3 A11y audit and fixes** (solo wave, touches everything)
- AC (M7 exit clause): "axe + manual VoiceOver pass on player flow" against the full DRD section 11 checklist; timed-activation and reduced-motion paths re-verified post-integration.
- Territory: cross-cutting; runs alone in its wave with no other open story. Size: L. Lane: Player surface (audit scope is the player flow first, console second). Blocked by: S7.1.

**S7.4 Load test and rate-limit calibration**
- AC (M7 exit clause): "load test at documented max room size passes join burst and writing burst" from a single IP; the anonymous sign-in limit set to the measured value, not infinity (D17, F4); realtime messages/sec burst measured against the free-tier cap (ENG-PLAN section 4 throttling note); documented max room size written into HOST-GUIDE.md.
- Territory: `tests/load/*`, HOST-GUIDE.md appendix. Size: L. Lane: Sim/QA. Blocked by: S2.4, S4.4 (uses the simulation harness).

**S7.5 TTL end to end**
- AC (M7 exit clause): "a room created 24h+ ago is gone"; verified against the live project (create a short-TTL test room by direct SQL, confirm sweep); expired-but-unswept room already inert via the API checks; keepalive workflow observed firing.
- Territory: none (verification plus at most one test-helper SQL file). Size: S. Lane: Backend. Blocked by: S2.4.

### Epic E-M8: Dress rehearsal

**S8.1 North Star dry run** (human)
- AC (ENG-PLAN M8 exit, verbatim): "A full 10-person game on real phones via the public URL, zero facilitator tech intervention, at least half the players export; retro notes filed."
- Pre-gate checklist: template license confirmed (F8), music track licenses noted, Supabase project unpaused (keepalive green), host opens the console the day before.
- Territory: none. Size: M (human). Blocked by: everything above.

---

## 5. Dependency map and waves

A wave dispatches all its stories as parallel agents. A story starts only when its wave opens and its named blockers are done. Territories within a wave are disjoint by construction.

```
Wave 0 (now, in flight + human):
  [S2.1 RPC migrations]        backend lane, supabase/migrations/*
  [pre-game screens, mock]     player lane, already dispatched
  [V0 phone verification]      human, no code

Wave 1:
  [S2.2 pgTAP]                 supabase/tests/*        (after S2.1)
  [S2.5 types + api.ts]        src/lib/*               (after S2.1)
  [S7.2 PWA groundwork]        next.config.ts,public/* (optional early start)

Wave 2:
  [S2.3 role matrix + CI]      tests/db/*, workflows   (after S2.1, S2.2)
  [S2.4 remote push+keepalive] supabase config, workflows (after S2.1)
  [S3.1 realtime+stores+shell] src/lib, src/stores, r/ shell (after S2.5)

Wave 3 (M3 breadth, parallel):
  [S3.2 pre-game wiring]       src/app/r/join/*, src/app/page.tsx
  [S3.3 composer Mode B]       src/app/r/write/*, components (owns barrel)
  [S3.4 wall+ritual+export]    src/app/r/reveal/*, r/wall/*
  [S3.5 host console v1]       src/app/host/*
     all four blocked by S3.1; disjoint territories

Wave 4 (gate):
  [S3.6 M3 live run]           verification, human     (after 3.2-3.5)
  === M3 gate: nothing below starts until S3.6 passes ===

Wave 5 (three parallel lanes open):
  Player/API lane:  [S4.1 rotation module] -> [S4.2 player Mode A]
  Host lane:        [S4.3 round controls] -> [S5.1 coverage] -> [S5.2 moderation] -> [S5.3 reclaim/end]
  Screen lane:      [S6.1 big screen] -> [S6.2 music]
  Sim lane:         [S4.4 simulation]      (after S4.1 only; UI not needed)

Wave 6 (verifications, parallel):
  [S5.4 M5 verify]  [S6.3 M6 verify]  [S7.4 load test]  [S7.5 TTL]

Wave 7 (solo):
  [S7.1 ZH consolidation]      src/i18n/*, layout.tsx  (solo for string moves)

Wave 8 (solo):
  [S7.3 a11y audit + fixes]    cross-cutting, nothing else open

Wave 9:
  [S8.1 dress rehearsal]       human, North Star
```

Blocking edges in short form:

```
S2.1 -> S2.2 -> S2.3
S2.1 -> S2.5 -> S3.1 -> {S3.2, S3.3, S3.4, S3.5} -> S3.6(gate)
S2.1 -> S2.4 -> {S7.4, S7.5}
S3.6 -> {S4.1, S4.3-chain, S6.1}
S4.1 -> {S4.2, S4.3, S4.4}
S4.3 -> S5.1 -> S5.2 -> S5.3 -> S5.4        (single host-territory lane)
S6.1 -> S6.2 -> S6.3
{all UI} -> S7.1 -> S7.3
{S5.4, S6.3, S7.1, S7.2, S7.3, S7.4, S7.5, V0} -> S8.1
```

---

## 6. Definition of Ready and Definition of Done

### DoR, all stories

- User story and acceptance criteria present in section 4, criteria traceable to an ENG-PLAN exit clause or PRD story.
- File territory named and free (no other open story in the wave touches it).
- Blockers in the wave map are done.
- Strings needed by the story exist in COPY.md or the story writes story-local strings for S7.1 to consolidate.

### DoR additions by type

| Story type | Additional DoR |
|---|---|
| Frontend (UI) | DRD screen or component reference named; design tokens exist in `_variables.scss` |
| Backend (SQL) | ENG-PLAN section reference; migration timestamp slot claimed so parallel stories never collide on ordering |
| Simulation/load | Target invariants listed; runs against `supabase start`, not the live project, unless the story says otherwise |
| Verification | Script or checklist written before the run |

### DoD by type

**Frontend story:**
- `npm run build` green (static export, no dynamic-segment regressions).
- Pushed to main and **deployed to the Pages URL**; the story's route loads there with zero console errors.
- No hardcoded user-facing strings outside the story's strings file; `t()` or story-local dict used.
- Reduced-motion and keyboard paths respected where the DRD names them for the component.
- No edits to another lane's territory or to a chokepoint file the story does not own.

**Backend story:**
- Migrations apply clean from empty on `supabase start`.
- **pgTAP green**; role-matrix vitest green where the story touches access rules.
- No exposed function returns `author_id`, `host_id`, `host_secret_hash`, or `claimed_by` (checked structurally against `pg_proc` return types in CI).
- Pushed to the remote project only after CI green (S2.4 onward).

**Simulation/QA story:**
- Deterministic in CI (seeded randomness), asserts from the DB, added to the CI workflow.

**Verification story:**
- Checklist executed and results filed; failures spawn fix stories rather than silently patching inside the verification task; human sign-off recorded for the human-gated ones (S3.6, S6.3, V0, S8.1).

**All stories:** acceptance criteria demonstrably met, no new tech debt without a note in this file's section 9.

---

## 7. Risks and watch list

| # | Risk | Mitigation | Owner |
|---|---|---|---|
| RK-1 | **Agent session death mid-story** (context or session limits) leaves a lane half-done and unverifiable | Stories sized to one session with margin (no XL survived planning). Agents write files incrementally, migrations and components land one file at a time in dependency order. The orchestrator verifies filesystem progress after every agent return (files exist, build or `supabase start` passes) and re-dispatches a resume-style task pointing at the exact missing outputs rather than restarting the story | Orchestrator |
| RK-2 | **Shared-file collisions**, worst on `src/i18n/strings.ts`, `src/routes/index.tsx`, `src/app/layout.tsx`, `src/stores/index.tsx`, `src/components/index.tsx`, `src/scss/_variables.scss` | Single-owner-per-wave rule (section 2); story-local strings consolidated once in S7.1 which runs solo; barrels and chokepoints listed per story; waves 7 and 8 run solo by design | Orchestrator |
| RK-3 | **Supabase link password gap:** `supabase link` / `db push` to `mvuziqekvurgqngqweyf` needs the database password or an access token, which is not in the repo (correctly) and may not be at hand | Surface at S2.4 start, not mid-task: confirm the password or mint a `SUPABASE_ACCESS_TOKEN` before dispatching S2.4. Until resolved, all backend work proceeds against `supabase start`; only S2.4, S7.4, S7.5 truly need the remote | Human |
| RK-4 | Anonymous sign-in per-IP limit (F4) makes the join flow look like a mystery outage at ~30 players | Raised at S2.4, calibrated at S7.4 with a real single-IP burst; number documented in HOST-GUIDE.md | Backend |
| RK-5 | Free project pauses after ~1 week idle (F5) | Keepalive workflow lands in Wave 2 (S2.4), earlier than ENG-PLAN's M7 framing, because the pause bites during development gaps too; pre-event checklist line stands | CI |
| RK-6 | PWA plugin under basePath (F6) is the classic Pages failure | S7.2 verifies SW scope and manifest paths on the live URL; `@serwist/next` named fallback, decision pre-made (D18) | CI/infra |
| RK-7 | Template and music licenses (F8) unconfirmed | Blocks public launch, not development; pre-gate item on S8.1 checklist | Human |
| RK-8 | M0 felt-test fails on real phones (PRD Risk 3) after M3 wiring has consumed the prototype | V0 runs now, before Wave 3 consumes the ritual components; a failed felt-test reopens M0 pacing (configurable breath duration means a fix is a constant, not a rebuild) | Human |
| RK-9 | Realtime messages/sec burst at large rooms (R1) | Ping payloads are content-free and tiny by design; S7.4 measures and sets the documented max room size | Sim/QA |
| RK-10 | Host-territory serialization (S4.3 through S5.3 in one lane) becomes the critical path | Accepted: correctness of a single console beats merge conflicts in `src/app/host/*`. If the lane lags, S5.1 coverage math can be pre-built as a pure module in `src/lib/` by the API bridge lane without touching host files | Orchestrator |

---

## 8. Planning decisions (non-interactive calls, with rationale)

1. **All RPCs, including Mode A rotation RPCs, complete in S2.1 (M2), not deferred to M4.** ENG-PLAN's M2 scope already says "all RPCs"; splitting the SQL surface across milestones would fragment the migration series and the test matrix.
2. **Keepalive workflow pulled forward from M7-adjacent setup to Wave 2 (S2.4).** The free-tier pause (F5) can kill the dev-loop remote project during any quiet week, not just before the event.
3. **V0 (M0/M1 real-phone verification) scheduled immediately, before Wave 3.** PRD Risk 3 is the reason M0 was built first; leaving its verification until M8 would defeat that ordering. This is the only place the plan front-runs ENG-PLAN's implicit sequence.
4. **Strings are story-local until S7.1 consolidates them in a solo wave.** The alternative (every story editing `src/i18n/strings.ts`) is the single likeliest merge collision across parallel agents. ZH coverage is still continuous because COPY.md is the source and each story carries both languages.
5. **The host console is a serialized lane (S4.3 -> S5.1 -> S5.2 -> S5.3) rather than parallel M4/M5 stories.** M4 and M5 both live in `src/app/host/*`; territory exclusivity beats theoretical parallelism there. Player, screen, and sim lanes still run fully parallel, so the ENG-PLAN's "M4 to M6 are largely independent lanes" intent is preserved.
6. **S4.4 (simulation) depends only on S4.1 plus M2, not on any Mode A UI.** It drives supabase-js directly, so the DB invariants get proven while the screens are still being built.
7. **The music schema migration ships inside S6.2 with backend-lane review, not as a separate backend story.** Two columns and one RPC extension do not justify a dispatch; the migration-timestamp claim rule keeps it collision-free.
8. **A11y audit (S7.3) runs as a solo wave after i18n consolidation.** It touches every surface; running it alongside open stories guarantees collisions, and auditing pre-consolidation strings would double the work.
9. **Verification stories are separate dispatches from build stories.** An agent verifying its own output against a milestone exit criterion is the fantasy-approval failure mode; the sim/QA lane or a human closes every milestone.

---

## 9. Log

| Date | Entry |
|---|---|
| 2026-07-04 | Sprint plan created against ENG-PLAN M0 to M8. Waves 0 to 2 partially in flight (S2.1, pre-game screens). V0 and RK-3 flagged to the human. |
