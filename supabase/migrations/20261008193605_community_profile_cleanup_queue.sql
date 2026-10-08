-- Retain completed tombstones: a delayed finalization must never resurrect a
-- remote identifier after its deletion has been acknowledged.
alter table public.community_asset_deletions add column if not exists completed_at timestamptz;
alter table public.community_asset_deletions add column if not exists lease_token uuid;
create index if not exists community_asset_deletions_ready_idx
  on public.community_asset_deletions(available_at, id) where completed_at is null;
drop index if exists public.community_asset_deletions_pending_idx;

create or replace function community_private.guard_retired_asset()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.media_id = old.media_id then return new; end if;
  perform pg_advisory_xact_lock(hashtextextended('community-remote:' || new.kind || ':' || new.media_id, 0));
  if exists (select 1 from public.community_asset_deletions where kind = new.kind and media_id = new.media_id) then
    raise exception 'Remote object has been retired' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function community_private.guard_retired_asset() from public, anon, authenticated;
drop trigger if exists guard_retired_asset on public.community_library_assets;
create trigger guard_retired_asset before insert or update of media_id on public.community_library_assets
  for each row execute function community_private.guard_retired_asset();

create or replace function community_private.queue_asset_retirement()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' or new.media_id is distinct from old.media_id
    or (old.deleted_at is null and new.deleted_at is not null) then
    perform pg_advisory_xact_lock(hashtextextended('community-remote:' || old.kind || ':' || old.media_id, 0));
    insert into public.community_asset_deletions(kind, media_id) values(old.kind, old.media_id)
      on conflict(kind, media_id) do nothing;
  end if;
  return null;
end;
$$;
revoke all on function community_private.queue_asset_retirement() from public, anon, authenticated;

create or replace function public.claim_community_asset_deletions(batch_size integer default 5)
returns jsonb language sql security invoker set search_path = '' as $$
  with ready as (
    select id from public.community_asset_deletions
    where completed_at is null and available_at <= clock_timestamp()
    order by available_at, id limit greatest(1, least(coalesce(batch_size, 5), 20))
    for update skip locked
  ), claimed as (
    update public.community_asset_deletions d
    set lease_token = gen_random_uuid(), available_at = clock_timestamp() + interval '5 minutes',
      attempts = least(d.attempts, 2147483646) + 1
    from ready where d.id = ready.id returning d.*
  )
  select coalesce(jsonb_agg(jsonb_build_object('id', id::text, 'kind', kind, 'media_id', media_id,
    'lease_token', lease_token, 'attempts', attempts)), '[]'::jsonb) from claimed;
$$;
revoke all on function public.claim_community_asset_deletions(integer) from public, anon, authenticated;
grant execute on function public.claim_community_asset_deletions(integer) to service_role;

create or replace function public.finish_community_asset_deletion(
  job_id bigint, claimed_lease uuid, succeeded boolean, failure_code text default null
) returns boolean language plpgsql security invoker set search_path = '' as $$
declare affected integer;
begin
  update public.community_asset_deletions set
    completed_at = case when succeeded then clock_timestamp() else null end,
    available_at = case when succeeded then available_at else clock_timestamp()
      + make_interval(secs => least(86400, 30 * power(2, least(attempts, 12)))::integer) end,
    lease_token = null,
    last_error = case when succeeded then null else left(coalesce(failure_code, 'cleanup_failed'), 100) end
  where id = job_id and lease_token = claimed_lease and completed_at is null;
  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;
revoke all on function public.finish_community_asset_deletion(bigint, uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.finish_community_asset_deletion(bigint, uuid, boolean, text) to service_role;
