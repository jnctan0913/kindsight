-- Kindsight M2 migration 2: default-deny (ENG-PLAN section 2, decision D2).
-- No client role ever touches a table directly. RLS is enabled with zero
-- permissive policies as belt and braces: even if a grant slips in later,
-- every read and write is still denied.

alter table public.rooms          enable row level security;
alter table public.participants   enable row level security;
alter table public.assignments    enable row level security;
alter table public.notes          enable row level security;
alter table public.rooms_attempts enable row level security;

revoke all on all tables in schema public from public, anon, authenticated;
revoke all on all sequences in schema public from public, anon, authenticated;

alter default privileges in schema public revoke all on tables from public, anon, authenticated;
alter default privileges in schema public revoke all on sequences from public, anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- Realtime broadcast authorization (ENG-PLAN section 2, decision D5).
-- Topics are keyed by the unguessable room uuid and every payload is
-- content-free, so one select policy for authenticated is enough.
-- Guarded: the realtime schema exists only on Supabase stacks.
do $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'realtime' and c.relname = 'messages'
  ) then
    if not exists (
      select 1 from pg_policies
      where schemaname = 'realtime' and tablename = 'messages'
        and policyname = 'kindsight_room_broadcasts'
    ) then
      execute $pol$
        create policy kindsight_room_broadcasts on realtime.messages
        for select to authenticated
        using (realtime.topic() like 'room:%')
      $pol$;
    end if;
    execute 'grant usage on schema realtime to kindsight_api';
  end if;
end
$$;
