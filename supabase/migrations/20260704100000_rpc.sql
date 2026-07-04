-- Kindsight M2 migration 4: the security-definer RPC layer (ENG-PLAN section 2, D2).
-- Every client read and write goes through these functions. Each one:
--   * security definer, owned by kindsight_api (table owner, bypasses the
--     no-policy RLS below it),
--   * set search_path = '' (everything schema-qualified),
--   * derives identity from public.kindsight_uid() only; no client-supplied identity,
--   * never returns author_id, host_secret_hash, claimed_by, or host_id.
-- Grants: revoke-all then grant execute to authenticated only (clients sign in
-- anonymously first). Helpers get no grants at all.

-- ---------------------------------------------------------------------------
-- Helpers (internal, never granted)
-- ---------------------------------------------------------------------------

-- Failed-lookup rate cap (ENG-PLAN section 8): 20 per minute per session,
-- shared by join_room, get_bigscreen_state, and reclaim_host failures.
create or replace function public.kindsight_rate_limit(p_uid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  insert into public.rooms_attempts as ra (uid, window_start, count)
  values (p_uid, date_trunc('minute', now()), 1)
  on conflict (uid, window_start) do update set count = ra.count + 1
  returning ra.count into v_count;
  if v_count > 20 then
    raise exception 'too many attempts, slow down' using errcode = '54000';
  end if;
end
$$;

create or replace function public.kindsight_rate_check(p_uid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  select ra.count into v_count
  from public.rooms_attempts ra
  where ra.uid = p_uid and ra.window_start = date_trunc('minute', now());
  if coalesce(v_count, 0) >= 20 then
    raise exception 'too many attempts, slow down' using errcode = '54000';
  end if;
end
$$;

-- Public subset of a room row. Never host_id, host_secret_hash, or
-- notes_author_cap (the host snapshot adds the cap separately).
create or replace function public.kindsight_room_public(v public.rooms)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'room_id',           v.id,
    'code',              v.code,
    'mode',              v.mode,
    'phase',             v.phase,
    'current_round',     v.current_round,
    'round_count',       v.round_count,
    'round_seconds',     v.round_seconds,
    'round_started_at',  v.round_started_at,
    'timer_paused_at',   v.timer_paused_at,
    'grace_until',       v.grace_until,
    'highlight_enabled', v.highlight_enabled,
    'music_mood',        v.music_mood,
    'music_on',          v.music_on,
    'seq',               v.updated_seq,
    'expires_at',        v.expires_at
  )
$$;

-- Roster: names and a claimed boolean only. claimed_by never crosses out.
create or replace function public.kindsight_roster(p_room_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'participant_id', p.id,
           'display_name',   p.display_name,
           'claimed',        p.claimed_by is not null
         ) order by p.created_at, p.display_name), '[]'::jsonb)
  from public.participants p
  where p.room_id = p_room_id
$$;

-- Live room row or a raised exception. Expired rooms are inert (section 9).
create or replace function public.kindsight_live_room(p_room_id uuid, p_lock boolean default false)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.rooms%rowtype;
begin
  if p_lock then
    select * into v_room from public.rooms where id = p_room_id for update;
  else
    select * into v_room from public.rooms where id = p_room_id;
  end if;
  if not found or v_room.expires_at <= now() then
    raise exception 'room not found' using errcode = 'P0002';
  end if;
  return v_room;
end
$$;

-- Caller's claimed participant in the room, or a raised exception.
create or replace function public.kindsight_caller_participant(p_room_id uuid)
returns public.participants
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_part public.participants%rowtype;
begin
  select * into v_part
  from public.participants
  where room_id = p_room_id and claimed_by = public.kindsight_uid();
  if not found then
    raise exception 'not a claimed participant in this room' using errcode = '42501';
  end if;
  return v_part;
end
$$;

