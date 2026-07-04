-- Kindsight M2 migration 3: triggers (ENG-PLAN sections 2, 4, 5, 8).
-- Row-shaped rules live here so no single RPC bug can violate them:
-- forward-only host-only phase moves, seq bump plus content-free pings,
-- note caps, spacing, and dedupe.

-- Phase state machine (ENG-PLAN section 5, DRD 2.1):
--
--  LOBBY -> BRIEFING -> WRITING -> REVEAL -> WRAPUP -> (delete)
--
-- No skips, no backward moves, no 'ended' phase (D6).

create or replace function public.kindsight_next_phase(p_phase public.room_phase)
returns public.room_phase
language sql
immutable
as $$
  select case p_phase
    when 'lobby'    then 'briefing'::public.room_phase
    when 'briefing' then 'writing'::public.room_phase
    when 'writing'  then 'reveal'::public.room_phase
    when 'reveal'   then 'wrapup'::public.room_phase
    else null
  end
$$;

-- Content-free broadcast ping. realtime.send exists only on Supabase stacks;
-- on plain Postgres (and on any transient realtime failure) fall back to
-- pg_notify so a game write is never aborted by the event bus.
create or replace function public.kindsight_notify(
  p_room_id uuid,
  p_event   text,
  p_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
begin
  begin
    perform realtime.send(coalesce(p_payload, '{}'::jsonb), p_event, 'room:' || p_room_id::text, false);
  exception when others then
    perform pg_notify(
      'kindsight',
      jsonb_build_object('topic', 'room:' || p_room_id::text, 'event', p_event, 'payload', p_payload)::text
    );
  end;
end
$$;

alter function public.kindsight_notify(uuid, text, jsonb) owner to kindsight_api;

-- Bumps rooms.updated_seq via the before-update trigger below and returns the
-- new value. Returns null when the room row is already gone (cascade teardown),
-- which callers use to skip pings.
create or replace function public.kindsight_bump_seq(p_room_id uuid)
returns bigint
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_seq bigint;
begin
  update public.rooms set updated_seq = updated_seq where id = p_room_id
  returning updated_seq into v_seq;
  return v_seq;
end
$$;

alter function public.kindsight_bump_seq(uuid) owner to kindsight_api;

create or replace function public.rooms_bump_seq()
returns trigger
language plpgsql
as $$
begin
  new.updated_seq := old.updated_seq + 1;
  return new;
end
$$;

alter function public.rooms_bump_seq() owner to kindsight_api;

create trigger rooms_a_bump_seq
before update on public.rooms
for each row execute function public.rooms_bump_seq();

create or replace function public.rooms_phase_guard()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_under_floor text;
begin
  if new.phase is distinct from old.phase then
    if auth.uid() is null or auth.uid() <> old.host_id then
      raise exception 'only the host can change the phase' using errcode = '42501';
    end if;

    if new.phase is distinct from public.kindsight_next_phase(old.phase) then
      raise exception 'phase can only advance to the next phase';
    end if;

    -- Mode A cannot enter briefing without a complete rotation schedule.
    if old.phase = 'lobby' and old.mode = 'round_robin' then
      if old.round_count is null or (
        select count(distinct a.round)
        from public.assignments a
        where a.room_id = old.id and a.round between 1 and old.round_count
      ) <> old.round_count then
        raise exception 'rotation schedule incomplete';
      end if;
    end if;

    -- Mode B reveal floor (D8): every claimed participant needs 3+ live notes.
    -- Mode A is warned in the console instead, never DB-blocked.
    if old.phase = 'writing' and old.mode = 'free_select' then
      select string_agg(p.display_name, ', ' order by p.display_name)
      into v_under_floor
      from public.participants p
      where p.room_id = old.id
        and p.claimed_by is not null
        and (
          select count(*) from public.notes n
          where n.target_id = p.id and not n.killed
        ) < 3;
      if v_under_floor is not null then
        raise exception 'reveal floor not met' using detail = v_under_floor;
      end if;
    end if;
  end if;

  return new;
end
$$;

alter function public.rooms_phase_guard() owner to kindsight_api;

create trigger rooms_b_phase_guard
before update on public.rooms
for each row execute function public.rooms_phase_guard();

-- 'room' broadcast: fires only when game-state columns changed, so seq-only
-- bumps from roster and note pings do not echo a spurious room event.
create or replace function public.rooms_broadcast()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
begin
  if (old.phase, old.current_round, old.round_count, old.round_started_at,
      old.timer_paused_at, old.grace_until, old.highlight_enabled,
      old.music_mood, old.music_on)
     is distinct from
     (new.phase, new.current_round, new.round_count, new.round_started_at,
      new.timer_paused_at, new.grace_until, new.highlight_enabled,
      new.music_mood, new.music_on) then
    perform public.kindsight_notify(new.id, 'room', jsonb_build_object(
      'phase', new.phase,
      'current_round', new.current_round,
      'round_count', new.round_count,
      'round_started_at', new.round_started_at,
      'timer_paused_at', new.timer_paused_at,
      'grace_until', new.grace_until,
      'highlight_enabled', new.highlight_enabled,
      'music_mood', new.music_mood,
      'music_on', new.music_on,
      'writing_done', (new.mode = 'round_robin' and new.phase = 'writing'
                       and new.round_count is not null
                       and new.current_round >= new.round_count
                       and new.grace_until is null
                       and new.current_round > 0),
      'seq', new.updated_seq
    ));
  end if;
  return null;
end
$$;

alter function public.rooms_broadcast() owner to kindsight_api;

create trigger rooms_c_broadcast
after update on public.rooms
for each row execute function public.rooms_broadcast();

-- Note hard limits (ENG-PLAN section 8). Fires on every insert path, so a
-- future RPC that forgets a check is still capped here.
create or replace function public.notes_validate()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_room        public.rooms%rowtype;
  v_author_room uuid;
  v_target_room uuid;
  v_live        int;
  v_last        timestamptz;
  -- GUC override exists for tests only; clients have no way to set GUCs.
  v_interval_ms int := coalesce(nullif(current_setting('kindsight.min_note_interval_ms', true), '')::int, 3000);
begin
  select * into v_room from public.rooms where id = new.room_id;
  select room_id into v_author_room from public.participants where id = new.author_id;
  select room_id into v_target_room from public.participants where id = new.target_id;

  if v_author_room is distinct from new.room_id or v_target_room is distinct from new.room_id then
    raise exception 'author and target must belong to the room';
  end if;

  select count(*) into v_live
  from public.notes
  where room_id = new.room_id and author_id = new.author_id and not killed;
  if v_live >= v_room.notes_author_cap then
    raise exception 'note cap reached';
  end if;

  select max(created_at) into v_last
  from public.notes
  where room_id = new.room_id and author_id = new.author_id;
  if v_interval_ms > 0 and v_last is not null
     and v_last > clock_timestamp() - make_interval(secs => v_interval_ms / 1000.0) then
    raise exception 'notes are arriving too fast';
  end if;

  -- Bonus notes and all Mode B notes: one live note per author per target (D16).
  if new.is_bonus or v_room.mode = 'free_select' then
    if exists (
      select 1 from public.notes
      where room_id = new.room_id and author_id = new.author_id
        and target_id = new.target_id and not killed
    ) then
      raise exception 'duplicate note to this target';
    end if;
  end if;

  return new;
end
$$;

alter function public.notes_validate() owner to kindsight_api;

create trigger notes_a_validate
before insert on public.notes
for each row execute function public.notes_validate();

-- 'notes' ping on insert, kill, and share toggle. Content-free: seq only.
create or replace function public.notes_ping()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_seq bigint;
begin
  if tg_op = 'UPDATE'
     and old.killed = new.killed
     and old.shared_to_wall = new.shared_to_wall then
    return null;
  end if;
  v_seq := public.kindsight_bump_seq(new.room_id);
  if v_seq is not null then
    perform public.kindsight_notify(new.room_id, 'notes', jsonb_build_object('seq', v_seq));
  end if;
  return null;
end
$$;

alter function public.notes_ping() owner to kindsight_api;

create trigger notes_b_ping
after insert or update on public.notes
for each row execute function public.notes_ping();

-- 'roster' ping on membership changes, 'reveal' ping on reveal_state changes.
create or replace function public.participants_ping()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_row   public.participants%rowtype;
  v_event text := 'roster';
  v_seq   bigint;
begin
  if tg_op = 'DELETE' then
    v_row := old;
  else
    v_row := new;
  end if;
  if tg_op = 'UPDATE' and old.reveal_state is distinct from new.reveal_state then
    v_event := 'reveal';
  end if;
  -- null seq means the room is mid-cascade-delete; no ping.
  v_seq := public.kindsight_bump_seq(v_row.room_id);
  if v_seq is not null then
    perform public.kindsight_notify(v_row.room_id, v_event, jsonb_build_object('seq', v_seq));
  end if;
  return null;
end
$$;

alter function public.participants_ping() owner to kindsight_api;

create trigger participants_a_ping
after insert or update or delete on public.participants
for each row execute function public.participants_ping();
