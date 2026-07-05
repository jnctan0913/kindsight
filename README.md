# Kindsight

**A digital adaptation of the physical icebreaker "你背后的光" (The Light Behind You).**

Players anonymously write kind, specific observations about each other, then each person reveals their own "wall" of notes in a deliberate, ritual moment. Built for teams, workshops, and conference groups.

**Live:** https://jnctan0913.github.io/kindsight/

---

## Why

Facilitators run the paper version because the reveal moment is powerful: a wall of anonymous kindness, read in silence. Paper undermines it: handwriting breaks anonymity, coverage is uneven (popular people fill a page while quiet people get two notes), nothing survives the session, and the host has to roam the room policing quality instead of holding it.

Kindsight keeps what makes the game work (the ritual pause, specific warmth, trusted anonymity) and fixes the frictions.

## How it works

Three surfaces stay in sync off one server-side room phase:

- **Player app** — mobile-first PWA. Join by QR or code, write notes, reveal your wall.
- **Host console** — desktop-first control room. Roster, round/timer control, live coverage, moderation, sharing prompts, highlight wall, session settings.
- **Big screen** — projector view. Briefing, timers, the reveal ritual, and the shared highlight wall.

### Game flow (host-controlled, forward-only)

1. **Lobby** — host creates the room and roster; players join and claim a name.
2. **Briefing** — the rules and three writing frames appear on phones and the big screen.
3. **Writing** — players write anonymous kind notes, timed per round.
4. **Reveal** — each player unlocks their own wall after a ritual pause (hold through a three-breaths animation), then notes appear one by one.
5. **Wrap-up** — optional voluntary sharing prompts and highlight wall on the big screen, then a closing message.

### Writing frames (choose one per note)

- **Moment** — "I noticed you..."
- **Strength** — "I think you're strong at..."
- **Wish** — "I hope you..."

### Writing modes (host picks at creation)

- **Mode A, Round-robin** — the app generates a derangement per round (never yourself, never a repeated target) so coverage is even. Rounds advance by timer or manually.
- **Mode B, Free-select** — players pick anyone; the console shows a live coverage bar so the host can nudge under-written people.

## Anonymity is a hard invariant

Notes are anonymous to humans forever. `author_id` is stored only for moderation and rate limiting, never exposed, and no note is visible to its subject before the reveal phase. This is enforced in Postgres with Row Level Security and security-definer RPCs, not just client code.

## Tech stack

- **Next.js 15** (App Router, static export) + **React 19** + **TypeScript**
- **Supabase** (Postgres, Realtime, anonymous auth). No custom server; game rules live in RLS policies, triggers, and RPCs.
- **Zustand** + **immer** for state, **SCSS** modules, **swiper**, custom i18n (English + 中文)
- **PWA** via `@ducanh2912/next-pwa`
- Hosted on **GitHub Pages** under the `/kindsight` base path; deployed by GitHub Actions.

## Getting started

Requires Node 20+.

```bash
# 1. Install
npm install

# 2. Configure Supabase (public values)
cp .env.local.example .env.local
# then fill in:
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY

# 3. Run the dev server
npm run dev
```

Open http://localhost:3000 for the player app, `/host` for the console, and `/screen?code=XXXX` for the big screen.

### Database

Schema, RLS, and RPCs live in `supabase/migrations/`. Apply them to your project with the Supabase CLI:

```bash
supabase db push --linked
```

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Dev server (Turbopack, separate `.next-dev` dist) |
| `npm run build` | Production static export to `out/` |
| `npm run lint` | Next.js lint |
| `npm run gen:music` | Regenerate the music manifest from `public/music/` |

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the static export with `NEXT_PUBLIC_BASE_PATH=/kindsight` and publishes to GitHub Pages. Supabase keys come from repo variables.

## Project structure

```
src/
  app/
    r/         player web app (PWA)
    host/      host console
    screen/    projector big screen
  components/  shared UI
  lib/         api client, realtime, types, sync helpers
  i18n/        strings (en + zh) and locale context
supabase/migrations/   schema, RLS, RPCs
docs/          PRD, DRD, engineering + sprint plans, copy, host guide
```

## Documentation

Product and engineering docs live in [`docs/`](docs/): the PRD, design requirements (DRD), engineering plan, sprint plan, copy deck, and host guide.

## Notes

Rooms are ephemeral (host end-and-delete plus a 24h TTL) and there are no user accounts. A reference marketplace template used during design is licensed content and is gitignored, never published.
