-- Editors may inspect archived rows for reconciliation. Normal reads explicitly exclude them.
drop policy if exists library_assets_read on public.community_library_assets;
create policy library_assets_read on public.community_library_assets for select to anon, authenticated
using (community_private.can_manage_profile(community_id, 'content') or (
  deleted_at is null and is_published and community_private.can_read_library(community_id, visibility)
  and (folder_id is null or exists (select 1 from public.community_asset_folders f
    where f.id = folder_id and f.community_id = community_library_assets.community_id and f.is_visible))
));

-- Durable outbox survives deletion of a community and tracks objects awaiting removal.
-- The cleanup worker is the only consumer; no identifiers are exposed through this table.
create table if not exists public.community_asset_deletions (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('image', 'video', 'document')),
  media_id text not null,
  created_at timestamptz not null default now(),
  available_at timestamptz not null default now(),
  attempts integer not null default 0,
  last_error text,
  unique (kind, media_id)
);
create index if not exists community_asset_deletions_pending_idx on public.community_asset_deletions(available_at, id);
alter table public.community_asset_deletions enable row level security;
revoke all on public.community_asset_deletions from anon, authenticated;
grant all on public.community_asset_deletions to service_role;
grant usage, select on sequence public.community_asset_deletions_id_seq to service_role;
create or replace function community_private.queue_asset_retirement()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' or new.media_id is distinct from old.media_id
    or (old.deleted_at is null and new.deleted_at is not null) then
    insert into public.community_asset_deletions(kind, media_id) values(old.kind, old.media_id)
      on conflict(kind, media_id) do nothing;
  end if;
  return null;
end;
$$;
revoke all on function community_private.queue_asset_retirement() from public;
drop trigger if exists queue_asset_retirement on public.community_library_assets;
create trigger queue_asset_retirement after update or delete on public.community_library_assets
  for each row execute function community_private.queue_asset_retirement();

-- Remote object validation happens in server code. Only service_role can cross this boundary.
create or replace function public.finalize_community_asset(
  target_community uuid, actor uuid, upload_id uuid, asset_kind text,
  remote_id text, original_name text, mime_type text, asset_title text,
  byte_size bigint default null, duration numeric default null,
  replace_id uuid default null, expected_version integer default null
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  existing public.community_library_assets;
  receipt public.community_document_uploads;
  saved public.community_library_assets;
  target_id uuid := coalesce(replace_id, upload_id);
begin
  -- Also stamps the verified actor into the audit trigger and rechecks revocation
  -- in the same transaction as the write, including privileged finalization.
  perform set_config('request.jwt.claim.sub', actor::text, true);
  if not community_private.can_manage_profile(target_community, 'content') then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if asset_kind = 'document' then
    select * into receipt from public.community_document_uploads
      where id = upload_id and community_id = target_community and uploaded_by = actor for update;
    if not found or receipt.object_key <> remote_id or receipt.content_type <> mime_type
      or receipt.size_bytes <> byte_size or receipt.original_name <> original_name then
      raise exception 'Upload receipt mismatch' using errcode = '23514';
    end if;
    if receipt.finalized_asset_id is not null and receipt.finalized_asset_id <> target_id then
      raise exception 'Upload already used' using errcode = '23505';
    end if;
  end if;
  if exists (select 1 from public.community_asset_deletions d where d.kind = asset_kind and d.media_id = remote_id) then
    raise exception 'Remote object has been retired' using errcode = '23514';
  end if;
  -- Serialize retries and replacements even before the asset row exists.
  perform pg_advisory_xact_lock(hashtextextended('community-asset:' || target_id::text, 0));
  select * into existing from public.community_library_assets where id = target_id for update;
  if found then
    if existing.community_id <> target_community or existing.kind <> asset_kind or existing.deleted_at is not null then
      raise exception 'Invalid destination' using errcode = '23514';
    end if;
    if existing.media_id = remote_id and existing.uploaded_by = actor then
      return jsonb_build_object('id', existing.id, 'version', existing.version);
    end if;
    if replace_id is null or existing.version is distinct from expected_version then
      raise exception 'Stale version' using errcode = '40001';
    end if;
    update public.community_library_assets set media_id = remote_id,
      original_name = finalize_community_asset.original_name, content_type = mime_type,
      size_bytes = byte_size, duration_seconds = duration, uploaded_by = actor
      where id = target_id returning * into saved;
  else
    if replace_id is not null then raise exception 'Missing destination' using errcode = '23503'; end if;
    insert into public.community_library_assets
      (id, community_id, kind, title, media_id, original_name, content_type, size_bytes, duration_seconds, uploaded_by)
    values (target_id, target_community, asset_kind, asset_title, remote_id,
      finalize_community_asset.original_name, mime_type, byte_size, duration, actor)
    returning * into saved;
  end if;
  if asset_kind = 'document' then
    update public.community_document_uploads set finalized_asset_id = saved.id where id = upload_id;
  end if;
  return jsonb_build_object('id', saved.id, 'version', saved.version);
end;
$$;
revoke all on function public.finalize_community_asset(uuid, uuid, uuid, text, text, text, text, text, bigint, numeric, uuid, integer) from public, anon, authenticated;
grant execute on function public.finalize_community_asset(uuid, uuid, uuid, text, text, text, text, text, bigint, numeric, uuid, integer) to service_role;
