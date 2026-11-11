-- Geographic discovery uses caller RLS and returns the cities table type for PostgREST embedding.
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.normalize_city_discovery_text(p_text text)
RETURNS text LANGUAGE sql STABLE PARALLEL SAFE SET search_path = '' AS $$
  SELECT btrim(regexp_replace(lower(extensions.unaccent('extensions.unaccent'::regdictionary,
    coalesce(p_text,''))), '[^[:alnum:]]+', ' ', 'g'));
$$;

CREATE OR REPLACE FUNCTION public.search_cities(
  p_query text DEFAULT '', p_country_code text DEFAULT NULL, p_state_id uuid DEFAULT NULL
) RETURNS SETOF public.cities
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  WITH search AS (
    SELECT public.normalize_city_discovery_text(left(coalesce(p_query,''),120)) AS q
  ), terms AS (
    SELECT q, ARRAY(SELECT token FROM unnest(string_to_array(q,' ')) AS token
      WHERE token<>'' AND token<>ALL(ARRAY['ciudad','ciudades','en','de','del','la','el','los','las','city','cities','in','the'])) AS words
    FROM search
  ), documents AS (
    SELECT c.id, public.normalize_city_discovery_text(c.name) AS city_name,
      public.normalize_city_discovery_text(co.name) AS country_name,
      public.normalize_city_discovery_text(st.name) AS state_name,
      public.normalize_city_discovery_text(concat_ws(' ',c.name,c.slug,c.department,
        st.name,co.name,co.code,
        CASE co.code WHEN 'US' THEN 'USA US EEUU EE UU United States Estados Unidos'
          WHEN 'ES' THEN 'Spain Espana España' WHEN 'BR' THEN 'Brazil Brasil' END,
        CASE c.slug WHEN 'nueva-york' THEN 'New York NYC NewYork' END)) AS document
    FROM public.cities c JOIN public.countries co ON co.id=c.country_id
      LEFT JOIN public.states st ON st.id=c.state_id
    WHERE (nullif(btrim(p_country_code),'') IS NULL OR co.code=upper(btrim(p_country_code)))
      AND (p_state_id IS NULL OR c.state_id=p_state_id)
  ), scored AS (
    SELECT d.*, t.q,
      (t.q<>'' AND NOT EXISTS (SELECT 1 FROM unnest(t.words) AS word
        WHERE strpos(d.document,word)=0)) AS direct_match,
      greatest(public.similarity(t.q,d.city_name),public.similarity(t.q,d.country_name),
        public.similarity(t.q,d.state_name)) AS similarity
    FROM documents d CROSS JOIN terms t
  )
  SELECT c.* FROM public.cities c JOIN scored s ON s.id=c.id
  WHERE btrim(coalesce(p_query,''))='' OR s.direct_match
    OR (length(s.q)>=4 AND s.similarity>=0.32
      AND NOT EXISTS (SELECT 1 FROM scored exact WHERE exact.direct_match))
  ORDER BY CASE WHEN s.q=s.city_name THEN 0 WHEN s.city_name LIKE s.q||'%' AND s.q<>'' THEN 1
      WHEN s.direct_match THEN 2 ELSE 3 END,
    CASE WHEN NOT s.direct_match AND s.q<>'' THEN s.similarity END DESC NULLS LAST,
    c.is_featured DESC,c.follower_count DESC,c.name,c.id;
$$;

REVOKE ALL ON FUNCTION public.normalize_city_discovery_text(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.search_cities(text,text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.normalize_city_discovery_text(text) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.search_cities(text,text,uuid) TO anon,authenticated;
CREATE INDEX IF NOT EXISTS cities_discovery_geo_idx ON public.cities(country_id,state_id,name,id);
COMMENT ON FUNCTION public.search_cities(text,text,uuid) IS
  'Public city discovery under caller RLS: city, region, country, accents, common aliases and typo fallback. Callers paginate results.';
NOTIFY pgrst, 'reload schema';
