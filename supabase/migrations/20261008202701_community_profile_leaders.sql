-- Directory entries and their contact data have independent publication decisions.
create table if not exists public.community_leader_categories (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null,
  section_id uuid not null,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  position integer not null default 0 check (position>=0),
  is_published boolean not null default false,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (community_id,section_id,id),
  foreign key (community_id,section_id) references public.community_sections(community_id,id) on delete cascade
);
create index if not exists community_leader_categories_order_idx
  on public.community_leader_categories(community_id,section_id,position,id);
create table if not exists public.community_leaders (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null,
  section_id uuid not null,
  category_id uuid,
  full_name text not null check (char_length(btrim(full_name)) between 1 and 160),
  responsibility text not null default '' check (char_length(responsibility)<=200),
  biography text not null default '' check (octet_length(biography)<=50000),
  trajectory text not null default '' check (octet_length(trajectory)<=50000),
  position integer not null default 0 check (position>=0),
  is_published boolean not null default false,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (community_id,id),
  foreign key (community_id,section_id) references public.community_sections(community_id,id) on delete cascade,
  foreign key (community_id,section_id,category_id) references public.community_leader_categories(community_id,section_id,id)
);
create index if not exists community_leaders_order_idx on public.community_leaders(community_id,section_id,position,id);
create index if not exists community_leaders_category_idx on public.community_leaders(community_id,section_id,category_id,position,id);
create table if not exists public.community_leader_contacts (
  id uuid primary key,
  community_id uuid not null,
  email text not null default '' check (char_length(email)<=254),
  phone text not null default '' check (char_length(phone)<=40),
  social_links jsonb not null default '[]'::jsonb
    check (community_private.valid_profile_links(social_links) and octet_length(social_links::text)<=24000),
  profile_id uuid references public.profiles(id) on delete set null,
  is_public boolean not null default false,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (community_id,id) references public.community_leaders(community_id,id) on delete cascade
);
create index if not exists community_leader_contacts_community_idx on public.community_leader_contacts(community_id,id);
create index if not exists community_leader_contacts_profile_idx on public.community_leader_contacts(profile_id);
create table if not exists public.community_leader_media (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null,
  leader_id uuid not null,
  slot text not null check (slot in ('portrait','cover','video')),
  asset_id uuid not null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (leader_id,slot),
  foreign key (community_id,leader_id) references public.community_leaders(community_id,id) on delete cascade,
  foreign key (community_id,asset_id) references public.community_library_assets(community_id,id)
);
create index if not exists community_leader_media_parent_idx on public.community_leader_media(community_id,leader_id);
create index if not exists community_leader_media_asset_idx on public.community_leader_media(community_id,asset_id);

-- The content capability covers institutional data, without granting plan edits.
drop policy if exists sections_content_read on public.community_sections;
create policy sections_content_read on public.community_sections for select to authenticated
using (kind in ('about','leaders') and community_private.can_manage_profile(community_id,'content'));
drop policy if exists leaders_section_audience on public.community_sections;
create policy leaders_section_audience on public.community_sections as restrictive for select to anon,authenticated
using (kind<>'leaders' or community_private.can_read_library(community_id,'public'));

