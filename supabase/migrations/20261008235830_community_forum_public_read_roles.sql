-- Public forum threads are readable without a session; private and secret
-- spaces still pass through the existing space-visibility helper.
drop policy if exists forum_topics_anon_select on public.forum_topics;
create policy forum_topics_anon_select on public.forum_topics
  for select to anon using (public.can_view_forum_by_forum(forum_id));

drop policy if exists forum_posts_anon_select on public.forum_posts;
create policy forum_posts_anon_select on public.forum_posts
  for select to anon using (public.can_view_forum_by_topic(topic_id));

-- The community role is authoritative for community-owned forum moderation.
-- A departed member loses the role through can_manage_profile immediately.
create or replace function public.has_forum_role(p_space uuid, p_roles text[])
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and (
    exists (
      select 1 from public.forum_roles r
      where r.space_id = p_space and r.user_id = (select auth.uid())
        and r.role = any(p_roles)
    )
    or exists (
      select 1 from public.forum_spaces s
      where s.id = p_space and s.owner_type = 'community' and s.enabled
        and (
          ('admin' = any(p_roles)
            and community_private.can_manage_profile(s.owner_id, 'settings'))
          or ('moderator' = any(p_roles)
            and community_private.can_manage_profile(s.owner_id, 'moderation'))
        )
    )
    or public.is_platform_admin()
  );
$$;
revoke all on function public.has_forum_role(uuid, text[]) from public;
grant execute on function public.has_forum_role(uuid, text[]) to authenticated, service_role;
