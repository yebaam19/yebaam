-- One atomic, versioned showcase per community. Assets remain owned by the library.
create table if not exists public.community_showcases (
  id uuid primary key references public.communities(id) on delete cascade,
  community_id uuid not null unique references public.communities(id) on delete cascade,
  introduction text not null default '' check (char_length(introduction)<=1200),
  is_published boolean not null default false,
  version integer not null default 1 check (version>0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (id=community_id)
);
create table if not exists public.community_showcase_videos (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.community_showcases(community_id) on delete cascade,
  asset_id uuid not null,
  position integer not null check (position between 0 and 3),
  unique (community_id,asset_id),
  constraint community_showcase_video_position unique (community_id,position) deferrable initially deferred,
  foreign key (community_id,asset_id) references public.community_library_assets(community_id,id)
);

alter table public.community_showcases enable row level security;
alter table public.community_showcase_videos enable row level security;
-- Direct writes are deliberately unavailable: order, metadata and version must commit together.
revoke all on public.community_showcases,public.community_showcase_videos from anon,authenticated;
grant select on public.community_showcases,public.community_showcase_videos to anon,authenticated;
grant all on public.community_showcases,public.community_showcase_videos to service_role;
drop policy if exists showcase_read on public.community_showcases;
create policy showcase_read on public.community_showcases for select to anon,authenticated
using (community_private.can_manage_profile(community_id,'content')
  or (is_published and community_private.can_read_library(community_id,'public')));
drop policy if exists showcase_video_read on public.community_showcase_videos;
create policy showcase_video_read on public.community_showcase_videos for select to anon,authenticated
using (community_private.can_manage_profile(community_id,'content') or (
  exists(select 1 from public.community_showcases s where s.community_id=community_showcase_videos.community_id and s.is_published)
  and exists(select 1 from public.community_library_assets a where a.community_id=community_showcase_videos.community_id
    and a.id=asset_id and a.deleted_at is null)));
drop trigger if exists record_showcase_revision on public.community_showcases;
create trigger record_showcase_revision after insert or update or delete on public.community_showcases
  for each row execute function community_private.record_plan_revision();
drop trigger if exists record_showcase_video_revision on public.community_showcase_videos;
create trigger record_showcase_video_revision after insert or update or delete on public.community_showcase_videos
  for each row execute function community_private.record_plan_revision();

-- Narrow privileged boundary: table writes are revoked to prevent partial reorders.
-- The verified caller's content capability and every asset's community/type are checked here.
create or replace function community_private.save_showcase(
  target_community uuid, expected_version integer, introduction_text text,
  publish_showcase boolean, video_assets uuid[]
) returns integer language plpgsql security definer set search_path='' as $$
declare
  current_row public.community_showcases%rowtype;
  current_assets uuid[];
  created_id uuid;
  next_version integer;
begin
  if auth.uid() is null or not community_private.can_manage_profile(target_community,'content') then
    raise exception 'Content permission required' using errcode='42501';
  end if;
  if expected_version is null or expected_version<0 or introduction_text is null
    or char_length(introduction_text)>1200 or publish_showcase is null or video_assets is null
    or cardinality(video_assets)>4 or array_ndims(video_assets)>1
    or exists(select 1 from unnest(video_assets) asset where asset is null)
    or (select count(distinct asset) from unnest(video_assets) asset)<>cardinality(video_assets) then
    raise exception 'Invalid showcase' using errcode='23514';
  end if;
  if exists(select 1 from unnest(video_assets) asset where not exists(
    select 1 from public.community_library_assets a where a.id=asset and a.community_id=target_community
      and a.kind='video' and a.deleted_at is null)) then
    raise exception 'Unavailable video' using errcode='23514';
  end if;
  insert into public.community_showcases(id,community_id)
    values(target_community,target_community) on conflict(id) do nothing returning id into created_id;
  select * into strict current_row from public.community_showcases where id=target_community for update;
  select coalesce(array_agg(asset_id order by position),'{}'::uuid[]) into current_assets
    from public.community_showcase_videos where community_id=target_community;
  -- A retry after a lost response succeeds without adding another revision or side effect.
  if created_id is null and current_row.introduction=introduction_text
    and current_row.is_published=publish_showcase and current_assets=video_assets then
    return current_row.version;
  end if;
  if (created_id is not null and expected_version<>0)
    or (created_id is null and expected_version<>current_row.version) then
    raise exception 'Showcase changed' using errcode='40001';
  end if;
  delete from public.community_showcase_videos where community_id=target_community and not(asset_id=any(video_assets));
  update public.community_showcase_videos v set position=(picked.ordinality-1)::integer
    from unnest(video_assets) with ordinality picked(asset_id,ordinality)
    where v.community_id=target_community and v.asset_id=picked.asset_id and v.position<>picked.ordinality-1;
  insert into public.community_showcase_videos(community_id,asset_id,position)
    select target_community,picked.asset_id,(picked.ordinality-1)::integer
    from unnest(video_assets) with ordinality picked(asset_id,ordinality)
    where not exists(select 1 from public.community_showcase_videos v
      where v.community_id=target_community and v.asset_id=picked.asset_id);
  update public.community_showcases set introduction=introduction_text,is_published=publish_showcase,
    version=case when created_id is null then version+1 else version end,updated_at=now()
    where id=target_community returning version into next_version;
  return next_version;
end;
$$;
revoke all on function community_private.save_showcase(uuid,integer,text,boolean,uuid[]) from public,anon,authenticated;
grant execute on function community_private.save_showcase(uuid,integer,text,boolean,uuid[]) to authenticated;
create or replace function public.save_community_showcase(
  target_community uuid, expected_version integer, introduction_text text,
  publish_showcase boolean, video_assets uuid[]
) returns integer language sql security invoker set search_path='' as $$
  select community_private.save_showcase(target_community,expected_version,introduction_text,publish_showcase,video_assets);
$$;
revoke all on function public.save_community_showcase(uuid,integer,text,boolean,uuid[]) from public,anon,authenticated;
grant execute on function public.save_community_showcase(uuid,integer,text,boolean,uuid[]) to authenticated;
