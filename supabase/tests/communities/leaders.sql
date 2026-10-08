-- No persisted fixtures or remote uploads; every authorization assertion is rolled back.
begin;
do $$
declare
  users uuid[]; owner_id uuid; editor_id uuid; member_id uuid;
  org uuid:=gen_random_uuid(); other_org uuid:=gen_random_uuid();
  section_id uuid:=gen_random_uuid(); about_section uuid:=gen_random_uuid();
  other_section uuid:=gen_random_uuid(); category uuid:=gen_random_uuid(); other_category uuid:=gen_random_uuid();
  leader uuid:=gen_random_uuid(); image_id uuid:=gen_random_uuid(); document_id uuid:=gen_random_uuid();
  portrait uuid:=gen_random_uuid(); affected integer;
begin
  select array_agg(id) into users from (select p.id from public.profiles p join auth.users u on p.id=u.id order by p.id limit 3) candidate;
  if cardinality(users)<3 then raise exception 'Test needs 3 profiles'; end if;
  owner_id:=users[1]; editor_id:=users[2]; member_id:=users[3];
  insert into public.communities(id,owner_id,name,slug,privacy) values
    (org,owner_id,'Directory test','directory-test-'||org,'PUBLIC'),
    (other_org,owner_id,'Other directory','directory-test-'||other_org,'PRIVATE');
  insert into public.community_members(community_id,user_id,role,status) values
    (org,editor_id,'MEMBER','active'),(org,member_id,'MEMBER','active');
  insert into public.community_profile_roles(community_id,user_id,role,can_edit_plans) values(org,editor_id,'editor',false);
  insert into public.community_sections(id,community_id,kind,title) values
    (section_id,org,'leaders','Equipo'),(about_section,org,'about','Acerca'),(other_section,other_org,'leaders','Other');
  insert into public.community_leader_categories(id,community_id,section_id,title) values
    (category,org,section_id,'Directiva'),(other_category,other_org,other_section,'Other');
  insert into public.community_library_assets(id,community_id,kind,title,media_id,original_name,content_type) values
    (image_id,org,'image','Portrait',image_id::text,'portrait.png','image/png'),
    (document_id,org,'document','Document',owner_id||'/communities/'||org||'/'||document_id||'.pdf','doc.pdf','application/pdf');
  perform set_config('request.jwt.claim.sub',editor_id::text,true);
  set local role authenticated;
  if not exists(select 1 from public.community_sections where id=section_id) then raise exception 'Content editor cannot see hidden directory'; end if;
  insert into public.community_leaders(id,community_id,section_id,category_id,full_name) values(leader,org,section_id,category,'Test leader');
  insert into public.community_leader_contacts(id,community_id,email) values(leader,org,'private@example.test');
  insert into public.community_leader_media(id,community_id,leader_id,slot,asset_id) values(portrait,org,leader,'portrait',image_id);
  if (select is_published from public.community_leaders where id=leader)
    or (select is_public from public.community_leader_contacts where id=leader) then raise exception 'Public by default'; end if;
  begin
    insert into public.community_leaders(community_id,section_id,full_name) values(org,about_section,'Wrong section');
    raise exception 'About section accepted';
  exception when check_violation then null; end;
  begin
    update public.community_leaders set category_id=other_category where id=leader;
    raise exception 'Cross-community category accepted';
  exception when foreign_key_violation then null; end;
  begin
    insert into public.community_leader_media(community_id,leader_id,slot,asset_id) values(org,leader,'cover',document_id);
    raise exception 'Document accepted as image';
  exception when check_violation then null; end;
  begin
    insert into public.community_leader_media(community_id,leader_id,slot,asset_id) values(org,leader,'video',image_id);
    raise exception 'Image accepted as video';
  exception when check_violation then null; end;
  begin
    update public.community_leader_media set slot='cover' where id=portrait;
    raise exception 'Slot identity changed';
  exception when check_violation then null; end;
  begin
    update public.community_leader_contacts set social_links='[{"label":"bad","url":"javascript:alert(1)"}]' where id=leader;
    raise exception 'Unsafe contact link';
  exception when check_violation then null; end;
  begin
    update public.community_leaders set biography=repeat('x',50001) where id=leader;
    raise exception 'Unbounded biography';
  exception when check_violation then null; end;
  update public.community_leaders set responsibility='Coordinator',position=4 where id=leader and version=1;
  if (select version from public.community_leaders where id=leader)<>2 then raise exception 'Version not incremented'; end if;
  update public.community_leaders set full_name='Stale' where id=leader and version=1;
  get diagnostics affected=row_count;
  if affected<>0 then raise exception 'Stale write allowed'; end if;
  reset role;
  perform set_config('request.jwt.claim.sub','',true);
  set local role anon;
  if exists(select 1 from public.community_leaders where id=leader)
    or exists(select 1 from public.community_leader_contacts where id=leader)
    or exists(select 1 from public.community_leader_media where id=portrait) then raise exception 'Draft leaked'; end if;
  reset role;
  update public.community_sections set is_visible=true where id=section_id;
  update public.community_leaders set is_published=true where id=leader;
  set local role anon;
  if exists(select 1 from public.community_leaders where id=leader) then raise exception 'Hidden category leaked'; end if;
  reset role;
  update public.community_leader_categories set is_published=true where id=category;
  set local role anon;
  if not exists(select 1 from public.community_leaders where id=leader) then raise exception 'Published leader missing'; end if;
  if exists(select 1 from public.community_leader_contacts where id=leader) then raise exception 'Private contact leaked through public leader'; end if;
  if exists(select 1 from public.community_leader_media where id=portrait) then raise exception 'Private asset leaked through public leader'; end if;
  reset role;
  update public.community_leader_contacts set is_public=true where id=leader;
  update public.community_library_assets set visibility='public',is_published=true where id=image_id;
  set local role anon;
  if not exists(select 1 from public.community_leader_contacts where id=leader)
    or not exists(select 1 from public.community_leader_media where id=portrait) then raise exception 'Opt-in detail unavailable'; end if;
  reset role;
  update public.community_sections set is_visible=false where id=section_id;
  set local role anon;
  if exists(select 1 from public.community_leader_contacts where id=leader)
    or exists(select 1 from public.community_leader_media where id=portrait) then raise exception 'Hidden section detail leaked'; end if;
  reset role;
  update public.community_sections set is_visible=true where id=section_id;
  update public.communities set privacy='PRIVATE' where id=org;
  set local role anon;
  if exists(select 1 from public.community_leaders where id=leader) then raise exception 'Private organization leaked'; end if;
  reset role;
  perform set_config('request.jwt.claim.sub',member_id::text,true);
  set local role authenticated;
  if not exists(select 1 from public.community_leaders where id=leader) then raise exception 'Active member excluded'; end if;
  delete from public.community_leaders where id=leader;
  get diagnostics affected=row_count;
  if affected<>0 then raise exception 'Member deleted leader'; end if;
  update public.community_leader_contacts set email='attack@example.test' where id=leader;
  get diagnostics affected=row_count;
  if affected<>0 then raise exception 'Member changed contact'; end if;
  reset role;
  update public.communities set privacy='PUBLIC' where id=org;
  update public.community_members set status='banned' where community_id=org and user_id=member_id;
  set local role authenticated;
  if exists(select 1 from public.community_leaders where id=leader)
    or exists(select 1 from public.community_leader_categories where id=category)
    or exists(select 1 from public.community_leader_contacts where id=leader)
    or exists(select 1 from public.community_leader_media where id=portrait)
    or exists(select 1 from public.community_sections where id=section_id) then raise exception 'Banned member read directory'; end if;
  reset role;
  perform set_config('request.jwt.claim.sub',editor_id::text,true);
  set local role authenticated;
  begin
    delete from public.community_leader_categories where id=category;
    raise exception 'Nonempty category deleted';
  exception when foreign_key_violation then null; end;
  update public.community_leaders set category_id=null where id=leader;
  delete from public.community_leader_categories where id=category;
  delete from public.community_leaders where id=leader;
  if exists(select 1 from public.community_leader_contacts where id=leader)
    or exists(select 1 from public.community_leader_media where id=portrait) then raise exception 'Orphaned detail'; end if;
  if not exists(select 1 from public.community_library_assets where id=image_id) then raise exception 'Directory deletion deleted shared asset'; end if;
  reset role;
  if not exists(select 1 from public.community_profile_revisions where entity_id=leader
    and entity_table='community_leaders' and operation='DELETE' and actor_id=editor_id) then raise exception 'Audit missing'; end if;
  update public.community_members set status='banned' where community_id=org and user_id=editor_id;
  set local role authenticated;
  begin
    insert into public.community_leaders(community_id,section_id,full_name) values(org,section_id,'Revoked editor');
    raise exception 'Revoked editor wrote';
  exception when insufficient_privilege or check_violation then null; end;
  reset role;
end;
$$;
rollback;
