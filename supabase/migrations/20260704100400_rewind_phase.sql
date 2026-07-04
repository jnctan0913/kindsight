-- Kindsight M2 migration 8: phase rewind (host moves a room BACK one phase).
--
-- The forward machine is LOBBY -> BRIEFING -> WRITING -> REVEAL -> WRAPUP.
-- This migration lets the host step back exactly one phase along the same
-- chain. The hard invariant is preserved by construction: note visibility is
-- gated on the room's LIVE phase inside the read RPCs (get_my_wall reads
-- rooms.phase on every call), so flipping the phase back to 'writing'
-- re-hides every wall automatically. Nothing is latched, nothing is cached
-- server-side, and no notes are deleted.

-- Previous phase, mirror of kindsight_next_phase. Null at 'lobby' (nothing
-- before it), which the RPC turns into a clear "nothing to rewind" error.
create or replace function public.kindsight_prev_phase(p_phase public.room_phase)
returns public.room_phase
language sql
immutable
as $$
  select case p_phase
    when 'wrapup'   then 'reveal'::public.room_phase
    when 'reveal'   then 'writing'::public.room_phase
    when 'writing'  then 'briefing'::public.room_phase
    when 'briefing' then 'lobby'::public.room_phase
    else null
  end
$$;

alter function public.kindsight_prev_phase(public.room_phase) owner to kindsight_api;

-- Relaxed phase guard. Host-only stays. The single-step rule now permits the
-- adjacent phase in EITHER direction (next or prev). The two forward-only
-- gates (rotation schedule, Mode B reveal floor) are scoped to their forward
-- target phase so a rewind is never blocked by a gate meant for advancing.
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
    if public.kindsight_uid() is null or public.kindsight_uid() <> old.host_id then
      raise exception 'only the host can change the phase' using errcode = '42501';
    end if;

    -- Allow one step forward (advance) or one step back (rewind). Everything
    -- else -- skips, jumps, non-adjacent moves -- is rejected.
    if new.phase is distinct from public.kindsight_next_phase(old.phase)
       and new.phase is distinct from public.kindsight_prev_phase(old.phase) then
      raise exception 'phase can only move to the adjacent phase';
    end if;

    -- Mode A cannot ENTER writing without a complete rotation schedule (D7).
    -- Scoped to the forward briefing -> writing move only: a rewind
    -- briefing -> lobby must not require a schedule that does not exist yet.
    if old.phase = 'briefing' and new.phase = 'writing' and old.mode = 'round_robin' then
      if old.round_count is null or (
        select count(distinct a.round)
        from public.assignments a
        where a.room_id = old.id and a.round between 1 and old.round_count
      ) <> old.round_count then
        raise exception 'rotation schedule incomplete';
      end if;
    end if;

    -- Mode B reveal floor (D8): every claimed participant needs 3+ live notes.
    -- Scoped to the forward writing -> reveal move only: a rewind
    -- writing -> briefing must not be blocked by the reveal floor.
    if old.phase = 'writing' and new.phase = 'reveal' and old.mode = 'free_select' then
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

-- Host-only rewind. Mirror of advance_phase: same guards, same return shape
-- (kindsight_room_public(room) || server_now), so the client reuses the code
-- path it already has for advance. The guard above enforces host-only and the
-- single-step rule independently.
create or replace function public.rewind_phase(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.rooms%rowtype;
  v_prev public.room_phase;
begin
  v_room := public.kindsight_live_room(p_room_id, true);
  if v_room.host_id is distinct from public.kindsight_uid() then
    raise exception 'only the host can change the phase' using errcode = '42501';
  end if;

  v_prev := public.kindsight_prev_phase(v_room.phase);
  if v_prev is null then
    raise exception 'already at the first phase; nothing to rewind';
  end if;

  if v_room.phase = 'reveal' then
    -- reveal -> writing. Re-lock every reveal ritual to its pre-reveal value.
    -- Walls re-hide automatically: get_my_wall gates on the live phase, which
    -- is now 'writing'. Notes (content, killed, shared_to_wall) are preserved
    -- so a later re-advance restores the reveal exactly as it was.
    update public.participants
    set reveal_state = 'locked'
    where room_id = v_room.id and reveal_state <> 'locked';

    update public.rooms set phase = v_prev where id = v_room.id
    returning * into v_room;

  elsif v_room.phase = 'writing' then
    -- writing -> briefing. Keep notes AND the rotation schedule (assignments).
    -- Park the round engine at its pre-writing rest state so the timer UI and
    -- the writing_done broadcast do not read stale round data. round_count is
    -- kept: the re-advance reuses the existing assignments (idempotent, see
    -- kindsight_generate_assignments early-return).
    update public.rooms
    set phase = v_prev, current_round = 0, round_started_at = null,
        grace_until = null, timer_paused_at = null
    where id = v_room.id
    returning * into v_room;

  else
    -- wrapup -> reveal and briefing -> lobby. Phase only. At briefing no
    -- assignments exist yet (they are generated on the forward briefing ->
    -- writing move), so briefing -> lobby has nothing else to undo. wrapup ->
    -- reveal keeps reveal_state, since both phases run the reveal ritual.
    update public.rooms set phase = v_prev where id = v_room.id
    returning * into v_room;
  end if;

  return public.kindsight_room_public(v_room) || jsonb_build_object('server_now', now());
end
$$;

alter function public.rewind_phase(uuid) owner to kindsight_api;

-- kindsight_prev_phase is an internal helper (like kindsight_next_phase): no
-- client grant. Only the definer-owned guard and rewind_phase call it, and
-- both run as the owner. rewind_phase is granted to authenticated like every
-- other RPC.
revoke all on function public.kindsight_prev_phase(public.room_phase) from public, anon, authenticated;
revoke all on function public.rewind_phase(uuid)                      from public, anon, authenticated;
grant execute on function public.rewind_phase(uuid)                   to authenticated;
