-- Publishing a showcase must not silently omit selected draft/private videos.
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
  if publish_showcase and exists(
    select 1 from unnest(video_assets) asset where not exists(
      select 1 from public.community_library_assets a
      left join public.community_asset_folders f
        on f.id=a.folder_id and f.community_id=a.community_id
      where a.id=asset and a.community_id=target_community
        and a.is_published and a.visibility='public'
        and (a.folder_id is null or f.is_visible)
    )
  ) then
    raise exception 'Featured videos must be published and visible to everyone' using errcode='YB001';
  end if;
  insert into public.community_showcases(id,community_id)
    values(target_community,target_community) on conflict(id) do nothing returning id into created_id;
  select * into strict current_row from public.community_showcases where id=target_community for update;
  select coalesce(array_agg(asset_id order by position),'{}'::uuid[]) into current_assets
    from public.community_showcase_videos where community_id=target_community;
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
