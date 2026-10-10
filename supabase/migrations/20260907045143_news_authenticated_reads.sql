-- Noticias is an authenticated module. Enforce that boundary in Postgres as
-- well as in the Next.js proxy so direct PostgREST calls cannot bypass it.
drop policy if exists "news sections are readable" on public.news_sections;
create policy "authenticated users read news sections"
on public.news_sections for select
using (auth.uid() is not null and (is_active or public.news_is_platform_admin()));

drop policy if exists "approved sources are readable" on public.news_sources;
create policy "authenticated users read approved sources"
on public.news_sources for select
using (auth.uid() is not null and (status = 'approved' or owner_id = auth.uid() or public.news_is_platform_admin()));

drop policy if exists "published news is readable" on public.news_articles;
create policy "authenticated users read published news"
on public.news_articles for select
using (auth.uid() is not null and (status = 'published' or author_id = auth.uid() or public.news_is_platform_admin()));

drop policy if exists "news reactions are readable" on public.news_reactions;
create policy "authenticated users read news reactions"
on public.news_reactions for select
using (auth.uid() is not null);

drop policy if exists "visible comments are readable" on public.news_comments;
create policy "authenticated users read visible comments"
on public.news_comments for select
using (auth.uid() is not null and (status = 'visible' or author_id = auth.uid() or public.news_is_platform_admin()));

drop policy if exists "approved replicas are visible with their article" on public.news_replicas;
create policy "authenticated users read approved replicas"
on public.news_replicas for select
using (auth.uid() is not null and ((status = 'approved' and exists (
  select 1 from public.news_articles a where a.id = article_id and a.status = 'published'
)) or requested_by = auth.uid() or public.news_is_platform_admin()));

drop policy if exists "active ads and slots are readable" on public.news_ad_slots;
create policy "authenticated users read active ad slots"
on public.news_ad_slots for select
using (auth.uid() is not null and (is_enabled or public.news_is_platform_admin()));

drop policy if exists "active ads are readable" on public.news_ads;
create policy "authenticated users read active ads"
on public.news_ads for select
using (auth.uid() is not null and (status = 'active' or public.news_is_platform_admin()));

drop policy if exists "settings are readable" on public.news_module_settings;
create policy "authenticated users read news settings"
on public.news_module_settings for select
using (auth.uid() is not null);
