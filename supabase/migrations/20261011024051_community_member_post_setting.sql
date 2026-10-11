-- The composer hides itself when member posts are disabled, but direct inserts
-- must obey the same setting. Owners keep full publishing control.
drop policy if exists "community_posts insert" on public.community_posts;
create policy "community_posts insert" on public.community_posts
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.communities c
      where c.id = community_id
        and (
          c.owner_id = (select auth.uid())
          or (c.allow_member_posts and public.is_community_member(c.id, (select auth.uid())))
        )
    )
  );
