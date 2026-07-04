-- Host lobby roster edits: rename and remove a participant. Pre-game only
-- (lobby phase) so there are no notes or assignments to reconcile. The
-- participants_a_ping trigger broadcasts the 'roster' ping automatically on the
-- update/delete, so every surface re-pulls its snapshot. Host-only, and the
-- functions never return author_id / claimed_by (kindsight_roster is the public
-- shape), preserving the anonymity invariant.

create or replace function public.rename_participant(
  p_room_id        uuid,
  p_participant_id uuid,
  p_name           text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.rooms%rowtype;
  v_name text := trim(p_name);
begin
  v_room := public.kindsight_live_room(p_room_id, true);
  if v_room.host_id is distinct from public.kindsight_uid() then
    raise exception 'only the host can edit the roster' using errcode = '42501';
  end if;
  if v_room.phase <> 'lobby' then
    raise exception 'the roster can only be edited in the lobby';
  end if;
  if char_length(v_name) < 1 or char_length(v_name) > 40 then
    raise exception 'name must be 1 to 40 characters';
  end if;

  begin
    update public.participants
    set display_name = v_name
    where id = p_participant_id and room_id = v_room.id;
  exception when unique_violation then
    raise exception 'another name in this room already uses that';
  end;
  if not found then
    raise exception 'name not found' using errcode = 'P0002';
  end if;

  return jsonb_build_object(
    'roster',     public.kindsight_roster(v_room.id),
    'server_now', now()
  );
end
$$;

create or replace function public.remove_participant(
  p_room_id        uuid,
  p_participant_id uuid
)
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
    raise exception 'only the host can edit the roster' using errcode = '42501';
  end if;
  if v_room.phase <> 'lobby' then
    raise exception 'names can only be removed in the lobby';
  end if;

  delete from public.participants
  where id = p_participant_id and room_id = v_room.id;
  if not found then
    raise exception 'name not found' using errcode = 'P0002';
  end if;

  return jsonb_build_object(
    'roster',     public.kindsight_roster(v_room.id),
    'server_now', now()
  );
end
$$;

alter function public.rename_participant(uuid, uuid, text) owner to kindsight_api;
alter function public.remove_participant(uuid, uuid)       owner to kindsight_api;

grant execute on function public.rename_participant(uuid, uuid, text) to authenticated;
grant execute on function public.remove_participant(uuid, uuid)       to authenticated;
