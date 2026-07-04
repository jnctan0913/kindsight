-- Kindsight pgTAP suite: ENG-PLAN section 2 test matrix, priority rows.
-- Runs under `supabase test db`. Everything rolls back.

begin;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public;

select plan(64);

-- Tests bypass the 3s per-author spacing limiter (GUC hook in notes_validate).
select set_config('kindsight.min_note_interval_ms', '0', true);

create function pg_temp.impersonate(u uuid) returns text
language sql volatile as
$$ select set_config('request.jwt.claims',
     json_build_object('sub', u, 'role', 'authenticated')::text, true) $$;

-- ---------------------------------------------------------------------------
-- Structural invariants (D2, invariant 2, invariant 8)
-- ---------------------------------------------------------------------------

select is_empty(
  $$ select grantee, table_name, privilege_type
     from information_schema.role_table_grants
     where table_schema = 'public' and grantee in ('anon', 'authenticated') $$,
  'no direct table grants for client roles');

select is_empty(
  $$ select c.relname from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity $$,
  'every table in public has RLS enabled');

select is(
  (select count(*)::int from pg_policies where schemaname = 'public'),
  0, 'zero permissive policies in public: default deny is real');

select is_empty(
  $$ select p.proname, arg
     from pg_proc p
     join pg_namespace ns on ns.oid = p.pronamespace
     cross join lateral unnest(coalesce(p.proargnames, '{}'::text[])) as arg
     where ns.nspname = 'public'
       and arg in ('author_id', 'host_secret_hash', 'claimed_by', 'host_id') $$,
  'author_id, host_secret_hash, claimed_by, host_id appear in no function signature (pg_proc)');

select is_empty(
  $$ select p.proname
     from pg_proc p
     join pg_namespace ns on ns.oid = p.pronamespace
     where ns.nspname = 'public'
       and p.prorettype in ('public.rooms'::regtype, 'public.participants'::regtype,
                            'public.notes'::regtype, 'public.assignments'::regtype)
       and has_function_privilege('authenticated', p.oid, 'execute') $$,
  'no client-executable function returns a raw table rowtype');

-- ---------------------------------------------------------------------------
-- Mode B room: create, join, claim
-- ---------------------------------------------------------------------------

select pg_temp.impersonate('00000000-0000-0000-0000-0000000000b0');
do $$
declare v jsonb;
begin
  v := public.create_room('free_select'::public.room_mode,
                          array['Ana','Ben','Chen','Dee','Eve']);
  perform set_config('t.room_b', v ->> 'room_id', true);
  perform set_config('t.code_b', v ->> 'code', true);
  perform set_config('t.secret_b', v ->> 'host_secret', true);
end $$;

select matches(current_setting('t.code_b'), '^[A-HJ-NP-Z2-9]{6}$',
  'room code uses the unambiguous 32-char alphabet');

select pg_temp.impersonate('00000000-0000-0000-0000-00000000005a');
select is((public.join_room(current_setting('t.code_b'))) ->> 'found', 'true',
  'stranger with the code joins');
select is(jsonb_array_length((public.join_room(current_setting('t.code_b'))) -> 'roster'), 5,
  'join_room returns the roster');
select ok(
  not ((public.join_room(current_setting('t.code_b'))) ?| array['host_id','host_secret_hash','notes_author_cap']),
  'join_room payload carries no host fields and no cap');

do $$
declare rb uuid := current_setting('t.room_b')::uuid;
begin
  perform set_config('t.b_ana', (select id::text from public.participants where room_id = rb and display_name = 'Ana'), true);
  perform set_config('t.b_ben', (select id::text from public.participants where room_id = rb and display_name = 'Ben'), true);
  perform set_config('t.b_eve', (select id::text from public.participants where room_id = rb and display_name = 'Eve'), true);
  perform pg_temp.impersonate('00000000-0000-0000-0000-0000000000b1');
  perform public.claim_name((select id from public.participants where room_id = rb and display_name = 'Ana'));
  perform pg_temp.impersonate('00000000-0000-0000-0000-0000000000b2');
  perform public.claim_name((select id from public.participants where room_id = rb and display_name = 'Ben'));
  perform pg_temp.impersonate('00000000-0000-0000-0000-0000000000b3');
  perform public.claim_name((select id from public.participants where room_id = rb and display_name = 'Chen'));
  perform pg_temp.impersonate('00000000-0000-0000-0000-0000000000b4');
  perform public.claim_name((select id from public.participants where room_id = rb and display_name = 'Dee'));
