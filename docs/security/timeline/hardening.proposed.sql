-- Original review proposal. The same body is deployed via the tracked migration.
-- Retained unchanged below for the synthetic baseline and strict-guard tests.
-- Changes only this function. Keeps its identity, return contract, owner and ACL.
BEGIN;
DO $review_guard$
BEGIN
  IF md5(pg_get_functiondef('public.get_timeline_posts(uuid,integer,integer)'::regprocedure))
      IS DISTINCT FROM '88de1ed97716eeaef69c1f99c87720ec' THEN
    RAISE EXCEPTION 'Timeline definition changed since review; stop and reconcile before deployment';
  END IF;
END;
$review_guard$;

CREATE OR REPLACE FUNCTION public.get_timeline_posts(p_user_id uuid, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, author_id uuid, content text, background_color text, media_files jsonb, reactions_count jsonb, comments_count integer, privacy text, is_reel boolean, aspect_ratio text, created_at timestamp with time zone, updated_at timestamp with time zone, blog_id uuid, business_id uuid, business_name text, business_slug text, business_cf_image_id text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'comidas'
AS $function$
  WITH
  request_context AS MATERIALIZED (
    SELECT auth.uid() AS actor_id, auth.role() AS request_role
  ),
  friend_ids AS (
    SELECT
      CASE
        WHEN requester_id = p_user_id THEN recipient_id
        ELSE requester_id
      END AS uid
    FROM public.friendships
    WHERE status = 'accepted'
      AND (requester_id = p_user_id OR recipient_id = p_user_id)
  ),
  followed_biz AS (
    SELECT business_id
    FROM comidas.business_follows
    WHERE user_id = p_user_id
  ),
  friend_posts AS (
    SELECT
      p.id, p.author_id, p.content, p.background_color,
      p.media_files, p.reactions_count, p.comments_count,
      p.privacy, p.is_reel, p.aspect_ratio, p.created_at, p.updated_at,
      p.blog_id, p.business_id,
      NULL::text AS business_name,
      NULL::text AS business_slug,
      NULL::text AS business_cf_image_id
    FROM public.posts p
    WHERE p.blog_id     IS NULL
      AND p.business_id IS NULL
      AND p.page_id     IS NULL
      AND (
        p.author_id = p_user_id
        OR (
          p.author_id IN (SELECT uid FROM friend_ids)
          AND p.privacy IN ('public', 'friends')
        )
      )
  ),
  biz_posts_ranked AS (
    SELECT
      p.id, p.author_id, p.content, p.background_color,
      p.media_files, p.reactions_count, p.comments_count,
      p.privacy, p.is_reel, p.aspect_ratio, p.created_at, p.updated_at,
      p.blog_id, p.business_id,
      b.name                AS business_name,
      b.slug                AS business_slug,
      b.profile_cf_image_id AS business_cf_image_id,
      ROW_NUMBER() OVER (
        PARTITION BY p.business_id
        ORDER BY p.created_at DESC, p.id DESC
      ) AS rn
    FROM public.posts p
    JOIN comidas.businesses b ON b.id = p.business_id
    WHERE p.business_id IN (SELECT business_id FROM followed_biz)
      AND p.blog_id     IS NULL
      AND p.page_id     IS NULL
      AND b.is_active   = true
      AND b.deleted_at  IS NULL
      AND (
        (SELECT request_role FROM request_context) = 'service_role'
        OR p.privacy = 'public'
        OR p.author_id = (SELECT actor_id FROM request_context)
        OR (
          p.privacy = 'friends'
          AND public.are_friends(
            p.author_id, (SELECT actor_id FROM request_context)
          )
        )
      )
  ),
  biz_posts AS (
    SELECT
      id, author_id, content, background_color,
      media_files, reactions_count, comments_count, privacy,
      is_reel, aspect_ratio, created_at, updated_at,
      blog_id, business_id, business_name, business_slug, business_cf_image_id
    FROM biz_posts_ranked
    WHERE rn <= 3
  )
  SELECT
    id, author_id, content, background_color,
    media_files, reactions_count, comments_count, privacy,
    is_reel, aspect_ratio, created_at, updated_at,
    blog_id, business_id, business_name, business_slug, business_cf_image_id
  FROM (
    SELECT * FROM friend_posts
    UNION ALL
    SELECT * FROM biz_posts
  ) combined
  CROSS JOIN request_context ctx
  WHERE (
    (ctx.actor_id IS NOT NULL AND p_user_id = ctx.actor_id)
    OR ctx.request_role = 'service_role'
  )
  AND (
    ctx.request_role = 'service_role'
    OR combined.privacy = 'public'
    OR combined.author_id = ctx.actor_id
    OR (
      combined.privacy = 'friends'
      AND public.are_friends(combined.author_id, ctx.actor_id)
    )
  )
  ORDER BY created_at DESC, id DESC
  LIMIT  LEAST(GREATEST(COALESCE(p_limit, 20), 0), 100)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$function$;

COMMIT;
