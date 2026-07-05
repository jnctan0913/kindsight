-- Harden rotation schedule handling across rewinds.
--
-- Bug: kindsight_generate_assignments early-returned whenever ANY assignment row
-- existed for the room. A room that was advanced to writing (schedule built),
-- rewound to briefing, then had its round_count increased could no longer
-- re-advance: advance_phase's generate call bailed out, leaving the stale
-- schedule that covered the OLD (smaller) round count, while the phase guard
-- requires exactly round_count distinct assignment rounds. Result:
-- "rotation schedule incomplete" on briefing -> writing.
--
-- Fix: reconcile an existing schedule to the requested round_count instead of
-- bailing. Clamp to n-1, trim extra rounds, and extend missing rounds using the
-- same power-of-cycle rule add_round uses (round k target = round-1 mapping
-- applied to the round-(k-1) target), then sync round_count. Idempotent when the
-- schedule already matches. A degenerate leftover (fewer than 2 writers) is
-- cleared and rebuilt fresh. No change to notes, RLS, or anonymity.

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
  v_want   int;
  v_have   int;
  v_k      int;
  v_i      int;
begin
  select * into v_room from public.rooms where id = p_room_id;
  if v_room.mode <> 'round_robin' then
    return;
  end if;

  -- Existing schedule: reconcile to the requested round_count rather than
  -- leaving a stale one that would wedge the phase guard on re-advance.
  if exists (select 1 from public.assignments where room_id = p_room_id) then
    select count(*) into v_n
    from public.assignments
    where room_id = p_room_id and round = 1;

    if v_n < 2 then
      -- Degenerate leftover; clear it and fall through to a fresh build.
      delete from public.assignments where room_id = p_room_id;
    else
      v_want := least(coalesce(v_room.round_count, 1), v_n - 1);
      select coalesce(max(round), 0) into v_have
      from public.assignments
      where room_id = p_room_id;

      -- Trim any rounds beyond the requested count.
      if v_want < v_have then
        delete from public.assignments
        where room_id = p_room_id and round > v_want;
      end if;

      -- Extend missing rounds via the cycle-power rule.
      while v_have < v_want loop
        insert into public.assignments (room_id, round, writer_id, target_id)
        select a.room_id, v_have + 1, a.writer_id, a1.target_id
        from public.assignments a
        join public.assignments a1
          on a1.room_id = a.room_id and a1.round = 1 and a1.writer_id = a.target_id
        where a.room_id = p_room_id and a.round = v_have;
        v_have := v_have + 1;
      end loop;

      if v_want is distinct from v_room.round_count then
        update public.rooms set round_count = v_want where id = p_room_id;
      end if;
      return;
    end if;
  end if;

  -- Fresh build (no usable existing schedule).
  select array_agg(p.id order by random()) into v_ids
  from public.participants p
  where p.room_id = p_room_id and p.claimed_by is not null;

  v_n := coalesce(array_length(v_ids, 1), 0);
  if v_n < 2 then
    raise exception 'rotation needs at least 2 claimed participants';
  end if;

  v_want := least(coalesce(v_room.round_count, 1), v_n - 1);
  if v_want is distinct from v_room.round_count then
    update public.rooms set round_count = v_want where id = p_room_id;
  end if;

  for v_k in 1..v_want loop
    for v_i in 1..v_n loop
      insert into public.assignments (room_id, round, writer_id, target_id)
      values (p_room_id, v_k, v_ids[v_i], v_ids[((v_i - 1 + v_k) % v_n) + 1]);
    end loop;
  end loop;
end
$$;

alter function public.kindsight_generate_assignments(uuid) owner to kindsight_api;
