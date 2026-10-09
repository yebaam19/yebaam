-- Admission must be scoped to this community and completed in one transaction.
drop policy if exists "community_members insert" on public.community_members;
create policy "community_members insert" on public.community_members
  for insert to authenticated
  with check (user_id = (select auth.uid()) and role = 'MEMBER'
    and status = 'active' and exists (
      select 1 from public.communities c
      where c.id = community_members.community_id
        and (c.privacy = 'PUBLIC' or c.owner_id = (select auth.uid()))));

-- RLS on a whole UPDATE cannot keep immutable invitation columns unchanged.
revoke update, delete on public.community_invitations from anon, authenticated;
drop policy if exists "invitations update" on public.community_invitations;
drop policy if exists "invitations insert" on public.community_invitations;
create policy "invitations insert" on public.community_invitations
  for insert to authenticated
  with check (invited_by = (select auth.uid()) and status = 'pending'
    and responded_at is null
    and community_private.can_manage_profile(community_id, 'settings'));

create or replace function public.accept_community_invitation(target_community uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  invitation_row public.community_invitations;
  member_state public.community_member_status;
  target_privacy public.community_privacy;
begin
  if actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  select privacy into target_privacy from public.communities
    where id = target_community;
  if target_privacy is distinct from 'SECRET' then
    raise exception 'Secret community unavailable' using errcode = '42501';
  end if;
  select * into invitation_row from public.community_invitations
    where community_id = target_community and invitee_id = actor
      and status = 'pending'
    for update;
  if not found then
    raise exception 'Pending invitation required' using errcode = '42501';
  end if;

  insert into public.community_members(community_id, user_id, role, status)
    values (target_community, actor, 'MEMBER', 'active')
    on conflict (community_id, user_id) do nothing;
  select status into member_state from public.community_members
    where community_id = target_community and user_id = actor;
  if member_state is distinct from 'active' then
    raise exception 'Member is not active' using errcode = '23514';
  end if;

  update public.community_invitations set status = 'accepted', responded_at = now()
    where id = invitation_row.id;
  return target_community;
end;
$$;
revoke all on function public.accept_community_invitation(uuid)
  from public, anon, authenticated;
grant execute on function public.accept_community_invitation(uuid)
  to authenticated;