end $$;

select pg_temp.impersonate('00000000-0000-0000-0000-00000000005b');
select throws_ok(
  $$ select public.claim_name(current_setting('t.b_ana')::uuid) $$,
  'P0001', null, 'claiming an already claimed name loses the race');

select pg_temp.impersonate('00000000-0000-0000-0000-0000000000b1');
select throws_ok(
  $$ select public.claim_name(current_setting('t.b_eve')::uuid) $$,
  'P0001', null, 'one session cannot hold two names in a room');

-- ---------------------------------------------------------------------------
-- Phase machine: forward-only, host-only
-- ---------------------------------------------------------------------------

select throws_ok(
  $$ select public.submit_note(current_setting('t.room_b')::uuid,
       current_setting('t.b_ben')::uuid, 'moment', 'too early') $$,
  'P0001', null, 'submit_note denied in lobby');

select throws_ok(
  $$ select public.advance_phase(current_setting('t.room_b')::uuid) $$,
  '42501', null, 'player cannot advance the phase');

select pg_temp.impersonate('00000000-0000-0000-0000-0000000000b0');
select lives_ok(
  $$ select public.advance_phase(current_setting('t.room_b')::uuid) $$,
  'host advances lobby -> briefing');
select lives_ok(
  $$ select public.advance_phase(current_setting('t.room_b')::uuid) $$,
  'host advances briefing -> writing');

select throws_ok(
  $$ update public.rooms set phase = 'briefing' where id = current_setting('t.room_b')::uuid $$,
  'P0001', null, 'backward phase move rejected by trigger even for the host');
select throws_ok(
  $$ update public.rooms set phase = 'wrapup' where id = current_setting('t.room_b')::uuid $$,
  'P0001', null, 'phase skip rejected by trigger even for the host');

select pg_temp.impersonate('00000000-0000-0000-0000-0000000000b1');
select throws_ok(
  $$ update public.rooms set phase = 'reveal' where id = current_setting('t.room_b')::uuid $$,
  '42501', null, 'non-host phase move rejected by trigger');

-- ---------------------------------------------------------------------------
-- Notes: writing, pre-reveal lockout, reveal, kill
-- ---------------------------------------------------------------------------

do $$
declare
  rb uuid := current_setting('t.room_b')::uuid;
  w  record;
  t  record;
  v_content text;
begin
  for w in select id, display_name, claimed_by from public.participants
           where room_id = rb and claimed_by is not null loop
    perform pg_temp.impersonate(w.claimed_by);
    for t in select id, display_name from public.participants
             where room_id = rb and claimed_by is not null and id <> w.id loop
      if w.display_name = 'Ben' and t.display_name = 'Ana' then
        v_content := 'XYZZY-SECRET-NOTE you were so kind';
      else
        v_content := 'kind note from ' || w.display_name || ' to ' || t.display_name;
      end if;
      perform public.submit_note(rb, t.id, 'moment'::public.note_frame, v_content);
    end loop;
  end loop;
  perform set_config('t.note_xyzzy',
    (select id::text from public.notes where room_id = rb and content like 'XYZZY%'), true);
end $$;

select pg_temp.impersonate('00000000-0000-0000-0000-0000000000b1');
select is(public.get_my_wall_count(current_setting('t.room_b')::uuid), 3,
  'wall count visible pre-reveal, count only');

select throws_ok(
  $$ select * from public.get_my_wall(current_setting('t.room_b')::uuid) $$,
  '42501', null, 'LAUNCH BLOCKER: own wall unreadable before reveal');

