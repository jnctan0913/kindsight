-- Kindsight: persist + broadcast the screen-only host state.
--
-- The console's briefing-frame index and active prompt lived only in local
-- React state / localStorage, so they never crossed devices; the projector
-- mapper hardcoded briefingIndex:0 / activePrompt:null. These are display-only
-- room fields (no notes, no authorship), so there is no anonymity or RLS-on-
-- notes impact. highlight_enabled already exists, is already in the broadcast
-- watch set, and already rides get_bigscreen_state, so it is reused as-is.

-- 1. New display-only columns on rooms.
--    active_prompt is text/null: the console models activePrompt as `string |
--    null` (free prompt text shown on the projector), so text is the faithful
--    minimal type. null means "no prompt showing".
alter table public.rooms
  add column if not exists briefing_index int not null default 0
    check (briefing_index >= 0);

alter table public.rooms
  add column if not exists active_prompt text
    check (active_prompt is null or char_length(active_prompt) between 1 and 280);

-- 2. Publish the two fields through the shared "public room subset". Because
--    get_bigscreen_state, get_snapshot, join_room, create_room, and every RPC
--    that returns a room all compose kindsight_room_public, adding the fields
--    here surfaces them everywhere at once (item 4). highlight_enabled is
--    already present. Additive JSON keys only; no existing key changes.
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
    'briefing_index',    v.briefing_index,
    'active_prompt',     v.active_prompt,
    'music_mood',        v.music_mood,
    'music_on',          v.music_on,
    'seq',               v.updated_seq,
    'expires_at',        v.expires_at
  )
$$;

-- 3. Host-only setter. We extend the existing update_settings patch RPC rather
--    than adding a new RPC: it already host-checks, already drives the room
--    broadcast via the after-update trigger, and the console already calls it
--    for highlight_enabled. Signature is unchanged:
--        update_settings(p_room_id uuid, p_patch jsonb) returns jsonb
--    New patch keys:
--        {"briefing_index": <int>=0>}
--        {"active_prompt": "<text>" | null}   (null clears the prompt)
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
      when 'briefing_index' then
        v_room.briefing_index := (p_patch ->> 'briefing_index')::int;
        if v_room.briefing_index < 0 then
          raise exception 'briefing_index must be >= 0';
        end if;
      when 'active_prompt' then
        -- Absent key leaves it untouched (handled by the outer loop); a present
        -- null clears the prompt, a present string sets it.
        v_room.active_prompt := p_patch ->> 'active_prompt';
        if v_room.active_prompt is not null
           and char_length(v_room.active_prompt) not between 1 and 280 then
          raise exception 'active_prompt must be 1 to 280 characters';
        end if;
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
      briefing_index    = v_room.briefing_index,
      active_prompt     = v_room.active_prompt,
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

-- 4. Watch the two new columns so a screen-state change fires the 'room'
--    broadcast (item 3). highlight_enabled is already watched and already in
--    the payload. Add briefing_index / active_prompt to both the change-detect
--    tuple and the emitted payload.
create or replace function public.rooms_broadcast()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
begin
  if (old.phase, old.current_round, old.round_count, old.round_started_at,
      old.timer_paused_at, old.grace_until, old.highlight_enabled,
      old.briefing_index, old.active_prompt,
      old.music_mood, old.music_on)
     is distinct from
     (new.phase, new.current_round, new.round_count, new.round_started_at,
      new.timer_paused_at, new.grace_until, new.highlight_enabled,
      new.briefing_index, new.active_prompt,
      new.music_mood, new.music_on) then
    perform public.kindsight_notify(new.id, 'room', jsonb_build_object(
      'phase', new.phase,
      'current_round', new.current_round,
      'round_count', new.round_count,
      'round_started_at', new.round_started_at,
      'timer_paused_at', new.timer_paused_at,
      'grace_until', new.grace_until,
      'highlight_enabled', new.highlight_enabled,
      'briefing_index', new.briefing_index,
      'active_prompt', new.active_prompt,
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
