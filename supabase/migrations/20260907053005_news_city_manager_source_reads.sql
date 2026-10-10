drop policy if exists "city managers read city news sources" on public.news_sources;
create policy "city managers read city news sources"
on public.news_sources for select
using (public.news_is_city_manager(city_id));