-- Rotation schedule generation (D7). A uniformly random ordering linked into
-- a single cycle is a uniformly random n-cycle (Sattolo's distribution).
-- Round k assigns writer i the element k steps ahead in the cycle, so:
--   * never yourself: sigma^k has no fixed point for 0 < k < n,
--   * never a repeated target across rounds: sigma^k(i) <> sigma^j(i).
--
--   Roster: A B C D E F      cycle: A->D->B->F->C->E->A
--   Round 1 (k=1): A->D, D->B, B->F, F->C, C->E, E->A
--   Round 2 (k=2): A->B, D->F, B->C, F->E, C->A, E->D
create or replace function public.kindsight_generate_assignments(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room   public.rooms%rowtype;
  v_ids    uuid[];
  v_n      int;
  v_rounds int;
  v_k      int;
  v_i      int;
begin
  select * into v_room from public.rooms where id = p_room_id;
  if v_room.mode <> 'round_robin' then
    return;
  end if;
  if exists (select 1 from public.assignments where room_id = p_room_id) then
    return;
  end if;

  select array_agg(p.id order by random()) into v_ids
  from public.participants p
  where p.room_id = p_room_id and p.claimed_by is not null;

  v_n := coalesce(array_length(v_ids, 1), 0);
  if v_n < 2 then
    raise exception 'rotation needs at least 2 claimed participants';
  end if;

  v_rounds := least(coalesce(v_room.round_count, 1), v_n - 1);
  if v_rounds is distinct from v_room.round_count then
    update public.rooms set round_count = v_rounds where id = p_room_id;
  end if;

  for v_k in 1..v_rounds loop
    for v_i in 1..v_n loop
      insert into public.assignments (room_id, round, writer_id, target_id)
      values (p_room_id, v_k, v_ids[v_i], v_ids[((v_i - 1 + v_k) % v_n) + 1]);
    end loop;
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- Room lifecycle
-- ---------------------------------------------------------------------------

-- Creates the room, generates the code server-side (retry on collision),
-- mints and hashes the host reclaim secret (D10), inserts the roster.
-- The plaintext secret is returned exactly once, here, to its creator.
create or replace function public.create_room(
  p_mode          public.room_mode,
  p_names         text[] default '{}',
  p_round_count   int default null,
  p_round_seconds int default 180
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code     text;
  v_bytes    bytea;
  v_secret   text;
  v_room     public.rooms%rowtype;
  v_name     text;
  v_i        int;
  v_try      int := 0;
begin
  if public.kindsight_uid() is null then
    raise exception 'sign in first' using errcode = '42501';
  end if;
  if p_mode = 'round_robin' and (p_round_count is null or p_round_count not between 1 and 12) then
    raise exception 'round_robin rooms need a round_count between 1 and 12';
  end if;
  if p_round_seconds not between 30 and 3600 then
    raise exception 'round_seconds must be between 30 and 3600';
  end if;
  if coalesce(array_length(p_names, 1), 0) > 200 then
    raise exception 'roster too large';
  end if;

  v_secret := encode(extensions.gen_random_bytes(16), 'hex');

  loop
    v_try := v_try + 1;
    v_bytes := extensions.gen_random_bytes(6);
    v_code := '';
    for v_i in 0..5 loop
      v_code := v_code || substr(v_alphabet, (get_byte(v_bytes, v_i) % 32) + 1, 1);
    end loop;
    begin
      insert into public.rooms (code, mode, host_id, host_secret_hash, round_count, round_seconds)
      values (
        v_code, p_mode, public.kindsight_uid(),
        extensions.crypt(v_secret, extensions.gen_salt('bf')),
        case when p_mode = 'round_robin' then p_round_count else null end,
        p_round_seconds
      )
      returning * into v_room;
      exit;
    exception when unique_violation then
      if v_try >= 20 then
        raise exception 'could not allocate a room code';
      end if;
    end;
  end loop;

  foreach v_name in array p_names loop
    v_name := btrim(v_name);
    if char_length(v_name) not between 1 and 40 then
      raise exception 'display names must be 1 to 40 characters';
    end if;
    begin
      insert into public.participants (room_id, display_name) values (v_room.id, v_name);
    exception when unique_violation then
      raise exception 'duplicate name in roster: %', v_name;
    end;
  end loop;

  return public.kindsight_room_public(v_room)
       || jsonb_build_object(
            'host_secret', v_secret,
            'roster',      public.kindsight_roster(v_room.id),
            'server_now',  now()
          );
end
$$;

-- Code lookup for players, joiners, and screens. Failed lookups are
-- attempt-capped; a session over the cap is refused before the lookup.
-- A bad code returns {found: false} rather than raising: a raise would roll
-- back the very ledger insert that counts the failure, so the cap could
-- never trip. The cap itself raises (prior failures are already committed).
create or replace function public.join_room(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.rooms%rowtype;
begin
  if public.kindsight_uid() is null then
    raise exception 'sign in first' using errcode = '42501';
  end if;
  perform public.kindsight_rate_check(public.kindsight_uid());

  select * into v_room
  from public.rooms
  where code = upper(btrim(p_code)) and expires_at > now();
  if not found then
    perform public.kindsight_rate_limit(public.kindsight_uid());
    return jsonb_build_object('found', false, 'server_now', now());
  end if;

  return public.kindsight_room_public(v_room)
       || jsonb_build_object(
            'found',      true,
            'roster',     public.kindsight_roster(v_room.id),
            'server_now', now()
          );
end
$$;

-- Atomic name claim (section 8): row count decides the race. One name per
-- session per room via the unique constraint. Late Mode A joiners get
-- joined_round = current_round + 1 (D12).
create or replace function public.claim_name(p_participant_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_part public.participants%rowtype;
  v_room public.rooms%rowtype;
begin
  if public.kindsight_uid() is null then
    raise exception 'sign in first' using errcode = '42501';
  end if;

  select * into v_part from public.participants where id = p_participant_id;
  if not found then
    raise exception 'name not found' using errcode = 'P0002';
  end if;
  v_room := public.kindsight_live_room(v_part.room_id);

  if v_room.phase not in ('lobby', 'briefing', 'writing') then
    raise exception 'joining is closed for this room';
  end if;

  begin
    update public.participants
    set claimed_by   = public.kindsight_uid(),
        claimed_at   = now(),
        joined_round = case
          when v_room.mode = 'round_robin' and v_room.phase = 'writing' and v_room.current_round >= 1
          then v_room.current_round + 1
          else joined_round
        end
    where id = p_participant_id and claimed_by is null
    returning * into v_part;
  exception when unique_violation then
    raise exception 'you already claimed a name in this room';
  end;
  if not found then
    raise exception 'name already claimed';
  end if;

  return jsonb_build_object(
    'participant_id', v_part.id,
    'display_name',   v_part.display_name,
    'joined_round',   v_part.joined_round,
    'server_now',     now()
  );
end
$$;

-- Role-aware snapshot: the one pull behind every ping (section 4). Includes
-- server_now so clients compute clock skew once (D22). Never note content:
-- walls stay behind get_my_wall's reveal gate.
create or replace function public.get_snapshot(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.rooms%rowtype;
  v_me   public.participants%rowtype;
  v_base jsonb;
begin
  v_room := public.kindsight_live_room(p_room_id);

  v_base := public.kindsight_room_public(v_room)
         || jsonb_build_object(
              'roster',     public.kindsight_roster(v_room.id),
              'server_now', now()
            );

  if v_room.host_id = public.kindsight_uid() then
    return v_base || jsonb_build_object(
      'role',             'host',
      'notes_author_cap', v_room.notes_author_cap,
      'assignments_ready', exists (select 1 from public.assignments a where a.room_id = v_room.id),
      'coverage', (
        select coalesce(jsonb_agg(jsonb_build_object(
                 'participant_id', p.id,
                 'display_name',   p.display_name,
                 'claimed',        p.claimed_by is not null,
                 'joined_round',   p.joined_round,
                 'reveal_state',   p.reveal_state,
                 'live_count', (
                   select count(*) from public.notes n
                   where n.target_id = p.id and not n.killed
                 ),
                 'submitted_this_round', case
                   when v_room.mode = 'round_robin' and v_room.current_round >= 1 then exists (
                     select 1 from public.notes n
                     where n.author_id = p.id and n.round = v_room.current_round
                       and not n.is_bonus and not n.killed
                   )
                 end
               ) order by p.display_name), '[]'::jsonb)
        from public.participants p
        where p.room_id = v_room.id
      )
    );
  end if;

  select * into v_me
  from public.participants
  where room_id = v_room.id and claimed_by = public.kindsight_uid();

  if found then
    return v_base || jsonb_build_object(
      'role', 'player',
      'me', jsonb_build_object(
        'participant_id', v_me.id,
        'display_name',   v_me.display_name,
        'joined_round',   v_me.joined_round,
        'reveal_state',   v_me.reveal_state,
        'wall_count', (
          select count(*) from public.notes n
          where n.target_id = v_me.id and not n.killed
        ),
        'sent', (
          select coalesce(jsonb_agg(jsonb_build_object(
                   'target_id', n.target_id,
                   'frame',     n.frame,
                   'is_bonus',  n.is_bonus,
                   'round',     n.round
                 ) order by n.created_at), '[]'::jsonb)
          from public.notes n
          where n.room_id = v_room.id and n.author_id = v_me.id and not n.killed
        ),
        'assignment', case
          when v_room.mode = 'round_robin' and v_room.phase = 'writing' and v_room.current_round >= 1 then (
            select jsonb_build_object('target_id', t.id, 'display_name', t.display_name)
            from public.assignments a
            join public.participants t on t.id = a.target_id
            where a.room_id = v_room.id and a.round = v_room.current_round and a.writer_id = v_me.id
          )
        end
      )
    );
  end if;

  -- Joiner: knows the room uuid (obtainable only via a valid code), no claim yet.
  return v_base || jsonb_build_object('role', 'joiner');
end
$$;

-- ---------------------------------------------------------------------------
-- Phase and round engine
-- ---------------------------------------------------------------------------

-- Host-only, forward-only (the trigger enforces both independently).
-- Mode A briefing -> writing: generates the rotation schedule server-side
-- (D7) and starts round 1.
create or replace function public.advance_phase(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.rooms%rowtype;
  v_next public.room_phase;
begin
  v_room := public.kindsight_live_room(p_room_id, true);
  if v_room.host_id is distinct from public.kindsight_uid() then
    raise exception 'only the host can change the phase' using errcode = '42501';
  end if;

  v_next := public.kindsight_next_phase(v_room.phase);
  if v_next is null then
    raise exception 'no phase after wrapup; use end_room';
  end if;

  if v_room.phase = 'briefing' and v_room.mode = 'round_robin' then
    perform public.kindsight_generate_assignments(v_room.id);
    update public.rooms
    set phase = v_next, current_round = 1, round_started_at = now(),
        grace_until = null, timer_paused_at = null
    where id = v_room.id
    returning * into v_room;
  elsif v_room.phase = 'briefing' then
    update public.rooms
    set phase = v_next, round_started_at = now()
    where id = v_room.id
    returning * into v_room;
  else
    update public.rooms set phase = v_next where id = v_room.id
    returning * into v_room;
  end if;

  return public.kindsight_room_public(v_room) || jsonb_build_object('server_now', now());
end
$$;

-- Host-only: opens the 10s grace window that ends the current round
-- (ENG-PLAN section 3 advance mechanics). No-op if grace already runs.
create or replace function public.start_round(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.rooms%rowtype;
begin
  v_room := public.kindsight_live_room(p_room_id, true);
  if v_room.host_id is distinct from public.kindsight_uid() then
    raise exception 'only the host can advance the round' using errcode = '42501';
  end if;
  if v_room.mode <> 'round_robin' or v_room.phase <> 'writing' or v_room.current_round < 1 then
    raise exception 'no round is running';
  end if;
  if v_room.timer_paused_at is not null then
    raise exception 'resume the timer first';
  end if;

  if v_room.grace_until is null or v_room.grace_until <= now() then
    update public.rooms
    set grace_until = now() + interval '10 seconds'
    where id = v_room.id
    returning * into v_room;
  end if;

  return public.kindsight_room_public(v_room) || jsonb_build_object('server_now', now());
end
$$;

-- Post-grace round advance. Callable by the host or any claimed participant
-- (D9): rooms must not stall on a sleeping host laptop. Idempotent: no-ops
-- while grace is absent or still running, so racing callers are harmless.
-- Past the last round it parks at round_count; the broadcast carries
-- writing_done and the host advances the phase.
create or replace function public.finalize_round(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.rooms%rowtype;
begin
  v_room := public.kindsight_live_room(p_room_id, true);
  if v_room.host_id is distinct from public.kindsight_uid()
     and not exists (
       select 1 from public.participants
       where room_id = v_room.id and claimed_by = public.kindsight_uid()
     ) then
    raise exception 'not a member of this room' using errcode = '42501';
  end if;

  if v_room.mode = 'round_robin' and v_room.phase = 'writing'
     and v_room.grace_until is not null and v_room.grace_until <= now() then
    if v_room.current_round >= coalesce(v_room.round_count, v_room.current_round) then
      update public.rooms set grace_until = null where id = v_room.id
      returning * into v_room;
    else
      update public.rooms
      set current_round = current_round + 1, grace_until = null, round_started_at = now()
      where id = v_room.id
      returning * into v_room;
    end if;
  end if;

  return public.kindsight_room_public(v_room) || jsonb_build_object('server_now', now());
end
$$;

-- Host-only recovery action (D8): one more rotation round, computed as the
-- next power of the stored cycle (round k+1 target = round-1 mapping applied
-- to the round-k target).
create or replace function public.add_round(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.rooms%rowtype;
  v_n    int;
  v_new  int;
begin
  v_room := public.kindsight_live_room(p_room_id, true);
  if v_room.host_id is distinct from public.kindsight_uid() then
    raise exception 'only the host can add a round' using errcode = '42501';
  end if;
  if v_room.mode <> 'round_robin' or v_room.phase not in ('briefing', 'writing') then
    raise exception 'rounds can only be added during briefing or writing';
  end if;

  select count(*) into v_n
  from public.assignments
  where room_id = v_room.id and round = 1;
  if v_n < 2 then
    raise exception 'no rotation schedule to extend';
  end if;

  v_new := coalesce(v_room.round_count, 0) + 1;
  if v_new > v_n - 1 then
    raise exception 'no more distinct rounds are possible with % players', v_n;
  end if;
  if v_new > 12 then
    raise exception 'round limit reached';
  end if;

  insert into public.assignments (room_id, round, writer_id, target_id)
  select a.room_id, v_new, a.writer_id, a1.target_id
  from public.assignments a
  join public.assignments a1
    on a1.room_id = a.room_id and a1.round = 1 and a1.writer_id = a.target_id
  where a.room_id = v_room.id and a.round = v_room.round_count;

  update public.rooms set round_count = v_new where id = v_room.id
  returning * into v_room;

  return public.kindsight_room_public(v_room) || jsonb_build_object('server_now', now());
end
$$;

-- Host-only settings patch. Keys present in p_patch are applied; absent keys
-- stay untouched, so music_mood can be set to null explicitly (music off).
-- timer_paused true/false carries the pause and shift-on-resume logic.
create or replace function public.update_settings(p_room_id uuid, p_patch jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room  public.rooms%rowtype;
  v_key   text;
  v_pause interval;
begin
  v_room := public.kindsight_live_room(p_room_id, true);
  if v_room.host_id is distinct from public.kindsight_uid() then
    raise exception 'only the host can change settings' using errcode = '42501';
  end if;
  if p_patch is null or jsonb_typeof(p_patch) <> 'object' then
    raise exception 'settings patch must be a json object';
  end if;

  for v_key in select jsonb_object_keys(p_patch) loop
    case v_key
      when 'round_seconds' then
        v_room.round_seconds := (p_patch ->> 'round_seconds')::int;
        if v_room.round_seconds not between 30 and 3600 then
          raise exception 'round_seconds must be between 30 and 3600';
        end if;
      when 'highlight_enabled' then
        v_room.highlight_enabled := (p_patch ->> 'highlight_enabled')::boolean;
      when 'music_mood' then
        v_room.music_mood := p_patch ->> 'music_mood';
      when 'music_on' then
        v_room.music_on := (p_patch ->> 'music_on')::boolean;
      when 'notes_author_cap' then
        v_room.notes_author_cap := (p_patch ->> 'notes_author_cap')::int;
        if v_room.notes_author_cap not between 1 and 100 then
          raise exception 'notes_author_cap must be between 1 and 100';
        end if;
      when 'round_count' then
        if v_room.phase not in ('lobby', 'briefing') then
          raise exception 'round_count is locked once writing starts; use add_round';
        end if;
        v_room.round_count := (p_patch ->> 'round_count')::int;
      when 'timer_paused' then
        if (p_patch ->> 'timer_paused')::boolean then
          v_room.timer_paused_at := coalesce(v_room.timer_paused_at, now());
        elsif v_room.timer_paused_at is not null then
          v_pause := now() - v_room.timer_paused_at;
          v_room.round_started_at := v_room.round_started_at + v_pause;
          if v_room.grace_until is not null then
            v_room.grace_until := v_room.grace_until + v_pause;
          end if;
          v_room.timer_paused_at := null;
        end if;
      else
        raise exception 'unknown setting: %', v_key;
    end case;
  end loop;

  update public.rooms
  set round_seconds     = v_room.round_seconds,
      highlight_enabled = v_room.highlight_enabled,
      music_mood        = v_room.music_mood,
      music_on          = v_room.music_on,
      notes_author_cap  = v_room.notes_author_cap,
      round_count       = v_room.round_count,
      timer_paused_at   = v_room.timer_paused_at,
      round_started_at  = v_room.round_started_at,
      grace_until       = v_room.grace_until
  where id = v_room.id
  returning * into v_room;

  return public.kindsight_room_public(v_room) || jsonb_build_object('server_now', now());
end
$$;

-- Rebinds host rights to the calling session after verifying the reclaim
-- secret against its hash (D10). Failures share the join_room attempt cap,
-- and return {ok: false} as data for the same reason join_room does: the
-- failure count must commit.
create or replace function public.reclaim_host(p_code text, p_secret text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.rooms%rowtype;
begin
  if public.kindsight_uid() is null then
    raise exception 'sign in first' using errcode = '42501';
  end if;
  perform public.kindsight_rate_check(public.kindsight_uid());

  select * into v_room
  from public.rooms
  where code = upper(btrim(p_code)) and expires_at > now()
  for update;
  if not found
     or v_room.host_secret_hash is distinct from extensions.crypt(p_secret, v_room.host_secret_hash) then
    perform public.kindsight_rate_limit(public.kindsight_uid());
    return jsonb_build_object('ok', false, 'server_now', now());
  end if;

  update public.rooms set host_id = public.kindsight_uid() where id = v_room.id
  returning * into v_room;

  return public.kindsight_room_public(v_room)
       || jsonb_build_object('ok', true, 'server_now', now());
end
$$;

-- Host-only end-and-delete (D6). Broadcasts room_ended, then one delete
-- cascades participants, assignments, and notes away.
create or replace function public.end_room(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.rooms%rowtype;
begin
  select * into v_room from public.rooms where id = p_room_id for update;
  if not found then
    raise exception 'room not found' using errcode = 'P0002';
  end if;
  if v_room.host_id is distinct from public.kindsight_uid() then
    raise exception 'only the host can end the room' using errcode = '42501';
  end if;

  perform public.kindsight_notify(v_room.id, 'room_ended', '{}'::jsonb);
  delete from public.rooms where id = v_room.id;
end
$$;

-- ---------------------------------------------------------------------------
-- Notes
-- ---------------------------------------------------------------------------

-- The only insert path for notes. author_id is derived from public.kindsight_uid(),
-- never supplied. Caps, spacing, and dedupe fire again in the table trigger.
create or replace function public.submit_note(
  p_room_id  uuid,
  p_target_id uuid,
  p_frame    public.note_frame,
  p_content  text,
  p_is_bonus boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room   public.rooms%rowtype;
  v_author public.participants%rowtype;
  v_target public.participants%rowtype;
  v_round  int;
  v_id     uuid;
begin
  v_room := public.kindsight_live_room(p_room_id);
  if v_room.phase <> 'writing' then
    raise exception 'notes can only be written during the writing phase';
  end if;

  v_author := public.kindsight_caller_participant(v_room.id);

  select * into v_target
  from public.participants
  where id = p_target_id and room_id = v_room.id;
  if not found or v_target.claimed_by is null then
    raise exception 'target is not a claimed participant in this room';
  end if;
  if v_target.id = v_author.id then
    raise exception 'you cannot write a note to yourself';
  end if;

  if v_room.mode = 'round_robin' and not p_is_bonus then
    if v_room.current_round < 1 then
      raise exception 'the round has not started yet';
    end if;
    if not exists (
      select 1 from public.assignments a
      where a.room_id = v_room.id and a.round = v_room.current_round
        and a.writer_id = v_author.id and a.target_id = v_target.id
    ) then
      raise exception 'that is not your assigned target this round';
    end if;
    if exists (
      select 1 from public.notes n
      where n.room_id = v_room.id and n.author_id = v_author.id
        and n.round = v_room.current_round and not n.is_bonus and not n.killed
    ) then
      raise exception 'you already submitted this round';
    end if;
    v_round := v_room.current_round;
  else
    v_round := null;
  end if;

  insert into public.notes (room_id, author_id, target_id, frame, content, round, is_bonus)
  values (v_room.id, v_author.id, v_target.id, p_frame, p_content, v_round, p_is_bonus)
  returning id into v_id;

  return jsonb_build_object('note_id', v_id, 'server_now', now());
end
$$;

-- Writer read-first (invariant 5): live notes for a target, during writing
-- only, never when the caller is the target. No author, no note ids.
create or replace function public.get_target_notes(p_room_id uuid, p_target_id uuid)
returns table (frame public.note_frame, content text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_room public.rooms%rowtype;
  v_me   public.participants%rowtype;
begin
  v_room := public.kindsight_live_room(p_room_id);
  if v_room.phase <> 'writing' then
    raise exception 'notes can only be read during the writing phase';
  end if;
  v_me := public.kindsight_caller_participant(v_room.id);
  if v_me.id = p_target_id then
    raise exception 'you cannot read your own wall before the reveal' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.participants
    where id = p_target_id and room_id = v_room.id
  ) then
    raise exception 'target is not in this room';
  end if;

  return query
  select n.frame, n.content
  from public.notes n
  where n.room_id = v_room.id and n.target_id = p_target_id and not n.killed
  order by n.created_at;
end
$$;

-- Own wall, reveal-gated (invariant 1). No author, structurally.
create or replace function public.get_my_wall(p_room_id uuid)
returns table (
  note_id        uuid,
  frame          public.note_frame,
  content        text,
  shared_to_wall boolean,
  created_at     timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_room public.rooms%rowtype;
  v_me   public.participants%rowtype;
begin
  v_room := public.kindsight_live_room(p_room_id);
  v_me := public.kindsight_caller_participant(v_room.id);
  if v_room.phase not in ('reveal', 'wrapup') then
    raise exception 'your wall stays locked until the reveal' using errcode = '42501';
  end if;

  return query
  select n.id, n.frame, n.content, n.shared_to_wall, n.created_at
  from public.notes n
  where n.room_id = v_room.id and n.target_id = v_me.id and not n.killed
  order by n.created_at;
end
$$;

-- Count only: the single legal pre-reveal read touching own-targeted rows.
create or replace function public.get_my_wall_count(p_room_id uuid)
returns int
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_room public.rooms%rowtype;
  v_me   public.participants%rowtype;
  v_n    int;
begin
  v_room := public.kindsight_live_room(p_room_id);
  v_me := public.kindsight_caller_participant(v_room.id);
  select count(*) into v_n
  from public.notes n
  where n.room_id = v_room.id and n.target_id = v_me.id and not n.killed;
  return v_n;
end
$$;

-- Per-note wall opt-in, revocable until wrap-up ends (target only).
create or replace function public.set_note_shared(p_note_id uuid, p_shared boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_note public.notes%rowtype;
  v_room public.rooms%rowtype;
  v_me   public.participants%rowtype;
begin
  select * into v_note from public.notes where id = p_note_id;
  if not found or v_note.killed then
    raise exception 'note not found' using errcode = 'P0002';
  end if;
  v_room := public.kindsight_live_room(v_note.room_id);
  v_me := public.kindsight_caller_participant(v_room.id);
  if v_note.target_id <> v_me.id then
    raise exception 'only the recipient can share a note' using errcode = '42501';
  end if;
  if v_room.phase not in ('reveal', 'wrapup') then
    raise exception 'sharing opens at the reveal';
  end if;

  update public.notes set shared_to_wall = p_shared where id = p_note_id;
end
$$;

-- Host kill switch: soft delete, any phase, idempotent (D15).
create or replace function public.kill_note(p_note_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_note public.notes%rowtype;
  v_room public.rooms%rowtype;
begin
  select * into v_note from public.notes where id = p_note_id;
  if not found then
    raise exception 'note not found' using errcode = 'P0002';
  end if;
  select * into v_room from public.rooms where id = v_note.room_id;
  if v_room.host_id is distinct from public.kindsight_uid() then
    raise exception 'only the host can kill a note' using errcode = '42501';
  end if;

  update public.notes set killed = true, shared_to_wall = false
  where id = p_note_id and not killed;
end
$$;

-- Host moderation feed (invariant 3): content and target, never author.
-- Killed notes appear here, flagged, and nowhere else (invariant 6).
create or replace function public.get_moderation_feed(p_room_id uuid)
returns table (
  note_id     uuid,
  target_name text,
  frame       public.note_frame,
  content     text,
  is_bonus    boolean,
  killed      boolean,
  created_at  timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_room public.rooms%rowtype;
begin
  v_room := public.kindsight_live_room(p_room_id);
  if v_room.host_id is distinct from public.kindsight_uid() then
    raise exception 'only the host can read the moderation feed' using errcode = '42501';
  end if;

  return query
  select n.id, t.display_name, n.frame, n.content, n.is_bonus, n.killed, n.created_at
  from public.notes n
  join public.participants t on t.id = n.target_id
  where n.room_id = v_room.id
  order by n.created_at desc;
end
$$;

-- ---------------------------------------------------------------------------
-- Assignments and reveal
-- ---------------------------------------------------------------------------

-- Own current-round target only (invariant 7). Empty result (not an error)
-- means the waiting card: late joiners have no row for the running round.
create or replace function public.get_my_assignment(p_room_id uuid)
returns table (target_id uuid, display_name text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_room public.rooms%rowtype;
  v_me   public.participants%rowtype;
begin
  v_room := public.kindsight_live_room(p_room_id);
  v_me := public.kindsight_caller_participant(v_room.id);
  if v_room.phase <> 'writing' then
    raise exception 'assignments are visible during the writing phase only' using errcode = '42501';
  end if;
  if v_room.mode <> 'round_robin' or v_room.current_round < 1 then
    return;
  end if;

  return query
  select t.id, t.display_name
  from public.assignments a
  join public.participants t on t.id = a.target_id
  where a.room_id = v_room.id and a.round = v_room.current_round and a.writer_id = v_me.id;
end
$$;

-- Own reveal ritual progress; drives the host RevealStatusList.
create or replace function public.set_reveal_state(p_room_id uuid, p_state public.reveal_state)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.rooms%rowtype;
  v_me   public.participants%rowtype;
begin
  v_room := public.kindsight_live_room(p_room_id);
  v_me := public.kindsight_caller_participant(v_room.id);
  if v_room.phase not in ('reveal', 'wrapup') then
    raise exception 'the reveal has not started';
  end if;

  update public.participants set reveal_state = p_state where id = v_me.id;
end
$$;

-- ---------------------------------------------------------------------------
-- Big screen
-- ---------------------------------------------------------------------------

-- Phase, timer fields, aggregate counts, roster fill, and (wrap-up or reveal,
-- host-toggled) opted-in highlight notes. Never authors, never host fields.
-- Volatile, not stable: failed code lookups write to the attempts ledger.
create or replace function public.get_bigscreen_state(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.rooms%rowtype;
begin
  if public.kindsight_uid() is null then
    raise exception 'sign in first' using errcode = '42501';
  end if;

  perform public.kindsight_rate_check(public.kindsight_uid());

  select * into v_room
  from public.rooms
  where code = upper(btrim(p_code)) and expires_at > now();
  if not found then
    perform public.kindsight_rate_limit(public.kindsight_uid());
    return jsonb_build_object('found', false, 'server_now', now());
  end if;

  return public.kindsight_room_public(v_room)
       || jsonb_build_object(
            'found',      true,
            'server_now', now(),
            'roster',     public.kindsight_roster(v_room.id),
            'counts', jsonb_build_object(
              'roster',  (select count(*) from public.participants p where p.room_id = v_room.id),
              'claimed', (select count(*) from public.participants p
                          where p.room_id = v_room.id and p.claimed_by is not null),
              'notes',   (select count(*) from public.notes n
                          where n.room_id = v_room.id and not n.killed)
            ),
            'highlight', case
              when v_room.highlight_enabled and v_room.phase in ('reveal', 'wrapup') then (
                select coalesce(jsonb_agg(jsonb_build_object(
                         'content',   n.content,
                         'frame',     n.frame,
                         'recipient', t.display_name
                       ) order by n.created_at), '[]'::jsonb)
                from public.notes n
                join public.participants t on t.id = n.target_id
                where n.room_id = v_room.id and n.shared_to_wall and not n.killed
              )
              else '[]'::jsonb
            end
          );
end
$$;

-- Keepalive target for the scheduled GitHub Actions ping (F5). Content-free.
create or replace function public.keepalive()
returns timestamptz
language sql
stable
security definer
set search_path = ''
as $$
  select now()
$$;

-- ---------------------------------------------------------------------------
-- Ownership and grants
-- ---------------------------------------------------------------------------

alter function public.kindsight_rate_limit(uuid)              owner to kindsight_api;
alter function public.kindsight_rate_check(uuid)               owner to kindsight_api;
alter function public.kindsight_room_public(public.rooms)      owner to kindsight_api;
alter function public.kindsight_roster(uuid)                   owner to kindsight_api;
alter function public.kindsight_live_room(uuid, boolean)       owner to kindsight_api;
alter function public.kindsight_caller_participant(uuid)       owner to kindsight_api;
alter function public.kindsight_generate_assignments(uuid)     owner to kindsight_api;
alter function public.create_room(public.room_mode, text[], int, int) owner to kindsight_api;
alter function public.join_room(text)                          owner to kindsight_api;
alter function public.claim_name(uuid)                         owner to kindsight_api;
alter function public.get_snapshot(uuid)                       owner to kindsight_api;
alter function public.advance_phase(uuid)                      owner to kindsight_api;
alter function public.start_round(uuid)                        owner to kindsight_api;
alter function public.finalize_round(uuid)                     owner to kindsight_api;
alter function public.add_round(uuid)                          owner to kindsight_api;
alter function public.update_settings(uuid, jsonb)             owner to kindsight_api;
alter function public.reclaim_host(text, text)                 owner to kindsight_api;
alter function public.end_room(uuid)                           owner to kindsight_api;
alter function public.submit_note(uuid, uuid, public.note_frame, text, boolean) owner to kindsight_api;
alter function public.get_target_notes(uuid, uuid)             owner to kindsight_api;
alter function public.get_my_wall(uuid)                        owner to kindsight_api;
alter function public.get_my_wall_count(uuid)                  owner to kindsight_api;
alter function public.set_note_shared(uuid, boolean)           owner to kindsight_api;
alter function public.kill_note(uuid)                          owner to kindsight_api;
alter function public.get_moderation_feed(uuid)                owner to kindsight_api;
alter function public.get_my_assignment(uuid)                  owner to kindsight_api;
alter function public.set_reveal_state(uuid, public.reveal_state) owner to kindsight_api;
alter function public.get_bigscreen_state(text)                owner to kindsight_api;
alter function public.keepalive()                              owner to kindsight_api;

-- Default privileges already deny execute; this makes the deny explicit for
-- everything in public, then the API surface is granted back one by one.
revoke all on all functions in schema public from public, anon, authenticated;

grant execute on function public.create_room(public.room_mode, text[], int, int) to authenticated;
grant execute on function public.join_room(text)                          to authenticated;
grant execute on function public.claim_name(uuid)                         to authenticated;
grant execute on function public.get_snapshot(uuid)                       to authenticated;
grant execute on function public.advance_phase(uuid)                      to authenticated;
grant execute on function public.start_round(uuid)                        to authenticated;
grant execute on function public.finalize_round(uuid)                     to authenticated;
grant execute on function public.add_round(uuid)                          to authenticated;
grant execute on function public.update_settings(uuid, jsonb)             to authenticated;
grant execute on function public.reclaim_host(text, text)                 to authenticated;
grant execute on function public.end_room(uuid)                           to authenticated;
grant execute on function public.submit_note(uuid, uuid, public.note_frame, text, boolean) to authenticated;
grant execute on function public.get_target_notes(uuid, uuid)             to authenticated;
grant execute on function public.get_my_wall(uuid)                        to authenticated;
grant execute on function public.get_my_wall_count(uuid)                  to authenticated;
grant execute on function public.set_note_shared(uuid, boolean)           to authenticated;
grant execute on function public.kill_note(uuid)                          to authenticated;
grant execute on function public.get_moderation_feed(uuid)                to authenticated;
grant execute on function public.get_my_assignment(uuid)                  to authenticated;
grant execute on function public.set_reveal_state(uuid, public.reveal_state) to authenticated;
grant execute on function public.get_bigscreen_state(text)                to authenticated;
grant execute on function public.keepalive()                              to anon, authenticated;
