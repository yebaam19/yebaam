-- City communication provisioning is atomic and runs with caller RLS.
create unique index if not exists public_chat_city_root_unique
  on public.public_chat_topics(city_id)
  where city_id is not null and parent_topic_id is null;

create policy city_chat_admin_insert on public.public_chat_topics
  for insert to authenticated with check (
    public.is_platform_admin() and owner_type = 'city' and owner_id = city_id
    and parent_topic_id is null and is_permanent and visibility = 'public'
    and exists (select 1 from public.cities c where c.id = city_id)
  );
create policy city_chat_admin_update on public.public_chat_topics
  for update to authenticated using (
    public.is_platform_admin() and owner_type = 'city' and owner_id = city_id
    and parent_topic_id is null
  ) with check (
    public.is_platform_admin() and owner_type = 'city' and owner_id = city_id
    and parent_topic_id is null and is_permanent and visibility = 'public'
  );
grant insert, update on public.public_chat_topics to authenticated;

create or replace function public.ensure_city_communication(p_city_id uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  c public.cities%rowtype;
  sid uuid;
  tid uuid;
  cat_id uuid;
begin
  if auth.uid() is null or not public.is_platform_admin() then
    raise exception 'admin_required' using errcode = '42501';
  end if;
  select * into c from public.cities where id = p_city_id for update;
  if not found then raise exception 'city_not_found'; end if;
  select id into sid from public.forum_spaces where owner_type = 'city' and owner_id = c.id;
  if sid is null then
    insert into public.forum_spaces(owner_type,owner_id,slug,name,visibility,enabled,enabled_by)
      values ('city',c.id,'city-' || c.slug,c.name,'public',true,auth.uid()) returning id into sid;
  end if;
  if not exists(select 1 from public.forum_categories where space_id = sid) then
    insert into public.forum_categories(space_id,name,slug,position)
      values (sid,'General','city-' || c.slug || '-general',0);
  end if;
  -- A category alone cannot receive posts. Provision one board in each empty category.
  for cat_id in select id from public.forum_categories where space_id = sid loop
    if not exists(select 1 from public.forums where category_id = cat_id) then
      insert into public.forums(category_id,name,slug,position)
        select id,name,'city-board-' || id::text,0 from public.forum_categories where id = cat_id;
    end if;
  end loop;
  select id into tid from public.public_chat_topics where city_id = c.id and parent_topic_id is null;
  if tid is null then
    insert into public.public_chat_topics(slug,name,description,city_id,owner_type,owner_id,is_permanent,max_capacity,visibility,creator_id)
      values ('city-' || c.id::text,'Chat público','Sala de la comunidad de ' || c.name,c.id,'city',c.id,true,250,'public',auth.uid())
      returning id into tid;
  end if;
  return jsonb_build_object('space_id',sid,'topic_id',tid);
end;
$$;
revoke all on function public.ensure_city_communication(uuid) from public, anon;
grant execute on function public.ensure_city_communication(uuid) to authenticated;

-- Existing city spaces had categories but no posting boards. Preserve all existing boards.
insert into public.forums(category_id,name,slug,position)
select cat.id,cat.name,'city-board-' || cat.id::text,0
from public.forum_categories cat join public.forum_spaces s on s.id = cat.space_id
where s.owner_type = 'city' and not exists(select 1 from public.forums f where f.category_id = cat.id)
on conflict (slug) do nothing;

-- Provision the permanent room for existing cities; never reopen archived rooms.
insert into public.public_chat_topics(slug,name,description,city_id,owner_type,owner_id,is_permanent,max_capacity,visibility)
select 'city-' || c.id::text,'Chat público','Sala de la comunidad de ' || c.name,c.id,'city',c.id,true,250,'public'
from public.cities c where not exists (
  select 1 from public.public_chat_topics t where t.city_id = c.id and t.parent_topic_id is null
) on conflict do nothing;

-- One caller-scoped transaction: a city is ready only with its forum and categories.
CREATE OR REPLACE FUNCTION public.create_city_with_forum(
  p_name text,
  p_slug text,
  p_country_id uuid,
  p_state_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  city_id uuid;
  space_id uuid;
  space_slug text := 'city-' || p_slug;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE = '42501';
  END IF;
  IF p_name IS NULL OR length(btrim(p_name)) = 0 THEN
    RAISE EXCEPTION 'name_required' USING ERRCODE = '22023';
  END IF;
  IF p_slug IS NULL OR length(p_slug) NOT BETWEEN 2 AND 80
     OR p_slug !~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$' THEN
    RAISE EXCEPTION 'invalid_slug' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.countries WHERE id = p_country_id) THEN
    RAISE EXCEPTION 'country_required' USING ERRCODE = '22023';
  END IF;
  IF p_state_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.states s JOIN public.countries c ON c.code = s.country_code
    WHERE s.id = p_state_id AND c.id = p_country_id
  ) THEN
    RAISE EXCEPTION 'state_country_mismatch' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.cities
    (name, slug, country_id, state_id, description, history_md, economy_md, is_featured, created_by)
  VALUES (btrim(p_name), p_slug, p_country_id, p_state_id, '', '', '', false, auth.uid())
  RETURNING id INTO city_id;

  INSERT INTO public.forum_spaces
    (owner_type, owner_id, slug, name, description, visibility, enabled, enabled_by)
  VALUES ('city', city_id, space_slug, btrim(p_name),
    'Foros públicos de ' || btrim(p_name), 'public', true, auth.uid())
  RETURNING id INTO space_id;

  INSERT INTO public.forum_categories (space_id, name, slug, position) VALUES
    (space_id, 'General', space_slug || '-general', 1),
    (space_id, 'Política', space_slug || '-politica', 2),
    (space_id, 'Deportes', space_slug || '-deportes', 3),
    (space_id, 'Sociales', space_slug || '-sociales', 4);

  PERFORM public.ensure_city_communication(city_id);
  RETURN jsonb_build_object('id', city_id, 'slug', p_slug);
END;
$$;

REVOKE ALL ON FUNCTION public.create_city_with_forum(text, text, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_city_with_forum(text, text, uuid, uuid) TO authenticated;
COMMENT ON FUNCTION public.create_city_with_forum(text, text, uuid, uuid) IS
  'Platform admins only; creates the city, forum space and four categories atomically under caller RLS.';
