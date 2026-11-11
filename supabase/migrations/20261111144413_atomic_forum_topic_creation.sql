-- A topic and its initial post are one unit. SECURITY INVOKER retains the
-- existing topic/post RLS and column grants, including private-space visibility.
CREATE OR REPLACE FUNCTION public.create_forum_topic_with_post(
  p_topic_id uuid, p_forum_id uuid, p_title text, p_slug text, p_content text
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  actor uuid := auth.uid();
  topic_slug text;
  existing public.forum_topics%ROWTYPE;
BEGIN
  IF actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF p_topic_id IS NULL OR p_forum_id IS NULL
    OR p_title IS NULL OR char_length(btrim(p_title)) NOT BETWEEN 1 AND 200
    OR p_content IS NULL OR char_length(btrim(p_content)) NOT BETWEEN 1 AND 20000
    OR p_slug IS NULL OR char_length(p_slug) > 160 OR p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN
    RAISE EXCEPTION 'Invalid topic input' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.forum_topics(id, forum_id, author_id, title, slug)
    VALUES (p_topic_id, p_forum_id, actor, btrim(p_title), p_slug)
    ON CONFLICT (id) DO NOTHING RETURNING slug INTO topic_slug;
  IF NOT FOUND THEN
    -- A lost response can be retried with the same key, never a second post.
    SELECT * INTO existing FROM public.forum_topics WHERE id = p_topic_id;
    IF NOT FOUND OR existing.author_id <> actor OR existing.forum_id <> p_forum_id
      OR existing.title <> btrim(p_title) OR NOT EXISTS (
        SELECT 1 FROM public.forum_posts WHERE topic_id = p_topic_id
          AND author_id = actor AND post_number = 1 AND content = btrim(p_content)
      ) THEN
      RAISE EXCEPTION 'Topic retry does not match original request' USING ERRCODE = '22023';
    END IF;
    RETURN jsonb_build_object('id', existing.id, 'slug', existing.slug);
  END IF;
  INSERT INTO public.forum_posts(topic_id, author_id, content)
    VALUES (p_topic_id, actor, btrim(p_content));
  RETURN jsonb_build_object('id', p_topic_id, 'slug', topic_slug);
END;
$$;
REVOKE ALL ON FUNCTION public.create_forum_topic_with_post(uuid, uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_forum_topic_with_post(uuid, uuid, text, text, text) TO authenticated;
