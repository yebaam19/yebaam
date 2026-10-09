-- Per-community choices are constrained to YEBAAM's existing green/gold palette.
create table if not exists public.community_profile_theme (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null unique references public.communities(id) on delete cascade,
  primary_color text not null default 'green' check (primary_color in ('green','forest')),
  secondary_color text not null default 'gold' check (secondary_color in ('gold','amber')),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.community_profile_theme enable row level security;
revoke all on public.community_profile_theme from anon, authenticated;
grant select on public.community_profile_theme to anon, authenticated;
grant insert (community_id,primary_color,secondary_color)
  on public.community_profile_theme to authenticated;
grant update (primary_color,secondary_color)
  on public.community_profile_theme to authenticated;
grant all on public.community_profile_theme to service_role;
drop policy if exists community_profile_theme_read on public.community_profile_theme;
create policy community_profile_theme_read on public.community_profile_theme
  for select to anon,authenticated using (
    community_private.can_read_library(community_id,'public')
    or community_private.can_manage_profile(community_id,'settings')
  );
drop policy if exists community_profile_theme_insert on public.community_profile_theme;
create policy community_profile_theme_insert on public.community_profile_theme
  for insert to authenticated with check (
    community_private.can_manage_profile(community_id,'settings')
  );
drop policy if exists community_profile_theme_update on public.community_profile_theme;
create policy community_profile_theme_update on public.community_profile_theme
  for update to authenticated using (
    community_private.can_manage_profile(community_id,'settings')
  ) with check (community_private.can_manage_profile(community_id,'settings'));

create or replace function community_private.prepare_profile_theme_write()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if new.id <> old.id or new.community_id <> old.community_id then
      raise exception 'Theme identity cannot change' using errcode = '23514';
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
revoke all on function community_private.prepare_profile_theme_write()
  from public,anon,authenticated;
drop trigger if exists prepare_profile_theme_write on public.community_profile_theme;
create trigger prepare_profile_theme_write before insert or update
  on public.community_profile_theme for each row
  execute function community_private.prepare_profile_theme_write();
drop trigger if exists record_profile_theme_revision on public.community_profile_theme;
create trigger record_profile_theme_revision after insert or update
  on public.community_profile_theme for each row
  execute function community_private.record_plan_revision();
