# Kindsight Engineering Plan

**Status:** Engineering review complete, ready for sprint planning | **Date:** 2026-07-04
**Sources:** docs/PRD.md (approved), docs/DRD.md (approved), BrainNest template at `reference/brainnest-educational-toys-next-js-app-2025-03-03-12-38-25-utc/brainnest/`
**Review mode:** non-interactive. Judgment calls are recorded in section 13 with rationale.

Locked architecture (not reopened here): Next.js 15 static export on GitHub Pages under a repo subpath, PWA enabled. Supabase free tier: Postgres, Realtime, anonymous auth. No custom server. Game rules enforced client-side plus RLS, policies, and triggers in Postgres. Rooms ephemeral (host end-and-delete plus 24h TTL). No accounts; anonymous session bound to a claimed participant.

---

## 0. Stack verification (template, compatibility, license)

### Template assessment

The BrainNest skeleton is Next.js 15.1.6, React 19, TypeScript, SCSS, zustand 5, `@ducanh2912/next-pwa` 10.2.9. App Router, all client components, no API routes, no server actions. Data comes from static JSON on the author's GitHub Pages (`src/config/index.tsx`). This is a good skeleton for us: it is already a client-only app.

What static export requires changing:

1. `next.config.ts` currently has no `output` setting and uses `images.domains`. Change to:
   - `output: 'export'`
   - `basePath: '/kindsight'` (repo subpath), read from `NEXT_PUBLIC_BASE_PATH` so local dev can run at root
   - `trailingSlash: true` so GitHub Pages serves `route/index.html` and refreshes do not 404
   - `images: { unoptimized: true }`. The export build has no image optimizer. Remove `images.domains` (deprecated, and the remote API it served is deleted anyway).
2. **No dynamic path segments.** `output: 'export'` requires `generateStaticParams` for `[code]` routes, and room codes are runtime data. The DRD sitemap's `/r/[code]` and `/screen/[code]` become query-param routes: `/r/?code=7GX4` and `/screen/?code=7GX4`. QR codes encode the full URL with query. This is finding F1 in section 12.
3. PWA plugin: `@ducanh2912/next-pwa` supports `output: 'export'` (service worker emitted to `public/`, copied into `out/`). Two basePath traps to verify at milestone M7: the service worker must register at `/kindsight/sw.js` with scope `/kindsight/`, and the manifest reference in `layout.tsx` (`metadata: {manifest: '/manifest.json'}`) must become `${basePath}/manifest.json` with icon paths prefixed. The plugin is in maintenance mode; if it misbehaves under Next 15, the drop-in replacement is `@serwist/next`.
4. `next dev --turbopack` stays. The PWA plugin is webpack-only but disabled in dev, and `next build` on 15.1 uses webpack, so the plugin runs where it matters.

### React 19 / Next 15 / Supabase compatibility

`@supabase/supabase-js` v2 is framework-agnostic JavaScript with no React peer dependency. `@supabase/realtime-js` v2 uses the browser's native WebSocket. Both run entirely in client components, which is exactly what a static export needs. No compatibility conflict with React 19 or Next 15.1.6. Pin supabase-js to the latest 2.x at build start.

### License

`reference/.../documentaion/index.html` contains setup instructions, author credit (George_FX, kul.giorgi@gmail.com), and dependency notes. **It contains no license or usage-rights section.** The folder naming pattern matches an Envato marketplace download. Action: confirm the purchase license type manually (Envato Regular license covers one end product distributed free to end users, which fits Kindsight; Extended is only needed if end users are charged). Do not ship publicly before this is confirmed. The figma-template PDF was not read (binary, per protocol).

---

## 1. Database schema

Three core tables plus one for the rotation schedule. All timestamps `timestamptz`. All FKs `on delete cascade` so end-and-delete and the TTL sweep are single-statement deletes on `rooms`.

### Enums

```sql
create type room_mode  as enum ('round_robin', 'free_select');
create type room_phase as enum ('lobby', 'briefing', 'writing', 'reveal', 'wrapup');
create type note_frame as enum ('moment', 'strength', 'wish');
create type reveal_state as enum ('locked', 'holding', 'reading', 'done');
```

There is no `ended` phase. End-and-delete removes the rows; clients already in the room receive a `room_ended` broadcast and show the end card, later visitors get "no live room" (decision D6).

### rooms

| Column | Type | Constraints / purpose |
|---|---|---|
| id | uuid | pk, `default gen_random_uuid()`. Also the broadcast topic key, so it must stay unguessable. |
| code | text | `not null unique`, `check (code ~ '^[A-HJ-NP-Z2-9]{6}$')`. 6 chars, 32-char alphabet without 0/O/1/I. |
| mode | room_mode | not null |
| phase | room_phase | not null default 'lobby'. Forward-only via trigger (section 5). |
| host_id | uuid | not null. `auth.uid()` of the host's anonymous session. |
| host_secret_hash | text | not null. `crypt()` hash of the host reclaim secret (section 4). |
| round_count | int | nullable (Mode A only), `check (round_count between 1 and 12)` |
| round_seconds | int | not null default 180 |
| current_round | int | not null default 0. 0 means writing not started. |
| round_started_at | timestamptz | timer anchor; clients render countdown from this, never from local timers alone |
| timer_paused_at | timestamptz | nullable; host pause |
| grace_until | timestamptz | nullable; non-null while the 10s grace window runs |
| highlight_enabled | boolean | not null default false |
| notes_author_cap | int | not null default 20. Per-author live-note ceiling. |
| updated_seq | bigint | not null default 0. Bumped by trigger on every game-state write; clients use it to detect missed events. |
| created_at | timestamptz | not null default now() |
| expires_at | timestamptz | not null default `now() + interval '24 hours'`. TTL sweep key. |

Indexes: unique on `code`; btree on `expires_at` (sweep).

### participants

| Column | Type | Constraints / purpose |
|---|---|---|
| id | uuid | pk default gen_random_uuid() |
| room_id | uuid | not null, fk rooms cascade |
| display_name | text | not null, `check (char_length(display_name) between 1 and 40)` |
| claimed_by | uuid | nullable. `auth.uid()` of the claiming anonymous session. Null = unclaimed. |
| claimed_at | timestamptz | nullable |
| joined_round | int | nullable. Set for late joiners in Mode A: first round they participate in. |
| reveal_state | reveal_state | not null default 'locked'. Drives the host RevealStatusList. |
| created_at | timestamptz | not null default now() |

Constraints: `unique (room_id, display_name)` (host-side auto-suffix happens before insert, this is the backstop), `unique (room_id, claimed_by)` (one name per session per room). Index on `room_id`.

The host is not a participant. Host identity lives only in `rooms.host_id`.

### assignments (Mode A rotation schedule)

The schedule is its own table, not a jsonb column on `rooms`, because visibility must be per-writer. A readable jsonb on the room row would hand every player the full mapping and destroy anonymity (finding F3).

| Column | Type | Constraints / purpose |
|---|---|---|
| room_id | uuid | fk rooms cascade |
| round | int | not null |
| writer_id | uuid | not null, fk participants cascade |
| target_id | uuid | not null, fk participants cascade |

Constraints: `primary key (room_id, round, writer_id)`, `unique (room_id, round, target_id)` (each round is a permutation, so targets are unique too), `check (writer_id <> target_id)`.

### notes

