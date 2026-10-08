-- One library for galleries, document folders, and typed plan attachments.
create or replace function community_private.can_read_library(target_community uuid, audience text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.communities c where c.id = target_community and (
    community_private.can_manage_profile(c.id, 'content') or (
      audience <> 'editors'
      and not exists (select 1 from public.community_members m where m.community_id = c.id
        and m.user_id = (select auth.uid()) and m.status = 'banned')
      and ((audience = 'public' and c.privacy = 'PUBLIC') or exists (
        select 1 from public.community_members m where m.community_id = c.id
          and m.user_id = (select auth.uid()) and m.status = 'active'))
    )
  ));
$$;
revoke all on function community_private.can_read_library(uuid, text) from public;
grant execute on function community_private.can_read_library(uuid, text) to anon, authenticated, service_role;

create table if not exists public.community_asset_folders (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  kind text not null check (kind in ('image', 'video', 'document')),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  is_visible boolean not null default false,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (community_id, kind, id)
);
create index if not exists community_asset_folders_listing_idx
  on public.community_asset_folders(community_id, kind, title, id);

create table if not exists public.community_library_assets (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  kind text not null check (kind in ('image', 'video', 'document')),
  folder_id uuid,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  description text not null default '' check (char_length(description) <= 4000),
  media_id text not null check (char_length(media_id) between 20 and 512 and media_id !~ '://'),
  original_name text not null check (char_length(original_name) between 1 and 255),
  content_type text not null check (char_length(content_type) between 1 and 150),
  size_bytes bigint check (size_bytes > 0 and size_bytes <= 209715200),
  duration_seconds numeric check (duration_seconds >= 0),
  uploaded_by uuid references auth.users(id) on delete set null,
  visibility text not null default 'editors' check (visibility in ('editors', 'members', 'public')),
  is_published boolean not null default false,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (community_id, id),
  unique (kind, media_id),
  foreign key (community_id, kind, folder_id)
    references public.community_asset_folders(community_id, kind, id),
  check ((kind = 'image' and media_id ~ '^[A-Za-z0-9_-]{20,64}$')
    or (kind = 'video' and media_id ~ '^[a-fA-F0-9]{32}$')
    or (kind = 'document' and media_id ~ '^[a-f0-9-]{36}/communities/[a-f0-9-]{36}/[a-f0-9-]{36}\.[a-z0-9]+$'))
);
create index if not exists community_library_assets_listing_idx
  on public.community_library_assets(community_id, kind, created_at desc, id desc) where deleted_at is null;
create index if not exists community_library_assets_folder_idx
  on public.community_library_assets(community_id, kind, folder_id, created_at desc, id desc) where deleted_at is null;
create index if not exists community_library_assets_author_idx on public.community_library_assets(uploaded_by);

-- The upload ledger is server-only; file IDs and expected properties are never trusted from a browser.
create table if not exists public.community_document_uploads (
  id uuid primary key,
  community_id uuid not null references public.communities(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  object_key text not null unique,
  content_type text not null,
  size_bytes bigint not null check (size_bytes between 1 and 10485760),
  original_name text not null check (char_length(original_name) between 1 and 255),
  created_at timestamptz not null default now(),
  finalized_asset_id uuid references public.community_library_assets(id) on delete set null
);
create index if not exists community_document_uploads_author_idx on public.community_document_uploads(uploaded_by, created_at desc);
create index if not exists community_document_uploads_community_idx on public.community_document_uploads(community_id);
create index if not exists community_document_uploads_asset_idx on public.community_document_uploads(finalized_asset_id);

alter table public.community_asset_folders enable row level security;
alter table public.community_library_assets enable row level security;
alter table public.community_document_uploads enable row level security;
revoke all on public.community_asset_folders, public.community_library_assets, public.community_document_uploads from anon, authenticated;
grant select on public.community_asset_folders, public.community_library_assets to anon, authenticated;
grant insert, update, delete on public.community_asset_folders to authenticated;
-- Only the server may finalize or replace a verified Cloudflare object.
grant update (title, description, folder_id, visibility, is_published, deleted_at) on public.community_library_assets to authenticated;
grant all on public.community_asset_folders, public.community_library_assets, public.community_document_uploads to service_role;

drop policy if exists library_folders_read on public.community_asset_folders;
create policy library_folders_read on public.community_asset_folders for select to anon, authenticated
using (community_private.can_manage_profile(community_id, 'content')
  or (is_visible and community_private.can_read_library(community_id, 'public')));
drop policy if exists library_folders_manage on public.community_asset_folders;
create policy library_folders_manage on public.community_asset_folders for all to authenticated
using (community_private.can_manage_profile(community_id, 'content'))
with check (community_private.can_manage_profile(community_id, 'content'));
drop policy if exists library_assets_read on public.community_library_assets;
create policy library_assets_read on public.community_library_assets for select to anon, authenticated
using (deleted_at is null and (community_private.can_manage_profile(community_id, 'content') or (
  is_published and community_private.can_read_library(community_id, visibility)
  and (folder_id is null or exists (select 1 from public.community_asset_folders f
    where f.id = folder_id and f.community_id = community_library_assets.community_id and f.is_visible))
)));
drop policy if exists library_assets_update on public.community_library_assets;
create policy library_assets_update on public.community_library_assets for update to authenticated
using (deleted_at is null and community_private.can_manage_profile(community_id, 'content'))
with check (community_private.can_manage_profile(community_id, 'content'));

create or replace function community_private.prepare_library_write()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if new.id <> old.id or new.community_id <> old.community_id or new.kind <> old.kind then
      raise exception 'Library identity cannot change' using errcode = '23514';
    end if;
    new.version := old.version + 1;
    new.created_at := old.created_at;
  else
    new.version := 1;
    new.created_at := now();
  end if;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function community_private.prepare_library_write() from public;
do $$
declare table_name text;
begin
  foreach table_name in array array['community_asset_folders', 'community_library_assets'] loop
    execute format('drop trigger if exists prepare_library_write on public.%I', table_name);
    execute format('drop trigger if exists record_library_revision on public.%I', table_name);
    execute format('create trigger prepare_library_write before insert or update on public.%I
      for each row execute function community_private.prepare_library_write()', table_name);
    execute format('create trigger record_library_revision after insert or update or delete on public.%I
      for each row execute function community_private.record_plan_revision()', table_name);
  end loop;
end;
$$;
drop policy if exists revisions_read on public.community_profile_revisions;
create policy revisions_read on public.community_profile_revisions for select to authenticated
using (community_private.can_manage_profile(community_id, 'plans') or (
  entity_table in ('community_asset_folders', 'community_library_assets')
  and community_private.can_manage_profile(community_id, 'content')
));
