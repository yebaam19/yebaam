-- Inert media IDs, no provider calls; all fixtures roll back.
begin;
do $$
declare
  owner_id uuid;
  member_id uuid;
  org uuid := gen_random_uuid();
  other_org uuid := gen_random_uuid();
  section_id uuid := gen_random_uuid();
  axis_id uuid := gen_random_uuid();
  point_id uuid := gen_random_uuid();
  draft_point uuid := gen_random_uuid();
  hidden_folder uuid := gen_random_uuid();
  asset_id uuid;
  result jsonb;
  rows_count integer;
begin
  select id into owner_id from public.profiles order by id limit 1;
  select id into member_id from public.profiles where id <> owner_id order by id limit 1;
  if member_id is null then raise exception 'Test needs two profiles'; end if;
  insert into public.communities(id, owner_id, name, slug, privacy) values
    (org, owner_id, 'Attachment test', 'attachment-test-' || org, 'PUBLIC'),
    (other_org, owner_id, 'Other test', 'attachment-test-' || other_org, 'PRIVATE');
  insert into public.community_members(community_id,user_id,role,status) values (org,member_id,'MEMBER','active');
  insert into public.community_sections(id,community_id,kind,title,is_visible)
    values(section_id,org,'government','Plan',true);
  insert into public.community_plan_axes(id,community_id,section_id,title,is_published)
    values(axis_id,org,section_id,'Axis',true);
  insert into public.community_plan_points(id,community_id,section_id,axis_id,title,is_published) values
    (point_id,org,section_id,axis_id,'Point',true),(draft_point,org,section_id,axis_id,'Draft',false);
  insert into public.community_asset_folders(id,community_id,kind,title,is_visible)
    values(hidden_folder,org,'image','Hidden',false);
  for n in 1..8 loop
    asset_id := gen_random_uuid();
    insert into public.community_library_assets(id,community_id,kind,title,media_id,original_name,content_type,
      visibility,is_published,folder_id,deleted_at)
    values(asset_id,org,'image','File ' || n,asset_id::text,'fixture.png','image/png',
      case when n=1 then 'members' else 'public' end,n<>2,
      case when n=3 then hidden_folder else null end,case when n=4 then now() else null end);
    insert into public.community_plan_attachments(community_id,point_id,asset_id,position)
      values(org,point_id,asset_id,n),(org,draft_point,asset_id,n);
  end loop;
  perform set_config('request.jwt.claim.sub','',true);
  set local role anon;
  select count(*) into rows_count from public.community_plan_attachment_previews(org,array[point_id,draft_point]);
  if rows_count<>1 then raise exception 'Draft point leaked'; end if;
  select items into result from public.community_plan_attachment_previews(org,array[point_id,point_id]);
  if jsonb_array_length(result)<>4 or result->0->'asset'->>'title'<>'File 5' then
    raise exception 'Audience/folder/draft/archive filtering failed: %',result; end if;
  if result->0->'asset' ? 'search_vector' or result->0->'asset' ? 'deleted_at' then
    raise exception 'Preview returned internal columns'; end if;
  if exists(select 1 from public.community_plan_attachment_previews(other_org,array[point_id])) then
    raise exception 'Cross-community point leaked'; end if;
  begin
    perform public.community_plan_attachment_previews(org,array_fill(point_id,array[31]));
    raise exception 'Unbounded input accepted';
  exception when invalid_parameter_value then null; end;
  reset role;
  perform set_config('request.jwt.claim.sub',member_id::text,true);
  set local role authenticated;
  select items into result from public.community_plan_attachment_previews(org,array[point_id]);
  if jsonb_array_length(result)<>4 or result->0->'asset'->>'title'<>'File 1' then
    raise exception 'Membership or limit not respected'; end if;
  reset role;
  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  set local role authenticated;
  select items into result from public.community_plan_attachment_previews(org,array[draft_point]);
  if jsonb_array_length(result)<>4 or result->3->'asset'->>'title'<>'File 5' then
    raise exception 'Editor preview included archived asset or omitted draft'; end if;
  reset role;
  update public.community_sections set is_visible=false where id=section_id;
  perform set_config('request.jwt.claim.sub','',true);
  set local role anon;
  if exists(select 1 from public.community_plan_attachment_previews(org,array[point_id])) then
    raise exception 'Hidden section leaked'; end if;
  reset role;
end;
$$;
rollback;
