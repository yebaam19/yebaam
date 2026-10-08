-- Remote identifiers below are inert fixtures. No Cloudflare writes; everything rolls back.
begin;
do $$
declare
  users uuid[];
  owner_id uuid;
  editor_id uuid;
  reader_id uuid;
  org uuid := gen_random_uuid();
  other_org uuid := gen_random_uuid();
  folder uuid := gen_random_uuid();
  asset uuid := gen_random_uuid();
  other_asset uuid := gen_random_uuid();
  replacement_blob uuid := gen_random_uuid();
  doc_upload uuid := gen_random_uuid();
  section uuid := gen_random_uuid();
  axis uuid := gen_random_uuid();
  point uuid := gen_random_uuid();
  object_key text;
  result jsonb;
  affected integer;
begin
  select array_agg(id) into users from (select p.id from public.profiles p
    join auth.users u on u.id = p.id order by p.id limit 3) candidates;
  if cardinality(users) < 3 then raise exception 'Test needs three existing profiles'; end if;
  owner_id := users[1]; editor_id := users[2]; reader_id := users[3];
  insert into public.communities(id,owner_id,name,slug,privacy) values
    (org,owner_id,'Library test','library-test-' || org,'PUBLIC'),
    (other_org,owner_id,'Private library','library-test-' || other_org,'PRIVATE');
  insert into public.community_members(community_id,user_id,role,status) values
    (org,editor_id,'MEMBER','active'), (org,reader_id,'MEMBER','active');
  insert into public.community_profile_roles(community_id,user_id,role) values (org,editor_id,'editor');
  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  set local role authenticated;
  insert into public.community_asset_folders(id,community_id,kind,title) values(folder,org,'image','Album');
  begin
    insert into public.community_library_assets(id,community_id,kind,title,media_id,original_name,content_type)
      values(asset,org,'image','Unsafe',asset::text,'test.png','image/png');
    raise exception 'Browser bypassed upload validation';
  exception when insufficient_privilege then null; end;
  begin
    perform public.finalize_community_asset(org,owner_id,asset,'image',asset::text,'test.png','image/png','Image');
    raise exception 'Browser called privileged finalization';
  exception when insufficient_privilege then null; end;

  reset role;
  set local role service_role;
  result := public.finalize_community_asset(org,owner_id,asset,'image',asset::text,'test.png','image/png','Image');
  if (result->>'version')::integer <> 1 then raise exception 'New asset version invalid'; end if;
  result := public.finalize_community_asset(org,owner_id,asset,'image',asset::text,'test.png','image/png','Image');
  if (result->>'version')::integer <> 1 then raise exception 'Retry changed asset'; end if;
  perform public.finalize_community_asset(other_org,owner_id,other_asset,'image',other_asset::text,'test.png','image/png','Other');
  update public.community_library_assets set is_published=true,visibility='public' where id=other_asset;
  object_key := owner_id || '/communities/' || org || '/' || doc_upload || '.pdf';
  insert into public.community_document_uploads(id,community_id,uploaded_by,object_key,content_type,size_bytes,original_name)
    values(doc_upload,org,owner_id,object_key,'application/pdf',1024,'report.pdf');
  begin
    perform public.finalize_community_asset(org,owner_id,doc_upload,'document',object_key,'report.pdf','application/pdf','Report',999);
    raise exception 'Mismatched receipt finalized';
  exception when check_violation then null; end;
  perform public.finalize_community_asset(org,owner_id,doc_upload,'document',object_key,'report.pdf','application/pdf','Report',1024);
  if (select finalized_asset_id from public.community_document_uploads where id=doc_upload) <> doc_upload then
    raise exception 'Receipt not finalized atomically'; end if;
  begin
    perform public.finalize_community_asset(org,reader_id,gen_random_uuid(),'image',gen_random_uuid()::text,'x.png','image/png','Unauthorized');
    raise exception 'Finalization did not recheck actor permission';
  exception when insufficient_privilege then null; end;

  reset role;
  perform set_config('request.jwt.claim.sub',reader_id::text,true);
  set local role authenticated;
  if exists(select 1 from public.community_library_assets where community_id=org) then raise exception 'Private defaults leaked'; end if;
  if exists(select 1 from public.community_asset_folders where community_id=org) then raise exception 'Hidden folder leaked'; end if;
  begin
    perform 1 from public.community_document_uploads;
    raise exception 'Upload ledger exposed';
  exception when insufficient_privilege then null; end;
  update public.community_library_assets set title='Unauthorized' where id=asset;
  get diagnostics affected=row_count;
  if affected<>0 then raise exception 'Reader updated asset'; end if;

  perform set_config('request.jwt.claim.sub',editor_id::text,true);
  if (select count(*) from public.community_library_assets where community_id=org)<>2 then raise exception 'Editor cannot see drafts'; end if;
  if not exists(select 1 from public.community_profile_revisions where entity_id=asset and actor_id=owner_id) then
    raise exception 'Asset history or verified actor missing'; end if;
  begin
    update public.community_library_assets set media_id=other_asset::text where id=asset;
    raise exception 'Browser replaced remote identifier';
  exception when insufficient_privilege then null; end;
  update public.community_library_assets set title='Changed',folder_id=folder,is_published=true,visibility='public' where id=asset and version=1;
  if (select version from public.community_library_assets where id=asset)<>2 then raise exception 'Version not incremented'; end if;
  update public.community_library_assets set title='Stale' where id=asset and version=1;
  get diagnostics affected=row_count;
  if affected<>0 then raise exception 'Stale metadata overwritten'; end if;

  reset role;
  set local role service_role;
  result := public.finalize_community_asset(org,owner_id,gen_random_uuid(),'image',replacement_blob::text,
    'replacement.png','image/png','Ignored title',null,null,asset,2);
  if (result->>'version')::integer<>3 then raise exception 'Replacement version invalid'; end if;
  result := public.finalize_community_asset(org,owner_id,gen_random_uuid(),'image',replacement_blob::text,
    'replacement.png','image/png','Ignored title',null,null,asset,2);
  if (result->>'version')::integer<>3 then raise exception 'Retry replaced asset twice'; end if;
  if not exists(select 1 from public.community_library_assets where id=asset and title='Changed'
    and folder_id=folder and is_published and visibility='public') then raise exception 'Replacement lost metadata'; end if;
  if not exists(select 1 from public.community_asset_deletions where media_id=asset::text) then raise exception 'Old object cleanup missing'; end if;
  begin
    perform public.finalize_community_asset(org,owner_id,gen_random_uuid(),'image',gen_random_uuid()::text,
      'stale.png','image/png','Stale',null,null,asset,2);
    raise exception 'Stale replacement succeeded';
  exception when serialization_failure then null; end;

  perform set_config('request.jwt.claim.sub','',true);
  set local role anon;
  if exists(select 1 from public.community_library_assets where id=asset) then raise exception 'Hidden folder leaked child'; end if;
  reset role;
  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  set local role authenticated;
  update public.community_asset_folders set is_visible=true where id=folder;
  insert into public.community_sections(id,community_id,kind,title,is_visible) values(section,org,'government','Plan',true);
  insert into public.community_plan_axes(id,community_id,section_id,title,is_published) values(axis,org,section,'Axis',true);
  insert into public.community_plan_points(id,community_id,section_id,axis_id,title,is_published) values(point,org,section,axis,'Point',true);
  insert into public.community_plan_attachments(community_id,point_id,asset_id) values(org,point,asset);
  update public.community_library_assets set is_published=true,visibility='members' where id=doc_upload;
  perform set_config('request.jwt.claim.sub',reader_id::text,true);
  if not exists(select 1 from public.community_library_assets where id=doc_upload) then raise exception 'Member document unavailable'; end if;
  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  begin
    insert into public.community_plan_attachments(community_id,point_id,asset_id) values(org,point,other_asset);
    raise exception 'Cross-community attachment accepted';
  exception when foreign_key_violation or insufficient_privilege then null; end;

  perform set_config('request.jwt.claim.sub','',true);
  set local role anon;
  if not exists(select 1 from public.community_plan_attachments where point_id=point) then raise exception 'Published attachment unavailable'; end if;
  if exists(select 1 from public.community_library_assets where id=doc_upload) then raise exception 'Member document leaked to anonymous'; end if;
  if exists(select 1 from public.community_library_assets where id=other_asset) then raise exception 'Private community leaked'; end if;
  reset role;
  update public.community_members set status='banned' where community_id=org and user_id=reader_id;
  perform set_config('request.jwt.claim.sub',reader_id::text,true);
  set local role authenticated;
  if exists(select 1 from public.community_library_assets where community_id=org) then raise exception 'Banned member can read library'; end if;
  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  update public.community_plan_points set is_published=false where id=point;
  perform set_config('request.jwt.claim.sub','',true);
  set local role anon;
  if exists(select 1 from public.community_plan_attachments where point_id=point) then raise exception 'Hidden point leaked attachment'; end if;
  reset role;
  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  set local role authenticated;
  update public.community_library_assets set deleted_at=now() where id=asset;
  if exists(select 1 from public.community_library_assets where id=asset and deleted_at is null) then raise exception 'Deleted asset still listed'; end if;
  if (select folder_id from public.community_library_assets where id=asset) is not null then raise exception 'Archive still locks folder'; end if;
  delete from public.community_plan_attachments where point_id=point;
  begin
    insert into public.community_plan_attachments(community_id,point_id,asset_id) values(org,point,asset);
    raise exception 'Archived file attached again';
  exception when insufficient_privilege then null; end;
  delete from public.community_asset_folders where id=folder;
  reset role;
  if not exists(select 1 from public.community_asset_deletions where media_id=replacement_blob::text) then raise exception 'Remote cleanup not queued'; end if;
  set local role service_role;
  begin
    perform public.finalize_community_asset(org,owner_id,gen_random_uuid(),'image',asset::text,'test.png','image/png','Retired');
    raise exception 'Retired object reused';
  exception when check_violation then null; end;
  raise notice 'Library authorization assertions passed';
end;
$$;
rollback;
