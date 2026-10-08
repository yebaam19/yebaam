-- Match the library's active-membership and ban checks for institutional data.
drop policy if exists about_read on public.community_about;
create policy about_read on public.community_about for select to anon, authenticated
using (community_private.can_manage_profile(community_id, 'content') or (is_published
  and community_private.can_read_library(community_id, 'public')
  and exists(select 1 from public.community_sections s where s.id=community_about.id
    and s.community_id=community_about.community_id and s.kind='about' and s.is_visible)));

drop policy if exists about_section_audience on public.community_sections;
create policy about_section_audience on public.community_sections as restrictive for select to anon, authenticated
using (kind <> 'about' or community_private.can_read_library(community_id, 'public'));
