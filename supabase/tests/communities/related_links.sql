begin;
do $$
#variable_conflict use_variable
declare people uuid[]; owner_id uuid; admin_id uuid; stranger_id uuid;
  community_id uuid:=gen_random_uuid(); image_id uuid:=gen_random_uuid();
  published_id uuid:=gen_random_uuid(); draft_id uuid:=gen_random_uuid();
begin
  select array_agg(id) into people from (
    select p.id from public.profiles p join auth.users u on u.id=p.id order by p.id limit 3
  ) users;
  if cardinality(people)<3 then raise exception 'Se requieren tres perfiles'; end if;
  owner_id:=people[1]; admin_id:=people[2]; stranger_id:=people[3];
  insert into public.communities(id,owner_id,name,slug,privacy)
    values(community_id,owner_id,'Related rollback','related-rollback-'||community_id,'PUBLIC');
  insert into public.community_members(community_id,user_id,role,status)
    values(community_id,admin_id,'MEMBER','active'),(community_id,stranger_id,'MEMBER','active');
  insert into public.community_library_assets(id,community_id,kind,title,media_id,original_name,
    content_type,size_bytes,uploaded_by,visibility,is_published)
    values(image_id,community_id,'image','Imagen pública',replace(gen_random_uuid()::text,'-',''),
      'related-test.png','image/png',100,owner_id,'public',true);

  set local role authenticated;
  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  insert into public.community_related_links(id,community_id,title,description,href,image_asset_id,is_published)
    values(published_id,community_id,'Proyecto público','Vinculado','https://example.org',image_id,true),
      (draft_id,community_id,'Proyecto borrador','','https://example.net',null,false);
  if (select count(*) from public.community_related_links where community_related_links.community_id=community_id)<>2 then
    raise exception 'El propietario no puede leer sus enlaces';
  end if;

  perform set_config('request.jwt.claim.sub',stranger_id::text,true);
  if (select count(*) from public.community_related_links where community_related_links.community_id=community_id)<>1 then
    raise exception 'Un miembro vio un borrador o no vio el enlace público';
  end if;
  begin
    insert into public.community_related_links(community_id,title,href)
      values(community_id,'Intruso','https://example.org');
    raise exception 'Un miembro escribió un enlace';
  exception when insufficient_privilege then null; end;

  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  insert into public.community_profile_roles(community_id,user_id,role)
    values(community_id,admin_id,'admin');
  perform set_config('request.jwt.claim.sub',admin_id::text,true);
  update public.community_related_links set title='Proyecto actualizado'
    where community_related_links.id=published_id;
  if (select version from public.community_related_links where id=published_id)<>2 then
    raise exception 'La edición no avanzó versión';
  end if;
  begin
    update public.community_related_links set is_published=true where id=draft_id;
    raise exception 'Se publicó sin imagen';
  exception when check_violation then
    if sqlerrm='Se publicó sin imagen' then raise; end if;
  end;
  if (select count(*) from public.community_profile_revisions
      where community_profile_revisions.community_id=community_id and entity_table='community_related_links')<>3 then
    raise exception 'Falta historial de enlaces';
  end if;
  reset role;
end $$;
rollback;
