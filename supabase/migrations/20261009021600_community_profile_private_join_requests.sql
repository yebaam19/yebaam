-- Request submission must be possible without exposing private community rows.
create or replace function community_private.is_private_community(target_community uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.communities c
    where c.id = target_community and c.privacy = 'PRIVATE');
$$;
revoke all on function community_private.is_private_community(uuid)
  from public, anon, authenticated;
grant execute on function community_private.is_private_community(uuid)
  to authenticated;

drop policy if exists "requests insert" on public.community_join_requests;
create policy "requests insert" on public.community_join_requests
  for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending'
    and responded_at is null and responded_by is null
    and community_private.is_private_community(community_id));
