-- Stable newest-first pagination inside one community.
create index if not exists community_posts_community_cursor_idx
  on public.community_posts (community_id, created_at desc, id desc);