| Column | Type | Constraints / purpose |
|---|---|---|
| id | uuid | pk default gen_random_uuid() |
| room_id | uuid | not null, fk rooms cascade |
| author_id | uuid | not null, fk participants. **Never returned by any read path.** Exists for rate limiting, moderation forensics, and Mode A submission validation only. |
| target_id | uuid | not null, fk participants cascade |
| frame | note_frame | not null |
| content | text | not null, `check (char_length(content) between 1 and 280)` |
| round | int | nullable. Mode A round number; null in Mode B and for bonus notes. |
| is_bonus | boolean | not null default false. DRD Q5 bonus notes: count toward walls, not toward rotation. |
| shared_to_wall | boolean | not null default false. Per-note opt-in (PRD Resolved Q7), revocable until wrap-up ends (DRD Q2). |
| killed | boolean | not null default false. Soft delete. Killed notes stay in the DB for the room's life so the kill is auditable and the row cannot be resubmitted-identical by accident; every read path filters `not killed`. |
| created_at | timestamptz | not null default now() |

Constraints: `check (author_id <> target_id)`. A trigger additionally verifies author and target belong to `room_id`.
Indexes: `(room_id)`, `(target_id) where not killed`, `(room_id, author_id)` (rate-limit lookup), partial `(room_id) where shared_to_wall and not killed` (highlight wall).

### rooms_attempts (abuse ledger, small)

`(uid uuid, window_start timestamptz, count int, primary key (uid, window_start))`. Used by `join_room` to cap code-guessing per anonymous session (section 8). Swept with the TTL job.

---

## 2. RLS and access design (highest risk, PRD Risk 2)

### The core problem RLS alone cannot solve

Postgres RLS is row security, not column security. The invariants are column-shaped: "host reads content and target but never author", "nobody ever reads author_id". If clients had `SELECT` on `notes`, any permitted row would expose `author_id`. Column-level `GRANT SELECT (cols...)` exists, but PostgREST then errors on `select=*` and every client query becomes a fragile explicit column list, and Realtime `postgres_changes` would stream whole rows.

**Design: default-deny everything, expose the API as security-definer functions.**

- `revoke all on all tables in schema public from anon, authenticated;`
- `alter table ... enable row level security;` on all four tables with **no permissive policies** for client roles. RLS-enabled-with-no-policies is the belt and braces: even if a grant slips in later, every read and write is denied.
- All client access goes through `security definer` functions owned by a dedicated `kindsight_api` role, each with an explicit authorization predicate on `auth.uid()`, `set search_path = public, pg_temp`, and `grant execute to authenticated` only (not `anon`; every client signs in anonymously first, which yields the `authenticated` role with an anonymous JWT).
- No function ever selects `author_id` into its return set. The invariant becomes structural: the column simply does not appear in any exposed signature, which is stronger than a policy predicate and trivially testable by inspecting `pg_proc` return types in CI.

RLS is still the boundary in the PRD's sense: the security decisions live in Postgres, next to the data, expressed as predicates. They are just carried by definer functions instead of policy clauses where policies cannot express the rule. Where a rule is row-shaped, it is also enforced by triggers so no single function bug can violate it (e.g. the phase trigger, the floor trigger, the rate cap trigger).

### Access rules per table per operation

"Via RPC" means the only path is the named function; the predicate shown is enforced inside it.

**rooms**

| Op | Rule |
|---|---|
| SELECT | No direct grant. `join_room(code)`: exact-code match, room not expired, attempt-capped; returns a public subset (id, code, mode, phase, current_round, round_count, round_started_at, grace_until, highlight_enabled) plus roster (participant id, name, claimed boolean). Never returns `host_id`, `host_secret_hash`, `notes_author_cap`. `player_state(room_id)`: caller has a claimed participant in the room. `host_state(room_id)`: `host_id = auth.uid()`. `screen_state(code)`: same subset as join_room plus counts. |
| INSERT | `create_room(...)` only. Sets `host_id = auth.uid()`, hashes the host secret, generates a unique code server-side, inserts roster names. |
| UPDATE | Host-only RPCs: `advance_phase`, `advance_round`, `finalize_round` (also callable by a claimed participant, see section 3), `pause_timer`, `resume_timer`, `add_round`, `set_highlight(room_id, on)`, `reclaim_host(code, secret)`. Each checks `host_id = auth.uid()` (reclaim checks the secret hash instead). Triggers enforce forward-only phase and the Mode B floor regardless of caller. |
| DELETE | `end_room(room_id)`: `host_id = auth.uid()`. Cascades everything. Plus the pg_cron sweep (runs as postgres, bypasses RLS by design). |

**participants**

| Op | Rule |
|---|---|
| SELECT | Roster (names, claimed flags) via `join_room` / `player_state` / `host_state` / `screen_state` as above. `claimed_by` is never returned to players or screen; the host sees claimed status, not the session uuid. |
| INSERT | `create_room` and host-only `add_participant(room_id, name)` (late roster additions; auto-suffix duplicates). |
| UPDATE | `claim_participant(participant_id)`: atomic `set claimed_by = auth.uid(), claimed_at = now() where id = $1 and claimed_by is null` in a room whose phase is not wrapup and not expired; raises if 0 rows (claim race loser, section 8). Host-only `rename_participant`, `reassign_participant` (clears claimed_by), `remove_participant` (lobby only). `set_reveal_state(state)`: caller updates own row only, phase in (reveal, wrapup). |
| DELETE | Host-only `remove_participant`, lobby phase only. Cascade otherwise. |

**assignments**

| Op | Rule |
|---|---|
| SELECT | `my_assignment(room_id)`: returns target id and display name for the caller's participant for `current_round` only. Denied if phase is not writing. The host has **no read path**: `host_state` returns round progress (name, submitted-this-round boolean) computed without exposing targets. |
| INSERT/UPDATE | `save_assignments(room_id, jsonb)`: host only, validates every round is a permutation with no fixed points (no self), writer and target sets equal the claimed roster, and rejects writes for rounds `<= current_round` once writing has begun (repair touches future rounds only). |
| DELETE | Cascade only. |

**notes**

| Op | Rule |
|---|---|
| INSERT | `submit_note(room_id, target_id, frame, content, is_bonus)` only. Checks: caller has a claimed participant (the author); phase = writing (or grace window running, section 3); target is a claimed participant in the same room; target is not the author; Mode A non-bonus: `(current_round, author, target)` matches `assignments` and no non-bonus note exists for that round by that author; Mode B or bonus: no duplicate live note by this author to this target (bonus dedupe), rate cap trigger fires (section 8). Sets `author_id` server-side from the caller's participant. The client never supplies author identity. |
| SELECT (own wall) | `my_wall(room_id)`: caller's participant is the target, `phase in ('reveal','wrapup')`, `not killed`. Returns id, frame, content, shared_to_wall, created_at. **No author.** |
| SELECT (counts) | `my_wall_count(room_id)`: count of live notes targeting the caller, any phase after claim. Count only; drives the locked-wall silhouettes. `screen_totals` inside `screen_state`: room-wide total note count and claimed count only. This is the "count-only" access: a security-definer aggregate is the only legal pre-reveal read that touches note rows targeting the caller, and its return type is `int`. |
| SELECT (writer read-first) | `target_notes_for_writer(target_id)`: phase = writing, caller is a claimed participant in the room, **caller is not the target**, returns frame + content of live notes for that target. No author, no note ids. This is content flowing pre-reveal, which is allowed: the invariant protects the subject, not the note. |
| SELECT (host moderation) | `moderation_feed(room_id)`: host only, any phase. Returns note id, target display name, frame, content, killed, created_at. **No author, structurally.** |
| SELECT (own sent) | `my_sent_notes(room_id)`: caller's own authored notes (target id, frame, is_bonus). Your own authorship is your own data; drives Mode B written-to marks and the sent counter. |
| SELECT (highlight) | `highlight_notes(code)`: `highlight_enabled = true`, `phase = wrapup` (or reveal, host toggle gates it), `shared_to_wall and not killed`. Returns content, frame, recipient display name (consented per note). No author. |
| UPDATE | `kill_note(note_id)`: host only, sets `killed = true`, any phase. `set_note_share(note_id, share)`: caller is the note's target, phase in (reveal, wrapup). No other column is client-writable. |
| DELETE | Cascade only. Kill is soft. |

