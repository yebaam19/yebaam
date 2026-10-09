-- Bounded, stable traversal of the private admission queue.
create index if not exists community_join_requests_pending_order_idx
  on public.community_join_requests (community_id, created_at, id)
  where status = 'pending';