select throws_ok(
  $$ select * from public.get_target_notes(current_setting('t.room_b')::uuid,
       current_setting('t.b_ana')::uuid) $$,
  '42501', null, 'read-first path refuses the caller''s own wall');

select is(
  (select count(*)::int from public.get_target_notes(
     current_setting('t.room_b')::uuid, current_setting('t.b_ben')::uuid)),
  3, 'writer reads a target''s live notes during writing');

select ok(
  strpos(public.get_snapshot(current_setting('t.room_b')::uuid)::text, 'XYZZY') = 0,
  'player snapshot never carries note content pre-reveal');

select throws_ok(
  $$ select * from public.get_moderation_feed(current_setting('t.room_b')::uuid) $$,
  '42501', null, 'moderation feed is host-only');

select throws_ok(
  $$ select public.kill_note(current_setting('t.note_xyzzy')::uuid) $$,
  '42501', null, 'players cannot kill notes');

select pg_temp.impersonate('00000000-0000-0000-0000-0000000000b0');
select lives_ok(
  $$ select public.advance_phase(current_setting('t.room_b')::uuid) $$,
  'host opens the walls: writing -> reveal (floor met, unclaimed Eve ignored)');

select pg_temp.impersonate('00000000-0000-0000-0000-0000000000b1');
select is(
  (select count(*)::int from public.get_my_wall(current_setting('t.room_b')::uuid)),
  3, 'own wall readable after reveal');

select lives_ok(
  $$ select public.set_note_shared(current_setting('t.note_xyzzy')::uuid, true) $$,
  'recipient opts a note into the highlight wall');

select pg_temp.impersonate('00000000-0000-0000-0000-0000000000b0');
select lives_ok(
  $$ select public.update_settings(current_setting('t.room_b')::uuid,
       '{"highlight_enabled": true}'::jsonb) $$,
  'host enables the highlight wall');

select pg_temp.impersonate('00000000-0000-0000-0000-00000000005c');
select is(
  jsonb_array_length((public.get_bigscreen_state(current_setting('t.code_b'))) -> 'highlight'),
  1, 'big screen shows the one opted-in note');

select pg_temp.impersonate('00000000-0000-0000-0000-0000000000b0');
select lives_ok(
  $$ select public.kill_note(current_setting('t.note_xyzzy')::uuid) $$,
  'host kills a note post-reveal');

select pg_temp.impersonate('00000000-0000-0000-0000-0000000000b1');
select is(
  (select count(*)::int from public.get_my_wall(current_setting('t.room_b')::uuid)),
  2, 'killed note vanishes from the wall');

select pg_temp.impersonate('00000000-0000-0000-0000-00000000005c');
select is(
  jsonb_array_length((public.get_bigscreen_state(current_setting('t.code_b'))) -> 'highlight'),
  0, 'killed note vanishes from the highlight wall even though it was shared');

select pg_temp.impersonate('00000000-0000-0000-0000-0000000000b0');
select is(
  (select count(*)::int from public.get_moderation_feed(current_setting('t.room_b')::uuid) f
   where f.killed),
  1, 'killed note stays visible in the moderation feed, flagged');

select pg_temp.impersonate('00000000-0000-0000-0000-0000000000b1');
select throws_ok(
  $$ select public.set_note_shared(current_setting('t.note_xyzzy')::uuid, true) $$,
  'P0002', null, 'killed notes cannot be re-shared');

-- ---------------------------------------------------------------------------
-- Rate cap: 20 failed lookups per minute per session
-- ---------------------------------------------------------------------------

do $$
declare i int;
begin
  perform pg_temp.impersonate('00000000-0000-0000-0000-00000000007a');
  for i in 1..20 loop
    perform public.join_room('ZZZ222');
  end loop;
end $$;

select throws_ok(
  $$ select public.join_room('ZZZ222') $$,
  '54000', null, '21st bad code inside a minute is refused');
select throws_ok(
  $$ select public.join_room(current_setting('t.code_b')) $$,
  '54000', null, 'a capped session is refused even with a valid code');

-- ---------------------------------------------------------------------------
-- Host reclaim (D10)
-- ---------------------------------------------------------------------------

