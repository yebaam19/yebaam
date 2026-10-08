-- Article rows now use community_private.prepare_qa_write for versioning and timestamps.
drop function if exists public.tg_community_articles_touch_updated_at();
