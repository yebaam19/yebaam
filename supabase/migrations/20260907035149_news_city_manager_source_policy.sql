drop policy if exists "city managers manage city news sources" on public.news_sources;
create policy "city managers manage city news sources"
on public.news_sources for update
using (public.news_is_city_manager(city_id))
with check (public.news_is_city_manager(city_id));
