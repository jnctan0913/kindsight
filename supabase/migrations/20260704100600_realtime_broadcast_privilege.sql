-- Kindsight fix: let the database actually emit Realtime broadcasts.
--
-- Diagnosis (verified against the Supabase realtime source):
--   * realtime.send(payload, event, topic, private) is SECURITY INVOKER, so it
--     runs as whoever calls it. kindsight_notify is SECURITY DEFINER owned by
--     kindsight_api, so realtime.send executes as kindsight_api.
--   * realtime.send INSERTs into realtime.messages. That table has ROW LEVEL
--     SECURITY ENABLED and ships with a SELECT policy (added by us for
--     subscribers) but no INSERT policy, so the server-side INSERT was denied by
--     RLS and no broadcast ever reached clients (they fell back to the poll).
--
-- Previous attempt (reverted): reassign kindsight_notify to service_role so the
-- insert ran as a BYPASSRLS role. That failed on hosted Supabase with
--   ERROR: permission denied for schema public (SQLSTATE 42501)
-- because "alter function ... owner to service_role" requires service_role to
-- hold CREATE on schema public, which hosted does not grant. Dead end.
--
-- Chosen fix (the documented Supabase "broadcast from database" pattern): keep
-- kindsight_notify owned by kindsight_api and make the RLS insert PASS by adding
-- an INSERT policy on realtime.messages. This mirrors the SELECT policy we
-- already ship in 20260704090100_default_deny.sql (which applied cleanly to the
-- hosted remote), so policy DDL on realtime.messages is known to work here.
--
-- Role coverage: kindsight_notify runs as its owner kindsight_api (SECURITY
-- DEFINER). kindsight_api is a member of authenticated
-- (20260704090000_schema.sql:55-59), so a policy scoped "to authenticated"
-- covers it, and the table-level INSERT grant Supabase ships on
-- realtime.messages for authenticated is inherited by kindsight_api. No extra
-- object grant is needed. (If, on some stack, that membership was refused, see
-- the residual-risk note at the end for the "to kindsight_api" plan B.)
--
-- On plain Postgres (tests) there is no realtime schema, so the policy block is
-- skipped and the pg_notify fallback in the function runs exactly as before.
-- Idempotent / safe to re-run: create-or-replace function, existence-guarded
-- drop-then-create policy.

-- Replace kindsight_notify: same behaviour, but a realtime failure is no longer
-- swallowed silently. We raise a WARNING (visible in Postgres logs, does NOT
-- abort the surrounding game-write transaction) before degrading to pg_notify,
-- so a future privilege regression cannot hide the way it did here. We keep the
-- pg_notify fallback so a transient realtime hiccup (or plain-Postgres, where
-- realtime.send does not exist) never fails a phase advance or note write.
-- create-or-replace does not change ownership: this stays owned by kindsight_api.
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
    raise warning 'kindsight_notify: realtime.send failed for room:% event % (% %)',
      p_room_id, p_event, sqlstate, sqlerrm;
    perform pg_notify(
      'kindsight',
      jsonb_build_object('topic', 'room:' || p_room_id::text, 'event', p_event, 'payload', p_payload)::text
    );
  end;
end
$$;

-- INSERT authorization for the database-side broadcast (ENG-PLAN section 2,
-- decision D5). Mirrors the kindsight_room_broadcasts SELECT policy: same table,
-- same "to authenticated" scope, same realtime-only existence guard. The
-- with-check restricts inserts to our own topic namespace rather than allowing
-- a blanket true, so an authenticated client cannot broadcast to arbitrary
-- topics via a direct insert. We reference the row's `topic` column (the 3rd arg
-- of realtime.send, always 'room:'||room_id here) instead of realtime.topic():
-- realtime.topic() reads the subscription-authorization GUC, which is not set on
-- a server-side insert path, whereas the column is always present on the row.
do $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'realtime' and c.relname = 'messages'
  ) then
    execute 'drop policy if exists kindsight_room_broadcast_insert on realtime.messages';
    execute $pol$
      create policy kindsight_room_broadcast_insert on realtime.messages
      for insert to authenticated
      with check (topic like 'room:%')
    $pol$;
  end if;
end
$$;
