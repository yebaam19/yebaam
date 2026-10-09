-- Run through Supabase MCP execute_sql. Fixtures and role changes roll back.
begin;
do $$
declare
  people uuid[];
  owner_id uuid;
  member_id uuid;
  public_org uuid:=gen_random_uuid();
  private_org uuid:=gen_random_uuid();
  public_section uuid:=gen_random_uuid();
  private_section uuid:=gen_random_uuid();
  affected integer;
begin
  select array_agg(id) into people from (
    select u.id from auth.users u join public.profiles p on p.id=u.id order by u.id limit 2
  ) candidates;
  if cardinality(people)<2 then raise exception 'Two profiles required'; end if;
  owner_id:=people[1]; member_id:=people[2];
  insert into public.communities(id,owner_id,name,slug,privacy) values
    (public_org,owner_id,'Theme test public','theme-public-'||public_org,'PUBLIC'),
    (private_org,owner_id,'Theme test private','theme-private-'||private_org,'PRIVATE');
  insert into public.community_members(community_id,user_id,role,status)
    values(private_org,member_id,'MEMBER','active');
  insert into public.community_sections(id,community_id,kind,title,is_visible,is_featured) values
    (public_section,public_org,'government','Public title',true,true),
    (private_section,private_org,'government','Private title',true,true);
  insert into public.community_profile_theme(community_id,primary_color,secondary_color) values
    (public_org,'green','gold'),(private_org,'forest','amber');

  set local role anon;
  if not exists(select 1 from public.community_sections where id=public_section)
    or not exists(select 1 from public.community_profile_theme where community_id=public_org)
    or exists(select 1 from public.community_sections where id=private_section)
    or exists(select 1 from public.community_profile_theme where community_id=private_org) then
    raise exception 'Public/private visitor visibility incorrect';
  end if;
  reset role;

  perform set_config('request.jwt.claim.sub',member_id::text,true);
  set local role authenticated;
  if not exists(select 1 from public.community_sections where id=private_section)
    or not exists(select 1 from public.community_profile_theme where community_id=private_org) then
    raise exception 'Private active member cannot read';
  end if;
  update public.community_sections set is_featured=false where id=private_section;
  get diagnostics affected=row_count;
  if affected<>0 then raise exception 'Member changed featured section'; end if;
  update public.community_profile_theme set primary_color='green' where community_id=private_org;
  get diagnostics affected=row_count;
  if affected<>0 then raise exception 'Member changed theme'; end if;
  reset role;

  update public.community_members set status='banned'
    where community_id=private_org and user_id=member_id;
  set local role authenticated;
  if exists(select 1 from public.community_sections where id=private_section)
    or exists(select 1 from public.community_profile_theme where community_id=private_org) then
    raise exception 'Banned member still sees private profile';
  end if;
  reset role;

  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  set local role authenticated;
  update public.community_sections set is_featured=false where id=private_section;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'Owner could not curate section'; end if;
  update public.community_profile_theme set primary_color='green' where community_id=private_org and version=1;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'Owner could not update theme'; end if;
  update public.community_profile_theme set primary_color='forest' where community_id=private_org and version=1;
  get diagnostics affected=row_count;
  if affected<>0 then raise exception 'Stale theme write succeeded'; end if;
  begin
    update public.community_profile_theme set primary_color='purple' where community_id=private_org;
    raise exception 'Unapproved palette color accepted';
  exception when check_violation then null; end;
  reset role;
  if (select version from public.community_profile_theme where community_id=private_org)<>2
    or not exists(select 1 from public.community_profile_revisions
      where community_id=private_org and entity_table='community_profile_theme'
        and actor_id=owner_id and after_data->>'primary_color'='green')
    or not exists(select 1 from public.community_profile_revisions
      where community_id=private_org and entity_table='community_sections'
        and actor_id=owner_id and after_data->>'is_featured'='false') then
    raise exception 'Version or audit missing';
  end if;
end;
$$;
rollback;
