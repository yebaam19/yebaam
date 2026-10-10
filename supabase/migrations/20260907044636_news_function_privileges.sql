-- Internal policy and trigger helpers must not be callable through PostgREST.
revoke execute on function public.news_audit_article_moderation() from public, anon, authenticated;
revoke execute on function public.news_can_publish(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.news_is_platform_admin() from public, anon, authenticated;
revoke execute on function public.news_record_recommendation() from public, anon, authenticated;

-- The authenticated server action uses this RPC to authorize a city manager.
-- Anonymous callers have no reason to invoke it.
revoke execute on function public.news_is_city_manager(uuid) from public, anon;
grant execute on function public.news_is_city_manager(uuid) to authenticated;
