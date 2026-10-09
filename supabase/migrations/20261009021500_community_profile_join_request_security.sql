-- A requester could approve their own request, then use it to join a private
-- community. Resolve requests and membership in one transaction instead.
revoke update, delete on public.community_join_requests from anon, authenticated;
drop policy if exists "requests update" on public.community_join_requests;
drop policy if exists "requests select" on public.community_join_requests;
create policy "requests select" on public.community_join_requests
  for select to authenticated
  using (user_id = (select auth.uid())
    or community_private.can_manage_profile(community_id, 'settings'));
drop policy if exists "requests insert" on public.community_join_requests;
create policy "requests insert" on public.community_join_requests
  for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending'
    and responded_at is null and responded_by is null
    and exists (select 1 from public.communities c
      where c.id = community_id and c.privacy = 'PRIVATE'));

-- The former policy let callers supply OWNER/ADMIN as their own role.
drop policy if exists "community_members insert" on public.community_members;
create policy "community_members insert" on public.community_members
  for insert to authenticated
  with check (user_id = (select auth.uid()) and role = 'MEMBER'
    and status = 'active' and (
      exists (select 1 from public.communities c
        where c.id = community_id and (c.privacy = 'PUBLIC' or c.owner_id = (select auth.uid())))
      or public.has_pending_community_invite(community_id, (select auth.uid()))
      or exists (select 1 from public.community_join_requests r
        where r.community_id = community_id and r.user_id = (select auth.uid())
          and r.status = 'approved')));

create or replace function public.change_community_join_request(target_request uuid, decision text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  request_row public.community_join_requests;
  member_status public.community_member_status;
begin
  if actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if decision is null or decision not in ('approved', 'declined', 'cancelled') then
    raise exception 'Invalid decision' using errcode = '23514';
  end if;

  select * into request_row from public.community_join_requests
    where id = target_request for update;
  if not found or request_row.status <> 'pending' then
    raise exception 'Pending request unavailable' using errcode = '23514';
  end if;
  if decision = 'cancelled' then
    if request_row.user_id <> actor then
      raise exception 'Not allowed' using errcode = '42501';
    end if;
  elsif not community_private.can_manage_profile(request_row.community_id, 'settings') then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  if decision = 'approved' then
    insert into public.community_members(community_id, user_id, role, status)
      values (request_row.community_id, request_row.user_id, 'MEMBER', 'active')
      on conflict (community_id, user_id) do nothing;
    select status into member_status from public.community_members
      where community_id = request_row.community_id and user_id = request_row.user_id;
    if member_status is distinct from 'active' then
      raise exception 'Member is not active' using errcode = '23514';
    end if;
  end if;

  update public.community_join_requests set status = decision,
    responded_at = now(), responded_by = case when decision = 'cancelled' then null else actor end
    where id = target_request;
  return request_row.community_id;
end;
$$;
revoke all on function public.change_community_join_request(uuid, text)
  from public, anon, authenticated;
grant execute on function public.change_community_join_request(uuid, text)
  to authenticated;
