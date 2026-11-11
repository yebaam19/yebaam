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

  RETURN jsonb_build_object('id', city_id, 'slug', p_slug);
END;
$$;

REVOKE ALL ON FUNCTION public.create_city_with_forum(text, text, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_city_with_forum(text, text, uuid, uuid) TO authenticated;
COMMENT ON FUNCTION public.create_city_with_forum(text, text, uuid, uuid) IS
  'Platform admins only; creates the city, forum space and four categories atomically under caller RLS.';