**Realtime authorization.** Events are broadcast from the database (`realtime.send`) to topic `room:{room_uuid}` (section 4). One policy on `realtime.messages`: `for select to authenticated using (realtime.topic() like 'room:%')`. This is safe because the topic key is the unguessable room uuid (obtainable only via a valid code) and **every payload is content-free**: phase, seq numbers, counts, and "changed" pings. Note content never rides a broadcast.

### Invariant list

1. No client can read the content of a note targeting themselves while `room.phase` is lobby, briefing, or writing. The only pre-reveal reads touching own-targeted rows return counts (int).
2. No exposed function returns `author_id` or any author-identifying value, to anyone, in any phase. Verified structurally in CI against function return types.
3. The host reads note content and target, never author.
4. The big screen reads phase, timer fields, and aggregate counts only, plus opted-in highlight notes during wrap-up.
5. Writers may read a target's existing live notes during writing only, and never when they are the target.
6. Killed notes are invisible to every read path except the host moderation feed (shown as killed).
7. Rotation assignments are visible only as "my current-round target". No full-schedule read path exists post-creation (residual: the host browser generated it, section 8).
8. `rooms.host_id`, `host_secret_hash`, and `participants.claimed_by` never cross the API boundary.
9. Phase moves forward only, and only the host moves it (trigger-enforced, independent of RPC bugs).
10. All state-changing writes are RPCs that derive identity from `auth.uid()`. No client-supplied identity is trusted.

### Test matrix

Roles: **Stranger** (anon session, no code), **Joiner** (knows code, unclaimed), **Player** (claimed), **Host**, **Screen** (knows code, unclaimed). Phases: L=lobby, B=briefing, W=writing, R=reveal, U=wrapup. A=allow, D=deny. Every D must be a raised exception, not an empty result, except where noted.

