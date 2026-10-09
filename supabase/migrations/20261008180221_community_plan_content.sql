create table if not exists public.community_plan_axes (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null,
  section_id uuid not null,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  description text not null default '' check (char_length(description) <= 4000),
  position integer not null default 0 check (position >= 0),
  is_published boolean not null default false,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (community_id, section_id, id),
  foreign key (community_id, section_id)
    references public.community_sections(community_id, id) on delete cascade
);
create index if not exists community_plan_axes_order_idx
  on public.community_plan_axes(community_id, section_id, position, id);

create table if not exists public.community_plan_points (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null,
  section_id uuid not null,
  axis_id uuid not null,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  description text not null default '' check (char_length(description) <= 4000),
  content text not null default '' check (octet_length(content) <= 200000),
  position integer not null default 0 check (position >= 0),
  is_published boolean not null default false,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (community_id, section_id, axis_id)
    references public.community_plan_axes(community_id, section_id, id) on delete cascade
);
create index if not exists community_plan_points_order_idx
  on public.community_plan_points(community_id, section_id, axis_id, position, id);

create table if not exists public.community_profile_revisions (
  id bigint generated always as identity primary key,
  community_id uuid not null references public.communities(id) on delete cascade,
  entity_table text not null,
  entity_id uuid not null,
  operation text not null check (operation in ('INSERT', 'UPDATE', 'DELETE')),
  actor_id uuid references auth.users(id) on delete set null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);
create index if not exists community_profile_revisions_lookup_idx
  on public.community_profile_revisions(community_id, entity_table, entity_id, id desc);
create index if not exists community_profile_revisions_actor_idx
  on public.community_profile_revisions(actor_id);

alter table public.community_plan_axes enable row level security;
alter table public.community_plan_points enable row level security;
alter table public.community_profile_revisions enable row level security;
revoke all on public.community_plan_axes, public.community_plan_points,
  public.community_profile_revisions from anon, authenticated;
grant select on public.community_plan_axes, public.community_plan_points to anon, authenticated;
grant insert, update, delete on public.community_plan_axes, public.community_plan_points to authenticated;
grant select on public.community_profile_revisions to authenticated;

drop policy if exists axes_read on public.community_plan_axes;
create policy axes_read on public.community_plan_axes for select to anon, authenticated
using (community_private.can_manage_profile(community_id, 'plans') or (
  is_published and exists (select 1 from public.community_sections s
    where s.id = section_id and s.community_id = community_plan_axes.community_id and s.is_visible)
));
drop policy if exists axes_manage on public.community_plan_axes;
create policy axes_manage on public.community_plan_axes for all to authenticated
using (community_private.can_manage_profile(community_id, 'plans'))
with check (community_private.can_manage_profile(community_id, 'plans'));

drop policy if exists points_read on public.community_plan_points;
create policy points_read on public.community_plan_points for select to anon, authenticated
using (community_private.can_manage_profile(community_id, 'plans') or (
  is_published and exists (select 1 from public.community_plan_axes a
    where a.id = axis_id and a.community_id = community_plan_points.community_id and a.is_published)
));
drop policy if exists points_manage on public.community_plan_points;
create policy points_manage on public.community_plan_points for all to authenticated
using (community_private.can_manage_profile(community_id, 'plans'))
with check (community_private.can_manage_profile(community_id, 'plans'));

drop policy if exists revisions_read on public.community_profile_revisions;
create policy revisions_read on public.community_profile_revisions for select to authenticated
using (community_private.can_manage_profile(community_id, 'plans'));

-- Centralize optimistic versions, immutable identity, and modification history.
create or replace function community_private.prepare_plan_write()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if new.id <> old.id or new.community_id <> old.community_id then
      raise exception 'Entity identity cannot change' using errcode = '23514';
    end if;
    if tg_table_name = 'community_sections' then
      if new.kind <> old.kind then
        raise exception 'Section kind cannot change' using errcode = '23514';
      end if;
    elsif new.section_id <> old.section_id then
      raise exception 'Section identity cannot change' using errcode = '23514';
    end if;
    new.version := old.version + 1;
    new.created_at := old.created_at;
  else
    new.version := 1;
    new.created_at := now();
  end if;
  new.updated_at := now();
  if tg_table_name <> 'community_sections' then
    if not exists (
      select 1 from public.community_sections s where s.id = new.section_id
        and s.community_id = new.community_id and s.kind in ('rules', 'government', 'economy')
    ) then
      raise exception 'Invalid plan section' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

-- Definer only for appending audit records; callers have no write grant.
create or replace function community_private.record_plan_revision()
returns trigger language plpgsql security definer set search_path = '' as $$
declare record_data jsonb;
begin
  record_data := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  -- Parent deletion removes the history too (community/account erasure).
  if exists (select 1 from public.communities where id = (record_data->>'community_id')::uuid) then
    insert into public.community_profile_revisions
      (community_id, entity_table, entity_id, operation, actor_id, before_data, after_data)
    values ((record_data->>'community_id')::uuid, tg_table_name,
      (record_data->>'id')::uuid, tg_op, auth.uid(),
      case when tg_op <> 'INSERT' then to_jsonb(old) end,
      case when tg_op <> 'DELETE' then to_jsonb(new) end);
  end if;
  return null;
end;
$$;
revoke all on function community_private.prepare_plan_write() from public;
revoke all on function community_private.record_plan_revision() from public;

do $$
declare table_name text;
begin
  foreach table_name in array array['community_sections', 'community_plan_axes', 'community_plan_points'] loop
    execute format('drop trigger if exists prepare_plan_write on public.%I', table_name);
    execute format('create trigger prepare_plan_write before insert or update on public.%I
      for each row execute function community_private.prepare_plan_write()', table_name);
    execute format('drop trigger if exists record_plan_revision on public.%I', table_name);
    execute format('create trigger record_plan_revision after insert or update or delete on public.%I
      for each row execute function community_private.record_plan_revision()', table_name);
  end loop;
end;
$$;
