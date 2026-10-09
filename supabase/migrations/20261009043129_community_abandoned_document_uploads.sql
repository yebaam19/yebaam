-- A signed PUT lives for five minutes. Keep its receipt for a full day after
-- the latest signature before retiring a file that was never finalized.
alter table public.community_document_uploads
  add column if not exists last_signed_at timestamptz not null default now(),
  add column if not exists finalized_at timestamptz,
  add column if not exists retired_at timestamptz;
update public.community_document_uploads set finalized_at = coalesce(finalized_at, now())
  where finalized_asset_id is not null and finalized_at is null;
create index if not exists community_document_uploads_abandoned_idx
  on public.community_document_uploads(last_signed_at, id)
  where finalized_at is null and retired_at is null;

create or replace function community_private.stamp_document_finalization()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.finalized_asset_id is not null then
    new.finalized_at := coalesce(old.finalized_at, clock_timestamp());
  end if;
  return new;
end;
$$;
revoke all on function community_private.stamp_document_finalization() from public, anon, authenticated;
drop trigger if exists stamp_document_finalization on public.community_document_uploads;
create trigger stamp_document_finalization before update of finalized_asset_id
  on public.community_document_uploads for each row
  execute function community_private.stamp_document_finalization();

-- Called only after the route has verified the actor and the content capability.
-- The row lock serializes re-signing with the abandoned-upload sweep.
create or replace function public.prepare_community_document_upload(
  target_community uuid, actor uuid, upload_id uuid, object_key text,
  mime_type text, byte_size bigint, original_name text
) returns boolean language plpgsql security invoker set search_path = '' as $$
declare receipt public.community_document_uploads;
begin
  if object_key !~ '^[a-f0-9-]{36}/communities/[a-f0-9-]{36}/[a-f0-9-]{36}\.(pdf|docx?|xlsx?|pptx?|txt|zip)$'
    or object_key not like actor::text || '/communities/' || target_community::text || '/' || upload_id::text || '.%'
    then return false;
  end if;
  insert into public.community_document_uploads
    (id, community_id, uploaded_by, object_key, content_type, size_bytes, original_name)
    values (upload_id, target_community, actor, object_key, mime_type, byte_size, original_name)
    on conflict (id) do nothing;
  select * into receipt from public.community_document_uploads where id = upload_id for update;
  if receipt.community_id is distinct from target_community or receipt.uploaded_by is distinct from actor
    or receipt.object_key is distinct from object_key or receipt.content_type is distinct from mime_type
    or receipt.size_bytes is distinct from byte_size or receipt.original_name is distinct from original_name
    or receipt.finalized_at is not null or receipt.retired_at is not null then return false; end if;
  perform pg_advisory_xact_lock(hashtextextended('community-remote:document:' || object_key, 0));
  if exists (select 1 from public.community_asset_deletions where kind = 'document' and media_id = object_key) then
    update public.community_document_uploads set retired_at = clock_timestamp() where id = upload_id;
    return false;
  end if;
  update public.community_document_uploads set last_signed_at = clock_timestamp()
    where id = upload_id;
  return true;
end;
$$;
revoke all on function public.prepare_community_document_upload(uuid, uuid, uuid, text, text, bigint, text)
  from public, anon, authenticated;
grant execute on function public.prepare_community_document_upload(uuid, uuid, uuid, text, text, bigint, text)
  to service_role;

-- Lock each receipt before deciding. A concurrent finalization either wins first
-- or sees the retirement tombstone and cannot attach a deleted remote object.
create or replace function public.queue_abandoned_community_documents(batch_size integer default 20)
returns integer language plpgsql security invoker set search_path = '' as $$
declare receipt public.community_document_uploads; queued integer := 0;
begin
  for receipt in select * from public.community_document_uploads
      where finalized_at is null and retired_at is null
        and last_signed_at < clock_timestamp() - interval '24 hours'
      order by last_signed_at, id limit greatest(1, least(coalesce(batch_size, 20), 100))
      for update skip locked loop
    perform pg_advisory_xact_lock(hashtextextended('community-remote:document:' || receipt.object_key, 0));
    if exists (select 1 from public.community_library_assets
      where kind = 'document' and media_id = receipt.object_key and deleted_at is null) then
      update public.community_document_uploads set finalized_at = clock_timestamp() where id = receipt.id;
      continue;
    end if;
    update public.community_document_uploads set retired_at = clock_timestamp() where id = receipt.id;
    insert into public.community_asset_deletions(kind, media_id)
      values ('document', receipt.object_key) on conflict (kind, media_id) do nothing;
    queued := queued + 1;
  end loop;
  return queued;
end;
$$;
revoke all on function public.queue_abandoned_community_documents(integer) from public, anon, authenticated;
grant execute on function public.queue_abandoned_community_documents(integer) to service_role;

-- Community or user deletion can cascade the receipt while its signed URL is
-- still valid. Delay the remote delete past the five-minute PUT lifetime.
create or replace function community_private.retire_unfinished_document_on_delete()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.finalized_at is null and old.retired_at is null then
    perform pg_advisory_xact_lock(hashtextextended('community-remote:document:' || old.object_key, 0));
    insert into public.community_asset_deletions(kind, media_id, available_at)
      values ('document', old.object_key,
        greatest(clock_timestamp(), old.last_signed_at + interval '10 minutes'))
      on conflict (kind, media_id) do nothing;
  end if;
  return old;
end;
$$;
revoke all on function community_private.retire_unfinished_document_on_delete() from public, anon, authenticated;
drop trigger if exists retire_unfinished_document_on_delete on public.community_document_uploads;
create trigger retire_unfinished_document_on_delete before delete
  on public.community_document_uploads for each row
  execute function community_private.retire_unfinished_document_on_delete();

-- Wake the HTTP worker for either an existing retirement or a stale receipt.
create or replace function community_private.dispatch_asset_cleanup()
returns bigint language plpgsql security invoker set search_path = '' as $$
declare endpoint text; secret text;
begin
  if not exists (select 1 from public.community_asset_deletions
    where completed_at is null and available_at <= clock_timestamp())
    and not exists (select 1 from public.community_document_uploads
      where finalized_at is null and retired_at is null
        and last_signed_at < clock_timestamp() - interval '24 hours') then return null; end if;
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
