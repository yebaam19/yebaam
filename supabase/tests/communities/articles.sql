begin;
do $$
declare people uuid[]; owner_id uuid; reader_id uuid; editor_id uuid;
  community_id uuid:=gen_random_uuid(); article_id uuid:=gen_random_uuid(); other_id uuid:=gen_random_uuid();
  response jsonb; current_version integer;
  draft jsonb:=jsonb_build_object('title','Prueba de borrador','content','<p>Una idea todavía privada.</p>',
    'summary','Vista privada','category','Noticias','tags',jsonb_build_array('comunidad'),'isPublished',false);
  published jsonb:=jsonb_build_object('title','Prueba de borrador','content','<p>Este artículo ya tiene suficiente contenido para publicarse.</p>',
    'summary','Vista pública','category','Noticias','tags',jsonb_build_array('comunidad'),'isPublished',true);
begin
  select array_agg(id) into people from (select p.id from public.profiles p join auth.users u on u.id=p.id order by p.id limit 3) people;
  if cardinality(people)<3 then raise exception 'Se requieren tres perfiles'; end if;
  owner_id:=people[1]; reader_id:=people[2]; editor_id:=people[3];
  insert into public.communities(id,owner_id,name,slug,privacy)
    values(community_id,owner_id,'Artículos rollback','articles-rollback-'||community_id,'PUBLIC');
  insert into public.community_members(community_id,user_id,role,status)
    values(community_id,editor_id,'MEMBER','active');
  insert into public.community_profile_roles(community_id,user_id,role)
    values(community_id,editor_id,'editor');
  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  set local role authenticated;
  response:=public.save_community_article(community_id,article_id,0,draft);
  if (response->>'version')::integer<>1 then raise exception 'Versión inicial incorrecta'; end if;
  if (select is_published or published_at is not null from public.community_articles where id=article_id) then
    raise exception 'Borrador publicado'; end if;
  response:=public.save_community_article(community_id,article_id,0,draft);
  if (response->>'version')::integer<>1 then raise exception 'Reintento duplicó la escritura'; end if;
  begin
    insert into public.community_articles(id,community_id,author_id,slug,title,content)
      values(other_id,community_id,owner_id,'falso','Falso','<p>Falso</p>');
    raise exception 'Escritura directa permitida';
  exception when insufficient_privilege then null; end;
  begin
    perform public.save_community_article(community_id,other_id,0,draft || jsonb_build_object('coverAssetId',gen_random_uuid()));
    raise exception 'Portada fuera de biblioteca aceptada';
  exception when check_violation then null; end;
  begin
    perform public.save_community_article(community_id,other_id,0,draft || jsonb_build_object('content','<img src="https://x.test/x.png">'));
    raise exception 'Imagen HTML directa aceptada';
  exception when check_violation then null; end;
  set local role anon; perform set_config('request.jwt.claim.sub','',true);
  if exists(select 1 from public.community_articles where id=article_id) then raise exception 'Borrador visible anónimamente'; end if;
  set local role authenticated; perform set_config('request.jwt.claim.sub',reader_id::text,true);
  if exists(select 1 from public.community_articles where id=article_id) then raise exception 'Borrador visible al lector'; end if;
  begin
    perform public.save_community_article(community_id,other_id,0,draft);
    raise exception 'Lector escribió artículo';
  exception when insufficient_privilege then null; end;
  perform set_config('request.jwt.claim.sub',editor_id::text,true);
  if not exists(select 1 from public.community_articles where id=article_id) then raise exception 'Editor no ve borrador'; end if;
  response:=public.save_community_article(community_id,article_id,1,published);
  if (response->>'version')::integer<>2 then raise exception 'Publicación no incrementó versión'; end if;
  if not (select is_published and published_at is not null from public.community_articles where id=article_id) then
    raise exception 'No se guardó la publicación'; end if;
  begin
    perform public.save_community_article(community_id,article_id,1,published || jsonb_build_object('title','Versión antigua'));
    raise exception 'Versión obsoleta sobrescribió el artículo';
  exception when serialization_failure then null; end;
  begin
    perform public.change_community_article(community_id,article_id,2,'hide','Motivo',true);
    raise exception 'Editor moderó sin permiso';
  exception when insufficient_privilege then null; end;
  set local role anon; perform set_config('request.jwt.claim.sub','',true);
  if not exists(select 1 from public.community_articles where id=article_id) then raise exception 'Artículo publicado invisible'; end if;
  set local role authenticated; perform set_config('request.jwt.claim.sub',owner_id::text,true);
  begin
    perform public.change_community_article(community_id,article_id,2,'hide','',true);
    raise exception 'Moderación sin motivo';
  exception when check_violation then null; end;
  response:=public.change_community_article(community_id,article_id,2,'hide','Incumple las reglas',true);
  current_version:=(response->>'version')::integer;
  set local role anon; perform set_config('request.jwt.claim.sub','',true);
  if exists(select 1 from public.community_articles where id=article_id) then raise exception 'Artículo oculto visible'; end if;
  set local role authenticated; perform set_config('request.jwt.claim.sub',owner_id::text,true);
  response:=public.change_community_article(community_id,article_id,current_version,'restore');
  current_version:=(response->>'version')::integer;
  response:=public.change_community_article(community_id,article_id,current_version,'archive','',true);
  set local role anon; perform set_config('request.jwt.claim.sub','',true);
  if exists(select 1 from public.community_articles where id=article_id) then raise exception 'Artículo archivado visible'; end if;
  reset role;
  if not exists(select 1 from public.community_profile_revisions where entity_id=article_id and actor_id=owner_id) then
    raise exception 'Falta auditoría'; end if;
  if has_table_privilege('authenticated','public.community_articles','INSERT,UPDATE,DELETE') then
    raise exception 'Permisos de escritura directa activos'; end if;
end $$;
rollback;
