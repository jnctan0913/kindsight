-- Kindsight M2 migration 5: TTL sweep (ENG-PLAN section 9, D13).
-- pg_cron primary; guarded so plain-Postgres and pgTAP runs still apply.
-- The sweep_expired body is also exposed as a definer function so the
-- fallback (a scheduled Edge Function) can call the exact same SQL.

create or replace function public.sweep_expired()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.rooms where expires_at < now();
  delete from public.rooms_attempts where window_start < now() - interval '1 day';
end
$$;

alter function public.sweep_expired() owner to kindsight_api;
revoke all on function public.sweep_expired() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if not exists (select 1 from cron.job where jobname = 'kindsight_ttl') then
      perform cron.schedule('kindsight_ttl', '*/30 * * * *',
        'select public.sweep_expired()');
    end if;
  end if;
end
$$;