select pg_temp.impersonate('00000000-0000-0000-0000-00000000007b');
select is(
  (public.reclaim_host(current_setting('t.code_b'), 'not-the-secret')) ->> 'ok',
  'false', 'wrong reclaim secret is refused');

select pg_temp.impersonate('00000000-0000-0000-0000-0000000000bf');
select is(
  (public.reclaim_host(current_setting('t.code_b'), current_setting('t.secret_b'))) ->> 'ok',
  'true', 'correct reclaim secret rebinds the host');

select pg_temp.impersonate('00000000-0000-0000-0000-0000000000b0');
select throws_ok(
  $$ select public.advance_phase(current_setting('t.room_b')::uuid) $$,
  '42501', null, 'old host session loses rights atomically');

select pg_temp.impersonate('00000000-0000-0000-0000-0000000000bf');
select lives_ok(
  $$ select public.advance_phase(current_setting('t.room_b')::uuid) $$,
  'new host advances reveal -> wrapup');

-- ---------------------------------------------------------------------------
-- Mode A: rotation, assignments visible only as own current round
-- ---------------------------------------------------------------------------

select pg_temp.impersonate('00000000-0000-0000-0000-0000000000a0');
do $$
declare
  v  jsonb;
  ra uuid;
begin
  v := public.create_room('round_robin'::public.room_mode,
                          array['Ann','Bob','Cat','Dan'], 3, 120);
  ra := (v ->> 'room_id')::uuid;
  perform set_config('t.room_a', v ->> 'room_id', true);
  perform set_config('t.code_a', v ->> 'code', true);
  perform pg_temp.impersonate('00000000-0000-0000-0000-0000000000a1');
  perform public.claim_name((select id from public.participants where room_id = ra and display_name = 'Ann'));
  perform pg_temp.impersonate('00000000-0000-0000-0000-0000000000a2');
  perform public.claim_name((select id from public.participants where room_id = ra and display_name = 'Bob'));
  perform pg_temp.impersonate('00000000-0000-0000-0000-0000000000a3');
  perform public.claim_name((select id from public.participants where room_id = ra and display_name = 'Cat'));
  perform pg_temp.impersonate('00000000-0000-0000-0000-0000000000a4');
  perform public.claim_name((select id from public.participants where room_id = ra and display_name = 'Dan'));
  perform set_config('t.a_ann', (select id::text from public.participants where room_id = ra and display_name = 'Ann'), true);
  perform pg_temp.impersonate('00000000-0000-0000-0000-0000000000a0');
  perform public.advance_phase(ra);  -- lobby -> briefing
end $$;

select pg_temp.impersonate('00000000-0000-0000-0000-0000000000a1');
select throws_ok(
  $$ select * from public.get_my_assignment(current_setting('t.room_a')::uuid) $$,
  '42501', null, 'assignments unreadable outside the writing phase');

select pg_temp.impersonate('00000000-0000-0000-0000-0000000000a0');
select lives_ok(
  $$ select public.advance_phase(current_setting('t.room_a')::uuid) $$,
  'briefing -> writing generates the rotation schedule server-side');

select is(
  (select count(*)::int from public.assignments where room_id = current_setting('t.room_a')::uuid),
  12, '4 writers x 3 rounds of assignments exist');
select is_empty(
  $$ select 1 from public.assignments
     where room_id = current_setting('t.room_a')::uuid and writer_id = target_id $$,
  'no round ever assigns a writer to themselves (D7)');
select is_empty(
  $$ select round from public.assignments
     where room_id = current_setting('t.room_a')::uuid
     group by round having count(distinct target_id) <> 4 $$,
  'every round is a full permutation of the claimed roster');
select is(
  (select current_round from public.rooms where id = current_setting('t.room_a')::uuid),
  1, 'round 1 starts with the writing phase');

select pg_temp.impersonate('00000000-0000-0000-0000-0000000000a1');
select is(
  (select count(*)::int from public.get_my_assignment(current_setting('t.room_a')::uuid)),
  1, 'a player sees exactly one assignment: their own, this round');
