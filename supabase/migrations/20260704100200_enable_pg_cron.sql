-- Kindsight M2 migration 6: enable pg_cron and schedule the TTL sweep on
-- stacks where migration 5 found no pg_cron yet (fresh hosted projects).

do $$
begin
  begin
    create extension if not exists pg_cron;
  exception when others then
    raise notice 'pg_cron unavailable, schedule the Edge Function fallback (D13): %', sqlerrm;
  end;

  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if not exists (select 1 from cron.job where jobname = 'kindsight_ttl') then
      perform cron.schedule('kindsight_ttl', '*/30 * * * *',
        'select public.sweep_expired()');
    end if;
    raise notice 'kindsight_ttl sweep is scheduled (every 30 minutes)';
  end if;
end
$$;
