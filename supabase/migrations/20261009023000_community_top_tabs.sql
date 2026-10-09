-- Per-community content navigation. Rows are optional: absent rows use the app defaults.
create table if not exists public.community_top_tabs (
  community_id uuid not null references public.communities(id) on delete cascade,
  tab_key text not null check (tab_key in ('posts', 'photos', 'videos', 'articles', 'files', 'pdf')),
  title text not null check (char_length(btrim(title)) between 1 and 40),
  position integer not null check (position between 0 and 5),
  is_visible boolean not null default true,
  version integer not null default 1 check (version > 0),
  updated_at timestamptz not null default now(),
  primary key (community_id, tab_key)
);
create index if not exists community_top_tabs_order_idx
  on public.community_top_tabs (community_id, position, tab_key);
alter table public.community_top_tabs enable row level security;
revoke all on public.community_top_tabs from anon, authenticated;
grant select on public.community_top_tabs to anon, authenticated;
grant insert, update on public.community_top_tabs to authenticated;

create policy top_tabs_read on public.community_top_tabs for select to anon, authenticated
using (
  community_private.can_manage_profile(community_id, 'settings')
  or (is_visible and community_private.can_read_library(community_id, 'public'))
);
create policy top_tabs_insert on public.community_top_tabs for insert to authenticated
with check (community_private.can_manage_profile(community_id, 'settings'));
create policy top_tabs_update on public.community_top_tabs for update to authenticated
using (community_private.can_manage_profile(community_id, 'settings'))
with check (community_private.can_manage_profile(community_id, 'settings'));

-- Invoker permissions and a community row lock keep a six-tab edit atomic.
create or replace function public.save_community_top_tabs(target_community uuid, desired jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  invalid_count integer;
  result jsonb;
begin
  if (select auth.uid()) is null or
    not community_private.can_manage_profile(target_community, 'settings') then
    raise insufficient_privilege using message = 'Only community settings managers can edit tabs';
  end if;
  perform 1 from public.communities where id = target_community for update;
  if not found then raise foreign_key_violation using message = 'Community not found'; end if;
  if jsonb_typeof(desired) is distinct from 'array' or jsonb_array_length(desired) <> 6 then
    raise check_violation using message = 'Exactly six tabs are required';
  end if;

  with incoming as (
    select * from jsonb_to_recordset(desired) as t(
      tab_key text, title text, position integer, is_visible boolean, expected_version integer
    )
  )
  select count(*) filter (where
    tab_key is null or tab_key not in ('posts', 'photos', 'videos', 'articles', 'files', 'pdf')
    or title is null or char_length(btrim(title)) not between 1 and 40
    or position is null or position not between 0 and 5
    or is_visible is null or expected_version is null or expected_version < 0
    or expected_version > 2147483646
  ) + (6 - count(distinct tab_key)) + (6 - count(distinct position))
  into invalid_count from incoming;
  if invalid_count <> 0 then raise check_violation using message = 'Invalid tab configuration'; end if;

  with incoming as (
    select * from jsonb_to_recordset(desired) as t(
      tab_key text, title text, position integer, is_visible boolean, expected_version integer
    )
  )
  select count(*) into invalid_count from incoming i
  left join public.community_top_tabs saved
    on saved.community_id = target_community and saved.tab_key = i.tab_key
  where coalesce(saved.version, 0) <> i.expected_version;
  if invalid_count <> 0 then raise serialization_failure using message = 'Tabs changed since loading'; end if;

  insert into public.community_top_tabs (community_id, tab_key, title, position, is_visible)
  select target_community, t.tab_key, btrim(t.title), t.position, t.is_visible
  from jsonb_to_recordset(desired) as t(
    tab_key text, title text, position integer, is_visible boolean, expected_version integer
  )
  on conflict (community_id, tab_key) do update set
    title = excluded.title, position = excluded.position, is_visible = excluded.is_visible,
    version = community_top_tabs.version + 1, updated_at = now();

  select jsonb_agg(jsonb_build_object('tab_key', tab_key, 'title', title,
    'position', position, 'is_visible', is_visible, 'version', version) order by position)
  into result from public.community_top_tabs where community_id = target_community;
  return result;
end;
$$;
revoke all on function public.save_community_top_tabs(uuid, jsonb) from public, anon;
grant execute on function public.save_community_top_tabs(uuid, jsonb) to authenticated;