select isnt(
  (select a.target_id from public.get_my_assignment(current_setting('t.room_a')::uuid) a),
  current_setting('t.a_ann')::uuid, 'own assignment never targets self');
select set_config('t.a1_r1_target',
  (select a.target_id::text from public.get_my_assignment(current_setting('t.room_a')::uuid) a),
  true);

select throws_ok(
  $$ select public.submit_note(current_setting('t.room_a')::uuid,
       (select p.id from public.participants p
        where p.room_id = current_setting('t.room_a')::uuid
          and p.id <> current_setting('t.a_ann')::uuid
          and p.id <> current_setting('t.a1_r1_target')::uuid
        limit 1),
       'strength', 'wrong target note') $$,
  'P0001', null, 'Mode A rejects a note to a non-assigned target');

select lives_ok(
  $$ select public.submit_note(current_setting('t.room_a')::uuid,
       current_setting('t.a1_r1_target')::uuid, 'strength', 'ROUND1 note from Ann') $$,
  'assigned-target note lands');

select throws_ok(
  $$ select public.submit_note(current_setting('t.room_a')::uuid,
       current_setting('t.a1_r1_target')::uuid, 'strength', 'second round-1 note') $$,
  'P0001', null, 'one non-bonus note per round per author');

select lives_ok(
  $$ select public.submit_note(current_setting('t.room_a')::uuid,
       (select p.id from public.participants p
        where p.room_id = current_setting('t.room_a')::uuid
          and p.id <> current_setting('t.a_ann')::uuid
          and p.id <> current_setting('t.a1_r1_target')::uuid
        limit 1),
       'wish', 'bonus note from Ann', true) $$,
  'bonus note to a free-chosen target lands (D16)');

-- Grace and finalize (D9)

select throws_ok(
  $$ select public.start_round(current_setting('t.room_a')::uuid) $$,
  '42501', null, 'players cannot open the grace window');

select pg_temp.impersonate('00000000-0000-0000-0000-0000000000a0');
select lives_ok(
  $$ select public.start_round(current_setting('t.room_a')::uuid) $$,
  'host opens the grace window');
select ok(
  (select grace_until is not null from public.rooms where id = current_setting('t.room_a')::uuid),
  'grace window is running');

select pg_temp.impersonate('00000000-0000-0000-0000-0000000000a1');
select is(
  ((public.finalize_round(current_setting('t.room_a')::uuid)) ->> 'current_round')::int,
  1, 'finalize during grace is a no-op (idempotent guard)');

update public.rooms set grace_until = now() - interval '1 second'
where id = current_setting('t.room_a')::uuid;

select pg_temp.impersonate('00000000-0000-0000-0000-0000000000a2');
select is(
  ((public.finalize_round(current_setting('t.room_a')::uuid)) ->> 'current_round')::int,
  2, 'any claimed participant finalizes once grace expires (D9)');
select is(
  ((public.finalize_round(current_setting('t.room_a')::uuid)) ->> 'current_round')::int,
  2, 'racing finalize callers are harmless');

select pg_temp.impersonate('00000000-0000-0000-0000-0000000000a1');
select isnt(
  (select a.target_id from public.get_my_assignment(current_setting('t.room_a')::uuid) a),
  current_setting('t.a1_r1_target')::uuid,
  'round 2 target differs from round 1 target (never a repeat, D7)');

-- ---------------------------------------------------------------------------
-- End-and-delete (D6)
-- ---------------------------------------------------------------------------

select throws_ok(
  $$ select public.end_room(current_setting('t.room_a')::uuid) $$,
  '42501', null, 'players cannot end the room');

select pg_temp.impersonate('00000000-0000-0000-0000-0000000000a0');
select lives_ok(
  $$ select public.end_room(current_setting('t.room_a')::uuid) $$,
  'host ends the room');
select is(
  (select count(*)::int from public.notes where room_id = current_setting('t.room_a')::uuid),
  0, 'end-and-delete cascades every note away');
select is(
  (public.join_room(current_setting('t.code_a'))) ->> 'found', 'false',
  'an ended room is gone: no live room for latecomers');

select * from finish();
rollback;
