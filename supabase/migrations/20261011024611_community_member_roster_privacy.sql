-- Membership is personal data. Public profiles expose the count, not the roster.
drop policy if exists "community_members select" on public.community_members;
create policy "community_members select" on public.community_members
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or community_private.can_manage_profile(community_id, 'moderation')
  );
