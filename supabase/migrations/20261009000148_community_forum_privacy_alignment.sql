-- A community can change privacy after its forum space was created. The
-- current community audience must remain the upper bound on forum reads.
create or replace function public.can_view_forum_space(p_space uuid)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare s record;
begin
  select owner_type, owner_id, visibility into s
    from public.forum_spaces where id = p_space and enabled;
  if not found then return false; end if;

  if s.owner_type = 'community' then
    if s.visibility = 'public'
      and community_private.can_read_library(s.owner_id, 'public') then
      return true;
    end if;
    if auth.uid() is null then return false; end if;
    if public.is_platform_admin()
      or community_private.can_manage_profile(s.owner_id, 'settings') then
      return true;
    end if;
    return exists (select 1 from public.community_members m
      where m.community_id = s.owner_id and m.user_id = (select auth.uid())
        and m.status = 'active');
  end if;

  if s.visibility = 'public' then return true; end if;
  if auth.uid() is null then return false; end if;
  if public.is_platform_admin() then return true; end if;
  if exists (select 1 from public.forum_roles r
    where r.space_id = p_space and r.user_id = (select auth.uid())) then
    return true;
  end if;
  return case s.owner_type
    when 'club' then exists (select 1 from public.club_members m
      where m.club_id = s.owner_id and m.user_id = (select auth.uid()))
    when 'group' then exists (select 1 from public.group_members m
      where m.group_id = s.owner_id and m.user_id = (select auth.uid()))
    when 'page' then exists (select 1 from public.page_followers f
      where f.page_id = s.owner_id and f.user_id = (select auth.uid()))
    when 'blog' then exists (select 1 from public.blog_follows f
      where f.blog_id = s.owner_id and f.user_id = (select auth.uid()))
    else false
  end;
end;
$$;

drop policy if exists forum_spaces_anon_select on public.forum_spaces;
create policy forum_spaces_anon_select on public.forum_spaces
  for select to anon using (public.can_view_forum_space(id));
drop policy if exists forum_categories_anon_select on public.forum_categories;
create policy forum_categories_anon_select on public.forum_categories
  for select to anon using (public.can_view_forum_space(space_id));
drop policy if exists forums_anon_select on public.forums;
create policy forums_anon_select on public.forums
  for select to anon using (public.can_view_forum_by_forum(id));

drop policy if exists forum_topic_redirects_select on public.forum_topic_redirects;
create policy forum_topic_redirects_select on public.forum_topic_redirects
  for select to anon, authenticated
  using (public.can_view_forum_by_topic(topic_id));

-- Only staff may change pin, lock, or forum location. Authors retain their
-- own post edits through forum_posts_update.
drop policy if exists forum_topics_update on public.forum_topics;
create policy forum_topics_update on public.forum_topics
  for update to authenticated
  using (public.has_forum_role(public.forum_space_of_forum(forum_id), array['admin','moderator']))
  with check (public.has_forum_role(public.forum_space_of_forum(forum_id), array['admin','moderator']));
