-- Kindsight: let a signed-in host discover their own live rooms from the server.
--
-- The console hub previously listed rooms only from browser localStorage
-- (kindsight.hostActiveRooms), which is per-origin and per-device, so a host who
-- created a room on one origin (e.g. localhost) saw an empty hub on another
-- (e.g. GitHub Pages) even though they still own the room. This adds a read-only
-- lookup keyed on the caller's identity so sessions follow the account.
--
-- Anonymity: this returns room-level display metadata only (code, phase, times,
-- roster size). It never touches notes or authorship, and it is scoped to
-- host_id = kindsight_uid(), so a caller can only ever see rooms they host.
-- SECURITY DEFINER runs as kindsight_api (bypassing RLS), but kindsight_uid()
-- reads the caller's JWT sub, so the WHERE clause still restricts to the caller.
-- If called without a session (anon), kindsight_uid() is null and no rows match.
create or replace function public.list_host_rooms()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'code',        r.code,
        'phase',       r.phase,
        'created_at',  r.created_at,
        'expires_at',  r.expires_at,
        'roster_size', (select count(*) from public.participants p where p.room_id = r.id)
      )
      order by r.created_at desc
    ),
    '[]'::jsonb
  )
  from public.rooms r
  where r.host_id = public.kindsight_uid()
    and r.expires_at > now();
$$;

alter function public.list_host_rooms() owner to kindsight_api;
grant execute on function public.list_host_rooms() to authenticated;
