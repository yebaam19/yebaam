-- All fixture data is rolled back; no media is uploaded or deleted.
begin;
do $$
declare
  users uuid[]; owner_id uuid; editor_id uuid; member_id uuid;
  org uuid:=gen_random_uuid(); other_org uuid:=gen_random_uuid();
  videos uuid[]:=array[gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid()];
  wrong_kind uuid:=gen_random_uuid(); foreign_video uuid:=gen_random_uuid();
  rev integer; revision_count integer;
begin
  select array_agg(id) into users from (select p.id from public.profiles p join auth.users u on p.id=u.id order by p.id limit 3) candidate;
  if cardinality(users)<3 then raise exception 'Test needs 3 profiles'; end if;
  owner_id:=users[1]; editor_id:=users[2]; member_id:=users[3];
  insert into public.communities(id,owner_id,name,slug,privacy) values
    (org,owner_id,'Showcase test','showcase-test-'||org,'PUBLIC'),
    (other_org,owner_id,'Other showcase','showcase-test-'||other_org,'PRIVATE');
  insert into public.community_members(community_id,user_id,role,status) values
    (org,editor_id,'MEMBER','active'),(org,member_id,'MEMBER','active');
  insert into public.community_profile_roles(community_id,user_id,role,can_edit_plans) values(org,editor_id,'editor',false);
  insert into public.community_library_assets(id,community_id,kind,title,media_id,original_name,content_type)
    select asset,org,'video','Fixture',replace(asset::text,'-',''),'fixture.mp4','video/mp4' from unnest(videos) asset;
  insert into public.community_library_assets(id,community_id,kind,title,media_id,original_name,content_type) values
    (wrong_kind,org,'image','Image',wrong_kind::text,'image.png','image/png'),
    (foreign_video,other_org,'video','Foreign video',replace(foreign_video::text,'-',''),'fixture.mp4','video/mp4');
  perform set_config('request.jwt.claim.sub',editor_id::text,true);
  set local role authenticated;
  rev:=public.save_community_showcase(org,0,'Introduction',false,videos);
  if rev<>1 or (select is_published from public.community_showcases where id=org) then raise exception 'Initial state wrong'; end if;
  if (select count(*) from public.community_showcase_videos where community_id=org)<>4 then raise exception 'Missing selected videos'; end if;
  begin
    update public.community_showcases set is_published=true where id=org;
    raise exception 'Direct mutation bypassed atomic RPC';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.community_showcase_videos where community_id=org;
    raise exception 'Direct video mutation allowed';
  exception when insufficient_privilege then null; end;
  begin
    perform public.save_community_showcase(org,1,'Bad',true,videos||videos[1]);
    raise exception 'Fifth video accepted';
  exception when check_violation then null; end;
  begin
    perform public.save_community_showcase(org,1,'Bad',true,array[videos[1],videos[1]]);
    raise exception 'Duplicate video accepted';
  exception when check_violation then null; end;
  begin
    perform public.save_community_showcase(org,1,'Bad',true,array[foreign_video]);
    raise exception 'Cross-community video accepted';
  exception when check_violation then null; end;
  begin
    perform public.save_community_showcase(org,1,'Bad',true,array[wrong_kind]);
    raise exception 'Image accepted';
  exception when check_violation then null; end;
  begin
    perform public.save_community_showcase(org,1,repeat('x',1201),true,videos);
    raise exception 'Oversized introduction accepted';
  exception when check_violation then null; end;
  begin
    perform public.save_community_showcase(org,1,'Bad',true,array[null::uuid]);
    raise exception 'Null video accepted';
  exception when check_violation then null; end;
  rev:=public.save_community_showcase(org,1,'Published',true,array[videos[4],videos[2],videos[1],videos[3]]);
  set constraints all immediate;
  if rev<>2 or (select asset_id from public.community_showcase_videos where community_id=org and position=0)<>videos[4] then
    raise exception 'Atomic reorder failed'; end if;
  reset role;
  select count(*) into revision_count from public.community_profile_revisions where community_id=org;
  set local role authenticated;
  rev:=public.save_community_showcase(org,1,'Published',true,array[videos[4],videos[2],videos[1],videos[3]]);
  reset role;
  if rev<>2 or (select count(*) from public.community_profile_revisions where community_id=org)<>revision_count then
    raise exception 'Retry repeated side effects'; end if;
  set local role authenticated;
  begin
    perform public.save_community_showcase(org,1,'Stale overwrite',false,videos);
    raise exception 'Stale version accepted';
  exception when serialization_failure then null; end;
  if (select introduction from public.community_showcases where id=org)<>'Published' then raise exception 'Failed write persisted'; end if;
  perform set_config('request.jwt.claim.sub','',true);
  set local role anon;
  if not exists(select 1 from public.community_showcases where id=org) then raise exception 'Published introduction hidden'; end if;
  if exists(select 1 from public.community_showcase_videos where community_id=org) then raise exception 'Private video reference leaked'; end if;
  begin
    perform public.save_community_showcase(org,2,'Anonymous',true,'{}');
    raise exception 'Anonymous write accepted';
  exception when insufficient_privilege then null; end;
  reset role;
  update public.community_library_assets set is_published=true,visibility='public' where id=videos[1];
  set local role anon;
  if (select count(*) from public.community_showcase_videos where community_id=org)<>1 then raise exception 'Published asset visibility wrong'; end if;
  reset role;
  update public.communities set privacy='PRIVATE' where id=org;
  set local role anon;
  if exists(select 1 from public.community_showcases where id=org)
    or exists(select 1 from public.community_showcase_videos where community_id=org) then raise exception 'Private community leaked'; end if;
  perform set_config('request.jwt.claim.sub',member_id::text,true);
  set local role authenticated;
  if not exists(select 1 from public.community_showcases where id=org) then raise exception 'Active member cannot read'; end if;
  begin
    perform public.save_community_showcase(org,2,'Member overwrite',true,'{}');
    raise exception 'Ordinary member can write';
  exception when insufficient_privilege then null; end;
  reset role;
  update public.community_members set status='banned' where community_id=org and user_id=member_id;
  set local role authenticated;
  if exists(select 1 from public.community_showcases where id=org)
    or exists(select 1 from public.community_showcase_videos where community_id=org) then raise exception 'Banned member sees showcase'; end if;
  perform set_config('request.jwt.claim.sub',editor_id::text,true);
  set constraints all deferred;
  rev:=public.save_community_showcase(org,2,'Hidden again',false,array[videos[2]]);
  if rev<>3 or (select count(*) from public.community_showcase_videos where community_id=org)<>1 then raise exception 'Removal failed'; end if;
  if (select count(*) from public.community_library_assets where community_id=org and kind='video' and deleted_at is null)<>4 then
    raise exception 'Unlink deleted assets'; end if;
  reset role;
  if not exists(select 1 from public.community_profile_revisions where community_id=org
    and entity_table='community_showcases' and actor_id=editor_id and after_data->>'introduction'='Hidden again') then raise exception 'Audit missing'; end if;
  reset role;
  update public.community_library_assets set deleted_at=now() where id=videos[2];
  set local role authenticated;
  begin
    perform public.save_community_showcase(org,3,'Archived',true,array[videos[2]]);
    raise exception 'Archived asset accepted';
  exception when check_violation then null; end;
  rev:=public.save_community_showcase(org,3,'No videos',false,'{}');
  if rev<>4 then raise exception 'Cannot clear all videos'; end if;
  reset role;
  delete from public.community_profile_roles where community_id=org and user_id=editor_id;
  set local role authenticated;
  begin
    perform public.save_community_showcase(org,4,'Revoked',true,'{}');
    raise exception 'Revoked editor can write';
  exception when insufficient_privilege then null; end;
  reset role;
end;
$$;
rollback;
