-- Institutional roles are explicit grants by the principal administrator.
-- Legacy community_members.role is not an institutional authorization source.
create schema if not exists community_private;
revoke all on schema community_private from public;
grant usage on schema community_private to anon, authenticated, service_role;

create table if not exists public.community_profile_roles (
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'editor', 'moderator')),
  can_edit_plans boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (community_id, user_id)
);
create index if not exists community_profile_roles_user_idx
  on public.community_profile_roles(user_id, community_id);
alter table public.community_profile_roles enable row level security;
revoke all on public.community_profile_roles from anon, authenticated;
grant select, insert, update, delete on public.community_profile_roles to authenticated;

create or replace function community_private.can_manage_profile(
  target_community uuid, capability text default 'settings'
) returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.communities c where c.id = target_community and (
      c.owner_id = (select auth.uid()) or exists (
        select 1 from public.community_profile_roles r
        join public.community_members m
          on m.community_id = r.community_id and m.user_id = r.user_id
        where r.community_id = c.id and r.user_id = (select auth.uid())
          and m.status = 'active'
          and (r.role = 'admin'
            or (capability = 'content' and r.role = 'editor')
            or (capability = 'plans' and r.role = 'editor' and r.can_edit_plans)
            or (capability = 'moderation' and r.role = 'moderator'))
      )
    )
  );
$$;
revoke all on function community_private.can_manage_profile(uuid, text) from public;
grant execute on function community_private.can_manage_profile(uuid, text)
  to anon, authenticated, service_role;

drop policy if exists profile_roles_read on public.community_profile_roles;
create policy profile_roles_read on public.community_profile_roles for select to authenticated
using (user_id = (select auth.uid()) or exists (
  select 1 from public.communities c
  where c.id = community_id and c.owner_id = (select auth.uid())
));
drop policy if exists profile_roles_owner on public.community_profile_roles;
create policy profile_roles_owner on public.community_profile_roles for all to authenticated
using (exists (select 1 from public.communities c
  where c.id = community_id and c.owner_id = (select auth.uid())))
with check (exists (select 1 from public.communities c
  where c.id = community_id and c.owner_id = (select auth.uid())));

create table if not exists public.community_sections (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  kind text not null check (kind in ('about', 'rules', 'government', 'economy', 'leaders')),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  position integer not null default 0 check (position >= 0),
  is_visible boolean not null default false,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (community_id, kind),
  unique (community_id, id)
);
create index if not exists community_sections_order_idx
  on public.community_sections(community_id, position, id);
alter table public.community_sections enable row level security;
revoke all on public.community_sections from anon, authenticated;
grant select on public.community_sections to anon, authenticated;
grant insert, update, delete on public.community_sections to authenticated;

drop policy if exists sections_read on public.community_sections;
create policy sections_read on public.community_sections for select to anon, authenticated
using (community_private.can_manage_profile(community_id, 'plans')
  or (is_visible and exists (select 1 from public.communities c where c.id = community_id)));
drop policy if exists sections_manage on public.community_sections;
create policy sections_manage on public.community_sections for all to authenticated
using (community_private.can_manage_profile(community_id, 'settings'))
with check (community_private.can_manage_profile(community_id, 'settings'));

-- Browser callers need a permission answer, never the membership roster.
create or replace function public.community_profile_capabilities(target_community uuid)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'settings', community_private.can_manage_profile(target_community, 'settings'),
    'content', community_private.can_manage_profile(target_community, 'content'),
    'plans', community_private.can_manage_profile(target_community, 'plans'),
    'moderation', community_private.can_manage_profile(target_community, 'moderation')
  );
$$;
revoke all on function public.community_profile_capabilities(uuid) from public;
grant execute on function public.community_profile_capabilities(uuid) to anon, authenticated;
