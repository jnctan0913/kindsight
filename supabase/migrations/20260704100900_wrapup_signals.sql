-- Kindsight: wrap-up signals for the host console and projector.
--
-- Additive, display-only changes so the wrap-up screen runs on real data
-- instead of mocks. None exposes authorship (invariant 1): the moderation feed
-- already returns the recipient name + content, and the room-level flags carry
-- no note data.
--
--   1. get_moderation_feed also returns notes.shared_to_wall, so the host can
--      count opted-in notes (the highlight-wall count) and show a per-note "on
--      the wall" indicator. shared_to_wall is the recipient's own choice; the
--      host already sees target + content, so this leaks nothing new.
--   2. rooms.closing: a host-toggled flag that drives the projector's closing /
--      thank-you screen at the very end, so the big screen does not sit forever
--      on the "look at your phone" interstitial.
--   3. rooms.highlight_mode + highlight_target: host controls for HOW opted-in
--      notes display on the projector (rotate all / arranged grid / one person).
--      The projector filters the existing highlight array by recipient name.

-- 1. Moderation feed: surface each note's shared_to_wall. kill_note already
--    forces shared_to_wall = false, so counting non-killed shared rows equals
--    the live opted-in count. Adding an OUT column changes the return type, so
--    the existing function must be dropped first (owner + grant re-applied below).
drop function if exists public.get_moderation_feed(uuid);
create or replace function public.get_moderation_feed(p_room_id uuid)
returns table (
  note_id        uuid,
  target_name    text,
  frame          public.note_frame,
  content        text,
  is_bonus       boolean,
  shared_to_wall boolean,
  killed         boolean,
  created_at     timestamptz
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
  select n.id, t.display_name, n.frame, n.content, n.is_bonus,
         n.shared_to_wall, n.killed, n.created_at
  from public.notes n
  join public.participants t on t.id = n.target_id
  where n.room_id = v_room.id
  order by n.created_at desc;
end
$$;

-- Re-apply the owner and grant lost when the function was dropped above (matches
-- 20260704100000_rpc.sql).
alter function public.get_moderation_feed(uuid) owner to kindsight_api;
grant execute on function public.get_moderation_feed(uuid) to authenticated;

-- 2. Closing flag on rooms. Display-only, defaults off. Meaningful only in
--    wrapup, but not phase-gated in SQL (host-only is enough); the projector
--    reads it and shows the closing screen when true.
alter table public.rooms
  add column if not exists closing boolean not null default false;

-- 3. Highlight-wall display controls. highlight_enabled already gates whether
--    the opted-in notes ride get_bigscreen_state; these two add HOW they show:
--      highlight_mode: 'all' (auto-rotate every opted-in note), 'grid' (show
--        them arranged at once), 'person' (focus one recipient's notes).
--      highlight_target: the recipient display name for 'person' mode (null
--        otherwise). The projector filters the already-returned highlight array
--        by recipient client-side, so no note data changes here.
alter table public.rooms
  add column if not exists highlight_mode text not null default 'all'
    check (highlight_mode in ('all', 'grid', 'person'));

alter table public.rooms
  add column if not exists highlight_target text
    check (highlight_target is null or char_length(highlight_target) between 1 and 40);

-- Publish `closing` through the shared public room subset so it rides
-- get_bigscreen_state / get_snapshot / every room-returning RPC at once.
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
    'highlight_mode',    v.highlight_mode,
    'highlight_target',  v.highlight_target,
    'briefing_index',    v.briefing_index,
    'active_prompt',     v.active_prompt,
    'closing',           v.closing,
    'music_mood',        v.music_mood,
    'music_on',          v.music_on,
    'seq',               v.updated_seq,
    'expires_at',        v.expires_at
  )
$$;

-- Extend the existing host-only settings patch RPC with a {"closing": bool}
-- key. Full body replicated from 20260704100700_screen_state.sql plus the
-- closing case and the closing column in the UPDATE.
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
      when 'highlight_mode' then
        v_room.highlight_mode := p_patch ->> 'highlight_mode';
        if v_room.highlight_mode not in ('all', 'grid', 'person') then
          raise exception 'highlight_mode must be all, grid, or person';
        end if;
      when 'highlight_target' then
        v_room.highlight_target := p_patch ->> 'highlight_target';
        if v_room.highlight_target is not null
           and char_length(v_room.highlight_target) not between 1 and 40 then
          raise exception 'highlight_target must be 1 to 40 characters';
        end if;
      when 'briefing_index' then
        v_room.briefing_index := (p_patch ->> 'briefing_index')::int;
        if v_room.briefing_index < 0 then
          raise exception 'briefing_index must be >= 0';
        end if;
      when 'active_prompt' then
        v_room.active_prompt := p_patch ->> 'active_prompt';
        if v_room.active_prompt is not null
           and char_length(v_room.active_prompt) not between 1 and 280 then
          raise exception 'active_prompt must be 1 to 280 characters';
        end if;
      when 'closing' then
        v_room.closing := (p_patch ->> 'closing')::boolean;
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
      highlight_mode    = v_room.highlight_mode,
      highlight_target  = v_room.highlight_target,
      briefing_index    = v_room.briefing_index,
      active_prompt     = v_room.active_prompt,
      closing           = v_room.closing,
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

-- Watch `closing` so toggling it fires the 'room' broadcast and the projector
-- re-pulls promptly. Full body replicated from screen_state plus closing.
create or replace function public.rooms_broadcast()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
begin
  if (old.phase, old.current_round, old.round_count, old.round_started_at,
      old.timer_paused_at, old.grace_until, old.highlight_enabled,
      old.highlight_mode, old.highlight_target,
      old.briefing_index, old.active_prompt, old.closing,
      old.music_mood, old.music_on)
     is distinct from
     (new.phase, new.current_round, new.round_count, new.round_started_at,
      new.timer_paused_at, new.grace_until, new.highlight_enabled,
      new.highlight_mode, new.highlight_target,
      new.briefing_index, new.active_prompt, new.closing,
      new.music_mood, new.music_on) then
    perform public.kindsight_notify(new.id, 'room', jsonb_build_object(
      'phase', new.phase,
      'current_round', new.current_round,
      'round_count', new.round_count,
      'round_started_at', new.round_started_at,
      'timer_paused_at', new.timer_paused_at,
      'grace_until', new.grace_until,
      'highlight_enabled', new.highlight_enabled,
      'highlight_mode', new.highlight_mode,
      'highlight_target', new.highlight_target,
      'briefing_index', new.briefing_index,
      'active_prompt', new.active_prompt,
      'closing', new.closing,
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
