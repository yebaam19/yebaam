-- RLS uses these helpers with auth.uid(), but they are also callable as RPCs.
-- Bind private answers to the caller so an arbitrary UUID cannot reveal another
-- person's membership, admin role, or pending invitation.

create or replace function public.has_pending_community_invite(
  p_community_id uuid, p_user_id uuid
)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(p_user_id = (select auth.uid()), false) and exists (
    select 1 from public.community_invitations
    where community_id = p_community_id
      and invitee_id = p_user_id
      and status = 'pending'
  );
$$;

create or replace function public.is_community_admin(
  p_community_id uuid, p_user_id uuid
)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(p_user_id = (select auth.uid()), false) and (
    exists (
      select 1 from public.communities c
      where c.id = p_community_id and c.owner_id = p_user_id
    ) or exists (
      select 1 from public.community_members m
      where m.community_id = p_community_id
        and m.user_id = p_user_id
        and m.role in ('OWNER', 'ADMIN', 'MODERATOR')
        and m.status = 'active'
    )
  );
$$;

create or replace function public.is_community_member(
  p_community_id uuid, p_user_id uuid
)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(p_user_id = (select auth.uid()), false) and exists (
    select 1 from public.community_members
    where community_id = p_community_id
      and user_id = p_user_id
      and status = 'active'
  );
$$;

create or replace function public.is_community_visible(
  p_community_id uuid, p_user_id uuid
)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.communities c
    where c.id = p_community_id
      and (
        c.privacy = 'PUBLIC'
        or (
          p_user_id = (select auth.uid())
          and (
            c.owner_id = p_user_id
            or public.is_community_member(c.id, p_user_id)
          )
        )
      )
  );
$$;
