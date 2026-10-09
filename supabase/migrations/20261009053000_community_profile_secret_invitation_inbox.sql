create index if not exists community_invitations_pending_inbox_idx
  on public.community_invitations (invitee_id, created_at desc, id desc)
  where status = 'pending';

create or replace function public.list_my_secret_community_invitations(
  before_created_at timestamptz default null,
  before_id uuid default null,
  page_limit integer default 13
)
returns table (
  id uuid,
  community_id uuid,
  community_name text,
  community_slug text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select i.id, c.id, c.name, c.slug, i.created_at
  from public.community_invitations i
  join public.communities c on c.id = i.community_id
  where auth.uid() is not null
    and i.invitee_id = auth.uid()
    and i.status = 'pending'
    and c.privacy = 'SECRET'
    and (
      before_created_at is null and before_id is null
      or before_created_at is not null and before_id is not null
        and (i.created_at, i.id) < (before_created_at, before_id)
    )
  order by i.created_at desc, i.id desc
  limit least(greatest(coalesce(page_limit, 13), 1), 13);
$$;

revoke all on function public.list_my_secret_community_invitations(timestamptz, uuid, integer) from public, anon, authenticated;
grant execute on function public.list_my_secret_community_invitations(timestamptz, uuid, integer) to authenticated;
