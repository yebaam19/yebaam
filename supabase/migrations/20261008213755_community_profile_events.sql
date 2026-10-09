create table if not exists public.community_events (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 180),
  description text not null default '' check (char_length(description) <= 10000),
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  location text not null default '' check (char_length(location) <= 500),
  virtual_url text not null default '' check (virtual_url = '' or (char_length(virtual_url) <= 2000 and virtual_url ~ '^https?://[^[:space:]]+$')),
  organizer text not null check (char_length(btrim(organizer)) between 1 and 180),
  registration_info text not null default '' check (char_length(registration_info) <= 2000),
  registration_url text not null default '' check (registration_url = '' or (char_length(registration_url) <= 2000 and registration_url ~ '^https?://[^[:space:]]+$')),
  cover_asset_id uuid,
  rsvp_enabled boolean not null default false,
  is_published boolean not null default false,
  is_cancelled boolean not null default false,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (btrim(location) <> '' or virtual_url <> ''),
  foreign key (community_id, cover_asset_id) references public.community_library_assets(community_id,id)
);
create index if not exists community_events_calendar_idx on public.community_events(community_id, starts_at, id) where deleted_at is null;
create index if not exists community_events_cover_idx on public.community_events(community_id,cover_asset_id) where cover_asset_id is not null;

alter table public.community_events enable row level security;
revoke all on public.community_events from anon, authenticated;
grant select on public.community_events to anon, authenticated;
grant insert, update on public.community_events to authenticated;
grant all on public.community_events to service_role;
drop policy if exists community_events_read on public.community_events;
create policy community_events_read on public.community_events for select to anon, authenticated using (
  community_private.can_manage_profile(community_id,'settings')
  or (deleted_at is null and is_published and community_private.can_read_library(community_id,'public'))
);
drop policy if exists community_events_insert on public.community_events;
create policy community_events_insert on public.community_events for insert to authenticated
with check (community_private.can_manage_profile(community_id,'settings'));
drop policy if exists community_events_update on public.community_events;
create policy community_events_update on public.community_events for update to authenticated
using (community_private.can_manage_profile(community_id,'settings'))
with check (community_private.can_manage_profile(community_id,'settings'));

create or replace function community_private.validate_event()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op='UPDATE' and (new.id,new.community_id) is distinct from (old.id,old.community_id) then
    raise exception 'Event identity is immutable' using errcode='23514';
  end if;
  if new.cover_asset_id is not null and not exists (
    select 1 from public.community_library_assets a where a.id=new.cover_asset_id
      and a.community_id=new.community_id and a.kind='image' and a.deleted_at is null
  ) then raise exception 'Cover is unavailable' using errcode='23514'; end if;
  new.version := case when tg_op='INSERT' then 1 else old.version+1 end;
  new.created_at := case when tg_op='INSERT' then now() else old.created_at end;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function community_private.validate_event() from public,anon,authenticated;
drop trigger if exists validate_community_event on public.community_events;
create trigger validate_community_event before insert or update on public.community_events
  for each row execute function community_private.validate_event();
drop trigger if exists audit_community_event on public.community_events;
create trigger audit_community_event after insert or update on public.community_events
  for each row execute function community_private.record_plan_revision();

create table if not exists public.community_event_attendance (
  event_id uuid not null references public.community_events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id,user_id)
);
create index if not exists community_event_attendance_user_idx on public.community_event_attendance(user_id,event_id);
alter table public.community_event_attendance enable row level security;
revoke all on public.community_event_attendance from anon,authenticated;
grant select on public.community_event_attendance to authenticated;
grant all on public.community_event_attendance to service_role;
drop policy if exists event_attendance_own on public.community_event_attendance;
create policy event_attendance_own on public.community_event_attendance for select to authenticated
using (user_id=(select auth.uid()) and exists(select 1 from public.community_events e where e.id=event_id and e.deleted_at is null));

-- Only this bounded operation may write attendance. The event row lock serializes
-- RSVP with cancellation/disable/archive; no public roster or spoofable user ID.
create or replace function community_private.set_event_attendance(target_event uuid, attending boolean)
returns boolean language plpgsql security definer set search_path = '' as $$
declare e public.community_events; caller uuid:=auth.uid();
begin
  if caller is null or attending is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select * into e from public.community_events where id=target_event for update;
  if not found or e.deleted_at is not null or not e.is_published
    or not community_private.can_read_library(e.community_id,'public') then
    raise exception 'Event unavailable' using errcode='42501';
  end if;
  if attending then
    if not e.rsvp_enabled or e.is_cancelled or e.ends_at<=clock_timestamp() then
      raise exception 'Attendance is closed' using errcode='23514';
    end if;
    insert into public.community_event_attendance(event_id,user_id) values(e.id,caller) on conflict do nothing;
  else
    delete from public.community_event_attendance where event_id=e.id and user_id=caller;
  end if;
  return attending;
end;
$$;
revoke all on function community_private.set_event_attendance(uuid,boolean) from public,anon;
grant execute on function community_private.set_event_attendance(uuid,boolean) to authenticated;
create or replace function public.set_community_event_attendance(target_event uuid, attending boolean)
returns boolean language sql security invoker set search_path = '' as $$
  select community_private.set_event_attendance(target_event,attending);
$$;
revoke all on function public.set_community_event_attendance(uuid,boolean) from public,anon;
grant execute on function public.set_community_event_attendance(uuid,boolean) to authenticated;
