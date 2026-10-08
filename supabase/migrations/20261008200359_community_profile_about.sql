-- About content is unpublished by default and belongs to the matching section.
create table if not exists public.community_about (
  id uuid primary key,
  community_id uuid not null unique,
  description text not null default '' check (octet_length(description) <= 50000),
  history text not null default '' check (octet_length(history) <= 50000),
  mission text not null default '' check (octet_length(mission) <= 50000),
  vision text not null default '' check (octet_length(vision) <= 50000),
  objectives text not null default '' check (octet_length(objectives) <= 50000),
  "values" text not null default '' check (octet_length("values") <= 50000),
  founded_on date,
  location text not null default '' check (char_length(location) <= 200),
  contact_email text not null default '' check (char_length(contact_email) <= 254),
  contact_phone text not null default '' check (char_length(contact_phone) <= 40),
  website text not null default '' check (website = '' or (char_length(website) <= 2000 and website ~ '^https?://')),
  social_links jsonb not null default '[]'::jsonb,
  is_published boolean not null default false,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (community_id, id),
  foreign key (community_id, id) references public.community_sections(community_id, id) on delete cascade
);

create or replace function community_private.valid_profile_links(links jsonb)
returns boolean language sql immutable security invoker set search_path = '' as $$
  select case when jsonb_typeof(links) <> 'array' then false
    when jsonb_array_length(links) > 10 then false
    else not exists(select 1 from jsonb_array_elements(links) entry
      where jsonb_typeof(entry) <> 'object'
        or jsonb_typeof(entry->'label') is distinct from 'string'
        or jsonb_typeof(entry->'url') is distinct from 'string'
        or char_length(btrim(entry->>'label')) not between 1 and 80
        or char_length(entry->>'url') > 2000
        or (entry->>'url') !~ '^https?://') end;
$$;
revoke all on function community_private.valid_profile_links(jsonb) from public;
grant execute on function community_private.valid_profile_links(jsonb) to anon, authenticated, service_role;
alter table public.community_about drop constraint if exists community_about_links_check;
alter table public.community_about add constraint community_about_links_check
  check (community_private.valid_profile_links(social_links));
alter table public.community_about enable row level security;
revoke all on public.community_about from anon, authenticated;
grant select on public.community_about to anon, authenticated;
grant insert, update on public.community_about to authenticated;
grant all on public.community_about to service_role;
drop policy if exists about_read on public.community_about;
create policy about_read on public.community_about for select to anon, authenticated
using (community_private.can_manage_profile(community_id, 'content') or (is_published
  and exists(select 1 from public.community_sections s where s.id=community_about.id
    and s.community_id=community_about.community_id and s.kind='about' and s.is_visible)));
drop policy if exists about_insert on public.community_about;
create policy about_insert on public.community_about for insert to authenticated
with check (community_private.can_manage_profile(community_id, 'content'));
drop policy if exists about_update on public.community_about;
create policy about_update on public.community_about for update to authenticated
using (community_private.can_manage_profile(community_id, 'content'))
with check (community_private.can_manage_profile(community_id, 'content'));

-- Content editors may see hidden About metadata without gaining plan privileges.
drop policy if exists sections_content_read on public.community_sections;
create policy sections_content_read on public.community_sections for select to authenticated
using (kind='about' and community_private.can_manage_profile(community_id, 'content'));

create or replace function community_private.prepare_about_write()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op='UPDATE' then
    if new.id<>old.id or new.community_id<>old.community_id then
      raise exception 'About identity cannot change' using errcode='23514';
    end if;
    new.version:=old.version+1;
    new.created_at:=old.created_at;
  else
    new.version:=1;
    new.created_at:=now();
  end if;
  new.updated_at:=now();
  if not exists(select 1 from public.community_sections s
    where s.id=new.id and s.community_id=new.community_id and s.kind='about') then
    raise exception 'Invalid About section' using errcode='23514';
  end if;
  return new;
end;
$$;
revoke all on function community_private.prepare_about_write() from public;
drop trigger if exists prepare_about_write on public.community_about;
create trigger prepare_about_write before insert or update on public.community_about
  for each row execute function community_private.prepare_about_write();
drop trigger if exists record_about_revision on public.community_about;
create trigger record_about_revision after insert or update or delete on public.community_about
  for each row execute function community_private.record_plan_revision();

create table if not exists public.community_about_media (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null,
  about_id uuid not null,
  asset_id uuid not null,
  position integer not null default 0 check (position>=0),
  unique (about_id, asset_id),
  foreign key (community_id, about_id) references public.community_about(community_id, id) on delete cascade,
  foreign key (community_id, asset_id) references public.community_library_assets(community_id, id)
);
create index if not exists community_about_media_order_idx on public.community_about_media(community_id,about_id,position,id);
create index if not exists community_about_media_asset_idx on public.community_about_media(community_id,asset_id);
alter table public.community_about_media enable row level security;
revoke all on public.community_about_media from anon, authenticated;
grant select on public.community_about_media to anon, authenticated;
grant insert, delete on public.community_about_media to authenticated;
grant all on public.community_about_media to service_role;
drop policy if exists about_media_read on public.community_about_media;
create policy about_media_read on public.community_about_media for select to anon, authenticated
using (exists(select 1 from public.community_about a where a.id=about_id and a.community_id=community_about_media.community_id)
  and exists(select 1 from public.community_library_assets f where f.id=asset_id
    and f.community_id=community_about_media.community_id and f.deleted_at is null and f.kind in ('image','video')));
drop policy if exists about_media_insert on public.community_about_media;
create policy about_media_insert on public.community_about_media for insert to authenticated
with check (community_private.can_manage_profile(community_id,'content')
  and exists(select 1 from public.community_library_assets f where f.id=asset_id
    and f.community_id=community_about_media.community_id and f.deleted_at is null and f.kind in ('image','video')));
drop policy if exists about_media_delete on public.community_about_media;
create policy about_media_delete on public.community_about_media for delete to authenticated
using (community_private.can_manage_profile(community_id,'content'));
drop trigger if exists record_about_media_revision on public.community_about_media;
create trigger record_about_media_revision after insert or delete on public.community_about_media
  for each row execute function community_private.record_plan_revision();
