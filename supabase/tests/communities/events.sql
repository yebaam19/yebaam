begin;
do $$
declare
  users uuid[]; owner_id uuid; admin_id uuid; member_id uuid; org uuid:=gen_random_uuid(); other_org uuid:=gen_random_uuid();
  evt uuid:=gen_random_uuid(); img uuid:=gen_random_uuid(); foreign_img uuid:=gen_random_uuid(); vid uuid:=gen_random_uuid(); n int; result boolean;
begin
  select array_agg(id) into users from (select p.id from public.profiles p join auth.users u on u.id=p.id order by p.id limit 3) x;
  if cardinality(users)<3 then raise exception 'Three profiles required'; end if;
  owner_id:=users[1]; admin_id:=users[2]; member_id:=users[3];
  insert into public.communities(id,owner_id,name,slug,privacy) values
    (org,owner_id,'Events rollback','events-rollback-'||org,'PUBLIC'),(other_org,owner_id,'Other events','events-rollback-'||other_org,'PRIVATE');
  insert into public.community_members(community_id,user_id,role,status) values(org,admin_id,'MEMBER','active'),(org,member_id,'MEMBER','active');
  insert into public.community_profile_roles(community_id,user_id,role) values(org,admin_id,'admin');
  insert into public.community_library_assets(id,community_id,kind,title,media_id,original_name,content_type) values
    (img,org,'image','Cover',img::text,'cover.png','image/png'),
    (foreign_img,other_org,'image','Other cover',foreign_img::text,'cover.png','image/png'),
    (vid,org,'video','Video',replace(vid::text,'-',''),'video.mp4','video/mp4');
  perform set_config('request.jwt.claim.sub',admin_id::text,true);
  set local role authenticated;
  insert into public.community_events(id,community_id,title,organizer,starts_at,ends_at,location,cover_asset_id)
    values(evt,org,'Meeting','Organization',now()+interval '1 hour',now()+interval '2 hours','Town hall',img);
  if (select is_published or rsvp_enabled from public.community_events where id=evt) then raise exception 'Unsafe defaults'; end if;
  begin
    update public.community_events set ends_at=starts_at where id=evt;
    raise exception 'Invalid interval accepted';
  exception when check_violation then null; end;
  begin
    update public.community_events set location='',virtual_url='javascript:alert(1)' where id=evt;
    raise exception 'Unsafe URL accepted';
  exception when check_violation then null; end;
  begin
    update public.community_events set cover_asset_id=foreign_img where id=evt;
    raise exception 'Cross-community cover accepted';
  exception when check_violation or foreign_key_violation then null; end;
  begin
    update public.community_events set cover_asset_id=vid where id=evt;
    raise exception 'Video cover accepted';
  exception when check_violation then null; end;
  begin
    update public.community_events set community_id=other_org where id=evt;
    raise exception 'Event identity changed';
  exception when check_violation or insufficient_privilege then null; end;
  perform set_config('request.jwt.claim.sub',member_id::text,true);
  if exists(select 1 from public.community_events where id=evt) then raise exception 'Draft leaked to member'; end if;
  begin
    perform public.set_community_event_attendance(evt,true);
    raise exception 'Draft RSVP accepted';
  exception when insufficient_privilege then null; end;
  perform set_config('request.jwt.claim.sub',admin_id::text,true);
  update public.community_events set is_published=true,rsvp_enabled=true where id=evt and version=1;
  if (select version from public.community_events where id=evt)<>2 then raise exception 'Version failed'; end if;
  update public.community_events set title='Stale' where id=evt and version=1;
  get diagnostics n=row_count;
  if n<>0 then raise exception 'Stale overwrite'; end if;
  set local role anon;
  perform set_config('request.jwt.claim.sub','',true);
  if not exists(select 1 from public.community_events where id=evt) then raise exception 'Public event unreadable'; end if;
  if exists(select 1 from public.community_events e join public.community_library_assets a on a.id=e.cover_asset_id where e.id=evt) then raise exception 'Private cover leaked'; end if;
  begin
    perform public.set_community_event_attendance(evt,true);
    raise exception 'Anonymous RSVP accepted';
  exception when insufficient_privilege then null; end;
  set local role authenticated;
  perform set_config('request.jwt.claim.sub',member_id::text,true);
  result:=public.set_community_event_attendance(evt,true);
  result:=public.set_community_event_attendance(evt,true);
  if (select count(*) from public.community_event_attendance where event_id=evt)<>1 then raise exception 'Duplicate RSVP'; end if;
  begin
    insert into public.community_event_attendance(event_id,user_id) values(evt,owner_id);
    raise exception 'Spoofed direct RSVP accepted';
  exception when insufficient_privilege then null; end;
  update public.community_events set title='Unauthorized' where id=evt;
  get diagnostics n=row_count;
  if n<>0 then raise exception 'Member edited event'; end if;
  perform set_config('request.jwt.claim.sub',admin_id::text,true);
  if exists(select 1 from public.community_event_attendance where event_id=evt) then raise exception 'Attendee roster exposed'; end if;
  update public.community_events set is_cancelled=true where id=evt;
  perform set_config('request.jwt.claim.sub',member_id::text,true);
  begin
    perform public.set_community_event_attendance(evt,true);
    raise exception 'Cancelled event accepts RSVP';
  exception when check_violation then null; end;
  result:=public.set_community_event_attendance(evt,false);
  if exists(select 1 from public.community_event_attendance where event_id=evt) then raise exception 'Withdrawal failed'; end if;
  reset role;
  update public.community_events set is_cancelled=false,rsvp_enabled=false where id=evt;
  set local role authenticated;
  begin
    perform public.set_community_event_attendance(evt,true);
    raise exception 'Disabled RSVP accepted';
  exception when check_violation then null; end;
  reset role;
  update public.community_events set rsvp_enabled=true,starts_at=now()-interval '2 hours',ends_at=now()-interval '1 hour' where id=evt;
  set local role authenticated;
  begin
    perform public.set_community_event_attendance(evt,true);
    raise exception 'Ended RSVP accepted';
  exception when check_violation then null; end;
  reset role;
  update public.communities set privacy='PRIVATE' where id=org;
  update public.community_members set status='banned' where community_id=org and user_id=member_id;
  set local role authenticated;
  if exists(select 1 from public.community_events where id=evt) then raise exception 'Banned member read event'; end if;
  begin
    perform public.set_community_event_attendance(evt,true);
    raise exception 'Banned RSVP';
  exception when insufficient_privilege then null; end;
  perform set_config('request.jwt.claim.sub',admin_id::text,true);
  update public.community_library_assets set deleted_at=now() where id=img;
  update public.community_events set deleted_at=now() where id=evt;
  reset role;
  if not exists(select 1 from public.community_profile_revisions where community_id=org and entity_table='community_events' and actor_id=admin_id and after_data->>'deleted_at' is not null) then raise exception 'Archive audit missing'; end if;
  update public.community_members set status='active' where community_id=org and user_id=member_id;
  set local role authenticated;
  perform set_config('request.jwt.claim.sub',member_id::text,true);
  if exists(select 1 from public.community_events where id=evt) then raise exception 'Archived event leaked'; end if;
  reset role;
  delete from public.community_profile_roles where community_id=org and user_id=admin_id;
  set local role authenticated;
  perform set_config('request.jwt.claim.sub',admin_id::text,true);
  update public.community_events set deleted_at=null where id=evt;
  get diagnostics n=row_count;
  if n<>0 then raise exception 'Revoked admin restored event'; end if;
  reset role;
end;
$$;
rollback;
