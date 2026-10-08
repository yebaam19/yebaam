-- Real authorization, inert media, transactional fixtures only.
begin;
do $$
declare
  users uuid[];
  owner_id uuid;
  editor_id uuid;
  member_id uuid;
  org uuid := gen_random_uuid();
  other_org uuid := gen_random_uuid();
  section_id uuid := gen_random_uuid();
  other_section uuid := gen_random_uuid();
  image_id uuid := gen_random_uuid();
  document_id uuid := gen_random_uuid();
  link_id uuid := gen_random_uuid();
  affected integer;
begin
  select array_agg(id) into users from (select p.id from public.profiles p join auth.users u on p.id=u.id order by p.id limit 3) candidate;
  if cardinality(users)<3 then raise exception 'Test needs 3 profiles'; end if;
  owner_id:=users[1]; editor_id:=users[2]; member_id:=users[3];
  insert into public.communities(id,owner_id,name,slug,privacy) values
    (org,owner_id,'About test','about-test-'||org,'PUBLIC'),(other_org,owner_id,'Other about test','about-test-'||other_org,'PRIVATE');
  insert into public.community_members(community_id,user_id,role,status) values
    (org,editor_id,'MEMBER','active'),(org,member_id,'MEMBER','active');
  insert into public.community_profile_roles(community_id,user_id,role,can_edit_plans) values(org,editor_id,'editor',false);
  insert into public.community_sections(id,community_id,kind,title) values
    (section_id,org,'about','Acerca de'),(other_section,other_org,'about','Private');
  insert into public.community_library_assets(id,community_id,kind,title,media_id,original_name,content_type,visibility,is_published) values
    (image_id,org,'image','Institution',image_id::text,'photo.png','image/png','public',true),
    (document_id,org,'document','Document',owner_id||'/communities/'||org||'/'||document_id||'.pdf','doc.pdf','application/pdf','public',true);
  perform set_config('request.jwt.claim.sub',editor_id::text,true);
  set local role authenticated;
  if not exists(select 1 from public.community_sections where id=section_id) then raise exception 'Content editor cannot prepare hidden About'; end if;
  insert into public.community_about(id,community_id,history,contact_email) values(section_id,org,'<p>History</p>','contact@example.test');
  if (select is_published from public.community_about where id=section_id) then raise exception 'Published by default'; end if;
  insert into public.community_about_media(id,community_id,about_id,asset_id) values(link_id,org,section_id,image_id);
  begin
    insert into public.community_about_media(community_id,about_id,asset_id) values(org,section_id,document_id);
    raise exception 'Document accepted as institutional media';
  exception when insufficient_privilege then null; end;
  update public.community_about set mission='<p>Updated</p>' where id=section_id and version=1;
  if (select version from public.community_about where id=section_id)<>2 then raise exception 'Version missing'; end if;
  update public.community_about set mission='Stale' where id=section_id and version=1;
  get diagnostics affected=row_count;
  if affected<>0 then raise exception 'Stale update allowed'; end if;
  begin
    update public.community_about set social_links='[{"label":"Unsafe","url":"javascript:alert(1)"}]' where id=section_id;
    raise exception 'Unsafe link allowed';
  exception when check_violation then null; end;
  begin
    update public.community_about set founded_on='infinity'::date where id=section_id;
    raise exception 'Infinite date accepted';
  exception when check_violation then null; end;
  begin
    update public.community_about set social_links=jsonb_build_array(jsonb_build_object('label','Link','url','https://example.test','extra',repeat('x',25000))) where id=section_id;
    raise exception 'Unbounded link payload accepted';
  exception when check_violation then null; end;
  begin
    update public.community_about set community_id=other_org where id=section_id;
    raise exception 'Identity reassignment allowed';
  exception when check_violation or insufficient_privilege then null; end;
  update public.community_about set is_published=true where id=section_id;
  reset role;
  perform set_config('request.jwt.claim.sub','',true);
  set local role anon;
  if exists(select 1 from public.community_about where id=section_id) or exists(select 1 from public.community_about_media where id=link_id) then
    raise exception 'Hidden section or media leaked'; end if;
  reset role;
  update public.community_sections set is_visible=true where id=section_id;
  set local role anon;
  if not exists(select 1 from public.community_about where id=section_id) or not exists(select 1 from public.community_about_media where id=link_id) then
    raise exception 'Published content unavailable'; end if;
  reset role;
  update public.communities set privacy='PRIVATE' where id=org;
  set local role anon;
  if exists(select 1 from public.community_about where id=section_id) then raise exception 'Private community leaked'; end if;
  reset role;
  perform set_config('request.jwt.claim.sub',member_id::text,true);
  set local role authenticated;
  if not exists(select 1 from public.community_about where id=section_id) then raise exception 'Active member excluded'; end if;
  update public.community_about set history='Unauthorized' where id=section_id;
  get diagnostics affected=row_count;
  if affected<>0 then raise exception 'Member wrote About'; end if;
  reset role;
  update public.communities set privacy='PUBLIC' where id=org;
  update public.community_members set status='banned' where community_id=org and user_id=member_id;
  set local role authenticated;
  if exists(select 1 from public.community_about where id=section_id)
    or exists(select 1 from public.community_sections where id=section_id)
    or exists(select 1 from public.community_about_media where id=link_id) then raise exception 'Banned member read About'; end if;
  reset role;
  perform set_config('request.jwt.claim.sub',editor_id::text,true);
  set local role authenticated;
  delete from public.community_about_media where id=link_id;
  if not exists(select 1 from public.community_library_assets where id=image_id) then raise exception 'Unlink deleted media'; end if;
  reset role;
  if not exists(select 1 from public.community_profile_revisions where entity_id=section_id and entity_table='community_about' and actor_id=editor_id) then
    raise exception 'Audit missing'; end if;
  update public.community_members set status='banned' where community_id=org and user_id=editor_id;
  set local role authenticated;
  update public.community_about set history='Revoked editor' where id=section_id;
  get diagnostics affected=row_count;
  if affected<>0 then raise exception 'Revoked editor wrote About'; end if;
  reset role;
end;
$$;
rollback;
