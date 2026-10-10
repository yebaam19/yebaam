-- These helpers are evaluated inside authenticated RLS policies.
grant execute on function public.news_can_publish(uuid, uuid) to authenticated;
grant execute on function public.news_is_platform_admin() to authenticated;
