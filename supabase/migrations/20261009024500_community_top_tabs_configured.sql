-- RLS hides unpublished tab rows. Expose only whether a configuration exists,
-- so an empty visible result is not mistaken for the six default tabs.
create or replace function community_private.top_tabs_configured(target_community uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select (
    community_private.can_manage_profile(target_community, 'settings')
    or community_private.can_read_library(target_community, 'public')
  ) and exists (
    select 1 from public.community_top_tabs where community_id = target_community
  );
$$;
revoke all on function community_private.top_tabs_configured(uuid) from public;
grant execute on function community_private.top_tabs_configured(uuid) to anon, authenticated;

create or replace function public.community_top_tabs_configured(target_community uuid)
returns boolean language sql stable security invoker set search_path = '' as $$
  select community_private.top_tabs_configured(target_community);
$$;
revoke all on function public.community_top_tabs_configured(uuid) from public;
grant execute on function public.community_top_tabs_configured(uuid) to anon, authenticated;
