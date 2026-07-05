-- Kindsight: allow the highlight wall to focus MULTIPLE recipients at once.
--
-- The console's "Highlight" mode (formerly "One person") is now a multi-select.
-- The projector rings/glows every selected recipient's cards and dims the rest.
-- Selected names are stored in the existing rooms.highlight_target text column as
-- a newline-joined list (display names never contain newlines), so no new column
-- or return-type change is needed. The only DB change is relaxing the 40-char cap
-- (one name) to 600 chars (several names) on both the column constraint and the
-- update_settings validation. No note data is exposed (invariant 1): the target
-- is still just recipient display names, which the host already sees.

alter table public.rooms
  drop constraint if exists rooms_highlight_target_check;

alter table public.rooms
  add constraint rooms_highlight_target_check
    check (highlight_target is null or char_length(highlight_target) between 1 and 600);

-- Recreate update_settings with the relaxed highlight_target length. Full body
-- replicated from 20260704100900_wrapup_signals.sql; only the highlight_target
-- validation (40 -> 600) and its message change.
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
           and char_length(v_room.highlight_target) not between 1 and 600 then
          raise exception 'highlight_target must be 1 to 600 characters';
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
