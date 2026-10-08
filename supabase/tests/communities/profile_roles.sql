begin;
do $$
#variable_conflict use_variable
declare people uuid[]; owner_id uuid; delegate_id uuid; stranger_id uuid;
  community_id uuid:=gen_random_uuid();
begin
  select array_agg(id) into people from (
    select p.id from public.profiles p join auth.users u on u.id=p.id order by p.id limit 3
  ) people;
  if cardinality(people)<3 then raise exception 'Se requieren tres perfiles'; end if;
  owner_id:=people[1]; delegate_id:=people[2]; stranger_id:=people[3];
  insert into public.communities(id,owner_id,name,slug,privacy)
    values(community_id,owner_id,'Roles rollback','roles-rollback-'||community_id,'PUBLIC');
  insert into public.community_members(community_id,user_id,role,status)
    values(community_id,delegate_id,'MEMBER','active'),
      (community_id,stranger_id,'MEMBER','active');

  set local role authenticated;
  perform set_config('request.jwt.claim.sub',stranger_id::text,true);
  begin
    insert into public.community_profile_roles(community_id,user_id,role)
      values(community_id,stranger_id,'admin');
    raise exception 'Un no propietario asignó un rol';
  exception when insufficient_privilege then null; end;

  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  insert into public.community_profile_roles(community_id,user_id,role,can_edit_plans)
    values(community_id,delegate_id,'editor',true);
  if (select count(*) from public.community_profile_role_audit where community_profile_role_audit.community_id=community_id)<>1 then
    raise exception 'La asignación no dejó auditoría';
  end if;
  perform set_config('request.jwt.claim.sub',delegate_id::text,true);
  if not community_private.can_manage_profile(community_id,'content')
    or not community_private.can_manage_profile(community_id,'plans')
    or community_private.can_manage_profile(community_id,'moderation') then
    raise exception 'El editor recibió capacidades incorrectas';
  end if;
  if exists(select 1 from public.community_profile_role_audit where community_profile_role_audit.community_id=community_id) then
    raise exception 'La auditoría quedó visible al delegado';
  end if;

  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  update public.community_profile_roles set role='moderator',can_edit_plans=true
    where community_profile_roles.community_id=community_id and user_id=delegate_id;
  if (select can_edit_plans from public.community_profile_roles
      where community_profile_roles.community_id=community_id and user_id=delegate_id) then
    raise exception 'El moderador conservó edición de planes';
  end if;
  perform set_config('request.jwt.claim.sub',delegate_id::text,true);
  if community_private.can_manage_profile(community_id,'content')
    or not community_private.can_manage_profile(community_id,'moderation') then
    raise exception 'El moderador recibió capacidades incorrectas';
  end if;

  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  delete from public.community_members where community_members.community_id=community_id and user_id=delegate_id;
  if exists(select 1 from public.community_profile_roles
      where community_profile_roles.community_id=community_id and user_id=delegate_id) then
    raise exception 'La salida conservó la delegación';
  end if;
  if (select count(*) from public.community_profile_role_audit where community_profile_role_audit.community_id=community_id)<>3 then
    raise exception 'La revocación no dejó auditoría';
  end if;
  begin
    insert into public.community_profile_roles(community_id,user_id,role)
      values(community_id,delegate_id,'admin');
    raise exception 'Se asignó un rol a miembro inactivo';
  exception when raise_exception then
    if sqlerrm='Se asignó un rol a miembro inactivo' then raise; end if;
  end;
  reset role;
end $$;
rollback;