do $$
declare t text;
begin
  foreach t in array array['community_leader_categories','community_leaders','community_leader_contacts','community_leader_media'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon,authenticated',t);
    execute format('grant select on public.%I to anon,authenticated',t);
    execute format('grant insert,update,delete on public.%I to authenticated',t);
    execute format('grant all on public.%I to service_role',t);
    execute format('drop policy if exists directory_insert on public.%I',t);
    execute format('create policy directory_insert on public.%I for insert to authenticated
      with check (community_private.can_manage_profile(community_id,''content''))',t);
    execute format('drop policy if exists directory_update on public.%I',t);
    execute format('create policy directory_update on public.%I for update to authenticated
      using (community_private.can_manage_profile(community_id,''content''))
      with check (community_private.can_manage_profile(community_id,''content''))',t);
    execute format('drop policy if exists directory_delete on public.%I',t);
    execute format('create policy directory_delete on public.%I for delete to authenticated
      using (community_private.can_manage_profile(community_id,''content''))',t);
  end loop;
end;
$$;
drop policy if exists directory_read on public.community_leader_categories;
create policy directory_read on public.community_leader_categories for select to anon,authenticated
using (community_private.can_manage_profile(community_id,'content') or (is_published
  and community_private.can_read_library(community_id,'public')
  and exists(select 1 from public.community_sections s where s.id=section_id
    and s.community_id=community_leader_categories.community_id and s.kind='leaders' and s.is_visible)));
drop policy if exists directory_read on public.community_leaders;
create policy directory_read on public.community_leaders for select to anon,authenticated
using (community_private.can_manage_profile(community_id,'content') or (is_published
  and community_private.can_read_library(community_id,'public')
  and exists(select 1 from public.community_sections s where s.id=section_id
    and s.community_id=community_leaders.community_id and s.kind='leaders' and s.is_visible)
  and (category_id is null or exists(select 1 from public.community_leader_categories c
    where c.id=category_id and c.community_id=community_leaders.community_id and c.is_published))));
drop policy if exists directory_read on public.community_leader_contacts;
create policy directory_read on public.community_leader_contacts for select to anon,authenticated
using (community_private.can_manage_profile(community_id,'content') or (is_public
  and exists(select 1 from public.community_leaders l where l.id=community_leader_contacts.id
    and l.community_id=community_leader_contacts.community_id)));
drop policy if exists directory_read on public.community_leader_media;
create policy directory_read on public.community_leader_media for select to anon,authenticated
using (community_private.can_manage_profile(community_id,'content') or (
  exists(select 1 from public.community_leaders l where l.id=leader_id and l.community_id=community_leader_media.community_id)
  and exists(select 1 from public.community_library_assets a where a.id=asset_id
    and a.community_id=community_leader_media.community_id and a.deleted_at is null)));

create or replace function community_private.prepare_leader_write()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if tg_op='UPDATE' then
    if new.id<>old.id or new.community_id<>old.community_id then
      raise exception 'Directory identity cannot change' using errcode='23514';
    end if;
    if tg_table_name in ('community_leaders','community_leader_categories') then
      if new.section_id<>old.section_id then
        raise exception 'Directory section cannot change' using errcode='23514';
      end if;
    elsif tg_table_name='community_leader_media' then
      if new.leader_id<>old.leader_id or new.slot<>old.slot then
        raise exception 'Media slot cannot change' using errcode='23514';
      end if;
    end if;
    new.version:=old.version+1;
    new.created_at:=old.created_at;
  else
    new.version:=1;
    new.created_at:=now();
  end if;
  new.updated_at:=now();
  if tg_table_name in ('community_leaders','community_leader_categories') then
    if not exists(select 1 from public.community_sections s where s.id=new.section_id
      and s.community_id=new.community_id and s.kind='leaders') then
      raise exception 'Invalid leaders section' using errcode='23514';
    end if;
  elsif tg_table_name='community_leader_media' then
    if not exists(select 1 from public.community_library_assets a where a.id=new.asset_id
      and a.community_id=new.community_id and a.deleted_at is null
      and a.kind=case when new.slot='video' then 'video' else 'image' end) then
      raise exception 'Invalid directory media' using errcode='23514';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function community_private.prepare_leader_write() from public;
do $$
declare t text;
begin
  foreach t in array array['community_leader_categories','community_leaders','community_leader_contacts','community_leader_media'] loop
    execute format('drop trigger if exists prepare_leader_write on public.%I',t);
    execute format('create trigger prepare_leader_write before insert or update on public.%I
      for each row execute function community_private.prepare_leader_write()',t);
    execute format('drop trigger if exists record_directory_revision on public.%I',t);
    execute format('create trigger record_directory_revision after insert or update or delete on public.%I
      for each row execute function community_private.record_plan_revision()',t);
  end loop;
end;
$$;
