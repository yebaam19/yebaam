-- Read-only checks on existing authors; never emits post content or changes rows.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
DO $verify$
DECLARE
  actors uuid[];
  actor uuid;
  other_actor uuid;
  n integer;
  first_ids uuid[];
  second_ids uuid[];
  all_ids uuid[];
BEGIN
  SELECT array_agg(author_id) INTO actors FROM (
    SELECT DISTINCT author_id FROM public.posts
    WHERE author_id IS NOT NULL AND blog_id IS NULL
      AND page_id IS NULL AND business_id IS NULL LIMIT 3
  ) a;
  IF coalesce(array_length(actors, 1), 0) < 2 THEN
    RAISE EXCEPTION 'Need two existing personal-post authors for identity checks';
  END IF;
  FOREACH actor IN ARRAY actors LOOP
    SELECT x INTO other_actor FROM unnest(actors) x WHERE x <> actor LIMIT 1;
    PERFORM set_config('request.jwt.claim.sub', '', true);
    PERFORM set_config('request.jwt.claim.role', '', true);
    PERFORM set_config('request.jwt.claims', '{"role":"anon"}', true);
    EXECUTE 'SET LOCAL ROLE anon';
    SELECT count(*) INTO n FROM public.get_timeline_posts(actor, 20, 0);
    IF n <> 0 THEN RAISE EXCEPTION 'Anonymous timeline exposure'; END IF;
    EXECUTE 'RESET ROLE';
    PERFORM set_config('request.jwt.claims',
      jsonb_build_object('role', 'authenticated', 'sub', actor)::text, true);
    EXECUTE 'SET LOCAL ROLE authenticated';
    SELECT count(*) INTO n FROM public.get_timeline_posts(actor, 100, 0);
    IF n = 0 THEN RAISE EXCEPTION 'Owner timeline unexpectedly empty'; END IF;
    SELECT count(*) INTO n FROM public.get_timeline_posts(other_actor, 20, 0);
    IF n <> 0 THEN RAISE EXCEPTION 'Cross-identity timeline exposure'; END IF;
    SELECT count(*) INTO n FROM public.get_timeline_posts(NULL, 20, 0);
    IF n <> 0 THEN RAISE EXCEPTION 'Null identity timeline exposure'; END IF;
    SELECT count(*) INTO n FROM public.get_timeline_posts(actor, 100, 0) t
      LEFT JOIN public.posts p ON p.id = t.id
      WHERE p.id IS NULL OR p.page_id IS NOT NULL OR p.blog_id IS NOT NULL;
    IF n <> 0 THEN RAISE EXCEPTION 'Hidden/wall rows in timeline'; END IF;
    SELECT array_agg(id ORDER BY created_at DESC, id DESC) INTO first_ids
      FROM public.get_timeline_posts(actor, 10, 0);
    SELECT array_agg(id ORDER BY created_at DESC, id DESC) INTO second_ids
      FROM public.get_timeline_posts(actor, 10, 10);
    SELECT array_agg(id ORDER BY created_at DESC, id DESC) INTO all_ids
      FROM public.get_timeline_posts(actor, 20, 0);
    IF coalesce(first_ids, '{}'::uuid[]) || coalesce(second_ids, '{}'::uuid[])
        IS DISTINCT FROM coalesce(all_ids, '{}'::uuid[]) THEN
      RAISE EXCEPTION 'Pagination mismatch';
    END IF;
    EXECUTE 'RESET ROLE';
    PERFORM set_config('request.jwt.claims', '{"role":"authenticated"}', true);
    EXECUTE 'SET LOCAL ROLE authenticated';
    SELECT count(*) INTO n FROM public.get_timeline_posts(actor, 20, 0);
    IF n <> 0 THEN RAISE EXCEPTION 'Missing subject exposure'; END IF;
    EXECUTE 'RESET ROLE';
  END LOOP;
END;
$verify$;
ROLLBACK;
