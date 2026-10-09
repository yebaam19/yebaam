-- pg_cron, pg_net and Vault already exist in this Supabase project.
-- Keep credentials out of cron.job.command and checked-in SQL.
create or replace function community_private.dispatch_asset_cleanup()
returns bigint language plpgsql security invoker set search_path = '' as $$
declare endpoint text; secret text;
begin
  if not exists (select 1 from public.community_asset_deletions
    where completed_at is null and available_at <= clock_timestamp()) then return null; end if;
  select decrypted_secret into endpoint from vault.decrypted_secrets where name = 'community_cleanup_url';
  select decrypted_secret into secret from vault.decrypted_secrets where name = 'community_cleanup_secret';
  if endpoint is null or endpoint !~ '^https://[^/?#]+/api/internal/community-asset-cleanup$'
    or secret is null or length(secret) < 32 then
    raise exception 'Community cleanup scheduler is not configured';
  end if;
  return net.http_post(url := endpoint,
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || secret),
    body := '{}'::jsonb, timeout_milliseconds := 60000);
end;
$$;
revoke all on function community_private.dispatch_asset_cleanup() from public, anon, authenticated, service_role;

-- Do not activate an HTTP job before its application route has been deployed.
-- Existing operator activation survives a reapplication of this migration.
do $$
declare new_job bigint;
begin
  if not exists (select 1 from cron.job where jobname = 'community-asset-cleanup') then
    select cron.schedule('community-asset-cleanup', '*/5 * * * *',
      'select community_private.dispatch_asset_cleanup();') into new_job;
    perform cron.alter_job(new_job, active := false);
  end if;
end;
$$;
