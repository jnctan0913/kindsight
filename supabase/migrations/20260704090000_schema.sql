-- Kindsight M2 migration 1: extensions, roles, enums, tables, indexes.
-- Spec: docs/ENG-PLAN.md section 1 plus the music addendum (two rooms columns).

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- auth.uid() shim so migrations and tests can run on plain Postgres.
-- On Supabase the auth schema and function already exist and this is a no-op.
do $$
begin
  if not exists (select 1 from pg_namespace where nspname = 'auth') then
    create schema auth;
  end if;
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'auth' and p.proname = 'uid'
  ) then
    execute $fn$
      create function auth.uid() returns uuid
      language sql stable
      as $body$
        select nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
      $body$
    $fn$;
  end if;
end
$$;

-- anon / authenticated exist on Supabase; created here only for plain-Postgres runs.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end
$$;

-- Dedicated owner for tables and the definer-function API (ENG-PLAN section 2).
-- Owning the tables is what lets the security-definer functions bypass the
-- no-policy RLS below; the migration role stays a member so later DDL works.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'kindsight_api') then
    create role kindsight_api nologin;
  end if;
  execute format('grant kindsight_api to %I', current_user);
  -- Membership in authenticated carries the hosted grants kindsight_api
  -- cannot receive directly (usage on realtime for realtime.send). Hosted
  -- Supabase may refuse; kindsight_notify degrades to pg_notify then.
  begin
    grant authenticated to kindsight_api;
  exception when others then
    raise notice 'grant authenticated to kindsight_api skipped: %', sqlerrm;
  end;
end
$$;

-- create on public: receiving table ownership requires it on hosted Supabase.
grant usage, create on schema public to kindsight_api;
grant usage on schema extensions to kindsight_api;

-- GUC-based caller identity, equivalent to auth.uid(). Self-contained on
-- purpose: the hosted migration role cannot grant kindsight_api usage on
-- the auth schema, so definer functions must not depend on it.
create or replace function public.kindsight_uid()
returns uuid
language sql
stable
as $$
  select nullif(coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
  ), '')::uuid
$$;

create type public.room_mode  as enum ('round_robin', 'free_select');
create type public.room_phase as enum ('lobby', 'briefing', 'writing', 'reveal', 'wrapup');
create type public.note_frame as enum ('moment', 'strength', 'wish');
create type public.reveal_state as enum ('locked', 'holding', 'reading', 'done');

create table public.rooms (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  mode              public.room_mode not null,
  phase             public.room_phase not null default 'lobby',
  host_id           uuid not null,
  host_secret_hash  text not null,
  round_count       int check (round_count between 1 and 12),
  round_seconds     int not null default 180,
  current_round     int not null default 0,
  round_started_at  timestamptz,
  timer_paused_at   timestamptz,
  grace_until       timestamptz,
  highlight_enabled boolean not null default false,
  notes_author_cap  int not null default 20,
  updated_seq       bigint not null default 0,
  music_mood        text check (music_mood is null or char_length(music_mood) between 1 and 40),
  music_on          boolean not null default true,
  created_at        timestamptz not null default now(),
  expires_at        timestamptz not null default now() + interval '24 hours'
);

create index rooms_expires_at_idx on public.rooms (expires_at);

create table public.participants (
  id           uuid primary key default gen_random_uuid(),
  room_id      uuid not null references public.rooms (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  claimed_by   uuid,
  claimed_at   timestamptz,
  joined_round int,
  reveal_state public.reveal_state not null default 'locked',
  created_at   timestamptz not null default now(),
  unique (room_id, display_name),
  unique (room_id, claimed_by)
);

create index participants_room_id_idx on public.participants (room_id);

create table public.assignments (
  room_id   uuid not null references public.rooms (id) on delete cascade,
  round     int not null,
  writer_id uuid not null references public.participants (id) on delete cascade,
  target_id uuid not null references public.participants (id) on delete cascade,
  primary key (room_id, round, writer_id),
  -- each round is a permutation, so targets are unique per round too
  unique (room_id, round, target_id),
  check (writer_id <> target_id)
);

create table public.notes (
  id             uuid primary key default gen_random_uuid(),
  room_id        uuid not null references public.rooms (id) on delete cascade,
  -- author_id never crosses the API boundary; kept for rate limiting,
  -- moderation forensics, and Mode A submission validation only.
  author_id      uuid not null references public.participants (id) on delete cascade,
  target_id      uuid not null references public.participants (id) on delete cascade,
  frame          public.note_frame not null,
  content        text not null check (char_length(content) between 1 and 280),
  round          int,
  is_bonus       boolean not null default false,
  shared_to_wall boolean not null default false,
  killed         boolean not null default false,
  created_at     timestamptz not null default now(),
  check (author_id <> target_id)
);

create index notes_room_id_idx on public.notes (room_id);
create index notes_target_live_idx on public.notes (target_id) where not killed;
create index notes_room_author_idx on public.notes (room_id, author_id);
create index notes_highlight_idx on public.notes (room_id) where shared_to_wall and not killed;

create table public.rooms_attempts (
  uid          uuid not null,
  window_start timestamptz not null,
  count        int not null default 1,
  primary key (uid, window_start)
);

alter function public.kindsight_uid() owner to kindsight_api;

alter table public.rooms          owner to kindsight_api;
alter table public.participants   owner to kindsight_api;
alter table public.assignments    owner to kindsight_api;
alter table public.notes          owner to kindsight_api;
alter table public.rooms_attempts owner to kindsight_api;
