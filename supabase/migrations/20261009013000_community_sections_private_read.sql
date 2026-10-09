-- Visible navigation titles obey community privacy for every section kind.
drop policy if exists sections_read on public.community_sections;
create policy sections_read on public.community_sections for select to anon,authenticated
using (
  community_private.can_manage_profile(community_id,'plans')
  or (is_visible and community_private.can_read_library(community_id,'public'))
);
