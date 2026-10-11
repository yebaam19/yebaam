-- The existing community_articles_author_id_idx covers the same author_id key.
-- Keep one index so article writes do not maintain two identical B-trees.
drop index if exists public.community_articles_author_idx;