| Operation | Caller | L | B | W | R | U |
|---|---|---|---|---|---|---|
| join_room(valid code) | Stranger/Joiner/Screen | A | A | A | A | A |
| join_room(bad code x21 in 1 min) | any | D | D | D | D | D |
| claim_participant(unclaimed) | Joiner | A | A | A (late join) | D | D |
| claim_participant(already claimed) | Joiner | D | D | D | D | D |
| submit_note(valid) | Player | D | D | A | D | D |
| submit_note(target = self) | Player | D | D | D | D | D |
| submit_note(wrong Mode A target) | Player | D | D | D | D | D |
| submit_note(over author cap) | Player | D | D | D | D | D |
| my_wall_count | Player (own) | A(0) | A | A | A | A |
| my_wall | Player (own) | D | D | D | A | A |
| my_wall via any other function/path | Player pre-reveal | D | D | D | n/a | n/a |
| target_notes_for_writer(other) | Player | D | D | A | D | D |
| target_notes_for_writer(self) | Player | D | D | D | D | D |
| my_sent_notes | Player | A | A | A | A | A |
| moderation_feed | Host | A | A | A | A | A |
| moderation_feed | Player/Screen/Stranger | D | D | D | D | D |
| kill_note | Host | A | A | A | A | A |
| kill_note | Player | D | D | D | D | D |
| advance_phase (next) | Host | A | A | A* | A | n/a |
| advance_phase (skip/backward) | Host | D | D | D | D | D |
| advance_phase | Player/Screen | D | D | D | D | D |
| advance_round / pause / add_round | Host, Mode A | n/a | n/a | A | n/a | n/a |
| finalize_round (grace expired) | Host or Player | n/a | n/a | A | n/a | n/a |
| finalize_round (grace running) | any | n/a | n/a | D | n/a | n/a |
| save_assignments (valid derangement) | Host | A | A | A (future rounds) | D | D |
| save_assignments (self-target or past round) | Host | D | D | D | D | D |
| save_assignments | Player | D | D | D | D | D |
| my_assignment | Player, Mode A | D | D | A | D | D |
| set_note_share(own note) | Player (target) | D | D | D | A | A |
| set_note_share(other's note) | Player | D | D | D | D | D |
| set_reveal_state(own) | Player | D | D | D | A | A |
| screen_state | Screen | A | A | A | A | A |
| highlight_notes (enabled, opted-in only) | Screen | D | D | D | A** | A |
| reclaim_host(code, correct secret) | any session | A | A | A | A | A |
| reclaim_host(code, wrong secret) | any | D | D | D | D | D |
| end_room | Host | A | A | A | A | A |
| end_room | Player/Screen | D | D | D | D | D |
| Direct `select/insert/update/delete` on any table | every role | D | D | D | D | D |

\* Mode B: denied until every claimed participant has 3 or more live notes (trigger). \*\* Only when `highlight_enabled`, and returns only `shared_to_wall and not killed` rows.

Matrix implementation: pgTAP for trigger and function unit tests, plus a vitest integration suite running supabase-js against `supabase start` (local Docker stack) in CI, with one client per role. The pre-reveal self-read row is the launch-blocking test: it must attempt every read function and the raw REST endpoint. Add one adversarial test that calls PostgREST directly (`/rest/v1/notes?select=*`) with a player JWT and expects a permissions error.

---

## 3. Rotation engine (Mode A)

### Schedule generation: one random cycle, rounds as its powers

The host console generates the schedule client-side at game start (locked) and stores it via `save_assignments`.

Algorithm: run **Sattolo's shuffle** over the claimed participants. Sattolo yields a uniformly random single n-cycle σ. Round k assigns writer i the target σ^k(i).

Why this beats generating R independent derangements:

- σ^k has no fixed point for any 0 < k < n (a power of an n-cycle fixes a point only when n divides k). Never yourself: guaranteed.
- σ^k(i) ≠ σ^j(i) for k ≠ j < n. Never a repeated target: guaranteed, no retry loops, no backtracking.
- It also guarantees the dual: no one receives twice from the same writer, which spreads wall variety.
- O(n) generation, trivially testable, and valid for any round count R ≤ n-1. The console clamps suggested rounds to `min(desired, n-1)`.

`save_assignments` re-validates server-side: per round a full permutation of claimed participants, no fixed points, unique targets. The DB never trusts the client's math (invariant style: client proposes, Postgres verifies).

```
Roster: A B C D E F      Sattolo cycle: A->D->B->F->C->E->A
Round 1 (k=1): A->D, D->B, B->F, F->C, C->E, E->A
Round 2 (k=2): A->B, D->F, B->C, F->E, C->A, E->D
Round 3 (k=3): A->F, D->C, B->E, F->A, C->D, E->B
```

### Round state: who is authoritative

`rooms.current_round`, `round_started_at`, and `grace_until` are the single source of truth. Clients render timers from `round_started_at + round_seconds` against server time (RPCs return `now()` so clients compute clock skew once). Nobody trusts a local countdown for game state.

Advance mechanics:

```
        host clicks "Advance" or console timer hits 0
                        |
                        v
   advance_round(room): grace_until := now() + 10s   (host only)
                        |            broadcast {grace_until}
                        v
   players with unsent drafts see GraceCountdown;
   submit_note stays valid while grace runs
                        |
                        v
   finalize_round(room): requires grace_until <= now()
     current_round += 1, grace_until := null,
     round_started_at := now()        (idempotent, guarded)
```

`finalize_round` is callable by the host **or any claimed participant**. The host console calls it on a 10s timeout; if the host laptop sleeps mid-grace, the first player client whose clock passes `grace_until` calls it and the room self-heals. Idempotency guard: it no-ops (returns current state) if `grace_until` is null or in the future, so racing callers are harmless. When `current_round` exceeds `round_count`, `finalize_round` leaves the round parked at `round_count` with a `writing_done` flag in the broadcast; the host then advances the phase.

The 10s grace window (PRD Resolved Q2): during grace, `submit_note` accepts round `current_round` submissions. At grace expiry the player client auto-submits if the draft passes the soft validator's hard conditions (non-empty, frame chosen), otherwise discards locally. Drafts never carry over; the next round's assignment replaces the composer.

Auto-submit failure mode: if the auto-submit lands after `finalize_round` won the race, `submit_note` raises (round mismatch) and the client shows the "Draft discarded" toast. Deterministic, no orphan notes.

### Bonus notes (DRD Q5)

After submitting the round's assigned note, the player may write one free-select bonus note per round while waiting. `submit_note(..., is_bonus := true)` skips the assignment check, sets `round := null`, enforces the no-duplicate-target rule and the author cap. Bonus notes count toward walls and the reveal floor, not toward rotation guarantees.

### Late joiner (R1)

Ship the pre-approved fallback: **late joiners enter the next round.**

On a claim event during writing, the host console:
1. Sets the newcomer's `joined_round = current_round + 1`.
2. Regenerates rounds `> current_round` with a fresh Sattolo cycle over the full claimed roster.
3. Greedy repair for the no-repeat guarantee: re-shuffle up to 20 attempts to avoid (writer, target) pairs already used in completed rounds; accept a repeat if attempts run out (log it to console). With one newcomer and small R this almost always succeeds first try.
4. `save_assignments` for future rounds only (the DB rejects past-round writes).

The newcomer's player app shows the DRD interstitial ("Round 2 of 4 is in progress. You join from the next round.") and may write bonus notes while waiting. If the host is disconnected at claim time, the newcomer has no assignment for the next round; the player app treats "no assignment row for current round" as the waiting card, and the host console repairs on reconnect (its snapshot fetch detects unassigned claimed players). Full mid-round splice-in is explicitly out of scope (section: NOT in scope).

**Coverage note:** a late joiner participates in fewer rounds and can end below 3 notes. The console coverage panel tracks this in Mode A too, and the recovery path is `add_round` plus bonus-note nudges (see floor decision D8).

### Tiny groups (R4)

Below 6 claimed players, the console shows the amber callout (DRD 2.4) recommending Mode B. If the host proceeds with Mode A: rounds clamp to n-1, and with powers-of-a-cycle each of your writers is distinct, which is the best anonymity available at that size. The honest mitigation is the warning; with n=4 the recipient can often guess regardless. Accepted residual (section 8).

---

## 4. Realtime design

### One channel per room, broadcast-from-database, ping-and-pull

Every surface subscribes to a single Supabase Realtime channel: topic `room:{room_uuid}`. Events are emitted by Postgres triggers via `realtime.send()`, so the database (the source of truth) is also the source of events. Clients never broadcast game state to each other; a client message cannot move the game.

All payloads are content-free (invariant 4 in section 2). Where the receiving surface needs data, the event is a **ping** and the surface **pulls** its role-scoped snapshot via RPC. This keeps every byte of authorization in Postgres and makes reconnect and missed-event handling the same code path as normal operation.

| Event | Emitted on | Payload | Player reacts | Host reacts | Screen reacts |
|---|---|---|---|---|---|
| `room` | rooms update (phase, round, grace, timer, highlight) | phase, current_round, grace_until, round_started_at, highlight_enabled, seq | re-render phase screen; fetch `my_assignment` on round change | update stepper/round card | switch state |
| `roster` | participant insert/claim/rename/reassign/remove | seq only | refetch roster (claim screen, Mode B picker) | refetch lobby table / repair rotation | refetch counts + ticker name via `screen_state` |
| `notes` | note insert or kill | seq only | refetch `my_wall_count` (locked wall ticks up); post-reveal refetch `my_wall` (kill during reveal) | refetch `moderation_feed` + `coverage` | refetch totals |
| `reveal` | participant reveal_state update | seq only | ignore | refetch RevealStatusList | ignore |
| `prompt` | host pushes sharing prompt (rooms column or dedicated RPC) | prompt index | ignore | ignore | show prompt |
| `room_ended` | end_room, before delete | none | end card | confirm screen | logo card |

Trigger throttling: the `notes` ping fires per statement, and payloads are ~50 bytes. At the PRD's 100-person stress case, bursts can brush the free tier's default messages-per-second cap; the load-test milestone (M7) measures this and the documented max room size comes from that test, not from hope.

### Reconnect and missed events (R2, R3)

Every event carries `rooms.updated_seq`. Client logic:

1. On subscribe (initial load, refresh, or reconnect): fetch the role snapshot (`player_state` / `host_state` / `screen_state`), which includes `updated_seq`. Render from it.
2. On event: if `event.seq == local.seq + 1` (or same), apply the ping. If a gap is detected, refetch the snapshot. Cheap, idempotent.
3. Realtime client `CHANNEL_ERROR`/`TIMED_OUT`/`CLOSED`: show the ConnectionBanner, exponential backoff resubscribe, snapshot-refetch on rejoin. Queued composer submits (DRD: "Will send when reconnected") replay through `submit_note`, which revalidates phase and round, so a stale queued note fails loudly rather than landing in the wrong round.
4. Safety net: a 60s poll of the snapshot RPC while the tab is visible. If realtime silently dies (conference wifi does this), the game still converges within a minute; phase changes usually arrive via the poll before players notice.

Refresh recovery (R2) is the same path: the anonymous session persists in localStorage, `player_state` finds the claim by `auth.uid()`, and the app restores identity, phase, and language (language lives in localStorage) behind the 300ms skeleton.

### Host disconnect and console reclaim (R5)

The room lives server-side; nothing about the game state depends on the host's websocket. On host refresh, the same anon session simply resubscribes and refetches `host_state` ("Welcome back. The room kept running.").

Total loss (new laptop, cleared storage): the create-room success screen shows a **host reclaim link**, `/host/?code=7GX4&key={secret}`, and instructs the host to keep it (bookmark, or the room card displays it as a copyable URL). `reclaim_host(code, secret)` verifies against `host_secret_hash` and rebinds `rooms.host_id` to the new session's `auth.uid()`. The old session loses host rights atomically. Failed secret attempts route through the same attempt cap as `join_room`.

While the host is gone: phase cannot advance (by design, the host holds the room), but rounds self-heal via participant-callable `finalize_round`, and players keep writing. Accepted behavior.

---

## 5. Phase engine

### Forward-only state machine, enforced in the database

```
 LOBBY -> BRIEFING -> WRITING -> REVEAL -> WRAPUP -> (delete)
```

The authoritative transition is `advance_phase(room_id)`, host-only. A `before update on rooms` trigger enforces, for any caller including future RPC bugs:

1. `new.phase` must be exactly the successor of `old.phase` in the enum order. No skips, no backward moves.
2. Writing -> Reveal in Mode B: every claimed participant must have `count(live notes targeting them) >= 3`, else raise with the list of under-floor names in the error detail (the console renders "Chen needs 1 more" from it). **Mode A is not DB-blocked** (decision D8): the console warns and offers `add_round` instead, because grace-window discards can leave someone under the floor with no host remedy if the DB hard-blocked.
3. Lobby -> Briefing in Mode A: assignments must exist for rounds 1..round_count (the console saves them before advancing).
4. Every transition bumps `updated_seq` and fires the `room` broadcast.

Client-side, the same checks gate the UI (RevealTriggerCard disabled with named blockers) so the trigger exception is a never-seen backstop, not UX.

### The 3-note reveal floor, both layers

- **Client:** Mode B console disables "Open the walls" until `coverage` shows all names at 3+, listing blockers by name.
- **DB:** the transition trigger recounts inside the transaction. A kill that drops someone to 2 between the console's last refetch and the click is caught here. Post-reveal kills can take a wall below 3; that is accepted per PRD Resolved Q4 semantics (kills always win).

### Convergence after a transition

All surfaces converge through one mechanism: the `room` broadcast plus snapshot-refetch on seq gap plus the 60s poll (section 4). Phase renders are pure functions of the snapshot (`phase`, `mode`, `current_round`), so a surface that misses three transitions and reconnects during wrap-up renders wrap-up directly; there is no client-side phase animation dependency on having seen intermediate phases. The DRD's 400ms crossfade plays only when a surface observes a change, never as a required step.

---

## 6. Client architecture

### Repo shape and template adaptation

The BrainNest skeleton is copied to the repo root (`src/`, `public/`, config files) and pruned. It stays one Next.js app with three surfaces as routes; the surfaces share tokens, components, and the Supabase client.

**Routes deleted** (all commerce/auth demo routes): `home, shop, product, categories, cart-empty, checkout, order*, promocodes*, wishlist*, sign-in, sign-up, forgot-password*, verification, verify-your-*, email-verified, phone-verified, new-password, edit-profile, profile, info-saved, leave-a-review, reviews, description, filter, FAQ, privacy-policy, shipping-and-payment-info, Onboarding.tsx` plus `src/data`, `src/items`, `src/stores/useCartStore|useWishlistStore|useVerificationStore`, `src/config` remote URLs, and the `swiper`, `redux`, `immer`, `react-spinners` dependencies (the template imports redux nowhere critical; verify at prune time and drop what nothing imports).

**Routes added** (no dynamic segments, section 0):

```
/            landing: "Create a room" (-> /host/) + code entry (-> /r/?code=)
/r/          player app, phase-driven single page, ?code= prefill
/host/       host console (create -> roster -> lobby -> in-game -> wrap-up),
             ?code=&key= for reclaim
/screen/     big screen, ?code=
/dev/reveal  M0 ritual prototype page (kept; doubles as host rehearsal target)
```

Player and screen pages are client components reading `useSearchParams` under a `Suspense` boundary (export requirement). `src/routes/index.tsx` is rewritten to these four routes.

**Kept from the template:** `Screen`, `Header`, `Button`, `InputField`, `Modal`, `BlockHeading`, `Background` (slot reused by AuroraBackground), the SCSS structure (`_variables.scss` extended per DRD section 9, `_text.scss`, reset), the layout.tsx font pipeline, `BottomTabBar`'s `--footer-height` idiom (component itself unused), PWA wiring.

### Supabase client in a static build

`src/lib/supabase.ts`: single `createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)` module. Both values are inlined into the public bundle at build time. **This is by design: the anon key is a public identifier, not a secret. RLS and the definer-function layer are the security boundary** (section 11 states this for the pipeline too). Auth bootstrap on first load of any surface: `getSession()` else `signInAnonymously()`. A thin `api.ts` wraps every RPC with types generated by `supabase gen types typescript` so client and SQL cannot drift silently.

### Zustand store shape

Three stores, matching the template's zustand-5 pattern:

```ts
useSessionStore:  { supabaseReady, roomId, code, role: 'player'|'host'|'screen',
                    participantId, lang: 'en'|'zh', soundMuted }        // persist: localStorage
useGameStore:     { seq, phase, mode, currentRound, roundCount, roundStartedAt,
                    graceUntil, serverClockSkewMs, roster: RosterEntry[],
                    myAssignment, myWallCount, myWall: Note[]|null,
                    mySentTargets, highlightEnabled }                   // memory only, snapshot-fed
useHostStore:     { coverage, moderationFeed, revealStatus, blockers }  // host console only
```

One `applySnapshot(snapshot)` action per role keeps reconnect logic in a single place. Connection status lives in a tiny `useConnectionStore` feeding ConnectionBanner.

### i18n (EN/ZH) without a server

No i18n framework. A dictionary module (`src/i18n/en.ts`, `zh.ts`, ~120 keys typed by a shared `Dict` type), a `t(key)` hook reading `useSessionStore.lang`, and a client-side `document.documentElement.lang` update on toggle (a11y requirement, DRD section 11). Frame stems and validator nudges live in the dictionaries. **Fonts:** add `Noto_Sans_SC` via `next/font/google` alongside Dosis and League Spartan in `layout.tsx` (it self-hosts unicode-range subsets, so the static export stays CDN-free) and append `var(--font-noto-sc)` to both font stacks per DRD section 10. The export renderer must `document.fonts.load()` all three before drawing (section 7).

### Component build list

From DRD 7.3: 38 new components. The four flagged heavy lifts get built in this order and get the most test attention:

1. **HoldToRevealButton** (M0): pointer + timed-activation a11y mode + reduced-motion + configurable breath duration. State machine inside: rest -> holding(breath n) -> reset | complete.
2. **RevealSequence** (M0): pager, per-note opt-in commit, aria-live announcements.
3. **WallExportRenderer** (M1): section 7.
4. **CoverageBar** (M5): floor tick, amber under-floor, Mode A progress variant.

Per the review decision (D11), these are **thin compositions over template primitives, not new builds**: `ConfirmDialog` = `Modal` + `Button` pair + typed-code `InputField`; `StepperInput` = `InputField` + two `Button`s; `Callout` = styled div on `_text.scss` tokens with icon slot; `Toast` = `Modal`'s portal pattern with auto-dismiss timer. Everything else in the DRD list composes `Screen`/`Header`/`Button`/`InputField` plus the new tokens. AuroraBackground replaces `Background` in the same absolute-inset slot.

Files that should carry inline ASCII diagrams: the phase trigger migration (state machine), `HoldToRevealButton` (breath state machine), the rotation module (cycle-powers example), and `realtime.ts` (ping-and-pull sequence).

---

## 7. Export renderer spike

Goal (PRD Resolved Q6, DRD 3.2 State E): one tall image, saves on iOS Safari and Android Chrome, ZH text correct.

**Approach: hand-drawn Canvas 2D, no html2canvas.** DOM-snapshot libraries are heavy and unreliable with custom fonts and CJK. The wall is a known, simple composition (header band, note cards, footer), so drawing it from note data with `CanvasRenderingContext2D` is less code than taming a snapshot library and renders identically everywhere.

Pipeline:

1. `await document.fonts.load()` for Dosis, League Spartan, Noto Sans SC at the sizes used (CJK glyphs render as tofu in canvas if the face is not loaded).
2. Compute layout: fixed width 1080px, measure wrapped text per note (`measureText` word-wrap for EN, per-character wrap for ZH runs), sum heights.
3. **iOS canvas ceiling:** Safari caps canvas area (roughly 16.7M pixels). A 20-note wall at 2x scale can exceed it. Rule: `scale = min(2, floor(sqrt(16_000_000 / (w*h))))`, floor at 1. If even 1x exceeds the cap (extreme walls), split the render into segments and export the first; the spike measures where this bites.
4. Draw: aurora header band with logo (preloaded `Image` from bundled asset), cards with radius + frame pills, footer line. Brand tokens hard-coded in the renderer, independent of screen theme.
5. Save, three tiers:
   - `canvas.toBlob` -> `navigator.share({files: [File]})` where `navigator.canShare({files})` is true (iOS 15+, Android Chrome): native share sheet, "Save Image" lands in the camera roll. Best UX, primary path.
   - Else `toBlob` -> object URL -> `<a download>` click (desktop, some Android).
   - **Fallback (spec'd in DRD, not optional):** full-screen overlay with `<img src={dataURL}>` and "Press and hold the image to save it". This is also the catch for iOS Safari share failures (user gesture expiry: the share call must happen synchronously in the tap handler chain; pre-render the blob on wall load so the tap only shares).
6. After save: keepsake toast per DRD.

Spike exit criteria live in milestone M1. The gesture-expiry point in 5 is the known iOS killer: `navigator.share` throws `NotAllowedError` if called after an async gap. Pre-rendering on wall-complete is the mitigation the spike must validate.

---

## 8. Abuse and rate limiting without a server

What Postgres primitives can hold, and what we accept.

**Per-author note caps.** The `submit_note` path plus a `before insert` trigger on notes: (a) live notes by author in room `< rooms.notes_author_cap` (default 20); (b) minimum 3s spacing per author (`max(created_at)` check); (c) content length check constraint. The trigger fires even if a future RPC forgets the check.

**Room code entropy.** 6 chars from a 32-char unambiguous alphabet = 32^6 ≈ 1.07 billion codes, valid 24h max. Guessing online means calling `join_room`; the `rooms_attempts` ledger caps lookups at 20/minute per `auth.uid()`, and minting fresh anonymous sessions is itself capped by Supabase's per-IP anonymous sign-in rate limit. Combined, brute force is impractical for a 24h target. Codes are generated server-side in `create_room` with `gen_random_bytes`, retry on the unique violation.

**Claim races (two devices, same name).** `claim_participant` is a single atomic `update ... where claimed_by is null`; row count decides the winner, the loser gets a typed error and the claim screen refetches. One session cannot hold two names (`unique(room_id, claimed_by)`); one person with two devices claims two names only if they claim two different roster entries, which the host sees in the lobby and can reassign. Not preventable without accounts; host-visible is the control.

**Anonymous sign-in per-IP limit (new risk, F4).** Supabase caps anonymous sign-ins per IP per hour (default 30). A conference room joins from one NAT'd wifi IP, so 40 players joining in five minutes will hit it. Mitigation: raise the anonymous sign-in rate limit in the project's Auth settings during setup (section 11), and the M7 load test verifies join burst at target size from a single IP. This limit is also what backstops code brute force, so raise it to a measured value (e.g. 300/hr), not to infinity.

**Accepted as unsolvable on this stack** (documented residuals, not TODOs):

1. A malicious host with devtools can capture the Mode A schedule at generation time (the console generates it, locked design) and deanonymize round notes. The host is trusted-by-role; the promise "no human sees authors" holds for the honest-host case and for everything stored or displayed.
2. Timing inference by the host: moderation feed order plus Mode A round progress can sometimes imply authorship in small rooms ("only one person had submitted when this appeared"). Inherent to live moderation; accepted by PRD H5/H6 scope.
3. No CAPTCHA, no IP bans, no WAF. A determined spammer inside a valid room can post up to the cap with junk; the host kill switch is the remedy (as in the paper version).
4. Denial of service against the Supabase project (connection exhaustion, auth endpoint flood) is bounded only by Supabase's project-level limits. Free tier has no custom rate config beyond auth; accepted for v1 audience.
5. Players can screenshot pre-export; killed-note recall of saved images is impossible (already accepted in PRD Resolved Q4).
6. Client code is public and modifiable; every guarantee that matters is therefore in Postgres, and nothing in section 2 trusts the client. The soft validator and grace auto-submit are UX, not security, and live client-side only.

---

## 9. TTL cleanup

**Primary: pg_cron.** Available on Supabase free tier as a dashboard-enabled extension. One migration:

```sql
select cron.schedule('kindsight_ttl', '*/30 * * * *',
  $$ delete from rooms where expires_at < now();
     delete from rooms_attempts where window_start < now() - interval '1 day'; $$);
```

Cascades wipe participants, assignments, and notes. 30-minute cadence keeps worst-case overshoot small against the 24h promise.

**Belt and braces in the API:** `join_room`, `claim_participant`, and `submit_note` all check `expires_at > now()`, so an expired-but-unswept room is already inert and invisible before the sweep lands.

**Fallback if pg_cron is unavailable or disabled:** a Supabase Scheduled Edge Function (cron-triggered, free tier includes it, and it is a Supabase primitive, not a custom server) calling one definer function `sweep_expired()`. Same SQL, different trigger. Decision D13 picks pg_cron first because it keeps cleanup inside Postgres with zero extra deploy surface.

**Related free-tier trap (F5):** Supabase pauses free projects after about a week of inactivity, and a facilitator arriving at a workshop with a paused project is a dead session. Mitigation lives in the deploy pipeline (section 11): a scheduled GitHub Actions keepalive that calls a trivial RPC a few times a week, plus a pre-event checklist line "open the host console the day before".

---

## 10. Build order and milestones

Order follows PRD Risk 3 and DRD section 14: ritual first, export second, then the thinnest end-to-end slice, then breadth. Every milestone has a verifiable exit.

| # | Milestone | Contents | Exit criterion (verifiable) |
|---|---|---|---|
| M0 | Reveal ritual prototype | Repo scaffold from template (pruned, static export deploying to Pages from day one), `/dev/reveal` page: HoldToRevealButton + RevealSequence with fake notes, breath duration configurable (DRD Q1), chime + mute, reduced-motion and timed-activation modes | On 2 real iOS Safari and 2 Android Chrome phones via the public Pages URL: hold-through-3-breaths completes, early release resets, timed a11y mode reachable by keyboard and VoiceOver, reduced-motion variant verified. Felt-test with 3+ people at 3.2s vs 4.5s recorded as a decision |
| M1 | Export spike | WallExportRenderer drawing fake wall data, share-sheet path, download path, long-press fallback, ZH strings in the render | Wall image lands in the iOS camera roll (share path) and Android gallery on the same test phones; ZH note renders without tofu; fallback overlay shown and works when share is cancelled; canvas-cap rule tested with a 25-note wall |
| M2 | Supabase foundation | Project setup, migrations: schema, enums, triggers, all RPCs, realtime policy, pg_cron; pgTAP + vitest role matrix in CI via `supabase start` | Full section 2 test matrix green in CI, including the direct-PostgREST adversarial reads and the pre-reveal self-read attempts in every phase |
| M3 | Vertical slice, Mode B | Landing, join, claim, briefing, composer + soft validator + read-first accordion, locked wall with live silhouettes, host create/roster/lobby/phase stepper, kill switch, reveal trigger with floor gate, ritual wired to real data, wall + real export | A scripted 3-phone + 1-laptop live run on the deployed URL completes lobby to export with no console errors; a kill before reveal never reaches the wall; refresh on every surface restores state |
| M4 | Mode A rotation | Sattolo generation + save_assignments validation, TargetBanner, RoundTimer, advance/grace/finalize, bonus notes, late-joiner next-round entry, tiny-group callout | An automated 8-client simulation (vitest driving supabase-js) runs 4 rounds: never self, never repeated target, grace auto-submit and discard both exercised, late joiner enters round N+1, all invariants asserted from the DB |
| M5 | Host console complete | Coverage panel (both modes), moderation feed live, RevealStatusList, host reclaim link + RPC, rehearsal mode (client-only fake data on `/dev/reveal`), end-and-delete with typed-code confirm | Host kills a note pre-reveal and post-reveal and it disappears from wall, export, and highlight pool; reclaim from a second browser works; end-and-delete leaves zero rows for the room |
| M6 | Big screen | `/screen/` all four states, distance type scale, JoinProgressDots, ticker, BigScreenStat, reveal interstitial, highlight wall with opt-in rotation | Projector (or 1080p TV) review at 8m: code readable, lobby fills live, writing shows counts only; a content-leak review of every screen state finds zero note content and zero author-adjacent info pre-optin |
| M7 | Polish, i18n, PWA, load | Full ZH depth (dictionaries, stems, validator, prompts, export footer), Noto Sans SC wiring, PWA manifest + SW under basePath, a11y audit against DRD section 11 checklist, load test at target room size from one IP, raise auth rate limit, TTL verified end to end | Language toggle switches everything mid-phase; Lighthouse PWA installable on the Pages URL; axe + manual VoiceOver pass on player flow; load test at documented max room size passes join burst and writing burst; a room created 24h+ ago is gone |
| M8 | Dress rehearsal | North Star dry run | A full 10-person game on real phones via the public URL, zero facilitator tech intervention, at least half the players export; retro notes filed |

Parallelization: M0 and M1 are sequential for one builder but independent of M2, which can run in a parallel lane (different modules: `src/` UI vs `supabase/`). M3 requires M0+M1+M2. M4 to M6 are largely independent lanes after M3 (rotation module, host console module, screen module) with merge points at the shared stores.

---

## 11. Deploy pipeline

### GitHub Actions to Pages

`.github/workflows/deploy.yml`: on push to `main`: `npm ci` -> `npm run build` (static export to `out/`) -> `touch out/.nojekyll` (Pages must not Jekyll-process `_next/`) -> `actions/upload-pages-artifact` -> `actions/deploy-pages`. Node 20. Pages configured for GitHub Actions source.

`.github/workflows/keepalive.yml`: `schedule: cron '0 6 * * 1,4'`, one `curl` to a trivial RPC (`select 1` definer function) with the anon key, keeping the free Supabase project from pausing (F5).

Database migrations: `supabase/migrations/*.sql` in the repo, applied with `supabase db push` manually for v1 (one developer, one project). A `SUPABASE_ACCESS_TOKEN`-gated CI job is a fast follow if a second contributor appears; it is a repo secret, never a bundle value.

### basePath and QR implications

`basePath: '/kindsight'` means every QR must encode `https://{owner}.github.io/kindsight/r/?code={CODE}`. The app builds QR URLs from `NEXT_PUBLIC_APP_URL` (set in the workflow env), never from `window.location` on the host machine (which may be localhost during a rehearsal). Trailing-slash routes per section 0. If a custom domain is ever added, only `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_BASE_PATH` change.

### Supabase project setup (once, documented in repo README)

1. Create project (free tier), region closest to expected sessions (Singapore per event context).
2. Enable anonymous sign-ins (Auth settings). **Raise the anonymous sign-in per-IP rate limit** to the M7-validated value (~300/hr) for conference wifi.
3. Disable all other auth providers. Enable email/password signups for hosts. Keep email confirmations off for the current private beta, then revisit before public launch.
4. Enable `pg_cron` and `pgcrypto` extensions.
5. `supabase db push` migrations; run the vitest matrix against the live project once.
6. Realtime: nothing to enable beyond defaults; broadcast-from-database works via the `realtime.messages` policy in migrations.
7. Copy project URL + anon key into GitHub repo variables `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### Keys in a public static bundle

Said explicitly, as required: **the Supabase anon key ships in the public JavaScript bundle and in every browser. This is by design and is not a leak. The anon key only identifies the project and grants the `anon`/`authenticated` Postgres roles, which have zero table grants in this schema. Every read and write is authorized inside Postgres by RLS-backed definer functions keyed on `auth.uid()`. RLS and those functions are the security boundary; there are no other secrets in the bundle.** The only true secrets in the system are the per-room host secret (hashed at rest, shown once to its host) and the optional CI access token (repo secret).

---

## 12. Risk register update

PRD risks revisited, plus new findings (F-numbers referenced throughout the plan).

| # | Risk | Disposition after review |
|---|---|---|
| R1 (PRD 1) | Supabase free tier under a 100-person room | Real, now quantified: three separate ceilings: realtime concurrent connections (200 on free tier: players + hosts + screens across ALL concurrent rooms), messages/sec bursts from note pings, and F4 below. Mitigation: ping-and-pull keeps payloads tiny; M7 load test sets the documented max room size; the plan assumes one active big room at a time on the free project. Residual: multiple simultaneous large rooms need a paid tier; documented, accepted. |
| R2 (PRD 2) | RLS as the only reveal lock | Restructured, materially reduced: default-deny with no client table grants, definer-function API, structural author_id exclusion, trigger backstops, and a launch-blocking adversarial test matrix in CI (section 2). Residual: a bug inside one definer function; contained by the matrix and by function-level review at M2. |
| R3 (PRD 3) | Ritual falls flat on phones | Unchanged by engineering; M0 exists to answer it first with configurable pacing on real phones before anything else is built. |
| R4 (PRD 4) | Rotation self-repair complexity | Closed by scope: powers-of-a-cycle makes generation trivial and correct; late joiners enter next round (pre-approved fallback) with greedy no-repeat repair. Full mid-round splice-in is out of scope. |
| R5 (PRD 5) | Static export limits (secrets, cron, abuse) | Confirmed feasible: no secrets needed client-side (section 11), pg_cron for TTL (section 9), abuse controls in Postgres with named accepted residuals (section 8). |
| F1 (new) | `output: 'export'` forbids runtime dynamic routes; the DRD's `/r/[code]` cannot build | Resolved in plan: query-param routes, QR encodes them (sections 0, 6, 11). |
| F2 (new) | RLS cannot hide columns; naive per-table policies would leak `author_id` to the host and `rotation` to players | Resolved in plan: definer-function API, assignments table, no direct grants (sections 1, 2). This was the single biggest correction to the pre-review architecture sketch. |
| F3 (new) | Rotation schedule readable by players = deanonymization | Resolved: own-current-assignment read path only; host gets progress booleans, never targets (sections 1, 3). Residual: honest-host trust at generation time (section 8.1). |
| F4 (new) | Anonymous sign-in per-IP rate limit (default ~30/hr) vs a whole room joining from one conference NAT IP | Mitigation: raise the limit at project setup, verify in the M7 single-IP join-burst test. Without this, the join flow dies at ~30 players and looks like a mystery outage. |
| F5 (new) | Free Supabase projects pause after ~1 week idle; facilitator arrives to a dead room | Mitigation: scheduled GitHub Actions keepalive plus a pre-event checklist line (sections 9, 11). |
| F6 (new) | `@ducanh2912/next-pwa` is in maintenance mode; basePath + manifest paths are the classic Pages-PWA failure | Mitigation: M7 exit criterion covers SW scope and manifest under `/kindsight/`; `@serwist/next` named as the drop-in fallback. |
| F7 (new) | iOS share-sheet gesture expiry and canvas size caps in the export | Mitigation: pre-render blob before the tap, canvas scale rule, long-press fallback is a first-class path; all three are M1 exit criteria. |
| F8 (new) | Template license terms not present in the docs | Action required: confirm the Envato license type before public launch (section 0). Regular license should suffice for a free end product; verify. |

### Failure-mode spot checks (new codepaths, production realism)

| Path | Realistic failure | Covered by |
|---|---|---|
| submit_note during grace | finalize wins race, note lands in wrong round | Round revalidation raises; client shows discard toast; M4 simulation exercises it |
| finalize_round | host asleep, nobody finalizes | Participant-callable finalize; 60s poll converges UI |
| Realtime silently dead on venue wifi | phases never arrive | Seq-gap refetch + 60s visible-tab poll |
| Reveal trigger vs concurrent kill | player drops under floor mid-click | Trigger recount inside the transaction |
| claim_participant | double-tap, two winners | Atomic conditional update, unique constraints |
| Export tap on iOS | NotAllowedError after async render | Pre-rendered blob, sync share, fallback overlay |
| TTL sweep vs live game at hour 23 | room deleted mid-wrapup | expires_at set at creation +24h; games run hours, not days; host guide notes it; end card handles the vanish gracefully |
| join_room | code collision on create | Server-side generate with retry on unique violation |

### NOT in scope (considered, deferred)

- Full mid-round rotation splice-in for late joiners: next-round entry is pre-approved and materially simpler.
- Private Realtime channels with per-topic RLS: payloads are content-free and topics unguessable; revisit only if payloads ever carry data.
- Supabase Edge Functions for game logic: pg functions cover everything; an edge function appears only as the TTL fallback.
- CI-driven `supabase db push`: manual for a single developer; add with a second contributor.
- Multi-room scale planning, paid-tier sizing, custom domain: after the North Star run.
- AI moderation, accounts, native apps, analytics: PRD out-of-scope list stands.

### What already exists (reused, not rebuilt)

- BrainNest `Screen/Header/Button/InputField/Modal/BlockHeading`, SCSS token system, font pipeline, PWA wiring: reused as-is or extended (section 6).
- Supabase primitives replace all custom infrastructure: anonymous auth (identity), broadcast-from-database (event bus), pg_cron (scheduler), RLS/definer functions (authorization). Zero custom servers, per the locked architecture.
- Sattolo's algorithm replaces any bespoke derangement search (Layer 1 boring-technology pick).

---

## 13. Decisions made in review

Judgment calls made non-interactively, one line each with rationale.

1. **D1: Query-param routes (`/r/?code=`) instead of the DRD's `/r/[code]`.** Static export cannot build runtime dynamic segments; QR encodes the full URL so players never type paths.
2. **D2: No direct table grants; all client access via security-definer RPCs.** RLS cannot hide columns and the core invariants are column-shaped (author_id); structural exclusion beats policy predicates and kills the PostgREST `select=*` footgun.
3. **D3: Rotation stored in an `assignments` table, not a jsonb on rooms.** Visibility must be per-writer per-round; a readable schedule deanonymizes Mode A.
4. **D4: Broadcast-from-database with content-free ping payloads and pull-by-RPC, instead of `postgres_changes`.** Keeps all authorization in Postgres, avoids per-client RLS evaluation costs on the free tier, and makes reconnect the same code path as initial load.
5. **D5: Public broadcast topics keyed by room uuid, one `realtime.messages` select policy.** Payloads carry no content and the uuid is unguessable; private channels add setup cost for no confidentiality gain at this payload design.
6. **D6: No `ended` phase enum; end-and-delete removes rows and clients render the end card from a `room_ended` broadcast or a failed lookup.** Ephemerality is the product promise; a tombstone row contradicts it and the UX cost is one indistinguishable error string for latecomers.
7. **D7: Powers-of-a-single-Sattolo-cycle for the derangement schedule.** Guarantees never-self and never-repeat for all rounds up to n-1 with O(n) generation and no retry loops; independent per-round derangements need cross-round checking for zero benefit.
8. **D8: The 3-note floor is DB-enforced for Mode B only; Mode A gets a console warning plus an `add_round` action.** PRD Resolved Q3 specifies the block for Mode B; hard-blocking Mode A could deadlock a room where grace discards left someone short with no host remedy.
9. **D9: `finalize_round` callable by any claimed participant once grace expires.** Rooms must not stall on a sleeping host laptop; idempotent guard makes racing callers harmless (systems over heroes).
10. **D10: Host reclaim via a secret in the host URL, hashed at rest, rebindable by RPC.** R5 requires surviving total loss of the host device; anon sessions alone cannot, and accounts are out of scope.
11. **D11: ConfirmDialog, StepperInput, Callout, Toast built as thin compositions over Modal/InputField/Button.** Mandated by review scope; the template primitives cover them and 38 net-new components is already the heavy end.
12. **D12: Late joiners enter the next round (pre-approved fallback), with greedy no-repeat regeneration of future rounds.** Full splice-in adds the hardest algorithmic risk in the PRD for a rare event with a designed-for UX (the DRD interstitial already says "you join from the next round").
13. **D13: pg_cron primary for TTL, scheduled Edge Function as fallback.** Keeps cleanup inside Postgres with zero extra deploy surface; both are Supabase primitives permitted by the locked architecture.
14. **D14: Soft validator and grace auto-submit validation run client-side only.** They are UX nudges, not security; duplicating heuristics in SQL adds surface without protecting anything (the DB enforces length, frame, caps, and round validity).
15. **D15: Killed notes are soft-deleted and retained for the room's life, invisible to all read paths except the host feed.** Kill must survive refetch races and remain auditable during the session; cascade delete at room end erases them with everything else.
16. **D16: Bonus notes get `round = null`, `is_bonus = true`, one per round enforced client-side, dedupe and cap enforced in DB.** Keeps rotation guarantees clean (DRD Q5) while the hard limits stay server-side.
17. **D17: Anonymous sign-in rate limit raised at project setup and validated by a single-IP load test.** Default per-IP limits break conference-wifi joins (F4); raising it is a dashboard setting, and the load test sets the number honestly.
18. **D18: Keep `@ducanh2912/next-pwa`, name `@serwist/next` as the fallback.** Minimal diff from the template wins until the M7 verification says otherwise.
19. **D19: Hand-drawn Canvas 2D export, no html2canvas.** Known composition, full control of fonts and CJK wrapping, smaller bundle, fewer iOS surprises; the spike validates the share-sheet and cap edge cases.
20. **D20: Breath duration ships configurable with 3.2s default; M0 felt-test decides.** DRD Q1 already resolved this; the plan encodes it as an M0 exit criterion so it cannot silently default.
21. **D21: Host is not a participant row.** The host never writes or receives notes; conflating roles would complicate every policy predicate for zero feature value.
22. **D22: Server clock skew computed once per snapshot; all timers render from server timestamps.** Phone clocks drift; grace and round windows are game-fairness state and must not depend on device time.

---

## Addendum: background music (added 2026-07-04, after review dispatch; spec in DRD 13.1)

Big screen is the only music surface; player phones keep only the Q7 unlock chime, which has its own per-player mute.

- **Schema:** two columns on `rooms`: `music_mood text null` (null = music off for the room; otherwise names a mood folder) and `music_on boolean not null default true` (live toggle). Both host-writable via the existing settings RPC, both included in the snapshot pull, changes ride the existing content-free ping. No new tables.
- **Playback is client-local on the big screen:** track choice, shuffle, skip, and volume never touch the DB. Only mood and on/off sync, so the console can control the big screen. Skip and volume act directly if the host uses the big-screen window, or ride a broadcast ping if controlled from the console.
- **Phase coupling (client logic, big screen):** lobby/writing/wrapup play their folder sets on shuffle-loop; briefing ducks to 20% volume; reveal transition triggers a 2s fade-out and removes all music controls until the highlight wall. The fade is driven by the same phase event as the interstitial, no extra state.
- **User-facing mute and play (explicit requirement):** the host console and the big-screen window both carry play/pause, mute, volume, and skip at all times outside Reveal. Players get a mute toggle for the unlock chime on the reveal screen itself, and muted devices never autoplay anything. All mute states and the volume level persist for the session (localStorage), so a muted rehearsal stays muted in the real run and a soundcheck volume carries into the live session. The volume control is a continuous slider (0 to 100), not steps; briefing auto-duck multiplies the host's set volume rather than overriding it, and the host can adjust volume live during any playing phase without touching the mood or track.
- **Assets:** static files under `assets/music/{lobby,writing,wrapup}/`, optional style subfolders become the mood picker options at build time. Keep total under ~40 MB (Pages bundle). License note per track required in `assets/music/README` before public launch (extends F8).
- **Autoplay policy:** big screen arms audio on the host's first click; an unarmed big screen shows "click to enable sound" (DRD 13.1). No audio on player surfaces except the chime, which fires inside a user-gesture-derived context (the hold release).
- **Milestone impact:** lands in M6 (big screen) with one added exit criterion: the reveal trigger provably kills audio within 2s in the same tick as the interstitial, and no control path can restart it before the highlight wall.

*Next step: `/scrum` for sprint planning against milestones M0 to M8. Before public launch: confirm the template license (F8) and the music track licenses.*
