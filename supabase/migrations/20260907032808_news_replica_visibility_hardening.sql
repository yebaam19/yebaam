drop policy if exists "replicas are visible with their article" on public.news_replicas;
create policy "approved replicas are visible with their article" on public.news_replicas for select using ((status = 'approved' and exists (select 1 from public.news_articles a where a.id = article_id and a.status = 'published')) or requested_by = auth.uid() or public.news_is_platform_admin());
