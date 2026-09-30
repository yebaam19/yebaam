-- SYNTHETIC IN-MEMORY TEST FIXTURE ONLY. Never apply to a Supabase project.
-- A minimal dependency schema, not a production-schema clone.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth;
CREATE SCHEMA comidas;
GRANT USAGE ON SCHEMA public, auth TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA comidas TO service_role;

CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $function$
  SELECT coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$function$;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $function$
  SELECT coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$function$;

CREATE TABLE public.friendships (
  requester_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  status text NOT NULL
);
CREATE FUNCTION public.are_friends(user_a uuid, user_b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public' AS $function$
  SELECT EXISTS (
    SELECT 1 FROM friendships
    WHERE status = 'accepted'
      AND ((requester_id = user_a AND recipient_id = user_b)
        OR (requester_id = user_b AND recipient_id = user_a))
  );
$function$;
CREATE TABLE public.posts (
  id uuid PRIMARY KEY,
  author_id uuid NOT NULL,
  content text,
  background_color text,
  media_files jsonb,
  reactions_count jsonb,
  comments_count integer,
  privacy text NOT NULL,
  is_reel boolean,
  aspect_ratio text,
  created_at timestamptz,
  updated_at timestamptz,
  blog_id uuid,
  business_id uuid,
  page_id uuid
);
CREATE TABLE comidas.businesses (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL,
  profile_cf_image_id text,
  is_active boolean NOT NULL,
  deleted_at timestamptz
);
CREATE TABLE comidas.business_follows (
  user_id uuid NOT NULL,
  business_id uuid NOT NULL
);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY posts_select_visible ON public.posts FOR SELECT TO public USING (
  privacy = 'public' OR author_id = (SELECT auth.uid())
  OR (privacy = 'friends' AND public.are_friends(author_id, (SELECT auth.uid())))
);
GRANT SELECT ON public.posts TO anon, authenticated, service_role;
