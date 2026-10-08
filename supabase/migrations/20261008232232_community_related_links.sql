-- Linked organisations are explicit institutional content, private until published.
create table if not exists public.community_related_links (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  description text not null default '' check (char_length(description) <= 280),
  href text not null check (char_length(href) <= 2048 and href ~* '^https?://[^[:space:]]+$'),
  image_asset_id uuid,
  position integer not null default 0 check (position >= 0),
  is_published boolean not null default false,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (community_id,id),
  foreign key (community_id,image_asset_id)
    references public.community_library_assets(community_id,id)
);
create index if not exists community_related_links_order_idx
  on public.community_related_links(community_id,position,id) where deleted_at is null;
create index if not exists community_related_links_image_idx
  on public.community_related_links(community_id,image_asset_id) where image_asset_id is not null;

alter table public.community_related_links enable row level security;
revoke all on public.community_related_links from anon,authenticated;
grant select on public.community_related_links to anon,authenticated;
grant insert,update on public.community_related_links to authenticated;
grant all on public.community_related_links to service_role;
drop policy if exists community_related_links_read on public.community_related_links;
create policy community_related_links_read on public.community_related_links for select to anon,authenticated
using (community_private.can_manage_profile(community_id,'settings') or
  (deleted_at is null and is_published and community_private.can_read_library(community_id,'public')));
drop policy if exists community_related_links_insert on public.community_related_links;
create policy community_related_links_insert on public.community_related_links for insert to authenticated
with check (community_private.can_manage_profile(community_id,'settings'));
drop policy if exists community_related_links_update on public.community_related_links;
create policy community_related_links_update on public.community_related_links for update to authenticated
using (community_private.can_manage_profile(community_id,'settings'))
with check (community_private.can_manage_profile(community_id,'settings'));

create or replace function community_private.validate_related_link()
returns trigger language plpgsql set search_path='' as $$
begin
  if tg_op='UPDATE' and (new.id,new.community_id) is distinct from (old.id,old.community_id) then
    raise exception 'Link identity is immutable' using errcode='23514';
  end if;
  if new.is_published and new.image_asset_id is null then
    raise exception 'A published link needs an image' using errcode='23514';
  end if;
  if new.image_asset_id is not null and not exists (
    select 1 from public.community_library_assets a
    where a.id=new.image_asset_id and a.community_id=new.community_id
      and a.kind='image' and a.deleted_at is null
      and (not new.is_published or (a.is_published and a.visibility='public'
        and (a.folder_id is null or exists (
          select 1 from public.community_asset_folders f
          where f.id=a.folder_id and f.community_id=a.community_id and f.is_visible))))
    for share
  ) then raise exception 'Image is unavailable for this link' using errcode='23514'; end if;
  new.version:=case when tg_op='INSERT' then 1 else old.version+1 end;
  new.created_at:=case when tg_op='INSERT' then now() else old.created_at end;
  new.updated_at:=now();
  return new;
end;
$$;
revoke all on function community_private.validate_related_link() from public,anon,authenticated;
drop trigger if exists validate_related_link on public.community_related_links;
create trigger validate_related_link before insert or update on public.community_related_links
  for each row execute function community_private.validate_related_link();
drop trigger if exists audit_related_link on public.community_related_links;
create trigger audit_related_link after insert or update on public.community_related_links
  for each row execute function community_private.record_plan_revision();
