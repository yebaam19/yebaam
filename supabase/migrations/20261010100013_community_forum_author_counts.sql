-- Count visible forum posts in Postgres instead of transferring every post by
-- each author to the topic page. SECURITY INVOKER preserves forum_posts RLS.
create or replace function public.forum_visible_post_counts(p_author_ids uuid[])
returns table(author_id uuid, post_count bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select p.author_id, count(*)::bigint
  from public.forum_posts p
  where p.author_id = any(p_author_ids)
  group by p.author_id;
$$;

revoke all on function public.forum_visible_post_counts(uuid[]) from public;
grant execute on function public.forum_visible_post_counts(uuid[]) to anon, authenticated;
